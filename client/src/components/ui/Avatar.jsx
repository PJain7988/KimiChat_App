import React from 'react';

const COLORS = [
  'var(--teal),var(--blue)',
  'var(--purple),var(--blue)',
  'var(--gold),var(--pink)',
  'var(--pink),var(--purple)',
  '#ff6b35,var(--gold)',
  'var(--teal),var(--purple)',
];

function getColor(name) {
  if (!name) return COLORS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return COLORS[Math.abs(hash) % COLORS.length];
}

export default function Avatar({ name = '', src, size = 40, online, gradient, emoji, fontSize, style = {} }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';
  const bg = gradient ? `linear-gradient(135deg,${gradient})` : `linear-gradient(135deg,${getColor(name)})`;
  const fs = fontSize || Math.max(10, size * 0.38);

  return (
    <div style={{ position: 'relative', flexShrink: 0, width: size, height: size, ...style }}>
      <div style={{
        width: size, height: size, borderRadius: '50%', overflow: 'hidden',
        background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: emoji ? size * 0.48 : fs, fontWeight: 700, color: '#fff',
        flexShrink: 0,
      }}>
        {src ? (
          <img src={src} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none'; }} />
        ) : emoji ? emoji : initials}
      </div>
      {online !== undefined && (
        <div style={{
          position: 'absolute', bottom: 1, right: 1,
          width: Math.max(8, size * 0.22), height: Math.max(8, size * 0.22),
          borderRadius: '50%',
          background: online ? 'var(--green)' : 'var(--text-dim)',
          border: `2px solid var(--bg-card2)`,
        }} />
      )}
    </div>
  );
}
