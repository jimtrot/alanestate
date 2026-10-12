import { useEffect, useMemo, useState } from 'preact/hooks';
import { STATES, type StateCode } from '../data/site';
import { PHASES, DEFAULT_ANSWERS, type Answers, type Step } from '../data/plan-types';
import { STEPS } from '../data/plan';

const KEY_A = 'ae:plan:answers';
const KEY_D = 'ae:plan:done';

function load<T>(k: string, fallback: T): T {
  try { const v = localStorage.getItem(k); return v ? { ...fallback, ...JSON.parse(v) } : fallback; } catch { return fallback; }
}
function save(k: string, v: unknown) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }

const TOGGLES: { key: keyof Answers; label: string; hint?: string }[] = [
  { key: 'partner', label: 'They leave a spouse or partner' },
  { key: 'super', label: 'They had superannuation (industry or retail fund)' },
  { key: 'smsf', label: 'They had a self-managed super fund (SMSF)', hint: 'Adds the ATO deadlines and trustee steps.' },
  { key: 'property', label: 'They owned a home or other property' },
  { key: 'shares', label: 'They held shares or managed funds' },
  { key: 'centrelink', label: 'They received a Centrelink or DVA payment' },
  { key: 'debts', label: 'There is a mortgage, reverse mortgage or other loan' },
  { key: 'business', label: 'They ran a business or were a company director' },
  { key: 'vehicle', label: 'They owned a car or other vehicle' },
  { key: 'unexpected', label: 'The death was sudden or unexpected', hint: 'The coroner may be involved.' },
];

function tagLabel(t: Step['tag']) {
  return t === 'urgent' ? 'Do this first' : t === 'deadline' ? 'Has a deadline' : t === 'smsf' ? 'SMSF' : t === 'money' ? 'Finding the money' : t === 'optional' ? 'If it applies' : '';
}

