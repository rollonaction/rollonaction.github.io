/* Loads assets/works.json (managed in /admin/), then runs the scripts listed in data-then, in order.
   Source of truth for 精選作品 = works.json. */
(function(){
  const me=document.currentScript;
  const base=new URL('./',me.src).href;
  const then=(me.dataset.then||'').split(/\s+/).filter(Boolean);
  const run=()=>{ (function next(i){ if(i>=then.length) return;
    const s=document.createElement('script'); s.src=new URL(then[i],document.baseURI).href; s.async=false;
    s.onload=()=>next(i+1); s.onerror=()=>next(i+1); document.body.appendChild(s); })(0); };
  fetch(base+'works.json?v='+Math.floor(Date.now()/60000),{cache:'no-cache'})
    .then(r=>{ if(!r.ok) throw new Error('works.json '+r.status); return r.json(); })
    .then(d=>{ window.WORKS=Array.isArray(d)?d:(d.works||[]); })
    .catch(e=>{ console.warn('works.json load failed',e); window.WORKS=window.WORKS||[]; })
    .then(run);
})();
