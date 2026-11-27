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
  const wa = msg => 'https://wa.me/5511913213269?text=' + encodeURIComponent(msg);
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const sEl = $('#busca'); // camada da busca (a lógica fica mais abaixo)

  /* ------------------------------------------------------------ filmes (utilitários) */
  const soundBtns = new Map(); // vídeo -> botão de som
  const tryPlay = v => { const p = v.play(); if (p && p.catch) p.catch(() => {}); };
  function makeVideo(src, poster, cls) {
    const v = document.createElement('video');
    v.className = cls;
    v.muted = true; v.loop = true; v.playsInline = true;
    ['muted', 'loop', 'playsinline'].forEach(a => v.setAttribute(a, ''));
    v.preload = 'metadata';
    if (poster) v.poster = poster;
    v.src = src;
    return v;
  }
  function syncSound(v) {
    const b = soundBtns.get(v);
    if (!b) return;
    b.setAttribute('aria-pressed', String(!v.muted));
    b.textContent = v.muted ? 'Som' : 'Som ligado';
  }
  function toggleSound(v) {
    const on = v.muted;
    if (on) soundBtns.forEach((_, other) => { if (other !== v && !other.muted) { other.muted = true; syncSound(other); } });
    v.muted = !on;
    if (on && v.paused) tryPlay(v);
    syncSound(v);
  }

  /* ------------------------------------------------------------ filtros + contagens */
  // cada perfume fica em um só filtro: Criações, Releituras ou o da sua parceria ("colab" no data.js).
  // Cada parceria (Rede Vamp, Encantaria…) ganha um filtro próprio, criado aqui.
  const grupo = f => (f.colab ? 'colab:' + f.colab : f.tipo);
  const isMatch = (f, k) => k === 'all' || grupo(f) === k;
  const PARCERIAS = [...new Set(F.filter(f => f.colab).map(f => f.colab))];
  const PARC = C.parcerias || {}; // apresentação e site de cada parceiro
  const fragFilters = $('#frag-filters');
  fragFilters.insertAdjacentHTML('beforeend', PARCERIAS.map(c =>
    `<button type="button" data-f="colab:${esc(c)}" aria-pressed="false">${esc(c)} <sup data-count="colab:${esc(c)}"></sup></button>`).join(''));
  const counts = {};
  ['all', 'criacao', 'releitura', ...PARCERIAS.map(c => 'colab:' + c)].forEach(k => { counts[k] = F.filter(f => isMatch(f, k)).length; });
  $$('[data-count]').forEach(el => { el.textContent = counts[el.dataset.count]; });

  /* ------------------------------------------------------------ índice + galeria */
  const idx = $('#idx');
  const grid = $('#grid');
  const tipoCurto = f => f.colab || (f.tipo === 'criacao' ? 'Criação' : 'Releitura');

  idx.innerHTML = F.map(f => `<li><button class="nm${f.esgotado ? ' is-out' : ''}" type="button" data-slug="${f.slug}"` +
    ` aria-label="${esc(f.nome)}${f.esgotado ? ', esgotado' : ''}"><span class="nm-t">${esc(f.nome)}</span><sup aria-hidden="true">${pad(f.n)}</sup>` +
    `${f.n < F.length ? '<span class="sep" aria-hidden="true">/</span>' : ''}</button></li>`).join(' ');

  grid.innerHTML = F.map(f => `<li data-slug="${f.slug}"><button class="card" type="button" data-slug="${f.slug}">` +
    `<span class="card-img"><img src="${f.thumb}" alt="" loading="lazy" decoding="async"></span>` +
    `<span class="card-n">Nº ${pad(f.n)}${f.esgotado ? ' · Esgotado' : ''}${f.video ? ' · ▶ Filme' : ''}</span>` +
    `<span class="card-t">${esc(f.nome)}</span>` +
    `<span class="card-m">${tipoCurto(f)} · ${f.volume} · ${f.preco}</span></button></li>`).join('');

  const nmBySlug = Object.fromEntries($$('.nm', idx).map(b => [b.dataset.slug, b]));
  const liBySlug = Object.fromEntries($$('li', grid).map(li => [li.dataset.slug, li]));

  // filtro de uma parceria: a apresentação dela ("parcerias" no data.js) aparece ao lado dos frascos, fixa enquanto
  // eles rolam (no celular, acima deles); o endereço do site, quando aparece no texto, vira link
  const parcEl = $('#parceria');
  function setParceria(k) {
    const nome = k.startsWith('colab:') ? k.slice(6) : '';
    const p = PARC[nome];
    parcEl.hidden = !p;
    $('#frag-body').classList.toggle('frag-body--parceria', !!p);
    if (!p) return;
    const host = p.site ? p.site.replace(/^https?:\/\/|\/$/g, '') : '';
    const link = t => (host ? esc(t).replace(host, `<a href="${esc(p.site)}" target="_blank" rel="noopener">${host} ↗</a>`) : esc(t));
    parcEl.innerHTML = `<header class="apo-line-head"><h3 class="apo-line-t">${esc(nome)}</h3>${p.linha ? `<p class="k">${esc(p.linha)}</p>` : ''}</header>` +
      `<div class="parceria-text">${(p.texto || []).map(t => `<p>${link(t)}</p>`).join('')}</div>`;
  }

  $$('button', fragFilters).forEach(b => b.addEventListener('click', () => {
    const k = b.dataset.f;
    $$('button', fragFilters).forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    F.forEach(f => {
      const on = isMatch(f, k);
      nmBySlug[f.slug].classList.toggle('is-dim', !on);
      liBySlug[f.slug].hidden = !on;
    });
    setParceria(k);
  }));

  // abre sempre na galeria; o índice só aparece se a pessoa escolher
  const setView = v => {
    $$('.views button').forEach(x => x.setAttribute('aria-pressed', String(x.dataset.v === v)));
    idx.hidden = v !== 'index';
    grid.hidden = v !== 'grid';
  };
  $$('.views button').forEach(b => b.addEventListener('click', () => setView(b.dataset.v)));

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
      pcap.innerHTML = `<b>${esc(f.nome)}</b><br>${tipoCurto(f)} · ${f.volume} · ${f.esgotado ? 'Esgotado' : f.preco}${f.video ? '<br>▶ com filme' : ''}`;
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
  // o mesmo cartão dos perfumes, agrupado por linha; os filtros mostram uma linha só
  const LINHAS = C.linhas.filter(l => !l.oculta); // "oculta": true no data.js tira a linha do site
  const apoFilters = $('#apo-filters');
  const apoLines = $('#apo-lines');
  apoFilters.innerHTML = `<button type="button" data-f="all" aria-pressed="true">Todas <sup>${LINHAS.reduce((n, l) => n + l.itens.length, 0)}</sup></button>` +
    LINHAS.map(l => `<button type="button" data-f="${l.id}" aria-pressed="false">${esc(l.titulo)} <sup>${l.itens.length}</sup></button>`).join('');
  apoLines.innerHTML = LINHAS.map((l, li) => {
    const meta = [l.linha, l.formato, l.preco].filter(Boolean).join(' · ');
    const extra = l.id === 'rede-vamp'
      ? `<p class="apo-comp"><span>Saiba mais</span><a href="https://redevampyrica.com/" target="_blank" rel="noopener">redevampyrica.com ↗</a></p>`
      : (l.composicao ? `<p class="apo-comp"><span>Composição</span>${esc(l.composicao)}</p>` : '');
    const cards = l.itens.map((it, i) => `<li><button class="card" type="button" data-line="${li}" data-i="${i}">` +
      `<span class="card-img"><img src="${it.thumb || it.img}" alt="" loading="lazy" decoding="async"></span>` +
      `<span class="card-n">Nº ${pad(i + 1)}</span>` +
      `<span class="card-t">${esc(it.nome)}</span>` +
      `<span class="card-m">${esc([it.sub || l.formato, it.preco || l.preco].filter(Boolean).join(' · '))}</span></button></li>`).join('');
    return `<article class="apo-line" id="ap-${l.id}" data-line-id="${l.id}">
      <header class="apo-line-head"><h3 class="apo-line-t">${esc(l.titulo)}</h3><p class="k">${esc(meta)}</p></header>
      <div class="apo-intro"><p class="apo-text">${esc(l.texto)}</p>${extra}</div>
      <ul class="grid" aria-label="${esc(l.titulo)}">${cards}</ul>
    </article>`;
  }).join('');
  const lineEls = $$('.apo-line', apoLines);

  // mostra uma linha (ou "all"); devolve false se a linha não existe. Os links do menu (#ap-sprays…) passam por aqui
  function setLinha(id) {
    if (id !== 'all' && !LINHAS.some(l => l.id === id)) return false;
    $$('button', apoFilters).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.f === id)));
    lineEls.forEach(el => { el.hidden = id !== 'all' && el.dataset.lineId !== id; });
    return true;
  }
  apoFilters.addEventListener('click', e => {
    const b = e.target.closest('button[data-f]');
    if (!b) return;
    setLinha(b.dataset.f);
    // o endereço acompanha o filtro (#ap-sprays), e o menu marca a linha escolhida
    lastHash = b.dataset.f === 'all' ? '#apothecary' : '#ap-' + b.dataset.f;
    history.replaceState(null, '', lastHash);
    markNav(lastHash);
  });
  apoLines.addEventListener('click', e => {
    const b = e.target.closest('.card[data-line]');
    if (!b) return;
    const l = LINHAS[+b.dataset.line];
    openItem(l.itens, +b.dataset.i, l);
  });

  /* ------------------------------------------------------------ galerias: fine art + fotos das lojas */
  // linhas justificadas: cada imagem ocupa largura proporcional ao formato (--ar), todas com a mesma altura na linha.
  // Um clique abre o visualizador em modo galeria (setas, deslizar, miniaturas).
  const ratio = a => (a.w && a.h ? a.w / a.h : 0.75);
  function gallery(ul, list, line) {
    ul.innerHTML = list.map((a, i) =>
      `<li style="--ar:${ratio(a).toFixed(3)}"><button type="button" data-i="${i}"${line.legenda ? '' : ` aria-label="${esc(a.rotulo)}"`}>` +
      `<img src="${a.img}" alt=""${a.w && a.h ? ` width="${a.w}" height="${a.h}"` : ''} loading="lazy" decoding="async">` +
      `${line.legenda ? `<span class="k">${esc(a.nome)}</span>` : ''}</button></li>`).join('');
    ul.addEventListener('click', e => {
      const b = e.target.closest('[data-i]');
      if (b) openItem(list, +b.dataset.i, line);
    });
  }
  const ARTE = { id: 'arte', titulo: 'Fine Art', linha: 'Dspallanzani Fine Art', formato: 'Diversos tamanhos', preco: 'Sob consulta', galeria: true, legenda: true };
  gallery($('#arte-grid'), C.arte.map(a => ({ ...a, rotulo: a.nome, alt: `${a.nome}, obra de Dspallanzani` })), ARTE);

  // fotos das lojas: os textos do visualizador saem do próprio cartão da loja (nome, número, frase e endereço)
  $$('.jgrid--loja').forEach(ul => {
    const card = ul.closest('.loja');
    const nome = card.querySelector('.loja-t').textContent.trim();
    const loja = card.querySelector('.k')?.textContent.trim() || '';
    const line = {
      id: ul.dataset.loja, tipo: 'loja', titulo: nome, linha: `Coven 1692 · ${loja}`, galeria: true,
      frase: card.querySelector('.loja-w')?.textContent || '',
    };
    const dd = card.querySelector('.spec dd');
    const endereco = dd ? [...dd.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent.trim()).reverse().join(' — ') : '';
    const fotos = (C[ul.dataset.loja] || []).map((f, i) => ({
      ...(typeof f === 'string' ? { img: f } : f), nome, sub: endereco, rotulo: `${nome}, foto ${i + 1}`, alt: `${nome}, foto ${i + 1}`,
    }));
    gallery(ul, fotos, line);
  });

  /* ------------------------------------------------------------ painel */
  const panel = $('#panel');
  const P = {
    img: $('#p-img'), n: $('#p-n'), k: $('#p-k'), title: $('#p-title'), sub: $('#p-sub'),
    frase: $('#p-frase'), desc: $('#p-desc'), spec: $('#p-spec'), wa: $('#p-wa'), ds: $('#p-ds'), fine: $('#p-fine'),
    colab: $('#p-colab'), thumbs: $('#p-thumbs'), strip: $('#p-fotos'),
  };
  let ctx = null;
  let lastFocus = null;
  let closeTimer = null;

  // filme no painel: substitui a foto quando o perfume tem "video"
  const PV = $('#p-video');
  const PC = $('#p-ctrl');
  soundBtns.set(PV, $('[data-sound]', PC));
  // proporção real do vídeo: a coluna da mídia encolhe até ela (ver .panel--film no CSS)
  PV.addEventListener('loadedmetadata', () => {
    if (PV.videoWidth && PV.videoHeight) panel.style.setProperty('--film-ar', PV.videoWidth / PV.videoHeight);
  });
  function setMedia(mode, userAction) {
    const film = mode === 'video';
    panel.classList.toggle('panel--film', film);
    PV.hidden = !film;
    $$('[data-media]', PC).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.media === mode)));
    if (film && (!reduce || userAction)) tryPlay(PV); else PV.pause();
  }
  function setFilm(f) {
    if (f && f.video) {
      if (PV.getAttribute('src') !== f.video) {
        panel.style.removeProperty('--film-ar');
        PV.poster = f.poster || f.img;
        PV.src = f.video;
        PV.preload = 'auto';
        // URL absoluta: dentro de var() o caminho relativo seria resolvido a partir de assets/css/
        $('.panel-media', panel).style.setProperty('--film-poster', `url("${new URL(f.poster || f.img, location.href).href}")`);
      }
      PC.hidden = false;
      setMedia(reduce ? 'img' : 'video');
    } else {
      PV.pause();
      PV.hidden = true;
      PC.hidden = true;
      panel.classList.remove('panel--film');
      if (!PV.muted) { PV.muted = true; syncSound(PV); }
    }
  }
  PC.addEventListener('click', e => {
    const m = e.target.closest('[data-media]');
    if (m) setMedia(m.dataset.media, true);
    if (e.target.closest('[data-sound]')) toggleSound(PV);
  });

  const specRows = rows => rows.filter(r => r && r[1])
    .map(([dt, dd, cls]) => `<div><dt>${esc(dt)}</dt><dd${cls ? ` class="${cls}"` : ''}>${esc(dd)}</dd></div>`).join('');

  function setImage(src, alt) {
    if (P.img.getAttribute('src') === src) return;
    P.img.classList.add('is-loading');
    const next = new Image();
    next.onload = next.onerror = () => {
      // a proporção da foto dimensiona a caixa da imagem (ver .panel-media img no CSS): cabe inteira, sem cortes
      if (next.naturalWidth && next.naturalHeight) P.img.style.setProperty('--ar', (next.naturalWidth / next.naturalHeight).toFixed(4));
      P.img.src = src;
      P.img.alt = alt;
      requestAnimationFrame(() => P.img.classList.remove('is-loading'));
    };
    next.src = src;
  }

  // fotos do perfume aberto: a do catálogo ("img") e as extras ("fotos"); com mais de uma, uma coluna de miniaturas
  // à direita da foto (ver .media-thumbs no CSS), como nas lojas online
  let fotos = [], fotoI = 0;
  function setFotos(f) {
    fotos = [f.img, ...(f.fotos || [])].map((src, i) => ({
      src, thumb: i ? src : f.thumb, alt: `Frasco do perfume ${f.nome}${i ? `, foto ${i + 1}` : ''}`,
    }));
    const multi = fotos.length > 1;
    panel.classList.toggle('panel--fotos', multi);
    P.strip.innerHTML = multi ? fotos.map((a, j) =>
      `<button type="button" data-foto="${j}" aria-label="${esc(a.alt)}"><img src="${a.thumb}" alt="" decoding="async"></button>`).join('') : '';
    showFoto(0);
  }
  function showFoto(i) {
    fotoI = (i + fotos.length) % fotos.length;
    setImage(fotos[fotoI].src, fotos[fotoI].alt);
    $$('button', P.strip).forEach((b, j) => b.setAttribute('aria-current', String(j === fotoI)));
    // a foto seguinte e a anterior já ficam carregadas, para as setas responderem na hora
    if (fotos.length > 1) [1, -1].forEach(d => { new Image().src = fotos[(fotoI + d + fotos.length) % fotos.length].src; });
  }

  function renderFrag(f) {
    panel.classList.remove('panel--gallery');
    P.thumbs.hidden = true;
    P.wa.hidden = false;
    setFotos(f);
    setFilm(f);
    P.n.textContent = `Nº ${pad(f.n)} / ${F.length}`;
    P.k.textContent = f.tipo === 'criacao' ? 'Criação Coven 1692' : 'Releitura';
    P.title.textContent = f.nome;
    P.sub.textContent = [f.sub, `${f.formato} · ${f.volume}`].filter(Boolean).join(' — ');
    const site = PARC[f.colab]?.site; // site do parceiro, mostrado no selo de parceria
    P.colab.hidden = !f.colab;
    P.colab.innerHTML = f.colab
      ? `<span class="p-colab-t"><span aria-hidden="true">✶</span> Parceria Coven 1692 &amp; ${esc(f.colab)}</span>` +
        (site ? `<a href="${site}" target="_blank" rel="noopener">${esc(site.replace(/^https?:\/\/|\/$/g, ''))} ↗</a>` : '')
      : '';
    P.frase.innerHTML = `“${esc(f.frase)}”` + (f.fonte ? `<cite class="p-fonte">— ${esc(f.fonte)}</cite>` : '');
    P.frase.classList.toggle('p-frase--longa', f.frase.length > 140); // citação longa: letra menor, linha mais larga
    P.desc.innerHTML = (f.texto || []).map(t => `<p>${esc(t)}</p>`).join('');
    const p = f.piramide || {};
    P.spec.innerHTML = specRows([
      f.tipo === 'releitura' && ['Inspiração', f.inspiracao],
      ['Família', f.familia],
      ['Topo', p.topo], ['Coração', p.coracao], ['Fundo', p.fundo],
      ['Notas', f.notas],
      ['Frasco', f.volume],
      ['Valor', f.esgotado ? `${f.preco} — esgotado` : f.preco, 'is-price'],
    ]);
    P.wa.textContent = f.esgotado ? 'Avise-me quando voltar ↗' : 'Comprar pelo WhatsApp ↗';
    P.wa.href = wa(f.esgotado
      ? `Olá, Coven! Quero ser avisada(o) quando o perfume ${f.nome} voltar.`
      : `Olá, Coven! Quero comprar o perfume ${f.nome} (${f.volume} · ${f.preco}).`);
    P.ds.hidden = false;
    P.ds.href = wa(`Olá, Coven! Quero montar um Discovery Set (6 × 5 ml) incluindo o ${f.nome}.`);
    P.fine.textContent = (f.colab ? `Este frasco é parte da parceria Coven 1692 & ${f.colab}.` : 'Este frasco é parte do projeto Coven 1692.') + ' Álcool de cereais, matéria-prima importada, blends exclusivos e corante cosmético. Vegan & cruelty free. A reposição é contínua, mas respeita sempre o tempo de maceração.';
  }

  function renderItem(it, line, i, total) {
    const gal = !!line.galeria;
    const loja = line.tipo === 'loja';
    panel.classList.toggle('panel--gallery', gal);
    panel.classList.remove('panel--fotos');
    setImage(it.img, it.alt || it.nome);
    setFilm(null);
    P.thumbs.hidden = !gal;
    if (gal) {
      // miniaturas da galeria aberta (refeitas só quando se troca de galeria)
      if (P.thumbs.dataset.line !== line.id) {
        P.thumbs.innerHTML = ctx.list.map((a, j) =>
          `<button type="button" data-thumb="${j}" aria-label="${esc(a.rotulo || a.nome)}"><img src="${a.img}" alt="" loading="lazy" decoding="async"></button>`).join('');
        P.thumbs.setAttribute('aria-label', loja ? 'Todas as fotos' : 'Todas as obras');
        P.thumbs.dataset.line = line.id;
      }
      $$('button', P.thumbs).forEach((b, j) => b.setAttribute('aria-current', String(j === i)));
      // a imagem seguinte e a anterior já ficam carregadas, para as setas responderem na hora
      [1, -1].forEach(d => { new Image().src = ctx.list[(i + d + total) % total].img; });
    }
    P.n.textContent = `${line.titulo} — ${pad(i + 1)} / ${pad(total)}`;
    P.k.textContent = line.linha || line.titulo;
    P.title.textContent = it.nome;
    P.sub.textContent = it.sub || line.titulo;
    P.colab.hidden = true;
    const texto = (it.texto || []).slice();
    const poetic = line.id === 'rede-vamp';
    P.frase.textContent = line.frase || (poetic && texto.length ? `“${texto.shift()}”` : '');
    P.frase.classList.remove('p-frase--longa');
    P.desc.innerHTML = texto.map(t => `<p>${esc(t)}</p>`).join('');
    P.spec.innerHTML = specRows([
      ['Formato', it.sub ? '' : line.formato],
      ['Valor', it.preco || line.preco, 'is-price'],
    ]);
    P.wa.hidden = loja; // foto de loja não é produto: sem botão de compra
    P.wa.textContent = line.id === 'arte' ? 'Consultar pelo WhatsApp ↗' : 'Comprar pelo WhatsApp ↗'; // obra é sob consulta
    P.wa.href = wa(line.id === 'arte' ? `Olá, Coven! Tenho interesse na obra ${it.nome}.` : `Olá, Coven! Quero comprar ${line.titulo}: ${it.nome}.`);
    P.ds.hidden = true;
    P.fine.textContent = loja ? ''
      : line.id === 'arte' ? 'Obras de Dspallanzani Fine Art. Diversos tamanhos, envio para todo o mundo.'
      : 'Produção artesanal, sob encomenda ou em pequenos lotes limitados. Consulte a disponibilidade ou faça sua reserva.';
  }

  function render() {
    const it = ctx.list[ctx.i];
    if (ctx.type === 'frag') renderFrag(it);
    else renderItem(it, ctx.line, ctx.i, ctx.list.length);
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
    // aberto a partir da busca: ao fechar, volta aos resultados (a página continua travada)
    document.body.classList.toggle('is-locked', !sEl.hidden);
    PV.pause();
    closeTimer = setTimeout(() => { panel.hidden = true; }, reduce ? 0 : 400);
    if (location.hash.startsWith('#frasco/')) history.replaceState(null, '', lastHash || '#' + page);
    if (lastFocus && document.contains(lastFocus)) lastFocus.focus({ preventScroll: true });
  }

  // list: a sequência percorrida por Anterior/Próximo (o catálogo inteiro ou só os resultados da busca)
  function openFrag(slug, list = F) {
    const i = list.findIndex(f => f.slug === slug);
    if (i < 0) return;
    ctx = { type: 'frag', list, i };
    render();
    show();
    const h = '#frasco/' + slug;
    if (location.hash !== h) history.replaceState(null, '', h);
  }

  function openItem(list, i, line) {
    ctx = { type: 'item', list, i, line };
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

  // galerias (Fine Art, fotos das lojas): setas sobre a imagem, deslizar com o dedo e miniaturas para pular direto.
  // Perfume com mais de uma foto: miniaturas na lateral e deslizar trocam só a foto (Anterior/Próximo trocam o perfume).
  const slide = d => (ctx && ctx.type === 'frag' ? showFoto(fotoI + d) : step(d));
  const swipeable = () => panel.matches('.panel--gallery, .panel--fotos:not(.panel--film)');
  $$('[data-step]', panel).forEach(b => b.addEventListener('click', () => slide(+b.dataset.step)));
  P.thumbs.addEventListener('click', e => {
    const b = e.target.closest('[data-thumb]');
    if (b && ctx) { ctx.i = +b.dataset.thumb; render(); }
  });
  P.strip.addEventListener('click', e => {
    const b = e.target.closest('[data-foto]');
    if (b) showFoto(+b.dataset.foto);
  });
  const media = $('.panel-media', panel);
  let swipe = null;
  media.addEventListener('pointerdown', e => {
    swipe = swipeable() && e.isPrimary ? { x: e.clientX, y: e.clientY } : null;
  });
  media.addEventListener('pointerup', e => {
    if (!swipe) return;
    const dx = e.clientX - swipe.x, dy = e.clientY - swipe.y;
    swipe = null;
    if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.5) slide(dx < 0 ? 1 : -1);
  });
  media.addEventListener('pointercancel', () => { swipe = null; });
  media.addEventListener('dragstart', e => { if (swipeable()) e.preventDefault(); });

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

  /* ------------------------------------------------------------ cabeçalho: a logo encolhe ao rolar */
  const siteHeader = $('.site-header');
  const compactHeader = () => siteHeader.classList.toggle('is-compact', scrollY > 40);
  addEventListener('scroll', compactHeader, { passive: true });
  compactHeader();

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

  /* ------------------------------------------------------------ busca (a lupa) */
  const sBtn = $('.search-btn');
  const qIn = $('#q');
  const sRes = $('#search-res');
  const sStatus = $('#search-status');
  const sHint = $('.search-hint', sEl);
  const sEmpty = $('.search-empty', sEl);
  const sClear = $('[data-search-clear]', sEl);
  const sHead = $('.search-head', sEl);

  // busca sem acento e sem caixa: "maca verde" encontra "Maçã Verde"
  const fold = s => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  // texto dobrado + mapa de volta às posições do original, para grifar o trecho certo
  const foldMap = text => {
    let norm = '';
    const map = [];
    for (let i = 0; i < text.length; i++) for (const c of fold(text[i])) { norm += c; map.push(i); }
    return { text, norm, map };
  };
  const isStart = (s, at) => at === 0 || !/[a-z0-9]/.test(s[at - 1]);
  // posições de t em norm; termos de 1–2 letras só valem no começo de uma palavra
  const hits = (norm, t) => {
    const out = [];
    for (let at = norm.indexOf(t); at > -1; at = norm.indexOf(t, at + 1)) if (t.length > 2 || isStart(norm, at)) out.push(at);
    return out;
  };

  // campos pesquisáveis: [chave, rótulo mostrado no resultado, peso na ordenação]
  const FIELDS = [
    ['nome', '', 100], ['sub', '', 70], ['inspiracao', 'Inspiração', 55], ['colab', 'Parceria', 40],
    ['familia', 'Família', 35], ['topo', 'Topo', 30], ['coracao', 'Coração', 30], ['fundo', 'Fundo', 30],
    ['notas', 'Notas', 30], ['frase', '', 12], ['tipo', '', 8],
  ];
  const STOP = new Set(['e', 'de', 'da', 'do', 'das', 'dos', 'com', 'a', 'o', '&']);
  const INDEX = F.map(f => {
    const p = f.piramide || {};
    const src = { ...f, topo: p.topo, coracao: p.coracao, fundo: p.fundo, tipo: f.tipo === 'criacao' ? 'Criação autoral' : 'Releitura' };
    const fields = FIELDS.filter(([k]) => src[k]).map(([k, label, w]) => ({ k, label, w, ...foldMap(String(src[k])) }));
    return { f, fields, by: Object.fromEntries(fields.map(x => [x.k, x])) };
  });

  // todas as palavras precisam aparecer em algum campo; nome pesa mais que notas, notas mais que a frase
  function find(q) {
    let toks = [...new Set(fold(q).split(/[\s,;/]+/).filter(Boolean))];
    if (toks.some(t => !STOP.has(t))) toks = toks.filter(t => !STOP.has(t));
    if (!toks.length) return null;
    const out = [];
    INDEX.forEach(s => {
      let score = 0;
      for (const t of toks) {
        let best = 0;
        s.fields.forEach(fl => {
          if (t.length === 1 && fl.k !== 'nome' && fl.k !== 'sub') return; // uma letra só: busca pelo nome
          const h = hits(fl.norm, t);
          if (!h.length) return;
          const v = fl.w * (h.some(at => isStart(fl.norm, at)) ? 1 : 0.6) + (fl.k === 'nome' && h[0] === 0 ? 40 : 0);
          if (v > best) best = v;
        });
        if (!best) return;
        score += best;
      }
      out.push({ s, score });
    });
    out.sort((a, b) => b.score - a.score || a.s.f.n - b.s.f.n);
    return { toks, out };
  }

  function hl(fl, toks) {
    const r = [];
    toks.forEach(t => hits(fl.norm, t).forEach(at => r.push([fl.map[at], fl.map[at + t.length - 1] + 1])));
    r.sort((a, b) => a[0] - b[0]);
    let html = '';
    let pos = 0;
    r.forEach(([a, b]) => {
      if (b <= pos) return;
      a = Math.max(a, pos);
      html += esc(fl.text.slice(pos, a)) + '<mark>' + esc(fl.text.slice(a, b)) + '</mark>';
      pos = b;
    });
    return html + esc(fl.text.slice(pos));
  }

  // cada resultado mostra o motivo do encontro: a nota, a família, a inspiração ou a frase
  function row(s, toks) {
    const f = s.f;
    const named = toks.every(t => ['nome', 'sub'].some(k => s.by[k] && hits(s.by[k].norm, t).length));
    let why = null;
    if (!named) {
      let best = 0;
      s.fields.forEach(fl => {
        if (fl.k === 'nome' || fl.k === 'sub' || fl.k === 'tipo') return;
        const n = toks.filter(t => hits(fl.norm, t).length).length;
        if (n && n * 1000 + fl.w > best) { best = n * 1000 + fl.w; why = fl; }
      });
    }
    let meta;
    if (why && why.k === 'frase') meta = `<span class="s-m s-m--frase">“${hl(why, toks)}”</span>`;
    else if (why) meta = `<span class="s-m"><b>${esc(why.label)}</b>${hl(why, toks)}</span>`;
    else {
      const def = f.tipo === 'releitura' && f.inspiracao ? `Releitura · ${f.inspiracao}` : `Criação Coven 1692${f.colab ? ' & ' + f.colab : ''}`;
      meta = `<span class="s-m">${hl(foldMap(def), toks)}</span>`;
    }
    return `<li><button class="s-item${f.esgotado ? ' is-out' : ''}" type="button" data-slug="${f.slug}">` +
      `<span class="s-img"><img src="${f.thumb}" alt="" loading="lazy" decoding="async"></span>` +
      `<span class="s-n">Nº ${pad(f.n)}</span>` +
      `<span class="s-main"><span class="s-t"><span class="s-tt">${hl(s.by.nome, toks)}</span>` +
      `${s.by.sub ? `<span class="s-sub">${hl(s.by.sub, toks)}</span>` : ''}</span>${meta}</span>` +
      `<span class="s-p">${f.esgotado ? 'Esgotado' : esc(f.preco)}</span></button></li>`;
  }

  let found = [];
  function renderSearch() {
    const q = qIn.value.trim();
    const r = find(q);
    found = r ? r.out.map(o => o.s.f) : [];
    sClear.hidden = !qIn.value;
    sHint.hidden = !!r;
    sRes.innerHTML = r ? r.out.map(o => row(o.s, r.toks)).join('') : '';
    sStatus.textContent = r ? `${found.length} ${found.length === 1 ? 'frasco' : 'frascos'}` : '';
    sEmpty.hidden = !r || found.length > 0;
    if (r && !found.length) $('[data-q-echo]', sEmpty).textContent = q;
  }

  let sLastFocus = null;
  function openSearch() {
    if (!sEl.hidden) { qIn.focus(); return; }
    if (!menu.hidden) setMenu(false);
    sLastFocus = document.activeElement;
    sEl.hidden = false;
    sBtn.setAttribute('aria-expanded', 'true');
    document.body.classList.add('is-locked');
    sEl.style.scrollPaddingTop = sHead.offsetHeight + 'px';
    qIn.focus(); // ainda dentro do toque, para o teclado do celular abrir
    qIn.select();
    requestAnimationFrame(() => sEl.classList.add('is-open'));
  }
  function closeSearch() {
    if (sEl.hidden) return;
    sEl.classList.remove('is-open');
    sEl.hidden = true;
    sBtn.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('is-locked');
    const back = sLastFocus && sLastFocus !== document.body && document.contains(sLastFocus) ? sLastFocus : sBtn;
    back.focus({ preventScroll: true });
  }

  sBtn.addEventListener('click', () => (sEl.hidden ? openSearch() : closeSearch()));
  $('[data-search-close]', sEl).addEventListener('click', closeSearch);
  qIn.addEventListener('input', renderSearch);
  $('.search-field', sEl).addEventListener('submit', e => {
    e.preventDefault();
    if (found.length) openFrag(found[0].slug, found);
  });
  sClear.addEventListener('click', () => { qIn.value = ''; renderSearch(); qIn.focus(); });
  sHint.addEventListener('click', e => {
    const b = e.target.closest('[data-q]');
    if (b) { qIn.value = b.dataset.q; renderSearch(); qIn.focus(); }
  });
  sRes.addEventListener('click', e => {
    const b = e.target.closest('.s-item');
    if (b) openFrag(b.dataset.slug, found);
  });

  // dentro da busca: ↑ ↓ percorrem os resultados, Esc fecha, Tab não escapa da camada
  sEl.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      const items = $$('.s-item', sRes);
      const at = items.indexOf(document.activeElement);
      if (document.activeElement !== qIn && at < 0) return;
      e.preventDefault();
      const next = items[e.key === 'ArrowDown' ? at + 1 : at - 1];
      if (next) { next.focus({ preventScroll: true }); next.scrollIntoView({ block: 'nearest' }); }
      else if (e.key === 'ArrowUp') qIn.focus();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      closeSearch();
    } else if (e.key === 'Tab') {
      const f = $$('input, a[href], button:not([hidden])', sEl).filter(el => el.offsetParent !== null);
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  // atalhos: "/" ou Ctrl/⌘+K abrem a busca de qualquer ponto da página
  document.addEventListener('keydown', e => {
    if (!panel.hidden || !sEl.hidden) return;
    const k = (e.key || '').toLowerCase();
    const typing = e.target.closest && e.target.closest('input, textarea, select, [contenteditable="true"]');
    if ((k === '/' && !typing && !e.ctrlKey && !e.metaKey && !e.altKey) || (k === 'k' && (e.ctrlKey || e.metaKey))) {
      e.preventDefault();
      openSearch();
    }
  });

  /* ------------------------------------------------------------ páginas */
  // cada <section> de <main> é uma página; o endereço (#lojas, #fragrancias, #ap-sprays, #frasco/matinta) decide qual aparece
  const PAGES = $$('main > section[id]');
  const pageIds = new Set(PAGES.map(sec => sec.id));
  const HOME = PAGES[0].id; // a capa
  const navLinks = $$('.nav a, .m-link');
  const baseTitle = document.title;
  let page = null;
  let lastHash = ''; // endereço da página (ou do filtro) por baixo do painel do perfume, para onde se volta ao fechá-lo
  const markNav = h => navLinks.forEach(a => {
    if (a.getAttribute('href') === h) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });

  function showPage(id, current, userNav) {
    const changed = page !== id;
    if (changed) {
      PAGES.forEach(sec => { sec.hidden = sec.id !== id; });
      page = id;
      const label = $(`#${id} .sec-k span:last-child`); // "Lojas físicas", "Perfumaria"…; a capa não tem
      document.title = label ? `${label.textContent.trim()} — Coven 1692` : baseTitle;
    }
    lastHash = '#' + (current || id);
    markNav(lastHash);
    if (changed && userNav) $('#conteudo').focus({ preventScroll: true }); // o leitor de tela começa na página nova
    return changed;
  }

  function route(userNav) {
    const h = decodeURIComponent(location.hash.slice(1));
    const m = h.match(/^frasco\/([\w-]+)/);
    if (m) {
      showPage('fragrancias', '', userNav);
      openFrag(m[1]);
      return;
    }
    if (!panel.hidden) hide();
    if (h.startsWith('ap-') && setLinha(h.slice(3))) {
      const changed = showPage('apothecary', h, userNav);
      scrollTo({ top: 0, behavior: changed || reduce ? 'instant' : 'smooth' });
      return;
    }
    if (!pageIds.has(h) && page) return; // âncora desconhecida: fica onde está
    if (h === 'apothecary') setLinha('all');
    if (showPage(pageIds.has(h) ? h : HOME, '', userNav)) scrollTo({ top: 0, behavior: 'instant' });
  }
  addEventListener('hashchange', () => route(true));
  // clicar de novo no link da página atual volta ao topo dela
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || a.getAttribute('href') !== location.hash) return;
    e.preventDefault();
    if (a.getAttribute('href').startsWith('#ap-')) route(true);
    else scrollTo({ top: 0, behavior: reduce ? 'instant' : 'smooth' });
  });
  // pular para o conteúdo: foco no <main>, sem mudar de página
  $('.skip').addEventListener('click', e => { e.preventDefault(); $('#conteudo').focus(); });
  route(false);

  /* ------------------------------------------------------------ véus atrás da logo e do menu */
  // os véus (ver .veil no CSS) copiam o fundo do que passa por trás deles:
  // textura pura ou textura com véu escuro (Lojas, Fine Art)
  const brandEl = $('.brand');
  const navEl = $('.nav');
  const veils = $$('.veil');
  const navVeil = $('.veil--nav');
  const backs = [...PAGES, $('.site-footer')];
  const fitVeil = () => navVeil.style.setProperty('--nav-w', navEl.offsetWidth + 'px');
  const paintVeils = () => {
    const b = brandEl.getBoundingClientRect(); // logo e menu dividem a mesma linha: o fundo no meio dela vale para os dois
    const y = b.top + b.height / 2;
    const under = backs.find(el => {
      if (el.hidden) return false;
      const r = el.getBoundingClientRect();
      return r.top <= y && r.bottom > y;
    });
    const tint = under ? getComputedStyle(under).backgroundColor : 'transparent';
    veils.forEach(v => v.style.setProperty('--veil-tint', tint));
  };
  new ResizeObserver(fitVeil).observe(navEl); // a largura muda quando a fonte carrega e ao marcar a página atual
  addEventListener('scroll', paintVeils, { passive: true });
  addEventListener('resize', paintVeils);
  addEventListener('hashchange', paintVeils);
  fitVeil();
  paintVeils();
  void navVeil.offsetWidth; // fixa a medida inicial antes de ligar a transição: os véus não "crescem" ao abrir a página
  veils.forEach(v => v.classList.add('is-on'));

  /* ------------------------------------------------------------ revelação */
  if ('IntersectionObserver' in window && !reduce) {
    const els = $$('.sec-head, .sobre-col > *, .frag-bar, .discovery, .apo-line, ' +
      '.ritual-grid, .ritual-imgs, .blessing, .jgrid--arte, .loja, .vendas-lead, .vendas-text, .contact, .foot-big, .foot-contact');
    els.forEach(el => el.classList.add('rv'));
    const io = new IntersectionObserver(es => es.forEach(en => {
      if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
    }), { rootMargin: '0px 0px -6% 0px' });
    els.forEach(el => io.observe(el));
  }
})();
