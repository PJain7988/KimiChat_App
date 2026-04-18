import React, { useState, useEffect, useRef, useCallback } from 'react';
import useChatStore from '../../context/chatStore';
import useAuthStore from '../../context/authStore';
import { getSocket } from '../../utils/socket';
import api from '../../utils/api';
import Avatar from '../ui/Avatar';
import MessageBubble from './MessageBubble';
import ChatList from './ChatList';
import ContactProfile from './ContactProfile';
import { toast } from 'sonner';
// ─────────────────────────────────────────────────────────────────
// EMOJI DATA — 8 categories, 200+ emojis
// ─────────────────────────────────────────────────────────────────
const EMOJI_CATEGORIES = [
  {
    id: 'smileys', label: '😊', title: 'Smileys & People',
    emojis: [
      '😀','😁','😂','🤣','😃','😄','😅','😆','😉','😊','😋','😎','😍','🥰','😘',
      '😗','😙','😚','🙂','🤗','🤩','🤔','🤨','😐','😑','😶','🙄','😏','😣','😥',
      '😮','🤐','😯','😪','😫','🥱','😴','😌','😛','😜','😝','🤤','😒','😓','😔',
      '😕','🙃','🤑','😲','☹️','🙁','😖','😞','😟','😤','😢','😭','😦','😧','😨',
      '😩','🤯','😬','😰','😱','🥵','🥶','😳','🤪','😵','🥴','😠','😡','🤬','😷',
      '🤒','🤕','🤢','🤮','🤧','😇','🥳','🥸','🤠','🥺','👻','💀','☠️','👽','🤖',
    ],
  },
  {
    id: 'gestures', label: '👋', title: 'Gestures & Body',
    emojis: [
      '👋','🤚','🖐️','✋','🖖','👌','🤌','🤏','✌️','🤞','🤟','🤘','🤙','👈','👉',
      '👆','🖕','👇','☝️','👍','👎','✊','👊','🤛','🤜','👏','🙌','👐','🤲','🤝',
      '🙏','✍️','💅','🤳','💪','🦾','🦵','🦶','👂','🦻','👃','👀','👁️','👅','👄',
    ],
  },
  {
    id: 'animals', label: '🐶', title: 'Animals & Nature',
    emojis: [
      '🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷','🐸','🐵',
      '🙈','🙉','🙊','🐔','🐧','🐦','🐤','🦆','🦅','🦉','🦇','🐺','🐗','🐴','🦄',
      '🐝','🐛','🦋','🐌','🐞','🐜','🦟','🦗','🦂','🐢','🐍','🦎','🐙','🦑','🦐',
      '🦞','🦀','🐡','🐠','🐟','🐬','🐳','🐋','🦈','🐊','🐆','🐅','🦓','🦍','🦧',
    ],
  },
  {
    id: 'food', label: '🍕', title: 'Food & Drink',
    emojis: [
      '🍕','🍔','🌮','🌯','🥗','🍜','🍝','🍛','🍣','🍱','🍤','🍙','🍚','🍘','🍥',
      '🥮','🍢','🧆','🥚','🍳','🥞','🧇','🥓','🥩','🍗','🍖','🌭','🍟','🧀','🥪',
      '🍦','🍧','🍨','🍩','🍪','🎂','🍰','🧁','🥧','🍫','🍬','🍭','🍮','🍯','🍷',
      '🍸','🍹','🧉','🍺','🍻','🥂','🥃','🧃','🧋','☕','🍵','🧊','🥤','🍶','🍾',
    ],
  },
  {
    id: 'travel', label: '🚀', title: 'Travel & Places',
    emojis: [
      '🚗','🚕','🚙','🚌','🏎️','🚓','🚑','🚒','🛻','🚚','🚜','🏍️','🛵','🚲','🛴',
      '🛹','⛵','🚤','🛥️','🛳️','⛴️','🚢','✈️','🛩️','🛫','🛬','🪂','💺','🚁','🚀',
      '🛸','🎡','🎢','🎠','🌍','🌎','🌏','🌐','🗺️','🧭','🏔️','⛰️','🌋','🗻','🏕️',
      '🏖️','🏜️','🏝️','🏟️','🏛️','🏗️','🧱','🏘️','🏚️','🏠','🏡','🏢','🏣','🏤','🏥',
    ],
  },
  {
    id: 'objects', label: '💡', title: 'Objects',
    emojis: [
      '💡','🔦','🕯️','💰','💎','⚖️','🔑','🗝️','🔨','🪓','⛏️','🛠️','🔧','🔩','⚙️',
      '🔗','⛓️','🪝','🧲','🪜','🧱','🪞','🪟','🛋️','🪑','🚽','🚿','🛁','🧴','🧷',
      '🧹','🧺','🧻','🪣','🧼','🪥','🧽','🪒','🧯','🛒','📦','📫','📬','📭','📮',
      '📓','📔','📒','📕','📗','📘','📙','📚','📖','🔖','💰','💵','💸','💳','🧾',
    ],
  },
  {
    id: 'symbols', label: '❤️', title: 'Symbols & Hearts',
    emojis: [
      '❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❣️','💕','💞','💓','💗',
      '💖','💘','💝','💟','☮️','✝️','☯️','✡️','🔯','☸️','♻️','✅','❌','⭕','🛑',
      '⛔','📛','🚫','💯','💢','♨️','🔞','📵','🔕','⚠️','🔰','🆚','💮','🉐','㊙️',
      '⁉️','❓','❔','❕','‼️','🔃','🔄','🔙','🔚','🔛','🔜','🔝','⚡','🌟','💫',
    ],
  },
  {
    id: 'activities', label: '⚽', title: 'Activities & Sports',
    emojis: [
      '⚽','🏀','🏈','⚾','🥎','🎾','🏐','🏉','🥏','🎱','🪀','🏓','🏸','🏒','🥊',
      '🥋','🎽','🛹','🛼','🛷','⛸️','🥌','🎿','⛷️','🏂','🪂','🏋️','🤼','🤸','⛹️',
      '🤺','🏇','🧘','🏄','🏊','🤽','🚣','🧗','🚵','🚴','🏆','🥇','🥈','🥉','🎖️',
      '🎗️','🎫','🎟️','🎪','🤹','🎭','🩰','🎨','🖼️','🎬','🎤','🎧','🎼','🎵','🎶',
    ],
  },
];

