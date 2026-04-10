import React, { useState, useEffect } from 'react';
import useAuthStore from '../../context/authStore';
import api from '../../utils/api';
import Avatar from '../ui/Avatar';

const BG_OPTIONS = [
  'linear-gradient(135deg,#00c9b1,#1a8cff)',
  'linear-gradient(135deg,#7c5cfc,#ff4fa3)',
  'linear-gradient(135deg,#ffb830,#ff4fa3)',
  'linear-gradient(135deg,#1a8cff,#7c5cfc)',
  'linear-gradient(135deg,#00c9b1,#7c5cfc)',
  'linear-gradient(135deg,#ff6b35,#ffb830)',
];

export default function StatusPanel() {
  const { user } = useAuthStore();
  const [statusGroups, setStatusGroups] = useState([]);
  const [viewing, setViewing] = useState(null); // { group, index }
  const [showAdd, setShowAdd] = useState(false);
  const [newStatus, setNewStatus] = useState({ content: '', bg: BG_OPTIONS[0], emoji: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchStatuses(); }, []);

  const fetchStatuses = async () => {
    try {
      const res = await api.get('/status');
      setStatusGroups(res.data.statusGroups || []);
    } catch {}
  };

  const postStatus = async () => {
    if (!newStatus.content.trim()) return;
    setLoading(true);
    try {
      await api.post('/status', { type: 'text', content: newStatus.content, bg: newStatus.bg });
      setShowAdd(false);
      setNewStatus({ content: '', bg: BG_OPTIONS[0], emoji: '' });
      fetchStatuses();
    } catch {}
    setLoading(false);
  };

  const openViewer = (group, index = 0) => setViewing({ group, index });

  const nextStatus = () => {
    if (!viewing) return;
    const { group, index } = viewing;
    if (index < group.statuses.length - 1) setViewing({ group, index: index + 1 });
    else setViewing(null);
  };

  const prevStatus = () => {
    if (!viewing) return;
    const { group, index } = viewing;
    if (index > 0) setViewing({ group, index: index - 1 });
  };

  const currentStatus = viewing ? viewing.group.statuses[viewing.index] : null;

  return (
    <div style={{ display: 'flex', width: '100%', height: '100%', overflow: 'hidden' }}>
      {/* Left: Status List */}
      <div style={{ width: 320, background: 'var(--bg-card2)', borderRight: '1px solid var(--border2)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '20px 16px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700 }}>Status</div>
          <button onClick={() => setShowAdd(true)} style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,var(--teal),var(--blue))', border: 'none', color: '#fff', fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {/* My status */}
          <div style={{ padding: '4px 8px 0' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '.8px', padding: '6px 8px' }}>My Status</div>
            <div onClick={() => setShowAdd(true)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 10px', borderRadius: 14, cursor: 'pointer', transition: 'background .2s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.04)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <div style={{ position: 'relative' }}>
                <Avatar name={user?.name} src={user?.avatar} size={46} />
                <div style={{ position: 'absolute', bottom: -2, right: -2, width: 18, height: 18, borderRadius: '50%', background: 'linear-gradient(135deg,var(--teal),var(--blue))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, border: '2px solid var(--bg-card2)', color: '#fff', fontWeight: 700 }}>+</div>
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>My Status</div>
                <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>Tap to add status update</div>
              </div>
            </div>
          </div>

          {/* Friends' statuses */}
          {statusGroups.length > 0 && (
            <div style={{ padding: '8px 8px 0' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '.8px', padding: '6px 8px' }}>Recent Updates</div>
              {statusGroups.map((group, gi) => (
                <div key={gi} onClick={() => openViewer(group)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 10px', borderRadius: 14, cursor: 'pointer', transition: 'background .2s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.04)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <div style={{ position: 'relative' }}>
                    <div style={{ padding: 2, borderRadius: '50%', background: 'linear-gradient(135deg,var(--teal),var(--blue))' }}>
                      <div style={{ padding: 2, borderRadius: '50%', background: 'var(--bg-card2)' }}>
                        <Avatar name={group.user?.name} src={group.user?.avatar} size={40} />
                      </div>
                    </div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{group.user?.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>
                      {group.statuses.length} update{group.statuses.length > 1 ? 's' : ''} · {formatAgo(group.statuses[0]?.createdAt)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {statusGroups.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-dim)' }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>📸</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>No status updates</div>
              <div style={{ fontSize: 13 }}>Your friends' status updates will appear here</div>
            </div>
          )}
        </div>
      </div>

      {/* Right: Viewer or empty */}
      <div style={{ flex: 1, background: 'var(--bg-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
        {!viewing ? (
          <div style={{ textAlign: 'center', color: 'var(--text-dim)' }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>📸</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>View Status Updates</div>
            <div style={{ fontSize: 14 }}>Select a contact to view their status</div>
            <button onClick={() => setShowAdd(true)} style={{ marginTop: 20, padding: '12px 28px', background: 'linear-gradient(90deg,var(--teal),var(--blue))', border: 'none', borderRadius: 12, color: '#fff', fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
              + Add My Status
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

      {/* Add Status Modal */}
      {showAdd && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(5,13,26,.9)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)' }}>
          <div style={{ background: 'var(--bg-card)', border: '1.5px solid var(--border)', borderRadius: 24, padding: 28, width: 400, boxShadow: 'var(--shadow)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700 }}>📸 Add Status</div>
              <button onClick={() => setShowAdd(false)} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', fontSize: 22, cursor: 'pointer' }}>✕</button>
            </div>

            {/* Preview */}
            <div style={{ height: 160, borderRadius: 16, background: newStatus.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, padding: 20, position: 'relative', overflow: 'hidden' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: '#fff', textAlign: 'center', textShadow: '0 2px 8px rgba(0,0,0,.3)', zIndex: 1 }}>
                {newStatus.content || 'Your status text…'}
              </div>
            </div>

            {/* BG selector */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {BG_OPTIONS.map((bg, i) => (
                <div key={i} onClick={() => setNewStatus(s => ({ ...s, bg }))} style={{ width: 32, height: 32, borderRadius: '50%', background: bg, cursor: 'pointer', border: newStatus.bg === bg ? '3px solid #fff' : '3px solid transparent', transition: 'all .2s' }} />
              ))}
            </div>

            <textarea
              value={newStatus.content}
              onChange={e => setNewStatus(s => ({ ...s, content: e.target.value }))}
              placeholder="What's on your mind?"
              rows={3}
              style={{ width: '100%', background: 'rgba(255,255,255,.06)', border: '1.5px solid var(--border2)', borderRadius: 12, padding: 12, color: 'var(--text)', fontSize: 14, fontFamily: 'var(--font-body)', outline: 'none', resize: 'none', marginBottom: 16 }}
              onFocus={e => e.target.style.borderColor = 'var(--teal)'}
              onBlur={e => e.target.style.borderColor = 'var(--border2)'}
            />

            <button onClick={postStatus} disabled={loading || !newStatus.content.trim()} style={{ width: '100%', padding: 14, background: 'linear-gradient(90deg,var(--teal),var(--blue))', border: 'none', borderRadius: 14, color: '#fff', fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
              {loading ? 'Posting…' : 'Post Status 🚀'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusViewer({ status, user, total, current, onNext, onPrev, onClose }) {
  const [reply, setReply] = useState('');

  return (
    <div style={{ width: '100%', height: '100%', background: status?.bg || 'linear-gradient(135deg,var(--teal),var(--blue))', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {/* Progress bars */}
      <div style={{ display: 'flex', gap: 4, padding: '16px 16px 8px' }}>
        {Array.from({ length: total }).map((_, i) => (
          <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= current ? 'rgba(255,255,255,.9)' : 'rgba(255,255,255,.3)' }} />
        ))}
      </div>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 16px 16px' }}>
        <Avatar name={user?.name} src={user?.avatar} size={38} />
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: '#fff', fontSize: 15 }}>{user?.name}</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,.7)' }}>{formatAgo(status?.createdAt)}</div>
        </div>
        <button onClick={onClose} style={{ marginLeft: 'auto', background: 'rgba(255,255,255,.2)', border: 'none', borderRadius: '50%', width: 32, height: 32, color: '#fff', fontSize: 16, cursor: 'pointer' }}>✕</button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, color: '#fff', textAlign: 'center', textShadow: '0 2px 12px rgba(0,0,0,.4)', lineHeight: 1.4 }}>
          {status?.content}
        </div>
      </div>

      {/* Nav areas */}
      <div onClick={onPrev} style={{ position: 'absolute', top: 80, bottom: 80, left: 0, width: '35%', cursor: current > 0 ? 'pointer' : 'default' }} />
      <div onClick={onNext} style={{ position: 'absolute', top: 80, bottom: 80, right: 0, width: '35%', cursor: 'pointer' }} />

      {/* Reply */}
      <div style={{ padding: '12px 16px 20px', display: 'flex', gap: 10 }}>
        <input value={reply} onChange={e => setReply(e.target.value)} placeholder={`Reply to ${user?.name}…`}
          style={{ flex: 1, background: 'rgba(255,255,255,.2)', border: '1.5px solid rgba(255,255,255,.3)', borderRadius: 30, padding: '11px 18px', color: '#fff', fontSize: 14, outline: 'none', fontFamily: 'var(--font-body)' }}
          onFocus={e => e.target.style.borderColor = 'rgba(255,255,255,.8)'}
          onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,.3)'}
        />
        <button style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,.2)', border: 'none', fontSize: 20, cursor: 'pointer' }}>❤️</button>
        <button style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,.2)', border: 'none', fontSize: 20, cursor: 'pointer' }}>➤</button>
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
