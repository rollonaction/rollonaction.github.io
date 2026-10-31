/* 過檔 Roll ON — motion layer: intro, frame-break replicas, scroll-scrub type,
   cursor, magnetic buttons, card previews. Respects prefers-reduced-motion. */
(function(){
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const root = document.documentElement;
  const $ = (s,c=document)=>c.querySelector(s), $$=(s,c=document)=>[...c.querySelectorAll(s)];
  const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));

  /* ---------- 1. Intro (short logo reveal) ---------- */
  const intro = $('#intro');
  function introDone(){
    if(window.__introDone) return;
    window.__introDone = true; root.classList.add('intro-done');
    window.__heroReveal && window.__heroReveal();
    window.__heroLoad && window.__heroLoad();
  }
  if(!intro || reduce){ intro && intro.remove(); introDone(); }
  else{
    let out=false;
    const finish=()=>{ if(out) return; out=true; intro.classList.add('is-out'); setTimeout(introDone,220); setTimeout(()=>intro.remove(),1000); };
    setTimeout(finish,1150);
    intro.addEventListener('click',finish);
  }

  /* ---------- 2. Replica layers: type continues "through" a panel ---------- */
  const hero=$('.hero'), frame=$('.hero__frame'), ghost=$('.hero__ghost');
  const st=$('#statement'), panel=$('.statement__panel'), rep=$('.statement__replica');
  function syncReplicas(){
    if(hero && frame && ghost){
      Object.assign(ghost.style,{left:-frame.offsetLeft+'px',top:-frame.offsetTop+'px',width:hero.clientWidth+'px',height:hero.clientHeight+'px'});
    }
    if(st && panel && rep){
      Object.assign(rep.style,{left:-panel.offsetLeft+'px',top:-panel.offsetTop+'px',width:st.clientWidth+'px',height:st.clientHeight+'px'});
    }
  }
  syncReplicas(); addEventListener('resize',syncReplicas);
  document.fonts && document.fonts.ready.then(syncReplicas);

  /* ---------- 3. Scroll loop: progress bar, statement scrub, active nav ---------- */
  const bar=$('#navProgress'), fills=$$('.statement__fill');
  const bigs=$$('.section__big');
  function onScroll(){
    const max=document.documentElement.scrollHeight-innerHeight;
    bar && bar.style.setProperty('--sp',(max>0?scrollY/max:0).toFixed(4));
    bigs.forEach(b=>{ const r=b.getBoundingClientRect();
      b.style.setProperty('--fill',reduce?.4:clamp((innerHeight*.95-r.top)/(innerHeight*.7)).toFixed(3)); });
    if(st){
      let p=.62;
      if(!reduce){ const r=st.getBoundingClientRect(); p=clamp((innerHeight-r.top)/(innerHeight+r.height)); }
      st.style.setProperty('--p',p.toFixed(4));
      st.style.setProperty('--o',reduce?1:clamp((p-.08)/.32).toFixed(4));
      fills.forEach((f,i)=>f.style.setProperty('--q',reduce?1:clamp((p-.3-i*.14)/.18).toFixed(4)));
    }
  }
  let tick=false;
  addEventListener('scroll',()=>{ if(!tick){ tick=true; requestAnimationFrame(()=>{ onScroll(); tick=false; }); } },{passive:true});
  addEventListener('resize',onScroll); onScroll();

  const links=$$('#navLinks a[href^="#"]');
  if('IntersectionObserver' in window){
    const io=new IntersectionObserver(es=>es.forEach(e=>{
      if(e.isIntersecting) links.forEach(a=>a.classList.toggle('is-active',a.getAttribute('href')==='#'+e.target.id));
    }),{rootMargin:'-45% 0px -50% 0px'});
    ['services','about','works','contact'].forEach(id=>{const el=document.getElementById(id); el&&io.observe(el);});
  }

  /* ---------- 4. Cursor-reactive (desktop only) ---------- */
  if(fine && !reduce){
    root.classList.add('has-cursor');
    const cur=$('#cursor'); let x=innerWidth/2,y=innerHeight/2,cx=x,cy=y,raf=0;
    const loop=()=>{ cx+=(x-cx)*.22; cy+=(y-cy)*.22; cur.style.transform=`translate3d(${cx}px,${cy}px,0)`; raf=(Math.abs(x-cx)+Math.abs(y-cy)>.3)?requestAnimationFrame(loop):0; };
    addEventListener('mousemove',e=>{ x=e.clientX; y=e.clientY; cur.classList.add('is-on'); if(!raf) raf=requestAnimationFrame(loop);
      const t=e.target;
      cur.classList.toggle('is-play',!!t.closest('.js-play'));
      cur.classList.toggle('is-link',!t.closest('.js-play') && !!t.closest('a,button'));
    },{passive:true});
    document.addEventListener('mouseleave',()=>cur.classList.remove('is-on'));

    // hero: logo + giant word react subtly to the pointer
    if(hero){
      hero.addEventListener('mousemove',e=>{
        const r=hero.getBoundingClientRect();
        hero.style.setProperty('--mx',((e.clientX-r.left)/r.width*2-1).toFixed(3));
        hero.style.setProperty('--my',((e.clientY-r.top)/r.height*2-1).toFixed(3));
      });
      hero.addEventListener('mouseleave',()=>{hero.style.setProperty('--mx',0);hero.style.setProperty('--my',0);});
      setTimeout(()=>hero.classList.add('is-settled'),2600);
    }
    // magnetic buttons
    $$('.btn,.nav__cta,.footer__totop').forEach(b=>{
      b.addEventListener('mousemove',e=>{const r=b.getBoundingClientRect();
        b.style.transform=`translate(${((e.clientX-r.left)/r.width-.5)*10}px,${((e.clientY-r.top)/r.height-.5)*8}px)`;});
      b.addEventListener('mouseleave',()=>b.style.transform='');
    });
  }

  /* ---------- 5. Portfolio rows: muted looping background video ---------- */
  const grid=$('#worksGrid'); if(!grid) return;
  const saveData=navigator.connection && navigator.connection.saveData;
  const modalOpen=()=>document.getElementById('modal')?.classList.contains('is-open');
  const near=new Set();
  function stop(row){
    row.classList.remove('is-playing');
    const h=$('.ep__video',row);
    clearTimeout(row._rm); row._rm=setTimeout(()=>{ if(!row.classList.contains('is-playing')) h.innerHTML=''; },700);
  }
  function start(row){
    if(reduce || saveData || modalOpen() || row.hidden) return;
    const h=$('.ep__video',row); clearTimeout(row._rm);
    if($('iframe',h)) return;
    const id=row.dataset.id, s=row.dataset.start||3;
    h.classList.toggle('is-vertical',row.dataset.vertical==='true');
    const f=document.createElement('iframe');
    f.src=`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&mute=1&controls=0&start=${s}&loop=1&playlist=${id}&playsinline=1&rel=0&modestbranding=1&disablekb=1&iv_load_policy=3&fs=0&enablejsapi=1&origin=${encodeURIComponent(location.origin)}`;
    f.allow='autoplay; encrypted-media; picture-in-picture'; f.tabIndex=-1; f.title='背景預覽'; f.setAttribute('aria-hidden','true'); f.loading='lazy';
    f.addEventListener('load',()=>{ try{ f.contentWindow.postMessage(JSON.stringify({event:'listening',id:id,channel:'widget'}),'*'); }catch(_){} });
    h.appendChild(f);
  }
  const rowOf=src=>$$('.ep__video iframe',grid).find(f=>f.contentWindow===src)?.closest('.ep');
  addEventListener('message',e=>{
    let host=''; try{ host=new URL(e.origin).hostname; }catch(_){ return; }
    if(!/(^|\.)youtube(-nocookie)?\.com$/.test(host)) return;
    let d; try{ d=typeof e.data==='string'?JSON.parse(e.data):e.data; }catch(_){ return; }
    const row=d && rowOf(e.source); if(!row) return;
    if(d.event==='onReady') $('iframe',row).contentWindow.postMessage(JSON.stringify({event:'command',func:'playVideo',args:[]}),'*');
    const state = d.event==='onStateChange' ? d.info : (d.info && d.info.playerState);
    if(state===1 && near.has(row)) setTimeout(()=>near.has(row)&&row.classList.add('is-playing'),200);
  });
  const rows=$$('.ep',grid);
  if('IntersectionObserver' in window){
    // Ken Burns fallback runs only while a row is on screen
    const vis=new IntersectionObserver(es=>es.forEach(e=>e.target.classList.toggle('is-near',e.isIntersecting)),{rootMargin:'120px 0px'});
    // the video itself loads only when the row is actually in view (one at a time on touch)
    const io=new IntersectionObserver(es=>es.forEach(e=>{
      const r=e.target;
      if(e.isIntersecting){ near.add(r); clearTimeout(r._st); r._st=setTimeout(()=>near.has(r)&&start(r), fine?250:600); }
      else{ near.delete(r); clearTimeout(r._st); stop(r); }
    }),fine?{rootMargin:'-12% 0px -12% 0px',threshold:0.2}:{rootMargin:'-38% 0px -38% 0px',threshold:0});
    rows.forEach(r=>{ vis.observe(r); io.observe(r); });
  }
  const modal=document.getElementById('modal');
  if(modal) new MutationObserver(()=>{
    if(modalOpen()) rows.forEach(r=>{ r.classList.remove('is-playing'); $('.ep__video',r).innerHTML=''; });
    else near.forEach(r=>start(r));
  }).observe(modal,{attributes:true,attributeFilter:['class']});
  document.addEventListener('works:filter',()=>rows.forEach(r=>{ if(r.hidden){ near.delete(r); stop(r); } }));
})();
