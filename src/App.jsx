import React, { useState, useCallback, useEffect, useRef } from 'react';
import { COLORS, MOCK_USERS, MOCK_ROUTES, INITIAL_INVITES, FILTERS, formatDate } from './data';

/* ───────── SVG Components ───────── */

function MiniRouteMap({ points, color = '#F97316', size = 80 }) {
  if (!points || points.length < 2) return null;
  const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${(p.x / 100) * size} ${(p.y / 100) * size}`).join(' ');
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: 'visible' }}>
      <path d={d} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
      <circle cx={(points[0].x / 100) * size} cy={(points[0].y / 100) * size} r="4" fill="#22C55E" />
      <circle cx={(points[points.length - 1].x / 100) * size} cy={(points[points.length - 1].y / 100) * size} r="4" fill="#EF4444" />
    </svg>
  );
}

function ElevationChart({ data, width = 280, height = 50 }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data), min = Math.min(...data), range = max - min || 1;
  const pts = data.map((v, i) => ({ x: (i / (data.length - 1)) * width, y: height - ((v - min) / range) * (height - 8) - 4 }));
  const area = `M ${pts[0].x} ${height} ` + pts.map(p => `L ${p.x} ${p.y}`).join(' ') + ` L ${pts[pts.length - 1].x} ${height} Z`;
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      <defs><linearGradient id="eg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#F97316" stopOpacity="0.3" /><stop offset="100%" stopColor="#F97316" stopOpacity="0.02" /></linearGradient></defs>
      <path d={area} fill="url(#eg)" /><path d={line} fill="none" stroke="#F97316" strokeWidth="1.5" />
    </svg>
  );
}

/* ───────── Small Components ───────── */

function DifficultyBadge({ difficulty }) {
  const c = { Kolay: { bg: 'rgba(34,197,94,0.15)', t: '#22C55E', b: 'rgba(34,197,94,0.3)' }, Orta: { bg: 'rgba(249,115,22,0.15)', t: '#F97316', b: 'rgba(249,115,22,0.3)' }, Zor: { bg: 'rgba(239,68,68,0.15)', t: '#EF4444', b: 'rgba(239,68,68,0.3)' } }[difficulty] || {};
  return <span style={{ background: c.bg, color: c.t, border: `1px solid ${c.b}`, padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase' }}>{difficulty}</span>;
}

function Toast({ message, visible }) {
  if (!visible) return null;
  return <div style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', background: 'rgba(30,30,38,0.95)', border: '1px solid rgba(249,115,22,0.3)', borderRadius: 14, padding: '12px 24px', fontSize: 14, fontWeight: 600, color: '#fff', zIndex: 200, animation: 'toastIn 0.3s ease', backdropFilter: 'blur(10px)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>{message}</div>;
}

function FilterBar({ active, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4, marginBottom: 16, scrollbarWidth: 'none' }}>
      {FILTERS.map(f => (
        <button key={f} onClick={() => onChange(f)} style={{ whiteSpace: 'nowrap', padding: '7px 14px', borderRadius: 20, border: `1px solid ${active === f ? '#F97316' : 'rgba(255,255,255,0.08)'}`, background: active === f ? 'rgba(249,115,22,0.15)' : 'rgba(255,255,255,0.03)', color: active === f ? '#F97316' : 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>{f}</button>
      ))}
    </div>
  );
}

/* ───────── Route Card ───────── */

function RouteCard({ route, onJoin, onInvite, joined, animDelay = 0 }) {
  const user = MOCK_USERS[route.userId];
  const spotsLeft = route.maxParticipants - route.participants.length;

  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: 20, marginBottom: 14, animation: `fadeSlideUp 0.5s ease ${animDelay}s both`, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 12, right: 12, opacity: 0.4 }}><MiniRouteMap points={route.routePoints} size={70} /></div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #F97316, #DC2626)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>{user?.avatar}</div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>{user?.name}</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{formatDate(route.date)} · {route.time}</div>
        </div>
      </div>

      <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700, color: '#fff', fontFamily: "'Outfit', sans-serif", lineHeight: 1.2, maxWidth: '75%' }}>{route.title}</h3>

      <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <DifficultyBadge difficulty={route.difficulty} />
        {route.tags.map(t => <span key={t} style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', padding: '2px 8px', borderRadius: 12, fontSize: 11 }}>#{t}</span>)}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8, marginBottom: 14 }}>
        {[{ l: 'Mesafe', v: `${route.distance} km`, a: true }, { l: 'Pace', v: `${route.pace} /km` }, { l: 'Süre', v: route.duration }, { l: 'Tırmanış', v: `${route.elevation}m` }].map(s => (
          <div key={s.l} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: s.a ? '#F97316' : 'rgba(255,255,255,0.85)', fontFamily: "'JetBrains Mono', monospace" }}>{s.v}</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.l}</div>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: 14 }}><ElevationChart data={route.elevationProfile} width={280} height={40} /></div>
      <p style={{ margin: '0 0 14px', fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>{route.description}</p>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ display: 'flex' }}>
            {route.participants.map((pId, i) => (
              <div key={pId} style={{ width: 26, height: 26, borderRadius: '50%', background: 'rgba(249,115,22,0.2)', border: '2px solid #0F0F14', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, marginLeft: i > 0 ? -8 : 0, position: 'relative', zIndex: route.participants.length - i }}>{MOCK_USERS[pId]?.avatar}</div>
            ))}
          </div>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{spotsLeft > 0 ? `${spotsLeft} kişilik yer var` : 'Dolu'}</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => onInvite(route)} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Davet Et</button>
          <button onClick={() => onJoin(route.id)} disabled={joined || spotsLeft <= 0} style={{ background: joined ? 'rgba(34,197,94,0.2)' : spotsLeft <= 0 ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, #F97316, #EA580C)', border: 'none', color: joined ? '#22C55E' : spotsLeft <= 0 ? 'rgba(255,255,255,0.3)' : '#fff', padding: '8px 18px', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: joined || spotsLeft <= 0 ? 'default' : 'pointer' }}>{joined ? '✓ Katıldın' : spotsLeft <= 0 ? 'Dolu' : 'Katıl'}</button>
        </div>
      </div>
    </div>
  );
}

/* ───────── Invite Modal ───────── */

function InviteModal({ route, onClose, onSend }) {
  const [selected, setSelected] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (route) setMessage(`"${route.title}" koşusuna katılmak ister misin?`);
  }, [route]);

  if (!route) return null;
  const others = Object.values(MOCK_USERS).filter(u => u.id !== 'me' && !route.participants.includes(u.id));

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 100, animation: 'fadeIn 0.2s ease' }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#1A1A22', borderRadius: '20px 20px 0 0', width: '100%', maxWidth: 420, padding: '24px 20px 32px', animation: 'slideUp 0.3s ease' }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.15)', margin: '0 auto 20px' }} />
        <h3 style={{ margin: '0 0 4px', fontSize: 18, color: '#fff', fontWeight: 700 }}>Arkadaşını Davet Et</h3>
        <p style={{ margin: '0 0 18px', fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>{route.title}</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16, maxHeight: 200, overflowY: 'auto' }}>
          {others.map(u => {
            const isSel = selected.includes(u.id);
            return (
              <button key={u.id} onClick={() => setSelected(s => isSel ? s.filter(x => x !== u.id) : [...s, u.id])} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: isSel ? 'rgba(249,115,22,0.1)' : 'rgba(255,255,255,0.03)', border: `1px solid ${isSel ? 'rgba(249,115,22,0.4)' : 'rgba(255,255,255,0.06)'}`, borderRadius: 12, cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}>
                <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(249,115,22,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>{u.avatar}</div>
                <div style={{ flex: 1 }}><div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{u.name}</div><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{u.level}</div></div>
                <div style={{ width: 22, height: 22, borderRadius: '50%', border: `2px solid ${isSel ? '#F97316' : 'rgba(255,255,255,0.15)'}`, background: isSel ? '#F97316' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#fff', flexShrink: 0 }}>{isSel && '✓'}</div>
              </button>
            );
          })}
        </div>

        <textarea value={message} onChange={e => setMessage(e.target.value)} style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '12px 14px', color: '#fff', fontSize: 13, resize: 'none', height: 70, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} placeholder="Mesaj ekle..." />

        <button onClick={() => { onSend(selected, message); setSelected([]); onClose(); }} disabled={selected.length === 0} style={{ width: '100%', marginTop: 14, padding: 14, background: selected.length > 0 ? 'linear-gradient(135deg, #F97316, #EA580C)' : 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 14, color: selected.length > 0 ? '#fff' : 'rgba(255,255,255,0.3)', fontSize: 15, fontWeight: 700, cursor: selected.length > 0 ? 'pointer' : 'default', fontFamily: "'Outfit', sans-serif" }}>
          {selected.length > 0 ? `${selected.length} Kişiye Davet Gönder` : 'Kişi Seç'}
        </button>
      </div>
    </div>
  );
}

/* ───────── Screens ───────── */

function FeedScreen({ onShowToast }) {
  const [filter, setFilter] = useState('Tümü');
  const [joinedRoutes, setJoinedRoutes] = useState([]);
  const [inviteModal, setInviteModal] = useState(null);

  const filtered = MOCK_ROUTES.filter(r => {
    if (filter === 'Tümü') return true;
    if (['Kolay', 'Orta', 'Zor'].includes(filter)) return r.difficulty === filter;
    return r.tags.some(t => t.toLowerCase().includes(filter.toLowerCase()));
  });

  const handleJoin = useCallback(id => { setJoinedRoutes(p => [...p, id]); onShowToast('Koşuya katıldın! 🎉'); }, [onShowToast]);
  const handleSendInvite = useCallback((ids) => { onShowToast(`${ids.length} kişiye davet gönderildi! ✉️`); }, [onShowToast]);

  return (
    <>
      <h2 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 800, color: '#fff', animation: 'fadeSlideUp 0.4s ease' }}>Koşu Rotaları</h2>
      <p style={{ margin: '0 0 16px', fontSize: 13, color: 'rgba(255,255,255,0.4)', animation: 'fadeSlideUp 0.4s ease 0.05s both' }}>Birlikte koşmak için bir rota seç</p>
      <FilterBar active={filter} onChange={setFilter} />
      {filtered.map((r, i) => <RouteCard key={r.id} route={r} joined={joinedRoutes.includes(r.id)} onJoin={handleJoin} onInvite={setInviteModal} animDelay={i * 0.08} />)}
      {filtered.length === 0 && <div style={{ textAlign: 'center', padding: '60px 20px', color: 'rgba(255,255,255,0.3)' }}><div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div><p style={{ fontSize: 14 }}>Bu filtreye uygun rota bulunamadı</p></div>}
      <InviteModal route={inviteModal} onClose={() => setInviteModal(null)} onSend={handleSendInvite} />
    </>
  );
}

function InvitesScreen({ onShowToast }) {
  const [invites, setInvites] = useState(INITIAL_INVITES);

  const accept = id => { setInvites(p => p.map(i => i.id === id ? { ...i, status: 'accepted' } : i)); onShowToast('Davet kabul edildi! 🏃'); };
  const decline = id => { setInvites(p => p.map(i => i.id === id ? { ...i, status: 'declined' } : i)); };

  return (
    <>
      <h2 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 800, color: '#fff' }}>Davetler</h2>
      <p style={{ margin: '0 0 24px', fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Sana gelen koşu davetleri</p>
      {invites.length === 0 ? <div style={{ textAlign: 'center', padding: '60px 20px', color: 'rgba(255,255,255,0.3)' }}><div style={{ fontSize: 40, marginBottom: 12 }}>📭</div><p>Henüz davet yok</p></div> : invites.map((inv, i) => {
        const route = MOCK_ROUTES.find(r => r.id === inv.routeId);
        const sender = MOCK_USERS[inv.from];
        return (
          <div key={inv.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: 18, marginBottom: 12, animation: `fadeSlideUp 0.4s ease ${i * 0.1}s both` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, #F97316, #DC2626)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{sender?.avatar}</div>
              <div><div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{sender?.name}</div><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>seni davet etti</div></div>
            </div>
            {route && <div style={{ background: 'rgba(249,115,22,0.06)', borderRadius: 10, padding: 12, marginBottom: 12 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 6 }}>{route.title}</div>
              <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'rgba(255,255,255,0.5)' }}><span>{route.distance} km</span><span>{route.pace} /km</span><span>{formatDate(route.date)} · {route.time}</span></div>
            </div>}
            <p style={{ margin: '0 0 14px', fontSize: 13, color: 'rgba(255,255,255,0.6)', fontStyle: 'italic' }}>"{inv.message}"</p>
            {inv.status === 'pending' ? (
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => decline(inv.id)} style={{ flex: 1, padding: 10, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Reddet</button>
                <button onClick={() => accept(inv.id)} style={{ flex: 1, padding: 10, background: 'linear-gradient(135deg, #F97316, #EA580C)', border: 'none', borderRadius: 10, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Kabul Et</button>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: 8, fontSize: 13, fontWeight: 600, color: inv.status === 'accepted' ? '#22C55E' : 'rgba(255,255,255,0.3)', background: inv.status === 'accepted' ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.03)', borderRadius: 10 }}>
                {inv.status === 'accepted' ? '✓ Kabul Edildi' : '✕ Reddedildi'}
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}

function CreateScreen({ onShowToast }) {
  const [form, setForm] = useState({ title: '', distance: '', pace: '', duration: '', date: '', time: '', elevation: '', description: '', difficulty: 'Orta', tags: '' });
  const [submitted, setSubmitted] = useState(false);
  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const isValid = form.title && form.distance && form.pace;

  const handleSubmit = () => {
    if (!isValid) return;
    onShowToast('Rota başarıyla paylaşıldı! 🗺️');
    setSubmitted(true);
    setTimeout(() => { setSubmitted(false); setForm({ title: '', distance: '', pace: '', duration: '', date: '', time: '', elevation: '', description: '', difficulty: 'Orta', tags: '' }); }, 2000);
  };

  if (submitted) return <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', animation: 'fadeIn 0.3s ease' }}><div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div><h3 style={{ margin: '0 0 8px', fontSize: 20, color: '#fff' }}>Rota Paylaşıldı!</h3><p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>Koşuculara görünür oldu.</p></div>;

  const inp = { width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '12px 14px', color: '#fff', fontSize: 14, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' };
  const lbl = { fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6, display: 'block', marginTop: 16 };

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <h2 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 800, color: '#fff' }}>Rota Paylaş</h2>
      <p style={{ margin: '0 0 8px', fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Antrenman rotanı topluluğa aç</p>

      <label style={lbl}>Rota Adı</label>
      <input value={form.title} onChange={e => update('title', e.target.value)} style={inp} placeholder="Örn: Caddebostan Sahil Koşusu" />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div><label style={lbl}>Mesafe (km)</label><input value={form.distance} onChange={e => update('distance', e.target.value)} style={inp} placeholder="8.2" type="number" step="0.1" /></div>
        <div><label style={lbl}>Pace (dk/km)</label><input value={form.pace} onChange={e => update('pace', e.target.value)} style={inp} placeholder="5:30" /></div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div><label style={lbl}>Süre</label><input value={form.duration} onChange={e => update('duration', e.target.value)} style={inp} placeholder="45:06" /></div>
        <div><label style={lbl}>Tırmanış (m)</label><input value={form.elevation} onChange={e => update('elevation', e.target.value)} style={inp} placeholder="120" type="number" /></div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div><label style={lbl}>Tarih</label><input value={form.date} onChange={e => update('date', e.target.value)} style={inp} type="date" /></div>
        <div><label style={lbl}>Saat</label><input value={form.time} onChange={e => update('time', e.target.value)} style={inp} type="time" /></div>
      </div>

      <label style={lbl}>Zorluk</label>
      <div style={{ display: 'flex', gap: 8 }}>
        {['Kolay', 'Orta', 'Zor'].map(d => (
          <button key={d} onClick={() => update('difficulty', d)} style={{ flex: 1, padding: 10, borderRadius: 10, border: `1px solid ${form.difficulty === d ? '#F97316' : 'rgba(255,255,255,0.08)'}`, background: form.difficulty === d ? 'rgba(249,115,22,0.15)' : 'rgba(255,255,255,0.03)', color: form.difficulty === d ? '#F97316' : 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>{d}</button>
        ))}
      </div>

      <label style={lbl}>Etiketler</label>
      <input value={form.tags} onChange={e => update('tags', e.target.value)} style={inp} placeholder="sahil, sabah, düz (virgülle ayır)" />
      <label style={lbl}>Açıklama</label>
      <textarea value={form.description} onChange={e => update('description', e.target.value)} style={{ ...inp, height: 80, resize: 'none' }} placeholder="Rota hakkında bilgi, tavsiyeler..." />

      <button onClick={handleSubmit} style={{ width: '100%', padding: 16, marginTop: 20, background: isValid ? 'linear-gradient(135deg, #F97316, #EA580C)' : 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 14, color: isValid ? '#fff' : 'rgba(255,255,255,0.3)', fontSize: 16, fontWeight: 700, cursor: isValid ? 'pointer' : 'default', fontFamily: "'Outfit', sans-serif" }}>Rotayı Paylaş</button>
    </div>
  );
}

function ProfileScreen() {
  const weekly = [{ d: 'Pzt', km: 5.2 }, { d: 'Sal', km: 0 }, { d: 'Çar', km: 8.1 }, { d: 'Per', km: 6.3 }, { d: 'Cum', km: 0 }, { d: 'Cmt', km: 12.5 }, { d: 'Paz', km: 0 }];

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg, #F97316, #DC2626)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, margin: '0 auto 14px', boxShadow: '0 0 30px rgba(249,115,22,0.3)' }}>🏃</div>
        <h2 style={{ margin: '0 0 2px', fontSize: 20, fontWeight: 800, color: '#fff' }}>Koşucu Profili</h2>
        <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Orta Seviye · İstanbul</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
        {[{ l: 'Toplam Koşu', v: '127' }, { l: 'Km', v: '843' }, { l: 'Ort. Pace', v: '5:42' }, { l: 'Bu Hafta', v: '32 km' }].map(s => (
          <div key={s.l} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: 16, textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#F97316', fontFamily: "'JetBrains Mono', monospace" }}>{s.v}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.l}</div>
          </div>
        ))}
      </div>

      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: 16, marginBottom: 14 }}>
        <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>Haftalık Aktivite</h3>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 80 }}>
          {weekly.map(w => {
            const h = w.km > 0 ? (w.km / 15) * 60 + 10 : 4;
            return (
              <div key={w.d} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', fontFamily: "'JetBrains Mono', monospace", height: 12 }}>{w.km > 0 ? w.km : ''}</div>
                <div style={{ width: '100%', height: h, borderRadius: 6, background: w.km > 0 ? 'linear-gradient(180deg, #F97316, rgba(249,115,22,0.3))' : 'rgba(255,255,255,0.04)' }} />
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{w.d}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: 16 }}>
        <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>Son Başarılar</h3>
        <div style={{ display: 'flex', gap: 10 }}>
          {[{ e: '🔥', l: '7 Gün Seri' }, { e: '🏅', l: '100. Koşu' }, { e: '⛰️', l: '1000m Tırmanış' }].map(a => (
            <div key={a.l} style={{ flex: 1, textAlign: 'center', background: 'rgba(249,115,22,0.06)', borderRadius: 12, padding: 14 }}>
              <div style={{ fontSize: 24, marginBottom: 6 }}>{a.e}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>{a.l}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ───────── Main App ───────── */

export default function App() {
  const [tab, setTab] = useState('feed');
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const showToast = useCallback((msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2500);
  }, []);

  const pendingInvites = INITIAL_INVITES.filter(i => i.status === 'pending').length;

  const tabs = [
    { id: 'feed', label: 'Rotalar', icon: '◉' },
    { id: 'invites', label: 'Davetler', icon: '✉', badge: pendingInvites },
    { id: 'create', label: 'Paylaş', icon: '＋' },
    { id: 'profile', label: 'Profil', icon: '●' },
  ];

  return (
    <div style={{ background: '#0F0F14', height: '100vh', color: '#fff', fontFamily: "'Outfit', 'Inter', system-ui, sans-serif", maxWidth: 420, margin: '0 auto', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
      <style>{`
        @keyframes fadeSlideUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes toastIn { from { transform: translateY(-20px) translateX(-50%); opacity: 0; } to { transform: translateY(0) translateX(-50%); opacity: 1; } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        input::placeholder, textarea::placeholder { color: rgba(255,255,255,0.2); }
        input:focus, textarea:focus { border-color: rgba(249,115,22,0.5) !important; }
      `}</style>

      {/* Header */}
      <div style={{ padding: '14px 20px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingTop: 'max(14px, env(safe-area-inset-top))' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg, #F97316, #DC2626)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: '#fff' }}>R</div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 800, letterSpacing: -0.5 }}>RunTogether</h1>
        </div>
        <button onClick={() => setTab('invites')} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 10, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 16, color: 'rgba(255,255,255,0.6)', position: 'relative' }}>
          ✉
          {pendingInvites > 0 && <div style={{ position: 'absolute', top: -4, right: -4, width: 18, height: 18, borderRadius: '50%', background: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#fff', border: '2px solid #0F0F14', animation: 'pulse 2s infinite' }}>{pendingInvites}</div>}
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 8px', WebkitOverflowScrolling: 'touch' }}>
        {tab === 'feed' && <FeedScreen onShowToast={showToast} />}
        {tab === 'invites' && <InvitesScreen onShowToast={showToast} />}
        {tab === 'create' && <CreateScreen onShowToast={showToast} />}
        {tab === 'profile' && <ProfileScreen />}
      </div>

      {/* Tab Bar */}
      <div style={{ display: 'flex', borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(15,15,20,0.95)', backdropFilter: 'blur(20px)', padding: '6px 0', paddingBottom: 'max(6px, env(safe-area-inset-bottom))' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, background: 'none', border: 'none', cursor: 'pointer', padding: '6px 0', color: tab === t.id ? '#F97316' : 'rgba(255,255,255,0.35)', transition: 'color 0.2s', position: 'relative' }}>
            <span style={{ fontSize: 18, lineHeight: 1 }}>{t.icon}</span>
            <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: 0.5 }}>{t.label}</span>
            {t.badge > 0 && tab !== t.id && <div style={{ position: 'absolute', top: 2, right: '25%', width: 8, height: 8, borderRadius: '50%', background: '#EF4444' }} />}
          </button>
        ))}
      </div>

      <Toast message={toast} visible={!!toast} />
    </div>
  );
}
