import React, { useState, useEffect } from 'react';
import useAuthStore from '../../context/authStore';
import api from '../../utils/api';
import Avatar from '../ui/Avatar';
import { toast } from 'react-hot-toast';
import { getMediaUrl } from '../../utils/mediaUtils';

const FILTERS = [
  { name: 'None', id: 'none', css: 'none' },
  { name: 'Vivid', id: 'vivid', css: 'contrast(1.2) saturate(1.3)' },
  { name: 'Cool', id: 'cool', css: 'hue-rotate(200deg) saturate(0.8)' },
  { name: 'Warm', id: 'warm', css: 'hue-rotate(-20deg) saturate(1.2)' },
  { name: 'B&W', id: 'bw', css: 'grayscale(1)' },
  { name: 'Sepia', id: 'sepia', css: 'sepia(0.8)' },
];

export default function StatusPanel() {
  const { user } = useAuthStore();
  const [statusGroups, setStatusGroups] = useState([]);
  const [viewing, setViewing] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchStatuses();
  }, []);

  const fetchStatuses = async () => {
    try {
      const res = await api.get('/status');
      if (res.data.success) setStatusGroups(res.data.statusGroups || []);
    } catch (err) {}
  };

  return (
    <div className="flex flex-col h-full bg-[#050d1a]">
      {/* Header */}
      <header className="h-[72px] px-6 flex items-center border-b border-[rgba(255,255,255,0.07)] bg-[#0a1628] shrink-0">
        <h2 className="text-xl font-bold font-display">Status Updates</h2>
      </header>

      {/* Status Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* My Status */}
        <div className="flex items-center gap-4 p-4 bg-[#0a1628] rounded-2xl border border-[rgba(255,255,255,0.05)]">
          <div className="relative">
            <Avatar name={user?.name} src={user?.avatar} size={56} />
            <div className="absolute bottom-0 right-0 w-5 h-5 bg-[var(--teal)] rounded-full flex items-center justify-center text-black font-bold border-2 border-[#0a1628]">+</div>
          </div>
          <div>
            <div className="font-bold">My Status</div>
            <div className="text-sm text-[var(--text-dim)]">Tap to add an update</div>
          </div>
        </div>

        {/* Recent Updates */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-[var(--text-dim)] uppercase tracking-wider px-2">Recent Updates</h3>
          <div className="space-y-2">
            {statusGroups.map((group, idx) => (
              <div 
                key={idx}
                onClick={() => setViewing(group)}
                className="flex items-center gap-4 p-3 hover:bg-[rgba(255,255,255,0.03)] rounded-2xl cursor-pointer transition-all border border-transparent hover:border-[rgba(0,201,177,0.1)]"
              >
                <div className="p-[2px] rounded-full border-2 border-[var(--teal)]">
                  <Avatar name={group.user?.name} src={group.user?.avatar} size={52} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold truncate">{group.user?.name}</div>
                  <div className="text-xs text-[var(--text-dim)]">
                    {new Date(group.statuses[0]?.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}