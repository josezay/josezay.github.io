/* COVEN 1692 — interações do site conceitual */
(() => {
  'use strict';
  const C = window.COVEN;
  if (!C) return;

  const F = C.fragrancias;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const pad = n => String(n).padStart(2, '0');
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const trunc = (s, n) => (s.length > n ? s.slice(0, n - 1).replace(/[\s,;.]+\S*$/, '') + '…' : s);
  const wa = msg => 'https://wa.me/5511913213269?text=' + encodeURIComponent(msg);
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* sem armazenamento */ } },
  };

  /* ------------------------------------------------------------ contagens */
  const isMatch = (f, k) => k === 'all' || (k === 'vamp' ? f.colab === 'Rede Vamp' : f.tipo === k);
  const counts = {};
  ['all', 'criacao', 'releitura', 'vamp'].forEach(k => { counts[k] = F.filter(f => isMatch(f, k)).length; });
  $$('[data-count]').forEach(el => { el.textContent = counts[el.dataset.count]; });

  /* ------------------------------------------------------------ herói */
  const HERO = ['lilith', 'kirin', 'matinta', 'stregheria', 'santa-muerte', 'draconis-fabula', 'cotton-candy',
    'black-magic', 'tenebris', 'fireflies', 'rhiannon', 'kraken', 'dorian-gray', 'midsommar', 'moonflower'];
  const hero = $('.hero');
  const hobj = $('.hero-obj');
  const himg = $('.hero-img');
  const heroSlug = HERO[Math.floor(Math.random() * HERO.length)];
  const heroF = F.find(f => f.slug === heroSlug) || F[0];
  himg.src = heroF.img;
  himg.alt = `Frasco do perfume ${heroF.nome}`;
  hobj.setAttribute('aria-label', `Conhecer o perfume ${heroF.nome}`);
  $('.hero-n').textContent = `Nº ${pad(heroF.n)} / ${F.length}`;
  $('.hero-name').textContent = heroF.nome + (heroF.sub ? ' — ' + heroF.sub : '');
  $('.hero-frase').textContent = heroF.frase;
  hobj.addEventListener('click', () => openFrag(heroF.slug));

  // a vela: uma luz que percorre a capa inteira, segue o cursor (ou o dedo) e vagueia quando parado
  if (reduce) {
    hero.classList.add('is-lit');
  } else {
    let tx = 50, ty = 46, cx = 50, cy = 46, raf = null, lastMove = -1e9;
    const t0 = performance.now();
    hero.addEventListener('pointermove', e => {
      const r = hero.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width) * 100;
      ty = ((e.clientY - r.top) / r.height) * 100;
      lastMove = performance.now();
    });
    const loop = now => {
      const t = (now - t0) / 1000;
      if (now - lastMove > 3500) {
        tx = 50 + Math.sin(t * 0.37) * 32;
        ty = 52 + Math.sin(t * 0.53 + 1.2) * 26;
      }
      cx += (tx - cx) * 0.07;
      cy += (ty - cy) * 0.07;
      // chama: o raio oscila de leve, como uma vela
      const flick = 1 + Math.sin(t * 9.3) * 0.018 + Math.sin(t * 23.1 + 2) * 0.012 + Math.sin(t * 3.7) * 0.02;
      hero.style.setProperty('--x', cx.toFixed(2) + '%');
      hero.style.setProperty('--y', cy.toFixed(2) + '%');
      hero.style.setProperty('--r', (30 * flick).toFixed(2) + 'vmax');
      raf = requestAnimationFrame(loop);
    };
    new IntersectionObserver(([en]) => {
      if (en.isIntersecting && !raf) raf = requestAnimationFrame(loop);
      if (!en.isIntersecting && raf) { cancelAnimationFrame(raf); raf = null; }
    }).observe(hero);
  }

  /* ------------------------------------------------------------ índice + galeria */
  const idx = $('#idx');
  const grid = $('#grid');
  const tipoCurto = f => (f.tipo === 'criacao' ? 'Criação' : 'Releitura');

  idx.innerHTML = F.map(f => `<li><button class="nm${f.esgotado ? ' is-out' : ''}" type="button" data-slug="${f.slug}"` +
    ` aria-label="${esc(f.nome)}${f.esgotado ? ', esgotado' : ''}"><span class="nm-t">${esc(f.nome)}</span><sup aria-hidden="true">${pad(f.n)}</sup>` +
    `${f.n < F.length ? '<span class="sep" aria-hidden="true">/</span>' : ''}</button></li>`).join(' ');

  grid.innerHTML = F.map(f => `<li data-slug="${f.slug}"><button class="card" type="button" data-slug="${f.slug}">` +
    `<span class="card-img"><img src="${f.thumb}" alt="" loading="lazy" decoding="async"></span>` +
    `<span class="card-n">Nº ${pad(f.n)}${f.esgotado ? ' · Esgotado' : ''}${f.colab ? ' · ' + esc(f.colab) : ''}</span>` +
    `<span class="card-t">${esc(f.nome)}</span>` +
    `<span class="card-m">${tipoCurto(f)} · ${f.volume} · ${f.preco}</span></button></li>`).join('');

  const nmBySlug = Object.fromEntries($$('.nm', idx).map(b => [b.dataset.slug, b]));
  const liBySlug = Object.fromEntries($$('li', grid).map(li => [li.dataset.slug, li]));

  $$('.filters button').forEach(b => b.addEventListener('click', () => {
    const k = b.dataset.f;
    $$('.filters button').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    F.forEach(f => {
      const on = isMatch(f, k);
      nmBySlug[f.slug].classList.toggle('is-dim', !on);
      liBySlug[f.slug].hidden = !on;
    });
  }));

  const setView = v => {
    $$('.views button').forEach(x => x.setAttribute('aria-pressed', String(x.dataset.v === v)));
    idx.hidden = v !== 'index';
    grid.hidden = v !== 'grid';
    store.set('coven-view', v);
  };
  $$('.views button').forEach(b => b.addEventListener('click', () => setView(b.dataset.v)));
  if (store.get('coven-view') === 'grid') setView('grid');

  [idx, grid].forEach(el => el.addEventListener('click', e => {
    const b = e.target.closest('button[data-slug]');
    if (b) openFrag(b.dataset.slug);
  }));

  // prévia flutuante: o frasco acompanha o cursor sobre os nomes
  if (finePointer) {
    const peek = $('.peek');
    const pimg = $('img', peek);
    const pcap = $('.peek-cap', peek);
    let px = 0, py = 0, qx = 0, qy = 0, on = false, praf = null, preloaded = false;
    const tick = () => {
      qx += (px - qx) * 0.2;
      qy += (py - qy) * 0.2;
      peek.style.transform = `translate3d(${qx.toFixed(1)}px, ${qy.toFixed(1)}px, 0)`;
      praf = on ? requestAnimationFrame(tick) : null;
    };
    const place = e => {
      const w = peek.offsetWidth || 260;
      const h = peek.offsetHeight || 300;
      px = e.clientX + 28;
      if (px + w > innerWidth - 12) px = e.clientX - w - 28;
      py = Math.min(Math.max(e.clientY - h / 2, 12), innerHeight - h - 12);
    };
    const hide = () => { on = false; peek.classList.remove('is-on'); idx.classList.remove('is-hover'); };
    idx.addEventListener('pointerenter', () => {
      if (preloaded) return;
      preloaded = true;
      F.forEach(f => { const i = new Image(); i.src = f.thumb; });
    });
    idx.addEventListener('pointermove', place);
    idx.addEventListener('pointerover', e => {
      const b = e.target.closest('.nm');
      if (!b) { hide(); return; }
      const f = F[F.findIndex(x => x.slug === b.dataset.slug)];
      if (pimg.getAttribute('src') !== f.thumb) pimg.src = f.thumb;
      pcap.innerHTML = `<b>${esc(f.nome)}</b><br>${tipoCurto(f)} · ${f.volume} · ${f.esgotado ? 'Esgotado' : f.preco}`;
      idx.classList.add('is-hover');
      if (!on) {
        on = true;
        place(e);
        qx = px; qy = py;
        peek.classList.add('is-on');
        if (!praf) praf = requestAnimationFrame(tick);
      }
    });
    idx.addEventListener('pointerleave', hide);
  }

  /* ------------------------------------------------------------ apothecary */
  const chapters = $('#chapters');
  chapters.innerHTML = C.linhas.map((l, li) => {
    const meta = [l.linha, l.formato, l.preco].filter(Boolean).join(' · ');
    const extra = l.id === 'rede-vamp'
      ? `<p class="ch-comp"><span>Saiba mais</span><a href="https://redevampyrica.com/" target="_blank" rel="noopener">redevampyrica.com ↗</a></p>`
      : `<p class="ch-comp"><span>Composição</span>${esc(l.composicao)}</p>`;
    const items = l.itens.map((it, i) => {
      const m = it.texto && it.texto[0] ? `<span class="item-m">${esc(trunc(it.texto[0], 64))}</span>` : (it.preco ? `<span class="item-m">${esc(it.preco)}</span>` : '');
      return `<li><button class="item" type="button" data-line="${li}" data-i="${i}"><span class="item-img">` +
        `<img src="${it.img}" alt="" loading="lazy" decoding="async"></span><span class="item-t">${esc(it.nome)}</span>${m}</button></li>`;
    }).join('');
    const fotos = (l.fotos || []).map(src => `<li class="photo"><img src="${src}" alt="" loading="lazy" decoding="async"></li>`).join('');
    const open = li === 0;
    return `<article class="ch" id="ap-${l.id}">
      <h3 class="ch-h"><button class="ch-head" type="button" aria-expanded="${open}" aria-controls="chb-${l.id}">
        <span class="ch-n">${pad(li + 1)}</span>
        <span class="ch-tw"><span class="ch-t">${esc(l.titulo)}</span><span class="ch-mm">${esc(meta)}</span></span>
        <span class="ch-l">${esc(l.linha)}</span><span class="ch-f">${esc(l.formato)}</span><span class="ch-p">${esc(l.preco)}</span>
        <span class="ch-c">${l.itens.length} ${l.itens.length === 1 ? 'item' : 'itens'}</span><span class="ch-i" aria-hidden="true"></span>
      </button></h3>
      <div class="ch-body" id="chb-${l.id}"${open ? '' : ' hidden'}>
        <div class="ch-intro"><p class="ch-text">${esc(l.texto)}</p>${extra}</div>
        <ul class="strip" aria-label="${esc(l.titulo)}">${items}${fotos}</ul>
      </div>
    </article>`;
  }).join('');

  chapters.addEventListener('click', e => {
    const head = e.target.closest('.ch-head');
    if (head) {
      const open = head.getAttribute('aria-expanded') !== 'true';
      head.setAttribute('aria-expanded', String(open));
      document.getElementById(head.getAttribute('aria-controls')).hidden = !open;
      return;
    }
    const item = e.target.closest('.item');
    if (item) {
      const l = C.linhas[+item.dataset.line];
      openItem(l.itens, +item.dataset.i, l, true);
    }
  });

  /* ------------------------------------------------------------ fine art + lojas */
  const ARTE = { id: 'arte', titulo: 'Fine Art', linha: 'Dspallanzani Fine Art', formato: 'Diversos tamanhos', preco: 'Sob consulta' };
  $('#arte-strip').innerHTML = C.arte.map((a, i) =>
    `<li><button type="button" data-art="${i}"><img src="${a.img}" alt="${esc(a.nome)}, obra de Dspallanzani" loading="lazy" decoding="async"><span class="k">${esc(a.nome)}</span></button></li>`).join('');
  $('#arte-strip').addEventListener('click', e => {
    const b = e.target.closest('[data-art]');
    if (b) openItem(C.arte, +b.dataset.art, ARTE, false);
  });

  $$('.photo-strip').forEach(ul => {
    const nome = ul.closest('.loja').querySelector('.loja-t').textContent;
    ul.innerHTML = (C[ul.dataset.loja] || []).map((src, i) =>
      `<li><img src="${src}" alt="${esc(nome)}, foto ${i + 1}" loading="lazy" decoding="async"></li>`).join('');
  });

  const BLESSING = { id: 'blessing', titulo: 'Ritual', linha: 'New Orleans Hoodoo', formato: 'Feitiço', preco: '' };
  const blessingItem = [{
    nome: 'Blessing Spell', sub: 'New Orleans Hoodoo', preco: 'R$ 80', img: 'assets/img/ritual/blessing.webp',
    texto: ['Entre pela porta com paz e toda a paz irá com você.',
      'Entre com verdadeira reverência em seu coração e receba suas bênçãos. Deixe seus desejos no altar e todas as coisas serão recompensadas. Use a magia com justificativa e sabedoria. Honre seus ancestrais — eles estão sempre ao seu lado.'],
  }];
  $('[data-blessing]').addEventListener('click', () => openItem(blessingItem, 0, BLESSING, false));

  /* ------------------------------------------------------------ painel */
  const panel = $('#panel');
  const P = {
    img: $('#p-img'), n: $('#p-n'), k: $('#p-k'), title: $('#p-title'), sub: $('#p-sub'),
    frase: $('#p-frase'), desc: $('#p-desc'), spec: $('#p-spec'), wa: $('#p-wa'), ds: $('#p-ds'), fine: $('#p-fine'),
  };
  let ctx = null;
  let lastFocus = null;
  let closeTimer = null;

  const specRows = rows => rows.filter(r => r && r[1])
    .map(([dt, dd, cls]) => `<div><dt>${esc(dt)}</dt><dd${cls ? ` class="${cls}"` : ''}>${esc(dd)}</dd></div>`).join('');

  function setImage(src, alt) {
    if (P.img.getAttribute('src') === src) return;
    P.img.classList.add('is-loading');
    const next = new Image();
    next.onload = next.onerror = () => {
      P.img.src = src;
      P.img.alt = alt;
      requestAnimationFrame(() => P.img.classList.remove('is-loading'));
    };
    next.src = src;
  }

  function renderFrag(f) {
    panel.classList.remove('panel--paper');
    setImage(f.img, `Frasco do perfume ${f.nome}`);
    P.n.textContent = `Nº ${pad(f.n)} / ${F.length}`;
    P.k.textContent = (f.tipo === 'criacao' ? 'Criação Coven 1692' : 'Releitura') + (f.colab ? ` · Coven 1692 & ${f.colab}` : '');
    P.title.textContent = f.nome;
    P.sub.textContent = [f.sub, `${f.formato} · ${f.volume}`].filter(Boolean).join(' — ');
    P.frase.textContent = `“${f.frase}”`;
    P.desc.innerHTML = '';
    const p = f.piramide || {};
    P.spec.innerHTML = specRows([
      f.tipo === 'releitura' && ['Inspiração', f.inspiracao],
      ['Família', f.familia],
      ['Topo', p.topo], ['Coração', p.coracao], ['Fundo', p.fundo],
      ['Notas', f.notas],
      ['Frasco', f.volume],
      ['Valor', f.esgotado ? `${f.preco} — esgotado` : f.preco, 'is-price'],
    ]);
    P.wa.textContent = f.esgotado ? 'Avise-me quando voltar ↗' : 'Reservar pelo WhatsApp ↗';
    P.wa.href = wa(f.esgotado
      ? `Olá, Coven! Quero ser avisada(o) quando o perfume ${f.nome} voltar.`
      : `Olá, Coven! Tenho interesse no perfume ${f.nome} (${f.volume} · ${f.preco}).`);
    P.ds.hidden = false;
    P.ds.href = wa(`Olá, Coven! Quero montar um Discovery Set (6 × 5 ml) incluindo o ${f.nome}.`);
    P.fine.textContent = 'Este frasco é parte do projeto Coven 1692. Álcool de cereais, matéria-prima importada, blends exclusivos e corante cosmético. Vegan & cruelty free. A reposição é contínua, mas respeita sempre o tempo de maceração.';
  }

  function renderItem(it, line, i, total, paper) {
    panel.classList.toggle('panel--paper', !!paper);
    setImage(it.img, it.nome);
    P.n.textContent = `${line.titulo} — ${pad(i + 1)} / ${pad(total)}`;
    P.k.textContent = line.linha || line.titulo;
    P.title.textContent = it.nome;
    P.sub.textContent = it.sub || line.titulo;
    const texto = (it.texto || []).slice();
    const poetic = line.id === 'rede-vamp' || line.id === 'blessing';
    P.frase.textContent = poetic && texto.length ? `“${texto.shift()}”` : '';
    P.desc.innerHTML = texto.map(t => `<p>${esc(t)}</p>`).join('');
    P.spec.innerHTML = specRows([
      ['Formato', it.sub ? '' : line.formato],
      ['Valor', it.preco || line.preco, 'is-price'],
    ]);
    P.wa.textContent = 'Consultar pelo WhatsApp ↗';
    P.wa.href = wa(`Olá, Coven! Tenho interesse em ${line.titulo}: ${it.nome}.`);
    P.ds.hidden = true;
    P.fine.textContent = line.id === 'arte'
      ? 'Obras de Dspallanzani Fine Art. Diversos tamanhos, envio para todo o mundo.'
      : 'Produção artesanal, sob encomenda ou em pequenos lotes limitados. Consulte a disponibilidade ou faça sua reserva.';
  }

  function render() {
    const it = ctx.list[ctx.i];
    if (ctx.type === 'frag') renderFrag(it);
    else renderItem(it, ctx.line, ctx.i, ctx.list.length, ctx.paper);
    $('.p-nav', panel).hidden = ctx.list.length < 2;
    $('.panel-body', panel).scrollTop = 0;
    panel.scrollTop = 0;
  }

  function show() {
    clearTimeout(closeTimer);
    if (panel.hidden) {
      lastFocus = document.activeElement;
      panel.hidden = false;
      document.body.classList.add('is-locked');
      requestAnimationFrame(() => panel.classList.add('is-open'));
      $('[data-close]', panel).focus({ preventScroll: true });
    }
  }

  function hide() {
    if (panel.hidden) return;
    panel.classList.remove('is-open');
    document.body.classList.remove('is-locked');
    closeTimer = setTimeout(() => { panel.hidden = true; }, reduce ? 0 : 400);
    if (location.hash.startsWith('#frasco/')) history.replaceState(null, '', '#fragrancias');
    if (lastFocus && document.contains(lastFocus)) lastFocus.focus({ preventScroll: true });
  }

  function openFrag(slug) {
    const i = F.findIndex(f => f.slug === slug);
    if (i < 0) return;
    ctx = { type: 'frag', list: F, i };
    render();
    show();
    const h = '#frasco/' + slug;
    if (location.hash !== h) history.replaceState(null, '', h);
  }

  function openItem(list, i, line, paper) {
    ctx = { type: 'item', list, i, line, paper };
    render();
    show();
  }

  function step(d) {
    if (!ctx) return;
    ctx.i = (ctx.i + d + ctx.list.length) % ctx.list.length;
    render();
    if (ctx.type === 'frag') history.replaceState(null, '', '#frasco/' + ctx.list[ctx.i].slug);
  }

  $('[data-close]', panel).addEventListener('click', hide);
  $('[data-prev]', panel).addEventListener('click', () => step(-1));
  $('[data-next]', panel).addEventListener('click', () => step(1));

  document.addEventListener('keydown', e => {
    if (panel.hidden) return;
    if (e.key === 'Escape') { e.preventDefault(); hide(); }
    else if (e.key === 'ArrowRight') step(1);
    else if (e.key === 'ArrowLeft') step(-1);
    else if (e.key === 'Tab') {
      const f = $$('a[href]:not([hidden]), button:not([hidden])', panel).filter(el => el.offsetParent !== null);
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  const fromHash = () => {
    const m = location.hash.match(/^#frasco\/([\w-]+)/);
    if (m) openFrag(m[1]);
  };
  window.addEventListener('hashchange', fromHash);
  fromHash();

  /* ------------------------------------------------------------ menu móvel */
  const mbtn = $('.menu-btn');
  const menu = $('#menu');
  const setMenu = open => {
    mbtn.setAttribute('aria-expanded', String(open));
    mbtn.textContent = open ? 'Fechar' : 'Índice';
    menu.hidden = !open;
    document.body.classList.toggle('is-locked', open);
  };
  mbtn.addEventListener('click', () => setMenu(mbtn.getAttribute('aria-expanded') !== 'true'));
  menu.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !menu.hidden) setMenu(false); });

  /* ------------------------------------------------------------ seção atual + revelação */
  if ('IntersectionObserver' in window) {
    const links = $$('.nav a');
    const byId = Object.fromEntries(links.map(a => [a.getAttribute('href').slice(1), a]));
    const sio = new IntersectionObserver(es => es.forEach(en => {
      const a = byId[en.target.id];
      if (a && en.isIntersecting) links.forEach(x => x.setAttribute('aria-current', String(x === a)));
    }), { rootMargin: '-45% 0px -50% 0px' });
    $$('main > section[id]').forEach(s => sio.observe(s));

    if (!reduce) {
      const els = $$('.sec-head, .lead, .manifesto-grid, .quote, .facts, .frag-bar, .discovery, .apo-hero, .ch, ' +
        '.ritual-grid, .ritual-imgs, .blessing, .arte-strip, .loja, .lojas-cta, .rules, .contact, .foot-big');
      els.forEach(el => el.classList.add('rv'));
      const io = new IntersectionObserver(es => es.forEach(en => {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      }), { rootMargin: '0px 0px -6% 0px' });
      els.forEach(el => io.observe(el));
    }
  }
})();
