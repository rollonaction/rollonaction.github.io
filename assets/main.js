(function(){
  const grid=document.getElementById('worksGrid');
  const esc=s=>s.replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const startAt=w=>{const p=(w.dur||'0:30').split(':');const t=(+p[0])*60+(+p[1]);return t>=60?8:t>=30?4:2;};
  const pad=n=>String(n).padStart(2,'0');
  const icon='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>';
  grid.innerHTML=WORKS.map((w,i)=>{
    const t=esc(w.title), side=i%2?'r':'l';
    const meta=esc(w.meta)+(w.dur && !w.meta.includes(w.dur)?`<span class="ep__dur">${w.dur}</span>`:'');
    const stills=[1,2,3].map(n=>`<button class="ep__still ep__still--${n} js-play" data-id="${w.id}" data-title="${t}" data-vertical="${w.vertical}" aria-label="播放 ${t}（第 ${n} 張精華截圖）" tabindex="-1"><img src="assets/thumbs/${w.id}-${n}.webp" alt="" loading="lazy" decoding="async"></button>`).join('');
    return `
    <article class="ep ep--${side}${w.vertical?' ep--vert':''}${w.biz?' ep--biz':''}" data-cat="${w.cat}" data-id="${w.id}" data-start="${startAt(w)}" data-vertical="${w.vertical}" data-reveal>
      <div class="ep__bg" aria-hidden="true">
        <img class="ep__poster" src="assets/thumbs/${w.id}.webp" alt="" loading="lazy" decoding="async">
        <span class="ep__video"></span>
        <span class="ep__shade"></span>
      </div>
      <div class="ep__inner">
        <div class="ep__info">
          <p class="ep__no"><span>EP.</span>${pad(i+1)}<i aria-hidden="true"></i><em>/ ${pad(WORKS.length)}</em></p>
          <div class="ep__tags"><span class="ep__cat">${w.label}</span>${w.biz?'<span class="ep__biz">商業案</span>':''}</div>
          <h3 class="ep__title">${t}</h3>
          <p class="ep__meta">${meta}</p>
          <div class="ep__actions">
            <button class="ep__play js-play" data-id="${w.id}" data-title="${t}" data-vertical="${w.vertical}" aria-label="播放 ${t}"><span class="ep__playicon">${icon}</span><span>播放影片</span></button>
          </div>
        </div>
        <div class="ep__stills">${stills}</div>
      </div>
    </article>`;}).join('');

  // filters
  const btns=document.querySelectorAll('.filter');
  btns.forEach(b=>b.addEventListener('click',()=>{
    btns.forEach(x=>x.classList.toggle('is-active',x===b));
    const f=b.dataset.filter;
    grid.querySelectorAll('.ep').forEach(el=>{ el.hidden=!(f==='all'||el.dataset.cat===f); });
    grid.classList.toggle('is-filtered',f!=='all');
    grid.classList.remove('is-swap'); void grid.offsetWidth; grid.classList.add('is-swap');
    document.dispatchEvent(new CustomEvent('works:filter'));
  }));

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
