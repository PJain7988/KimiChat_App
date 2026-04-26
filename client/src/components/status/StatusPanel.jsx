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
];

export default function StatusPanel() {
  const { user } = useAuthStore();
  const [statusGroups, setStatusGroups] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newStatus, setNewStatus] = useState({
    type: 'text',
    content: '',
    bg: BG_OPTIONS[0],
    filter: 'none',
  });

  const fetchStatuses = async () => {
    try {
      const res = await api.get('/status');
      if (res.data.success) setStatusGroups(res.data.statusGroups || []);
    } catch (err) {}
  };

  useEffect(() => {
    fetchStatuses();
  }, []);

  const handlePost = async () => {
    if (!newStatus.content.trim()) return;
    try {
      await api.post('/status', newStatus);
      toast.success('Status posted!');
      setShowAdd(false);
      setNewStatus({ ...newStatus, content: '' });
      fetchStatuses();
    } catch (err) {
      toast.error('Failed to post status');
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#050d1a]">
      {/* Header */}
      <header className="h-[72px] px-6 flex items-center justify-between border-b border-[rgba(255,255,255,0.07)] bg-[#0a1628] shrink-0">
        <h2 className="text-xl font-bold font-display">Status</h2>
        <button 
          onClick={() => setShowAdd(true)}
          className="p-2 bg-[rgba(0,201,177,0.1)] text-[var(--teal)] rounded-xl hover:bg-[var(--teal)] hover:text-black transition-all"
        >
          Post Update
        </button>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* My Status */}
        <div className="flex items-center gap-4 p-4 bg-[#0a1628] rounded-2xl border border-[rgba(255,255,255,0.05)]">
          <Avatar name={user?.name} src={user?.avatar} size={56} online={true} />
          <div className="flex-1">
            <div className="font-bold">My Status</div>
            <div className="text-xs text-[var(--text-dim)]">Tap to update</div>
          </div>
        </div>

        {/* List */}
        <div className="space-y-4">
          <h3 className="text-[10px] font-bold text-[var(--text-dim)] uppercase tracking-widest px-2">Recent Updates</h3>
          <div className="space-y-2">
            {statusGroups.map((group, idx) => (
              <div key={idx} className="flex items-center gap-4 p-3 hover:bg-[rgba(255,255,255,0.03)] rounded-2xl transition-all border border-transparent hover:border-[rgba(0,201,177,0.1)]">
                <div className="p-0.5 rounded-full border-2 border-[var(--teal)]">
                  <Avatar name={group.user?.name} src={group.user?.avatar} size={52} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold truncate">{group.user?.name}</div>
                  <div className="text-xs text-[var(--text-dim)]">{new Date(group.statuses[0]?.createdAt).toLocaleTimeString()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ADD STATUS MODAL (RESTORING ORIGINAL LOGIC) */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-[#0a1628] rounded-[32px] p-8 space-y-6 border border-[rgba(255,255,255,0.1)] shadow-2xl">
            <h3 className="text-xl font-bold">New Status</h3>
            
            <div 
              className="h-48 rounded-2xl p-6 flex items-center justify-center text-center shadow-inner relative overflow-hidden"
              style={{ background: newStatus.bg, filter: FILTERS.find(f => f.id === newStatus.filter)?.css }}
            >
              <textarea 
                value={newStatus.content}
                onChange={e => setNewStatus({...newStatus, content: e.target.value})}
                placeholder="What's on your mind?"
                className="bg-transparent w-full text-white font-bold text-lg text-center outline-none placeholder:text-white/60 resize-none"
                rows={3}
              />
            </div>

            {/* Background Picker */}
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-[var(--text-dim)] uppercase tracking-widest">Background</label>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {BG_OPTIONS.map(bg => (
                  <button 
                    key={bg} 
                    onClick={() => setNewStatus({...newStatus, bg})}
                    className={`w-8 h-8 rounded-full shrink-0 border-2 transition-all ${newStatus.bg === bg ? 'border-white scale-110' : 'border-transparent'}`}
                    style={{ background: bg }}
                  />
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button onClick={() => setShowAdd(false)} className="flex-1 py-3 bg-[rgba(255,255,255,0.05)] text-[var(--text-dim)] font-bold rounded-xl">Cancel</button>
              <button onClick={handlePost} className="flex-2 py-3 bg-[var(--teal)] text-black font-bold rounded-xl shadow-lg shadow-[rgba(0,201,177,0.2)]">Post Status</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}