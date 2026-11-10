(function(){
  const grid=document.getElementById('worksGrid');
  // thumbs resolve relative to this script, so pages in sub-folders (e.g. /theme-green/) work too
  const T=(document.currentScript&&document.currentScript.src)?new URL('thumbs/',document.currentScript.src).href:'assets/thumbs/';
  const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const startAt=w=>{const p=(w.dur||'0:30').split(':');const t=(+p[0])*60+(+p[1]);return t>=60?8:t>=30?4:2;};
  const pad=n=>String(n).padStart(2,'0');
  const icon='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>';
  // works.json (via works-loader.js) uses category names in Chinese; legacy works.js uses cat keys
  const CAT_KEY={'短影音':'short','活動紀錄':'event','形象片':'brand','劇情類':'drama','\u6232\u5287\u985e':'drama','節目類':'show','節目':'show','MV':'mv','mv':'mv'}; // \u6232\u5287\u985e = legacy name
  const CAT_NAME={short:'短影音',event:'活動紀錄',brand:'形象片',drama:'劇情類',show:'節目類',mv:'MV'};
  // 短影音 subcategories (optional `subcategory` field in works.json)
  const SUB_KEY={'劇情類':'story','口播宣傳類':'promo'}, SUB_NAME={story:'劇情類',promo:'口播宣傳類'};
  const A=new URL('../',T).href; // assets/ base, for json paths like "thumbs/x.webp"
  const src=(p,fb)=>{ if(!p) return fb; try{ return new URL(p,A).href; }catch(e){ return fb; } };
  const safeUrl=u=>{ try{ const x=new URL(u); return /^https?:$/.test(x.protocol)?x.href:''; }catch(e){ return ''; } };
  const WORKS=(window.WORKS||[]).filter(w=>w && w.published!==false).map((w,ix)=>{
    const id=w.youtubeId||w.id, cat=w.cat||CAT_KEY[String(w.category||'').trim()]||'short';
    const sub=cat==='short'?(SUB_KEY[w.subcategory]||''):'';
    return {...w,id,cat,sub,label:CAT_NAME[cat]+(sub?'・'+SUB_NAME[sub]:''),_ix:ix,meta:w.meta||'',
      // json items without own images (added in /admin/) fall back to YouTube's thumbnails; legacy items use local thumbs
      poster:src(w.thumb,('thumb' in w)?`https://i.ytimg.com/vi/${id}/maxresdefault.jpg`:`${T}${id}.webp`),
      stills:[0,1,2].map(n=>src(w.stills&&w.stills[n],('stills' in w)?`https://i.ytimg.com/vi/${id}/hq${n+1}.jpg`:`${T}${id}-${n+1}.webp`))};
  }).sort((x,y)=>{ const ox=x.order==null?x._ix:x.order, oy=y.order==null?y._ix:y.order; return x.cat===y.cat?(ox-oy||x._ix-y._ix):x._ix-y._ix; });
  // Taiwanese view counts: 8,532 / 12.3萬 / 1.2億
  const fmtViews=n=>{ n=+n; if(!isFinite(n)||n<0) return ''; const t=(v,u)=>(Math.floor(v*10)/10).toFixed(1).replace(/\.0$/,'')+u;
    return n>=1e8?t(n/1e8,'億'):n>=1e4?t(n/1e4,'萬'):Math.round(n).toLocaleString('zh-TW'); };
  const PLAT={
    IG:['Instagram','<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="17.3" cy="6.7" r="1.2" fill="currentColor"/></svg>'],
    FB:['Facebook','<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M13.5 21v-7.5h2.6l.4-3h-3V8.6c0-.9.3-1.5 1.5-1.5h1.6V4.4c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2.2H7.8v3h2.6V21z"/></svg>'],
    YT:['YouTube','<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.5 2.5 0 0 0 2.4 7.2 26 26 0 0 0 2 12a26 26 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8A26 26 0 0 0 22 12a26 26 0 0 0-.4-4.8zM10 15V9l5.2 3z"/></svg>'],
    other:['原平台','<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>']
  };
  // number + alternate sides within each category (only one category is shown at a time)
  const catIdx={}, catTotal={};
  WORKS.forEach(w=>{catTotal[w.cat]=(catTotal[w.cat]||0)+1;});
  const DEFAULT_CAT=catTotal.short?'short':(['event','brand','drama','show','mv'].find(k=>catTotal[k])||'short');
  grid.innerHTML=WORKS.map(w=>{
    const i=catIdx[w.cat]=(catIdx[w.cat]||0)+1;
    const t=esc(w.title), side=i%2?'l':'r', vid=esc(w.id);
    const meta=esc(w.meta)+(w.dur && !String(w.meta).includes(w.dur)?`<span class="ep__dur">${esc(w.dur)}</span>`:'');
    const stills=w.stills.map((s,k)=>`<button class="ep__still ep__still--${k+1} js-play" data-id="${vid}" data-title="${t}" data-vertical="${!!w.vertical}" aria-label="播放 ${t}（第 ${k+1} 張精華截圖）" tabindex="-1"><img src="${esc(s)}" alt="" loading="lazy" decoding="async"></button>`).join('');
    const pl=PLAT[w.sourcePlatform]||(w.sourcePlatform?PLAT.other:null);
    const v=(w.views!==null && w.views!=='' && w.views!==undefined)?fmtViews(w.views):'';
    const vm=v.match(/^([\d.,]+)(萬|億)?$/)||[v,v,''];
    const views=v?`<div class="ep__views" title="${pl?pl[0]+' ':''}觀看次數${w.viewsUpdatedAt?'（'+esc(w.viewsUpdatedAt)+' 更新）':''}"><span class="ep__vnum">${vm[1]}${vm[2]?`<small>${vm[2]}</small>`:''}</span><span class="ep__vlab">${pl?`<i class="ep__plat">${pl[1]}</i>`:''}次觀看${pl?`<em>${pl[0]}</em>`:''}</span></div>`:'';
    const su=w.sourceUrl?safeUrl(w.sourceUrl):'';
    const srcLink=su?`<a class="ep__src" href="${esc(su)}" target="_blank" rel="noopener">觀看原影片 ↗</a>`:'';
    return `
    <article class="ep ep--${side}${w.vertical?' ep--vert':''}${w.biz?' ep--biz':''}" data-cat="${w.cat}"${w.sub?` data-sub="${w.sub}"`:''} data-id="${vid}" data-start="${startAt(w)}" data-vertical="${!!w.vertical}"${w.cat===DEFAULT_CAT?'':' hidden'} data-reveal>
      <div class="ep__bg" aria-hidden="true">
        <img class="ep__poster" src="${esc(w.poster)}" alt="" loading="lazy" decoding="async"${/maxresdefault/.test(w.poster)?` onerror="this.onerror=null;this.src='https://i.ytimg.com/vi/${vid}/hqdefault.jpg'"`:''}>
        <span class="ep__video"></span>
        <span class="ep__shade"></span>
      </div>
      <div class="ep__inner">
        <div class="ep__info">
          <p class="ep__no"><span>EP.</span>${pad(i)}<i aria-hidden="true"></i><em>/ ${pad(catTotal[w.cat])}</em></p>
          <div class="ep__tags"><span class="ep__cat">${w.label}</span></div>
          <h3 class="ep__title">${t}</h3>
          <p class="ep__meta">${meta}</p>${views}
          <div class="ep__actions">
            <button class="ep__play js-play" data-id="${vid}" data-title="${t}" data-vertical="${!!w.vertical}" aria-label="播放 ${t}"><span class="ep__playicon">${icon}</span><span>播放影片</span></button>${srcLink}
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
    {k:'drama',name:'劇情類',en:'DRAMA'},
    {k:'show',name:'節目類',en:'PROGRAM'},
    {k:'mv',name:'MV',en:'MUSIC VIDEO'}
  ].filter(c=>catTotal[c.k]);
  const firstOf=k=>WORKS.find(w=>w.cat===k);
  const posterOf=k=>firstOf(k).poster;
  const cardsEl=document.getElementById('worksCats'), barPills=document.getElementById('worksBarPills');
  const bar=document.getElementById('worksBar'), body=document.getElementById('worksBody'), nextEl=document.getElementById('worksNext');
  let cur=DEFAULT_CAT;
  if(cardsEl){
    cardsEl.style.setProperty('--n',CATS.length); cardsEl.dataset.n=CATS.length;
    const hn=document.getElementById('worksCatsN'); if(hn) hn.textContent='・共 '+CATS.length+' 類';
    cardsEl.innerHTML=CATS.map((c,i)=>`<button class="wcat${c.k===cur?' is-active':''}" role="tab" aria-selected="${c.k===cur}" data-filter="${c.k}" style="--d:${i*.08}s">
      <span class="wcat__media"><img src="${esc(posterOf(c.k))}" alt="" loading="lazy" decoding="async"></span>
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
  function renderNext(){ // end-of-list menu: every other category, so visitors can keep browsing
    if(!nextEl||!CATS.length) return;
    const i=CATS.findIndex(c=>c.k===cur), others=CATS.slice(i+1).concat(CATS.slice(0,i));
    if(!others.length){ nextEl.innerHTML=''; return; }
    nextEl.innerHTML=`<div class="wother">
      <p class="wother__kicker">看完了 ${CATS[i].name}・繼續看其他分類</p>
      <div class="wother__grid">${others.map((c,k)=>`<button class="wother__item${k===0?' is-next':''}" data-filter="${c.k}" data-scroll="1">
        <span class="wother__media"><img src="${esc(posterOf(c.k))}" alt="" loading="lazy" decoding="async"></span>
        <span class="wother__name">${c.name}</span><span class="wother__count">${catTotal[c.k]} 支作品${k===0?'・下一類':''} <i aria-hidden="true">→</i></span>
      </button>`).join('')}</div>
    </div>`;
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
    document.dispatchEvent(new CustomEvent('works:cat'));
    grid.classList.remove('is-swap'); void grid.offsetWidth; grid.classList.add('is-swap');
    renderNext();
    document.dispatchEvent(new CustomEvent('works:filter'));
    if(scroll) scrollToRows();
    requestAnimationFrame(barUpdate);
  }
  document.addEventListener('click',e=>{
    const b=e.target.closest('.wcat,.wpill,.wnext,.wother__item,.filter'); if(!b) return;
    setCat(b.dataset.filter, b.classList.contains('wpill')||b.classList.contains('wnext')||b.classList.contains('wother__item'));
  });
  renderNext();

  // 短影音 secondary tabs: 全部短影音 / 劇情類 / 口播宣傳類 (a tab is hidden when it has no published item)
  const subTotal={}; WORKS.forEach(w=>{ if(w.sub) subTotal[w.sub]=(subTotal[w.sub]||0)+1; });
  const SUBS=[{k:'all',name:'全部短影音',n:catTotal.short||0}].concat(['story','promo'].filter(k=>subTotal[k]).map(k=>({k,name:SUB_NAME[k],n:subTotal[k]})));
  const subsEl=document.getElementById('worksSubs'), barSubs=document.getElementById('worksBarSubs');
  let curSub='all';
  const subHTML=cls=>SUBS.map(x=>`<button class="${cls}${x.k===curSub?' is-active':''}" data-sub="${x.k}" aria-pressed="${x.k===curSub}">${x.name}<b>${x.n}</b></button>`).join('');
  if(subsEl && SUBS.length>1){ subsEl.innerHTML=`<div class="wsubs__tabs" role="group" aria-label="短影音分類">${subHTML('wsub')}</div>`; }
  if(barSubs && SUBS.length>1){ barSubs.innerHTML=subHTML('wpill wpill--sub'); }
  function relayout(){ // renumber EP.xx / total and alternate sides over the visible rows
    const vis=[...grid.querySelectorAll('.ep')].filter(el=>!el.hidden);
    vis.forEach((el,i)=>{ const no=el.querySelector('.ep__no');
      if(no){ no.childNodes[1].textContent=pad(i+1); const em=no.querySelector('em'); if(em) em.textContent='/ '+pad(vis.length); }
      el.classList.toggle('ep--l',i%2===0); el.classList.toggle('ep--r',i%2===1); });
  }
  function showSubs(){
    const on=cur==='short' && SUBS.length>1;
    if(subsEl) subsEl.hidden=!on;
    if(barSubs) barSubs.hidden=!on;
    if(bar) bar.classList.toggle('has-subs',on);
  }
  function setSub(k,scroll){
    if(cur!=='short' || !SUBS.some(x=>x.k===k)) return;
    curSub=k;
    document.querySelectorAll('[data-sub]').forEach(x=>{ if(x.tagName!=='BUTTON') return; const on=x.dataset.sub===k; x.classList.toggle('is-active',on); x.setAttribute('aria-pressed',on?'true':'false'); });
    grid.querySelectorAll('.ep').forEach(el=>{ el.hidden=el.dataset.cat!=='short' || (k!=='all' && el.dataset.sub!==k); });
    relayout();
    grid.classList.remove('is-swap'); void grid.offsetWidth; grid.classList.add('is-swap');
    document.dispatchEvent(new CustomEvent('works:filter'));
    if(scroll) scrollToRows();
    requestAnimationFrame(barUpdate);
  }
  document.addEventListener('click',e=>{ const b=e.target.closest('button[data-sub]'); if(!b) return; setSub(b.dataset.sub, b.classList.contains('wpill')); });
  document.addEventListener('works:cat',()=>{ // switching main category resets the sub tab to 全部
    curSub='all';
    document.querySelectorAll('button[data-sub]').forEach(x=>{ const on=x.dataset.sub==='all'; x.classList.toggle('is-active',on); x.setAttribute('aria-pressed',on?'true':'false'); });
    relayout(); showSubs(); });
  showSubs();

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
