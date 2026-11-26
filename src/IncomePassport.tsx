import { useEffect, useState } from 'react';
import type { Profile, Invoice } from './App';
type Certificate = { title: string; institution: string; date: string; url: string; source: string };
type Project = { title: string; client: string; description: string; date: string; url: string; payment: string; source: string };
type Attachment = { id: string; category: string; record: string; name: string; size: number; content: string; added: string };
type Passport = { country: string; number: string; skills: { name: string; source: string }[]; certificates: Certificate[]; projects: Project[]; links: string[]; checklist: string[]; submitted: boolean; evidence: boolean; attachments?: Attachment[]; review?: boolean };
const initial: Passport = {
  country: 'Kenya', number: 'BP-FL-084291',
  skills: [{ name: 'Frontend development', source: 'Demo' }, { name: 'Webflow', source: 'Demo' }, { name: 'Responsive design', source: 'Demo' }],
  certificates: [{ title: 'Responsive Web Design', institution: 'freeCodeCamp · sample credential', date: '2024-03-12', url: '', source: 'Demo' }],
  projects: [{ title: 'Landing page development', client: 'Acme Inc. · sample client', description: 'Developed a responsive marketing page with accessible components and a reusable design system.', date: '2024-06-20', url: '', payment: 'Self-reported paid', source: 'Demo' }],
  links: [], checklist: [], submitted: false, evidence: false,
};
const btn = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-stone-200 bg-white px-4 text-sm font-medium text-emerald-900 hover:bg-stone-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700';
const green = 'inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-transparent bg-[#12664f] px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#0c503e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2';
const input = 'mt-2 min-h-11 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700';
const card = 'min-w-0 rounded-2xl border border-stone-200 bg-white p-5 md:p-7';
const fmt = (value: number) => value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const dateLabel = (date: string) => new Date(date).toLocaleDateString('en-GB');
function Badge({ children }: { children: React.ReactNode }) { return <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-900">{children}</span>; }
function Title({ number, title, description }: { number: string; title: string; description: string }) {
  return <div className="mb-6 flex items-start gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#edf4ed] text-xs font-semibold text-emerald-900">{number}</span><div><h2 className="text-lg font-semibold tracking-tight">{title}</h2><p className="mt-1 text-sm leading-6 text-stone-600">{description}</p></div></div>;
}
function Link({ url }: { url: string }) {
  return <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 max-w-full items-center break-all text-sm text-emerald-800 underline underline-offset-4 focus-visible:ring-2 focus-visible:ring-emerald-700">{url}</a>;
}
function safeUrl(value: string) { try { return ['https:', 'http:'].includes(new URL(value).protocol); } catch { return false; } }

// A small, paginated PDF writer. Standard PDF fonts require ASCII transliteration.
function exportPdf(lines: string[], reference: string) {
  const clean = (text: string) => text.normalize('NFKD').replace(/[^\x20-\x7E]/g, '?').replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
  const wrapped = lines.flatMap(line => {
    if (!line) return [''];
    const words = line.match(/.{1,85}(?:\s|$)|.{1,85}/g) || [line];
    return words.map(word => word.trim());
  });
  const pages: string[][] = [];
  for (let i = 0; i < wrapped.length; i += 39) pages.push(wrapped.slice(i, i + 39));
  const objects: string[] = ['', '', '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>', '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>'];
  pages.forEach((page, i) => {
    const body = page.map((line, j) => {
      const y = 730 - j * 16;
      const heading = /^(0[1-6] \/|DISCLOSURE|TRANSACTION HISTORY|ATTACHED EVIDENCE|PROFESSIONAL &)/.test(line);
      return `${heading ? `0.92 0.96 0.92 rg 36 ${y - 4} 523 16 re f\n` : ''}BT /${heading ? 'F2' : 'F1'} ${heading ? 10 : 10} Tf 0.13 0.18 0.16 rg 42 ${y} Td (${clean(line)}) Tj ET`;
    }).join('\n');
    const stream = `0.07 0.31 0.24 rg\n0 760 595 82 re f\n0.82 0.9 0.72 rg 42 786 5 22 re f\nBT /F2 20 Tf 1 1 1 rg 58 795 Td (borderlesspay) Tj ET\nBT /F1 10 Tf 1 1 1 rg 58 775 Td (INCOME PASSPORT | DEMONSTRATION COPY) Tj ET\n${body}\n0.8 0.86 0.8 RG 42 65 m 553 65 l S\nBT /F1 7 Tf 0.3 0.35 0.32 rg 42 48 Td (${clean(reference)}) Tj ET\nBT /F1 8 Tf 0.3 0.35 0.32 rg 42 33 Td (Page ${i + 1} of ${pages.length} | Self-reported and demo data | Not independently certified) Tj ET`;
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${6 + i * 2} 0 R >>`, `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
  });
  objects[0] = '<< /Type /Catalog /Pages 2 0 R >>';
  objects[1] = `<< /Type /Pages /Count ${pages.length} /Kids [${pages.map((_, i) => `${5 + i * 2} 0 R`).join(' ')}] >>`;
  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((object, i) => { offsets.push(pdf.length); pdf += `${i + 1} 0 obj\n${object}\nendobj\n`; });
  const start = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map(offset => `${String(offset).padStart(10, '0')} 00000 n \n`).join('')}trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${start}\n%%EOF`;
  const url = URL.createObjectURL(new Blob([pdf], { type: 'application/pdf' }));
  const a = document.createElement('a'); a.href = url; a.download = `${reference}.pdf`; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function IncomePassport({ profile, updateProfile, invoices, financials }: {
  profile: Profile; updateProfile: (profile: Profile) => void; invoices: Invoice[];
  financials: (invoice: Invoice) => { grossCents: number; feeCents: number; netCents: number; kesCents: number };
}) {
  const [data, setData] = useState<Passport>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('bp-passport-v1') || 'null');
      return saved && typeof saved.country === 'string' && Array.isArray(saved.skills) && Array.isArray(saved.certificates) && Array.isArray(saved.projects) && Array.isArray(saved.links) && Array.isArray(saved.checklist) ? saved : initial;
    } catch { return initial; }
  });
  const [editor, setEditor] = useState('');
  const [tab, setTab] = useState('Professional record');
  const [message, setMessage] = useState('');
  const [storage, setStorage] = useState('');
  const [reference, setReference] = useState('');
  const [evidenceCategory, setEvidenceCategory] = useState('Certificate');
  const [evidenceRecord, setEvidenceRecord] = useState('');
  const [uploading, setUploading] = useState(false);
  const attachments = data.attachments || [];
  const evidenceRecords = evidenceCategory === 'Skill' ? data.skills.map(s => s.name) : evidenceCategory === 'Certificate' ? data.certificates.map(c => c.title) : data.projects.map(p => p.title);
  useEffect(() => { try { localStorage.setItem('bp-passport-v1', JSON.stringify(data)); setStorage('Saved in this browser only'); } catch { setStorage('Storage unavailable. Changes last only for this session.'); } }, [data]);
  const paid = invoices.filter(i => i.status === 'paid'), pending = invoices.filter(i => i.status === 'pending');
  const gross = paid.reduce((sum, i) => sum + financials(i).grossCents, 0) / 100;
  const fees = paid.reduce((sum, i) => sum + financials(i).feeCents, 0) / 100;
  const net = paid.reduce((sum, i) => sum + financials(i).netCents, 0) / 100;
  const kes = paid.reduce((sum, i) => sum + financials(i).kesCents, 0) / 100;
  const pendingTotal = pending.reduce((sum, i) => sum + i.amount, 0);
  const readiness = ['Identity document prepared', 'Residence documentation prepared', 'Payment provider eligibility checked', 'Payment account details reviewed', 'Work authorization requirements checked', 'Provider KYC requirements reviewed'];
  const status = data.review && data.evidence ? 'Under Review · simulation only' : data.evidence ? 'Evidence Submitted · local only' : 'Profile Created · not verified';
  async function attach(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const file = new FormData(form).get('evidence') as File;
    const record = evidenceRecords.includes(evidenceRecord) ? evidenceRecord : evidenceRecords[0];
    if (!file?.size || !record) { setMessage('Choose an existing record and a non-empty evidence file.'); return; }
    if (file.size > 750_000 || attachments.reduce((sum, a) => sum + a.size, 0) + file.size > 2_000_000) { setMessage('Use files below 750 KB, with a maximum of 2 MB total evidence. Remove an attachment to free space.'); return; }
    setUploading(true);
    try {
      const signature = new Uint8Array(await file.slice(0, 8).arrayBuffer());
      const pdf = file.type === 'application/pdf' && signature[0] === 37 && signature[1] === 80 && signature[2] === 68 && signature[3] === 70;
      const png = file.type === 'image/png' && signature[0] === 137 && signature[1] === 80 && signature[2] === 78 && signature[3] === 71;
      const jpeg = file.type === 'image/jpeg' && signature[0] === 255 && signature[1] === 216 && signature[2] === 255;
      if (!pdf && !png && !jpeg) { setMessage('Please choose a valid PDF, PNG, or JPEG. Other file types are not supported.'); return; }
      const content = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error('read'));
        reader.readAsDataURL(file);
      });
      const attachment: Attachment = { id: crypto.randomUUID(), category: evidenceCategory, record, name: file.name, size: file.size, content, added: new Date().toISOString() };
      setData(prev => ({ ...prev, attachments: [...(prev.attachments || []), attachment], evidence: false, review: false }));
      form.reset();
      setMessage('Evidence attached locally. It is self-reported, not reviewed or independently verified.');
    } catch { setMessage('The file could not be read. Please choose it again.'); }
    finally { setUploading(false); }
  }
  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const get = (key: string) => String(form.get(key) || '').trim();
    if (get('url') && !safeUrl(get('url'))) { setMessage('Use a complete http:// or https:// URL.'); return; }
    if (editor === 'profile') { updateProfile({ ...profile, name: get('name'), role: get('role') }); setData(prev => ({ ...prev, country: get('country'), submitted: false, evidence: false })); }
    if (editor === 'skill') setData(prev => ({ ...prev, skills: [...prev.skills, { name: get('title'), source: 'User-provided' }], evidence: false }));
    if (editor === 'certificate') setData(prev => ({ ...prev, certificates: [...prev.certificates, { title: get('title'), institution: get('institution'), date: get('date'), url: get('url'), source: 'User-provided' }], evidence: false }));
    if (editor === 'portfolio') setData(prev => ({ ...prev, links: [...prev.links, get('url')], evidence: false }));
    if (editor === 'project') setData(prev => ({ ...prev, projects: [...prev.projects, { title: get('title'), client: get('client'), description: get('description'), date: get('date'), url: get('url'), payment: get('payment'), source: 'User-provided' }] }));
    setEditor(''); setMessage('Your professional record has been updated locally. No verification has occurred.');
  }
  function download() {
    const ref = `BP-IP-${crypto.randomUUID().toUpperCase()}`;
    const issue = new Date().toISOString();
    const lines = [
      'PROFESSIONAL & FINANCIAL RECORD', `Document reference: ${ref}`, `Issued: ${issue}`, '',
      'DISCLOSURE & EVIDENCE LEGEND', 'DEMO: illustrative records, including all invoice and payout data.', 'USER-PROVIDED: self-reported details; not independently checked.', 'VERIFIED: none. No independent review, legal verification or bank certification.',
      'This passport is not a government identity document or proof of real earnings.', 'Non-Latin characters may appear as ? in this PDF. The app retains original text.', '',
      '01 / PERSONAL & PROFESSIONAL IDENTITY', `Name: ${profile.name} [USER-PROVIDED / DEMO PROFILE]`, `Title: ${profile.role}`, `Residence: ${data.country}`, `Freelancer profile: ${data.number}`, `Professional ID: not verified; verification stage: ${status}`, '',
      '02 / SKILLS & CREDENTIALS', ...data.skills.map(s => `${s.name} [${s.source}; unverified]`),
      ...data.certificates.flatMap(c => [`${c.title} | ${c.institution} | ${c.date}`, `[${c.source}; certificate not independently verified]`, ...(c.url ? [`Evidence: ${c.url}`] : [])]),
      'Portfolio links [USER-PROVIDED; not verified]:', ...(data.links.length ? data.links : ['None added.']), '',
      'ATTACHED EVIDENCE [SELF-REPORTED; NOT VERIFIED]',
      ...(attachments.length ? attachments.flatMap(a => [`${a.category}: ${a.record}`, `${a.name} | ${Math.ceil(a.size / 1024)} KB | Added ${a.added}`]) : ['No local evidence files attached.']),
      'Attachment listing only. Original files are not embedded in this PDF.', '',
      '03 / PROFESSIONAL WORK HISTORY', ...data.projects.flatMap(p => [`${p.title} | ${p.client} | ${p.date}`, p.description, `${p.payment} [${p.source}; self-reported, not payment confirmation]`, ...(p.url ? [`Evidence: ${p.url}`] : [])]), '',
      '04 / FINANCIAL HISTORY - ALL DATA IS DEMO', `Total completed earnings: USD ${fmt(gross)} | ${paid.length} completed payments`, `Pending: USD ${fmt(pendingTotal)} | ${pending.length} pending payments`, `Transaction fees: USD ${fmt(fees)}`, `Net payouts: USD ${fmt(net)} / KES ${fmt(kes)}`, 'Verified real-world earnings: not established.', 'Supported demo currencies: USD invoicing / KES simulated payouts', '',
      'TRANSACTION HISTORY [DEMO]', ...invoices.flatMap(i => { const f = financials(i); return [`${i.id} | ${i.client} | ${i.status.toUpperCase()} | ${dateLabel(i.settlement?.paidAt || i.date)}`, `${i.project}`, `Gross USD ${fmt(f.grossCents / 100)} | Fee USD ${fmt(f.feeCents / 100)} | Net USD ${fmt(f.netCents / 100)} / KES ${fmt(f.kesCents / 100)}${i.status === 'pending' ? ' [ESTIMATE; NOT PAID]' : ' [SIMULATED]'}`]; }), '',
      '05 / FINANCIAL READINESS [SELF-REPORTED]', `Country of residence: ${data.country}`, ...readiness.map(item => `${data.checklist.includes(item) ? '[PREPARED]' : '[TO REVIEW]'} ${item}`),
      'Requirements vary by country, residence/immigration status and financial provider.', 'Confirm accepted identity, address and tax documents directly with the provider.', 'Payment eligibility and work authorization have not been assessed.', 'Evidence stays in the local browser. Nothing has been sent to a reviewer.', 'No independent verification service is connected; no verification QR is issued.',
    ];
    try { exportPdf(lines, ref); setReference(ref); setMessage('Income Passport PDF generated. Demo and unverified information are labeled throughout.'); } catch { setMessage('PDF could not be generated. Please try again.'); }
  }
  const fields = editor === 'profile' ? [['name', 'Full name', profile.name], ['role', 'Professional title', profile.role], ['country', 'Country of residence', data.country]]
    : editor === 'skill' ? [['title', 'Professional skill', '']]
    : editor === 'portfolio' ? [['url', 'Portfolio URL', '']]
    : editor === 'certificate' ? [['title', 'Certificate / qualification', ''], ['institution', 'Issuing institution', ''], ['date', 'Certificate date', ''], ['url', 'Evidence URL (optional)', '']]
    : [['title', 'Project title', ''], ['client', 'Client / organization', ''], ['description', 'Project description', ''], ['date', 'Completion date', ''], ['url', 'Project evidence URL (optional)', '']];
  return <div>
    <div><p className="text-xs font-medium tracking-[.15em] text-stone-600">YOUR WORK TELLS YOUR STORY</p><h1 className="mt-3 text-[32px] font-semibold tracking-tight">Your talent. On the record.</h1><p className="mt-3 text-sm leading-6 text-stone-600">One portable profile for your skills, your work, and your financial journey.</p></div>
    <div className="sticky top-0 z-10 mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-white p-4 shadow-sm print:hidden">
      <div><p className="font-semibold text-emerald-950">Download your Income Passport</p><p className="mt-1 text-sm text-stone-600">Your professional record and demo earnings in one PDF.</p></div>
      <button onClick={download} className={`${green} w-full sm:w-auto`}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 shrink-0" aria-hidden="true"><path d="M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4" /></svg>Download Passport PDF</button>
    </div>
    <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#dce8d7] bg-[#eff5e9] p-4 text-sm text-emerald-950"><p><strong>Demonstration passport.</strong> No legal verification, bank certification, or real transfers.</p><span className="text-xs">USD + KES · Local workspace</span></div>
    {message && <div role="status" className="mt-4 flex items-center justify-between gap-4 rounded-lg border border-emerald-200 bg-white p-4 text-sm text-emerald-950">{message}<button onClick={() => setMessage('')} aria-label="Dismiss message" className={btn}>×</button></div>}
    <section className={`${card} relative mt-6 overflow-hidden`}>
      <div className="pointer-events-none absolute -right-14 -top-20 h-72 w-72 rounded-full border-[32px] border-[#eff4ea]" />
      <div className="relative flex flex-wrap items-center justify-between gap-4"><p className="text-xs font-semibold tracking-[.16em] text-emerald-800">BORDERLESSPAY / INCOME PASSPORT</p><Badge>Not independently verified</Badge></div>
      <div className="relative mt-7 flex flex-wrap items-center gap-5"><div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-[#d4dfcf] bg-[#e8efdf] text-2xl font-semibold text-emerald-900">{profile.name.split(' ').map(n => n[0]).slice(0, 2).join('')}</div><div className="min-w-0 flex-1"><h2 className="break-words text-2xl font-semibold">{profile.name}</h2><p className="mt-2 text-sm text-stone-600">{profile.role} · {data.country}</p><p className="mt-2 text-xs text-stone-600">Identity details: self-reported / demo profile</p></div><button onClick={() => { setEditor('profile'); setTab('Professional record'); }} className={btn}>Edit profile</button></div>
      <div className="relative mt-7 grid gap-5 border-t border-stone-200 pt-5 sm:grid-cols-3">{[['Freelancer profile number', data.number], ['Professional ID status', 'Not verified · No documents reviewed'], ['Verification stage', status]].map(([label, value]) => <div key={label}><p className="text-xs text-stone-600">{label}</p><p className="mt-2 text-sm font-medium">{value}</p></div>)}</div>
    </section>
    <div role="tablist" aria-label="Income Passport sections" className="my-6 flex gap-1 overflow-x-auto border-b border-stone-200">{['Professional record', 'Evidence library', 'Financial history', 'Verification & readiness'].map(item => <button key={item} role="tab" aria-selected={tab === item} onClick={() => { setTab(item); setEditor(''); }} className={`min-h-12 shrink-0 border-b-2 px-4 text-sm font-medium focus-visible:ring-2 focus-visible:ring-emerald-700 ${tab === item ? 'border-emerald-800 text-emerald-900' : 'border-transparent text-stone-600'}`}>{item}</button>)}</div>
    {tab === 'Evidence library' && <section className={card}>
      <Title number="03" title="Evidence library" description="Bring context to your credentials, skills, and completed work." />
      <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">Local demonstration only. Attach non-sensitive sample files, not identity documents or confidential client work. Files remain in this browser, are not scanned for malware, and are not independently reviewed.</div>
      <form onSubmit={attach} className="rounded-xl border border-dashed border-[#bdcfbd] bg-[#f6f9f3] p-5">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm font-medium">Evidence category<select className={input} value={evidenceCategory} onChange={e => { setEvidenceCategory(e.target.value); setEvidenceRecord(''); }}>{['Certificate', 'Skill', 'Completed project'].map(category => <option key={category}>{category}</option>)}</select></label>
          <label className="text-sm font-medium">Related professional record<select className={input} value={evidenceRecords.includes(evidenceRecord) ? evidenceRecord : evidenceRecords[0] || ''} onChange={e => setEvidenceRecord(e.target.value)} required><option value="" disabled>Select a record</option>{evidenceRecords.map((name, index) => <option key={index} value={name}>{name}</option>)}</select></label>
        </div>
        {!evidenceRecords.length && <p className="mt-3 text-sm text-amber-900">Add a {evidenceCategory.toLowerCase()} in Professional record before attaching evidence.</p>}
        <label className="mt-5 block text-sm font-medium">Choose supporting evidence<input name="evidence" type="file" required accept="application/pdf,image/png,image/jpeg" className={`${input} file:mr-3 file:min-h-11 file:rounded-lg file:border-0 file:bg-[#e5efde] file:px-3 file:text-sm file:text-emerald-950`} /></label>
        <p className="mt-3 text-sm text-stone-600">PDF, PNG or JPEG · Up to 750 KB per file · 2 MB total</p>
        <button disabled={uploading || !evidenceRecords.length} className={`${green} mt-5 disabled:bg-stone-600`}>{uploading ? 'Reading file…' : 'Attach evidence locally'}</button>
      </form>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-2"><h3 className="font-semibold">Your supporting files ({attachments.length})</h3><p className="text-xs text-stone-600">{Math.ceil(attachments.reduce((sum, a) => sum + a.size, 0) / 1024)} KB of 1,953 KB used</p></div>
      {!attachments.length && <p className="mt-4 rounded-xl bg-stone-50 p-6 text-sm leading-6 text-stone-600">No files attached yet. Add a sample certificate, skills assessment, or project handover document to get started.</p>}
      <div className="mt-4 space-y-3">{attachments.map(a => <div key={a.id} className="flex flex-wrap items-start gap-4 rounded-xl border border-stone-200 p-4">
        <div className="min-w-0 flex-1"><p className="break-all font-medium">{a.name}</p><p className="mt-2 break-words text-sm text-stone-600">{a.category} · {a.record}</p><p className="mt-2 text-xs text-stone-600">{Math.ceil(a.size / 1024)} KB · Added {new Date(a.added).toLocaleString()}</p><div className="mt-3"><Badge>Self-reported · Not verified</Badge></div></div>
        <div className="flex flex-wrap gap-2"><a href={a.content} download={a.name} className={btn}>Download file</a><button onClick={() => { setData(prev => ({ ...prev, attachments: (prev.attachments || []).filter(item => item.id !== a.id), evidence: false, review: false })); setMessage('Attachment removed locally. Evidence submission has been reset.'); }} className={btn} aria-label={`Remove evidence ${a.name}`}>Remove</button></div>
      </div>)}</div>
      <p className="mt-5 text-sm leading-6 text-stone-600">Self-reported means supplied by you. Demo means illustrative sample data. Independently verified means reviewed by a trusted external party—none of this passport currently meets that standard.</p>
    </section>}
    {editor && <section className={`${card} mb-6 border-emerald-200`}><div className="mb-5 flex items-center justify-between"><h2 className="text-lg font-semibold">{editor === 'profile' ? 'Update your professional identity' : `Add ${editor}`}</h2><button className={btn} onClick={() => setEditor('')}>Cancel</button></div><form onSubmit={submit}><div className="grid gap-4 md:grid-cols-2">{fields.map(([name, label, value]) => <label key={`${editor}-${name}`} className="text-sm font-medium">{label}<input className={input} name={name} defaultValue={value} required={!label.includes('optional')} type={name === 'date' ? 'date' : name === 'url' ? 'url' : 'text'} max={name === 'date' ? new Date().toISOString().slice(0, 10) : undefined} maxLength={500} /></label>)}{editor === 'project' && <label className="text-sm font-medium">Payment status (self-reported)<select name="payment" className={input}><option>Self-reported paid</option><option>Self-reported pending</option><option>Unpaid / pro bono</option></select></label>}</div><p className="my-4 text-xs leading-5 text-stone-600">Your entries will be labeled user-provided and unverified. Adding a project does not create an invoice or payment.</p><button className={green}>Save {editor === 'profile' ? 'profile' : editor}</button></form></section>}
    {tab === 'Professional record' && <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_300px]"><div className="min-w-0 space-y-6">
      <section className={card}><Title number="01" title="Skills & credentials" description="Give your experience the context it deserves." /><div className="mb-5 flex flex-wrap gap-2">{data.skills.map((skill, i) => <span key={i} className="flex items-center gap-2 rounded-lg border border-[#dce6d6] bg-[#f4f7ef] px-3 py-2 text-sm text-emerald-950">{skill.name}<span className="text-xs text-stone-600">· {skill.source}</span><button aria-label={`Remove skill ${skill.name}`} className="min-h-11 min-w-11 focus-visible:ring-2 focus-visible:ring-emerald-700" onClick={() => setData(prev => ({ ...prev, skills: prev.skills.filter((_, index) => index !== i), evidence: false }))}>×</button></span>)}</div><button onClick={() => setEditor('skill')} className={btn}>+ Add skill</button><div className="my-6 border-t border-stone-100" /><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><h3 className="font-semibold">Certificates & qualifications</h3><button onClick={() => setEditor('certificate')} className={btn}>+ Add certificate</button></div>{data.certificates.length === 0 && <p className="text-sm text-stone-600">No credentials added yet.</p>}{data.certificates.map((cert, i) => <div key={i} className="mt-4 rounded-xl border border-stone-200 p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-semibold">{cert.title}</p><p className="mt-2 text-sm text-stone-600">{cert.institution}</p><p className="mt-2 text-xs text-stone-600">Issued {dateLabel(cert.date)} · {cert.source}</p></div><Badge>Not verified</Badge></div>{cert.url && <Link url={cert.url} />}<div><button onClick={() => setData(prev => ({ ...prev, certificates: prev.certificates.filter((_, index) => index !== i), evidence: false }))} className="mt-2 min-h-11 text-sm text-stone-600 underline">Remove certificate</button></div></div>)}</section>
      <section className={card}><div className="flex flex-wrap justify-between gap-3"><Title number="02" title="Professional work history" description="The projects behind your professional story." /><button className={btn} onClick={() => setEditor('project')}>+ Add project</button></div>{data.projects.map((project, i) => <div key={i} className="mt-3 border-t border-stone-200 pt-5"><div className="flex flex-wrap justify-between gap-3"><h3 className="font-semibold">{project.title}</h3><Badge>{project.source}</Badge></div><p className="mt-2 text-sm text-stone-600">{project.client} · Completed {dateLabel(project.date)}</p><p className="mt-3 text-sm leading-6 text-stone-600">{project.description}</p><p className="mt-3 text-xs font-medium text-emerald-900">{project.payment} · Not payment confirmation</p>{project.url && <Link url={project.url} />}<div><button className="min-h-11 text-sm text-stone-600 underline" onClick={() => setData(prev => ({ ...prev, projects: prev.projects.filter((_, index) => index !== i) }))}>Remove project</button></div></div>)}{!data.projects.length && <p className="text-stone-600">Add your first completed project.</p>}</section>
    </div><div className="min-w-0 space-y-6"><section className={`${card} bg-[#f1f5ec]`}><p className="text-xs font-semibold tracking-wider text-emerald-900">A RECORD YOU CAN TAKE WITH YOU</p><h3 className="mt-4 text-xl font-semibold">Your next chapter starts with your story.</h3><p className="my-4 text-sm leading-6 text-stone-600">Bring your skills, work history and demo earnings together in one clearly labeled PDF.</p><button className={`${green} w-full`} onClick={download}>Download Income Passport</button></section><section className={card}><h3 className="font-semibold">Portfolio & evidence</h3><p className="mt-2 text-sm leading-6 text-stone-600">Links are user-provided, not independently reviewed.</p><div className="mt-3">{data.links.map((url, i) => <div key={i} className="border-b border-stone-100 py-2"><Link url={url} /><button aria-label={`Remove portfolio ${url}`} className="min-h-11 text-sm text-stone-600 underline" onClick={() => setData(prev => ({ ...prev, links: prev.links.filter((_, index) => index !== i), evidence: false }))}>Remove link</button></div>)}</div><button className={`${btn} mt-4 w-full`} onClick={() => setEditor('portfolio')}>+ Add portfolio URL</button></section></div></div>}
    {tab === 'Financial history' && <section className={card}><Title number="03" title="Financial history" description="From your existing invoices. All payments and M-Pesa payouts are simulated." /><div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[['Completed earnings', `$${fmt(gross)}`, `${paid.length} completed demo payments`], ['Pending payments', `$${fmt(pendingTotal)}`, `${pending.length} pending invoices`], ['Transaction fees', `$${fmt(fees)}`, 'USD · Completed payments only'], ['Net payouts', `$${fmt(net)}`, `KES ${fmt(kes)} · Simulated`]].map(([label, value, note]) => <div key={label} className="rounded-xl bg-[#f0f5ed] p-4"><p className="text-sm text-stone-600">{label}</p><p className="mt-3 text-2xl font-semibold text-emerald-950">{value}</p><p className="mt-2 text-xs leading-5 text-stone-600">{note}</p></div>)}</div><p className="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950"><strong>Verified earnings: not established.</strong> These records are local demo data, not independent proof of income. Supported demo currencies: USD invoicing and KES payouts.</p><div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm"><thead className="border-y border-stone-200 bg-stone-50 text-xs text-stone-600"><tr>{['Client / reference', 'Date', 'Status', 'Gross USD', 'Fee USD', 'Net USD', 'Net KES'].map(label => <th key={label} className="p-3 font-medium">{label}</th>)}</tr></thead><tbody>{invoices.map(i => { const f = financials(i); return <tr key={i.id} className="border-b border-stone-100"><td className="max-w-[240px] break-words p-3 font-medium">{i.client}<span className="mt-1 block text-xs font-normal text-stone-600">{i.id}</span></td><td className="p-3">{dateLabel(i.settlement?.paidAt || i.date)}</td><td className="p-3"><Badge>{i.status === 'paid' ? 'Demo paid' : 'Pending'}</Badge></td>{[f.grossCents, f.feeCents, f.netCents, f.kesCents].map((value, index) => <td key={index} className="p-3">{fmt(value / 100)}</td>)}</tr>; })}</tbody></table></div><p className="mt-4 text-xs leading-5 text-stone-600">Pending invoice fees and net amounts are estimates, not completed payouts. Financial totals exclude self-reported projects.</p></section>}
    {tab === 'Verification & readiness' && <div className="grid items-start gap-6 xl:grid-cols-2">
      <section className={card}>
        <Title number="04" title="Verification progress" description="Transparent stages. No shortcuts to trust." />
        <p className="mb-5 rounded-lg bg-amber-50 p-4 text-sm leading-6 text-amber-950">Local workflow demonstration. Evidence is never sent to an external reviewer. Under Review can be simulated; Verified remains locked.</p>
        <ol>{[
          { title: 'Profile Created', done: true, detail: 'Professional profile exists in this browser.' },
          { title: 'Evidence Submitted', done: data.evidence, detail: data.evidence ? 'Evidence package recorded locally · Not transmitted.' : 'Attach supporting files or add evidence URLs, then submit.' },
          { title: 'Under Review', done: !!data.review && data.evidence, detail: data.review && data.evidence ? 'SIMULATION ONLY · No person or provider is reviewing your data.' : 'Optional simulation after submitting evidence.' },
          { title: 'Verified', done: false, detail: 'Locked · Independent review is not implemented. No identity, credential or earnings verification is claimed.' },
        ].map((step, i) => <li key={step.title} className="flex gap-3 border-b border-stone-100 py-4">
          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-medium ${step.done ? 'bg-[#e4efdd] text-emerald-900' : 'bg-stone-100 text-stone-600'}`}>{step.done ? '✓' : i + 1}</span>
          <div><h3 className="text-sm font-semibold">{step.title}{step.title === 'Under Review' ? ' (demo)' : ''}</h3><p className="mt-1 text-sm leading-6 text-stone-600">{step.detail}</p></div>
        </li>)}</ol>
        <div className="mt-5 flex flex-wrap gap-3">
          <button className={green} onClick={() => {
            if (!attachments.length && !data.links.length && !data.certificates.some(c => c.url) && !data.projects.some(p => p.url)) { setMessage('Attach a file in Evidence library or add an evidence URL first.'); return; }
            setData(prev => ({ ...prev, submitted: true, evidence: true, review: false })); setMessage('Demo evidence package submitted locally. No files were transmitted.');
          }}>Submit demo evidence</button>
          <button className={btn} onClick={() => { if (!data.evidence) { setMessage('Submit a demo evidence package first.'); return; } setData(prev => ({ ...prev, review: true })); setMessage('Review stage simulated. There is no independent reviewer or approval.'); }}>Simulate review stage</button>
          <button className={btn} onClick={() => { setData(prev => ({ ...prev, submitted: false, evidence: false, review: false })); setMessage('Demo progress reset. Your records and attachments have been kept.'); }}>Reset demo progress</button>
        </div>
        <p className="mt-5 text-sm leading-6 text-stone-600">No verification QR is issued: an independent document-verification service is not implemented. Your PDF reference identifies an export, not a verified credential.</p>
      </section>
      <section className={card}>
        <Title number="05" title="Financial Readiness" description="Know what to prepare before your next step." />
        <p className="mb-4 text-sm"><strong>Country of residence:</strong> {data.country}</p>
        <div className="mb-5 flex items-center gap-3"><div role="progressbar" aria-label="Self-reported financial readiness" aria-valuemin={0} aria-valuemax={readiness.length} aria-valuenow={readiness.filter(item => data.checklist.includes(item)).length} className="h-2 flex-1 overflow-hidden rounded-full bg-stone-100"><div className="h-full bg-[#12664f]" style={{ width: `${readiness.filter(item => data.checklist.includes(item)).length / readiness.length * 100}%` }} /></div><span className="text-xs text-stone-600">{readiness.filter(item => data.checklist.includes(item)).length}/{readiness.length} prepared</span></div>
        {readiness.map((item, i) => <label key={item} className="flex min-h-12 cursor-pointer items-start gap-3 border-b border-stone-100 py-4 text-sm">
          <input type="checkbox" checked={data.checklist.includes(item)} onChange={e => setData(prev => ({ ...prev, checklist: e.target.checked ? [...prev.checklist, item] : prev.checklist.filter(v => v !== item) }))} className="mt-1 h-5 w-5 shrink-0 accent-emerald-800 focus-visible:ring-2 focus-visible:ring-emerald-700" />
          <span><strong className="font-medium">{item}</strong><span className="mt-1 block leading-6 text-stone-600">{['Confirm which identity documents the provider accepts for your status.', 'Check accepted proof of residence and document validity dates.', 'Check supported countries, account restrictions and receiving currencies.', 'Confirm name matching, account ownership, fees and payout limits.', 'Ask official authorities or a qualified adviser about your work rights.', 'Review provider-specific KYC, tax and source-of-funds requirements.'][i]}</span></span>
        </label>)}
        <p className="mt-5 text-sm leading-6 text-stone-600">This self-reported checklist is not onboarding approval or legal advice. Requirements vary by country, residence status and financial provider. No bank or M-Pesa account is connected. Do not attach sensitive identity documents to this demo.</p>
      </section>
    </div>}
    <div className="mt-6 flex flex-wrap items-start justify-between gap-3 text-xs leading-5 text-stone-600"><p>{storage} · Professional record is not proof of identity.</p>{reference && <p className="max-w-full break-all">Last document: {reference}</p>}</div>
  </div>;
}
