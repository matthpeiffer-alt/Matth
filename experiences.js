/* Mes expériences — effets de la page */
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const FX = !!(window.gsap && window.ScrollTrigger) && !RM;
if (!FX) document.documentElement.classList.add('no-fx');
const $ = (s,r=document)=>r.querySelector(s), $$ = (s,r=document)=>[...r.querySelectorAll(s)];
const MOBILE = matchMedia('(max-width: 899px)').matches, FINE = matchMedia('(pointer:fine)').matches;
const INK = '#1C1606', clamp01 = v=>v<0?0:v>1?1:v, smooth = v=>{ v=clamp01(v); return v*v*(3-2*v); };

/* ---------- Lenis (défilement doux) ---------- */
let lenis = null;
if (FX && window.Lenis){ lenis = new Lenis({duration:1.15}); lenis.on('scroll', ScrollTrigger.update); gsap.ticker.add(t=>lenis.raf(t*1000)); gsap.ticker.lagSmoothing(0); }
$$('[data-scroll]').forEach(a=>a.addEventListener('click',e=>{ const t=$(a.getAttribute('href')); if(!t) return; e.preventDefault(); if(lenis) lenis.scrollTo(t,{duration:1.6,force:true}); else t.scrollIntoView({behavior:'smooth'}); }));

/* ---------- Curseur, étincelles, boutons magnétiques ---------- */
(function(){
  const cur=$('#cursor'); let x=innerWidth/2,y=innerHeight/2,cx=x,cy=y;
  addEventListener('mousemove',e=>{x=e.clientX;y=e.clientY;});
  (function l(){cx+=(x-cx)*.18;cy+=(y-cy)*.18;cur.style.transform=`translate(${cx}px,${cy}px)`;requestAnimationFrame(l);})();
  $$('a,button,.chip,.side div').forEach(el=>{el.addEventListener('mouseenter',()=>cur.classList.add('big'));el.addEventListener('mouseleave',()=>cur.classList.remove('big'));});
  const cv=$('#sparks'),ctx=cv.getContext('2d'); let sp=[];
  const fit=()=>{cv.width=innerWidth*devicePixelRatio;cv.height=innerHeight*devicePixelRatio;ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);}; fit(); addEventListener('resize',fit);
  addEventListener('click',e=>{ if(RM) return; for(let i=0;i<10;i++) sp.push({x:e.clientX,y:e.clientY,a:i/10*Math.PI*2,t:0}); });
  (function d(){ ctx.clearRect(0,0,innerWidth,innerHeight); sp=sp.filter(s=>s.t<1); sp.forEach(s=>{ s.t+=.045; const r=10+s.t*36,l=12*(1-s.t); ctx.strokeStyle=`rgba(239,68,68,${1-s.t})`; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(s.x+Math.cos(s.a)*r,s.y+Math.sin(s.a)*r); ctx.lineTo(s.x+Math.cos(s.a)*(r+l),s.y+Math.sin(s.a)*(r+l)); ctx.stroke(); }); requestAnimationFrame(d); })();
  $$('.mag').forEach(b=>{ b.addEventListener('mousemove',e=>{const r=b.getBoundingClientRect(); b.style.transform=`translate(${(e.clientX-r.left-r.width/2)*.22}px,${(e.clientY-r.top-r.height/2)*.3}px)`;}); b.addEventListener('mouseleave',()=>b.style.transform=''); });
})();

function splitLetters(el){ const out=[]; [...el.childNodes].forEach(nd=>{ if(nd.nodeType!==3) return;
  [...nd.textContent].forEach(c=>{ const s=document.createElement('span'); s.className='lt'; s.textContent=c; el.insertBefore(s,nd); out.push(s); }); nd.remove(); }); return out; }
function splitWords(el){ const out=[]; [...el.childNodes].forEach(nd=>{ if(nd.nodeType!==3) return;
  nd.textContent.split(/(\s+)/).forEach(p=>{ if(!p) return; if(/^\s+$/.test(p)){ el.insertBefore(document.createTextNode(p),nd); return; } const s=document.createElement('span'); s.className='w'; s.textContent=p; el.insertBefore(s,nd); out.push(s); }); nd.remove(); }); return out; }

/* ============================================================
   EN-TÊTE : le mot sort du flou, un surligneur le traverse,
   puis les lettres s'écartent du curseur (sur mobile, un curseur fantôme se promène)
   ============================================================ */
const word=$('#word'), bar=$('.bar',word), letters=splitLetters($('.tx',word));
function fitWord(){ word.style.removeProperty('--gfs'); const avail=word.parentElement.clientWidth, w=word.getBoundingClientRect().width, fs=parseFloat(getComputedStyle(word).fontSize);
  if(w>0) word.style.setProperty('--gfs',Math.min(fs*avail*.985/w,innerWidth*.16).toFixed(1)+'px'); }