// ─────────────────────────────────────────────────────────────────
// STICKER PACKS
// ─────────────────────────────────────────────────────────────────
const STICKER_PACKS = [
  {
    id: 'reactions', label: '🎭', title: 'Reactions',
    stickers: [
      { id: 's1',  emoji: '😂', label: 'LOL',        bg: '#FFE566' },
      { id: 's2',  emoji: '😍', label: 'Love it!',   bg: '#FFB3C1' },
      { id: 's3',  emoji: '🔥', label: 'Fire!',      bg: '#FF7043' },
      { id: 's4',  emoji: '💯', label: '100%',       bg: '#69F0AE' },
      { id: 's5',  emoji: '👏', label: 'Clap!',      bg: '#B39DDB' },
      { id: 's6',  emoji: '🤯', label: 'Mind blown', bg: '#F48FB1' },
      { id: 's7',  emoji: '😎', label: 'Cool!',      bg: '#80DEEA' },
      { id: 's8',  emoji: '🥳', label: 'Party!',     bg: '#FFF176' },
      { id: 's9',  emoji: '😭', label: 'Crying',     bg: '#90CAF9' },
      { id: 's10', emoji: '🤣', label: 'ROFL',       bg: '#A5D6A7' },
      { id: 's11', emoji: '❤️', label: 'Love',       bg: '#EF9A9A' },
      { id: 's12', emoji: '✨', label: 'Wow!',       bg: '#CE93D8' },
    ],
  },
  {
    id: 'animals', label: '🐾', title: 'Animals',
    stickers: [
      { id: 'a1',  emoji: '🐶', label: 'Doggo',     bg: '#FFCC80' },
      { id: 'a2',  emoji: '🐱', label: 'Kitty',     bg: '#F8BBD9' },
      { id: 'a3',  emoji: '🐸', label: 'Froggy',    bg: '#C8E6C9' },
      { id: 'a4',  emoji: '🦊', label: 'Fox',       bg: '#FFAB91' },
      { id: 'a5',  emoji: '🐼', label: 'Panda',     bg: '#CFD8DC' },
      { id: 'a6',  emoji: '🦄', label: 'Unicorn',   bg: '#E1BEE7' },
      { id: 'a7',  emoji: '🐨', label: 'Koala',     bg: '#B0BEC5' },
      { id: 'a8',  emoji: '🦁', label: 'Lion',      bg: '#FFE082' },
      { id: 'a9',  emoji: '🐧', label: 'Penguin',   bg: '#B3E5FC' },
      { id: 'a10', emoji: '🐻', label: 'Bear',      bg: '#D7CCC8' },
      { id: 'a11', emoji: '🦋', label: 'Butterfly', bg: '#B2EBF2' },
      { id: 'a12', emoji: '🐙', label: 'Octopus',   bg: '#F48FB1' },
    ],
  },
  {
    id: 'vibes', label: '🌈', title: 'Good Vibes',
    stickers: [
      { id: 'v1',  emoji: '🌈', label: 'Rainbow', bg: '#FFF9C4' },
      { id: 'v2',  emoji: '⭐', label: 'Star',    bg: '#FFF176' },
      { id: 'v3',  emoji: '🌸', label: 'Blossom', bg: '#FCE4EC' },
      { id: 'v4',  emoji: '🍀', label: 'Lucky',   bg: '#DCEDC8' },
      { id: 'v5',  emoji: '🎉', label: 'Party',   bg: '#F8BBD9' },
      { id: 'v6',  emoji: '🎵', label: 'Music',   bg: '#E8EAF6' },
      { id: 'v7',  emoji: '💫', label: 'Dizzy',   bg: '#E3F2FD' },
      { id: 'v8',  emoji: '🌊', label: 'Wave',    bg: '#B3E5FC' },
      { id: 'v9',  emoji: '🌙', label: 'Moon',    bg: '#EDE7F6' },
      { id: 'v10', emoji: '☀️', label: 'Sun',     bg: '#FFF8E1' },
      { id: 'v11', emoji: '🌺', label: 'Flower',  bg: '#FCE4EC' },
      { id: 'v12', emoji: '🎸', label: 'Guitar',  bg: '#F3E5F5' },
    ],
  },
  {
    id: 'food', label: '🍔', title: 'Food Mood',
    stickers: [
      { id: 'f1',  emoji: '🍕', label: 'Pizza',    bg: '#FFE0B2' },
      { id: 'f2',  emoji: '🍔', label: 'Burger',   bg: '#D7CCC8' },
      { id: 'f3',  emoji: '🍣', label: 'Sushi',    bg: '#B3E5FC' },
      { id: 'f4',  emoji: '☕', label: 'Coffee',   bg: '#EFEBE9' },
      { id: 'f5',  emoji: '🎂', label: 'Cake',     bg: '#FCE4EC' },
      { id: 'f6',  emoji: '🍩', label: 'Donut',    bg: '#FFF9C4' },
      { id: 'f7',  emoji: '🍦', label: 'Ice cream',bg: '#E8F5E9' },
      { id: 'f8',  emoji: '🌮', label: 'Taco',     bg: '#FFF3E0' },
      { id: 'f9',  emoji: '🍰', label: 'Slice',    bg: '#FCE4EC' },
      { id: 'f10', emoji: '🧁', label: 'Cupcake',  bg: '#EDE7F6' },
      { id: 'f11', emoji: '🍭', label: 'Lollipop', bg: '#F8BBD9' },
      { id: 'f12', emoji: '🥤', label: 'Drink',    bg: '#E3F2FD' },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────
// WHISPER (OpenAI) — audio transcription
// ─────────────────────────────────────────────────────────────────
const OPENAI_KEY = import.meta.env?.VITE_OPENAI_API_KEY || '';

async function transcribeAudio(blob) {
  if (!OPENAI_KEY) return null;
  const form = new FormData();
  form.append('file', blob, 'voice.webm');
  form.append('model', 'whisper-1');
  form.append('language', 'en');
  const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${OPENAI_KEY}` },
    body: form,
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.text || null;
}

// ─────────────────────────────────────────────────────────────────
// MEDIA PICKER — Emoji | GIF | Stickers  (WhatsApp style)
// ─────────────────────────────────────────────────────────────────
function MediaPicker({ onEmoji, onSticker, onClose }) {
  const [tab,         setTab]         = useState('emoji');
  const [emojiCat,    setEmojiCat]    = useState('smileys');
  const [stickerPack, setStickerPack] = useState('reactions');
  const [emojiSearch, setEmojiSearch] = useState('');
  const [recentEmojis, setRecentEmojis] = useState(() => {
    try { return JSON.parse(localStorage.getItem('kc_recent_emojis') || '[]'); }
    catch { return []; }
  });

  const pickEmoji = (em) => {
    const updated = [em, ...recentEmojis.filter(e => e !== em)].slice(0, 24);
    setRecentEmojis(updated);
    localStorage.setItem('kc_recent_emojis', JSON.stringify(updated));
    onEmoji(em);
  };

  // Which emojis to show in grid
  const displayEmojis = emojiSearch.trim()
    ? EMOJI_CATEGORIES.flatMap(c => c.emojis).filter(e => e.includes(emojiSearch))
    : emojiCat === 'recent'
      ? recentEmojis
      : (EMOJI_CATEGORIES.find(c => c.id === emojiCat)?.emojis ?? []);

  const activePack = STICKER_PACKS.find(p => p.id === stickerPack) || STICKER_PACKS[0];

  const TAB_BTN = ({ id, label }) => (
    <button onClick={() => setTab(id)} style={{
      padding: '8px 16px', borderRadius: '10px 10px 0 0', border: 'none',
      background: tab === id ? 'rgba(0,201,177,0.12)' : 'transparent',
      color: tab === id ? 'var(--teal,#00d4c8)' : 'var(--text-dim,#8fa8c8)',
      fontWeight: tab === id ? 700 : 400, fontSize: 13, cursor: 'pointer',
      transition: 'all .2s', fontFamily: 'inherit',
      borderBottom: `2px solid ${tab === id ? 'var(--teal,#00d4c8)' : 'transparent'}`,
    }}>{label}</button>
  );

  return (
    <div style={{
      position: 'absolute', bottom: '100%', left: 0,
      width: 390, maxHeight: 460,
      background: 'var(--bg-card,#111d30)',
      border: '1px solid var(--border2,#1e3050)',
      borderRadius: 18, boxShadow: '0 -10px 48px rgba(0,0,0,0.55)',
      display: 'flex', flexDirection: 'column', overflow: 'hidden', zIndex: 60,
      animation: 'pickerUp .18s ease',
    }}>
      <style>{`
        @keyframes pickerUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .p-emoji:hover  { background:rgba(255,255,255,0.09) !important; transform:scale(1.3); }
        .p-sticker:hover{ transform:scale(1.07); box-shadow:0 6px 20px rgba(0,0,0,0.35) !important; }
        .p-cat:hover    { background:rgba(255,255,255,0.1) !important; }
        .p-chip:hover   { background:rgba(0,201,177,0.2) !important; }
      `}</style>

      {/* ── Top bar ── */}
      <div style={{
        display: 'flex', borderBottom: '1px solid var(--border2,#1e3050)',
        padding: '6px 10px 0', gap: 2, alignItems: 'flex-end', flexShrink: 0,
      }}>
        <TAB_BTN id="emoji"   label="😊 Emoji"    />
        <TAB_BTN id="sticker" label="🎭 Stickers"  />
        <button onClick={onClose} style={{
          marginLeft: 'auto', width: 28, height: 28, borderRadius: '50%',
          border: 'none', background: 'rgba(255,255,255,0.07)',
          color: 'var(--text-dim)', cursor: 'pointer', fontSize: 14,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          alignSelf: 'center', transition: 'all .2s',
        }}
        onMouseEnter={e => { e.currentTarget.style.background='rgba(255,71,87,0.2)'; e.currentTarget.style.color='#ff4757'; }}
        onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,0.07)'; e.currentTarget.style.color='var(--text-dim)'; }}>
          ✕
        </button>
      </div>

      {/* ══════════════ EMOJI TAB ══════════════ */}
      {tab === 'emoji' && (
        <>
          {/* Search */}
          <div style={{ padding: '8px 10px 4px', flexShrink: 0 }}>
            <input
              value={emojiSearch} onChange={e => setEmojiSearch(e.target.value)}
              placeholder="Search emoji…"
              style={{
                width: '100%', background: 'rgba(255,255,255,0.07)',
                border: '1px solid var(--border2,#1e3050)', borderRadius: 10,
                padding: '7px 12px', color: 'var(--text,#e8f0fe)',
                fontSize: 13, outline: 'none', fontFamily: 'inherit',
              }}
              onFocus={e  => e.target.style.borderColor = 'var(--teal,#00d4c8)'}
              onBlur={e   => e.target.style.borderColor = 'var(--border2,#1e3050)'}
            />
          </div>

          {/* Category pills */}
          {!emojiSearch && (
            <div style={{ display: 'flex', gap: 2, padding: '2px 10px 4px', overflowX: 'auto', flexShrink: 0 }}>
              {[{ id: 'recent', label: '🕐' }, ...EMOJI_CATEGORIES.map(c => ({ id: c.id, label: c.label }))].map(c => (
                <button key={c.id} className="p-cat"
                  onClick={() => setEmojiCat(c.id)}
                  style={{
                    flexShrink: 0, width: 34, height: 32, borderRadius: 8,
                    border: 'none',
                    background: emojiCat === c.id ? 'rgba(0,201,177,0.2)' : 'transparent',
                    borderBottom: `2px solid ${emojiCat === c.id ? 'var(--teal,#00d4c8)' : 'transparent'}`,
                    fontSize: 18, cursor: 'pointer', transition: 'all .15s',
                  }}
                >{c.label}</button>
              ))}
            </div>
          )}

          {/* Emoji grid */}
          <div style={{
            flex: 1, overflowY: 'auto', padding: '4px 10px 10px',
            display: 'grid', gridTemplateColumns: 'repeat(8,1fr)', gap: 2,
          }}>
            {displayEmojis.length > 0
              ? displayEmojis.map((em, i) => (
                  <button key={i} className="p-emoji"
                    onClick={() => pickEmoji(em)} title={em}
                    style={{
                      background: 'transparent', border: 'none', fontSize: 22,
                      cursor: 'pointer', padding: '5px 2px', borderRadius: 8,
                      transition: 'all .15s', lineHeight: 1,
                    }}
                  >{em}</button>
                ))
              : (
                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '28px 0', color: 'var(--text-dim)', fontSize: 13 }}>
                  {emojiCat === 'recent' ? '🕐 No recent emojis yet' : 'No results found'}
                </div>
              )
            }
          </div>
        </>
      )}

      {/* ══════════════ STICKER TAB ══════════════ */}
      {tab === 'sticker' && (
        <>
          {/* Pack selector */}
          <div style={{ display: 'flex', gap: 6, padding: '8px 10px 6px', overflowX: 'auto', flexShrink: 0 }}>
            {STICKER_PACKS.map(p => (
              <button key={p.id} onClick={() => setStickerPack(p.id)} style={{
                flexShrink: 0, padding: '5px 12px', borderRadius: 20,
                background: stickerPack === p.id ? 'rgba(0,201,177,0.15)' : 'rgba(255,255,255,0.06)',
                border: `1px solid ${stickerPack === p.id ? 'var(--teal,#00d4c8)' : 'var(--border2,#1e3050)'}`,
                color: stickerPack === p.id ? 'var(--teal,#00d4c8)' : 'var(--text-dim,#8fa8c8)',
                fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .2s',
              }}>{p.label} {p.title}</button>
            ))}
          </div>

          {/* Sticker grid */}
          <div style={{
            flex: 1, overflowY: 'auto', padding: '6px 10px 12px',
            display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8,
          }}>
            {activePack.stickers.map(s => (
              <div key={s.id} className="p-sticker" onClick={() => onSticker(s)} style={{
                background: s.bg, borderRadius: 14,
                padding: '12px 6px 8px', cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                transition: 'transform .2s, box-shadow .2s',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.35)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)'}
              >
                <span style={{ fontSize: 34, lineHeight: 1, pointerEvents: 'none' }}>{s.emoji}</span>
                <span style={{ fontSize: 10, color: 'rgba(0,0,0,0.55)', fontWeight: 700, textAlign: 'center', lineHeight: 1.2, pointerEvents: 'none' }}>
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// AUDIO RECORDER — live waveform + Whisper transcription
// ─────────────────────────────────────────────────────────────────
function AudioRecorder({ onSend, onCancel }) {
  const [phase,      setPhase]      = useState('idle');   // idle | recording | preview | transcribing
  const [duration,   setDuration]   = useState(0);
  const [audioUrl,   setAudioUrl]   = useState(null);
  const [audioBlob,  setAudioBlob]  = useState(null);
  const [transcript, setTranscript] = useState('');
  const [bars,       setBars]       = useState(Array(30).fill(4));
  const [error,      setError]      = useState('');

  const mediaRef    = useRef(null);
  const chunksRef   = useRef([]);
  const timerRef    = useRef(null);
  const animRef     = useRef(null);
  const analyserRef = useRef(null);
  const audioCtxRef = useRef(null);

  // Cleanup on unmount
  useEffect(() => () => {
    cancelAnimationFrame(animRef.current);
    clearInterval(timerRef.current);
    audioCtxRef.current?.close();
  }, []);

  const animateWave = useCallback(() => {
    if (!analyserRef.current) return;
    const buf = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(buf);
    setBars(Array.from({ length: 30 }, (_, i) => {
      const idx = Math.floor((i / 30) * buf.length);
      return Math.max(4, Math.round((buf[idx] / 255) * 48));
    }));
    animRef.current = requestAnimationFrame(animateWave);
  }, []);

  const startRecording = useCallback(async () => {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioCtxRef.current  = new (window.AudioContext || window.webkitAudioContext)();
      const src            = audioCtxRef.current.createMediaStreamSource(stream);
      analyserRef.current  = audioCtxRef.current.createAnalyser();
      analyserRef.current.fftSize = 64;
      src.connect(analyserRef.current);

      chunksRef.current = [];
      const mr = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mr.ondataavailable = e => e.data.size > 0 && chunksRef.current.push(e.data);
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        setPhase('preview');
        stream.getTracks().forEach(t => t.stop());
        cancelAnimationFrame(animRef.current);
        audioCtxRef.current?.close();
        setBars(Array(30).fill(4));
      };
      mr.start(100);
      mediaRef.current = mr;
      setPhase('recording');
      setDuration(0);
      timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
      animRef.current  = requestAnimationFrame(animateWave);
    } catch {
      setError('Microphone access denied. Please allow microphone in browser settings.');
    }
  }, [animateWave]);

  const stopRecording = () => {
    mediaRef.current?.stop();
    clearInterval(timerRef.current);
  };

  const cancel = () => {
    if (phase === 'recording') { mediaRef.current?.stop(); clearInterval(timerRef.current); cancelAnimationFrame(animRef.current); audioCtxRef.current?.close(); }
    setAudioUrl(null); setAudioBlob(null); setDuration(0); setTranscript(''); setPhase('idle');
    onCancel();
  };

  const handleTranscribe = async () => {
    if (!audioBlob) return;
    setPhase('transcribing');
    const text = await transcribeAudio(audioBlob);
    setTranscript(text || '[Transcription failed — check VITE_OPENAI_API_KEY in .env]');
    setPhase('preview');
  };

  const handleSend = () => {
    if (!audioBlob) return;
    onSend({ blob: audioBlob, url: audioUrl, duration, transcript });
  };

  const fmt = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8,
      background: 'rgba(255,71,87,0.06)', border: '1px solid rgba(255,71,87,0.22)',
      borderRadius: 14, padding: '10px 14px',
    }}>
      <style>{`@keyframes recPulse{0%,100%{box-shadow:0 0 0 0 rgba(255,71,87,.5)}70%{box-shadow:0 0 0 8px rgba(255,71,87,0)}}`}</style>

      {/* Cancel */}
      <button onClick={cancel} title="Cancel" style={{
        width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
        background: 'rgba(255,71,87,0.15)', border: '1px solid rgba(255,71,87,0.3)',
        color: '#ff4757', cursor: 'pointer', fontSize: 14,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>✕</button>

      {/* Center content */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
        {phase === 'idle' && !error && (
          <span style={{ fontSize: 13, color: 'var(--text-dim)' }}>Tap 🎤 to start recording your voice note</span>
        )}
        {error && (
          <span style={{ fontSize: 12, color: '#ff4757' }}>{error}</span>
        )}
        {phase === 'recording' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 2, height: 48 }}>
              {bars.map((h, i) => (
                <div key={i} style={{
                  width: 3, height: h, borderRadius: 2, flexShrink: 0,
                  background: `hsl(${155 + i * 3}, 75%, 50%)`,
                  transition: 'height .07s ease',
                }} />
              ))}
            </div>
            <span style={{ fontSize: 13, color: '#ff4757', fontVariantNumeric: 'tabular-nums', fontWeight: 700, flexShrink: 0 }}>
              {fmt(duration)}
            </span>
          </>
        )}
        {(phase === 'preview' || phase === 'transcribing') && audioUrl && (
          <div style={{ flex: 1, minWidth: 0 }}>
            <audio src={audioUrl} controls style={{ width: '100%', height: 36, borderRadius: 8 }} />
            {transcript && (
              <div style={{
                marginTop: 4, fontSize: 11, color: 'var(--text-dim)',
                background: 'rgba(255,255,255,0.05)', borderRadius: 6, padding: '4px 8px',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>📝 {transcript}</div>
            )}
            {phase === 'transcribing' && (
              <div style={{ fontSize: 11, color: 'var(--teal,#00d4c8)', marginTop: 4 }}>⏳ Transcribing with Whisper AI…</div>
            )}
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
        {phase === 'idle' && !error && (
          <button onClick={startRecording} title="Start" style={{
            width: 40, height: 40, borderRadius: '50%', border: 'none',
            background: 'linear-gradient(135deg,#ff4757,#ff6b81)',
            color: '#fff', cursor: 'pointer', fontSize: 18,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'recPulse 2s infinite',
          }}>🎤</button>
        )}
        {phase === 'recording' && (
          <button onClick={stopRecording} title="Stop" style={{
            width: 40, height: 40, borderRadius: '50%', border: 'none',
            background: '#ff4757', color: '#fff', cursor: 'pointer', fontSize: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>⏹</button>
        )}
        {phase === 'preview' && (
          <>
            {OPENAI_KEY && (
              <button onClick={handleTranscribe} title="Transcribe with Whisper" style={{
                padding: '7px 11px', borderRadius: 9,
                background: 'rgba(0,201,177,0.1)', border: '1px solid var(--teal,#00d4c8)',
                color: 'var(--teal,#00d4c8)', cursor: 'pointer', fontSize: 11,
                fontFamily: 'inherit', fontWeight: 600,
              }}>📝 Transcribe</button>
            )}
            <button onClick={handleSend} title="Send voice note" style={{
              width: 40, height: 40, borderRadius: '50%', border: 'none',
              background: 'linear-gradient(135deg,var(--teal,#00d4c8),var(--blue,#0085ff))',
              color: '#fff', cursor: 'pointer', fontSize: 18,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 14px rgba(0,201,177,0.4)',
            }}>➤</button>
          </>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// MAIN ChatPanel
// ─────────────────────────────────────────────────────────────────
export default function ChatPanel({ onStartCall }) {
  const { user } = useAuthStore();
  const { chats, activeChat, messages, typing, fetchChats, fetchMessages, sendMessage, setActiveChat } = useChatStore();

  const [input,         setInput]         = useState('');
  const [isTyping,      setIsTyping]       = useState(false);
  const [logoErr,       setLogoErr]        = useState(false);
  const [showPicker,    setShowPicker]     = useState(false);
  const [showAudio,     setShowAudio]      = useState(false);
  const [showSearch,    setShowSearch]     = useState(false);
  const [searchQuery,   setSearchQuery]    = useState('');
  const [showProfile,   setShowProfile]    = useState(false);
  const [showOptions,   setShowOptions]    = useState(false);
  const [attachedFile,  setAttachedFile]   = useState(null);
  const [attachedMedia, setAttachedMedia]  = useState(null);

  // Management States
  const [mutedChats, setMutedChats] = useState(() => JSON.parse(localStorage.getItem('kc_muted_chats') || '[]'));
  const [pinnedChats, setPinnedChats] = useState(() => JSON.parse(localStorage.getItem('kc_pinned_chats') || '[]'));

  const toggleMute = () => {
    const id = activeChat._id;
    const isMuted = mutedChats.includes(id);
    const next = isMuted ? mutedChats.filter(x => x !== id) : [...mutedChats, id];
    setMutedChats(next);
    localStorage.setItem('kc_muted_chats', JSON.stringify(next));
    toast.success(isMuted ? 'Notifications unmuted' : 'Notifications muted');
    setShowOptions(false);
  };

  const togglePin = () => {
    const id = activeChat._id;
    const isPinned = pinnedChats.includes(id);
    const next = isPinned ? pinnedChats.filter(x => x !== id) : [...pinnedChats, id];
    setPinnedChats(next);
    localStorage.setItem('kc_pinned_chats', JSON.stringify(next));
    toast.success(isPinned ? 'Chat unpinned' : 'Chat pinned');
    setShowOptions(false);
  };

  const clearChat = () => {
    const cleared = JSON.parse(localStorage.getItem('kc_cleared_at') || '{}');
    cleared[activeChat._id] = new Date().toISOString();
    localStorage.setItem('kc_cleared_at', JSON.stringify(cleared));
    toast.error('Chat history cleared');
    setShowOptions(false);
  };

  const isMsgVisible = (msg) => {
    const clearedAt = JSON.parse(localStorage.getItem('kc_cleared_at') || '{}')[activeChat._id];
    if (!clearedAt) return true;
    return new Date(msg.createdAt) > new Date(clearedAt);
  };

  const messagesEndRef = useRef(null);
  const typingTimerRef = useRef(null);
  const fileInputRef   = useRef(null);
  const imageInputRef  = useRef(null);
  const audioInputRef  = useRef(null);
  const textareaRef    = useRef(null);
  const pickerRef      = useRef(null);
  const socket         = getSocket();

  // ── Fetching ──
  useEffect(() => { fetchChats(); }, [fetchChats]);
  useEffect(() => { 
    if (activeChat?._id) {
      fetchMessages(activeChat._id); 
      // Join socket room for real-time updates
      if (socket) {
        socket.emit('chat:join', activeChat._id);
        return () => socket.emit('chat:leave', activeChat._id);
      }
    }
  }, [activeChat?._id, fetchMessages, socket]);

  const activeMsgs = messages[activeChat?._id] || [];
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [activeMsgs.length]);

  // Close dropdown or picker on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (showOptions && !e.target.closest('.options-btn-container')) setShowOptions(false);
      // Use both class and ref check for extra robustness
      if (showPicker && !e.target.closest('.picker-container') && !pickerRef.current?.contains(e.target)) {
        setShowPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showOptions, showPicker]);

  // ── Helpers ──
  const getOtherUser = useCallback((chat) => {
    if (!chat || chat.isGroup || chat.isAI) return null;
    return chat.participants?.find(p => p._id !== user?._id) ?? null;
  }, [user?._id]);

  const getChatName = useCallback((chat) => {
    if (!chat) return '';
    if (chat.isAI) return 'Kimi AI';
    if (chat.isGroup) return chat.name ?? 'Group';
    return getOtherUser(chat)?.name ?? chat.name ?? 'Chat';
  }, [getOtherUser]);

  const getChatStatus = useCallback((chat) => {
    if (!chat) return '';
    if (chat.isAI) return 'AI Assistant · Always active';
    if (chat.isGroup) return `${chat.participants?.length ?? 0} members`;
    const o = getOtherUser(chat);
    return o?.isOnline ? 'Online' : 'Last seen recently';
  }, [getOtherUser]);

  // ── Typing ──
  const handleTyping = useCallback((e) => {
    const val = e.target.value;
    setInput(val);
    const ta = textareaRef.current;
    if (ta) { ta.style.height = 'auto'; ta.style.height = Math.min(ta.scrollHeight, 120) + 'px'; }
    if (!socket || !activeChat?._id) return;
    if (!isTyping) { setIsTyping(true); socket.emit('message:typing', { chatId: activeChat._id, isTyping: true }); }
    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      setIsTyping(false);
      socket.emit('message:typing', { chatId: activeChat._id, isTyping: false });
    }, 1500);
  }, [isTyping, activeChat, socket]);

  // ── Send ──
  const handleSend = useCallback(async (override) => {
    let content = override ?? input.trim();
    let type = 'text';
    let fileUrl = null;
    let sticker = null;

    if (attachedMedia?.type === 'gif') {
      // GIF removal cleanup - this block could be removed or handled generically
    }

    if (attachedFile) {
      fileUrl = attachedFile.url;
      type = attachedFile.type === 'audio' ? 'audio' : attachedFile.type === 'image' ? 'image' : 'file';
      if (!content) {
        content = type === 'audio' ? `🎵 Audio file: ${attachedFile.name}` : type === 'image' ? `🖼️ Image: ${attachedFile.name}` : `📎 File: ${attachedFile.name}`;
      }
    }

    if (!content && !fileUrl) return;

    setInput(''); setShowPicker(false); setAttachedFile(null); setAttachedMedia(null);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    if (socket) { clearTimeout(typingTimerRef.current); setIsTyping(false); socket.emit('message:typing', { chatId: activeChat._id, isTyping: false }); }
    
    try {
      await sendMessage({ chatId: activeChat._id, senderId: user._id, content, type, fileUrl, sticker });
    } catch (err) {
      console.error('sendMessage failed:', err);
      if (!override) setInput(content);
    }
  }, [input, activeChat, user, socket, sendMessage, attachedFile, attachedMedia]);

  const handleKeyDown = e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } };

  // ── Picker callbacks ──
  const handleEmojiPick = em => {
    const start = textareaRef.current?.selectionStart ?? input.length;
    const end = textareaRef.current?.selectionEnd ?? input.length;
    const nextVal = input.substring(0, start) + em + input.substring(end);
    setInput(nextVal);
    
    // Focus back and move cursor
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(start + em.length, start + em.length);
      }
    }, 0);
  };
  const handleStickerPick = sticker => {
    console.log('Picking sticker:', sticker);
    if (!activeChat?._id || !user?._id) {
      console.warn('Cannot send sticker: missing activeChat or user');
      return;
    }
    const content = `[sticker:${sticker.emoji}:${sticker.label}]`;
    sendMessage({ 
      chatId: activeChat._id, 
      senderId: user._id, 
      content, 
      type: 'sticker', 
      sticker 
    }).catch(err => {
      console.error('Sticker send error:', err);
      toast.error('Failed to send sticker');
    });
    setShowPicker(false);
    toast.success('Sticker sent! 🎨');
  };

  // ── Audio ──
  const handleAudioSend = useCallback(async ({ blob, url, duration, transcript }) => {
    setShowAudio(false);
    const content = transcript
      ? `🎤 Voice note (${Math.round(duration)}s): ${transcript}`
      : `🎤 Voice note (${Math.round(duration)}s)`;
    await handleSend(content);
    // Production: upload blob → Cloudinary/S3, then sendMessage with fileUrl
  }, [handleSend]);

  // ── File attach ──
  const handleFileChange = (e, type) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    setAttachedFile({ name: f.name, type, size: `${(f.size / 1024).toFixed(0)} KB`, url });
    e.target.value = '';
  };

  const typingUsers = (typing[activeChat?._id] ?? []).filter(t => t.userId !== user?._id);
  const canSend     = !!(input.trim() || attachedMedia || attachedFile);

  return (
    <div style={{ display: 'flex', width: '100%', height: '100%', overflow: 'hidden' }}>
      <style>{`
        @keyframes shimmer    { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        @keyframes pulse      { 0%,100%{opacity:1} 50%{opacity:.45} }
        @keyframes typingDot  { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-6px)} }
      `}</style>

      {/* Hidden file inputs */}
      <input ref={fileInputRef}  type="file"              style={{ display:'none' }} onChange={e => handleFileChange(e, 'file')} />
      <input ref={imageInputRef} type="file" accept="image/*,video/*" style={{ display:'none' }} onChange={e => handleFileChange(e, 'image')} />
      <input ref={audioInputRef} type="file" accept="audio/*"      style={{ display:'none' }} onChange={e => handleFileChange(e, 'audio')} />

      <ChatList />

      {/* Main Chat Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-dark)', overflow: 'hidden' }}>
        {!activeChat ? (
          /* ── Empty state ── */
          <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16, color:'var(--text-dim)' }}>
            {!logoErr
              ? <img src="/images/logo.png" alt="KimiChat" onError={() => setLogoErr(true)} style={{ width:72, height:72, borderRadius:20, objectFit:'contain', filter:'drop-shadow(0 0 18px rgba(0,201,177,.45))' }} />
              : <div style={{ width:72, height:72, borderRadius:20, background:'linear-gradient(135deg,var(--teal),var(--blue))', display:'flex', alignItems:'center', justifyContent:'center', fontSize:34, boxShadow:'0 0 28px rgba(0,201,177,.35)' }}>💬</div>
            }
            <div style={{ fontFamily:'var(--font-display)', fontSize:20, fontWeight:700, color:'var(--text)' }}>Select a conversation</div>
            <div style={{ fontSize:14 }}>Choose from your chats or start a new one</div>
          </div>
        ) : (
          <>
            {/* ── Header ── */}
            <div style={{ padding:'12px 20px', background:'var(--bg-card)', borderBottom:'1px solid var(--border2)', display:'flex', alignItems:'center', gap:12, flexShrink:0 }}>
              <div 
                style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0, cursor: 'pointer' }}
                onClick={() => setShowProfile(true)}
              >
                <Avatar name={getChatName(activeChat)} src={activeChat.avatar} size={42}
                  online={activeChat.isAI ? true : getOtherUser(activeChat)?.isOnline}
                  gradient={activeChat.isAI ? 'var(--teal),var(--blue)' : null}
                  emoji={activeChat.isAI ? '🤖' : null} />
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:16, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {getChatName(activeChat)}
                  </div>
                  <div style={{ fontSize:12, color: getOtherUser(activeChat)?.isOnline || activeChat.isAI ? 'var(--green)' : 'var(--text-dim)', display:'flex', alignItems:'center', gap:4 }}>
                    {activeChat.isAI && <span>🤖</span>}
                    {getChatStatus(activeChat)}
                  </div>
                </div>
              </div>
              
              <div style={{ display:'flex', gap:8, flexShrink:0 }}>
                {!activeChat.isGroup && !activeChat.isAI && (
                  <>
                    {(() => {
                      const other = getOtherUser(activeChat);
                      const isFriend = user?.friends?.includes(other?._id);
                      if (other && !isFriend) {
                        return (
                          <button 
                            onClick={async () => {
                              try {
                                await api.post(`/friends/request/${other._id}`);
                                toast.success('Friend request sent!');
                              } catch (err) {
                                toast.error(err.response?.data?.message || 'Failed to send request');
                              }
                            }}
                            style={{ 
                              padding: '8px 16px', 
                              borderRadius: 10, 
                              background: 'var(--teal-glow)', 
                              border: '1px solid var(--teal)', 
                              color: 'var(--teal)', 
                              fontSize: 13, 
                              fontWeight: 700, 
                              cursor: 'pointer',
                              marginRight: 4
                            }}
                          >
                            + Connect
                          </button>
                        );
                      }
                      return null;
                    })()}
                    <HeaderBtn icon="📞" title="Audio Call" onClick={() => onStartCall?.(getOtherUser(activeChat), 'audio')} />
                    <HeaderBtn icon="📹" title="Video Call" onClick={() => onStartCall?.(getOtherUser(activeChat), 'video')} />
                  </>
                )}
                <HeaderBtn icon="🔍" title="Search in chat" active={showSearch} onClick={() => { setShowSearch(p => !p); if(showSearch) setSearchQuery(''); }} />
                
                <div className="options-btn-container" style={{ position: 'relative' }}>
                  <HeaderBtn icon="⋯" title="More options" onClick={() => setShowOptions(p => !p)} />
                   {showOptions && (
                    <div style={{
                      position: 'absolute', right: 0, top: '100%', marginTop: 8,
                      background: 'var(--bg-card)', border: '1px solid var(--border2)',
                      borderRadius: 12, width: 180, zIndex: 100,
                      boxShadow: '0 8px 24px rgba(0,0,0,0.4)', padding: '6px 0',
                      animation: 'pickerUp 0.15s ease-out'
                    }}>
                       <div className="dropdown-item" onClick={() => { setShowProfile(true); setShowOptions(false); }} style={{ padding: '10px 16px', cursor: 'pointer', fontSize: 14 }}>Contact Info</div>
                       <div className="dropdown-item" onClick={togglePin} style={{ padding: '10px 16px', cursor: 'pointer', fontSize: 14 }}>
                         {pinnedChats.includes(activeChat._id) ? '📍 Unpin conversation' : '📌 Pin conversation'}
                       </div>
                       <div className="dropdown-item" onClick={toggleMute} style={{ padding: '10px 16px', cursor: 'pointer', fontSize: 14 }}>
                         {mutedChats.includes(activeChat._id) ? '🔔 Unmute notifications' : '🔕 Mute notifications'}
                       </div>
                       <div style={{ height: 1, background: 'var(--border2)', margin: '4px 0' }} />
                       <div className="dropdown-item" onClick={clearChat} style={{ padding: '10px 16px', cursor: 'pointer', fontSize: 14, color: 'var(--red)' }}>Clear Chat</div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── Search Bar ── */}
            {showSearch && (
              <div style={{ padding: '10px 20px', background: 'var(--bg-card)', borderBottom: '1px solid var(--border2)', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, zIndex: 5 }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)', fontSize: 14 }}>🔍</span>
                  <input 
                    autoFocus
                    placeholder="Search in conversation..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    style={{
                      width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border2)',
                      borderRadius: 8, padding: '8px 12px 8px 36px', color: 'var(--text)', outline: 'none',
                      fontSize: 14, transition: 'all 0.2s'
                    }}
                    onFocus={e => e.target.style.borderColor = 'var(--teal)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border2)'}
                  />
                </div>
                <button onClick={() => { setShowSearch(false); setSearchQuery(''); }} style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: 14, padding: '8px 12px', borderRadius: 8 }}>Cancel</button>
              </div>
            )}

            {/* ── Messages ── */}
            <div style={{ flex:1, overflowY:'auto', padding:'20px 16px', display:'flex', flexDirection:'column', gap:4 }}>
              {activeMsgs.length === 0 && (
                <div style={{ textAlign:'center', padding:'40px 20px', color:'var(--text-dim)' }}>
                  <div style={{ fontSize:48, marginBottom:12 }}>{activeChat.isAI ? '🤖' : '👋'}</div>
                  <div style={{ fontFamily:'var(--font-display)', fontSize:16, fontWeight:600, color:'var(--text)', marginBottom:6 }}>
                    {activeChat.isAI ? "Hi! I'm Kimi AI" : `Say hi to ${getChatName(activeChat)}`}
                  </div>
                  <div style={{ fontSize:13 }}>
                    {activeChat.isAI ? "Ask me anything — I'm here to help 24/7!" : 'Send your first message below'}
                  </div>
                </div>
              )}
              {activeMsgs
                .filter(msg => isMsgVisible(msg))
                .filter(msg => !showSearch || !searchQuery.trim() || msg.content?.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((msg, i, arr) => {
                const prevId = i > 0 ? (arr[i-1].sender?._id ?? arr[i-1].sender) : null;
                const thisId = msg.sender?._id ?? msg.sender;
                return (
                  <MessageBubble key={msg._id ?? i} message={msg}
                    isMe={msg.sender?._id === user?._id || msg.sender === user?._id}
                    showAvatar={thisId !== prevId}
                    isAI={msg.isAI || msg.type === 'ai' || activeChat.isAI}
                    searchHighlight={searchQuery.trim()} />
                );
              })}
              {typingUsers.length > 0 && (
                <div style={{ display:'flex', alignItems:'center', gap:10, paddingLeft:4 }}>
                  <div style={{ width:30, height:30, borderRadius:'50%', background:'var(--bg-card2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, flexShrink:0 }}>
                    {activeChat.isAI ? '🤖' : (typingUsers[0]?.name?.[0] ?? '?')}
                  </div>
                  <div style={{ background:'var(--bg-card2)', borderRadius:'4px 18px 18px 18px', padding:'10px 16px', display:'flex', gap:4, alignItems:'center' }}>
                    {[0,1,2].map(j => <div key={j} style={{ width:7, height:7, borderRadius:'50%', background:'var(--text-dim)', animation:`typingDot 1.2s ease-in-out infinite ${j*.2}s` }} />)}
                  </div>
                  <span style={{ fontSize:11, color:'var(--text-dim)' }}>{typingUsers[0]?.name ?? 'Someone'} is typing…</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* ── Input area ── */}
            <div style={{ padding:'10px 16px 14px', background:'var(--bg-card)', borderTop:'1px solid var(--border2)', flexShrink:0, position:'relative' }}>

              {/* Audio recorder */}
              {showAudio && <AudioRecorder onSend={handleAudioSend} onCancel={() => setShowAudio(false)} />}

              {/* Picker (emoji/gif/sticker) */}
              <div ref={pickerRef} className="picker-container" style={{ position:'relative' }}>
                {showPicker && (
                  <MediaPicker
                    onEmoji={handleEmojiPick}
                    onSticker={handleStickerPick}
                    onClose={() => setShowPicker(false)}
                  />
                )}
              </div>

              {/* File preview chip */}
              {attachedFile && (
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8, background:'rgba(255,255,255,0.05)', borderRadius:8, padding:'6px 10px', fontSize:12, color:'var(--text-dim)' }}>
                  <span>{attachedFile.type === 'image' ? '🖼️' : '📎'}</span>
                  <span style={{ flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{attachedFile.name}</span>
                  <span style={{ flexShrink:0 }}>{attachedFile.size}</span>
                  <button onClick={() => setAttachedFile(null)} style={{ background:'transparent', border:'none', color:'var(--text-dim)', cursor:'pointer', fontSize:14, padding:0, lineHeight:1 }}>✕</button>
                </div>
              )}

              {/* GIF preview removal */}

              {/* GIF picker removal */}

              {/* Toolbar */}
              <div style={{ display:'flex', gap:6, marginBottom:8, alignItems:'center' }}>
                {/* 😊 opens Emoji/GIF/Sticker picker */}
                <ToolBtn icon="😊" title="Emoji / Stickers" active={showPicker}
                  activeColor="var(--teal,#00d4c8)" activeBg="rgba(0,201,177,0.15)"
                  onClick={() => { setShowPicker(p => !p); setShowAudio(false); }} />

                <ToolBtn icon="📎" title="Attach File"    onClick={() => fileInputRef.current?.click()} />
                <ToolBtn icon="📸" title="Image / Video"  onClick={() => imageInputRef.current?.click()} />

                {/* 🎤 opens audio recorder */}
                <ToolBtn icon="🎤" title="Voice Note" active={showAudio}
                  activeColor="#ff4757" activeBg="rgba(255,71,87,0.15)"
                  onClick={() => { setShowAudio(p => !p); setShowPicker(false); }} />

                <ToolBtn icon="🎵" title="Audio File" onClick={() => audioInputRef.current?.click()} />
              </div>

              {/* Textarea + send */}
              <div style={{ display:'flex', gap:10, alignItems:'flex-end' }}>
                <textarea
                  ref={textareaRef} value={input}
                  onChange={handleTyping} onKeyDown={handleKeyDown}
                  placeholder={`Message ${getChatName(activeChat)}…`}
                  rows={1}
                  style={{
                    flex:1, background:'rgba(255,255,255,0.06)',
                    border:'1.5px solid var(--border2,#1e3050)', borderRadius:14,
                    padding:'12px 16px', color:'var(--text,#e8f0fe)', fontSize:14,
                    fontFamily:'var(--font-body)', outline:'none',
                    resize:'none', maxHeight:120, transition:'border-color .2s',
                    lineHeight:1.5, overflowY:'auto',
                  }}
                  onFocus={e => e.target.style.borderColor='var(--teal,#00d4c8)'}
                  onBlur={e  => e.target.style.borderColor='var(--border2,#1e3050)'}
                />
                <button
                  onClick={() => canSend && (attachedMedia?.type === 'gif' ? handleSend(`[gif:${attachedMedia.data.url}]`) : handleSend())}
                  disabled={!canSend}
                  title="Send (Enter)"
                  style={{
                    width:44, height:44, borderRadius:12, border:'none', flexShrink:0,
                    cursor: canSend ? 'pointer' : 'not-allowed',
                    background: canSend ? 'linear-gradient(135deg,var(--teal,#00d4c8),var(--blue,#0085ff))' : 'rgba(255,255,255,0.06)',
                    color: canSend ? '#fff' : 'var(--text-dim)', fontSize:18,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    transition:'all .2s', opacity: canSend ? 1 : 0.45,
                    boxShadow: canSend ? '0 0 14px rgba(0,201,177,0.3)' : 'none',
                  }}
                >➤</button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Contact Profile Sidebar ── */}
      {showProfile && activeChat && (
        <ContactProfile 
          chat={activeChat} 
          contact={getOtherUser(activeChat)} 
          onClose={() => setShowProfile(false)} 
          messages={activeMsgs}
        />
      )}
    </div>
  );
}

// ── Small reusable toolbar button ────────────
function ToolBtn({ icon, title, onClick, active, activeColor, activeBg }) {
  const ac = activeColor || 'var(--teal,#00d4c8)';
  const ab = activeBg    || 'rgba(0,201,177,0.15)';
  return (
    <button title={title} onClick={onClick} style={{
      padding: '6px 11px', borderRadius: 9,
      background: active ? ab : 'rgba(255,255,255,0.06)',
      border: `1px solid ${active ? ac : 'var(--border2,#1e3050)'}`,
      color: active ? ac : 'var(--text-dim,#8fa8c8)',
      fontSize: 18, cursor: 'pointer', transition: 'all .2s',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}
    onMouseEnter={e => { if (!active) { e.currentTarget.style.borderColor=ac; e.currentTarget.style.color=ac; } }}
    onMouseLeave={e => { if (!active) { e.currentTarget.style.borderColor='var(--border2,#1e3050)'; e.currentTarget.style.color='var(--text-dim,#8fa8c8)'; } }}
    >{icon}</button>
  );
}

// ── Reusable header button ────────────────────
function HeaderBtn({ icon, title, onClick }) {
  return (
    <button title={title} onClick={onClick} style={{
      width:38, height:38, borderRadius:10,
      background:'rgba(255,255,255,0.06)', border:'1px solid transparent',
      color:'var(--text)', fontSize:17, cursor:'pointer',
      display:'flex', alignItems:'center', justifyContent:'center',
      transition:'all .2s', flexShrink:0,
    }}
    onMouseEnter={e => { e.currentTarget.style.background='var(--teal-glow,rgba(0,201,177,.12))'; e.currentTarget.style.borderColor='var(--teal)'; e.currentTarget.style.color='var(--teal)'; }}
    onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor='transparent'; e.currentTarget.style.color='var(--text)'; }}
    >{icon}</button>
  );
}