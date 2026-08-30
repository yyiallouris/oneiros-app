(() => {
  const form = document.getElementById('support-form');
  const submitButton = document.getElementById('support-submit');
  const status = document.getElementById('support-status');

  if (!form || !submitButton || !status) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    status.className = 'support-status';

    if (!form.reportValidity()) return;

    const formData = new FormData(form);
    const payload = {
      email: String(formData.get('email') || '').trim(),
      subject: String(formData.get('subject') || '').trim(),
      message: String(formData.get('message') || '').trim(),
      company: String(formData.get('company') || '').trim(),
    };

    if (!payload.message) {
      status.textContent = 'Please tell us how we can help.';
      status.classList.add('error');
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = 'Sending…';
    status.textContent = '';

    try {
      const response = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('support_request_failed');

      form.reset();
      status.textContent = 'Your message has been sent. We’ll be in touch soon.';
      status.classList.add('success');
    } catch {
      status.textContent =
        'We couldn’t send your message. Please email support@oneirosjournal.com directly.';
      status.classList.add('error');
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = 'Send message';
    }
  });
})();
