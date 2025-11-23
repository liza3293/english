// Простий модуль для логіну (працює в браузері; експортується також для Node/Esm)
// Автор: пропозиція для проекту liza3293/english

// Перевірка валідності email та пароля
function validateCredentials(email, password) {
  if (typeof email !== 'string' || typeof password !== 'string') {
    return { ok: false, error: 'Email та пароль повинні бути рядками' };
  }
  const e = email.trim();
  if (e.length === 0) return { ok: false, error: 'Email обовʼязковий' };
  // базова перевірка email
  const emailRe = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
  if (!emailRe.test(e)) return { ok: false, error: 'Невірний формат email' };
  if (password.length < 6) return { ok: false, error: 'Пароль має містити мінімум 6 символів' };
  return { ok: true };
}

// Виконати запит логіну на вказаний endpoint (за замовчуванням /api/login)
async function login(email, password, options = {}) {
  const valid = validateCredentials(email, password);
  if (!valid.ok) throw new Error(valid.error);

  const endpoint = options.endpoint || '/api/login';
  const fetchImpl = (typeof fetch !== 'undefined') ? fetch : null;

  if (!fetchImpl) {
    throw new Error('fetch не знайдено. У Node.js встановіть глобальний fetch або передайте власну реалізацію через options.fetch');
  }

  const res = await fetchImpl(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    body: JSON.stringify({ email: email.trim(), password }),
    credentials: options.credentials || 'same-origin',
  });

  if (!res.ok) {
    // намагаємося витягти тіло помилки
    let detail = '';
    try { detail = await res.text(); } catch (e) { /* ignore */ }
    throw new Error(`Login failed: ${res.status} ${res.statusText} ${detail}`.trim());
  }

  // Повертаємо розпарсений JSON (якщо є)
  try {
    return await res.json();
  } catch {
    return {};
  }
}

// Автоматичне підключення до форми з id="login-form" в браузері
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('login-form');
    if (!form) return;

    const emailInput = form.querySelector('input[name="email"]');
    const passwordInput = form.querySelector('input[name="password"]');
    const submitBtn = form.querySelector('button[type="submit"], input[type="submit"]');
    let messageEl = form.querySelector('.login-message');
    if (!messageEl) {
      messageEl = document.createElement('div');
      messageEl.className = 'login-message';
      form.appendChild(messageEl);
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      messageEl.textContent = '';
      try {
        if (submitBtn) submitBtn.disabled = true;
        const result = await login(emailInput.value, passwordInput.value);
        messageEl.textContent = 'Успішний вхід';
        if (result && result.redirect) {
          window.location.href = result.redirect;
        }
      } catch (err) {
        messageEl.textContent = err.message || 'Помилка входу';
      } finally {
        if (submitBtn) submitBtn.disabled = false;
      }
    });
  });
}

// Експорт для CommonJS та ESM
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { validateCredentials, login };
}
export { validateCredentials, login };