/* ============================================================
   THANH TÂM FOUNDATION — MAIN JAVASCRIPT
   ============================================================ */

(function () {
  'use strict';

  /* ---- Sticky Header ---- */
  const header = document.getElementById('header');
  function handleScroll() {
    if (window.scrollY > 40) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  }
  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();

  /* ---- Mobile Navigation ---- */
  const hamburger = document.getElementById('hamburger');
  const mobileNav = document.getElementById('mobileNav');
  const mobileNavLinks = mobileNav ? mobileNav.querySelectorAll('a') : [];

  if (hamburger && mobileNav) {
    hamburger.addEventListener('click', () => {
      const isOpen = mobileNav.classList.toggle('open');
      hamburger.setAttribute('aria-expanded', isOpen);
      hamburger.querySelectorAll('span')[0].style.transform = isOpen ? 'rotate(45deg) translate(4.5px, 4.5px)' : '';
      hamburger.querySelectorAll('span')[1].style.opacity  = isOpen ? '0' : '';
      hamburger.querySelectorAll('span')[2].style.transform = isOpen ? 'rotate(-45deg) translate(4.5px, -4.5px)' : '';
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });
    mobileNavLinks.forEach(link => {
      link.addEventListener('click', () => {
        mobileNav.classList.remove('open');
        document.body.style.overflow = '';
        hamburger.querySelectorAll('span').forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
      });
    });
  }

  /* ---- Language Switcher ---- */
  const langBtns = document.querySelectorAll('[data-lang-toggle]');
  const mobileLangBtns = document.querySelectorAll('[data-mobile-lang-toggle]');

  function setLanguage(lang) {
    document.body.classList.toggle('lang-en', lang === 'en');
    document.documentElement.setAttribute('lang', lang === 'en' ? 'en' : 'vi');

    // Sync all lang buttons
    document.querySelectorAll('[data-lang-toggle]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.langToggle === lang);
    });
    document.querySelectorAll('[data-mobile-lang-toggle]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mobileLangToggle === lang);
    });

    try { localStorage.setItem('ttf-lang', lang); } catch (e) {}
  }

  langBtns.forEach(btn => {
    btn.addEventListener('click', () => setLanguage(btn.dataset.langToggle));
  });
  mobileLangBtns.forEach(btn => {
    btn.addEventListener('click', () => setLanguage(btn.dataset.mobileLangToggle));
  });

  // Restore saved language
  try {
    const saved = localStorage.getItem('ttf-lang');
    if (saved === 'en') setLanguage('en');
  } catch (e) {}

  /* ---- Scroll Animations (Intersection Observer) ---- */
  const animatedEls = document.querySelectorAll('.fade-in, .fade-in-left, .fade-in-right');

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.12,
      rootMargin: '0px 0px -60px 0px'
    });

    animatedEls.forEach(el => observer.observe(el));
  } else {
    // Fallback: show all
    animatedEls.forEach(el => el.classList.add('visible'));
  }

  /* ---- Active nav link on scroll ---- */
  const sections = document.querySelectorAll('section[id]');
  const navLinks  = document.querySelectorAll('.nav-links a[href^="#"]');

  function setActiveNav() {
    let current = '';
    sections.forEach(sec => {
      const top = sec.offsetTop - 120;
      if (window.scrollY >= top) current = sec.id;
    });
    navLinks.forEach(a => {
      const href = a.getAttribute('href').slice(1);
      a.classList.toggle('active', href === current);
    });
  }
  window.addEventListener('scroll', setActiveNav, { passive: true });

  /* ---- Parallax hero image (lightweight) ---- */
  const heroBgImg = document.querySelector('.hero-bg img');
  if (heroBgImg) {
    window.addEventListener('scroll', () => {
      const scrolled = window.scrollY;
      if (scrolled < window.innerHeight) {
        heroBgImg.style.transform = `scale(1.08) translateY(${scrolled * 0.25}px)`;
      }
    }, { passive: true });
  }

  /* ---- Floating Particles ---- */
  const particleContainer = document.querySelector('.hero-particles');
  if (particleContainer) {
    const count = 18;
    for (let i = 0; i < count; i++) {
      const p = document.createElement('div');
      p.classList.add('particle');
      const size = Math.random() * 3 + 1;
      p.style.cssText = `
        width: ${size}px;
        height: ${size}px;
        left: ${Math.random() * 100}%;
        bottom: ${Math.random() * 20}%;
        animation-duration: ${Math.random() * 12 + 8}s;
        animation-delay: ${Math.random() * 8}s;
        opacity: ${Math.random() * 0.5};
      `;
      particleContainer.appendChild(p);
    }
  }

  /* ---- Smooth scroll for anchor links ---- */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const offset = 80;
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

  /* ---- Number counter animation ---- */
  function animateCounter(el) {
    const target = parseInt(el.dataset.target, 10);
    const duration = 2000;
    const step = target / (duration / 16);
    let current = 0;
    const timer = setInterval(() => {
      current += step;
      if (current >= target) {
        el.textContent = target.toLocaleString();
        clearInterval(timer);
      } else {
        el.textContent = Math.floor(current).toLocaleString();
      }
    }, 16);
  }

  const counters = document.querySelectorAll('[data-target]');
  if (counters.length && 'IntersectionObserver' in window) {
    const cObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          cObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    counters.forEach(c => cObserver.observe(c));
  }

  /* ---- Public house map ---- */
  const houseMap = document.querySelector('[data-house-map]');
  if (houseMap) {
    const houseData = {
      'da-lat': {
        title: 'Đà Lạt',
        statusVi: 'Đang vận hành định hướng',
        statusEn: 'Orientation active',
        descriptionVi: 'Nhịp chậm, phù hợp học sâu, viết, nghiên cứu và làm việc tập trung.',
        descriptionEn: 'A slower rhythm for deep learning, writing, research and focused work.',
        rhythmVi: 'Chậm và sâu',
        rhythmEn: 'Slow and deep',
        activitiesVi: 'Học sâu · viết · nghiên cứu',
        activitiesEn: 'Deep learning · writing · research'
      },
      'sai-gon': {
        title: 'Sài Gòn',
        statusVi: 'Kết nối dự án',
        statusEn: 'Project connection',
        descriptionVi: 'Kết nối dự án, gặp nhóm, thử vai trò và cộng tác nhanh.',
        descriptionEn: 'Project connection, team meetings, role trials and fast collaboration.',
        rhythmVi: 'Nhanh và kết nối',
        rhythmEn: 'Fast and connected',
        activitiesVi: 'Gặp nhóm · thử vai trò · cộng tác',
        activitiesEn: 'Team meetings · role trials · collaboration'
      },
      'lam-dong': {
        title: 'Lâm Đồng',
        statusVi: 'Trải nghiệm ngắn',
        statusEn: 'Short stays',
        descriptionVi: 'Trải nghiệm ngắn, nhịp gần thiên nhiên, phù hợp học và phục hồi lịch làm việc.',
        descriptionEn: 'Short stays, nature-close rhythm, suitable for learning and resetting work routines.',
        rhythmVi: 'Gần thiên nhiên',
        rhythmEn: 'Nature-close',
        activitiesVi: 'Học · làm nhóm · phục hồi lịch làm việc',
        activitiesEn: 'Learning · group work · work routine reset'
      },
      'nha-trang': {
        title: 'Nha Trang',
        statusVi: 'Đang chuẩn bị',
        statusEn: 'In preparation',
        descriptionVi: 'Nhóm mới, đang chuẩn bị dữ liệu vận hành và lịch hoạt động phù hợp.',
        descriptionEn: 'A new group preparing operating data and a suitable activity calendar.',
        rhythmVi: 'Biển và nhóm mới',
        rhythmEn: 'Coastal and forming',
        activitiesVi: 'Chuẩn bị lịch · kết nối nhóm · trải nghiệm ngắn',
        activitiesEn: 'Calendar prep · group connection · short stays'
      }
    };

    const pins = houseMap.querySelectorAll('[data-house-pin]');
    const chips = houseMap.querySelectorAll('[data-house-select]');
    const fields = {
      title: houseMap.querySelector('[data-house-field="title"]'),
      status: houseMap.querySelector('[data-house-field="status"]'),
      description: houseMap.querySelector('[data-house-field="description"]'),
      rhythm: houseMap.querySelector('[data-house-field="rhythm"]'),
      activities: houseMap.querySelector('[data-house-field="activities"]')
    };
    const publicNote = houseMap.querySelector('[data-house-field="publicNote"]');

    function langSpan(vi, en) {
      return `<span data-lang="vi">${vi}</span><span data-lang="en">${en}</span>`;
    }

    function selectHouse(id) {
      const next = houseData[id] || houseData['da-lat'];
      pins.forEach(pin => {
        const active = pin.dataset.housePin === id;
        pin.classList.toggle('active', active);
        pin.setAttribute('aria-pressed', active ? 'true' : 'false');
      });
      chips.forEach(chip => {
        const active = chip.dataset.houseSelect === id;
        chip.classList.toggle('active', active);
        chip.setAttribute('aria-pressed', active ? 'true' : 'false');
      });
      if (fields.title) fields.title.textContent = next.title;
      if (fields.status) fields.status.innerHTML = langSpan(next.statusVi, next.statusEn);
      if (fields.description) fields.description.innerHTML = langSpan(next.descriptionVi, next.descriptionEn);
      if (fields.rhythm) fields.rhythm.innerHTML = langSpan(next.rhythmVi, next.rhythmEn);
      if (fields.activities) fields.activities.innerHTML = langSpan(next.activitiesVi, next.activitiesEn);
      if (publicNote) {
        publicNote.innerHTML = langSpan('Không hiển thị điều khoản gated.', 'Gated terms are not shown here.');
      }
    }

    pins.forEach(pin => {
      pin.addEventListener('click', () => selectHouse(pin.dataset.housePin));
      pin.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          selectHouse(pin.dataset.housePin);
        }
      });
    });
    chips.forEach(chip => {
      chip.addEventListener('click', () => selectHouse(chip.dataset.houseSelect));
    });
  }

  /* ---- Public registration form -> API ---- */
  const newsletterForm = document.querySelector('[data-newsletter-form]');
  if (newsletterForm) {
    const statusEl = newsletterForm.querySelector('[data-form-status]');
    const submitBtn = newsletterForm.querySelector('button[type="submit"]');
    const endpoint = newsletterForm.dataset.newsletterEndpoint || 'https://api.nhachung.org/api/newsletter';

    function formLang() {
      return document.documentElement.getAttribute('lang') === 'en' ? 'en' : 'vi';
    }

    function setFormStatus(kind, vi, en) {
      if (!statusEl) return;
      statusEl.dataset.state = kind;
      statusEl.textContent = formLang() === 'en' ? en : vi;
    }

    newsletterForm.addEventListener('submit', async (event) => {
      if (!window.fetch) return;
      event.preventDefault();

      const formData = new FormData(newsletterForm);
      const payload = Object.fromEntries(formData.entries());
      payload.locale = formLang();
      payload.source_url = window.location.href;

      if (submitBtn) submitBtn.disabled = true;
      setFormStatus('loading', 'Đang gửi thông tin...', 'Sending your details...');

      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-request-id': `public-signup-${Date.now()}`
          },
          body: JSON.stringify(payload)
        });
        const result = await response.json().catch(() => null);
        if (!response.ok || !result || result.ok !== true) {
          throw new Error(result && result.message ? result.message : 'submit_failed');
        }
        setFormStatus(
          'success',
          'Đã nhận thông tin. Bạn có thể tiếp tục vào app để hoàn tất bước tiếp theo.',
          'Details received. You can continue to the app for the next step.'
        );
        setTimeout(() => {
          window.location.href = result.data && result.data.next_url ? result.data.next_url : newsletterForm.action;
        }, 650);
      } catch (error) {
        setFormStatus(
          'error',
          'Chưa gửi được qua API. Bạn vẫn có thể tiếp tục vào app.',
          'The API submission did not complete. You can still continue to the app.'
        );
        setTimeout(() => {
          newsletterForm.submit();
        }, 900);
      } finally {
        if (submitBtn) submitBtn.disabled = false;
      }
    });
  }

})();
