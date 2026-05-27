import React, { useState, useEffect } from 'react';
import useAuthStore from '../../context/authStore';
import api from '../../utils/api';
import Avatar from '../ui/Avatar';
import { toast } from 'react-hot-toast';

const BG_OPTIONS = [
  'linear-gradient(135deg,#00c9b1,#1a8cff)',
  'linear-gradient(135deg,#7c5cfc,#ff4fa3)',
  'linear-gradient(135deg,#ffb830,#ff4fa3)',
  'linear-gradient(135deg,#1a8cff,#7c5cfc)',
  'linear-gradient(135deg,#00c9b1,#7c5cfc)',
  'linear-gradient(135deg,#ff6b35,#ffb830)',
];

const FILTERS = [
  { name: 'None', id: 'none', css: 'none' },
  { name: 'Vivid', id: 'vivid', css: 'contrast(1.2) saturate(1.3)' },
  { name: 'Cool', id: 'cool', css: 'hue-rotate(200deg) saturate(0.8)' },
  { name: 'Warm', id: 'warm', css: 'hue-rotate(-20deg) saturate(1.2)' },
  { name: 'B&W', id: 'bw', css: 'grayscale(1)' },
  { name: 'Blur', id: 'blur', css: 'blur(3px)' },
  { name: 'Sepia', id: 'sepia', css: 'sepia(0.8)' },
  { name: 'Invert', id: 'invert', css: 'invert(1)' },
];

const REACTION_TYPES = [
  { emoji: '❤️', name: 'heart', label: 'Love' },
  { emoji: '🔥', name: 'fire', label: 'Fire' },
  { emoji: '😂', name: 'laugh', label: 'Laugh' },
  { emoji: '👏', name: 'clap', label: 'Wow' },
];

