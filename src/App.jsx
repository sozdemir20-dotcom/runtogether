import React, { useState, useCallback, useEffect, useRef } from 'react';
import { COLORS, FILTERS, formatDate } from './data';
import {
  registerUser, loginUser, logoutUser, onUserChanged, getErrorMessage,
  createRoute, onRoutesChanged, joinRoute,
  sendInvite, onInvitesChanged, respondToInvite,
  onUsersChanged,
} from './firebase';

/* ───────── SVG Components ───────── */

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

function EmptyState({ icon, text }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px', color: 'rgba(255,255,255,0.3)' }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>{icon}</div>
      <p style={{ fontSize: 14 }}>{text}</p>
    </div>
  );
}

/* ───────── Route Card ───────── */

function RouteCard({ route, users, currentUser, onJoin, onInvite, joined, animDelay = 0 }) {
  const owner = users[route.userId] || { name: 'Koşucu', avatar: '🏃' };
  const spotsLeft = (route.maxParticipants || 10) - (route.participants?.length || 0);

  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: 20, marginBottom: 14, animation: `fadeSlideUp 0.5s ease ${animDelay}s both`, position: 'relative', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #F97316, #DC2626)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>{owner.avatar}</div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>{owner.name}</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{route.date ? formatDate(route.date) : ''} · {route.time}</div>
        </div>
      </div>

      <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700, color: '#fff', fontFamily: "'Outfit', sans-serif", lineHeight: 1.2 }}>{route.title}</h3>

      <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <DifficultyBadge difficulty={route.difficulty || 'Orta'} />
        {(route.tags || []).map(t => <span key={t} style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', padding: '2px 8px', borderRadius: 12, fontSize: 11 }}>#{t}</span>)}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8, marginBottom: 14 }}>
        {[{ l: 'Mesafe', v: `${route.distance} km`, a: true }, { l: 'Pace', v: `${route.pace} /km` }, { l: 'Süre', v: route.duration || '-' }, { l: 'Tırmanış', v: `${route.elevation || 0}m` }].map(s => (
          <div key={s.l} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: s.a ? '#F97316' : 'rgba(255,255,255,0.85)', fontFamily: "'JetBrains Mono', monospace" }}>{s.v}</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.l}</div>
          </div>
        ))}
      </div>

      {route.description && <p style={{ margin: '0 0 14px', fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>{route.description}</p>}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ display: 'flex' }}>
            {(route.participants || []).slice(0, 4).map((pId, i) => (
              <div key={pId} style={{ width: 26, height: 26, borderRadius: '50%', background: 'rgba(249,115,22,0.2)', border: '2px solid #0F0F14', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, marginLeft: i > 0 ? -8 : 0, position: 'relative', zIndex: 4 - i }}>{users[pId]?.avatar || '🏃'}</div>
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

function InviteModal({ route, users, currentUser, onClose, onSend }) {
  const [selected, setSelected] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (route) setMessage(`"${route.title}" koşusuna katılmak ister misin?`);
  }, [route]);

  if (!route) return null;
  const others = Object.values(users).filter(u => u.id !== currentUser.id && !(route.participants || []).includes(u.id));

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 100, animation: 'fadeIn 0.2s ease' }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#1A1A22', borderRadius: '20px 20px 0 0', width: '100%', maxWidth: 420, padding: '24px 20px 32px', animation: 'slideUp 0.3s ease' }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.15)', margin: '0 auto 20px' }} />
        <h3 style={{ margin: '0 0 4px', fontSize: 18, color: '#fff', fontWeight: 700 }}>Arkadaşını Davet Et</h3>
        <p style={{ margin: '0 0 18px', fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>{route.title}</p>

        {others.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 14, padding: '20px 0' }}>Davet edilecek kullanıcı yok. Arkadaşlarını uygulamaya çağır!</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16, maxHeight: 200, overflowY: 'auto' }}>
            {others.map(u => {
              const isSel = selected.includes(u.id);
              return (
                <button key={u.id} onClick={() => setSelected(s => isSel ? s.filter(x => x !== u.id) : [...s, u.id])} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: isSel ? 'rgba(249,115,22,0.1)' : 'rgba(255,255,255,0.03)', border: `1px solid ${isSel ? 'rgba(249,115,22,0.4)' : 'rgba(255,255,255,0.06)'}`, borderRadius: 12, cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}>
                  <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(249,115,22,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>{u.avatar || '🏃'}</div>
                  <div style={{ flex: 1 }}><div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{u.name}</div><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{u.level}</div></div>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', border: `2px solid ${isSel ? '#F97316' : 'rgba(255,255,255,0.15)'}`, background: isSel ? '#F97316' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#fff', flexShrink: 0 }}>{isSel && '✓'}</div>
                </button>
              );
            })}
          </div>
        )}

        <textarea value={message} onChange={e => setMessage(e.target.value)} style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '12px 14px', color: '#fff', fontSize: 13, resize: 'none', height: 70, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} placeholder="Mesaj ekle..." />

        <button onClick={() => { onSend(selected, message, route); setSelected([]); onClose(); }} disabled={selected.length === 0} style={{ width: '100%', marginTop: 14, padding: 14, background: selected.length > 0 ? 'linear-gradient(135deg, #F97316, #EA580C)' : 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 14, color: selected.length > 0 ? '#fff' : 'rgba(255,255,255,0.3)', fontSize: 15, fontWeight: 700, cursor: selected.length > 0 ? 'pointer' : 'default', fontFamily: "'Outfit', sans-serif" }}>
          {selected.length > 0 ? `${selected.length} Kişiye Davet Gönder` : 'Kişi Seç'}
        </button>
      </div>
    </div>
  );
}

