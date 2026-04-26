import React, { useState, useMemo } from 'react';
import Avatar from '../ui/Avatar';
import useChatStore from '../../context/chatStore';

export default function CallsPanel({ onStartCall }) {
  const { callLogs: logs, clearCallLogs } = useChatStore();
  const [filter, setFilter] = useState('all');

  const filteredLogs = useMemo(() => {
    if (filter === 'missed') return logs.filter(l => l.status === 'missed');
    return logs;
  }, [logs, filter]);

  return (
    <div className="flex flex-col h-full w-full bg-[#050d1a] overflow-hidden">
      {/* Header */}
      <div className="h-[72px] px-6 bg-[#0a1628] border-b border-[rgba(255,255,255,0.07)] flex items-center justify-between shrink-0 sticky top-0 z-10">
        <h1 className="font-display text-xl font-bold text-[var(--text)]">Call History</h1>
        <div className="flex gap-2 items-center">
          {['all', 'missed'].map(f => (
            <button 
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all uppercase tracking-widest ${filter === f ? 'bg-[var(--teal)] text-black' : 'bg-white/5 text-gray-500 hover:text-gray-300'}`}
            >
              {f}
            </button>
          ))}
          <button 
            onClick={() => window.confirm('Clear history?') && clearCallLogs()}
            className="px-4 py-1.5 rounded-full text-xs font-bold text-red-500 hover:bg-red-500/10 transition-all uppercase tracking-widest ml-2"
          >
            Clear
          </button>
        </div>
      </div>

      {/* List Area */}
      <div className="flex-1 overflow-y-auto px-6 py-4 no-scrollbar">
        {filteredLogs.length > 0 ? (
          <div className="max-w-3xl mx-auto space-y-1 animate-fade-in">
            {filteredLogs.map((log, i) => (
              <div key={i} className="flex items-center gap-4 py-4 border-b border-white/5 hover:bg-white/2 transition-all group px-2 rounded-2xl">
                <Avatar name={log.user.name} src={log.user.avatar} size={52} />
                <div className="flex-1 min-w-0">
                  <div className={`font-bold flex items-center gap-2 ${log.status === 'missed' ? 'text-red-400' : 'text-gray-200'}`}>
                    {log.user.name} {log.type === 'video' ? '📹' : '📞'}
                  </div>
                  <div className="text-xs text-gray-500 flex items-center gap-2 mt-1">
                    <span className={log.direction === 'incoming' ? 'text-green-500' : 'text-blue-500'}>
                      {log.direction === 'incoming' ? '↙' : '↗'}
                    </span>
                    {log.direction} • {new Date(log.timestamp).toLocaleTimeString()}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => onStartCall(log.user, 'audio')} className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center hover:bg-[var(--teal)] hover:text-black transition-all">📞</button>
                  <button onClick={() => onStartCall(log.user, 'video')} className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center hover:bg-purple-500 hover:text-white transition-all">📹</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center opacity-40 text-center space-y-4">
            <div className="text-7xl">📞</div>
            <div className="space-y-1">
              <h2 className="text-lg font-bold">No calls yet</h2>
              <p className="text-xs max-w-[200px]">Your voice and video call history will appear here.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
