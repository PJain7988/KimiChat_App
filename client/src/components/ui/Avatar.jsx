import React, { useState } from 'react';

const COLORS = [
  'var(--teal),var(--blue)',
  'var(--purple),var(--blue)',
  'var(--gold),var(--pink)',
  'var(--pink),var(--purple)',
  '#ff6b35,var(--gold)',
  'var(--teal),var(--purple)',
];

/**
 * Get consistent color based on name
 * ✅ Fixed: Better hash function, consistent colors
 */
function getColor(name) {
  if (!name || typeof name !== 'string') return COLORS[0];
  
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    const char = name.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  return COLORS[Math.abs(hash) % COLORS.length];
}

/**
 * Avatar Component - Display user profile pictures
 * ✅ Fixed: Image display, error handling, responsive, accessibility
 */
export default function Avatar({
  name = 'User',
  src = null,
  size = 40,
  online = undefined,
  gradient = null,
  emoji = null,
  fontSize = null,
  style = {},
  className = '',
  alt = '',
  onClick = null,
  title = ''
}) {
  // ✅ FIX: Track image loading state
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // ✅ FIX: Reset states when src changes to allow fresh loading
  React.useEffect(() => {
    setImageLoaded(false);
    setImageError(false);
  }, [src]);

  // ✅ FIX: Safely get initials
  const initials = React.useMemo(() => {
    if (!name || typeof name !== 'string') return '?';
    return name
      .trim()
      .split(' ')
      .filter(Boolean)
      .map(w => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || '?';
  }, [name]);

  // ✅ FIX: Choose background based on image availability
  const bg = src && imageLoaded && !imageError
    ? 'transparent' // Will use image
    : gradient
    ? `linear-gradient(135deg, ${gradient})`
    : `linear-gradient(135deg, ${getColor(name)})`;

  // ✅ FIX: Responsive font size
  const fs = fontSize || Math.max(8, size * 0.38);
  const onlineIndicatorSize = Math.max(6, size * 0.22);

  // ✅ FIX: Handle image load
  const handleImageLoad = () => {
    setImageLoaded(true);
    setImageError(false);
  };

  // ✅ FIX: Handle image error gracefully
  const handleImageError = () => {
    setImageLoaded(false);
    setImageError(true);
  };

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        flexShrink: 0,
        width: size,
        height: size,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.2s ease',
        ...style
      }}
      onClick={onClick}
      title={title || name}
      role="img"
      aria-label={alt || name || 'Avatar'}
    >
      {/* Main Avatar Circle */}
      <div
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          overflow: 'hidden',
          background: bg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: emoji ? size * 0.48 : fs,
          fontWeight: 700,
          color: '#fff',
          flexShrink: 0,
          position: 'relative',
          textShadow: src && imageLoaded ? 'none' : '0 2px 4px rgba(0,0,0,0.2)',
          transition: 'background 0.3s ease'
        }}
      >
        {/* ✅ FIX: Image with proper error handling */}
        {src && !imageError ? (
          <img
            src={src}
            alt={alt || name}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center',
              display: imageLoaded ? 'block' : 'none',
              opacity: imageLoaded ? 1 : 0,
              transition: 'opacity 0.3s ease'
            }}
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
        ) : null}

        {/* ✅ FIX: Fallback content - show only if image not loaded */}
        {!imageLoaded && (
          <span style={{
            position: 'relative',
            zIndex: 1,
            textShadow: '0 2px 4px rgba(0,0,0,0.2)'
          }}>
            {emoji || initials}
          </span>
        )}
      </div>

      {/* ✅ FIX: Online status indicator */}
      {online !== undefined && (
        <div
          style={{
            position: 'absolute',
            bottom: Math.max(0, size * 0.04),
            right: Math.max(0, size * 0.04),
            width: onlineIndicatorSize,
            height: onlineIndicatorSize,
            borderRadius: '50%',
            background: online ? 'var(--green, #22c55e)' : 'var(--text-dim, #6b7280)',
            border: `2px solid var(--bg-card2, #1e293b)`,
            boxShadow: '0 0 0 1px var(--bg-dark, #0f172a)',
            transition: 'background 0.2s ease'
          }}
          title={online ? 'Online' : 'Offline'}
        />
      )}
    </div>
  );
}