export default function PlanBuilder() {
  const [answers, setAnswers] = useState<Answers>(DEFAULT_ANSWERS);
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [built, setBuilt] = useState(false);
  const [editing, setEditing] = useState(true);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const a = load(KEY_A, DEFAULT_ANSWERS);
    const d = load(KEY_D, {});
    setAnswers(a); setDone(d);
    const had = !!localStorage.getItem(KEY_A);
    setBuilt(had); setEditing(!had);
    setHydrated(true);
  }, []);

  const steps = useMemo(() => STEPS.filter((s) => (s.when ? s.when(answers) : true)), [answers]);
  const total = steps.length;
  const completed = steps.filter((s) => done[s.id]).length;
  const stateName = STATES.find((s) => s.code === answers.state)?.name ?? 'your state';

  function set<K extends keyof Answers>(k: K, v: Answers[K]) { setAnswers((a) => ({ ...a, [k]: v })); }
  function build(e: Event) {
    e.preventDefault();
    save(KEY_A, answers); setBuilt(true); setEditing(false);
    (window as any).__aeTrack?.('plan_built', { state: answers.state, smsf: answers.smsf, will: answers.will });
    setTimeout(() => document.getElementById('plan-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  }
  function toggleDone(id: string) { setDone((d) => { const n = { ...d, [id]: !d[id] }; save(KEY_D, n); return n; }); }
  function reset() { if (!confirm('Clear your answers and progress on this device?')) return; try { localStorage.removeItem(KEY_A); localStorage.removeItem(KEY_D); } catch {} setAnswers(DEFAULT_ANSWERS); setDone({}); setBuilt(false); setEditing(true); }

  return (
    <div>
      {/* Questions */}
      <section class={`card-paper ${built && !editing ? 'py-4' : ''}`} aria-labelledby="plan-q-heading">
        {built && !editing ? (
          <div class="flex flex-wrap items-center justify-between gap-3">
            <p class="text-ink-2"><span class="font-semibold text-ink">Your plan:</span> {stateName}{answers.will === 'yes' ? ', there is a will' : answers.will === 'no' ? ', no will' : ''}{answers.smsf ? ', SMSF' : ''}{answers.property ? ', property' : ''}{answers.partner ? ', surviving partner' : ''}.</p>
            <div class="flex gap-2">
              <button type="button" class="btn btn-secondary btn-sm" onClick={() => setEditing(true)}>Change answers</button>
              <button type="button" class="btn btn-quiet btn-sm" onClick={reset}>Start again</button>
            </div>
          </div>
        ) : (
          <form onSubmit={build} class="grid gap-6">
            <div>
              <h2 id="plan-q-heading" class="text-[1.5rem]">A few questions, so the plan fits</h2>
              <p class="text-ink-2 mt-1">Answer what you know. You can change anything later. Nothing leaves your browser.</p>
            </div>
            <div class="grid gap-5 md:grid-cols-3">
              <div class="field">
                <label class="label" for="q-state">Which state or territory did they live in?</label>
                <select id="q-state" class="select" required value={answers.state} onChange={(e) => set('state', (e.currentTarget as HTMLSelectElement).value as StateCode)}>
                  <option value="">Choose…</option>
                  {STATES.map((s) => <option value={s.code}>{s.name}</option>)}
                </select>
                <p class="help">Probate, certificates and land titles are state matters.</p>
              </div>
              <div class="field">
                <label class="label" for="q-role">What is your role?</label>
                <select id="q-role" class="select" value={answers.role} onChange={(e) => set('role', (e.currentTarget as HTMLSelectElement).value as Answers['role'])}>
                  <option value="unsure">Not sure yet</option>
                  <option value="executor">I'm the executor (or likely to administer the estate)</option>
                  <option value="family">I'm family, helping out</option>
                </select>
              </div>
              <div class="field">
                <label class="label" for="q-will">Is there a will?</label>
                <select id="q-will" class="select" value={answers.will} onChange={(e) => set('will', (e.currentTarget as HTMLSelectElement).value as Answers['will'])}>
                  <option value="unsure">Not sure / haven't found it</option>
                  <option value="yes">Yes, we have it</option>
                  <option value="no">No, there is no will</option>
                </select>
              </div>
            </div>
            <fieldset>
              <legend class="label mb-2">Tick everything that applies. Skip what you don't know.</legend>
              <div class="grid gap-2 sm:grid-cols-2">
                {TOGGLES.map((t) => (
                  <label class="choice">
                    <input type="checkbox" checked={!!answers[t.key]} onChange={(e) => set(t.key, (e.currentTarget as HTMLInputElement).checked as never)} />
                    <span>{t.label}{t.hint && <span class="block text-sm text-ink-3">{t.hint}</span>}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <div class="flex flex-wrap items-center gap-3">
              <button type="submit" class="btn btn-primary">{built ? 'Update my plan' : 'Build my plan'}</button>
              {built && <button type="button" class="btn btn-quiet" onClick={() => setEditing(false)}>Cancel</button>}
              <p class="text-sm text-ink-3">Takes about a minute.</p>
            </div>
          </form>
        )}
      </section>

      {/* Results */}
      {built && (
        <section id="plan-results" class="mt-10 scroll-mt-24" aria-live="polite">
          <div class="flex flex-wrap items-end justify-between gap-4 mb-6">
            <div>
              <p class="eyebrow mb-2">Your plan · {stateName}</p>
              <h2 class="text-[1.75rem] md:text-[2rem]">{total} steps, in the order they happen</h2>
              <p class="text-ink-2 mt-1">Tick things off as you go. Your progress stays on this device.</p>
            </div>
            <div class="flex items-center gap-3 no-print">
              <span class="tag tag-green">{completed} of {total} done</span>
              <button type="button" class="btn btn-secondary btn-sm" onClick={() => window.print()}>Print</button>
              <a href="#keep-plan" class="btn btn-secondary btn-sm">Save a copy</a>
            </div>
          </div>
          <div class="h-1.5 rounded-full bg-paper-3 overflow-hidden mb-10" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={completed} aria-label="Plan progress">
            <div class="h-full bg-green transition-[width] duration-300" style={{ width: `${total ? (completed / total) * 100 : 0}%` }} />
          </div>

          {PHASES.map((ph) => {
            const list = steps.filter((s) => s.phase === ph.id);
            if (!list.length) return null;
            return (
              <div class="mb-12">
                <div class="flex items-baseline gap-4 mb-2">
                  <span class="num text-3xl">{ph.when}</span>
                  <h3 class="text-[1.4rem]">{ph.title}</h3>
                </div>
                <p class="text-ink-2 mb-5 max-w-prose">{ph.note}</p>
                <ol class="grid gap-3">
                  {list.map((s) => <StepCard step={s} answers={answers} done={!!done[s.id]} onToggle={() => toggleDone(s.id)} />)}
                </ol>
              </div>
            );
          })}

          <KeepPlan answers={answers} steps={steps} stateName={stateName} />
        </section>
      )}
      {!hydrated && <noscript><p class="mt-6 note">The plan needs JavaScript to build. Without it, you can still read <a href="/guide/first-days/">the first days</a> and the other guides below.</p></noscript>}
    </div>
  );
}

function StepCard({ step, answers, done, onToggle }: { step: Step; answers: Answers; done: boolean; onToggle: () => void }) {
  const [open, setOpen] = useState(false);
  const links = (step.links ?? []).filter((l) => !l.states || (answers.state && l.states.includes(answers.state)));
  const note = answers.state ? step.stateNotes?.[answers.state] : undefined;
  const id = `step-${step.id}`;
  return (
    <li class={`card transition-colors ${done ? 'bg-paper-2' : ''}`}>
      <div class="flex gap-4 items-start">
        <input type="checkbox" id={id} checked={done} onChange={onToggle} class="mt-1.5 w-5 h-5 shrink-0 accent-[var(--color-green)] cursor-pointer" aria-label={`Mark "${step.title}" as done`} />
        <div class="flex-1 min-w-0">
          <div class="flex flex-wrap items-center gap-2">
            <label for={id} class={`font-semibold text-[1.08rem] leading-snug cursor-pointer ${done ? 'line-through text-ink-3' : ''}`}>{step.title}</label>
            {step.tag && <span class={`tag ${step.tag === 'urgent' ? 'tag-ochre' : step.tag === 'smsf' ? 'tag-green' : ''}`}>{tagLabel(step.tag)}</span>}
          </div>
          <p class="text-ink-2 mt-1">{step.summary}</p>
          {step.deadline && <p class="mt-1.5 text-sm font-semibold text-ochre-text">{step.deadline}</p>}
          {(step.detail?.length || step.needs?.length || links.length || note || step.guide) ? (
            <div class="mt-2">
              <button type="button" class="btn btn-quiet btn-sm -ml-2 no-print" aria-expanded={open} aria-controls={`${id}-more`} onClick={() => setOpen(!open)}>
                {open ? 'Show less' : 'How to do this'}
              </button>
              <div id={`${id}-more`} class={`${open ? '' : 'print:block hidden'} mt-2 grid gap-4 text-[0.97rem]`}>
                {note && <p class="note">{note}</p>}
                {step.detail?.length ? <ul class="list-disc pl-5 space-y-1.5 text-ink-2">{step.detail.map((d) => <li>{d}</li>)}</ul> : null}
                {step.needs?.length ? (
                  <div><p class="font-semibold text-sm">You'll usually need</p><ul class="mt-1 flex flex-wrap gap-1.5">{step.needs.map((n) => <li class="tag">{n}</li>)}</ul></div>
                ) : null}
                {(links.length || step.guide) ? (
                  <div class="flex flex-wrap gap-x-5 gap-y-1.5 text-sm">
                    {step.guide && <a href={step.guide} class="font-semibold text-green">Read the full guide →</a>}
                    {links.map((l) => <a href={l.href} target="_blank" rel="noopener" class="text-green underline">{l.label}</a>)}
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </li>
  );
}

function buildPlanText(answers: Answers, steps: Step[], stateName: string) {
  const d = new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' });
  const lines: string[] = [];
  lines.push('WHAT TO DO WHEN SOMEONE DIES');
  lines.push(`A plan for ${stateName}, prepared ${d}`);
  lines.push('From alanestate.com. General information only, not legal advice.');
  lines.push('');
  const ctx: string[] = [];
  if (answers.will === 'yes') ctx.push('there is a will');
  if (answers.will === 'no') ctx.push('there is no will');
  if (answers.partner) ctx.push('a surviving partner');
  if (answers.smsf) ctx.push('a self-managed super fund');
  if (answers.super) ctx.push('superannuation');
  if (answers.property) ctx.push('property');
  if (answers.shares) ctx.push('shares or managed funds');
  if (answers.debts) ctx.push('a mortgage or other loan');
  if (answers.business) ctx.push('a business or company directorship');
  if (answers.centrelink) ctx.push('a Centrelink or DVA payment');
  if (ctx.length) { lines.push(`Based on: ${ctx.join(', ')}.`); lines.push(''); }
  lines.push(`${steps.length} steps in total.`);
  lines.push('');
  for (const ph of PHASES) {
    const list = steps.filter((x) => x.phase === ph.id);
    if (!list.length) continue;
    lines.push('');
    lines.push(`${ph.title.toUpperCase()}  (${ph.when})`);
    lines.push(ph.note);
    lines.push('');
    for (const st of list) {
      lines.push(`[ ] ${st.title}`);
      if (st.deadline) lines.push(`    DEADLINE: ${st.deadline}`);
      lines.push(`    ${st.summary}`);
      const note = answers.state ? st.stateNotes?.[answers.state] : undefined;
      if (note) lines.push(`    ${stateName}: ${note}`);
      for (const d2 of st.detail ?? []) lines.push(`    - ${d2}`);
      if (st.needs?.length) lines.push(`    You'll need: ${st.needs.join('; ')}`);
      for (const l of (st.links ?? []).filter((l) => !l.states || (answers.state && l.states.includes(answers.state)))) {
        lines.push(`    ${l.label}: ${l.href}`);
      }
      lines.push('');
    }
  }
  lines.push('');
  lines.push('Rules differ by state and change over time. Check the linked official');
  lines.push('sources, or speak to a professional about your situation.');
  lines.push('alanestate.com');
  return lines.join('\n');
}

function KeepPlan({ answers, steps, stateName }: { answers: Answers; steps: Step[]; stateName: string }) {
  function download() {
    const text = buildPlanText(answers, steps, stateName);
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `estate-plan-${(answers.state || 'au').toLowerCase()}.txt`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    (window as any).__aeTrack?.('plan_downloaded', { state: answers.state });
  }

  return (
    <div id="keep-plan" class="mt-8 scroll-mt-24 no-print">
      <div class="card-paper">
        <h3 class="text-[1.25rem]">Keep your plan</h3>
        <p class="text-ink-2 mt-1 text-[0.97rem] max-w-prose">Your answers and ticks are saved in this browser, so you can close the page and come back. To keep a copy you can forward to family, download it or print it.</p>
        <div class="mt-4 flex flex-wrap gap-3">
          <button type="button" class="btn btn-primary btn-sm" onClick={download}>Download as a text file</button>
          <button type="button" class="btn btn-secondary btn-sm" onClick={() => window.print()}>Print or save as PDF</button>
        </div>
      </div>
    </div>
  );
}
