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
    <div className="flex flex-col h-full bg-[#050d1a]">
      {/* Header */}
      <header className="h-[72px] px-6 bg-[#0a1628] border-b border-[rgba(255,255,255,0.07)] flex items-center justify-between shrink-0">
        <h1 className="text-xl font-bold font-display">Call History</h1>
        <div className="flex gap-2">
          <button 
            onClick={() => setFilter('all')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${filter === 'all' ? 'bg-[var(--teal)] text-black' : 'text-[var(--text-dim)] hover:bg-[rgba(255,255,255,0.05)]'}`}
          >All</button>
          <button 
            onClick={() => setFilter('missed')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${filter === 'missed' ? 'bg-red-500/20 text-red-500' : 'text-[var(--text-dim)] hover:bg-[rgba(255,255,255,0.05)]'}`}
          >Missed</button>
          <button 
            onClick={() => window.confirm('Clear all logs?') && clearCallLogs()}
            className="px-4 py-1.5 rounded-full border border-[rgba(255,68,68,0.2)] text-xs font-bold text-red-500 hover:bg-red-500/10 transition-all"
          >Clear</button>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {filteredLogs.length > 0 ? (
          <div className="max-w-4xl mx-auto space-y-1">
            {filteredLogs.map((log, i) => (
              <CallRow key={i} log={log} onStartCall={onStartCall} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full opacity-40 gap-4">
            <span className="text-6xl">📞</span>
            <p className="text-sm font-medium">No recent calls found</p>
          </div>
        )}
      </div>
    </div>
  );
}

function CallRow({ log, onStartCall }) {
  const isMissed = log.status === 'missed';
  return (
    <div className="flex items-center gap-4 p-4 hover:bg-[rgba(255,255,255,0.03)] rounded-2xl transition-all border-b border-[rgba(255,255,255,0.05)] last:border-0">
      <Avatar name={log.user?.name} src={log.user?.avatar} size={48} online={log.user?.isOnline} />
      <div className="flex-1 min-w-0">
        <div className={`font-bold flex items-center gap-2 ${isMissed ? 'text-red-500' : 'text-[var(--text)]'}`}>
          {log.user?.name}
          <span>{log.type === 'video' ? '📹' : '📞'}</span>
        </div>
        <div className="text-xs text-[var(--text-dim)] flex items-center gap-2 mt-1">
          <span className={isMissed ? 'text-red-500/70' : 'text-teal-400/70'}>
            {log.direction === 'incoming' ? '↙ Incoming' : '↗ Outgoing'}
          </span>
          <span>•</span>
          <span>{new Date(log.createdAt).toLocaleString()}</span>
        </div>
      </div>
      <button 
        onClick={() => onStartCall?.(log.user, log.type)}
        className="w-10 h-10 flex items-center justify-center bg-[rgba(255,255,255,0.05)] hover:bg-[var(--teal)] hover:text-black rounded-xl transition-all"
      >
        {log.type === 'video' ? '📹' : '📞'}
      </button>
    </div>
  );
}
