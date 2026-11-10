/* AirBill - shared data layer, helpers and page shell */
/* AirBill - shared data layer, helpers and page shell */
(function () {
  'use strict';
  const KEY = 'airbill_v1';
  const H = 36e5, D = 24 * H, WINDOW = 48 * H; // "expiring soon" = within 48 hours

  const ICONS = {
    home: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/>',
    users: '<circle cx="9" cy="8" r="4"/><path d="M2 21c0-4 3-7 7-7s7 3 7 7"/><path d="M17 4a4 4 0 010 8"/><path d="M22 21c0-3-2-5-4-6"/>',
    wifi: '<path d="M2 9a15 15 0 0120 0"/><path d="M5 13a10 10 0 0114 0"/><path d="M8.5 16.5a5 5 0 017 0"/><circle cx="12" cy="20" r="1"/>',
    card: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>',
    chat: '<path d="M21 12a8 8 0 01-11.6 7.1L3 21l1.9-5.4A8 8 0 1121 12z"/>',
    box: '<path d="M21 8l-9-5-9 5v8l9 5 9-5z"/><path d="M3 8l9 5 9-5M12 13v8"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-7 8-7s8 3 8 7"/>',
    router: '<rect x="3" y="14" width="18" height="6" rx="2"/><path d="M7 17h.01M11 17h.01M8 14l-2-5M16 14l2-5"/>',
    wallet: '<path d="M3 7a2 2 0 012-2h14v4"/><path d="M3 7v11a2 2 0 002 2h16V9H5a2 2 0 01-2-2z"/><circle cx="17" cy="14.5" r="1"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
    menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
    bank: '<path d="M3 10l9-6 9 6"/><path d="M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 21h18"/>',
    store: '<path d="M4 9l1.5-5h13L20 9"/><path d="M4 9a2.5 2.5 0 005 0 2.5 2.5 0 006 0 2.5 2.5 0 005 0"/><path d="M5 12v8h14v-8"/>',
    hash: '<path d="M5 9h14M5 15h14M10 3L8 21M16 3l-2 18"/>',
    phone: '<rect x="6" y="2" width="12" height="20" rx="3"/><path d="M11 18h2"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    cash: '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="3"/>'
  };
  const ic = (n, s = 18) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICONS[n] || ''}</svg>`;

  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const uid = p => p + Math.random().toString(36).slice(2, 9);
  const money = n => 'KES ' + Number(n || 0).toLocaleString('en-KE', { maximumFractionDigits: 2 });
  const dt = iso => new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  const dshort = iso => new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
  const initials = n => String(n || '?').trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();

  /* ---------- storage ---------- */
  function emptyDB() { return { plans: [], customers: [], subs: [], payments: [], messages: [], routers: [], payModes: [], counter: 10000 }; }

  function seed() {
    const n = Date.now(), iso = t => new Date(t).toISOString();
    const db = emptyDB();
    db.plans = [
      { id: 'p1', name: 'Hourly Lite', price: 20, durationValue: 1, durationUnit: 'hours', down: 3, up: 2, data: 'Unlimited', devices: 1, type: 'Hotspot', profile: 'hs-1hr', desc: 'Quick browsing and messaging', status: 'Active' },
      { id: 'p2', name: 'Daily Standard', price: 50, durationValue: 1, durationUnit: 'days', down: 5, up: 3, data: 'Unlimited', devices: 1, type: 'Hotspot', profile: 'hs-daily', desc: 'A full day of reliable WiFi', status: 'Active' },
      { id: 'p3', name: 'Weekly Plus', price: 300, durationValue: 7, durationUnit: 'days', down: 10, up: 5, data: 'Unlimited', devices: 2, type: 'Hotspot', profile: 'hs-weekly', desc: 'Streaming-ready weekly bundle', status: 'Active' },
      { id: 'p4', name: 'Monthly Premium', price: 1500, durationValue: 1, durationUnit: 'months', down: 20, up: 10, data: 'Unlimited', devices: 4, type: 'PPPoE', profile: 'ppp-premium', desc: 'Home fibre-style monthly package', status: 'Active' }
    ];
    db.routers = [{ id: 'm1', name: 'Main Tower', host: '192.168.88.1', port: 8728, user: 'billing', pass: '', ssl: false, location: 'Head office', iface: 'bridge-hotspot', status: 'Active' }];
    db.customers = [
      { id: 'c1', name: 'Achieng Otieno', phone: '0712345678', email: 'achieng@example.com', idNo: '', location: 'Milimani', connType: 'PPPoE', username: 'achieng', password: '', planId: 'p4', routerId: 'm1', account: 'WB10001', notes: '', created: iso(n - 12 * D) },
      { id: 'c2', name: 'Brian Odhiambo', phone: '0723456789', email: '', idNo: '', location: 'Market Area', connType: 'Hotspot', username: 'brian', password: '', planId: 'p2', routerId: 'm1', account: 'WB10002', notes: '', created: iso(n - 9 * D) },
      { id: 'c3', name: 'Faith Wanjiru', phone: '0734567890', email: '', idNo: '', location: 'Estate B', connType: 'Hotspot', username: 'faith', password: '', planId: 'p3', routerId: 'm1', account: 'WB10003', notes: '', created: iso(n - 8 * D) },
      { id: 'c4', name: 'Kevin Omondi', phone: '0745678901', email: '', idNo: '', location: 'Stage Road', connType: 'Hotspot', username: 'kevin', password: '', planId: 'p1', routerId: 'm1', account: 'WB10004', notes: '', created: iso(n - 5 * D) }
    ];
    db.counter = 10004;
    db.subs = [
      { id: 's1', customerId: 'c1', planId: 'p4', start: iso(n - 10 * D), expiry: iso(n + 20 * D) },
      { id: 's2', customerId: 'c2', planId: 'p2', start: iso(n - 14 * H), expiry: iso(n + 10 * H) },
      { id: 's3', customerId: 'c3', planId: 'p3', start: iso(n - 6 * D + 6 * H), expiry: iso(n + 30 * H) },
      { id: 's4', customerId: 'c4', planId: 'p1', start: iso(n - 3 * H), expiry: iso(n - 2 * H) }
    ];
    db.payments = [
      { id: 'y1', mpesaId: 'TKB4X9Q2LM', amount: 1500, account: 'WB10001', customerId: 'c1', phone: '0712345678', date: iso(n - 10 * D) },
      { id: 'y2', mpesaId: 'TKD7P3W8NA', amount: 300, account: 'WB10003', customerId: 'c3', phone: '0734567890', date: iso(n - 6 * D + 6 * H) },
      { id: 'y3', mpesaId: 'TKE2R6V1ZC', amount: 50, account: 'WB10002', customerId: 'c2', phone: '0723456789', date: iso(n - 14 * H) },
      { id: 'y4', mpesaId: 'TKF9H4J5QT', amount: 20, account: 'WB10004', customerId: 'c4', phone: '0745678901', date: iso(n - 3 * H) },
      { id: 'y5', mpesaId: 'TKA1B8C3DX', amount: 50, account: 'WB10002', customerId: 'c2', phone: '0723456789', date: iso(n - 2 * D - 14 * H) },
      { id: 'y6', mpesaId: 'TKC5M2L7SE', amount: 20, account: 'WB10004', customerId: 'c4', phone: '0745678901', date: iso(n - 4 * D) }
    ];
    db.payModes = [
      { id: 'b1', type: 'paybill', status: 'Active', fields: { paybill: '522522', bizName: 'AirBill WiFi Ltd', accFormat: 'Your account number e.g. WB10001' } },
      { id: 'b2', type: 'till', status: 'Active', fields: { till: '5123456', bizName: 'AirBill WiFi Ltd' } }
    ];
    db.messages = [
      { id: 'g1', customerId: 'c1', phone: '0712345678', type: 'subscribed', date: iso(n - 10 * D), text: 'Hi Achieng, your Monthly Premium package (KES 1,500) is now active. Account No: WB10001. Enjoy fast WiFi!' },
      { id: 'g2', customerId: 'c3', phone: '0734567890', type: 'subscribed', date: iso(n - 6 * D + 6 * H), text: 'Hi Faith, your Weekly Plus package (KES 300) is now active. Account No: WB10003. Enjoy fast WiFi!' },
      { id: 'g3', customerId: 'c2', phone: '0723456789', type: 'subscribed', date: iso(n - 14 * H), text: 'Hi Brian, your Daily Standard package (KES 50) is now active. Account No: WB10002. Enjoy fast WiFi!' }
    ];
    return db;
  }

  function get() {
    let raw = null;
    try { raw = localStorage.getItem(KEY); } catch (e) { }
    if (raw) { try { return Object.assign(emptyDB(), JSON.parse(raw)); } catch (e) { } }
    const db = seed(); save(db); return db;
  }
  function save(db) { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) { toast('Could not save - browser storage is blocked', true); } }

  /* ---------- business logic ---------- */
  const durMs = p => (p.durationUnit === 'hours' ? H : p.durationUnit === 'months' ? 30 * D : D) * Number(p.durationValue || 1);
  const durLabel = p => `${p.durationValue} ${p.durationValue == 1 ? p.durationUnit.replace(/s$/, '') : p.durationUnit}`;
  const planOf = (db, id) => db.plans.find(p => p.id === id);
  const custOf = (db, id) => db.customers.find(c => c.id === id);
  const routerOf = (db, id) => db.routers.find(r => r.id === id);

  function currentSub(db, customerId) {
    const list = db.subs.filter(s => s.customerId === customerId);
    return list.length ? list.reduce((a, b) => (new Date(b.expiry) > new Date(a.expiry) ? b : a)) : null;
  }
  function statusOf(sub) {
    if (!sub) return { k: 'none', label: 'No package', cls: 'b-gray' };
    const left = new Date(sub.expiry) - Date.now();
    if (left <= 0) return { k: 'expired', label: 'Expired', cls: 'b-bad', left };
    if (left <= WINDOW) return { k: 'expiring', label: 'Expiring soon', cls: 'b-warn', left };
    return { k: 'active', label: 'Active', cls: 'b-ok', left };
  }
  function timeLeft(ms) {
    if (ms <= 0) return 'Expired';
    const d = Math.floor(ms / D), h = Math.floor((ms % D) / H), m = Math.floor((ms % H) / 60000);
    return d > 0 ? `${d}d ${h}h` : h > 0 ? `${h}h ${m}m` : `${m}m`;
  }
  function modeSummary(m) {
    const f = m.fields || {};
    if (m.type === 'paybill') return `Paybill ${f.paybill}`;
    if (m.type === 'till') return `Till ${f.till}`;
    if (m.type === 'phone') return `Send money to ${f.phone}`;
    return `${f.bankName} A/C ${f.accNo}`;
  }
  function payHint(db) {
    const act = db.payModes.filter(m => m.status === 'Active').slice(0, 2).map(modeSummary);
    return act.length ? act.join(' or ') : 'our payment channels';
  }
  function addMessage(db, c, type, text) {
    const m = { id: uid('g'), customerId: c.id, phone: c.phone, type, text, date: new Date().toISOString() };
    db.messages.push(m); return m;
  }
  function activate(db, customerId, planId) {
    const plan = planOf(db, planId), c = custOf(db, customerId);
    const cur = currentSub(db, customerId);
    const running = cur && new Date(cur.expiry) > Date.now();
    const base = running ? new Date(cur.expiry).getTime() : Date.now();
    const sub = { id: uid('s'), customerId, planId, start: running ? cur.start : new Date().toISOString(), expiry: new Date(base + durMs(plan)).toISOString() };
    db.subs.push(sub); c.planId = planId;
    addMessage(db, c, 'subscribed', `Hi ${c.name.split(' ')[0]}, your ${plan.name} package (${money(plan.price)}) is now active until ${dt(sub.expiry)}. Account No: ${c.account}. Enjoy fast WiFi!`);
    return sub;
  }
  function sendReminder(db, customerId) {
    const c = custOf(db, customerId), sub = currentSub(db, customerId), plan = planOf(db, sub.planId);
    return addMessage(db, c, 'reminder', `Hi ${c.name.split(' ')[0]}, your ${plan.name} package ${new Date(sub.expiry) > Date.now() ? 'expires' : 'expired'} on ${dt(sub.expiry)}. To renew, pay ${payHint(db)} with Account No ${c.account}. Thank you.`);
  }

  /* ---------- UI helpers ---------- */
  function toast(msg, bad) {
    let w = document.querySelector('.toast-wrap');
    if (!w) { w = document.createElement('div'); w.className = 'toast-wrap'; document.body.appendChild(w); }
    const t = document.createElement('div'); t.className = 'toast' + (bad ? ' bad' : ''); t.textContent = msg; w.appendChild(t);
    setTimeout(() => { t.style.opacity = 0; t.style.transition = '.3s'; setTimeout(() => t.remove(), 300); }, 3200);
  }
  const openModal = id => document.getElementById(id).classList.add('open');
  const closeModal = id => document.getElementById(id).classList.remove('open');
  function wireModals() {
    document.querySelectorAll('.modal').forEach(m => {
      m.addEventListener('mousedown', e => { if (e.target === m) m.classList.remove('open'); });
      m.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => m.classList.remove('open')));
    });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') document.querySelectorAll('.modal.open').forEach(m => m.classList.remove('open')); });
  }
  function copy(text) {
    const done = () => toast('Copied to clipboard');
    if (navigator.clipboard) navigator.clipboard.writeText(text).then(done, done); else done();
  }

  /* ---------- authentication (browser-only) ---------- */
  const UKEY = 'airbill_users', SKEY = 'airbill_session';
  const PUBLIC = document.documentElement.hasAttribute('data-public');
  const readUsers = () => { try { return JSON.parse(localStorage.getItem(UKEY)) || []; } catch (e) { return []; } };
  const writeUsers = u => { try { localStorage.setItem(UKEY, JSON.stringify(u)); return true; } catch (e) { return false; } };
  const hasUsers = () => readUsers().length > 0;
  const canSubtle = () => !!(window.crypto && window.crypto.subtle);

  function newSalt() {
    const a = new Uint8Array(16);
    try { crypto.getRandomValues(a); } catch (e) { for (let i = 0; i < a.length; i++) a[i] = Math.floor(Math.random() * 256); }
    return Array.from(a, b => b.toString(16).padStart(2, '0')).join('');
  }
  async function hashPw(pw, salt, method) {
    if (method === 'p1') { // PBKDF2-SHA256 (needs localhost, https or file://)
      const enc = new TextEncoder();
      const key = await crypto.subtle.importKey('raw', enc.encode(pw), 'PBKDF2', false, ['deriveBits']);
      const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: enc.encode(salt), iterations: 120000 }, key, 256);
      return 'p1:' + btoa(String.fromCharCode.apply(null, new Uint8Array(bits)));
    }
    let h = 5381; const s = salt + pw; // weak fallback for insecure contexts
    for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
    return 'w1:' + h;
  }

  function current() {
    let raw = null;
    try { raw = sessionStorage.getItem(SKEY) || localStorage.getItem(SKEY); } catch (e) { }
    if (!raw) return null;
    try {
      const s = JSON.parse(raw), u = readUsers().find(x => x.email === s.email);
      return u ? { name: u.name, email: u.email, role: u.role } : null;
    } catch (e) { return null; }
  }
  function startSession(u, remember) {
    try {
      sessionStorage.removeItem(SKEY); localStorage.removeItem(SKEY);
      (remember ? localStorage : sessionStorage).setItem(SKEY, JSON.stringify({ email: u.email, at: Date.now() }));
    } catch (e) { }
  }
  async function register(data, remember) {
    const name = String(data.name || '').trim(), email = String(data.email || '').trim().toLowerCase(), password = String(data.password || '');
    if (name.length < 2) throw new Error('Enter your full name.');
    if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error('Enter a valid email address.');
    if (password.length < 8) throw new Error('Password must be at least 8 characters.');
    const users = readUsers();
    if (users.some(u => u.email === email)) throw new Error('An account with this email already exists. Please sign in.');
    const salt = newSalt(), method = canSubtle() ? 'p1' : 'w1';
    const u = { id: uid('u'), name, email, salt, hash: await hashPw(password, salt, method), role: users.length ? 'Staff' : 'Admin', created: new Date().toISOString() };
    users.push(u);
    if (!writeUsers(users)) throw new Error('Could not save the account - browser storage is blocked.');
    startSession(u, remember);
    return u;
  }
  async function login(email, password, remember) {
    email = String(email || '').trim().toLowerCase();
    const u = readUsers().find(x => x.email === email);
    if (!email || !password) throw new Error('Enter your email and password.');
    const bad = new Error('Incorrect email or password.');
    if (!u) throw bad;
    const method = String(u.hash).slice(0, 2);
    if (method === 'p1' && !canSubtle()) throw new Error('This page must be opened from localhost, https or as a local file to sign in.');
    if ((await hashPw(String(password), u.salt, method)) !== u.hash) throw bad;
    startSession(u, remember);
    return u;
  }
  function logout() {
    try { sessionStorage.removeItem(SKEY); localStorage.removeItem(SKEY); } catch (e) { }
    location.replace('login.html');
  }

  // Guard: every page except the login page needs a signed-in user.
  function toLogin() {
    const here = location.pathname.split('/').pop() || 'index.html';
    location.replace('login.html?next=' + encodeURIComponent(here));
  }
  if (!PUBLIC && !current()) { document.documentElement.style.visibility = 'hidden'; toLogin(); }
  window.addEventListener('pageshow', e => { if (e.persisted && !PUBLIC && !current()) toLogin(); }); // Back button after sign-out

  const NAV = [
    ['Overview', [['index', 'Dashboard', 'home']]],
    ['Operations', [['subscribers', 'Subscribers', 'wifi'], ['customers', 'Customers', 'users'], ['payments', 'Payments', 'cash'], ['messages', 'Messages', 'chat']]],
    ['Setup', [['plans', 'Packages', 'box'], ['mikrotik', 'MikroTik Routers', 'router'], ['billing', 'Billing Setup', 'wallet']]]
  ];

  function shell(active, title, sub) {
    document.title = title + ' - AirBill';
    const me = current() || { name: 'Guest', email: '', role: '' };
    const sb = document.getElementById('sidebar');
    sb.innerHTML = `
      <a class="brand" href="index.html">
        <div class="brand-mark">${ic('wifi', 22)}</div>
        <div><div class="brand-name">AirBill</div><div class="brand-tag">WiFi Billing Suite</div></div>
      </a>
      <nav class="nav">${NAV.map(g => `<div class="nav-group">${g[0]}</div>` + g[1].map(i => `<a href="${i[0]}.html" class="${i[0] === active ? 'active' : ''}">${ic(i[2])}${i[1]}</a>`).join('')).join('')}</nav>
      <div class="side-foot">
        <div class="who" style="margin-bottom:12px"><div class="av" style="background:linear-gradient(135deg,var(--gold2),var(--goldd));color:var(--ink)">${esc(initials(me.name))}</div><div style="min-width:0"><div style="color:#fff;font-weight:600;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(me.name)}</div><div style="font-size:11.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(me.role)}${me.role ? ' &middot; ' : ''}${esc(me.email)}</div></div></div>
        <button id="logout" class="btn btn-sm" style="width:100%;justify-content:center;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.14);color:#e6ebf5;text-decoration:none;margin-top:0;font-size:13px;padding:9px">Sign out</button>
        <div style="margin-top:12px">Data is stored in this browser.<br><button id="wipe">Clear all data</button></div>
      </div>`;
    const bd = document.createElement('div'); bd.className = 'backdrop'; document.body.appendChild(bd);
    const tb = document.getElementById('topbar');
    tb.innerHTML = `<button class="burger" id="burger" aria-label="Menu">${ic('menu', 20)}</button>
      <div><h1>${esc(title)}</h1><p>${esc(sub || '')}</p></div>
      <div class="top-right"><span class="date-chip">${new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span><div class="avatar" title="${esc(me.name)}">${esc(initials(me.name))}</div></div>`;
    const tog = () => { sb.classList.toggle('open'); bd.classList.toggle('open'); };
    document.getElementById('burger').onclick = tog; bd.onclick = tog;
    document.getElementById('logout').onclick = logout;
    document.getElementById('wipe').onclick = () => {
      if (confirm('This permanently deletes ALL customers, packages, payments and settings stored in this browser. Continue?')) { save(emptyDB()); location.reload(); }
    };
    wireModals();
  }

  window.App = { auth: { current, register, login, logout, hasUsers }, get, save, uid, esc, money, dt, dshort, initials, ic, durMs, durLabel, planOf, custOf, routerOf, currentSub, statusOf, timeLeft, modeSummary, payHint, addMessage, activate, sendReminder, toast, openModal, closeModal, copy, shell, H, D, WINDOW };
})();