export default function StatusPanel() {
  const { user } = useAuthStore();
  const [statusGroups, setStatusGroups] = useState([]);
  const [viewing, setViewing] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newStatus, setNewStatus] = useState({
    type: 'text',
    content: '',
    bg: BG_OPTIONS[0],
    file: null,
    fileName: '',
    filter: 'none',
    songFile: null,
    songFileName: '',
    addSongToMedia: false,
  });
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStatuses();
    
    window.fetchStatuses = fetchStatuses;
    return () => { delete window.fetchStatuses; };
  }, []);

  const fetchStatuses = async () => {
    try {
      setError(null);
      const res = await api.get('/status');
      if (res.data.success) {
        setStatusGroups(res.data.statusGroups || []);
      }
    } catch (err) {
      console.error('Error fetching statuses:', err);
      if (err.response?.status === 401) {
        setError('Session expired. Please login again.');
      } else {
        setError(err.response?.data?.message || 'Failed to fetch statuses');
      }
    }
  };

  const handleFileSelect = (type, file) => {
    if (!file) return;
    setNewStatus((s) => ({
      ...s,
      type,
      file,
      fileName: file.name,
    }));

    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview({
        type,
        data: e.target.result,
        name: file.name,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSongSelect = (file) => {
    if (!file) return;
    setNewStatus((s) => ({
      ...s,
      songFile: file,
      songFileName: file.name,
    }));
  };

  const postStatus = async () => {
    if (!newStatus.content.trim() && !newStatus.file) {
      setError('Please add content or upload media');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('type', newStatus.type);
      formData.append('content', newStatus.content);
      formData.append('bg', newStatus.bg);
      formData.append('filter', newStatus.filter);

      if (newStatus.file) {
        formData.append('file', newStatus.file);
      }

      if (newStatus.songFile && newStatus.addSongToMedia) {
        formData.append('songFile', newStatus.songFile);
        formData.append('songFileName', newStatus.songFileName);
      }

      const response = await api.post('/status', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
 
      if (response.data.success) {
        setShowAdd(false);
        setNewStatus({
          type: 'text',
          content: '',
          bg: BG_OPTIONS[0],
          file: null,
          fileName: '',
          filter: 'none',
          songFile: null,
          songFileName: '',
          addSongToMedia: false,
        });
        setPreview(null);
        setError(null);
        fetchStatuses();
        toast.success('Status posted! 🚀');
      }
    } catch (err) {
      console.error('Error posting status:', err);
      setError(err.response?.data?.message || 'Failed to post status');
    } finally {
      setLoading(false);
    }
  };

  const openViewer = (group, index = 0) => setViewing({ group, index });

  const nextStatus = () => {
    if (!viewing) return;
    const { group, index } = viewing;
    if (index < group.statuses.length - 1) {
      setViewing({ group, index: index + 1 });
    } else {
      setViewing(null);
    }
  };

  const prevStatus = () => {
    if (!viewing) return;
    const { group, index } = viewing;
    if (index > 0) {
      setViewing({ group, index: index - 1 });
    }
  };

  const currentStatus = viewing ? viewing.group.statuses[viewing.index] : null;
  const myGroup = statusGroups.find(g => g.user?._id === user?._id);
  const otherGroups = statusGroups.filter(g => g.user?._id !== user?._id);

  return (
    <div
      style={{
        display: 'flex',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        background: 'var(--bg-dark)',
        fontFamily: 'var(--font-body)',
      }}
    >
      
      <div
        style={{
          width: 340,
          background: 'var(--bg-card2)',
          borderRight: '1px solid var(--border2)',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
          overflow: 'hidden',
        }}
      >
        
        <div
          style={{
            padding: '24px 20px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--border2)',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: '-0.5px',
              color: 'var(--text)',
            }}
          >
            Status
          </div>
          <button
            onClick={() => setShowAdd(true)}
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: 'linear-gradient(135deg, var(--teal), var(--blue))',
              border: 'none',
              color: '#fff',
              fontSize: 22,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'transform 0.2s, box-shadow 0.2s',
              boxShadow: '0 4px 12px rgba(0, 201, 177, 0.2)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.08)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 201, 177, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 201, 177, 0.2)';
            }}
          >
            +
          </button>
        </div>

        
        {error && (
          <div
            style={{
              background: 'rgba(255, 79, 163, 0.15)',
              border: '1px solid rgba(255, 79, 163, 0.3)',
              color: '#ff4fa3',
              padding: '12px 16px',
              fontSize: 12,
              borderRadius: 8,
              margin: '12px',
            }}
          >
            {error}
          </div>
        )}

        
        <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 12 }}>
          
          <div style={{ padding: '12px 12px 8px' }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: 'var(--text-dim)',
                textTransform: 'uppercase',
                letterSpacing: '0.8px',
                padding: '8px 12px',
                opacity: 0.6,
              }}
            >
              My Status
            </div>
            <div
              onClick={() => myGroup ? openViewer(myGroup) : setShowAdd(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '12px 12px',
                borderRadius: 16,
                cursor: 'pointer',
                transition: 'all 0.2s',
                background: 'transparent',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,.06)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <div style={{ position: 'relative' }}>
                {myGroup ? (
                   <div style={{ padding: 3, borderRadius: '50%', background: 'linear-gradient(135deg, var(--teal), var(--blue))', boxShadow: '0 0 10px rgba(0, 201, 177, 0.3)' }}>
                     <div style={{ padding: 2, borderRadius: '50%', background: 'var(--bg-card2)' }}>
                       <Avatar name={user?.name} src={user?.avatar} size={44} />
                     </div>
                   </div>
                ) : (
                  <div style={{ position: 'relative' }}>
                    <Avatar name={user?.name} src={user?.avatar} size={48} />
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        right: 0,
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, var(--teal), var(--blue))',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 14,
                        border: '2px solid var(--bg-card2)',
                        color: '#fff',
                        fontWeight: 700,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                      }}
                    >
                      +
                    </div>
                  </div>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text)' }}>
                  My Status
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: 'var(--text-dim)',
                    marginTop: 2,
                  }}
                >
                  {myGroup ? 'Tap to view updates' : 'Add to your story'}
                </div>
              </div>
              {myGroup && (
                <button 
                  onClick={(e) => { e.stopPropagation(); setShowAdd(true); }}
                  style={{ 
                    background: 'rgba(255,255,255,0.08)', 
                    border: '1px solid var(--border2)', 
                    borderRadius: 10, 
                    width: 34, 
                    height: 34, 
                    color: 'var(--text)', 
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 18,
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                >
                  +
                </button>
              )}
            </div>
          </div>

          
          {otherGroups.length > 0 && (
            <div style={{ padding: '12px 12px 8px' }}>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: 'var(--text-dim)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.8px',
                  padding: '8px 12px',
                  opacity: 0.6,
                }}
              >
                Recent Updates
              </div>
              {otherGroups.map((group, gi) => (
                <div
                  key={gi}
                  onClick={() => openViewer(group)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    padding: '12px 12px',
                    borderRadius: 16,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    background: 'transparent',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,.06)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <div style={{ position: 'relative' }}>
                    <div
                      style={{
                        padding: 2.5,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, var(--teal), var(--blue))',
                      }}
                    >
                      <div
                        style={{
                          padding: 2.5,
                          borderRadius: '50%',
                          background: 'var(--bg-card2)',
                        }}
                      >
                        <Avatar
                          name={group.user?.name}
                          src={group.user?.avatar}
                          size={42}
                        />
                      </div>
                    </div>
                    {group.unseen && (
                      <div
                        style={{
                          position: 'absolute',
                          top: -2,
                          right: -2,
                          width: 10,
                          height: 10,
                          borderRadius: '50%',
                          background: '#ff4fa3',
                          border: '2px solid var(--bg-card2)',
                        }}
                      />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>
                      {group.user?.name}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: 'var(--text-dim)',
                        marginTop: 2,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {group.statuses.length} update{group.statuses.length > 1 ? 's' : ''} •{' '}
                      {formatAgo(group.statuses[0]?.createdAt)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {statusGroups.length === 0 && (
            <div
              style={{
                textAlign: 'center',
                padding: '60px 20px',
                color: 'var(--text-dim)',
              }}
            >
              <div style={{ fontSize: 42, marginBottom: 12 }}>📸</div>
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 14,
                  fontWeight: 600,
                  color: 'var(--text)',
                  marginBottom: 6,
                }}
              >
                No updates yet
              </div>
              <div style={{ fontSize: 12 }}>Status from contacts appear here</div>
            </div>
          )}
        </div>
      </div>

      
      <div
        style={{
          flex: 1,
          background: 'var(--bg-dark)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {!viewing ? (
          <div style={{ textAlign: 'center', color: 'var(--text-dim)' }}>
            <div style={{ fontSize: 72, marginBottom: 20, opacity: 0.4 }}>📸</div>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 20,
                fontWeight: 700,
                color: 'var(--text)',
                marginBottom: 10,
              }}
            >
              View Status Updates
            </div>
            <div style={{ fontSize: 14, marginBottom: 28 }}>
              Select a contact to view their status
            </div>
            <button
              onClick={() => setShowAdd(true)}
              style={{
                padding: '14px 32px',
                background: 'linear-gradient(135deg, var(--teal), var(--blue))',
                border: 'none',
                borderRadius: 14,
                color: '#fff',
                fontFamily: 'var(--font-display)',
                fontSize: 15,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: '0 6px 16px rgba(0, 201, 177, 0.2)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 201, 177, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 201, 177, 0.2)';
              }}
            >
              + Add Status
            </button>
          </div>
        ) : (
          <StatusViewer
            status={currentStatus}
            user={viewing.group.user}
            total={viewing.group.statuses.length}
            current={viewing.index}
            onNext={nextStatus}
            onPrev={prevStatus}
            onClose={() => setViewing(null)}
          />
        )}
      </div>

      
      {showAdd && (
        <AddStatusModal
          newStatus={newStatus}
          setNewStatus={setNewStatus}
          preview={preview}
          setPreview={setPreview}
          loading={loading}
          error={error}
          onPost={postStatus}
          onClose={() => {
            setShowAdd(false);
            setNewStatus({
              type: 'text',
              content: '',
              bg: BG_OPTIONS[0],
              file: null,
              fileName: '',
              filter: 'none',
              songFile: null,
              songFileName: '',
              addSongToMedia: false,
            });
            setPreview(null);
            setError(null);
          }}
          onFileSelect={handleFileSelect}
          onSongSelect={handleSongSelect}
        />
      )}
    </div>
  );
}

function AddStatusModal({
  newStatus,
  setNewStatus,
  preview,
  setPreview,
  loading,
  error,
  onPost,
  onClose,
  onFileSelect,
  onSongSelect,
}) {
  const getFilterStyle = (filterId) => {
    const filter = FILTERS.find((f) => f.id === filterId);
    return filter ? filter.css : 'none';
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(5, 13, 26, 0.92)',
        zIndex: 500,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(10px)',
        animation: 'fadeIn 0.3s ease-out',
      }}
      onClick={onClose}
    >
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1.5px solid var(--border)',
          borderRadius: 28,
          padding: 32,
          width: Math.min(540, window.innerWidth - 40),
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
          animation: 'slideUp 0.4s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 24,
            paddingBottom: 16,
            borderBottom: '1px solid var(--border2)',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 20,
              fontWeight: 700,
              color: 'var(--text)',
            }}
          >
            📸 Add Status
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,.08)',
              border: 'none',
              color: 'var(--text-dim)',
              fontSize: 24,
              cursor: 'pointer',
              width: 36,
              height: 36,
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,.12)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,.08)';
            }}
          >
            ✕
          </button>
        </div>

        
        {error && (
          <div
            style={{
              background: 'rgba(255, 79, 163, 0.15)',
              border: '1px solid rgba(255, 79, 163, 0.3)',
              color: '#ff4fa3',
              padding: '12px 14px',
              fontSize: 12,
              borderRadius: 10,
              marginBottom: 18,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span style={{ fontSize: 16 }}>⚠️</span>
            {error}
          </div>
        )}

        
        <div style={{ marginBottom: 20 }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--text-dim)',
              marginBottom: 10,
              textTransform: 'uppercase',
              letterSpacing: '0.8px',
            }}
          >
            Status Type
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 10,
            }}
          >
            {[
              { type: 'text', icon: '📝', label: 'Text' },
              { type: 'photo', icon: '🖼️', label: 'Photo' },
              { type: 'video', icon: '🎥', label: 'Video' },
              { type: 'song', icon: '🎵', label: 'Song' },
            ].map(({ type, icon, label }) => (
              <button
                key={type}
                onClick={() => setNewStatus((s) => ({ ...s, type }))}
                style={{
                  padding: '14px 12px',
                  borderRadius: 14,
                  background:
                    newStatus.type === type
                      ? 'linear-gradient(135deg, var(--teal), var(--blue))'
                      : 'rgba(255,255,255,.06)',
                  border: `1.5px solid ${
                    newStatus.type === type ? 'transparent' : 'var(--border2)'
                  }`,
                  color: newStatus.type === type ? '#fff' : 'var(--text)',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 600,
                  transition: 'all 0.2s',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 6,
                }}
                onMouseEnter={(e) => {
                  if (newStatus.type !== type) {
                    e.currentTarget.style.background = 'rgba(255,255,255,.1)';
                    e.currentTarget.style.borderColor = 'var(--border)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (newStatus.type !== type) {
                    e.currentTarget.style.background = 'rgba(255,255,255,.06)';
                    e.currentTarget.style.borderColor = 'var(--border2)';
                  }
                }}
              >
                <span style={{ fontSize: 20 }}>{icon}</span>
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        
        {newStatus.type === 'text' && (
          <>
            <div style={{ marginBottom: 18 }}>
              <div
                style={{
                  height: 200,
                  borderRadius: 18,
                  background: newStatus.bg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 24,
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
                }}
              >
                <div
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 28,
                    fontWeight: 700,
                    color: '#fff',
                    textAlign: 'center',
                    textShadow: '0 2px 8px rgba(0,0,0,.3)',
                    zIndex: 1,
                    lineHeight: 1.4,
                  }}
                >
                  {newStatus.content || 'Your status text…'}
                </div>
              </div>
            </div>

            
            <div style={{ marginBottom: 18 }}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--text-dim)',
                  marginBottom: 10,
                  textTransform: 'uppercase',
                  letterSpacing: '0.8px',
                }}
              >
                Background
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {BG_OPTIONS.map((bg, i) => (
                  <button
                    key={i}
                    onClick={() => setNewStatus((s) => ({ ...s, bg }))}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      background: bg,
                      cursor: 'pointer',
                      border:
                        newStatus.bg === bg
                          ? '3px solid #fff'
                          : '3px solid transparent',
                      transition: 'all 0.2s',
                      boxShadow:
                        newStatus.bg === bg
                          ? '0 0 0 2px var(--border)'
                          : 'none',
                    }}
                  />
                ))}
              </div>
            </div>

            <textarea
              value={newStatus.content}
              onChange={(e) =>
                setNewStatus((s) => ({ ...s, content: e.target.value }))
              }
              placeholder="What's on your mind?"
              rows={3}
              style={{
                width: '100%',
                background: 'rgba(255,255,255,.06)',
                border: '1.5px solid var(--border2)',
                borderRadius: 12,
                padding: 12,
                color: 'var(--text)',
                fontSize: 14,
                fontFamily: 'var(--font-body)',
                outline: 'none',
                resize: 'none',
                transition: 'all 0.2s',
                marginBottom: 18,
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--teal)';
                e.target.style.background = 'rgba(0, 201, 177, 0.08)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'var(--border2)';
                e.target.style.background = 'rgba(255,255,255,.06)';
              }}
            />
          </>
        )}

        
        {(newStatus.type === 'photo' ||
          newStatus.type === 'video' ||
          newStatus.type === 'song') && (
          <>
            
            {preview && (
              <>
                
                <div style={{ marginBottom: 18 }}>
                  <div
                    style={{
                      borderRadius: 18,
                      background: '#000',
                      border: '1.5px solid var(--border2)',
                      padding: 0,
                      overflow: 'hidden',
                      aspectRatio: '1/1',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      maxHeight: 300,
                      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
                    }}
                  >
                    {newStatus.type === 'photo' && (
                      <img
                        src={preview.data}
                        alt="preview"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          filter: getFilterStyle(newStatus.filter),
                          transition: 'filter 0.3s ease',
                        }}
                      />
                    )}
                    {newStatus.type === 'video' && (
                      <video
                        src={preview.data}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          filter: getFilterStyle(newStatus.filter),
                          transition: 'filter 0.3s ease',
                        }}
                        controls
                      />
                    )}
                    {newStatus.type === 'song' && (
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: 20,
                          padding: 40,
                          textAlign: 'center',
                        }}
                      >
                        <div style={{ fontSize: 60 }}>🎵</div>
                        <div
                          style={{
                            fontFamily: 'var(--font-display)',
                            fontSize: 16,
                            fontWeight: 700,
                            color: 'var(--text)',
                            maxWidth: 200,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {preview.name}
                        </div>
                        <audio
                          src={preview.data}
                          controls
                          style={{
                            width: '100%',
                            marginTop: 10,
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>

                
                <div
                  style={{
                    borderRadius: 14,
                    background: 'rgba(255,255,255,.06)',
                    border: '1.5px solid var(--border2)',
                    padding: 14,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    marginBottom: 18,
                  }}
                >
                  <div
                    style={{
                      width: 50,
                      height: 50,
                      borderRadius: 10,
                      background: 'rgba(0, 201, 177, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 24,
                      flexShrink: 0,
                    }}
                  >
                    {newStatus.type === 'photo' && '🖼️'}
                    {newStatus.type === 'video' && '🎥'}
                    {newStatus.type === 'song' && '🎵'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: 600,
                        fontSize: 13,
                        color: 'var(--text)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {preview.name}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: 'var(--text-dim)',
                        marginTop: 2,
                      }}
                    >
                      Ready to post
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setNewStatus((s) => ({
                        ...s,
                        file: null,
                        fileName: '',
                      }));
                      setPreview(null);
                    }}
                    style={{
                      background: 'rgba(255, 79, 163, 0.2)',
                      border: 'none',
                      color: '#ff4fa3',
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      cursor: 'pointer',
                      fontSize: 16,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    ✕
                  </button>
                </div>
              </>
            )}

            
            {!preview && (
              <div
                style={{
                  marginBottom: 18,
                  borderRadius: 16,
                  border: '2px dashed var(--border)',
                  padding: 40,
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  background: 'rgba(0, 201, 177, 0.05)',
                }}
                onDragEnter={(e) => {
                  e.preventDefault();
                  e.currentTarget.style.borderColor = 'var(--teal)';
                  e.currentTarget.style.background = 'rgba(0, 201, 177, 0.1)';
                }}
                onDragLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.background = 'rgba(0, 201, 177, 0.05)';
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files[0];
                  if (file) onFileSelect(newStatus.type, file);
                }}
              >
                <div style={{ fontSize: 40, marginBottom: 12 }}>
                  {newStatus.type === 'photo' && '🖼️'}
                  {newStatus.type === 'video' && '🎥'}
                  {newStatus.type === 'song' && '🎵'}
                </div>
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: 15,
                    color: 'var(--text)',
                    marginBottom: 4,
                  }}
                >
                  {newStatus.type === 'photo' && 'Drop photo here'}
                  {newStatus.type === 'video' && 'Drop video here'}
                  {newStatus.type === 'song' && 'Drop song here'}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: 'var(--text-dim)',
                    marginBottom: 16,
                  }}
                >
                  or click to browse
                </div>
                <input
                  type="file"
                  onChange={(e) =>
                    onFileSelect(newStatus.type, e.target.files?.[0])
                  }
                  accept={
                    newStatus.type === 'photo'
                      ? 'image/*'
                      : newStatus.type === 'video'
                      ? 'video/*'
                      : 'audio/*,video/*,.mp3,.wav,.mpeg,.acc'
                  }
                  style={{ display: 'none' }}
                  id={`file-input-${newStatus.type}`}
                />
                <label
                  htmlFor={`file-input-${newStatus.type}`}
                  style={{
                    display: 'inline-block',
                    padding: '11px 24px',
                    background: 'linear-gradient(135deg, var(--teal), var(--blue))',
                    color: '#fff',
                    borderRadius: 10,
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: 600,
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 201, 177, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  Browse Files
                </label>
              </div>
            )}

            
            {(newStatus.type === 'photo' || newStatus.type === 'video') && preview && (
              <div style={{ marginBottom: 18 }}>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: 'var(--text-dim)',
                    marginBottom: 10,
                    textTransform: 'uppercase',
                    letterSpacing: '0.8px',
                  }}
                >
                  Filters (Live Preview)
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: 10,
                  }}
                >
                  {FILTERS.map((filter) => (
                    <button
                      key={filter.id}
                      onClick={() =>
                        setNewStatus((s) => ({ ...s, filter: filter.id }))
                      }
                      style={{
                        padding: '10px 8px',
                        borderRadius: 12,
                        background:
                          newStatus.filter === filter.id
                            ? 'linear-gradient(135deg, var(--teal), var(--blue))'
                            : 'rgba(255,255,255,.06)',
                        border: `1.5px solid ${
                          newStatus.filter === filter.id
                            ? 'transparent'
                            : 'var(--border2)'
                        }`,
                        color:
                          newStatus.filter === filter.id
                            ? '#fff'
                            : 'var(--text)',
                        cursor: 'pointer',
                        fontSize: 11,
                        fontWeight: 600,
                        transition: 'all 0.2s',
                      }}
                    >
                      {filter.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            
            {(newStatus.type === 'photo' || newStatus.type === 'video') && preview && (
              <div style={{ marginBottom: 18 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '14px',
                    background: 'rgba(0, 201, 177, 0.08)',
                    border: '1.5px solid rgba(0, 201, 177, 0.3)',
                    borderRadius: 12,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onClick={() =>
                    setNewStatus((s) => ({
                      ...s,
                      addSongToMedia: !s.addSongToMedia,
                    }))
                  }
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(0, 201, 177, 0.12)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(0, 201, 177, 0.08)';
                  }}
                >
                  <input
                    type="checkbox"
                    checked={newStatus.addSongToMedia}
                    onChange={(e) =>
                      setNewStatus((s) => ({
                        ...s,
                        addSongToMedia: e.target.checked,
                      }))
                    }
                    style={{
                      width: 18,
                      height: 18,
                      cursor: 'pointer',
                      accentColor: 'var(--teal)',
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontWeight: 600,
                        fontSize: 13,
                        color: 'var(--text)',
                      }}
                    >
                      🎵 Add Song Background
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: 'var(--text-dim)',
                        marginTop: 2,
                      }}
                    >
                      Add background music to your media
                    </div>
                  </div>
                </div>

                
                {newStatus.addSongToMedia && (
                  <div style={{ marginTop: 14 }}>
                    {newStatus.songFile ? (
                      <div
                        style={{
                          borderRadius: 12,
                          background: 'rgba(255,255,255,.06)',
                          border: '1.5px solid var(--border2)',
                          padding: 12,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                        }}
                      >
                        <div
                          style={{
                            fontSize: 20,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          🎵
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontWeight: 600,
                              fontSize: 12,
                              color: 'var(--text)',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {newStatus.songFileName}
                          </div>
                        </div>
                        <button
                          onClick={() =>
                            setNewStatus((s) => ({
                              ...s,
                              songFile: null,
                              songFileName: '',
                            }))
                          }
                          style={{
                            background: 'rgba(255, 79, 163, 0.2)',
                            border: 'none',
                            color: '#ff4fa3',
                            width: 28,
                            height: 28,
                            borderRadius: 6,
                            cursor: 'pointer',
                            fontSize: 14,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div
                        style={{
                          borderRadius: 12,
                          border: '2px dashed var(--border)',
                          padding: 16,
                          textAlign: 'center',
                          background: 'rgba(255,255,255,.03)',
                        }}
                      >
                        <div
                          style={{
                            fontSize: 12,
                            color: 'var(--text-dim)',
                            marginBottom: 10,
                          }}
                        >
                          Select a song
                        </div>
                        <input
                          type="file"
                          onChange={(e) =>
                            onSongSelect(e.target.files?.[0])
                          }
                          accept="audio/*"
                          style={{ display: 'none' }}
                          id="song-input"
                        />
                        <label
                          htmlFor="song-input"
                          style={{
                            display: 'inline-block',
                            padding: '8px 16px',
                            background: 'linear-gradient(135deg, var(--teal), var(--blue))',
                            color: '#fff',
                            borderRadius: 8,
                            cursor: 'pointer',
                            fontSize: 11,
                            fontWeight: 600,
                          }}
                        >
                          Choose Song
                        </label>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        
        {newStatus.type !== 'text' && (
          <div style={{ marginBottom: 18 }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--text-dim)',
                marginBottom: 8,
                textTransform: 'uppercase',
                letterSpacing: '0.8px',
              }}
            >
              Caption (Optional)
            </div>
            <textarea
              value={newStatus.content}
              onChange={(e) =>
                setNewStatus((s) => ({ ...s, content: e.target.value }))
              }
              placeholder="Add a caption..."
              rows={2}
              style={{
                width: '100%',
                background: 'rgba(255,255,255,.06)',
                border: '1.5px solid var(--border2)',
                borderRadius: 12,
                padding: 12,
                color: 'var(--text)',
                fontSize: 13,
                fontFamily: 'var(--font-body)',
                outline: 'none',
                resize: 'none',
                transition: 'all 0.2s',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--teal)';
                e.target.style.background = 'rgba(0, 201, 177, 0.08)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'var(--border2)';
                e.target.style.background = 'rgba(255,255,255,.06)';
              }}
            />
          </div>
        )}

        
        <div
          style={{
            display: 'flex',
            gap: 12,
            marginTop: 24,
            paddingTop: 16,
            borderTop: '1px solid var(--border2)',
          }}
        >
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              flex: 1,
              padding: 12,
              background: 'rgba(255,255,255,.08)',
              border: '1.5px solid var(--border2)',
              borderRadius: 12,
              color: 'var(--text)',
              fontFamily: 'var(--font-display)',
              fontSize: 14,
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              opacity: loading ? 0.5 : 1,
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.background = 'rgba(255,255,255,.12)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,.08)';
            }}
          >
            Cancel
          </button>
          <button
            onClick={onPost}
            disabled={
              loading ||
              (!newStatus.content.trim() && !newStatus.file)
            }
            style={{
              flex: 1,
              padding: 12,
              background:
                loading || (!newStatus.content.trim() && !newStatus.file)
                  ? 'rgba(0, 201, 177, 0.4)'
                  : 'linear-gradient(135deg, var(--teal), var(--blue))',
              border: 'none',
              borderRadius: 12,
              color: '#fff',
              fontFamily: 'var(--font-display)',
              fontSize: 14,
              fontWeight: 700,
              cursor:
                loading || (!newStatus.content.trim() && !newStatus.file)
                  ? 'not-allowed'
                  : 'pointer',
              transition: 'all 0.2s',
              boxShadow:
                loading || (!newStatus.content.trim() && !newStatus.file)
                  ? 'none'
                  : '0 6px 16px rgba(0, 201, 177, 0.2)',
            }}
            onMouseEnter={(e) => {
              if (!(loading || (!newStatus.content.trim() && !newStatus.file))) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow =
                  '0 8px 20px rgba(0, 201, 177, 0.3)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            {loading ? 'Posting…' : 'Post Status 🚀'}
          </button>
        </div>
      </div>
    </div>
  );
}

function StatusViewer({
  status,
  user: owner,
  total,
  current,
  onNext,
  onPrev,
  onClose,
}) {
  const { user: me } = useAuthStore();
  const [reply, setReply] = useState('');
  const [reactions, setReactions] = useState({});
  const [userReaction, setUserReaction] = useState(null);

  useEffect(() => {
    if (!status) return;
    const counts = {};
    (status.reactions || []).forEach(r => {
      const rId = r.user?._id || r.user; 
      counts[r.type] = (counts[r.type] || 0) + 1;
      if (rId === me?._id) setUserReaction(r.type);
    });
    setReactions(counts);

    
    const myId = me?._id?.toString();
    const ownerId = status.userId?._id?.toString() || status.userId?.toString();
    
    if (myId && ownerId && myId !== ownerId) {
       console.log(`👁️ Viewing status ${status._id} by ${ownerId}`);
       api.put(`/status/${status._id}/view`).catch(err => console.error('View tracking failed:', err));
    }
  }, [status?._id, me?._id]);

  const handleDelete = async () => {
    if (!status?._id) return;
    if (!window.confirm('Delete this status?')) return;
    try {
      const res = await api.delete(`/status/${status._id}`);
      if (res.data.success) {
        toast.success('Status deleted');
        onClose();
        
        if (typeof window.fetchStatuses === 'function') {
          window.fetchStatuses();
        } else {
          window.location.reload();
        }
      }
    } catch (err) {
      toast.error('Failed to delete status');
    }
  };

  const sendReply = async (e) => {
    if (e.key !== 'Enter' || !reply.trim()) return;
    try {
      const res = await api.post(`/status/${status._id}/reply`, { message: reply });
      if (res.data.success) {
        toast.success('Reply sent!');
        setReply('');
      }
    } catch (err) {
      toast.error('Failed to send reply');
    }
  };

  const toggleReaction = async (type) => {
    try {
      const res = await api.put(`/status/${status._id}/reaction`, { reactionType: type });
      if (res.data.success) {
        setUserReaction(type);
        setReactions(prev => ({ ...prev, [type]: (prev[type] || 0) + 1 }));
      }
    } catch (err) {
      toast.error('Failed to react');
    }
  };

  const getFilterStyle = (filterId) => {
    const filter = FILTERS.find((f) => f.id === filterId);
    return filter ? filter.css : 'none';
  };


  const hasReactions = Object.values(reactions).some((count) => count > 0);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: status?.bg || 'linear-gradient(135deg, var(--teal), var(--blue))',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      
      <div style={{ display: 'flex', gap: 4, padding: '16px 16px 8px' }}>
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: 3.5,
              borderRadius: 2,
              background:
                i <= current ? 'rgba(255,255,255,.95)' : 'rgba(255,255,255,.2)',
              transition: 'all 0.3s',
            }}
          />
        ))}
      </div>

      
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '8px 16px 16px',
        }}
      >
        <Avatar name={owner?.name} src={owner?.avatar} size={40} />
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              color: '#fff',
              fontSize: 15,
            }}
          >
            {owner?.name}
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,.75)' }}>
            {formatAgo(status?.createdAt)}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {(me?._id === owner?._id || me?._id === status?.user?._id) && (
            <button
              onClick={handleDelete}
              style={{
                background: 'rgba(255,79,163,.3)',
                border: 'none',
                borderRadius: '50%',
                width: 36,
                height: 36,
                color: '#fff',
                fontSize: 16,
                cursor: 'pointer',
              }}
            >
              🗑️
            </button>
          )}
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,.2)',
              border: 'none',
              borderRadius: '50%',
              width: 36,
              height: 36,
              color: '#fff',
              fontSize: 18,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,.2)';
            }}
          >
            ✕
          </button>
        </div>
      </div>

      
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 0, 
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        
        {(status?.type === 'photo' || status?.type === 'video') && status?.songUrl && (
           <audio src={status.songUrl} autoPlay loop hidden={true} />
        )}
        {status?.type === 'text' ? (
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 36,
              fontWeight: 700,
              color: '#fff',
              textAlign: 'center',
              textShadow: '0 2px 12px rgba(0,0,0,.4)',
              lineHeight: 1.5,
              maxWidth: '80%',
            }}
          >
            {status?.content}
          </div>
        ) : status?.type === 'photo' ? (
          <img
            src={status?.fileUrl}
            alt="status"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain', 
              filter: getFilterStyle(status?.filter),
              background: 'rgba(0,0,0,0.2)'
            }}
          />
        ) : status?.type === 'video' ? (
          <video
            src={status?.fileUrl}
            controls
            autoPlay
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              filter: getFilterStyle(status?.filter),
            }}
          />
        ) : status?.type === 'song' ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 30,
              padding: 40,
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 80 }}>🎵</div>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 20,
                fontWeight: 700,
                color: '#fff',
                textShadow: '0 2px 8px rgba(0,0,0,.4)',
                maxWidth: 300,
              }}
            >
              {status?.fileName || 'Playing...'}
            </div>
            {status?.content && (
              <div
                style={{
                  fontSize: 14,
                  color: 'rgba(255,255,255,.85)',
                  maxWidth: 300,
                  marginTop: 10
                }}
              >
                {status?.content}
              </div>
            )}
            
            {status?.fileUrl?.match(/\.(mpeg|mp4|webm|mov)$/i) ? (
              <video
                src={status?.fileUrl}
                controls
                autoPlay
                style={{
                  width: '90%',
                  borderRadius: 16,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                  marginTop: 20,
                }}
              />
            ) : (
              <audio
                src={status?.fileUrl}
                controls
                autoPlay
                style={{
                  width: '80%',
                  marginTop: 20,
                }}
              />
            )}
          </div>
        ) : null}

        
        {me?._id === status?.userId?._id && (
          <div 
            style={{
              position: 'absolute',
              bottom: 20,
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(10px)',
              padding: '6px 14px',
              borderRadius: 20,
              color: '#fff',
              fontSize: 12,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              cursor: 'pointer',
              zIndex: 30, 
              border: '1px solid rgba(255,255,255,0.1)'
            }}
            onClick={(e) => {
              e.stopPropagation();
              toast((t) => (
                <div style={{ minWidth: 200 }}>
                  <div style={{ fontWeight: 700, marginBottom: 10, borderBottom: '1px solid #eee', paddingBottom: 5 }}>Seen by ({status?.views?.length || 0})</div>
                  <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                    {(status?.views || []).length === 0 ? (
                      'No views yet'
                    ) : (
                      
                      (() => {
                        const seen = new Set();
                        return status.views.filter(v => {
                          const id = v?._id || v;
                          if (seen.has(id)) return false;
                          seen.add(id);
                          return true;
                        }).map((v, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                             <Avatar name={v.name} src={v.avatar} size={28} />
                             <span style={{ fontSize: 13 }}>{v.name}</span>
                          </div>
                        ));
                      })()
                    )}
                  </div>
                </div>
              ), { duration: 4000 });
            }}
          >
            👁️ {(status?.views || []).length} views
          </div>
        )}
      </div>

      
      {hasReactions && (
        <div
          style={{
            background: 'rgba(0, 0, 0, 0.3)',
            backdropFilter: 'blur(8px)',
            padding: '12px 16px',
            display: 'flex',
            gap: 12,
            flexWrap: 'wrap',
            borderTop: '1px solid rgba(255,255,255,.1)',
          }}
        >
          {REACTION_TYPES.map(({ emoji, name }) => {
            const count = reactions[name] || 0;
            return (
              count > 0 && (
                <div
                  key={name}
                  style={{
                    background: 'rgba(255,255,255,.15)',
                    backdropFilter: 'blur(8px)',
                    padding: '8px 12px',
                    borderRadius: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#fff',
                  }}
                >
                  <span style={{ fontSize: 16 }}>{emoji}</span>
                  {count}
                </div>
              )
            );
          })}
        </div>
      )}

      
      <div
        onClick={onPrev}
        style={{
          position: 'absolute',
          top: 80,
          bottom: 80,
          left: 0,
          width: '35%',
          cursor: current > 0 ? 'pointer' : 'default',
          zIndex: 20, 
        }}
      />
      <div
        onClick={onNext}
        style={{
          position: 'absolute',
          top: 80,
          bottom: 80,
          right: 0,
          width: '35%',
          cursor: 'pointer',
          zIndex: 20, 
        }}
      />

      
      <div
        style={{
          padding: '12px 16px 20px',
          display: 'flex',
          gap: 10,
          alignItems: 'flex-end',
          background: 'rgba(0, 0, 0, 0.2)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <input
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          onKeyDown={sendReply}
          placeholder={`Reply to ${owner?.name}…`}
          style={{
            flex: 1,
            background: 'rgba(255,255,255,.15)',
            border: '1.5px solid rgba(255,255,255,.3)',
            borderRadius: 32,
            padding: '12px 20px',
            color: '#fff',
            fontSize: 13,
            outline: 'none',
            fontFamily: 'var(--font-body)',
            transition: 'all 0.2s',
          }}
          onFocus={(e) => {
            e.target.style.borderColor = 'rgba(255,255,255,.8)';
            e.target.style.background = 'rgba(255,255,255,.2)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = 'rgba(255,255,255,.3)';
            e.target.style.background = 'rgba(255,255,255,.15)';
          }}
        />
        {REACTION_TYPES.map(({ emoji, name, label }) => (
          <button
            key={name}
            onClick={() => toggleReaction(name)}
            title={label}
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background:
                userReaction === name
                  ? 'rgba(255,255,255,.3)'
                  : 'rgba(255,255,255,.15)',
              border: userReaction === name ? '2px solid #fff' : 'none',
              fontSize: 20,
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transform: userReaction === name ? 'scale(1.15)' : 'scale(1)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,.25)';
              e.currentTarget.style.transform = 'scale(1.15)';
            }}
            onMouseLeave={(e) => {
              if (userReaction !== name) {
                e.currentTarget.style.background = 'rgba(255,255,255,.15)';
                e.currentTarget.style.transform = 'scale(1)';
              }
            }}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}

function formatAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr);
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}