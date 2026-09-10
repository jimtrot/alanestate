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

export function enhanceForms(root: ParentNode = document) {
  root.querySelectorAll<HTMLFormElement>('form.waitlist-form').forEach((form) => {
    if (form.dataset.enhanced) return;
    form.dataset.enhanced = '1';
    fillContext(form);
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

      const url = form.dataset.ajax;
      if (!url) { form.submit(); return; }
      const data: Record<string, string> = {};
      new FormData(form).forEach((v, k) => { if (k !== '_next') data[k] = String(v); });
      data['submitted_at'] = new Date().toISOString();
      if (btn) btn.disabled = true;
      const original = label?.textContent ?? '';
      if (label) label.textContent = 'Sending…';
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(data),
        });
        const json = await res.json().catch(() => ({}));
        if (res.ok && String(json.success) === 'true') {
          form.querySelectorAll<HTMLElement>('fieldset, .field, .choice, .grid, [data-submit]').forEach((el) => { if (!el.closest('[data-success]')) el.hidden = true; });
          if (ok) { ok.hidden = false; ok.focus?.(); }
          try { localStorage.setItem('ae:waitlist', data['segment'] || '1'); } catch {}
          (window as any).__aeTrack?.('waitlist_submit', { segment: data['segment'] });
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
