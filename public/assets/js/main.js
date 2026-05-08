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

})();
