/* ============================================================
   LUIS VALADÉS · V3 · Davincci · script desde cero
   ============================================================ */

(function () {
  'use strict';

  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const fmtMXN = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 });
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- footer year ---------- */
  const yr = $('#year');
  if (yr) yr.textContent = new Date().getFullYear();

  /* ---------- nav scroll state + barra de progreso de lectura ---------- */
  const nav = $('#nav');
  let progress = null;
  if (nav) {
    progress = document.createElement('span');
    progress.className = 'nav__progress';
    progress.setAttribute('aria-hidden', 'true');
    nav.appendChild(progress);
  }
  const onScroll = () => {
    if (nav) nav.classList.toggle('is-scrolled', window.scrollY > 30);
    if (progress) {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.transform = 'scaleX(' + (max > 0 ? Math.min(window.scrollY / max, 1) : 0) + ')';
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- scroll-spy: resalta el link de la sección activa ---------- */
  (function () {
    const links = $$('#navMenu a[href^="#"]');
    if (!links.length || !('IntersectionObserver' in window)) return;
    const map = new Map();
    links.forEach(a => { const t = $(a.getAttribute('href')); if (t) map.set(t, a); });
    if (!map.size) return;
    const spy = new IntersectionObserver((entries) => {
      entries.forEach(en => {
        if (en.isIntersecting) {
          links.forEach(l => l.classList.remove('is-active'));
          const a = map.get(en.target);
          if (a) a.classList.add('is-active');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
    map.forEach((a, t) => spy.observe(t));
    // estado activo inicial (antes el nav arrancaba vacio hasta scrollear)
    if (window.scrollY < 300) links[0].classList.add('is-active');
  })();

  /* ---------- mobile menu toggle ---------- */
  const toggle = $('#navToggle');
  const menu = $('#navMenu');
  if (toggle && menu) {
    toggle.addEventListener('click', () => {
      const isOpen = menu.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
    $$('a', menu).forEach(a => a.addEventListener('click', () => {
      menu.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    }));
  }

  /* ---------- smooth scroll con offset del nav ---------- */
  $$('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (id.length <= 1) return;
      const t = $(id);
      if (!t) return;
      e.preventDefault();
      const offset = (nav ? nav.offsetHeight : 0) + 8;
      window.scrollTo({ top: t.getBoundingClientRect().top + window.scrollY - offset, behavior: 'smooth' });
    });
  });

  /* ============================================================
     CALCULADORA HIPOTECARIA
     ============================================================ */
  const sim = {
    vivienda: $('#simVivienda'), monto: $('#simMonto'),
    viviendaVal: $('#simViviendaVal'), montoVal: $('#simMontoVal'),
    ltv: $('#simLtv'), total: $('#simTotal'), capital: $('#simCapital'),
    vida: $('#simVida'), danos: $('#simDanos'), cat: $('#simCat'),
    enganche: $('#simEnganche'), pills: $$('.sim__pill[data-plazo]'), reset: $('#simReset'),
  };
  if (sim.vivienda) {
    const TASA = 0.105, APERTURA = 0.01, VIDA_M = 440, DANOS_M = 450, LTV_MAX = 0.90;
    const DEF = { vivienda: 2500000, monto: 2000000, plazo: 20 };
    let plazoSim = 20;
    const setFill = (el) => {
      const min = +el.min, max = +el.max, v = +el.value;
      el.style.setProperty('--p', ((v - min) / (max - min) * 100) + '%');
    };
    const pagoSim = (P, n) => {
      const r = TASA / 12;
      const p = P * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
      return (!isFinite(p) || p < 0) ? 0 : p;
    };
    const computeSim = () => {
      const V = +sim.vivienda.value, P = +sim.monto.value;
      setFill(sim.vivienda); setFill(sim.monto);
      sim.viviendaVal.textContent = fmtMXN.format(V);
      sim.montoVal.textContent = fmtMXN.format(P);
      const ltv = V > 0 ? P / V : 0;
      const over = ltv > LTV_MAX + 1e-9;
      sim.ltv.innerHTML = over
        ? 'El financiamiento m&aacute;ximo es 90% del valor. <strong>Baja el monto.</strong>'
        : 'Financiamiento: <strong>' + Math.round(ltv * 100) + '%</strong> del valor de la vivienda';
      sim.ltv.classList.toggle('is-over', over);
      if (over) { sim.ltv.classList.remove('is-shake'); void sim.ltv.offsetWidth; sim.ltv.classList.add('is-shake'); }
      const n = plazoSim * 12;
      const M = pagoSim(P, n);
      const vida = (P / 1e6) * VIDA_M;
      const danos = (V / 1e6) * DANOS_M;
      const total = M + vida + danos;
      const enganche = Math.max(0, V - P);
      const segAnual = (vida + danos) * 12;
      const aperturaPro = (APERTURA * P) / plazoSim;
      const cat = P > 0 ? (TASA * 100) + (segAnual / P * 100) + (aperturaPro / P * 100) : 0;
      sim.capital.textContent = fmtMXN.format(M);
      sim.vida.textContent = fmtMXN.format(vida);
      sim.danos.textContent = fmtMXN.format(danos);
      sim.total.textContent = fmtMXN.format(total);
      sim.enganche.textContent = fmtMXN.format(enganche);
      sim.cat.textContent = cat.toFixed(2) + '%';
    };
    [sim.vivienda, sim.monto].forEach(el => el.addEventListener('input', computeSim));
    sim.pills.forEach(p => p.addEventListener('click', () => {
      sim.pills.forEach(x => x.classList.remove('is-active'));
      p.classList.add('is-active');
      plazoSim = parseInt(p.dataset.plazo, 10) || 20;
      computeSim();
    }));
    if (sim.reset) sim.reset.addEventListener('click', () => {
      sim.vivienda.value = DEF.vivienda; sim.monto.value = DEF.monto; plazoSim = DEF.plazo;
      sim.pills.forEach(x => x.classList.toggle('is-active', +x.dataset.plazo === DEF.plazo));
      computeSim();
    });
    computeSim();
  }

  /* ============================================================
     FAQ ACCORDION (single open)
     ============================================================ */
  $$('.faq__item').forEach(item => {
    const btn = item.querySelector('.faq__q');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const willOpen = !item.classList.contains('is-open');
      $$('.faq__item.is-open').forEach(other => {
        if (other !== item) {
          other.classList.remove('is-open');
          const ob = other.querySelector('.faq__q');
          if (ob) ob.setAttribute('aria-expanded', 'false');
        }
      });
      item.classList.toggle('is-open', willOpen);
      btn.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
    });
  });

  /* ============================================================
     ANAQUEL TABS · master-detail switcher
     ============================================================ */
  $$('.anaquel').forEach(anaquel => {
    const tabs = $$('.anaquel__tab', anaquel);
    const panels = $$('.apan', anaquel);
    if (!tabs.length || !panels.length) return;

    const showPanel = (targetId) => {
      panels.forEach(p => {
        const isTarget = p.id === targetId;
        if (isTarget) {
          p.hidden = false;
          p.classList.add('is-active');
          if (window.gsap && !reducedMotion) {
            gsap.fromTo(p,
              { autoAlpha: 0, y: 18 },
              { autoAlpha: 1, y: 0, duration: .55, ease: 'power3.out',
                onStart: () => p.removeAttribute('hidden') }
            );
            const items = p.querySelectorAll('.apan__stat, .apan__checks li');
            if (items.length) {
              gsap.fromTo(items,
                { autoAlpha: 0, y: 12 },
                { autoAlpha: 1, y: 0, duration: .4, stagger: .05, ease: 'power2.out', delay: .15 }
              );
            }
          }
        } else {
          p.classList.remove('is-active');
          p.hidden = true;
        }
      });
    };

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const target = tab.dataset.target;
        if (!target) return;
        if (tab.classList.contains('is-active')) {
          // en acordeón (mobile) un segundo tap cierra
          if (anaquel.classList.contains('is-accordion')) {
            tab.classList.remove('is-active');
            tab.setAttribute('aria-selected', 'false');
            const a = tab.querySelector('.anaquel__tab-arrow');
            if (a) a.classList.remove('is-rot');
            panels.forEach(p => { if (p.id === target) { p.hidden = true; p.classList.remove('is-active'); } });
          }
          return;
        }

        tabs.forEach(t => {
          t.classList.remove('is-active');
          t.setAttribute('aria-selected', 'false');
          const arrow = t.querySelector('.anaquel__tab-arrow');
          if (arrow) arrow.classList.remove('is-rot');
        });
        tab.classList.add('is-active');
        tab.setAttribute('aria-selected', 'true');
        const arrow = tab.querySelector('.anaquel__tab-arrow');
        if (arrow) arrow.classList.add('is-rot');
        showPanel(target);
      });
      tab.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          tab.click();
        }
      });
    });
  });

  /* ---------- Anaquel · acordeón en mobile (≤1000px) ----------
     Reubica cada panel .apan justo debajo de su tab para que el
     click existente actúe como acordeón. En desktop vuelve a .anaquel__right. */
  (function () {
    const mq = window.matchMedia('(max-width: 1000px)');
    const groups = $$('.anaquel').map(a => ({
      a,
      right: $('.anaquel__right', a),
      tabs:  $$('.anaquel__tab', a),
    })).filter(g => g.right && g.tabs.length);
    if (!groups.length) return;

    const setTab = (tab, panel, on) => {
      tab.classList.toggle('is-active', on);
      tab.setAttribute('aria-selected', on ? 'true' : 'false');
      const ar = tab.querySelector('.anaquel__tab-arrow');
      if (ar) ar.classList.toggle('is-rot', on);
      if (panel) { panel.hidden = !on; panel.classList.toggle('is-active', on); }
    };

    const toMobile = () => groups.forEach(({ a, tabs }) => {
      a.classList.add('is-accordion');
      tabs.forEach(tab => {
        const panel = tab.dataset.target && document.getElementById(tab.dataset.target);
        if (panel && tab.nextElementSibling !== panel) {
          tab.insertAdjacentElement('afterend', panel);
          panel.classList.add('apan--accordion');
        }
        setTab(tab, panel, false); // arranca colapsado
      });
    });
    const toDesktop = () => groups.forEach(({ a, right, tabs }) => {
      a.classList.remove('is-accordion');
      tabs.forEach((tab, i) => {
        const panel = tab.dataset.target && document.getElementById(tab.dataset.target);
        if (panel) { panel.classList.remove('apan--accordion'); right.appendChild(panel); }
        setTab(tab, panel, i === 0); // master-detail: primero abierto
      });
    });
    const apply = () => (mq.matches ? toMobile() : toDesktop());
    apply();
    if (mq.addEventListener) mq.addEventListener('change', apply);
    else if (mq.addListener) mq.addListener(apply);
  })();

  /* ============================================================
     MAGNETIC BUTTONS (efecto imán)
     ============================================================ */
  if (window.gsap && !reducedMotion) {
    $$('.magnetic').forEach(btn => {
      const strength = 0.22;
      btn.addEventListener('mousemove', (e) => {
        const r = btn.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * strength;
        const y = (e.clientY - r.top - r.height / 2) * strength;
        gsap.to(btn, { x, y, duration: .4, ease: 'power3.out', overwrite: 'auto' });
      });
      btn.addEventListener('mouseleave', () => {
        gsap.to(btn, { x: 0, y: 0, duration: .6, ease: 'elastic.out(1, 0.4)' });
      });
    });
  }

  /* ============================================================
     COUNTERS (data-count en .metric__num)
     ============================================================ */
  const animateCount = (el) => {
    const target = parseFloat(el.dataset.count || '0');
    const suffix = el.dataset.suffix || '';
    const duration = 1800;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      const current = Math.floor(eased * target);
      el.textContent = current.toLocaleString('es-MX') + suffix;
      if (p < 1) requestAnimationFrame(tick);
      else el.textContent = target.toLocaleString('es-MX') + suffix;
    };
    requestAnimationFrame(tick);
  };

  /* ============================================================
     GSAP SCROLLTRIGGER · reveals
     ============================================================ */
  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);

    if (!reducedMotion) {
      // Hero copy stagger
      const heroCopy = $('.hero__copy');
      if (heroCopy) {
        const tl = gsap.timeline({ delay: .15 });
        tl.from('.hero .eyebrow',  { y: 20, autoAlpha: 0, duration: .8, ease: 'power3.out' })
          .from('.hero__title',    { y: 40, autoAlpha: 0, duration: 1.1, ease: 'power3.out' }, '-=.5')
          .from('.hero__sub',      { y: 20, autoAlpha: 0, duration: .8, ease: 'power3.out' }, '-=.7')
          .from('.hero__cta > *',  { y: 20, autoAlpha: 0, duration: .6, stagger: .1, ease: 'power3.out' }, '-=.4')
          .from('.hero__trust li', { y: 12, autoAlpha: 0, duration: .5, stagger: .08, ease: 'power2.out' }, '-=.3')
          .from('.hero__badges img', { y: 12, autoAlpha: 0, duration: .5, stagger: .1, ease: 'power2.out' }, '-=.2');
      }

      // Hero photo parallax + caption fade
      const heroPhoto = $('.hero__photo');
      if (heroPhoto) {
        gsap.from(heroPhoto.querySelector('img'), { scale: 1.08, autoAlpha: 0, duration: 1.4, ease: 'power3.out', delay: .1 });
        const cap = heroPhoto.querySelector('.hero__photo-caption');
        if (cap) gsap.from(cap, { y: 20, autoAlpha: 0, duration: .9, ease: 'power3.out', delay: .8 });
        const frame = heroPhoto.querySelector('.hero__photo-frame');
        if (frame) gsap.from(frame, { autoAlpha: 0, duration: 1.2, ease: 'power2.out', delay: 1 });
        // Subtle parallax
        gsap.to(heroPhoto.querySelector('img'), {
          yPercent: -8,
          scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1.2 }
        });
      }

      // Section heads
      gsap.utils.toArray('.section-head').forEach(head => {
        gsap.fromTo(head,
          { y: 40, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: 1, ease: 'power3.out',
            scrollTrigger: { trigger: head, start: 'top 88%', once: true } }
        );
      });

      // Métricas con counters
      $$('.metric').forEach((el, i) => {
        gsap.fromTo(el,
          { y: 50, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: .9, ease: 'power3.out', delay: i * .12,
            scrollTrigger: { trigger: '.metrics__grid', start: 'top 80%', once: true,
              onEnter: () => {
                const num = el.querySelector('.metric__num');
                if (num) animateCount(num);
              }
            }
          }
        );
      });

      // Feature cards
      gsap.utils.toArray('.feature-card').forEach((card, i) => {
        gsap.fromTo(card,
          { y: 60, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: .9, ease: 'power3.out', delay: i * .12,
            scrollTrigger: { trigger: '.features__grid', start: 'top 85%', once: true } }
        );
        const icon = card.querySelector('.feature-card__icon');
        if (icon) {
          gsap.fromTo(icon,
            { scale: .5, rotate: -25, autoAlpha: 0 },
            { scale: 1, rotate: 0, autoAlpha: 1, duration: .8, ease: 'back.out(1.7)', delay: i * .12 + .15,
              scrollTrigger: { trigger: '.features__grid', start: 'top 85%', once: true } }
          );
        }
      });

      // Anaqueles
      gsap.utils.toArray('.anaquel').forEach((card) => {
        gsap.fromTo(card.querySelector('.anaquel__shell'),
          { y: 80, autoAlpha: 0, scale: .96 },
          { y: 0, autoAlpha: 1, scale: 1, duration: 1.2, ease: 'power3.out',
            scrollTrigger: { trigger: card, start: 'top 85%', once: true } }
        );
        const tabs = card.querySelectorAll('.anaquel__tab');
        if (tabs.length) {
          gsap.fromTo(tabs,
            { x: -30, autoAlpha: 0 },
            { x: 0, autoAlpha: 1, duration: .6, stagger: .08, ease: 'power2.out',
              scrollTrigger: { trigger: card, start: 'top 75%', once: true } }
          );
        }
        const stats = card.querySelectorAll('.anaquel__statCell');
        if (stats.length) {
          gsap.fromTo(stats,
            { y: 20, autoAlpha: 0 },
            { y: 0, autoAlpha: 1, duration: .55, stagger: .1, ease: 'back.out(1.5)',
              scrollTrigger: { trigger: card, start: 'top 70%', once: true } }
          );
        }
      });

      // Timeline zigzag steps
      gsap.utils.toArray('.timeline__step').forEach((step, i) => {
        const isEven = (i + 1) % 2 === 0;
        gsap.fromTo(step,
          { x: isEven ? 50 : -50, autoAlpha: 0 },
          { x: 0, autoAlpha: 1, duration: .8, ease: 'power3.out',
            scrollTrigger: { trigger: step, start: 'top 88%', once: true } }
        );
      });
      const tlCta = $('.timeline__cta');
      if (tlCta) {
        gsap.fromTo(tlCta,
          { y: 20, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: .8, ease: 'power3.out',
            scrollTrigger: { trigger: tlCta, start: 'top 92%', once: true } }
        );
      }

      // Calc panel
      const calcPanel = $('.sim');
      if (calcPanel) {
        gsap.fromTo(calcPanel,
          { y: 60, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: 1, ease: 'power3.out',
            scrollTrigger: { trigger: '.calc', start: 'top 75%', once: true } }
        );
      }

      // Bio
      const bioPhoto = $('.bio__photo');
      const bioText = $('.bio__text');
      if (bioPhoto) gsap.fromTo(bioPhoto, { x: -40, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: '.bio', start: 'top 75%', once: true } });
      if (bioText) gsap.fromTo(bioText, { x: 40, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: '.bio', start: 'top 75%', once: true } });
      gsap.fromTo('.bio__pillars > div', { y: 20, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .55, stagger: .1, ease: 'power2.out', scrollTrigger: { trigger: '.bio__pillars', start: 'top 85%', once: true } });

      // Quotes
      gsap.utils.toArray('.quote').forEach((q, i) => {
        gsap.fromTo(q,
          { y: 40, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: .8, ease: 'power3.out', delay: i * .12,
            scrollTrigger: { trigger: '.testimonios__grid', start: 'top 80%', once: true } }
        );
      });

      // FAQ items
      gsap.fromTo('.faq__item',
        { y: 30, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: .65, stagger: .08, ease: 'power3.out',
          scrollTrigger: { trigger: '.faq__list', start: 'top 85%', once: true } }
      );

      // CTA final
      const ctaFinal = $('.cta-final');
      if (ctaFinal) {
        gsap.fromTo(ctaFinal.querySelectorAll('h2, p, .btn, .eyebrow'),
          { y: 30, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: .8, stagger: .12, ease: 'power3.out',
            scrollTrigger: { trigger: ctaFinal, start: 'top 80%', once: true } }
        );
      }
    } else {
      // Sin animaciones · counters instantáneos
      $$('.metric__num').forEach(el => {
        const t = parseFloat(el.dataset.count || '0');
        const s = el.dataset.suffix || '';
        el.textContent = t.toLocaleString('es-MX') + s;
      });
    }
  } else {
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(es => es.forEach(e => {
        if (e.isIntersecting) { animateCount(e.target); io.unobserve(e.target); }
      }), { threshold: .4 });
      $$('.metric__num').forEach(el => io.observe(el));
    }
  }

})();
