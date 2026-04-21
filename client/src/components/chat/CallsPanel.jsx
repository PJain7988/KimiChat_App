import React, { useState, useMemo } from 'react';
import Avatar from '../ui/Avatar';
import useChatStore from '../../context/chatStore';

/**
 * CallsPanel Component - Displays call history
 * WhatsApp style call log interface
 */
export default function CallsPanel({ onStartCall }) {
  const { callLogs: logs } = useChatStore();

  const [filter, setFilter] = useState('all'); // all | missed

  const filteredLogs = useMemo(() => {
    if (filter === 'missed') {
      return logs.filter(l => l.status === 'missed');
    }
    return logs;
  }, [logs, filter]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      height: '100%',
      background: 'var(--bg-dark)',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        padding: '20px 24px',
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
            Calls
          </h1>
          <div style={{ display: 'flex', gap: 8 }}>
            <button 
              onClick={() => setFilter('all')}
              style={{
                padding: '6px 16px',
                borderRadius: 20,
                border: 'none',
                background: filter === 'all' ? 'var(--teal-glow)' : 'transparent',
                color: filter === 'all' ? 'var(--teal)' : 'var(--text-dim)',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}>All</button>
            <button 
              onClick={() => setFilter('missed')}
              style={{
                padding: '6px 16px',
                borderRadius: 20,
                border: 'none',
                background: filter === 'missed' ? 'rgba(255,68,68,0.1)' : 'transparent',
                color: filter === 'missed' ? 'var(--red)' : 'var(--text-dim)',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}>Missed</button>
          </div>
        </div>
      </div>

      {/* List */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '12px 0'
      }}>
        {filteredLogs.length > 0 ? (
          <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 24px' }}>
            {filteredLogs.map((log, i) => (
              <CallRow key={i} log={log} onStartCall={onStartCall} />
            ))}
          </div>
        ) : (
          <div style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-dim)',
            textAlign: 'center',
            padding: 40
          }}>
            <div style={{ fontSize: 64, marginBottom: 20 }}>📞</div>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 10px 0', color: 'var(--text)' }}>No call history</h2>
            <p style={{ maxWidth: 300, fontSize: 14 }}>Calls you make or receive will show up here, just like on your mobile.</p>
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
