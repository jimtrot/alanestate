import { SITE } from '../data/site';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function fillContext(form: HTMLFormElement) {
  const ref = form.querySelector<HTMLInputElement>('[data-fill="referrer"]');
  if (ref) ref.value = document.referrer || '';
  const utm = form.querySelector<HTMLInputElement>('[data-fill="utm"]');
  if (utm) {
    const p = new URLSearchParams(location.search);
    const parts: string[] = [];
    for (const [k, v] of p.entries()) if (k.startsWith('utm_') || k === 'ref') parts.push(`${k}=${v}`);
    utm.value = parts.join('&');
  }
}

const MIN_FILL_MS = 4000;

/** Spam check on free-text fields: too many links, or a blocked phrase. */
function looksLikeSpam(text: string): string | null {
  const links = text.match(/https?:\/\/|www\./gi) ?? [];
  if (links.length >= 2) return 'links';
  const lower = text.toLowerCase();
  if (SITE.blockedPhrases.some((p) => p && lower.includes(p.toLowerCase()))) return 'phrase';
  return null;
}

function showSuccess(form: HTMLFormElement, ok: HTMLElement | null) {
  form.querySelectorAll<HTMLElement>('fieldset, .field, .choice, .grid, [data-submit], [data-consent]').forEach((el) => { if (!el.closest('[data-success]')) el.hidden = true; });
  if (ok) { ok.hidden = false; ok.focus?.(); }
}

export function enhanceForms(root: ParentNode = document) {
  root.querySelectorAll<HTMLFormElement>('form.ae-form').forEach((form) => {
    if (form.dataset.enhanced) return;
    form.dataset.enhanced = '1';
    fillContext(form);
    const startedAt = performance.now();
    const email = form.querySelector<HTMLInputElement>('input[type="email"]');
    const err = form.querySelector<HTMLElement>('[data-error]');
    const ok = form.querySelector<HTMLElement>('[data-success]');
    const fail = form.querySelector<HTMLElement>('[data-failure]');
    const btn = form.querySelector<HTMLButtonElement>('[data-submit]');
    const label = form.querySelector<HTMLElement>('[data-label]');

    email?.addEventListener('blur', () => {
      const bad = email.value.length > 0 && !EMAIL_RE.test(email.value);
      email.setAttribute('aria-invalid', String(bad));
      if (err) err.hidden = !bad;
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (fail) fail.hidden = true;
      if (!email || !EMAIL_RE.test(email.value)) {
        email?.setAttribute('aria-invalid', 'true');
        if (err) err.hidden = false;
        email?.focus();
        return;
      }
      const required = form.querySelector<HTMLInputElement | HTMLSelectElement>('[required]:invalid');
      if (required) { required.focus(); required.reportValidity?.(); return; }

      const data: Record<string, string> = {};
      new FormData(form).forEach((v, k) => { if (k !== '_next') data[k] = String(v); });

      // Spam checks. A blocked submission is not sent, but shows the normal success state.
      let spam: string | null = null;
      if (data['_honey'] || data['website']) spam = 'honeypot';
      else if (performance.now() - startedAt < MIN_FILL_MS) spam = 'too_fast';
      else spam = looksLikeSpam(`${data['note'] ?? ''} ${data['message'] ?? ''}`);
      if (spam) {
        (window as any).__aeTrack?.('form_blocked', { reason: spam });
        showSuccess(form, ok);
        return;
      }

      delete data['website'];
      if (SITE.blockedPhrases.length) data['_blacklist'] = SITE.blockedPhrases.join(',');
      data['submitted_at'] = new Date().toISOString();
      if (btn) btn.disabled = true;
      const original = label?.textContent ?? '';
      if (label) label.textContent = 'Sending…';
      try {
        const res = await fetch(SITE.formAjax, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(data),
        });
        const json = await res.json().catch(() => ({}));
        if (res.ok && String(json.success) === 'true') {
          showSuccess(form, ok);
          try { localStorage.setItem('ae:form', data['segment'] || '1'); } catch {}
          (window as any).__aeTrack?.('form_submit', { segment: data['segment'] });
        } else {
          throw new Error(json.message || 'Submission failed');
        }
      } catch {
        if (fail) fail.hidden = false;
        if (btn) btn.disabled = false;
        if (label) label.textContent = original;
      }
    });
  });
}
