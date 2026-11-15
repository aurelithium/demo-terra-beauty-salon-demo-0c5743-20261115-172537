(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Утилиты ---------- */
  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  /* ---------- Sticky-хедер при скролле ---------- */
  var header = $('.site-header');
  if (header) {
    var onScroll = function () {
      if (window.scrollY > 12) { header.classList.add('is-scrolled'); }
      else { header.classList.remove('is-scrolled'); }
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------- Мобильное меню ---------- */
  var navToggle = $('.nav-toggle');
  var mobileMenu = $('#mobile-menu');

  function closeMenu() {
    if (!navToggle || !mobileMenu) { return; }
    navToggle.setAttribute('aria-expanded', 'false');
    var label = $('.visually-hidden', navToggle);
    if (label) { label.textContent = 'Открыть меню'; }
    mobileMenu.hidden = true;
    document.body.style.overflow = '';
  }

  function openMenu() {
    if (!navToggle || !mobileMenu) { return; }
    navToggle.setAttribute('aria-expanded', 'true');
    var label = $('.visually-hidden', navToggle);
    if (label) { label.textContent = 'Закрыть меню'; }
    mobileMenu.hidden = false;
    document.body.style.overflow = 'hidden';
    var firstLink = $('a', mobileMenu);
    if (firstLink) { firstLink.focus(); }
  }

  if (navToggle && mobileMenu) {
    navToggle.addEventListener('click', function () {
      var expanded = navToggle.getAttribute('aria-expanded') === 'true';
      if (expanded) { closeMenu(); } else { openMenu(); }
    });

    $$('a', mobileMenu).forEach(function (link) {
      link.addEventListener('click', closeMenu);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && navToggle.getAttribute('aria-expanded') === 'true') {
        closeMenu();
        navToggle.focus();
      }
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth >= 900 && navToggle.getAttribute('aria-expanded') === 'true') {
        closeMenu();
      }
    });
  }

  /* ---------- Подсветка активного пункта меню ---------- */
  var navLinks = $$('.nav-list a');
  var sections = navLinks.map(function (link) {
    var id = link.getAttribute('href');
    if (id && id.charAt(0) === '#') { return document.querySelector(id); }
    return null;
  }).filter(Boolean);

  if ('IntersectionObserver' in window && sections.length) {
    var navObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) { return; }
        navLinks.forEach(function (link) {
          var active = link.getAttribute('href') === '#' + entry.target.id;
          link.style.color = active ? 'var(--accent)' : '';
          link.style.borderBottomColor = active ? 'var(--accent)' : '';
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
    sections.forEach(function (sec) { navObserver.observe(sec); });
  }

  /* ---------- Reveal-анимации ---------- */
  var revealTargets = $$('.section, .master-card, .work-item, .stat, .review-featured');
  if (!reduceMotion && 'IntersectionObserver' in window) {
    revealTargets.forEach(function (el) {
      el.style.opacity = '0';
      el.style.transform = 'translateY(22px)';
      el.style.transition = 'opacity .7s cubic-bezier(.22,.61,.36,1), transform .7s cubic-bezier(.22,.61,.36,1)';
    });
    var revealObserver = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealTargets.forEach(function (el) { revealObserver.observe(el); });
  }

  /* ---------- Счётчики цифр ---------- */
  var counters = $$('[data-count]');
  function animateCount(el) {
    var target = parseInt(el.getAttribute('data-count'), 10);
    if (isNaN(target)) { return; }
    if (reduceMotion) { el.textContent = String(target); return; }
    var start = 0;
    var duration = 1200;
    var startTime = null;
    function step(ts) {
      if (startTime === null) { startTime = ts; }
      var progress = Math.min((ts - startTime) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = String(Math.round(start + (target - start) * eased));
      if (progress < 1) { window.requestAnimationFrame(step); }
    }
    window.requestAnimationFrame(step);
  }

  if (counters.length) {
    if ('IntersectionObserver' in window && !reduceMotion) {
      var countObserver = new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            animateCount(entry.target);
            obs.unobserve(entry.target);
          }
        });
      }, { threshold: 0.5 });
      counters.forEach(function (el) { countObserver.observe(el); });
    } else {
      counters.forEach(function (el) {
        var t = parseInt(el.getAttribute('data-count'), 10);
        if (!isNaN(t)) { el.textContent = String(t); }
      });
    }
  }

  /* ---------- FAQ-аккордеон: один открыт ---------- */
  var faqItems = $$('.faq-item');
  faqItems.forEach(function (item) {
    item.addEventListener('toggle', function () {
      if (item.open) {
        faqItems.forEach(function (other) {
          if (other !== item) { other.open = false; }
        });
      }
    });
  });

  /* ---------- Плавный скролл к якорям с учётом хедера ---------- */
  $$('a[href^="#"]').forEach(function (link) {
    var href = link.getAttribute('href');
    if (!href || href === '#' || href.length < 2) { return; }
    link.addEventListener('click', function (e) {
      var target = document.getElementById(href.slice(1));
      if (!target) { return; }
      e.preventDefault();
      if (reduceMotion) {
        target.scrollIntoView();
      } else {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      if (history.replaceState) { history.replaceState(null, '', href); }
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    });
  });

  /* ---------- Демо-форма записи ---------- */
  var form = $('#booking-form');
  if (form) {
    var nameInput = $('#booking-name');
    var phoneInput = $('#booking-phone');
    var serviceSelect = $('#booking-service');
    var dateInput = $('#booking-date');
    var feedback = $('#form-feedback');

    /* Дата не в прошлом */
    if (dateInput) {
      var today = new Date();
      var yyyy = today.getFullYear();
      var mm = String(today.getMonth() + 1).padStart(2, '0');
      var dd = String(today.getDate()).padStart(2, '0');
      dateInput.setAttribute('min', yyyy + '-' + mm + '-' + dd);
    }

    function setError(input, message) {
      if (!input) { return; }
      var field = input.closest('.field');
      if (!field) { return; }
      input.setAttribute('aria-invalid', 'true');
      var error = field.querySelector('.field-error');
      if (!error) {
        error = document.createElement('p');
        error.className = 'field-error';
        error.setAttribute('role', 'alert');
        error.style.cssText = 'color:var(--accent);font-size:.82rem;margin:.4em 0 0;font-weight:600;';
        field.appendChild(error);
      }
      error.textContent = message;
    }

    function clearError(input) {
      if (!input) { return; }
      var field = input.closest('.field');
      if (!field) { return; }
      input.removeAttribute('aria-invalid');
      var error = field.querySelector('.field-error');
      if (error) { error.remove(); }
    }

    function validateName() {
      var value = (nameInput.value || '').trim();
      if (value.length < 2) {
        setError(nameInput, 'Введите имя (минимум 2 символа).');
        return false;
      }
      clearError(nameInput);
      return true;
    }

    function validatePhone() {
      var digits = (phoneInput.value || '').replace(/\D/g, '');
      if (digits.length < 10) {
        setError(phoneInput, 'Введите телефон: минимум 10 цифр.');
        return false;
      }
      clearError(phoneInput);
      return true;
    }

    function validateService() {
      if (!serviceSelect.value) {
        setError(serviceSelect, 'Выберите услугу.');
        return false;
      }
      clearError(serviceSelect);
      return true;
    }

    function validateDate() {
      if (!dateInput.value) {
        setError(dateInput, 'Выберите желаемую дату.');
        return false;
      }
      var chosen = new Date(dateInput.value + 'T00:00:00');
      var now = new Date();
      now.setHours(0, 0, 0, 0);
      if (chosen < now) {
        setError(dateInput, 'Дата не может быть в прошлом.');
        return false;
      }
      clearError(dateInput);
      return true;
    }

    [nameInput, phoneInput, serviceSelect, dateInput].forEach(function (input) {
      if (!input) { return; }
      input.addEventListener('blur', function () {
        if (input === nameInput) { validateName(); }
        if (input === phoneInput) { validatePhone(); }
        if (input === serviceSelect) { validateService(); }
        if (input === dateInput) { validateDate(); }
      });
      input.addEventListener('input', function () { clearError(input); });
      input.addEventListener('change', function () { clearError(input); });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var okName = validateName();
      var okPhone = validatePhone();
      var okService = validateService();
      var okDate = validateDate();
      if (!(okName && okPhone && okService && okDate)) {
        if (feedback) {
          feedback.textContent = 'Проверьте отмеченные поля — заявка не отправлена.';
          feedback.style.color = 'var(--accent)';
        }
        return;
      }

      var submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Обрабатываем…';
      }
      if (feedback) {
        feedback.textContent = '';
        feedback.style.color = '';
      }

      window.setTimeout(function () {
        if (feedback) {
          feedback.textContent = 'Демо: заявка не отправлена. Данные никуда не передаются — форму можно закрыть.';
          feedback.style.color = 'var(--espresso)';
        }
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Отправить демо-заявку';
        }
        form.reset();
        [nameInput, phoneInput, serviceSelect, dateInput].forEach(clearError);
      }, 700);
    });
  }

  /* ---------- Кнопки «Записаться к мастеру»: подставляют мастера подсказкой ---------- */
  $$('.master-card').forEach(function (card) {
    var button = card.querySelector('a[href="#booking"]');
    var masterName = card.querySelector('h3');
    if (!button || !masterName) { return; }
    button.addEventListener('click', function () {
      var note = document.querySelector('.form-demo-note');
      if (note) {
        note.textContent = 'Демо-форма. Вы выбрали: ' + masterName.textContent.trim() + '. Данные не отправляются.';
      }
    });
  });

  /* ---------- Актуальный год в footer (если есть) ---------- */
  var yearEl = $('[data-year]');
  if (yearEl) { yearEl.textContent = String(new Date().getFullYear()); }
})();