import React, { useState, useEffect } from 'react';
import useAuthStore from '../../context/authStore';
import api from '../../utils/api';
import Avatar from '../ui/Avatar';
import { toast } from 'react-hot-toast';

const BG_OPTIONS = [
  'linear-gradient(135deg,#00c9b1,#1a8cff)',
  'linear-gradient(135deg,#7c5cfc,#ff4fa3)',
  'linear-gradient(135deg,#ffb830,#ff4fa3)',
  'linear-gradient(135deg,#ff6b35,#ffb830)',
];

export default function StatusPanel() {
  const { user } = useAuthStore();
  const [statusGroups, setStatusGroups] = useState([]);
  const [viewing, setViewing] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [content, setContent] = useState('');
  const [bg, setBg] = useState(BG_OPTIONS[0]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchStatuses();
  }, []);

  const fetchStatuses = async () => {
    try {
      const res = await api.get('/status');
      if (res.data.success) setStatusGroups(res.data.statusGroups || []);
    } catch (err) {
      toast.error('Failed to load statuses');
    }
  };

  const postStatus = async () => {
    if (!content.trim()) return toast.error('Add some content!');
    setLoading(true);
    try {
      const res = await api.post('/status', { type: 'text', content, bg });
      if (res.data.success) {
        setShowAdd(false);
        setContent('');
        fetchStatuses();
        toast.success('Status posted! 🚀');
      }
    } catch (err) {
      toast.error('Failed to post status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-1 h-full w-full bg-[#050d1a] overflow-hidden">
      {/* Sidebar List */}
      <div className={`
        w-full md:w-[340px] h-full shrink-0 border-r border-[rgba(255,255,255,0.07)] flex flex-col bg-[#0a1628]
        ${viewing ? 'hidden md:flex' : 'flex'}
      `}>
        <div className="p-6 border-b border-[rgba(255,255,255,0.07)] flex items-center justify-between">
          <h2 className="text-2xl font-bold font-display text-[var(--text)]">Status</h2>
          <button 
            onClick={() => setShowAdd(true)}
            className="w-10 h-10 bg-gradient-to-r from-[var(--teal)] to-[var(--blue)] rounded-xl flex items-center justify-center text-white shadow-lg shadow-[rgba(0,201,177,0.2)]"
          >
            ＋
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* My Status */}
          <div className="space-y-2">
            <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-2">My Status</h3>
            <div 
              onClick={() => setShowAdd(true)}
              className="p-3 rounded-2xl flex items-center gap-4 hover:bg-[rgba(255,255,255,0.05)] cursor-pointer transition-all"
            >
              <div className="relative">
                <Avatar name={user?.name} src={user?.avatar} size={52} />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-[var(--teal)] text-black rounded-full flex items-center justify-center text-sm ring-4 ring-[#0a1628]">＋</div>
              </div>
              <div>
                <div className="font-bold text-[var(--text)]">My Status</div>
                <div className="text-xs text-gray-500">Tap to add an update</div>
              </div>
            </div>
          </div>

          {/* Recent Updates */}
          {statusGroups.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-2">Recent Updates</h3>
              {statusGroups.map((group, i) => (
                <div 
                  key={i}
                  onClick={() => setViewing(group)}
                  className="p-3 rounded-2xl flex items-center gap-4 hover:bg-[rgba(255,255,255,0.05)] cursor-pointer transition-all"
                >
                  <div className="p-[3px] rounded-full ring-2 ring-[var(--teal)]">
                    <Avatar name={group.user?.name} src={group.user?.avatar} size={48} />
                  </div>
                  <div>
                    <div className="font-bold text-[var(--text)]">{group.user?.name}</div>
                    <div className="text-xs text-gray-500">{group.statuses.length} updates</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main View Area */}
      <div className={`
        flex-1 flex flex-col h-full bg-[#050d1a] relative
        ${viewing ? 'flex' : 'hidden md:flex'}
      `}>
        {!viewing ? (
          <div className="flex-1 flex flex-col items-center justify-center opacity-50">
            <div className="text-7xl mb-4">📸</div>
            <h3 className="text-lg font-bold">Select a status to view</h3>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-black/50 p-4">
             <div 
               className="w-full max-w-[450px] aspect-[9/16] rounded-3xl relative overflow-hidden flex items-center justify-center text-center p-8 text-2xl font-bold text-white shadow-2xl"
               style={{ background: viewing.statuses[0].bg }}
             >
               {viewing.statuses[0].content}
               <button 
                 onClick={() => setViewing(null)}
                 className="absolute top-6 right-6 w-10 h-10 bg-black/20 backdrop-blur-lg rounded-full flex items-center justify-center"
               >✕</button>
             </div>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#0a1628] border border-[rgba(255,255,255,0.1)] rounded-[32px] w-full max-w-[500px] p-8 space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold font-display">Create Status</h2>
              <button onClick={() => setShowAdd(false)} className="text-2xl text-gray-500">✕</button>
            </div>

            <textarea 
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's on your mind?"
              className="w-full h-40 bg-white/5 rounded-2xl p-6 text-xl font-bold text-center outline-none focus:ring-2 ring-[var(--teal)/50]"
              style={{ background: bg }}
            />

            <div className="flex gap-3 justify-center">
              {BG_OPTIONS.map((b, i) => (
                <button 
                  key={i} 
                  onClick={() => setBg(b)}
                  className={`w-10 h-10 rounded-full border-2 ${bg === b ? 'border-white' : 'border-transparent'}`}
                  style={{ background: b }}
                />
              ))}
            </div>

            <button 
              onClick={postStatus}
              disabled={loading || !content.trim()}
              className="w-full py-4 bg-gradient-to-r from-[var(--teal)] to-[var(--blue)] rounded-2xl font-bold text-white disabled:opacity-50"
            >
              {loading ? 'Posting...' : 'Post Status 🚀'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}