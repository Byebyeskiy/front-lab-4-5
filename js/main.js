/* FlowTask — native controls; no fake network requests. */
document.addEventListener('DOMContentLoaded', () => {
  function startSignup() {
    const trial = document.getElementById('trial');
    if (!trial) {
      window.location.href = 'index.html#trial';
      return;
    }
    document.getElementById('trial-name').focus();
  }
  ['header-cta', 'hero-cta'].forEach(id => {
    document.getElementById(id)?.addEventListener('click', startSignup);
  });
  document.querySelectorAll('.faq__q').forEach(question => {
    question.addEventListener('click', () => {
      const answer = document.getElementById(question.getAttribute('aria-controls'));
      const open = question.getAttribute('aria-expanded') !== 'true';
      question.setAttribute('aria-expanded', String(open));
      answer.hidden = !open;
      question.parentElement.classList.toggle('is-open', open);
    });
  });
  const form = document.getElementById('trial-form');
  if (!form) return;
  const status = document.getElementById('trial-status');
  function validate(input) {
    const error = document.getElementById(`${input.name}-error`);
    const message = input.validity.valueMissing
      ? (input.name === 'email' ? 'Enter your work email.' : 'Enter your name.')
      : input.validity.typeMismatch ? 'Enter a valid email address, such as name@example.com.' : '';
    if (message) input.setAttribute('aria-invalid', 'true');
    else input.removeAttribute('aria-invalid');
    error.textContent = message;
    return !message;
  }
  const required = [...form.querySelectorAll('[required]')];
  required.forEach(input => input.addEventListener('input', () => {
    if (input.hasAttribute('aria-invalid')) validate(input);
    status.textContent = '';
  }));
  form.addEventListener('submit', event => {
    event.preventDefault();
    const invalid = required.filter(input => !validate(input));
    if (invalid.length) {
      status.textContent = 'Please correct the fields indicated below.';
      invalid[0].focus();
      return;
    }
    status.textContent = 'Demo complete: your form is valid. No account was created and no email was sent.';
  });
});
