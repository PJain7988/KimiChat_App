import React, { useState, useMemo } from 'react';
import Avatar from '../ui/Avatar';
import useChatStore from '../../context/chatStore';

 
export default function CallsPanel({ onStartCall }) {
  const { callLogs: logs, clearCallLogs } = useChatStore();

  const [filter, setFilter] = useState('all');  

  const filteredLogs = useMemo(() => {
    if (filter === 'missed') {
      return logs.filter(l => l.status === 'missed');
    }
    return logs;
  }, [logs, filter]);

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-[#050d1a]">
      { }
      <div className="h-[72px] px-6 bg-[#0a1628] border-b border-[rgba(255,255,255,0.07)] flex items-center justify-between shrink-0 sticky top-0 z-10">
        <h1 className="font-display text-xl font-bold text-[var(--text)]">Calls</h1>
        <div className="flex gap-2 items-center">
          <button 
            onClick={() => setFilter('all')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${filter === 'all' ? 'bg-[var(--teal-glow)] text-[var(--teal)]' : 'text-[var(--text-dim)] hover:bg-[rgba(255,255,255,0.05)]'}`}
          >All</button>
          <button 
            onClick={() => setFilter('missed')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${filter === 'missed' ? 'bg-[rgba(255,68,68,0.1)] text-[var(--red)]' : 'text-[var(--text-dim)] hover:bg-[rgba(255,255,255,0.05)]'}`}
          >Missed</button>
          <button 
            onClick={() => {
              if (window.confirm('Clear all call history?')) clearCallLogs();
            }}
            className="px-4 py-1.5 rounded-full border border-[rgba(255,255,255,0.07)] text-xs font-semibold text-[var(--red)] hover:bg-[rgba(255,0,0,0.05)] transition-all ml-2"
          >Clear</button>
        </div>
      </div>

      { }
      <div className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar">
        {filteredLogs.length > 0 ? (
          <div className="max-w-3xl mx-auto space-y-1">
            {filteredLogs.map((log, i) => (
              <CallRow key={i} log={log} onStartCall={onStartCall} />
            ))}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-10 opacity-60">
            <div className="text-6xl mb-6">📞</div>
            <h2 className="text-xl font-bold mb-2 text-[var(--text)]">No call history</h2>
            <p className="max-w-xs text-sm text-[var(--text-dim)]">Calls you make or receive will show up here, just like on your mobile.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function CallRow({ log, onStartCall }) {
  const isIncoming = log.direction === 'incoming';
  const isMissed = log.status === 'missed';
  
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      padding: '12px 0',
      borderBottom: '1px solid var(--border2)',
      transition: 'all 0.2s'
    }}>
      <Avatar 
        name={log.user.name} 
        src={log.user.avatar} 
        size={48} 
        online={log.user.isOnline}
      />
      
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ 
          fontWeight: 600, 
          fontSize: 15, 
          color: isMissed ? 'var(--red)' : 'var(--text)',
          display: 'flex',
          alignItems: 'center',
          gap: 6
        }}>
          {log.user.name}
          {log.type === 'video' ? '📹' : '📞'}
        </div>
        <div style={{ 
          fontSize: 12, 
          color: 'var(--text-dim)',
          display: 'flex', 
          alignItems: 'center',
          gap: 4,
          marginTop: 2
        }}>
          <span style={{ 
            color: isMissed ? 'var(--red)' : (isIncoming ? 'var(--green)' : 'var(--blue)'),
            fontSize: 14
          }}>
            {isIncoming ? '↙' : '↗'}
          </span>
          {isIncoming ? 'Incoming' : 'Outgoing'} • {new Date(log.timestamp).toLocaleString()}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button 
          onClick={() => onStartCall(log.user, 'audio')}
          style={{
            width: 36, height: 36, borderRadius: '50%', border: 'none',
            background: 'var(--bg-card2)', color: 'var(--teal)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>📞</button>
        <button 
          onClick={() => onStartCall(log.user, 'video')}
          style={{
            width: 36, height: 36, borderRadius: '50%', border: 'none',
            background: 'var(--bg-card2)', color: 'var(--purple)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>📹</button>
      </div>
    </div>
  );
}
