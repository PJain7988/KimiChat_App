import React, { useState, useEffect, useCallback, useMemo } from 'react';
import useAuthStore from '../../context/authStore';
import useChatStore from '../../context/chatStore';
import { getSocket } from '../../utils/socket';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import Avatar from '../ui/Avatar';
import toast from 'react-hot-toast';

/**
 * FriendsPanel Component - Friends management interface
 * ✅ Fixed: Error handling, accessibility, proper cleanup, search optimization
 */
export default function FriendsPanel({ onStartCall }) {
  const { user, setUser } = useAuthStore();
  const { openDirectChat } = useChatStore();
  const navigate = useNavigate();

  const [tab, setTab] = useState('list');
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [randomUsers, setRandomUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // ✅ FIX: Fetch friends with error handling
  const fetchFriends = useCallback(async () => {
    try {
      const res = await api.get('/friends');
      setFriends(Array.isArray(res.data?.friends) ? res.data.friends : []);
    } catch (error) {
      console.error('Failed to fetch friends:', error);
      toast.error('Failed to load friends');
      setFriends([]);
    }
  }, []);

  // ✅ FIX: Fetch requests with error handling
  const fetchRequests = useCallback(async () => {
    try {
      const res = await api.get('/friends/requests');
      setRequests(Array.isArray(res.data?.requests) ? res.data.requests : []);
    } catch (error) {
      console.error('Failed to fetch requests:', error);
      setRequests([]);
    }
  }, []);

  // ✅ FIX: Fetch random with error handling
  const fetchRandom = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/users/random');
      setRandomUsers(Array.isArray(res.data?.users) ? res.data.users : []);
    } catch (error) {
      console.error('Failed to fetch random users:', error);
      setRandomUsers([]);
      toast.error('Failed to load suggestions');
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ FIX: Debounced search
  const handleSearch = useCallback(async (query) => {
    setSearchQuery(query);
    
    if (!query?.trim()) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const res = await api.get(`/users/search?q=${encodeURIComponent(query)}`);
      setSearchResults(Array.isArray(res.data?.users) ? res.data.users : []);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  // ✅ FIX: Send friend request with proper error handling
  const sendRequest = useCallback(async (userId, userName) => {
    if (!userId) {
      toast.error('Invalid user');
      return;
    }

    try {
      await api.post(`/friends/request/${userId}`);
      const socket = getSocket();
      if (socket) socket.emit('friend:request', { targetUserId: userId });
      toast.success(`Request sent to ${userName}!`);
      setRandomUsers(prev => prev.filter(u => u._id !== userId));
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to send request';
      toast.error(message);
      console.error('Send request error:', error);
    }
  }, []);

  // ✅ FIX: Accept request with proper error handling
  const acceptRequest = useCallback(async (fromId, fromName) => {
    if (!fromId) {
      toast.error('Invalid request');
      return;
    }

    try {
      await api.post(`/friends/accept/${fromId}`);
      const socket = getSocket();
      if (socket) socket.emit('friend:accepted', { targetUserId: fromId });
      toast.success(`You are now friends with ${fromName}!`);
      setRequests(prev => prev.filter(r => r.from?._id !== fromId));
      await fetchFriends();
      
      // ✅ Dynamic update: Add friend to local user state for accurate stats
      if (user) {
        setUser({
          ...user,
          friends: [...(user.friends || []), fromId]
        });
      }
    } catch (error) {
      toast.error('Failed to accept request');
      console.error('Accept error:', error);
    }
  }, [fetchFriends]);

  // ✅ FIX: Reject request with proper error handling
  const rejectRequest = useCallback(async (fromId) => {
    if (!fromId) {
      toast.error('Invalid request');
      return;
    }

    try {
      await api.delete(`/friends/request/${fromId}`);
      setRequests(prev => prev.filter(r => r.from?._id !== fromId));
      toast.success('Request rejected');
    } catch (error) {
      toast.error('Failed to reject request');
      console.error('Reject error:', error);
    }
  }, []);

  // ✅ FIX: Message user with error handling
  const messageUser = useCallback(async (userId) => {
    if (!userId) {
      toast.error('Invalid user');
      return;
    }

    try {
      const chat = await openDirectChat(userId);
      if (chat) {
        navigate('/app/chats');
      }
    } catch (error) {
      toast.error('Failed to open chat');
      console.error('Message error:', error);
    }
  }, [openDirectChat, navigate]);

  // ✅ FIX: Initialize data and setup socket listeners
  useEffect(() => {
    fetchFriends();
    fetchRequests();
    fetchRandom();

    const socket = getSocket();
    if (!socket) return;

    const handleFriendRequest = ({ from }) => {
      if (from?.name) {
        toast(`👥 ${from.name} sent you a friend request!`);
        fetchRequests();
      }
    };

    const handleFriendAccepted = ({ by }) => {
      if (by?.name) {
        toast.success(`🎉 ${by.name} accepted your friend request!`);
        fetchFriends();
      }
    };

    socket.on('friend:request', handleFriendRequest);
    socket.on('friend:accepted', handleFriendAccepted);

    return () => {
      socket.off('friend:request', handleFriendRequest);
      socket.off('friend:accepted', handleFriendAccepted);
    };
  }, [fetchFriends, fetchRequests, fetchRandom]);

  // ✅ FIX: Memoized filtered friends
  const filteredFriends = useMemo(() => {
    if (!searchQuery?.trim()) return friends;
    const query = searchQuery.toLowerCase();
    return friends.filter(f => 
      f?.name?.toLowerCase().includes(query) || 
      f?.username?.toLowerCase().includes(query)
    );
  }, [friends, searchQuery]);

  if (!user) {
    return (
      <div style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-dim)'
      }}>
        Loading...
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      height: '100%',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        padding: '20px 24px 0',
        background: 'var(--bg-card)',
        borderBottom: '1px solid var(--border2)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16
        }}>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 22,
            fontWeight: 700,
            margin: 0
          }}>
            Friends
          </h1>
          <button
            onClick={() => setTab('add')}
            aria-label="Add friend"
            style={{
              padding: '8px 18px',
              background: 'linear-gradient(90deg, var(--teal), var(--blue))',
              border: 'none',
              borderRadius: 10,
              color: '#fff',
              fontFamily: 'var(--font-display)',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
            + Add Friend
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 10 }}>
          {[
            { key: 'list', label: 'Friends', count: friends.length },
            { key: 'requests', label: 'Requests', count: requests.length },
            { key: 'random', label: '🎲 Discover', count: null },
          ].map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              aria-current={tab === key ? 'page' : undefined}
              aria-label={label + (count !== null && count > 0 ? `, ${count} items` : '')}
              style={{
                padding: '10px 20px',
                borderRadius: '12px 12px 0 0',
                fontWeight: 600,
                fontSize: 14,
                cursor: 'pointer',
                border: 'none',
                transition: 'all 0.2s',
                background: tab === key ? 'var(--bg-dark)' : 'transparent',
                color: tab === key ? 'var(--teal)' : 'var(--text-dim)',
                borderBottom: tab === key ? '2px solid var(--teal)' : '2px solid transparent'
              }}>
              {label}
              {count !== null && count > 0 && (
                <span style={{
                  marginLeft: 6,
                  background: key === 'requests' ? 'var(--pink, #ff4fa3)' : 'var(--teal, #00c9b1)',
                  color: '#fff',
                  borderRadius: 10,
                  padding: '1px 7px',
                  fontSize: 11
                }}>
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        background: 'var(--bg-dark)'
      }}>

        {/* Friends List */}
        {tab === 'list' && (
          <div style={{
            maxWidth: 700,
            margin: '0 auto',
            padding: '20px 24px'
          }}>
            <div style={{ position: 'relative', marginBottom: 20 }}>
              <span style={{
                position: 'absolute',
                left: 14,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-dim)',
                pointerEvents: 'none'
              }}>
                🔍
              </span>
              <input
                value={searchQuery}
                onChange={e => handleSearch(e.target.value)}
                placeholder="Search friends…"
                aria-label="Search friends"
                style={{
                  width: '100%',
                  background: 'var(--bg-card2)',
                  border: '1.5px solid var(--border2)',
                  borderRadius: 14,
                  padding: '12px 14px 12px 40px',
                  color: 'var(--text)',
                  fontSize: 14,
                  outline: 'none',
                  fontFamily: 'var(--font-body)',
                  transition: 'border 0.2s'
                }}
                onFocus={e => e.target.style.borderColor = 'var(--teal)'}
                onBlur={e => e.target.style.borderColor = 'var(--border2)'}
              />
            </div>

            {filteredFriends.length > 0 ? (
              filteredFriends.map(friend => (
                <FriendCard
                  key={friend._id}
                  user={friend}
                  actions={[
                    {
                      icon: '💬',
                      label: 'Message',
                      color: 'rgba(26,140,255,.15)',
                      textColor: 'var(--blue)',
                      onClick: () => messageUser(friend._id)
                    },
                    {
                      icon: '📞',
                      label: 'Call',
                      color: 'rgba(0,201,177,.15)',
                      textColor: 'var(--teal)',
                      onClick: () => onStartCall?.(friend, 'audio')
                    },
                    {
                      icon: '📹',
                      label: 'Video',
                      color: 'rgba(124,92,252,.15)',
                      textColor: 'var(--purple)',
                      onClick: () => onStartCall?.(friend, 'video')
                    },
                  ]}
                />
              ))
            ) : (
              <EmptyState
                icon="👥"
                title={searchQuery ? 'No friends found' : 'No friends yet'}
                subtitle={searchQuery ? `No results for "${searchQuery}"` : 'Discover people in the Discover tab!'}
              />
            )}
          </div>
        )}

        {/* Requests Tab */}
        {tab === 'requests' && (
          <div style={{
            maxWidth: 700,
            margin: '0 auto',
            padding: '20px 24px'
          }}>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 16,
              fontWeight: 700,
              marginBottom: 16,
              color: 'var(--text-dim)',
              margin: 0
            }}>
              Pending Requests ({requests.length})
            </h2>

            {requests.length > 0 ? (
              requests.map(request => {
                if (!request?.from) return null;
                return (
                  <FriendCard
                    key={request.from._id}
                    user={request.from}
                    subtitle={`Sent ${formatAgo(request.sentAt)}`}
                    actions={[
                      {
                        icon: '✓ Accept',
                        label: '',
                        color: 'rgba(0,201,177,.15)',
                        textColor: 'var(--teal)',
                        fontSize: 14,
                        onClick: () => acceptRequest(request.from._id, request.from.name)
                      },
                      {
                        icon: '✕ Reject',
                        label: '',
                        color: 'rgba(255,68,68,.1)',
                        textColor: 'var(--red, #ff4444)',
                        fontSize: 14,
                        onClick: () => rejectRequest(request.from._id)
                      },
                    ]}
                  />
                );
              })
            ) : (
              <EmptyState
                icon="📭"
                title="No pending requests"
                subtitle="Share your profile link to get friend requests"
              />
            )}
          </div>
        )}

        {/* Random/Discover Tab */}
        {tab === 'random' && (
          <div style={{
            maxWidth: 700,
            margin: '0 auto',
            padding: '20px 24px'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, rgba(0,201,177,.1), rgba(26,140,255,.1))',
              border: '1px solid var(--border)',
              borderRadius: 16,
              padding: 20,
              marginBottom: 24,
              textAlign: 'center'
            }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🎲</div>
              <h2 style={{
                fontFamily: 'var(--font-display)',
                fontSize: 18,
                fontWeight: 700,
                marginBottom: 6,
                margin: 0
              }}>
                Random Friend Finder
              </h2>
              <p style={{
                fontSize: 13,
                color: 'var(--text-dim)',
                marginBottom: 16,
                margin: '6px 0 16px 0'
              }}>
                Discover and connect with new people automatically
              </p>
              <button
                onClick={fetchRandom}
                disabled={loading}
                aria-label="Refresh suggestions"
                style={{
                  padding: '11px 28px',
                  background: loading ? 'var(--text-dim)' : 'linear-gradient(90deg, var(--teal), var(--blue))',
                  border: 'none',
                  borderRadius: 12,
                  color: '#fff',
                  fontFamily: 'var(--font-display)',
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                  transition: 'all 0.2s'
                }}>
                {loading ? '⏳ Loading...' : '🔄 Refresh Suggestions'}
              </button>
            </div>

            {randomUsers.length > 0 ? (
              randomUsers.map(user => (
                <FriendCard
                  key={user._id}
                  user={user}
                  actions={[
                    {
                      icon: '💬',
                      label: 'Message',
                      color: 'rgba(26,140,255,.15)',
                      textColor: 'var(--blue)',
                      onClick: () => messageUser(user._id)
                    },
                    {
                      icon: '+ Connect',
                      label: '',
                      color: 'linear-gradient(90deg, var(--teal), var(--blue))',
                      textColor: '#fff',
                      fontSize: 13,
                      onClick: () => sendRequest(user._id, user.name)
                    },
                  ]}
                />
              ))
            ) : (
              <EmptyState
                icon="🌍"
                title="No new suggestions"
                subtitle="We've shown you everyone available! Try searching for a specific KimiChat ID or username in the Add Friend tab."
              />
            )}
          </div>
        )}

        {/* Add Friends Tab */}
        {tab === 'add' && (
          <div style={{
            maxWidth: 600,
            margin: '0 auto',
            padding: '24px'
          }}>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 18,
              fontWeight: 700,
              marginBottom: 20,
              margin: 0
            }}>
              Find People
            </h2>

            <div style={{ position: 'relative', marginBottom: 20 }}>
              <span style={{
                position: 'absolute',
                left: 14,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-dim)',
                pointerEvents: 'none'
              }}>
                🔍
              </span>
              <input
                value={searchQuery}
                onChange={e => handleSearch(e.target.value)}
                placeholder="Search by name, @username or KimiChat ID…"
                aria-label="Search users"
                style={{
                  width: '100%',
                  background: 'var(--bg-card2)',
                  border: '1.5px solid var(--border2)',
                  borderRadius: 14,
                  padding: '14px 14px 14px 42px',
                  color: 'var(--text)',
                  fontSize: 14,
                  outline: 'none',
                  fontFamily: 'var(--font-body)',
                  transition: 'border 0.2s'
                }}
                onFocus={e => e.target.style.borderColor = 'var(--teal)'}
                onBlur={e => e.target.style.borderColor = 'var(--border2)'}
              />
              {searchLoading && (
                <span style={{
                  position: 'absolute',
                  right: 14,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: 14
                }}>
                  ⏳
                </span>
              )}
            </div>

            {searchResults.length > 0 ? (
              searchResults.map(searchUser => (
                <FriendCard
                  key={searchUser._id}
                  user={searchUser}
                  actions={[
                    {
                      icon: '+ Add',
                      label: '',
                      color: 'linear-gradient(90deg, var(--teal), var(--blue))',
                      textColor: '#fff',
                      fontSize: 13,
                      onClick: () => sendRequest(searchUser._id, searchUser.name)
                    },
                  ]}
                />
              ))
            ) : (
              searchQuery && (
                <EmptyState
                  icon="🔍"
                  title="No users found"
                  subtitle={`No results for "${searchQuery}"`}
                />
              )
            )}

            {/* Share Profile */}
            <div style={{
              marginTop: 24,
              background: 'var(--bg-card2)',
              borderRadius: 16,
              padding: 20,
              border: '1px solid var(--border2)'
            }}>
              <h3 style={{
                fontFamily: 'var(--font-display)',
                fontSize: 15,
                fontWeight: 700,
                marginBottom: 10,
                margin: 0
              }}>
                Share Your Profile
              </h3>
              <div style={{ display: 'flex', gap: 10 }}>
                <input
                  readOnly
                  value={`kimichat.app/u/${user?.username || 'me'}`}
                  style={{
                    flex: 1,
                    background: 'rgba(255,255,255,.05)',
                    border: '1px solid var(--border2)',
                    borderRadius: 10,
                    padding: '10px 14px',
                    color: 'var(--text-dim)',
                    fontSize: 13,
                    outline: 'none',
                    fontFamily: 'var(--font-body)'
                  }}
                  aria-label="Profile link"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`kimichat.app/u/${user?.username}`);
                    toast.success('Copied!');
                  }}
                  aria-label="Copy profile link"
                  style={{
                    padding: '10px 16px',
                    background: 'var(--teal)',
                    border: 'none',
                    borderRadius: 10,
                    color: '#000',
                    fontWeight: 600,
                    fontSize: 13,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                  Copy
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * FriendCard Component
 * ✅ Fixed: Proper prop handling, accessibility
 */
function FriendCard({ user, subtitle, actions }) {
  if (!user) return null;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '14px 16px',
        background: 'var(--bg-card2)',
        borderRadius: 16,
        marginBottom: 10,
        border: '1px solid var(--border2)',
        transition: 'border 0.2s'
      }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border2)'}>

      <Avatar
        name={user.name}
        src={user.avatar}
        size={48}
        online={user.isOnline}
        alt={user.name}
      />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text)' }}>
          {user.name}
        </div>
        <div style={{
          fontSize: 12,
          color: 'var(--text-dim)',
          marginTop: 2,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {subtitle || user.bio || `@${user.username}`}
        </div>
        {user.kimichatId && (
          <div style={{
            fontSize: 11,
            color: 'var(--teal)',
            marginTop: 2
          }}>
            🆔 {user.kimichatId}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        {actions?.map((action, i) => (
          <button
            key={i}
            onClick={action.onClick}
            aria-label={action.label || action.icon}
            title={action.label}
            style={{
              padding: action.label && action.icon.length > 2 ? '8px 14px' : '0',
              width: action.icon.length > 2 ? 'auto' : 36,
              height: 36,
              borderRadius: 10,
              border: 'none',
              background: action.color,
              color: action.textColor,
              fontSize: action.fontSize || 18,
              cursor: 'pointer',
              fontWeight: action.fontSize ? 600 : 400,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
            {action.icon}
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * EmptyState Component
 * ✅ Fixed: Semantic HTML
 */
function EmptyState({ icon, title, subtitle }) {
  return (
    <div style={{
      textAlign: 'center',
      padding: '60px 20px',
      color: 'var(--text-dim)'
    }}>
      <div style={{ fontSize: 52, marginBottom: 14 }} aria-hidden="true">
        {icon}
      </div>
      <h3 style={{
        fontFamily: 'var(--font-display)',
        fontSize: 17,
        fontWeight: 700,
        color: 'var(--text)',
        marginBottom: 8,
        margin: '0 0 8px 0'
      }}>
        {title}
      </h3>
      <p style={{ fontSize: 13, margin: 0 }}>
        {subtitle}
      </p>
    </div>
  );
}

/**
 * Format relative time
 * ✅ Fixed: Safe number conversion
 */
function formatAgo(dateStr) {
  if (!dateStr) return '';
  try {
    const diff = Date.now() - new Date(dateStr).getTime();
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  } catch {
    return '';
  }
}