/* ───────── Screens ───────── */

function FeedScreen({ routes, users, currentUser, onShowToast }) {
  const [filter, setFilter] = useState('Tümü');
  const [inviteModal, setInviteModal] = useState(null);

  const filtered = routes.filter(r => {
    if (filter === 'Tümü') return true;
    if (['Kolay', 'Orta', 'Zor'].includes(filter)) return r.difficulty === filter;
    return (r.tags || []).some(t => t.toLowerCase().includes(filter.toLowerCase()));
  });

  const handleJoin = useCallback(async (id) => {
    try {
      await joinRoute(id, currentUser.id);
      onShowToast('Koşuya katıldın! 🎉');
    } catch { onShowToast('Bir hata oluştu'); }
  }, [currentUser, onShowToast]);

  const handleSendInvite = useCallback(async (userIds, message, route) => {
    try {
      for (const uid of userIds) {
        await sendInvite(currentUser.id, currentUser.name, uid, route.id, route.title, message);
      }
      onShowToast(`${userIds.length} kişiye davet gönderildi! ✉️`);
    } catch { onShowToast('Davet gönderilemedi'); }
  }, [currentUser, onShowToast]);

  return (
    <>
      <h2 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 800, color: '#fff', animation: 'fadeSlideUp 0.4s ease' }}>Koşu Rotaları</h2>
      <p style={{ margin: '0 0 16px', fontSize: 13, color: 'rgba(255,255,255,0.4)', animation: 'fadeSlideUp 0.4s ease 0.05s both' }}>Birlikte koşmak için bir rota seç</p>
      <FilterBar active={filter} onChange={setFilter} />
      {filtered.length === 0 ? (
        <EmptyState icon="🗺️" text={filter === 'Tümü' ? 'Henüz rota paylaşılmadı. İlk rotanı paylaş!' : 'Bu filtreye uygun rota bulunamadı'} />
      ) : (
        filtered.map((r, i) => (
          <RouteCard key={r.id} route={r} users={users} currentUser={currentUser}
            joined={(r.participants || []).includes(currentUser.id)}
            onJoin={handleJoin} onInvite={setInviteModal} animDelay={i * 0.08} />
        ))
      )}
      <InviteModal route={inviteModal} users={users} currentUser={currentUser} onClose={() => setInviteModal(null)} onSend={handleSendInvite} />
    </>
  );
}

