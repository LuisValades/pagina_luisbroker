/* =========================================
   LUIS VALADÉS · BRÓKER HIPOTECARIO
   script.js — interacciones y animaciones
   ========================================= */

(function () {
  'use strict';

  // ---------- helpers ----------
  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const fmtMXN = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0
  });

  // ---------- año en footer ----------
  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // ---------- navbar scroll state ----------
  const navbar = $('#navbar');
  const onScroll = () => {
    if (!navbar) return;
    navbar.classList.toggle('scrolled', window.scrollY > 30);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // ---------- menú móvil ----------
  const navToggle = $('#navToggle');
  const navMenu   = $('#navMenu');
  if (navToggle && navMenu) {
    navToggle.addEventListener('click', () => {
      navMenu.classList.toggle('open');
      const icon = navToggle.querySelector('i');
      if (icon) icon.className = navMenu.classList.contains('open') ? 'fas fa-xmark' : 'fas fa-bars';
    });
    $$('#navMenu a').forEach(a => a.addEventListener('click', () => {
      navMenu.classList.remove('open');
      const icon = navToggle.querySelector('i');
      if (icon) icon.className = 'fas fa-bars';
    }));
  }

  // ---------- Intersection Observer: reveal ----------
  const revealEls = $$('.reveal');
  if ('IntersectionObserver' in window && revealEls.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('is-visible'));
  }

  // ---------- contadores animados ----------
  const counters = $$('.stat-number');
  const runCounter = (el) => {
    const target = parseFloat(el.dataset.target || '0');
    const suffix = el.dataset.suffix || '';
    const duration = 1800;
    const start = performance.now();
    el.classList.add('counting');

    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      const current = Math.floor(eased * target);
      el.textContent = current.toLocaleString('es-MX') + suffix;
      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        el.textContent = target.toLocaleString('es-MX') + suffix;
        el.classList.remove('counting');
      }
    };
    requestAnimationFrame(tick);
  };

  if ('IntersectionObserver' in window && counters.length) {
    const cio = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          runCounter(entry.target);
          cio.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });
    counters.forEach(el => cio.observe(el));
  } else {
    counters.forEach(runCounter);
  }

  // ---------- calculadora hipotecaria ----------
  const calcEls = {
    valor:    $('#valor-inmo'),
    eng:      $('#enganche-porc'),
    tasa:     $('#tasa-anual'),
    plazo:    $('#plazo-anos'),
    monto:    $('#monto-credito'),
    hipoteca: $('#pago-hipoteca'),
    seguros:  $('#seguros-comisiones'),
    mensual:  $('#pago-mensual'),
    total:    $('#total-pagado')
  };

  const SEGURO_POR_MILLON = 2000; // MXN mensuales por cada 1,000,000 de crédito

  // Formateo con comas para el input de valor inmueble
  if (calcEls.valor) {
    calcEls.valor.addEventListener('input', () => {
      const raw = calcEls.valor.value.replace(/[^\d]/g, '');
      const num = parseInt(raw, 10);
      calcEls.valor.value = raw ? num.toLocaleString('es-MX') : '';
    });
  }

  const calcular = () => {
    if (!calcEls.valor) return;
    const valor = Math.max(0, parseFloat(calcEls.valor.value.replace(/,/g, '')) || 0);
    const engPorc = Math.min(100, Math.max(0, parseFloat(calcEls.eng.value) || 0));
    const tasaAnual = Math.max(0, parseFloat(calcEls.tasa.value) || 0);
    const plazoAnos = parseInt(calcEls.plazo.value, 10) || 15;

    const monto = valor * (1 - engPorc / 100);
    const n = plazoAnos * 12;
    const i = (tasaAnual / 100) / 12;

    let pagoHipoteca;
    if (i === 0) {
      pagoHipoteca = n > 0 ? monto / n : 0;
    } else {
      pagoHipoteca = monto * (i * Math.pow(1 + i, n)) / (Math.pow(1 + i, n) - 1);
    }
    if (!isFinite(pagoHipoteca) || pagoHipoteca < 0) pagoHipoteca = 0;

    const segurosComisiones = (monto / 1_000_000) * SEGURO_POR_MILLON;
    const pagoMensual = pagoHipoteca + segurosComisiones;
    const totalPagado = pagoMensual * n;

    calcEls.monto.textContent    = fmtMXN.format(monto);
    if (calcEls.hipoteca) calcEls.hipoteca.textContent = fmtMXN.format(pagoHipoteca);
    if (calcEls.seguros)  calcEls.seguros.textContent  = fmtMXN.format(segurosComisiones);
    calcEls.mensual.textContent  = fmtMXN.format(pagoMensual);
    calcEls.total.textContent    = fmtMXN.format(totalPagado);

    // Guarda los últimos valores para el PDF
    calcEls.valor._lastCalc = { valor, engPorc, tasaAnual, plazoAnos, monto, pagoHipoteca, segurosComisiones, pagoMensual, totalPagado };
  };

  ['valor', 'eng', 'tasa', 'plazo'].forEach(k => {
    if (calcEls[k]) calcEls[k].addEventListener('input', calcular);
  });
  calcular();

  // ---------- descarga PDF cotización ----------
  const btnPdf = $('#btn-descargar-pdf');
  if (btnPdf) {
    btnPdf.addEventListener('click', () => {
      const d = calcEls.valor._lastCalc;
      if (!d) return;
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({ unit: 'mm', format: 'a4' });
      const azul = [10, 31, 61];
      const dorado = [212, 175, 55];
      const gris = [248, 249, 252];

      // Encabezado
      doc.setFillColor(...azul);
      doc.rect(0, 0, 210, 32, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('Luis Valadés · Bróker Hipotecario', 14, 14);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Certificado AHMEX · Respaldado por Creditaria', 14, 21);
      doc.text('Tel: +52 55 6887 9806', 14, 27);

      // Título
      doc.setTextColor(...azul);
      doc.setFontSize(15);
      doc.setFont('helvetica', 'bold');
      doc.text('Cotización Hipotecaria Estimada', 14, 44);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(120, 120, 120);
      doc.text(`Generada el ${new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })}`, 14, 50);

      // Parámetros de entrada
      doc.setFillColor(...gris);
      doc.roundedRect(14, 55, 182, 34, 3, 3, 'F');
      doc.setTextColor(...azul);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Datos ingresados', 20, 63);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      const fmt = v => fmtMXN.format(v);
      doc.text(`Valor del inmueble:  ${fmt(d.valor)}`, 20, 70);
      doc.text(`Enganche:  ${d.engPorc}%  (${fmt(d.valor * d.engPorc / 100)})`, 20, 76);
      doc.text(`Tasa anual:  ${d.tasaAnual}%`, 110, 70);
      doc.text(`Plazo:  ${d.plazoAnos} años`, 110, 76);

      // Resultados
      const rows = [
        ['Monto del crédito',              fmt(d.monto)],
        ['Pago hipoteca (capital + interés)', fmt(d.pagoHipoteca)],
        ['Seguros y comisiones estimados', fmt(d.segurosComisiones)],
        ['PAGO MENSUAL ESTIMADO',          fmt(d.pagoMensual)],
        ['Total pagado al final del plazo', fmt(d.totalPagado)],
      ];

      let y = 98;
      rows.forEach(([label, valor], i) => {
        const esDestacado = i === 3;
        if (esDestacado) {
          doc.setFillColor(...dorado);
          doc.roundedRect(14, y - 5, 182, 14, 2, 2, 'F');
          doc.setTextColor(10, 31, 61);
          doc.setFont('helvetica', 'bold');
        } else {
          doc.setFillColor(i % 2 === 0 ? 255 : 248, i % 2 === 0 ? 255 : 249, i % 2 === 0 ? 255 : 252);
          doc.roundedRect(14, y - 5, 182, 12, 2, 2, 'F');
          doc.setTextColor(60, 60, 60);
          doc.setFont('helvetica', 'normal');
        }
        doc.setFontSize(esDestacado ? 11 : 9.5);
        doc.text(label, 20, y + 2);
        doc.setFont('helvetica', 'bold');
        doc.text(valor, 196 - doc.getTextWidth(valor), y + 2);
        y += esDestacado ? 16 : 14;
      });

      // Disclaimer
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.setFont('helvetica', 'italic');
      doc.text('* Cálculo estimado con fines informativos. Las condiciones reales están sujetas a aprobación de crédito.', 14, y + 8);
      doc.text('  Tasas, seguros y comisiones pueden variar según la institución financiera.', 14, y + 13);

      // Pie
      doc.setFillColor(...azul);
      doc.rect(0, 282, 210, 15, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('luisvaladesbroker.com  ·  wa.me/5215568879806', 105, 291, { align: 'center' });

      doc.save('Cotizacion-Hipotecaria-LuisValades.pdf');
    });
  }

  // ---------- formulario de contacto ----------
  const form = $('#contactForm');
  const exito = $('#exito-mensaje');

  const setError = (field, hasError) => {
    field.classList.toggle('input-error', hasError);
  };

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      let valid = true;

      const nombre   = form.querySelector('input[name="nombre"]');
      const telefono = form.querySelector('input[name="telefono"]');
      const email    = form.querySelector('input[name="email"]');
      const tipo     = form.querySelector('select[name="tipo-credito"]');
      const mensaje  = form.querySelector('textarea[name="mensaje"]');

      if (!nombre.value.trim()) { setError(nombre, true); valid = false; } else setError(nombre, false);

      const telOk = /^[0-9]{10,12}$/.test(telefono.value.trim());
      setError(telefono, !telOk); if (!telOk) valid = false;

      const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim());
      setError(email, !emailOk); if (!emailOk) valid = false;

      if (!tipo.value) { setError(tipo, true); valid = false; } else setError(tipo, false);
      if (!mensaje.value.trim()) { setError(mensaje, true); valid = false; } else setError(mensaje, false);

      if (!valid) return;

      if (exito) {
        exito.classList.add('show');
        setTimeout(() => exito.classList.remove('show'), 6000);
      }
      form.reset();
    });

    form.querySelectorAll('input, select, textarea').forEach(el => {
      el.addEventListener('input', () => setError(el, false));
      el.addEventListener('change', () => setError(el, false));
    });
  }

  // ---------- smooth scroll offset para navbar sticky ----------
  $$('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (id.length <= 1) return;
      const target = $(id);
      if (!target) return;
      e.preventDefault();
      const navH = navbar ? navbar.offsetHeight : 0;
      const top = target.getBoundingClientRect().top + window.scrollY - navH + 1;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });

})();
