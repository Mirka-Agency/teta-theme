/* تتا یدک — تعاملات سبک قالب (بدون وابستگی، در کنار Bootstrap bundle) */
(() => {
  'use strict';

  const faNumber = new Intl.NumberFormat('fa-IR');

  // Quantity steppers: <div class="qty" data-qty> [-] <input> [+] </div>
  document.querySelectorAll('[data-qty]').forEach((wrap) => {
    const input = wrap.querySelector('input');
    if (!input) return;
    const min = Number(input.min) || 1;
    const max = Number(input.max) || 99;

    wrap.addEventListener('click', (event) => {
      const btn = event.target.closest('[data-qty-step]');
      if (!btn) return;
      const next = (Number(input.value) || min) + Number(btn.dataset.qtyStep);
      input.value = Math.min(max, Math.max(min, next));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
  });

  // Wishlist toggle
  document.addEventListener('click', (event) => {
    const btn = event.target.closest('.btn-wish, [data-wish]');
    if (!btn) return;
    event.preventDefault();
    const active = btn.classList.toggle('is-active');
    btn.setAttribute('aria-pressed', String(active));
    const icon = btn.querySelector('i');
    if (icon) {
      icon.classList.toggle('bi-heart', !active);
      icon.classList.toggle('bi-heart-fill', active);
    }
  });

  // Product gallery
  document.querySelectorAll('[data-gallery]').forEach((gallery) => {
    const main = gallery.querySelector('[data-gallery-main]');
    const thumbs = gallery.querySelectorAll('[data-gallery-thumb]');

    thumbs.forEach((thumb) => {
      thumb.addEventListener('click', () => {
        main.src = thumb.dataset.src;
        main.alt = thumb.dataset.alt || main.alt;
        thumbs.forEach((t) => {
          t.classList.toggle('active', t === thumb);
          t.setAttribute('aria-pressed', String(t === thumb));
        });
      });
    });
  });

  // Horizontal scroller buttons (RTL: "next" scrolls toward the left)
  document.querySelectorAll('[data-scroll]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const track = document.querySelector(btn.dataset.scroll);
      if (!track) return;
      const direction = btn.dataset.dir === 'next' ? -1 : 1;
      track.scrollBy({ left: direction * track.clientWidth * 0.75, behavior: 'smooth' });
    });
  });

  // Range input live output
  document.querySelectorAll('[data-range-output]').forEach((range) => {
    const output = document.querySelector(range.dataset.rangeOutput);
    if (!output) return;
    const update = () => { output.textContent = faNumber.format(range.value); };
    range.addEventListener('input', update);
    update();
  });

  // Bootstrap form validation
  document.querySelectorAll('form.needs-validation').forEach((form) => {
    form.addEventListener('submit', (event) => {
      if (!form.checkValidity()) {
        event.preventDefault();
        event.stopPropagation();
      }
      form.classList.add('was-validated');
    });
  });

  // Open a tab from the URL hash (e.g. account.html#register)
  const hashTab = window.location.hash && document.querySelector(`[data-bs-toggle="pill"][data-bs-target="${window.location.hash}"], [data-bs-toggle="tab"][data-bs-target="${window.location.hash}"]`);
  if (hashTab && window.bootstrap) window.bootstrap.Tab.getOrCreateInstance(hashTab).show();
})();