function InvitesScreen({ invites, routes, users, currentUser, onShowToast }) {
  const handleAccept = async (inv) => {
    try {
      await respondToInvite(inv.id, 'accepted');
      if (inv.routeId) await joinRoute(inv.routeId, currentUser.id);
      onShowToast('Davet kabul edildi! 🏃');
    } catch { onShowToast('Bir hata oluştu'); }
  };
  const handleDecline = async (inv) => {
    try { await respondToInvite(inv.id, 'declined'); } catch {}
  };

  return (
    <>
      <h2 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 800, color: '#fff' }}>Davetler</h2>
      <p style={{ margin: '0 0 24px', fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Sana gelen koşu davetleri</p>
      {invites.length === 0 ? <EmptyState icon="📭" text="Henüz davet yok" /> : invites.map((inv, i) => {
        const route = routes.find(r => r.id === inv.routeId);
        return (
          <div key={inv.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: 18, marginBottom: 12, animation: `fadeSlideUp 0.4s ease ${i * 0.1}s both` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, #F97316, #DC2626)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{users[inv.from]?.avatar || '🏃'}</div>
              <div><div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{inv.fromName || users[inv.from]?.name || 'Koşucu'}</div><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>seni davet etti</div></div>
            </div>
            <div style={{ background: 'rgba(249,115,22,0.06)', borderRadius: 10, padding: 12, marginBottom: 12 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{inv.routeTitle || route?.title || 'Koşu'}</div>
              {route && <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'rgba(255,255,255,0.5)' }}><span>{route.distance} km</span><span>{route.pace} /km</span></div>}
            </div>
            <p style={{ margin: '0 0 14px', fontSize: 13, color: 'rgba(255,255,255,0.6)', fontStyle: 'italic' }}>"{inv.message}"</p>
            {inv.status === 'pending' ? (
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => handleDecline(inv)} style={{ flex: 1, padding: 10, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Reddet</button>
                <button onClick={() => handleAccept(inv)} style={{ flex: 1, padding: 10, background: 'linear-gradient(135deg, #F97316, #EA580C)', border: 'none', borderRadius: 10, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Kabul Et</button>
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

function CreateScreen({ currentUser, onShowToast }) {
  const [form, setForm] = useState({ title: '', distance: '', pace: '', duration: '', date: '', time: '', elevation: '', description: '', difficulty: 'Orta', tags: '', maxParticipants: '10' });
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const isValid = form.title && form.distance && form.pace;

  const handleSubmit = async () => {
    if (!isValid || saving) return;
    setSaving(true);
    try {
      await createRoute({
        title: form.title,
        distance: parseFloat(form.distance),
        pace: form.pace,
        duration: form.duration,
        date: form.date,
        time: form.time,
        elevation: parseInt(form.elevation) || 0,
        description: form.description,
        difficulty: form.difficulty,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        maxParticipants: parseInt(form.maxParticipants) || 10,
      }, currentUser.id);
      onShowToast('Rota başarıyla paylaşıldı! 🗺️');
      setSubmitted(true);
      setTimeout(() => { setSubmitted(false); setForm({ title: '', distance: '', pace: '', duration: '', date: '', time: '', elevation: '', description: '', difficulty: 'Orta', tags: '', maxParticipants: '10' }); }, 2000);
    } catch { onShowToast('Rota paylaşılamadı'); }
    setSaving(false);
  };

  if (submitted) return <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', animation: 'fadeIn 0.3s ease' }}><div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div><h3 style={{ margin: '0 0 8px', fontSize: 20, color: '#fff' }}>Rota Paylaşıldı!</h3><p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>Artık herkes görebilir.</p></div>;

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
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div><label style={lbl}>Maks. Katılımcı</label><input value={form.maxParticipants} onChange={e => update('maxParticipants', e.target.value)} style={inp} placeholder="10" type="number" /></div>
        <div />
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

      <button onClick={handleSubmit} disabled={!isValid || saving} style={{ width: '100%', padding: 16, marginTop: 20, background: isValid && !saving ? 'linear-gradient(135deg, #F97316, #EA580C)' : 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 14, color: isValid && !saving ? '#fff' : 'rgba(255,255,255,0.3)', fontSize: 16, fontWeight: 700, cursor: isValid && !saving ? 'pointer' : 'default', fontFamily: "'Outfit', sans-serif" }}>
        {saving ? 'Paylaşılıyor...' : 'Rotayı Paylaş'}
      </button>
    </div>
  );
}

function ProfileScreen({ user, routes, onLogout }) {
  const myRoutes = routes.filter(r => r.userId === user.id);
  const joinedRoutes = routes.filter(r => (r.participants || []).includes(user.id));
  const totalKm = joinedRoutes.reduce((sum, r) => sum + (r.distance || 0), 0);

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg, #F97316, #DC2626)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, margin: '0 auto 14px', boxShadow: '0 0 30px rgba(249,115,22,0.3)' }}>🏃</div>
        <h2 style={{ margin: '0 0 2px', fontSize: 20, fontWeight: 800, color: '#fff' }}>{user?.name}</h2>
        <p style={{ margin: '0 0 4px', fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>{user?.level}</p>
        <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>{user?.email}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
        {[{ l: 'Paylaştığın Rota', v: myRoutes.length }, { l: 'Katıldığın Koşu', v: joinedRoutes.length }, { l: 'Toplam Km', v: totalKm.toFixed(1) }, { l: 'Seviye', v: user?.level?.split(' ')[0] || '-' }].map(s => (
          <div key={s.l} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: 16, textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#F97316', fontFamily: "'JetBrains Mono', monospace" }}>{s.v}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.l}</div>
          </div>
        ))}
      </div>

      <button onClick={onLogout} style={{ width: '100%', marginTop: 8, padding: 14, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 14, color: '#EF4444', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: "'Outfit', sans-serif" }}>
        Çıkış Yap
      </button>
    </div>
  );
}

/* ───────── Auth Screen ───────── */

function AuthScreen({ onLogin }) {
  const [mode, setMode] = useState('welcome');
  const [form, setForm] = useState({ name: '', email: '', password: '', level: 'Orta Seviye' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const update = (k, v) => { setForm(f => ({ ...f, [k]: v })); setError(''); };
  const inp = { width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '14px 16px', color: '#fff', fontSize: 15, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', transition: 'border-color 0.2s' };

  const handleSubmit = async () => {
    if (mode === 'register' && !form.name.trim()) { setError('İsmini gir'); return; }
    if (!form.email.trim()) { setError('E-posta adresini gir'); return; }
    if (!form.password || form.password.length < 6) { setError('Şifre en az 6 karakter olmalı'); return; }
    setLoading(true); setError('');
    try {
      const userData = mode === 'register'
        ? await registerUser(form.email, form.password, form.name, form.level)
        : await loginUser(form.email, form.password);
      onLogin(userData);
    } catch (err) { setError(getErrorMessage(err.code)); }
    finally { setLoading(false); }
  };

  if (mode === 'welcome') {
    return (
      <div style={{ background: '#0F0F14', height: '100dvh', color: '#fff', fontFamily: "'Outfit', system-ui, sans-serif", maxWidth: 420, margin: '0 auto', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '40px 24px', position: 'relative', overflow: 'hidden' }}>
        <style>{`
          @keyframes fadeSlideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
          @keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
          @keyframes pulse { 0%,100% { opacity: 0.3; } 50% { opacity: 0.6; } }
          input::placeholder { color: rgba(255,255,255,0.2); }
          input:focus { border-color: rgba(249,115,22,0.5) !important; }
        `}</style>
        <div style={{ position: 'absolute', top: -60, right: -40, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(249,115,22,0.12) 0%, transparent 70%)', animation: 'pulse 4s ease infinite' }} />
        <div style={{ textAlign: 'center', marginBottom: 48, animation: 'fadeSlideUp 0.6s ease' }}>
          <div style={{ width: 80, height: 80, borderRadius: 22, background: 'linear-gradient(135deg, #F97316, #DC2626)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, fontWeight: 800, color: '#fff', margin: '0 auto 20px', boxShadow: '0 12px 40px rgba(249,115,22,0.35)', animation: 'float 3s ease infinite' }}>R</div>
          <h1 style={{ margin: '0 0 8px', fontSize: 32, fontWeight: 800, letterSpacing: -1 }}>RunTogether</h1>
          <p style={{ margin: 0, fontSize: 15, color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>Rotanı paylaş, arkadaşlarını davet et,<br/>birlikte koş!</p>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 48, flexWrap: 'wrap', animation: 'fadeSlideUp 0.6s ease 0.1s both' }}>
          {['🗺️ Rota Paylaş', '✉️ Davet At', '📊 İstatistik'].map(f => (
            <span key={f} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20, padding: '6px 14px', fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>{f}</span>
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, animation: 'fadeSlideUp 0.6s ease 0.2s both' }}>
          <button onClick={() => setMode('register')} style={{ width: '100%', padding: 16, background: 'linear-gradient(135deg, #F97316, #EA580C)', border: 'none', borderRadius: 14, color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: "'Outfit', sans-serif", boxShadow: '0 4px 20px rgba(249,115,22,0.3)' }}>Hesap Oluştur</button>
          <button onClick={() => setMode('login')} style={{ width: '100%', padding: 16, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, color: 'rgba(255,255,255,0.8)', fontSize: 16, fontWeight: 600, cursor: 'pointer', fontFamily: "'Outfit', sans-serif" }}>Giriş Yap</button>
        </div>
      </div>
    );
  }

  const isRegister = mode === 'register';
  return (
    <div style={{ background: '#0F0F14', height: '100dvh', color: '#fff', fontFamily: "'Outfit', system-ui, sans-serif", maxWidth: 420, margin: '0 auto', display: 'flex', flexDirection: 'column', padding: '0 24px', overflow: 'auto' }}>
      <style>{`@keyframes fadeSlideUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } } input::placeholder { color: rgba(255,255,255,0.2); } input:focus { border-color: rgba(249,115,22,0.5) !important; }`}</style>
      <div style={{ paddingTop: 'max(16px, env(safe-area-inset-top))', marginBottom: 8 }}>
        <button onClick={() => { setMode('welcome'); setError(''); }} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 14, cursor: 'pointer', padding: '8px 0', fontFamily: 'inherit' }}>← Geri</button>
      </div>
      <div style={{ marginBottom: 32, animation: 'fadeSlideUp 0.4s ease' }}>
        <div style={{ width: 52, height: 52, borderRadius: 14, background: 'linear-gradient(135deg, #F97316, #DC2626)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 800, color: '#fff', marginBottom: 20, boxShadow: '0 8px 24px rgba(249,115,22,0.25)' }}>R</div>
        <h1 style={{ margin: '0 0 6px', fontSize: 26, fontWeight: 800 }}>{isRegister ? 'Hesap Oluştur' : 'Tekrar Hoş Geldin'}</h1>
        <p style={{ margin: 0, fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>{isRegister ? 'Koşu topluluğuna katıl!' : 'Hesabına giriş yap'}</p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, animation: 'fadeSlideUp 0.4s ease 0.1s both' }}>
        {isRegister && <div><label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', letterSpacing: 0.5, marginBottom: 6, display: 'block' }}>AD SOYAD</label><input value={form.name} onChange={e => update('name', e.target.value)} style={inp} placeholder="Adın Soyadın" /></div>}
        <div><label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', letterSpacing: 0.5, marginBottom: 6, display: 'block' }}>E-POSTA</label><input value={form.email} onChange={e => update('email', e.target.value)} style={inp} placeholder="ornek@email.com" type="email" /></div>
        <div><label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', letterSpacing: 0.5, marginBottom: 6, display: 'block' }}>ŞİFRE</label><input value={form.password} onChange={e => update('password', e.target.value)} style={inp} placeholder="En az 6 karakter" type="password" /></div>
        {isRegister && <div><label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', letterSpacing: 0.5, marginBottom: 8, display: 'block' }}>KOŞU SEVİYEN</label><div style={{ display: 'flex', gap: 8 }}>{['Başlangıç', 'Orta Seviye', 'İleri Seviye'].map(l => (<button key={l} onClick={() => update('level', l)} style={{ flex: 1, padding: '10px 4px', borderRadius: 10, border: `1px solid ${form.level === l ? '#F97316' : 'rgba(255,255,255,0.08)'}`, background: form.level === l ? 'rgba(249,115,22,0.15)' : 'rgba(255,255,255,0.03)', color: form.level === l ? '#F97316' : 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>{l}</button>))}</div></div>}
        {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#EF4444', fontWeight: 500 }}>{error}</div>}
        <button onClick={handleSubmit} disabled={loading} style={{ width: '100%', padding: 16, marginTop: 4, background: loading ? 'rgba(249,115,22,0.5)' : 'linear-gradient(135deg, #F97316, #EA580C)', border: 'none', borderRadius: 14, color: '#fff', fontSize: 16, fontWeight: 700, cursor: loading ? 'wait' : 'pointer', fontFamily: "'Outfit', sans-serif", boxShadow: '0 4px 20px rgba(249,115,22,0.25)' }}>{loading ? '...' : isRegister ? 'Kayıt Ol' : 'Giriş Yap'}</button>
        <p style={{ textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 8 }}>{isRegister ? 'Zaten hesabın var mı? ' : 'Hesabın yok mu? '}<button onClick={() => { setMode(isRegister ? 'login' : 'register'); setError(''); }} style={{ background: 'none', border: 'none', color: '#F97316', fontWeight: 600, cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', padding: 0 }}>{isRegister ? 'Giriş Yap' : 'Kayıt Ol'}</button></p>
      </div>
    </div>
  );
}

/* ───────── Main App ───────── */

export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [tab, setTab] = useState('feed');
  const [toast, setToast] = useState(null);
  const [routes, setRoutes] = useState([]);
  const [invites, setInvites] = useState([]);
  const [users, setUsers] = useState({});
  const toastTimer = useRef(null);

  // Auth state
  useEffect(() => {
    const unsub = onUserChanged((userData) => { setUser(userData); setAuthLoading(false); });
    return () => unsub();
  }, []);

  // Firestore listeners — alleen als ingelogd
  useEffect(() => {
    if (!user) return;
    const unsub1 = onRoutesChanged(setRoutes);
    const unsub2 = onInvitesChanged(user.id, setInvites);
    const unsub3 = onUsersChanged(setUsers);
    return () => { unsub1(); unsub2(); unsub3(); };
  }, [user]);

  const showToast = useCallback((msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2500);
  }, []);

  const handleLogin = (userData) => { setUser(userData); showToast(`Hoş geldin, ${userData.name}! 🏃`); };
  const handleLogout = async () => { await logoutUser(); setUser(null); setTab('feed'); };

  if (authLoading) {
    return (
      <div style={{ background: '#0F0F14', height: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: "'Outfit', sans-serif", maxWidth: 420, margin: '0 auto' }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(135deg, #F97316, #DC2626)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 800, color: '#fff', marginBottom: 16, animation: 'pulse 1.5s ease infinite' }}>R</div>
        <style>{`@keyframes pulse { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.7; transform: scale(0.95); } }`}</style>
      </div>
    );
  }

  if (!user) return <AuthScreen onLogin={handleLogin} />;

  const pendingInvites = invites.filter(i => i.status === 'pending').length;
  const tabs = [
    { id: 'feed', label: 'Rotalar', icon: '◉' },
    { id: 'invites', label: 'Davetler', icon: '✉', badge: pendingInvites },
    { id: 'create', label: 'Paylaş', icon: '＋' },
    { id: 'profile', label: 'Profil', icon: '●' },
  ];

  return (
    <div style={{ background: '#0F0F14', height: '100dvh', color: '#fff', fontFamily: "'Outfit', 'Inter', system-ui, sans-serif", maxWidth: 420, margin: '0 auto', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
      <style>{`
        @keyframes fadeSlideUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes toastIn { from { transform: translateY(-20px) translateX(-50%); opacity: 0; } to { transform: translateY(0) translateX(-50%); opacity: 1; } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        input::placeholder, textarea::placeholder { color: rgba(255,255,255,0.2); }
        input:focus, textarea:focus { border-color: rgba(249,115,22,0.5) !important; }
      `}</style>

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

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 8px', WebkitOverflowScrolling: 'touch' }}>
        {tab === 'feed' && <FeedScreen routes={routes} users={users} currentUser={user} onShowToast={showToast} />}
        {tab === 'invites' && <InvitesScreen invites={invites} routes={routes} users={users} currentUser={user} onShowToast={showToast} />}
        {tab === 'create' && <CreateScreen currentUser={user} onShowToast={showToast} />}
        {tab === 'profile' && <ProfileScreen user={user} routes={routes} onLogout={handleLogout} />}
      </div>

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