fitWord(); if(document.fonts) document.fonts.ready.then(()=>{ fitWord(); if(FX) ScrollTrigger.refresh(); });
let lastW=innerWidth; addEventListener('resize',()=>{ if(innerWidth!==lastW){ lastW=innerWidth; fitWord(); } });

let live=false;
if(FX){
  gsap.registerPlugin(ScrollTrigger);
  gsap.to('#progress',{scaleX:1,ease:'none',scrollTrigger:{start:0,end:'max',scrub:true}});
  gsap.set(letters,{color:'#BDB8AE'}); gsap.set(bar,{scaleX:0,rotate:-1.2});   // fond clair : les lettres partent en gris et foncent au passage du surligneur
  const tl=gsap.timeline({delay:.15});
  tl.from('.giant .g1',{opacity:0,y:30,filter:'blur(10px)',duration:1,ease:'expo.out'})
    .from(letters,{opacity:0,yPercent:45,filter:'blur(18px)',duration:1.2,ease:'expo.out',stagger:.05},'-=.75')
    .from('.phero .meta',{opacity:0,duration:.9,stagger:.12},'-=1')
    .to(bar,{scaleX:1,duration:1.15,ease:'power2.inOut'},'-=.35')
    .to(letters,{color:INK,duration:.18,ease:'none',stagger:1.0/letters.length},'<+.1')
    .call(()=>{ gsap.set(letters,{clearProps:'transform'}); live=true; });
  gsap.to('.giant',{yPercent:-24,opacity:0,filter:'blur(10px)',scale:.95,transformOrigin:'0% 100%',ease:'none',scrollTrigger:{trigger:'.phero',start:'top top',end:'bottom top',scrub:true}});
  gsap.to('.blobs',{yPercent:25,ease:'none',scrollTrigger:{trigger:'.phero',start:'top top',end:'bottom top',scrub:true}});
}
(function(){
  if(!FX) return;
  const hero=$('.phero'); let mx=-1e4,my=-1e4,inside=false;
  hero.addEventListener('pointermove',e=>{ if(e.pointerType!=='mouse') return; mx=e.clientX; my=e.clientY; inside=true; });
  hero.addEventListener('pointerleave',()=>inside=false);
  const st=letters.map(()=>({x:0,y:0,r:0,vx:0,vy:0,vr:0}));
  (function loop(t){ requestAnimationFrame(loop); if(!live || scrollY>innerHeight) return;
    t/=1000; const R=word.getBoundingClientRect(), H=R.height;
    let px=mx, py=my;
    if(!inside){ px=R.left+R.width*(.5+.48*Math.sin(t*.5)); py=R.top+H*(.5+.35*Math.sin(t*1.25)); }
    const rad=H*(inside?1.15:.9), k=H*(inside?.3:.18);
    letters.forEach((l,i)=>{ const s=st[i], cx=R.left+l.offsetLeft+l.offsetWidth/2, cy=R.top+H/2;
      const dx=cx-px, dy=cy-py, d=Math.hypot(dx,dy)||1, f=Math.pow(Math.max(0,1-d/rad),2);
      const tx=dx/d*f*k, ty=dy/d*f*k, tr=dx/d*f*16;
      s.vx=(s.vx+(tx-s.x)*.12)*.78; s.vy=(s.vy+(ty-s.y)*.12)*.78; s.vr=(s.vr+(tr-s.r)*.12)*.78;
      s.x+=s.vx; s.y+=s.vy; s.r+=s.vr;
      l.style.transform=`translate(${s.x.toFixed(2)}px,${s.y.toFixed(2)}px) rotate(${s.r.toFixed(2)}deg)`; });
  })(0);
})();

/* ============================================================
   TITRES ET TEXTES : mot à mot hors du flou, puis le surligneur passe sous le mot-clé
   ============================================================ */
if(FX){
  $$('.xhead').forEach(h=>gsap.from(h.children,{opacity:0,x:-24,filter:'blur(8px)',duration:.9,ease:'expo.out',stagger:.1,scrollTrigger:{trigger:h,start:'top 88%'}}));
  $$('.xtitle,.tasks-h').forEach(t=>{ const ws=splitWords(t), hl=$('.hl',t), stt={trigger:t,start:'top 86%'};
    gsap.from([...ws,hl],{opacity:0,y:50,filter:'blur(16px)',duration:1.2,ease:'expo.out',stagger:.09,scrollTrigger:stt});
    gsap.fromTo(hl,{'--k':0},{'--k':1,duration:1,ease:'power2.inOut',delay:.55+ws.length*.09,scrollTrigger:stt}); });
  $$('.xpitch').forEach(p=>{ const ws=splitWords(p);
    gsap.fromTo(ws,{opacity:.08,filter:'blur(8px)',y:12},{opacity:1,filter:'blur(0px)',y:0,stagger:.1,ease:'none',scrollTrigger:{trigger:p,start:'top 92%',end:'top 55%',scrub:true}}); });
  gsap.from('.xgrid .btn',{opacity:0,y:24,scale:.9,duration:.8,ease:'back.out(2)',scrollTrigger:{trigger:'.xgrid',start:'top 82%'}});
}

