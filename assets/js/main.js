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

  // Blog single: build TOC from article h2 headings + scroll spy
  document.querySelectorAll('[data-toc]').forEach((toc) => {
    const list = toc.querySelector('[data-toc-list]');
    const content = document.querySelector('.post-content');
    if (!list || !content) return;

    const headings = [...content.querySelectorAll('h2')];
    if (!headings.length) {
      toc.hidden = true;
      return;
    }

    const slugify = (text, index) => {
      const base = text
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\u0600-\u06FFa-zA-Z0-9-]/g, '')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      return base || `section-${index + 1}`;
    };

    const links = headings.map((heading, index) => {
      if (!heading.id) heading.id = slugify(heading.textContent || '', index);
      const item = document.createElement('li');
      const link = document.createElement('a');
      link.href = `#${heading.id}`;
      link.textContent = heading.textContent.trim();
      item.appendChild(link);
      list.appendChild(item);
      return link;
    });

    const setActive = (id) => {
      links.forEach((link) => {
        const active = link.getAttribute('href') === `#${id}`;
        link.classList.toggle('is-active', active);
        if (active) link.setAttribute('aria-current', 'true');
        else link.removeAttribute('aria-current');
      });
    };

    const spyOffset = () => {
      const raw = getComputedStyle(document.documentElement).getPropertyValue('--tp-header-offset');
      const header = Number.parseFloat(raw) || 0;
      return (header + 1.25) * 16;
    };

    const updateFromScroll = () => {
      const marker = window.scrollY + spyOffset();
      let current = headings[0];

      headings.forEach((heading) => {
        const top = heading.getBoundingClientRect().top + window.scrollY;
        if (top <= marker) current = heading;
      });

      if (current?.id) setActive(current.id);
    };

    let ticking = false;
    window.addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        updateFromScroll();
        ticking = false;
      });
    }, { passive: true });

    list.addEventListener('click', (event) => {
      const link = event.target.closest('a[href^="#"]');
      if (!link) return;
      const id = link.getAttribute('href').slice(1);
      if (id) setActive(id);
    });

    updateFromScroll();
  });

  // Blog archive: filter posts by category chips
  document.querySelectorAll('[data-blog-cats]').forEach((nav) => {
    const grid = document.querySelector('[data-blog-grid]');
    if (!grid) return;

    const posts = [...grid.querySelectorAll('[data-blog-post]')];
    const links = [...nav.querySelectorAll('[data-blog-cat]')];
    const empty = document.querySelector('[data-blog-empty]');
    const pagination = document.querySelector('[data-blog-pagination]');
    const validCats = new Set(['all', ...posts.map((post) => post.dataset.category).filter(Boolean)]);

    const counts = posts.reduce((acc, post) => {
      const cat = post.dataset.category;
      if (!cat) return acc;
      acc[cat] = (acc[cat] || 0) + 1;
      acc.all += 1;
      return acc;
    }, { all: 0 });

    nav.querySelectorAll('[data-blog-cat-count]').forEach((el) => {
      const key = el.dataset.blogCatCount;
      if (counts[key] != null) el.textContent = faNumber.format(counts[key]);
    });

    const setCategory = (cat, { push = false } = {}) => {
      const next = validCats.has(cat) ? cat : 'all';
      let visible = 0;

      posts.forEach((post) => {
        const show = next === 'all' || post.dataset.category === next;
        post.hidden = !show;
        if (show) visible += 1;
      });

      links.forEach((link) => {
        const active = link.dataset.blogCat === next;
        link.classList.toggle('is-active', active);
        if (active) link.setAttribute('aria-current', 'page');
        else link.removeAttribute('aria-current');
      });

      if (empty) empty.hidden = visible > 0;
      if (pagination) pagination.hidden = next !== 'all';

      const url = new URL(window.location.href);
      if (next === 'all') url.searchParams.delete('cat');
      else url.searchParams.set('cat', next);

      const method = push ? 'pushState' : 'replaceState';
      history[method]({ cat: next }, '', url);
    };

    nav.addEventListener('click', (event) => {
      const link = event.target.closest('[data-blog-cat]');
      if (!link || !nav.contains(link)) return;
      event.preventDefault();
      setCategory(link.dataset.blogCat || 'all', { push: true });
    });

    window.addEventListener('popstate', (event) => {
      const cat = event.state?.cat || new URL(window.location.href).searchParams.get('cat') || 'all';
      setCategory(cat);
    });

    const initial = new URL(window.location.href).searchParams.get('cat') || 'all';
    setCategory(initial);
  });

  // Shop mega menu: hover on desktop only; click navigates to shop.html
  const shopNav = document.querySelector('.header-nav .nav-shop');
  if (shopNav) {
    const mq = window.matchMedia('(min-width: 992px)');
    let hideTimer;

    shopNav.addEventListener('mouseenter', () => {
      if (!mq.matches) return;
      clearTimeout(hideTimer);
      shopNav.classList.add('show');
    });
    shopNav.addEventListener('mouseleave', () => {
      if (!mq.matches) return;
      clearTimeout(hideTimer);
      hideTimer = setTimeout(() => shopNav.classList.remove('show'), 120);
    });
  }

  // Horizontal scroller buttons (RTL: "next" scrolls toward the left)
  document.querySelectorAll('[data-scroll]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const track = document.querySelector(btn.dataset.scroll);
      if (!track) return;
      const direction = btn.dataset.dir === 'next' ? -1 : 1;
      track.scrollBy({ left: direction * track.clientWidth * 0.75, behavior: 'smooth' });
    });
  });

  // Shop product sorting
  document.querySelectorAll('[data-shop-sort]').forEach((toolbar) => {
    const grid = document.querySelector('[data-shop-grid]');
    if (!grid) return;

    const faDigits = '۰۱۲۳۴۵۶۷۸۹';
    const parseFa = (text) => {
      const normalized = String(text || '').replace(/[۰-۹]/g, (d) => String(faDigits.indexOf(d)));
      return Number(normalized.replace(/[^\d]/g, '')) || 0;
    };

    const items = [...grid.children];
    items.forEach((col, index) => {
      const card = col.querySelector('.product-card');
      const priceEl = col.querySelector('.price strong');
      col.dataset.index = String(index);
      col.dataset.price = String(parseFa(priceEl?.childNodes[0]?.textContent || priceEl?.textContent || '0'));
      col.dataset.sales = String(Number(col.dataset.sales) || (items.length - index) * 17);
      col.dataset.newest = card?.querySelector('.badge-new') ? '1' : '0';
      col.dataset.stock = card?.classList.contains('is-out') ? '0' : '1';
    });

    const applySort = (mode) => {
      const sorted = [...items].sort((a, b) => {
        const priceA = Number(a.dataset.price);
        const priceB = Number(b.dataset.price);
        const salesA = Number(a.dataset.sales);
        const salesB = Number(b.dataset.sales);
        const indexA = Number(a.dataset.index);
        const indexB = Number(b.dataset.index);
        const newA = Number(a.dataset.newest);
        const newB = Number(b.dataset.newest);

        if (mode === 'price-asc') return priceA - priceB || indexA - indexB;
        if (mode === 'price-desc') return priceB - priceA || indexA - indexB;
        if (mode === 'sales') return salesB - salesA || indexA - indexB;
        if (mode === 'newest') return newB - newA || indexA - indexB;
        return indexA - indexB;
      });

      sorted.forEach((col) => grid.appendChild(col));

      toolbar.querySelectorAll('[data-sort]').forEach((btn) => {
        const active = btn.dataset.sort === mode;
        btn.classList.toggle('active', active);
        btn.setAttribute('aria-pressed', String(active));
      });

      const select = toolbar.querySelector('[data-sort-select]');
      if (select && select.value !== mode) select.value = mode;
    };

    toolbar.addEventListener('click', (event) => {
      const btn = event.target.closest('[data-sort]');
      if (!btn || !toolbar.contains(btn)) return;
      applySort(btn.dataset.sort || 'relevant');
    });

    const select = toolbar.querySelector('[data-sort-select]');
    if (select) {
      select.addEventListener('change', () => applySort(select.value || 'relevant'));
    }
  });

  // Shop active filter chips
  document.querySelectorAll('[data-shop-filters]').forEach((form) => {
    const chips = document.getElementById('activeFilters');
    if (!chips) return;

    const labelFor = (control) => {
      if (control.dataset.filterLabel && control.tagName === 'SELECT') {
        const option = control.selectedOptions[0];
        return option ? option.textContent.trim() : '';
      }
      if (control.dataset.filterLabel && control.type === 'range') {
        return `${control.dataset.filterLabel}: ${faNumber.format(control.value)} تومان`;
      }
      const label = form.querySelector(`label[for="${control.id}"]`);
      return label ? label.textContent.trim() : control.id;
    };

    const isActive = (control) => {
      if (control.type === 'checkbox') return control.checked;
      if (control.type === 'range') return Number(control.value) < Number(control.max);
      if (control.tagName === 'SELECT') return Boolean(control.value);
      return false;
    };

    const clearControl = (control) => {
      if (control.type === 'checkbox') control.checked = false;
      else if (control.type === 'range') control.value = control.max;
      else if (control.tagName === 'SELECT') control.value = '';
      control.dispatchEvent(new Event('input', { bubbles: true }));
      control.dispatchEvent(new Event('change', { bubbles: true }));
    };

    const render = () => {
      chips.innerHTML = '';
      form.querySelectorAll('[data-filter-chip]').forEach((control) => {
        if (!isActive(control)) return;
        const text = labelFor(control);
        if (!text) return;

        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'chip';
        chip.dataset.chipFor = control.id;
        chip.innerHTML = `${text} <i class="bi bi-x" aria-hidden="true"></i><span class="visually-hidden">حذف فیلتر</span>`;
        chips.appendChild(chip);
      });
      chips.hidden = chips.childElementCount === 0;
    };

    form.addEventListener('change', render);
    form.addEventListener('input', (event) => {
      if (event.target.matches('[data-filter-chip][type="range"]')) render();
    });

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      render();
    });

    form.addEventListener('reset', () => {
      requestAnimationFrame(render);
    });

    chips.addEventListener('click', (event) => {
      const chip = event.target.closest('[data-chip-for]');
      if (!chip) return;
      const control = form.querySelector(`#${CSS.escape(chip.dataset.chipFor)}`);
      if (!control) return;
      clearControl(control);
      render();
    });

    render();
  });

  // Range input live output
  document.querySelectorAll('[data-range-output]').forEach((range) => {
    const output = document.querySelector(range.dataset.rangeOutput);
    if (!output) return;
    const update = () => { output.textContent = faNumber.format(range.value); };
    range.addEventListener('input', update);
    update();
  });

  // Form submit: validate (if needed) then show success alert
  document.addEventListener('submit', (event) => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement)) return;
    if (form.matches('.header-search, [role="search"], .modal-content, [data-shop-filters]')) return;

    const shouldAlert = form.hasAttribute('data-success-alert') || form.classList.contains('needs-validation');
    if (!shouldAlert) return;

    if (form.classList.contains('needs-validation') && !form.checkValidity()) {
      event.preventDefault();
      event.stopPropagation();
      form.classList.add('was-validated');
      return;
    }

    event.preventDefault();
    if (form.classList.contains('needs-validation')) form.classList.add('was-validated');
    window.alert(form.dataset.successAlert || 'فرم با موفقیت ثبت شد.');

    if (!form.hasAttribute('data-keep-values')) {
      form.reset();
      form.classList.remove('was-validated');
    }
  });

  // Open a tab from the URL hash (e.g. account.html#register)
  const hashTab = window.location.hash && document.querySelector(`[data-bs-toggle="pill"][data-bs-target="${window.location.hash}"], [data-bs-toggle="tab"][data-bs-target="${window.location.hash}"]`);
  if (hashTab && window.bootstrap) window.bootstrap.Tab.getOrCreateInstance(hashTab).show();

  // Themed select popup (replaces native option list)
  const closeAllSelects = (except) => {
    document.querySelectorAll('.tp-select.is-open').forEach((wrap) => {
      if (wrap === except) return;
      wrap.classList.remove('is-open');
      const trigger = wrap.querySelector('.tp-select-trigger');
      if (trigger) trigger.setAttribute('aria-expanded', 'false');
    });
  };

  document.querySelectorAll('select.form-select').forEach((select) => {
    if (select.closest('.tp-select') || select.dataset.native === 'true') return;

    const wrap = document.createElement('div');
    wrap.className = 'tp-select';
    select.parentNode.insertBefore(wrap, select);
    wrap.appendChild(select);

    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'tp-select-trigger';
    trigger.setAttribute('aria-haspopup', 'listbox');
    trigger.setAttribute('aria-expanded', 'false');
    if (select.id) trigger.id = `${select.id}-trigger`;
    trigger.innerHTML = '<span class="tp-select-label"></span>';

    const menu = document.createElement('ul');
    menu.className = 'tp-select-menu';
    menu.setAttribute('role', 'listbox');
    if (select.id) menu.id = `${select.id}-listbox`;
    trigger.setAttribute('aria-controls', menu.id || '');

    const label = trigger.querySelector('.tp-select-label');

    const syncLabel = () => {
      const selected = select.options[select.selectedIndex];
      label.textContent = selected ? selected.textContent.trim() : '';
      const isPlaceholder = !selected || selected.disabled || selected.value === '';
      label.classList.toggle('is-placeholder', isPlaceholder);
    };

    const buildOptions = () => {
      menu.innerHTML = '';
      Array.from(select.options).forEach((option, index) => {
        const item = document.createElement('li');
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'tp-select-option';
        btn.setAttribute('role', 'option');
        btn.dataset.index = String(index);
        btn.textContent = option.textContent.trim();
        btn.disabled = option.disabled;
        if (option.selected) {
          btn.classList.add('is-selected');
          btn.setAttribute('aria-selected', 'true');
        } else {
          btn.setAttribute('aria-selected', 'false');
        }
        btn.addEventListener('click', () => {
          select.selectedIndex = index;
          select.dispatchEvent(new Event('change', { bubbles: true }));
          syncLabel();
          buildOptions();
          closeAllSelects();
          trigger.focus();
        });
        item.appendChild(btn);
        menu.appendChild(item);
      });
    };

    trigger.addEventListener('click', () => {
      const willOpen = !wrap.classList.contains('is-open');
      closeAllSelects(willOpen ? wrap : null);
      wrap.classList.toggle('is-open', willOpen);
      trigger.setAttribute('aria-expanded', String(willOpen));
    });

    select.addEventListener('change', () => {
      syncLabel();
      buildOptions();
    });

    if (select.form) {
      select.form.addEventListener('reset', () => {
        requestAnimationFrame(() => {
          syncLabel();
          buildOptions();
        });
      });
    }

    if (select.disabled) {
      trigger.disabled = true;
      wrap.classList.add('is-disabled');
    }

    wrap.appendChild(trigger);
    wrap.appendChild(menu);
    syncLabel();
    buildOptions();
  });

  document.addEventListener('click', (event) => {
    if (event.target.closest('.tp-select')) return;
    closeAllSelects();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeAllSelects();
  });
})();
