/* =====================================================================
   form.js — contact form: inline validation, budget slider, file
   upload UI, and an animated loading → success flow that redirects
   to thank-you.html. Submission is simulated client-side.

   // TODO: connect endpoint — replace the simulateSubmit() body with a
   // fetch() call to your form endpoint / CRM webhook (e.g. Formspree,
   // HubSpot, or your own API). Everything else can stay as-is.
   ===================================================================== */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function initForm(ctx) {
  document.querySelectorAll('[data-form]').forEach((form) => {

  const fields = Array.from(form.querySelectorAll('input, select, textarea'));
  const submitBtn = form.querySelector('[type="submit"]');
  const budget = form.querySelector('[data-budget]');
  const budgetOut = form.querySelector('[data-budget-output]');
  const fileInput = form.querySelector('[data-file]');
  const fileInfo = form.querySelector('[data-file-info]');
  const consent = form.querySelector('[data-consent]');

  /* --- Budget range live output --- */
  const paintBudget = () => {
    if (!budget || !budgetOut) return;
    const value = parseInt(budget.value, 10);
    const label = value >= 100000 ? 'Custom scope' : `$${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}k+`;
    budgetOut.textContent = label;
    const pct = ((value - budget.min) / (budget.max - budget.min)) * 100;
    budget.style.setProperty('--range-fill', `${pct}%`);
  };
  budget?.addEventListener('input', paintBudget, { passive: true });
  paintBudget();

  /* --- File upload UI --- */
  const paintFile = () => {
    if (!fileInput || !fileInfo) return;
    const file = fileInput.files && fileInput.files[0];
    if (!file) {
      fileInfo.innerHTML = '<span class="text-mist/70">PDF, DOC, DOCX, PNG, JPG or ZIP — max 10 MB</span>';
      return;
    }
    const size = file.size > 1048576 ? `${(file.size / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(file.size / 1024))} KB`;
    const bad = file.size > 10 * 1048576;
    fileInfo.innerHTML = `
      <span class="${bad ? 'text-red-400' : 'text-chalk'} font-medium truncate">${file.name}</span>
      <span class="text-mist/60 font-mono text-xs">${size}</span>
      ${bad ? '<span class="text-red-400 text-xs">File exceeds 10 MB — please link it instead.</span>' : ''}`;
  };
  fileInput?.addEventListener('change', paintFile);
  paintFile();

  /* --- Inline validation --- */
  const showError = (field, message) => {
    const errorEl = form.querySelector(`[data-error-for="${field.id || field.name}"]`);
    field.setAttribute('aria-invalid', message ? 'true' : 'false');
    if (errorEl) {
      errorEl.textContent = message || '';
      errorEl.classList.toggle('is-visible', Boolean(message));
    }
  };

  const validateField = (field) => {
    const value = field.type === 'checkbox' ? field.checked : field.value.trim();
    if (field.hasAttribute('required') && !value) return showError(field, 'This field is required.'), false;
    if (field.type === 'email' && value && !EMAIL_RE.test(value)) return showError(field, 'Please enter a valid email address.'), false;
    if (field.type === 'checkbox' && field.hasAttribute('required') && !value) return showError(field, 'Please confirm to continue.'), false;
    showError(field, '');
    return true;
  };

  fields.forEach((field) => {
    field.addEventListener('blur', () => validateField(field));
    field.addEventListener('input', () => { if (field.getAttribute('aria-invalid') === 'true') validateField(field); }, { passive: true });
  });

  /* --- Submit: validate → loading → redirect --- */
  const setLoading = (loading) => {
    if (!submitBtn) return;
    submitBtn.dataset.state = loading ? 'loading' : 'idle';
    submitBtn.disabled = loading;
    const label = submitBtn.querySelector('[data-btn-label]');
    if (label) label.textContent = loading ? 'Sending…' : label.dataset.idle || label.textContent;
  };

  const simulateSubmit = async (data) => {
    // TODO: connect endpoint
    // await fetch('https://your-endpoint.example/leads', {
    //   method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
    // });
    await new Promise((resolve) => setTimeout(resolve, 1400));
    return { ok: true };
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const valid = fields.map((f) => (f.offsetParent !== null || f.type === 'checkbox' ? validateField(f) : true));
    const firstInvalid = fields.find((f) => f.getAttribute('aria-invalid') === 'true');
    if (firstInvalid) { firstInvalid.focus(); return; }
    if (valid.includes(false)) return;

    const data = {
      name: form.name?.value || form.querySelector('[name="name"]')?.value,
      email: form.querySelector('[name="email"]')?.value,
      company: form.querySelector('[name="company"]')?.value || '',
      service: form.querySelector('[name="service"]')?.value || '',
      budget: budget ? budget.value : '',
      details: form.querySelector('[name="details"]')?.value || '',
      consent: Boolean(consent?.checked),
      ts: new Date().toISOString(),
    };

    setLoading(true);
    try {
      const res = await simulateSubmit(data);
      if (!res.ok) throw new Error('submit failed');
      const first = (data.name || '').split(' ')[0];
      window.location.href = `thank-you.html${first ? `?name=${encodeURIComponent(first)}` : ''}`;
    } catch (_) {
      setLoading(false);
      ctx.toast('Something went wrong — please email hello@allsyncpro.com directly.', 'error');
    }
  });
  });
}