/* ============================================================
   LA REFONTE : la fenêtre se redresse, puis le nouveau site remplace l'ancien au défilement ;
   on peut aussi faire glisser la poignée
   ============================================================ */
(function(){
  const br=$('#browser'), view=$('#bview'), tn=$('.t-new',br), to=$('.t-old',br);
  const cut={v:FX?0:50};
  function setCut(v){ cut.v=v; br.style.setProperty('--cut',v.toFixed(2)+'%'); tn.style.opacity=v>7?1:0; to.style.opacity=v<93?1:0; }
  setCut(cut.v);
  let auto=null;
  if(FX){
    gsap.fromTo(br,{rotateX:24,y:90,opacity:0,transformPerspective:1500,transformOrigin:'50% 100%'},{rotateX:0,y:0,opacity:1,ease:'none',scrollTrigger:{trigger:br,start:'top 98%',end:'top 50%',scrub:true}});
    auto=gsap.to(cut,{v:100,ease:'none',onUpdate:()=>setCut(cut.v),scrollTrigger:{trigger:br,start:'top 72%',end:'bottom 78%',scrub:.8}});
  }
  let drag=false;
  const at=e=>{ const r=view.getBoundingClientRect(); setCut(Math.max(0,Math.min(100,(e.clientX-r.left)/r.width*100))); };
  view.addEventListener('pointerdown',e=>{ drag=true; if(auto){ auto.scrollTrigger.kill(); auto.kill(); auto=null; } view.setPointerCapture(e.pointerId); at(e); });
  view.addEventListener('pointermove',e=>{ if(drag) at(e); });
  const up=()=>drag=false; view.addEventListener('pointerup',up); view.addEventListener('pointercancel',up);
})();

/* ============================================================
   CE QUE J'AI APPRIS : la ligne se surligne (au survol sur ordinateur, au défilement sur téléphone)
   ============================================================ */
(function(){
  const rows=$$('.task');
  if(FINE) rows.forEach(r=>{ r.addEventListener('mouseenter',()=>r.classList.add('on')); r.addEventListener('mouseleave',()=>r.classList.remove('on')); });
  if(!FX) return;
  gsap.from(rows,{opacity:0,x:-50,filter:'blur(12px)',duration:1,ease:'expo.out',stagger:.09,scrollTrigger:{trigger:'.tasks',start:'top 85%'}});
  if(!FINE) rows.forEach(r=>ScrollTrigger.create({trigger:r,start:'top 52%',end:'bottom 52%',toggleClass:'on'}));
})();

/* ============================================================
   LA COLO : le « 3 » géant sort du flou, deux échos en contour s'en détachent au défilement,
   puis chaque compétence se surligne quand on arrive dessus
   ============================================================ */
(function(){
  if(!FX) return;
  const st={trigger:'.years',start:'top 80%'};
  gsap.from('.y3 b',{opacity:0,scale:1.3,filter:'blur(26px)',transformOrigin:'0% 100%',duration:1.5,ease:'expo.out',scrollTrigger:st});
  gsap.fromTo('.y3 i',{xPercent:0,yPercent:0,opacity:0},{xPercent:i=>[16,8][i],yPercent:i=>[-12,-6][i],opacity:1,ease:'none',scrollTrigger:{trigger:'.years',start:'top 85%',end:'bottom 25%',scrub:true}});
  gsap.from('.yt',{opacity:0,x:-40,filter:'blur(14px)',duration:1.2,ease:'expo.out',delay:.25,scrollTrigger:st});
  gsap.from('.facts li',{opacity:0,x:-30,filter:'blur(8px)',duration:.9,ease:'expo.out',stagger:.12,delay:.5,scrollTrigger:st});
  $$('.skills li').forEach(li=>{ const s=$('span',li);
    gsap.from(li,{opacity:0,y:30,filter:'blur(10px)',duration:.9,ease:'expo.out',scrollTrigger:{trigger:li,start:'top 92%'}});
    gsap.fromTo(s,{'--k':0},{'--k':1,ease:'none',scrollTrigger:{trigger:li,start:'top 80%',end:'top 52%',scrub:true}}); });
})();

/* ---------- FIN : la carte des dates arrive comme sur les autres pages ---------- */
if(FX){
  gsap.from('.ncard',{opacity:0,y:60,scale:.97,duration:1.1,ease:'expo.out',scrollTrigger:{trigger:'.ncard',start:'top 85%'}});
  addEventListener('load',()=>ScrollTrigger.refresh());
}
