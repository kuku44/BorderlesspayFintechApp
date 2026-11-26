import { useEffect, useRef, useState } from 'react';
import IncomePassport from './IncomePassport';

type IconName = 'grid' | 'invoice' | 'passport' | 'spark' | 'settings' | 'help' | 'arrow' | 'plus' | 'check' | 'close' | 'download' | 'wallet' | 'globe' | 'logout' | 'copy';
const paths: Record<IconName, string> = {
  grid: 'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',
  invoice: 'M6 3h12v19l-3-2-3 2-3-2-3 2V3z M9 8h6 M9 12h6',
  passport: 'M5 3h14v18H5z M8 17h8 M16 10a4 4 0 1 1-8 0 4 4 0 0 1 8 0z M12 6v8 M8 10h8',
  spark: 'm12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3z',
  settings: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8 M9 3h6l1 3 3 1 2 5-2 5-3 1-1 3H9l-1-3-3-1-2-5 2-5 3-1 1-3z',
  help: 'M9 9a3 3 0 1 1 4 3v3 M12 18h.01 M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',
  arrow: 'M5 12h14 M14 7l5 5-5 5', plus: 'M12 5v14 M5 12h14',
  check: 'm5 12 4 4L19 6', close: 'm6 6 12 12 M6 18 18 6',
  download: 'M12 3v12 m-5-5 5 5 5-5 M4 16v5h16v-5',
  wallet: 'M20 7H4V4h14v3 M4 7v13h17V7H4z M16 12h5v4h-5z',
  globe: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0 M3 12h18 M12 3c5 5 5 13 0 18-5-5-5-13 0-18',
  logout: 'M9 4H4v16h5 M10 12h11 m-4-4 4 4-4 4',
  copy: 'M8 8h12v13H8z M16 8V3H3v13h5',
};
function Icon({ name, className = '' }: { name: IconName; className?: string }) {
  return <svg className={`h-5 w-5 shrink-0 ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]} /></svg>;
}
export type Profile = { name: string; id: string; role: string; phone: string };
type Settlement = { grossCents: number; feeCents: number; netCents: number; wireFeeCents: number; kesCents: number; rate: number; paidAt: string; phone: string };
export type Invoice = { id: string; client: string; initials: string; project: string; amount: number; status: 'paid' | 'pending'; date: string; color: string; settlement?: Settlement };
const EXCHANGE_RATE = 129;
// Calculate in minor units. Round the USD fee first, then convert the net payout.
function money(amount: number, rate = EXCHANGE_RATE) {
  const grossCents = Math.round(amount * 100);
  const feeCents = Math.round(grossCents * 15 / 1000);
  const wireFeeCents = Math.round(grossCents * 15 / 100);
  const netCents = grossCents - feeCents;
  return { grossCents, feeCents, netCents, wireFeeCents, kesCents: Math.round(netCents * rate), rate };
}
const financials = (invoice: Invoice) => invoice.settlement ?? money(invoice.amount);
function validProfile(value: unknown): value is Profile {
  if (!value || typeof value !== 'object') return false;
  const p = value as Profile;
  return [p.name, p.id, p.role, p.phone].every(v => typeof v === 'string' && v.trim().length > 0);
}
function validInvoices(value: unknown): value is Invoice[] {
  return Array.isArray(value) && value.every(i =>
    i && ['id', 'client', 'initials', 'project', 'color'].every(k => typeof i[k] === 'string')
    && Number.isFinite(i.amount) && i.amount > 0 && i.amount <= 1000000
    && ['paid', 'pending'].includes(i.status) && Number.isFinite(Date.parse(i.date))
    && (!i.settlement || (
      ['grossCents', 'feeCents', 'netCents', 'wireFeeCents', 'kesCents', 'rate'].every(k => Number.isFinite(i.settlement[k]) && i.settlement[k] >= 0)
      && typeof i.settlement.phone === 'string' && Number.isFinite(Date.parse(i.settlement.paidAt))
    ))
  );
}
const demo: Profile = { name: 'Amina Hassan', id: 'REF-2024-084291', role: 'Web developer', phone: '+254712345678' };
const initialInvoices: Invoice[] = [
  { id: 'INV-008', client: 'Linear Studio', initials: 'L', project: 'Website design & development', amount: 850, status: 'pending', date: new Date().toISOString(), color: 'bg-violet-100 text-violet-700' },
  { id: 'INV-007', client: 'Acme Inc.', initials: 'a', project: 'Landing page development', amount: 1200, status: 'paid', date: new Date(Date.now() - 3 * 86400000).toISOString(), color: 'bg-orange-100 text-orange-700' },
  { id: 'INV-006', client: 'Notion Labs', initials: 'N', project: 'Webflow website updates', amount: 650, status: 'paid', date: new Date(Date.now() - 12 * 86400000).toISOString(), color: 'bg-stone-100 text-stone-800' },
  { id: 'INV-005', client: 'Layers', initials: '◈', project: 'Frontend development', amount: 950, status: 'paid', date: new Date(Date.now() - 23 * 86400000).toISOString(), color: 'bg-blue-100 text-blue-700' },
];
function load<T,>(key: string, fallback: T, validate?: (value: unknown) => boolean): T {
  try {
    const value = JSON.parse(localStorage.getItem(key) || 'null');
    return value !== null && (!validate || validate(value)) ? value : fallback;
  } catch { return fallback; }
}
const usd = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const field = 'mt-2 min-h-12 w-full rounded-lg border border-stone-300 bg-white px-3 text-sm outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100';
const primary = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#12664f] px-5 text-sm font-medium text-white transition hover:bg-[#0c503e] focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:opacity-60';
const secondary = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-stone-200 bg-white px-4 text-sm font-medium hover:bg-stone-50 focus-visible:ring-2 focus-visible:ring-emerald-500';

function Modal({ title, close, children }: { title: string; close: () => void; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement;
    const nodes = () => Array.from(ref.current?.querySelectorAll<HTMLElement>('button, input, select, textarea, [tabindex="0"]') || []);
    nodes()[0]?.focus();
    function key(e: KeyboardEvent) {
      if (e.key === 'Escape') close();
      if (e.key === 'Tab') {
        const all = nodes(), first = all[0], last = all[all.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
        if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
      }
    }
    document.addEventListener('keydown', key);
    return () => { document.removeEventListener('keydown', key); previous?.focus(); };
  }, []);
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/40 p-5 backdrop-blur-sm" onClick={close}>
    <div ref={ref} role="dialog" aria-modal="true" aria-labelledby="dialog-title" className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-7 shadow-xl" onClick={e => e.stopPropagation()}>
      <div className="mb-6 flex items-center justify-between"><h2 id="dialog-title" className="text-xl font-semibold">{title}</h2><button className={secondary} aria-label="Close dialog" onClick={close}><Icon name="close" /></button></div>{children}
    </div>
  </div>;
}

export default function App() {
  const [profile, setProfile] = useState<Profile>(() => load('bp-profile', demo, validProfile));
  const [invoices, setInvoices] = useState<Invoice[]>(() => load('bp-invoices', initialInvoices, validInvoices).map(i =>
    i.status === 'paid' && !i.settlement ? { ...i, settlement: { ...money(i.amount), paidAt: i.date, phone: load('bp-profile', demo, validProfile).phone } } : i
  ));
  const [route, setRoute] = useState(location.pathname);
  const [section, setSection] = useState(() => load('bp-section', 'Overview', v => ['Overview', 'Invoices', 'Income passport', 'My profile', 'AI contract assistant', 'Help'].includes(String(v))));
  const [modal, setModal] = useState(false);
  const [toast, setToast] = useState('');
  const [filter, setFilter] = useState(() => load('bp-filter', 'All invoices', v => ['All invoices', 'Pending', 'Paid'].includes(String(v))));
  const [processing, setProcessing] = useState(false);
  const [clause, setClause] = useState('');
  const [clauseType, setClauseType] = useState('Payment protection');
  const [storageError, setStorageError] = useState(false);
  const [quoteAmount, setQuoteAmount] = useState('850');
  const paymentLock = useRef(false);
  const [invoiceAmount, setInvoiceAmount] = useState('');
  const quote = money(Number(quoteAmount) || 0);
  const draftQuote = money(Number(invoiceAmount) || 0);
  useEffect(() => {
    try {
      localStorage.setItem('bp-profile', JSON.stringify(profile));
      localStorage.setItem('bp-invoices', JSON.stringify(invoices));
      localStorage.setItem('bp-section', JSON.stringify(section));
      localStorage.setItem('bp-filter', JSON.stringify(filter));
      setStorageError(false);
    } catch { setStorageError(true); }
  }, [profile, invoices, section, filter]);
  useEffect(() => { const pop = () => setRoute(location.pathname); addEventListener('popstate', pop); return () => removeEventListener('popstate', pop); }, []);
  useEffect(() => { if (toast) { const timer = setTimeout(() => setToast(''), 6000); return () => clearTimeout(timer); } }, [toast]);
  function navigate(path: string) { history.pushState({}, '', path); setRoute(path); window.scrollTo(0, 0); }
  function nav(name: string) { setSection(name); navigate(name === 'Income passport' ? '/passport/amina' : name === 'My profile' ? '/onboard' : '/'); }
  const paid = invoices.filter(i => i.status === 'paid');
  const earnings = paid.reduce((s, i) => s + financials(i).grossCents, 0) / 100;
  const totalFees = paid.reduce((s, i) => s + financials(i).feeCents, 0) / 100;
  const totalPayout = paid.reduce((s, i) => s + financials(i).kesCents, 0) / 100;
  const pending = invoices.filter(i => i.status === 'pending');
  const pendingTotal = pending.reduce((s, i) => s + money(i.amount).grossCents, 0) / 100;
  const currentInvoice = invoices.find(i => i.id === decodeURIComponent(route.split('/')[2] || ''));
  const isPay = route.startsWith('/pay/');
  const isPassport = route.startsWith('/passport/');
  const isOnboard = route === '/onboard';
  const checkout = currentInvoice ? financials(currentInvoice) : money(0);
  function pay(invoice: Invoice) {
    if (paymentLock.current || invoice.status === 'paid') return;
    paymentLock.current = true;
    setProcessing(true);
    const settlement: Settlement = { ...money(invoice.amount), paidAt: new Date().toISOString(), phone: profile.phone };
    setTimeout(() => {
      settlement.paidAt = new Date().toISOString();
      setInvoices(list => list.map(i => i.id === invoice.id && i.status === 'pending' ? { ...i, status: 'paid', settlement } : i));
      setProcessing(false);
      paymentLock.current = false;
      setToast(`KES ${usd(settlement.kesCents / 100)} sent to M-pesa ${settlement.phone}!`);
    }, 2000);
  }
  const navItems: [string, IconName][] = [['Overview', 'grid'], ['Invoices', 'invoice'], ['Income passport', 'passport'], ['AI contract assistant', 'spark']];
  function invoiceRows() {
    const filtered = invoices.filter(i => filter === 'All invoices' || i.status === filter.toLowerCase());
    return <><div className="overflow-x-auto"><table className="w-full whitespace-nowrap text-left text-sm">
      <thead className="border-y border-stone-100 bg-[#fafbf9] text-xs text-stone-600"><tr>{['Client / Project', 'Amount', 'Status', 'Date', ''].map(h => <th key={h} className="px-5 py-3 font-medium">{h}</th>)}</tr></thead>
      <tbody>{filtered.map(i => <tr key={i.id} className="border-b border-stone-100 last:border-0">
        <td className="px-5 py-4"><div className="flex items-center gap-3"><span className={`flex h-10 w-10 items-center justify-center rounded-lg text-lg font-semibold ${i.color}`}>{i.initials}</span><div className="min-w-0"><p className="font-medium">{i.client}</p><p className="mt-1 text-xs text-stone-600">{i.project}</p></div></div></td>
        <td className="px-5 py-4 font-semibold">${usd(i.amount)}<span className="ml-1 text-xs font-normal text-stone-600">USD</span></td>
        <td className="px-5 py-4"><span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${i.status === 'paid' ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'}`}><span className={`h-1.5 w-1.5 rounded-full ${i.status === 'paid' ? 'bg-emerald-600' : 'bg-amber-600'}`} />{i.status === 'paid' ? 'Paid' : 'Pending'}</span></td>
        <td className="px-5 py-4 text-stone-600">{new Date(i.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
        <td className="pr-4"><button className="flex min-h-11 min-w-11 items-center justify-center rounded-lg hover:bg-stone-100 focus-visible:ring-2 focus-visible:ring-emerald-700" aria-label={`View invoice ${i.id}`} onClick={() => navigate(`/pay/${i.id}`)}><Icon name="arrow" /></button></td>
      </tr>)}</tbody></table></div>{filtered.length === 0 && <p className="p-8 text-sm text-stone-600">No invoices with this status yet.</p>}</>;
  }

  return <div className="min-h-screen overflow-x-hidden bg-[#f7f8f5] font-sans text-[#202c28] selection:bg-emerald-200">
    {!isPay && <aside className="fixed inset-y-0 left-0 z-20 hidden w-[232px] flex-col border-r border-stone-200 bg-white px-5 py-8 lg:flex print:hidden">
      <Brand /><div className="mt-10 px-3 text-xs font-medium tracking-[.14em] text-stone-600">WORKSPACE</div>
      <nav className="mt-4 space-y-1.5">{navItems.map(([name, icon]) => <button key={name} onClick={() => nav(name)} className={`flex min-h-12 w-full items-center gap-3 rounded-lg px-3 text-left text-sm transition focus-visible:ring-2 focus-visible:ring-emerald-700 ${(isPassport ? name === 'Income passport' : !isOnboard && section === name) ? 'bg-[#eaf3ed] font-semibold text-[#14654d]' : 'text-stone-600 hover:bg-stone-50'}`}><Icon name={icon} />{name}{name === 'AI contract assistant' && <span className="ml-auto rounded bg-[#e9ecf6] px-1 text-xs text-slate-700">AI</span>}</button>)}</nav>
      <div className="mt-auto"><div className="mb-6 rounded-xl border border-[#dce9dc] bg-[#f4f8f1] p-4"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e4eddb] text-emerald-800"><Icon name="globe" /></span><p className="mt-3 text-sm font-semibold">Your talent. No borders.</p><p className="mt-2 text-xs leading-5 text-stone-600">Built for your ambition, wherever you call home.</p></div>
      <button onClick={() => nav('My profile')} className="flex min-h-11 w-full items-center gap-3 px-3 text-sm text-stone-600"><Icon name="settings" />My profile</button>
      <button onClick={() => { setSection('Help'); navigate('/'); }} className="flex min-h-11 w-full items-center gap-3 px-3 text-sm text-stone-600"><Icon name="help" />Help & support</button>
      <div className="mt-5 flex items-center gap-3 border-t border-stone-200 pt-5"><Avatar name={profile.name} /><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{profile.name}</p><p className="text-xs text-stone-600">Personal account</p></div><button aria-label="Edit profile" className="min-h-11" onClick={() => navigate('/onboard')}><Icon name="logout" /></button></div></div>
    </aside>}
    <div className={!isPay ? 'lg:ml-[232px]' : ''}>
      <header className="flex min-h-20 items-center justify-between gap-4 border-b border-stone-200 bg-white px-5 md:px-9 print:hidden">
        {isPay ? <Brand /> : <><span className="hidden text-sm text-stone-600 lg:block">Workspace <span className="mx-3 text-stone-500">/</span><span className="font-medium text-stone-800">{isPassport ? 'Income passport' : isOnboard ? 'My profile' : section}</span></span><div className="lg:hidden"><Brand /></div></>}
        <div className="flex items-center gap-4"><span className="hidden items-center gap-2 rounded-full border border-stone-200 px-3 py-1.5 text-xs text-stone-600 sm:flex"><span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />Local demo workspace</span><Avatar name={profile.name} /></div>
      </header>
      {!isPay && <nav className="flex gap-1 overflow-x-auto border-b border-stone-200 bg-white px-4 lg:hidden print:hidden">{navItems.map(([name]) => <button className="min-h-12 shrink-0 px-3 text-sm font-medium" key={name} onClick={() => nav(name)}>{name}</button>)}<button className="min-h-12 shrink-0 px-3 text-sm" onClick={() => navigate('/onboard')}>My profile</button></nav>}
      <main className={`mx-auto w-full ${isPay ? 'max-w-2xl' : 'max-w-[1440px]'} p-5 md:p-9`}>
        {storageError && <p role="alert" className="mb-5 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">Browser storage is unavailable or full. Changes work for this session but may not survive a refresh.</p>}
        {isOnboard ? <div className="mx-auto max-w-xl py-7"><p className="text-sm font-medium text-emerald-800">YOUR NEXT CHAPTER STARTS HERE</p><h1 className="mt-3 text-3xl font-semibold tracking-tight">Your talent belongs everywhere.</h1><p className="mt-3 text-sm leading-6 text-stone-600">Set up your freelancer profile to invoice globally and receive demo payouts locally.</p>
          <form className="mt-8 space-y-5 rounded-2xl border border-stone-200 bg-white p-7" onSubmit={e => { e.preventDefault(); const d = new FormData(e.currentTarget); setProfile({ name: String(d.get('name')), id: String(d.get('id')), role: String(d.get('role')), phone: String(d.get('phone')) }); setSection('Overview'); navigate('/'); setToast('Profile saved on this device. Identity verification is simulated.'); }}>
            <button type="button" className={`${secondary} w-full`} onClick={() => { setProfile({ ...demo }); const form = document.querySelector('form'); if (form) { (form.elements.namedItem('name') as HTMLInputElement).value = demo.name; (form.elements.namedItem('id') as HTMLInputElement).value = demo.id; (form.elements.namedItem('role') as HTMLInputElement).value = demo.role; (form.elements.namedItem('phone') as HTMLInputElement).value = demo.phone; } }}><Icon name="spark" />Fill Demo profile (Amina from Kakuma)</button>
            {([['name', 'Full name', profile.name], ['id', 'Refugee / alien ID number', profile.id], ['role', 'Your role', profile.role], ['phone', 'M-pesa number (+254)', profile.phone]] as const).map(([key, label, val]) => <label key={key} className="block text-sm font-medium">{label}<input className={field} name={key} defaultValue={val} required pattern={key === 'phone' ? '\\+254[0-9]{9}' : undefined} title={key === 'phone' ? 'Enter +254 followed by 9 digits' : undefined} /></label>)}
            <p className="text-xs leading-5 text-stone-600">Demo only. Use fictional identity details. Your profile is stored in this browser, not submitted for legal verification.</p><button className={`${primary} w-full`}>Save & open dashboard<Icon name="arrow" /></button>
          </form></div>
        : isPay ? currentInvoice ? <div className="py-6"><div className="mb-7 text-center"><span className="text-sm font-medium text-emerald-800">BORDERLESS WORK. SIMPLE PAYMENTS.</span><h1 className="mt-3 text-3xl font-semibold">Great work deserves a smooth payment.</h1><p className="mt-3 text-sm text-stone-600">You’re paying {profile.name}, {profile.role.toLowerCase()}.</p></div>
          <section className="rounded-2xl border border-stone-200 bg-white p-7 md:p-9"><div className="flex justify-between"><Avatar name={profile.name} /><span className="text-sm text-stone-600">{currentInvoice.id}</span></div><h2 className="mt-6 text-xl font-semibold">{currentInvoice.project}</h2><p className="mt-2 text-sm text-stone-600">Billed to {currentInvoice.client}</p><div className="my-6 rounded-lg bg-emerald-50 p-4 text-sm leading-6 text-emerald-900"><span className="flex items-center gap-2 font-medium"><Icon name="passport" />Freelancer profile · Not independently verified</span><p className="mt-2 text-xs">Demo only. Identity, work authorization and legal compliance require review by the relevant provider.</p></div>
          <div className="space-y-4 text-sm">
            <div className="flex justify-between gap-4"><span>Project total</span><strong>${usd(checkout.grossCents / 100)}</strong></div>
            <div className="flex justify-between gap-4 text-stone-600"><span>Borderlesspay fee (1.5%, deducted from payout)</span><span>${usd(checkout.feeCents / 100)}</span></div>
            <div className="flex justify-between gap-4 text-stone-600"><span>Traditional wire comparison (15%)</span><span className="line-through">${usd(checkout.wireFeeCents / 100)}</span></div>
            <div className="flex justify-between gap-4"><span>Net earnings in USD</span><strong>${usd(checkout.netCents / 100)}</strong></div>
            <div className="flex flex-wrap justify-between gap-3 rounded-lg bg-[#f4f7ef] p-3 text-emerald-900"><span>Freelancer receives · 1 USD = {checkout.rate} KES</span><strong>KES {usd(checkout.kesCents / 100)}</strong></div>
            <p className="text-xs text-stone-600">Save ${usd((checkout.wireFeeCents - checkout.feeCents) / 100)} versus the wire comparison. Fees rounded to the nearest US cent before conversion.</p>
            {currentInvoice.settlement && <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-900">Demo payout recorded {new Date(currentInvoice.settlement.paidAt).toLocaleString()} to {currentInvoice.settlement.phone}. This receipt retains the original fee, rate, and recipient.</p>}
            <div className="flex justify-between border-t border-stone-200 pt-5 text-lg font-semibold"><span>Total to pay</span><span>${usd(checkout.grossCents / 100)} USD</span></div>
          </div>
          <button disabled={processing || currentInvoice.status === 'paid'} onClick={() => pay(currentInvoice)} className={`${primary} mt-7 w-full`}>{processing ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent motion-reduce:animate-none" />Processing payment…</> : currentInvoice.status === 'paid' ? <><Icon name="check" />Payment complete</> : <>Pay now · ${usd(currentInvoice.amount)}<Icon name="arrow" /></>}</button><p className="mt-4 text-center text-xs text-stone-600">Simulated checkout. No real charge or M-pesa transfer occurs.</p></section><button className={`${secondary} mt-5`} onClick={() => nav('Overview')}>Back to workspace</button></div> : <div className="py-20 text-center"><h1 className="text-2xl font-semibold">Invoice not found</h1><p className="my-4 text-sm text-stone-600">Demo invoices are available only in the browser where they were created.</p><button className={primary} onClick={() => nav('Overview')}>Go to dashboard</button></div>
        : isPassport ? <IncomePassport profile={profile} updateProfile={setProfile} invoices={invoices} financials={financials} />
        : section === 'AI contract assistant' ? <><PageTitle eyebrow="MORE CONFIDENCE. LESS PAPERWORK." title="Make room for great work." description="Create a starting point for your next freelance contract." /><div className="mt-8 grid gap-6 md:grid-cols-2"><section className="rounded-xl border border-stone-200 bg-white p-7"><span className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-[#eef1e6] text-emerald-800"><Icon name="spark" /></span><h2 className="text-xl font-semibold">AI contract clause generator</h2><p className="mt-3 text-sm leading-6 text-stone-600">Demo template assistant. Generates clauses locally without an AI service. Not legal advice.</p><label className="mt-6 block text-sm font-medium">What would you like to protect?<select className={field} value={clauseType} onChange={e => setClauseType(e.target.value)}>{['Payment protection', 'Scope of work', 'Intellectual property', 'Late payments'].map(t => <option key={t}>{t}</option>)}</select></label><button className={`${primary} mt-6 w-full`} onClick={() => setClause(({ 'Payment protection': `The Client shall pay ${profile.name} in USD through the agreed payment method. A 50% deposit is due before work begins, with the remaining 50% payable within 14 days of delivery. Processing fees and exchange rates will be disclosed before payment.`, 'Scope of work': `The services provided by ${profile.name} are limited to the deliverables agreed in writing. Any additional work requires written approval of an updated timeline and fee before commencement. Two rounds of revisions are included unless otherwise agreed.`, 'Intellectual property': `Upon receipt of full payment, ownership of the final agreed deliverables transfers to the Client. ${profile.name} retains ownership of pre-existing tools, reusable code, and concepts not included in the final deliverables. Third-party materials remain subject to their original licenses.`, 'Late payments': `Invoices are payable within 14 calendar days. If payment is overdue, ${profile.name} may pause further work after providing 7 days’ written notice. Any late-payment charges must be separately agreed in writing and comply with applicable law.` })[clauseType] || '')}><Icon name="spark" />Generate clause</button></section><section className="rounded-xl border border-stone-200 bg-white p-7"><h2 className="font-semibold">Your contract clause</h2><textarea aria-label="Generated contract clause" className={`${field} mt-5 min-h-64 resize-y leading-7`} placeholder="Your editable clause will appear here…" value={clause} onChange={e => setClause(e.target.value)} /><button disabled={!clause} className={`${secondary} mt-4`} onClick={() => { navigator.clipboard?.writeText(clause).then(() => setToast('Clause copied to clipboard.')).catch(() => setToast('Select the clause text to copy it manually.')); }}><Icon name="copy" />Copy clause</button><p className="mt-5 text-xs leading-5 text-stone-600">Have a qualified legal professional review your contract before signing.</p></section></div></>
        : section === 'Help' ? <><PageTitle eyebrow="WE’RE IN YOUR CORNER" title="A little help along the way." description="Everything you need to explore your Borderlesspay demo." /><div className="mt-8 space-y-4">{[['How do payments work?', 'Create an invoice, open its payment page, and select Pay now. After a two-second simulation, your invoice is marked paid and a demo M-pesa notification appears.'], ['Where is my information stored?', 'Your profile and invoices stay in local storage in this browser. This demo does not send payments or verify identities.'], ['How do I export my income passport?', 'Open Income passport and select Download PDF statement. Choose Save as PDF in your browser’s print dialog.']].map(([q, a]) => <details key={q} className="rounded-xl border border-stone-200 bg-white p-5"><summary className="cursor-pointer text-sm font-semibold">{q}</summary><p className="mt-4 text-sm leading-6 text-stone-600">{a}</p></details>)}</div></>
        : <><PageTitle eyebrow="LET’S KEEP YOU MOVING FORWARD" title={section === 'Invoices' ? 'Good work. On the record.' : `Welcome back, ${profile.name.split(' ')[0]}`} description={section === 'Invoices' ? 'All your projects and payments, in one place.' : 'Your work crosses borders. Your money should too.'} action={<button className={primary} onClick={() => setModal(true)}><Icon name="plus" />Create new invoice</button>} />
          {section === 'Overview' && <><div className="mt-7 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#dce8d7] bg-[#eff5e9] px-4 py-3"><p className="flex items-center gap-2 text-sm text-[#365f3b]"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#dceacb]"><Icon name="check" className="h-4 w-4" /></span>Your next opportunity has no borders. Let’s make it count.</p><span className="text-xs font-medium text-[#365f3b]">Made for your next chapter ↗</span></div>
          <div className="mt-6 grid gap-5 md:grid-cols-3"><section className="relative overflow-hidden rounded-xl bg-[#155b47] p-6 text-white"><div className="absolute -right-10 -top-14 h-52 w-52 rounded-full border-[24px] border-white/5" /><div className="relative"><p className="flex items-center justify-between text-sm text-emerald-50">Total earned<Icon name="wallet" /></p><p className="mt-5 text-[34px] font-semibold tracking-tight">${usd(earnings)}<span className="ml-2 text-sm font-normal text-emerald-50">USD</span></p><p className="mt-2 text-sm text-emerald-50">KES {usd(earnings * 129)}</p><div className="mt-6 flex items-center gap-2 border-t border-emerald-100/20 pt-4 text-xs text-emerald-50"><span className="rounded bg-white/15 px-1.5 py-0.5">↗ {paid.length} paid</span>Across your freelance projects</div></div></section>
          <section className="rounded-xl border border-stone-200 bg-white p-6"><p className="flex items-center justify-between text-sm text-stone-600">Pending payments<Icon name="invoice" /></p><p className="mt-5 text-[34px] font-semibold tracking-tight">${usd(pendingTotal)}<span className="ml-2 text-sm font-normal text-stone-600">USD</span></p><p className="mt-2 text-sm text-stone-600">{pending.length} invoice{pending.length !== 1 ? 's' : ''} awaiting payment</p><button onClick={() => { setFilter('Pending'); setSection('Invoices'); }} className="mt-4 flex min-h-11 items-center gap-2 text-sm font-medium text-emerald-800">View pending invoices<Icon name="arrow" className="h-4 w-4" /></button></section>
          <section className="min-w-0 rounded-xl border border-stone-200 bg-white p-6"><p className="flex items-center justify-between text-sm text-stone-600">Paid out to M-pesa<span className="rounded bg-[#eef4e6] px-2 py-1 text-xs font-semibold text-[#356632]">M-PESA</span></p><p className="mt-5 break-words text-[30px] font-semibold tracking-tight">{usd(totalPayout)}<span className="ml-2 text-sm font-normal text-stone-600">KES</span></p><p className="mt-2 flex items-center gap-1 text-sm text-emerald-800"><Icon name="check" className="h-4 w-4" />{profile.phone.replace(/(\d{3})\d{3}(\d{3})$/, '$1 *** $2')}</p><p className="mt-7 text-xs text-stone-600">${usd(totalFees)} in fees · Simulated payouts</p></section></div></>}
          <div className={`mt-7 grid gap-6 ${section === 'Overview' ? 'xl:grid-cols-[minmax(0,1fr)_285px]' : ''}`}><section className="min-w-0 overflow-hidden rounded-xl border border-stone-200 bg-white"><div className="flex items-center justify-between gap-3 px-5 py-5"><h2 className="text-base font-semibold">{section === 'Overview' ? 'Recent invoices' : 'All invoices'} <span className="ml-2 rounded-md bg-stone-100 px-2 py-1 text-xs text-stone-600">{invoices.length}</span></h2>{section === 'Overview' ? <button onClick={() => setSection('Invoices')} className="min-h-11 text-sm font-medium text-emerald-800">View all <span className="ml-2">↗</span></button> : <select aria-label="Filter invoices by status" value={filter} onChange={e => setFilter(e.target.value)} className="min-h-11 rounded-lg border border-stone-200 px-3 text-sm">{['All invoices', 'Pending', 'Paid'].map(f => <option key={f}>{f}</option>)}</select>}</div>{invoiceRows()}</section>
          {section === 'Overview' && <section className="relative flex flex-col overflow-hidden rounded-xl border border-[#d9e3d5] bg-[#eef2e8] p-6"><div className="flex items-center gap-2 text-xs font-semibold tracking-widest text-emerald-900"><Icon name="passport" />INCOME PASSPORT</div><div className="relative my-5 h-24"><div className="absolute left-4 top-2 h-24 w-40 rotate-[-9deg] rounded-lg border border-[#c9d4c1] bg-[#dce5d4]" /><div className="absolute left-7 top-0 h-24 w-40 rotate-[4deg] rounded-lg border border-[#cbd7c4] bg-[#fafcf7] p-3 shadow-sm"><div className="flex items-center justify-between"><span className="text-xs font-semibold text-emerald-900">borderlesspay</span><Icon name="globe" className="h-4 w-4 text-emerald-800" /></div><div className="mt-3 h-1.5 w-16 rounded bg-[#dce5d4]" /><div className="mt-2 h-1.5 w-24 rounded bg-[#dce5d4]" /><span className="absolute bottom-2 right-3 flex h-7 w-7 items-center justify-center rounded-full bg-[#e2edd8] text-emerald-800"><Icon name="check" className="h-4 w-4" /></span></div></div><h2 className="mt-4 text-xl font-semibold tracking-tight">Your work. Your proof.</h2><p className="mt-3 text-sm leading-6 text-stone-600">Turn your earnings into a verified financial identity. Built for your next big step.</p><button onClick={() => nav('Income passport')} className={`${secondary} mt-5 w-full border-[#c7d2c0] bg-transparent text-emerald-900`}>View income passport<Icon name="arrow" className="h-4 w-4" /></button></section>}</div>
          {section === 'Overview' && <div className="mt-6 grid gap-5 md:grid-cols-2"><section className="flex items-start gap-4 rounded-xl border border-stone-200 bg-white p-5"><span className="rounded-lg bg-[#f1f3e9] p-3 text-emerald-800"><Icon name="spark" /></span><div><h3 className="text-sm font-semibold">Good contracts. Better peace of mind.</h3><p className="mt-2 text-sm text-stone-600">Create clear, freelancer-friendly contract clauses.</p><button className="mt-2 flex min-h-11 items-center gap-2 text-sm font-medium text-emerald-800" onClick={() => nav('AI contract assistant')}>Try the AI contract assistant<Icon name="arrow" className="h-4 w-4" /></button></div></section><section className="flex items-start gap-4 rounded-xl border border-stone-200 bg-white p-5"><span className="rounded-lg bg-[#eff4ea] p-3 text-emerald-800"><Icon name="globe" /></span><div><h3 className="text-sm font-semibold">Less in fees. More for you.</h3><p className="mt-2 text-sm leading-6 text-stone-600">Just 1.5% per payment. No hidden fees.<br />That’s 90% less than a 15% traditional wire fee.</p></div></section></div>}</>}
        {!isPay && !isPassport && !isOnboard && section === 'Overview' && <section className="mt-6 rounded-xl border border-stone-200 bg-white p-6">
          <div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="font-semibold">Know exactly what arrives.</h2><p className="mt-2 text-sm text-stone-600">Payout calculator · Fixed demo rate of 1 USD = {EXCHANGE_RATE} KES</p></div><label className="text-sm font-medium">Invoice amount (USD)<input aria-label="Calculate payout for USD amount" className={field} type="number" min="0" max="1000000" step=".01" value={quoteAmount} onChange={e => setQuoteAmount(e.target.value)} /></label></div>
          {Number(quoteAmount) < 0 || Number(quoteAmount) > 1000000 ? <p role="alert" className="mt-4 text-sm text-red-700">Enter an amount from 0 to 1,000,000 USD.</p> : <div className="mt-5 grid gap-4 border-t border-stone-100 pt-5 sm:grid-cols-2 xl:grid-cols-4">{[['Processing fee · 1.5%', `$${usd(quote.feeCents / 100)}`], ['Net amount · USD', `$${usd(quote.netCents / 100)}`], ['M-pesa payout · KES', usd(quote.kesCents / 100)], ['Saved vs 15% wire fee', `$${usd((quote.wireFeeCents - quote.feeCents) / 100)}`]].map(([label, value]) => <div key={label}><p className="text-sm text-stone-600">{label}</p><p className="mt-2 text-xl font-semibold text-emerald-900">{value}</p></div>)}</div>}
          <p className="mt-5 text-xs text-stone-600">The client pays the invoice amount. We deduct the rounded USD fee, then convert the remainder to KES. All transfers are simulated.</p>
        </section>}
        <footer className="mt-9 flex flex-wrap items-center justify-between gap-3 border-t border-stone-200 pt-5 text-xs text-stone-600 print:hidden"><span>© {new Date().getFullYear()} Borderlesspay. Built for a world without limits.</span><span className="flex items-center gap-2"><Icon name="check" className="h-3.5 w-3.5" />Your talent is global. So are we.</span></footer>
      </main>
    </div>
    {modal && <Modal title="Create a new invoice" close={() => { setModal(false); setInvoiceAmount(''); }}><form className="space-y-5" onSubmit={e => {
      e.preventDefault();
      const data = new FormData(e.currentTarget);
      const client = String(data.get('client')).trim(), project = String(data.get('project')).trim();
      const amount = Number(data.get('amount'));
      if (!client || !project || !Number.isFinite(amount) || amount < .01 || amount > 1000000) { setToast('Enter a client, a project, and a valid amount from $0.01 to $1,000,000.'); return; }
      const invoice: Invoice = { id: `INV-${crypto.randomUUID()}`, client, initials: client.slice(0, 1).toUpperCase(), project, amount: money(amount).grossCents / 100, status: 'pending', date: new Date().toISOString(), color: 'bg-emerald-100 text-emerald-800' };
      setInvoices(list => [invoice, ...list]); setFilter('All invoices'); setModal(false); setInvoiceAmount(''); setToast('Invoice created. Open it to preview the client checkout.');
    }}>
      <p className="text-sm leading-6 text-stone-600">Send your work into the world. Get paid closer to home.</p>
      {[['client', 'Client name', 'e.g. Linear Studio'], ['project', 'Project title', 'e.g. Website development'], ['amount', 'Amount in USD', '0.00']].map(([name, label, placeholder]) => <label key={name} className="block text-sm font-medium">{label}<input required name={name} placeholder={placeholder} className={field} type={name === 'amount' ? 'number' : 'text'} min={name === 'amount' ? '.01' : undefined} max={name === 'amount' ? '1000000' : undefined} step={name === 'amount' ? '.01' : undefined} maxLength={name !== 'amount' ? 100 : undefined} onChange={name === 'amount' ? e => setInvoiceAmount(e.target.value) : undefined} /></label>)}
      <div aria-live="polite" className="space-y-2 rounded-lg bg-emerald-50 p-4 text-sm text-emerald-950">
        <p className="flex justify-between gap-3"><span>Processing fee (1.5%)</span><strong>${usd(draftQuote.feeCents / 100)}</strong></p>
        <p className="flex justify-between gap-3"><span>Net USD</span><strong>${usd(draftQuote.netCents / 100)}</strong></p>
        <p className="flex justify-between gap-3"><span>M-pesa payout</span><strong>KES {usd(draftQuote.kesCents / 100)}</strong></p>
      </div>
      <p className="text-xs leading-5 text-stone-600">1 USD = {EXCHANGE_RATE} KES · Fees rounded before conversion.<br />This invoice is saved locally in your demo workspace.</p><button className={`${primary} w-full`}>Create invoice<Icon name="arrow" /></button>
    </form></Modal>}
    {toast && <div role="status" className="fixed bottom-6 left-5 right-5 z-[60] mx-auto flex max-w-lg items-center gap-3 rounded-xl border border-emerald-200 bg-[#eaf5ed] p-4 text-sm font-medium text-emerald-950 shadow-lg"><Icon name="check" /><span className="flex-1">{toast}</span><button className="flex min-h-11 min-w-11 items-center justify-center" aria-label="Dismiss notification" onClick={() => setToast('')}><Icon name="close" /></button></div>}
  </div>;
}

function Brand() {
  return <div aria-label="Borderlesspay" className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap">
    <svg className="h-9 w-9 shrink-0" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <circle cx="24" cy="24" r="24" fill="#ef4b0b" />
      <circle cx="24" cy="24" r="18" fill="#003b80" />
      <g transform="rotate(14 24 24)" stroke="#fff9ed" strokeWidth="1.25">
        <circle cx="24" cy="24" r="14" />
        <ellipse cx="24" cy="24" rx="7" ry="14" />
        <path d="M10 24h28M12 17h24M12 31h24M24 10v28" />
        <path d="M24 10a14 14 0 0 0 0 28V10Z" fill="#fff9ed" stroke="none" />
      </g>
    </svg>
    <span aria-hidden="true" className="text-[23px] font-bold leading-none tracking-[-1.2px] text-[#003b80]">borderlesspay</span>
  </div>;
}
function Avatar({ name }: { name: string }) { return <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-white bg-[#eadbc5] text-sm font-semibold text-[#69513a]">{name.split(' ').map(n => n[0]).slice(0, 2).join('')}</span>; }
function PageTitle({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: React.ReactNode }) { return <div className="flex flex-wrap items-center justify-between gap-5"><div><p className="mb-3 text-xs font-medium tracking-[.12em] text-stone-600">{eyebrow}</p><h1 className="text-[29px] font-semibold leading-tight tracking-[-.9px] md:text-[32px]">{title}{title.startsWith('Welcome') && <span className="ml-2 inline-block text-[#8b9c58]">✳</span>}</h1><p className="mt-3 text-sm text-stone-600">{description}</p></div>{action && <div className="pt-4">{action}</div>}</div>; }
