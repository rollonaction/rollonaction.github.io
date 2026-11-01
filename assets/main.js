(function(){
  const grid=document.getElementById('worksGrid');
  // thumbs resolve relative to this script, so pages in sub-folders (e.g. /theme-green/) work too
  const T=(document.currentScript&&document.currentScript.src)?new URL('thumbs/',document.currentScript.src).href:'assets/thumbs/';
  const esc=s=>s.replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const startAt=w=>{const p=(w.dur||'0:30').split(':');const t=(+p[0])*60+(+p[1]);return t>=60?8:t>=30?4:2;};
  const pad=n=>String(n).padStart(2,'0');
  const icon='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>';
  // number + alternate sides within each category (only one category is shown at a time)
  const catIdx={}, catTotal={};
  WORKS.forEach(w=>{catTotal[w.cat]=(catTotal[w.cat]||0)+1;});
  const DEFAULT_CAT='short';
  grid.innerHTML=WORKS.map(w=>{
    const i=catIdx[w.cat]=(catIdx[w.cat]||0)+1;
    const t=esc(w.title), side=i%2?'l':'r';
    const meta=esc(w.meta)+(w.dur && !w.meta.includes(w.dur)?`<span class="ep__dur">${w.dur}</span>`:'');
    const stills=[1,2,3].map(n=>`<button class="ep__still ep__still--${n} js-play" data-id="${w.id}" data-title="${t}" data-vertical="${w.vertical}" aria-label="播放 ${t}（第 ${n} 張精華截圖）" tabindex="-1"><img src="${T}${w.id}-${n}.webp" alt="" loading="lazy" decoding="async"></button>`).join('');
    return `
    <article class="ep ep--${side}${w.vertical?' ep--vert':''}${w.biz?' ep--biz':''}" data-cat="${w.cat}" data-id="${w.id}" data-start="${startAt(w)}" data-vertical="${w.vertical}"${w.cat===DEFAULT_CAT?'':' hidden'} data-reveal>
      <div class="ep__bg" aria-hidden="true">
        <img class="ep__poster" src="${T}${w.id}.webp" alt="" loading="lazy" decoding="async">
        <span class="ep__video"></span>
        <span class="ep__shade"></span>
      </div>
      <div class="ep__inner">
        <div class="ep__info">
          <p class="ep__no"><span>EP.</span>${pad(i)}<i aria-hidden="true"></i><em>/ ${pad(catTotal[w.cat])}</em></p>
          <div class="ep__tags"><span class="ep__cat">${w.label}</span></div>
          <h3 class="ep__title">${t}</h3>
          <p class="ep__meta">${meta}</p>
          <div class="ep__actions">
            <button class="ep__play js-play" data-id="${w.id}" data-title="${t}" data-vertical="${w.vertical}" aria-label="播放 ${t}"><span class="ep__playicon">${icon}</span><span>播放影片</span></button>
          </div>
        </div>
        <div class="ep__stills">${stills}</div>
      </div>
    </article>`;}).join('');

  // categories: one category at a time (no 「全部」). Big cards + sticky bar + 「下一類」 panel.
  const CATS=[
    {k:'short',name:'短影音',en:'SHORT-FORM'},
    {k:'event',name:'活動紀錄',en:'EVENTS'},
    {k:'brand',name:'形象片',en:'BRAND FILM'},
    {k:'drama',name:'戲劇類',en:'DRAMA'}
  ].filter(c=>catTotal[c.k]);
  const firstOf=k=>WORKS.find(w=>w.cat===k);
  const cardsEl=document.getElementById('worksCats'), barPills=document.getElementById('worksBarPills');
  const bar=document.getElementById('worksBar'), body=document.getElementById('worksBody'), nextEl=document.getElementById('worksNext');
  let cur=DEFAULT_CAT;
  if(cardsEl){
    cardsEl.innerHTML=CATS.map((c,i)=>`<button class="wcat${c.k===cur?' is-active':''}" role="tab" aria-selected="${c.k===cur}" data-filter="${c.k}" style="--d:${i*.08}s">
      <span class="wcat__media"><img src="${T}${firstOf(c.k).id}.webp" alt="" loading="lazy" decoding="async"></span>
      <span class="wcat__no">${pad(i+1)}</span>
      <span class="wcat__state" aria-hidden="true">${c.k===cur?'● 觀看中':'<i class="wcat__long">點選</i>切換 →'}</span>
      <span class="wcat__txt"><span class="wcat__en">${c.en}</span><span class="wcat__name">${c.name}</span><span class="wcat__count">${catTotal[c.k]} 支作品</span></span>
    </button>`).join('');
  }
  if(barPills){
    barPills.innerHTML=CATS.map(c=>`<button class="wpill${c.k===cur?' is-active':''}" data-filter="${c.k}" aria-pressed="${c.k===cur}">${c.name}<b>${catTotal[c.k]}</b></button>`).join('');
  }
  // legacy small tabs (older preview pages still use .filter buttons)
  document.querySelectorAll('.filter').forEach(b=>{ const c=b.querySelector('.filter__count'); if(c) c.textContent=catTotal[b.dataset.filter]||0; });

  const navEl=document.getElementById('nav');
  const navH=()=>navEl?navEl.getBoundingClientRect().height:64;
  function scrollToRows(){
    const top=grid.getBoundingClientRect().top+scrollY-navH()-(bar?bar.offsetHeight:0)-16;
    scrollTo({top:Math.max(0,top),behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
  }
  function renderNext(){
    if(!nextEl||!CATS.length) return;
    const i=CATS.findIndex(c=>c.k===cur), n=CATS[(i+1)%CATS.length];
    nextEl.innerHTML=`<button class="wnext" data-filter="${n.k}" data-scroll="1">
      <span class="wnext__media"><img src="${T}${firstOf(n.k).id}.webp" alt="" loading="lazy" decoding="async"></span>
      <span class="wnext__txt"><span class="wnext__kicker">看完了 ${CATS[i].name}・繼續看</span><span class="wnext__name">下一類：${n.name} <i aria-hidden="true">→</i></span><span class="wnext__meta">${n.en}・${catTotal[n.k]} 支作品</span></span>
    </button>`;
  }
  function setCat(f,scroll){
    if(!catTotal[f]) return;
    cur=f;
    document.querySelectorAll('[data-filter]').forEach(x=>{
      if(x.closest('#worksNext')) return;
      const on=x.dataset.filter===f;
      x.classList.toggle('is-active',on);
      if(x.hasAttribute('aria-selected')) x.setAttribute('aria-selected',on?'true':'false');
      if(x.hasAttribute('aria-pressed')) x.setAttribute('aria-pressed',on?'true':'false');
      const st=x.querySelector('.wcat__state'); if(st) st.innerHTML=on?'● 觀看中':'<i class="wcat__long">點選</i>切換 →';
      if(on && x.classList.contains('wpill') && x.parentElement.scrollWidth>x.parentElement.clientWidth){
        x.parentElement.scrollTo({left:x.offsetLeft-x.parentElement.clientWidth/2+x.offsetWidth/2,behavior:'smooth'});
      }
    });
    grid.querySelectorAll('.ep').forEach(el=>{ el.hidden=el.dataset.cat!==f; });
    grid.classList.remove('is-swap'); void grid.offsetWidth; grid.classList.add('is-swap');
    renderNext();
    document.dispatchEvent(new CustomEvent('works:filter'));
    if(scroll) scrollToRows();
    requestAnimationFrame(barUpdate);
  }
  document.addEventListener('click',e=>{
    const b=e.target.closest('.wcat,.wpill,.wnext,.filter'); if(!b) return;
    setCat(b.dataset.filter, b.classList.contains('wpill')||b.classList.contains('wnext'));
  });
  renderNext();

  // sticky bar: shown only while the rows of the works section are on screen (fixed under the nav)
  function barUpdate(){
    if(!bar||!body) return;
    const h=navH(), cardsBottom=cardsEl?cardsEl.getBoundingClientRect().bottom:0;
    const r=grid.getBoundingClientRect();
    const bh=bar.offsetHeight, on=(cardsBottom<h || r.top<h+bh+60) && r.bottom>h+bh+40;
    bar.style.setProperty('--navh',h+'px');
    bar.classList.toggle('is-on',on);
  }
  let bt=false;
  addEventListener('scroll',()=>{ if(!bt){bt=true;requestAnimationFrame(()=>{bt=false;barUpdate();});} },{passive:true});
  addEventListener('resize',barUpdate); barUpdate();

  // modal
  const modal=document.getElementById('modal'),frame=document.getElementById('modalFrame'),mt=document.getElementById('modalTitle');
  document.addEventListener('click',e=>{
    const p=e.target.closest('.js-play');
    if(p){
      frame.classList.toggle('is-vertical',p.dataset.vertical==='true');
      frame.innerHTML=`<iframe src="https://www.youtube-nocookie.com/embed/${p.dataset.id}?autoplay=1&rel=0" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen title="${p.dataset.title}"></iframe>`;
      mt.textContent=p.dataset.title; modal.classList.add('is-open'); modal.setAttribute('aria-hidden','false'); document.body.style.overflow='hidden';
    }
    if(e.target.closest('[data-close]')) close();
  });
  function close(){modal.classList.remove('is-open');modal.setAttribute('aria-hidden','true');frame.innerHTML='';document.body.style.overflow='';}
  document.addEventListener('keydown',e=>{if(e.key==='Escape')close();});

  // nav
  const nav=document.getElementById('nav');
  const onScroll=()=>nav.classList.toggle('is-solid',scrollY>40);
  addEventListener('scroll',onScroll,{passive:true}); onScroll();
  const burger=document.getElementById('burger');
  burger.addEventListener('click',()=>nav.classList.toggle('is-open'));
  document.querySelectorAll('#navLinks a').forEach(a=>a.addEventListener('click',()=>nav.classList.remove('is-open')));
  document.getElementById('yr').textContent=new Date().getFullYear();
})();

/* ---- Motion: kinetic type, scroll reveal, parallax ---- */
(function(){
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // split text into per-character spans (keeps aria via parent aria-label / text)
  document.querySelectorAll('[data-split]').forEach(el=>{
    if(!el.closest('[aria-label]')) el.setAttribute('aria-label', el.textContent);
    const chars=[...el.textContent];
    el.textContent='';
    chars.forEach((c,i)=>{
      const s=document.createElement('span');
      s.className='ch'; s.setAttribute('aria-hidden','true');
      s.style.setProperty('--i',i);
      s.textContent = c===' ' ? '\u00a0' : c;
      el.appendChild(s);
    });
    el.classList.add('split');
  });
  // hero lines: offset second line so letters cascade across both
  document.querySelectorAll('.hero__title .line, .contact__title .line').forEach((ln,li)=>ln.style.setProperty('--line',li));

  const targets=document.querySelectorAll('[data-reveal],[data-split]');
  if(reduce || !('IntersectionObserver' in window)){
    targets.forEach(t=>t.classList.add('is-in'));
  }else{
    const io=new IntersectionObserver(es=>es.forEach(e=>{
      if(e.isIntersecting){ e.target.classList.add('is-in'); io.unobserve(e.target); }
    }),{rootMargin:'0px 0px -8% 0px',threshold:0.12});
    targets.forEach(t=>{ if(!t.closest('.hero')) io.observe(t); });
    // hero is visible at load: reveal immediately
    window.__heroReveal=()=>document.querySelectorAll('.hero [data-reveal],.hero [data-split]').forEach(t=>t.classList.add('is-in'));
    if(window.__introDone) window.__heroReveal();
  }

  if(reduce) return;
  // parallax + horizontal drift of the giant word
  const par=[...document.querySelectorAll('[data-parallax]')];
  const drift=[...document.querySelectorAll('[data-drift]')];
  let ticking=false;
  function update(){
    const vh=innerHeight;
    par.forEach(el=>{
      const r=el.getBoundingClientRect();
      const c=Math.max(-vh,Math.min(vh,r.top+r.height/2-vh/2));
      el.style.setProperty('--py',(c*parseFloat(el.dataset.parallax)).toFixed(1)+'px');
    });
    drift.forEach(el=>el.style.setProperty('--dx',(scrollY*parseFloat(el.dataset.drift)).toFixed(1)+'px'));
    ticking=false;
  }
  addEventListener('scroll',()=>{if(!ticking){ticking=true;requestAnimationFrame(update);}},{passive:true});
  addEventListener('resize',update); update();
})();
window.__heroLoad=()=>requestAnimationFrame(()=>requestAnimationFrame(()=>document.querySelector('.hero').classList.add('is-loaded')));
if(window.__introDone) window.__heroLoad();

(function(){
  const tc=document.getElementById('heroTc'); if(!tc) return;
  if(matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const t0=performance.now(), p=n=>String(n).padStart(2,'0');
  setInterval(()=>{const f=Math.floor((performance.now()-t0)/1000*24);
    tc.textContent=`${p(Math.floor(f/86400))}:${p(Math.floor(f/1440)%60)}:${p(Math.floor(f/24)%60)}:${p(f%24)}`;},1000/24);
})();
