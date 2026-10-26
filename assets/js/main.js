(() => {
  'use strict';
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Mở trực tiếp từ ổ đĩa (file://): link dạng thư mục cần trỏ thẳng tới index.html
  if (location.protocol === 'file:') {
    $$('a[href]').forEach(a => {
      const h = a.getAttribute('href');
      if (/^(https?:|mailto:|tel:|#)/.test(h)) return;
      const i = h.indexOf('#'), p = i < 0 ? h : h.slice(0, i), hash = i < 0 ? '' : h.slice(i);
      if (p.endsWith('/')) a.setAttribute('href', p + 'index.html' + hash);
    });
  }

  // Header, nút về đầu trang
  const hd = $('.hd'), top = $('.totop');
  const onScroll = () => {
    hd && hd.classList.toggle('scrolled', scrollY > 10);
    top && top.classList.toggle('show', scrollY > 700);
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Menu điện thoại
  const burger = $('.burger'), mnav = $('#mnav');
  if (burger && mnav) {
    const set = open => {
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Đóng menu' : 'Mở menu');
      mnav.classList.toggle('open', open);
    };
    burger.addEventListener('click', () => set(burger.getAttribute('aria-expanded') !== 'true'));
    $$('a', mnav).forEach(a => a.addEventListener('click', () => set(false)));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') set(false); });
    matchMedia('(min-width: 901px)').addEventListener('change', () => set(false));
  }

  // Menu thả xuống trên thiết bị cảm ứng
  $$('.dd').forEach(dd => {
    const btn = $('.dd-btn', dd);
    btn.addEventListener('click', e => {
      if (matchMedia('(hover: none)').matches && !dd.classList.contains('open')) { e.preventDefault(); dd.classList.add('open'); }
    });
    document.addEventListener('click', e => { if (!dd.contains(e.target)) dd.classList.remove('open'); });
  });

  // Hiệu ứng xuất hiện khi cuộn
  if ('IntersectionObserver' in window && !reduce) {
    document.documentElement.classList.add('rv-on');
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    }), { threshold: .12, rootMargin: '0px 0px -40px 0px' });
    $$('[data-rv]').forEach(el => io.observe(el));
  } else {
    $$('[data-rv]').forEach(el => el.classList.add('in'));
  }
  $$('.cta').forEach(el => {
    if (!el.hasAttribute('data-rv')) el.classList.add('in');
  });

  // Khu vực theo phường: đổi nội dung và bản đồ theo phường được chọn
  const areaSec = $('#khu-vuc');
  if (areaSec) {
    const frame = $('.area-frame', areaSec);
    const pick = b => {
      const id = b.dataset.area;
      $$('[data-area]', areaSec).forEach(x => {
        const on = x === b;
        x.classList.toggle('on', on);
        x.setAttribute('aria-pressed', String(on));
      });
      $$('[data-panel]', areaSec).forEach(p => {
        const on = p.dataset.panel === id;
        p.hidden = !on;
        p.classList.toggle('on', on);
      });
      if (frame && b.dataset.map && frame.getAttribute('src') !== b.dataset.map) frame.setAttribute('src', b.dataset.map);
    };
    $$('[data-area]', areaSec).forEach(b => b.addEventListener('click', () => pick(b)));
  }

  // Ngành nghề dạng tấm mở rộng
  const inds = $$('[data-ind]');
  const openInd = el => inds.forEach(x => {
    const on = x === el;
    x.classList.toggle('on', on);
    $('.ind-head', x).setAttribute('aria-expanded', String(on));
  });
  inds.forEach(el => {
    $('.ind-head', el).addEventListener('click', () => openInd(el));
    el.addEventListener('mouseenter', () => { if (matchMedia('(hover: hover) and (min-width: 901px)').matches) openInd(el); });
  });

  // Trang bài viết: thanh tiến độ đọc và mục lục theo vị trí cuộn
  const art = $('.darticle');
  if (art) {
    const bar = $('.dprog span');
    const links = $$('.toc a');
    const heads = links.map(a => document.getElementById(a.getAttribute('href').slice(1))).filter(Boolean);
    const toc = $('.toc');
    if (toc && innerWidth < 901) toc.open = false;
    const track = () => {
      const b = art.getBoundingClientRect();
      if (bar) bar.style.transform = `scaleX(${Math.min(1, Math.max(0, (innerHeight * .3 - b.top) / b.height))})`;
      let cur = '';
      heads.forEach(h => { if (h.getBoundingClientRect().top < innerHeight * .28) cur = h.id; });
      links.forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + cur));
    };
    addEventListener('scroll', track, { passive: true });
    track();
  }

  // Bộ lọc chủ đề ở trang Blog
  const tpick = $('.tpick');
  if (tpick) {
    const btns = $$('[data-filter]', tpick), cards = $$('#posts .pcard'), feat = $('[data-feat]');
    const valid = btns.map(b => b.dataset.filter);
    const apply = (f, scroll) => {
      btns.forEach(b => {
        const on = b.dataset.filter === f;
        b.setAttribute('aria-pressed', String(on));
        b.classList.toggle('on', on);
      });
      $$('[data-intro]').forEach(i => { const on = i.dataset.intro === f; i.hidden = !on; i.classList.toggle('on', on); });
      cards.forEach(c => {
        const show = f === 'all' || c.dataset.topic === f;
        c.classList.toggle('out', !show);
        c.classList.remove('pop');
        if (show) { void c.offsetWidth; c.classList.add('pop'); }
      });
      if (feat) feat.classList.toggle('hide', f !== 'all');
      if (scroll) {
        const target = $('#bai-viet');
        target && target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
      }
    };
    btns.forEach(b => b.addEventListener('click', () => {
      const f = b.dataset.filter;
      history.replaceState(null, '', f === 'all' ? location.pathname : '#' + f);
      apply(f, f !== 'all');
    }));
    const fromHash = () => {
      const h = decodeURIComponent(location.hash.slice(1));
      if (valid.includes(h) && h !== 'all') apply(h, true);
    };
    addEventListener('hashchange', fromHash);
    fromHash();
  }
})();
