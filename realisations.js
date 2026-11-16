/* Réalisations personnelles : haut de page, voyages, activités manuelles, passions (scènes plein écran), projets */
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const FX = !!(window.gsap && window.ScrollTrigger) && !RM;
if (!FX) document.documentElement.classList.add('no-fx');
const $ = (s,r=document)=>r.querySelector(s), $$ = (s,r=document)=>[...r.querySelectorAll(s)];
const MOBILE = matchMedia('(max-width: 899px)').matches, FINE = matchMedia('(pointer:fine)').matches;
const DPR = Math.min(devicePixelRatio||1, 2);
function whenVisible(el, cb, margin='80px'){ if(!('IntersectionObserver' in window)){ cb(true); return; } new IntersectionObserver(es=>es.forEach(e=>cb(e.isIntersecting)),{rootMargin:margin}).observe(el); }

/* ---------- une image qui échoue (connexion coupée par le serveur local) est retentée quelques fois ---------- */
addEventListener('error',e=>{ const im=e.target; if(!(im instanceof HTMLImageElement)) return; const n=+(im.dataset.retry||0); if(n>=7||location.protocol==='file:') return;
  im.dataset.retry=n+1; const u=im.getAttribute('src').replace(/[?&]r=\d+$/,''); setTimeout(()=>{ im.src=u+(u.includes('?')?'&':'?')+'r='+(n+1); },300*(n+1)); },true);
$$('img').forEach(im=>{ if(im.complete&&!im.naturalWidth&&im.getAttribute('src')) im.dispatchEvent(new Event('error')); });

/* ---------- la page repart toujours du haut (tout est piloté par le défilement), Lenis ---------- */
if('scrollRestoration' in history) history.scrollRestoration='manual';
scrollTo(0,0);
let lenis = null;
if (FX){ gsap.registerPlugin(ScrollTrigger); if(window.Lenis){ lenis = new Lenis({duration:1.1}); lenis.on('scroll', ScrollTrigger.update); gsap.ticker.add(t=>lenis.raf(t*1000)); gsap.ticker.lagSmoothing(0); } }
$$('[data-scroll]').forEach(a=>a.addEventListener('click',e=>{ const t=$(a.getAttribute('href')); if(!t) return; e.preventDefault(); if(lenis) lenis.scrollTo(t,{duration:1.6,force:true}); else t.scrollIntoView({behavior:'smooth'}); }));

/* ---------- curseur point, boutons magnétiques ---------- */
(function(){
  const dot=$('#dot');
  if(FINE && !RM){ let x=-99,y=-99,cx=x,cy=y; addEventListener('mousemove',e=>{x=e.clientX;y=e.clientY;});
    (function l(){ cx+=(x-cx)*.22; cy+=(y-cy)*.22; dot.style.transform=`translate(${cx}px,${cy}px)`; requestAnimationFrame(l); })();
    $$('a,button,video,.card').forEach(el=>{ el.addEventListener('mouseenter',()=>dot.classList.add('big')); el.addEventListener('mouseleave',()=>dot.classList.remove('big')); }); }
  $$('.mag').forEach(b=>{ b.addEventListener('mousemove',e=>{const r=b.getBoundingClientRect(); b.style.transform=`translate(${(e.clientX-r.left-r.width/2)*.22}px,${(e.clientY-r.top-r.height/2)*.3}px)`;}); b.addEventListener('mouseleave',()=>b.style.transform=''); });
})();

/* ---------- haut de page : le texte apparaît mot à mot, les photos défilent en continu ---------- */
if(FX){
  gsap.timeline({delay:.1})
    .from('.tagline',{opacity:0,y:10,duration:.6,ease:'power2.out'})
    .from('.h1 .w',{opacity:0,y:14,duration:.7,ease:'power3.out',stagger:.07},'-=.3')
    .from('.hdesc',{opacity:0,y:10,duration:.6,ease:'power2.out'},'-=.35')
    .from('.cta',{opacity:0,y:10,scale:.95,duration:.6,ease:'back.out(1.6)'},'-=.4')
    .from('.marquee',{opacity:0,y:40,duration:1.1,ease:'expo.out'},'-=.6');
}

/* ============================================================
   VOYAGES : la section reste en place et la rangée de pays défile à l'horizontale ;
   chaque carte part de travers et finit de travers dans l'autre sens. Créé avant les autres : son épinglage décale la suite.
   ============================================================ */
(function(){
  if(!FX) return;
  const pin=$('.hs-pin'), row=$('#hs-row'), cards=$$('.pc',row);
  const dist=()=>Math.max(0,row.scrollWidth-innerWidth);
  gsap.from('#voyages .vhead > *',{opacity:0,y:30,duration:1,ease:'expo.out',stagger:.08,scrollTrigger:{trigger:'#voyages',start:'top 75%'}});
  const tween=gsap.to(row,{x:()=>-dist(),ease:'none',scrollTrigger:{trigger:pin,pin:true,scrub:.6,start:'top top',end:()=>'+='+dist()*.7,invalidateOnRefresh:true}});
  const rnd=(min,span)=>(Math.random()*span+min)*(Math.random()<.5?1:-1);
  cards.forEach(card=>{ const v={x:rnd(18,18),y:rnd(3,4),r:rnd(6,8)};
    gsap.fromTo(card,{xPercent:v.x,yPercent:v.y,rotation:v.r},{xPercent:-v.x,yPercent:-v.y,rotation:-v.r,ease:'none',scrollTrigger:{trigger:card,containerAnimation:tween,start:'left 120%',end:'right -20%',scrub:true}}); });
  gsap.to('#progress',{scaleX:1,ease:'none',scrollTrigger:{start:0,end:'max',scrub:true}});
})();

/* ---------- apparitions communes ---------- */
if(FX){
  $$('.part .eyebrow,.part .h2,.part .lead').forEach(el=>gsap.from(el,{opacity:0,y:30,duration:1,ease:'expo.out',scrollTrigger:{trigger:el,start:'top 90%'}}));
  gsap.from('.pgame .card,.pgroup',{opacity:0,y:60,duration:1,ease:'expo.out',stagger:.1,scrollTrigger:{trigger:'.pgame',start:'top 85%'}});
  gsap.from('.ncard',{opacity:0,y:60,scale:.97,duration:1.1,ease:'expo.out',scrollTrigger:{trigger:'.ncard',start:'top 85%'}});
}

/* « Mes activités manuelles » : chaque lettre est posée sur l'intérieur d'un cylindre (les bords viennent vers nous,
   le centre s'éloigne), le même creux que la rangée d'images ; le titre arrive à plat et se creuse pendant le défilement */
(function(){
  const h=$('#cv'); if(!h) return; const cs=$$('.ch',h); let pos=[], W=1;
  // positions mesurées sans transformation, par rapport au centre du titre, ligne par ligne (le titre passe sur deux lignes sur téléphone)
  let lines=[];
  const measure=()=>{ W=h.clientWidth; const hr=h.getBoundingClientRect(), cx=hr.left+hr.width/2, m=new Map();
    pos=cs.map((c,i)=>{ const r=c.getBoundingClientRect(), k=Math.round(r.top); if(!m.has(k)) m.set(k,[]); m.get(k).push(i); return {x:r.left+r.width/2-cx,w:r.width}; });
    lines=[...m.values()]; };
  const B={b:RM?1:0};
  // creux : les lettres grossissent vers les bords (comme les images de la rangée), tournées vers le centre, et restent collées entre elles
  const apply=()=>{ const b=B.b, K=.6;
    lines.forEach(ix=>{ const half=Math.max(...ix.map(i=>Math.abs(pos[i].x)))||1, s=ix.map(i=>1+K*b*Math.min(1,(pos[i].x/half)**2));
      const nc=[]; let cur=0; ix.forEach((i,j)=>{ if(j){ const p=ix[j-1], gap=pos[i].x-pos[p].x-(pos[i].w+pos[p].w)/2; cur+=pos[p].w*s[j-1]/2+gap*(s[j]+s[j-1])/2+pos[i].w*s[j]/2; } nc.push(cur); });
      const off=(pos[ix[0]].x+pos[ix[ix.length-1]].x)/2-(nc[0]+nc[nc.length-1])/2;
      ix.forEach((i,j)=>{ const a=-Math.sign(pos[i].x)*Math.min(1,Math.abs(pos[i].x)/half)*30*b;
        cs[i].style.transform=`translateX(${(nc[j]+off-pos[i].x).toFixed(1)}px) perspective(700px) rotateY(${a.toFixed(1)}deg) scale(${s[j].toFixed(3)})`; }); }); };
  const re=()=>{ cs.forEach(c=>c.style.transform=''); measure(); apply(); };
  re(); if(document.fonts) document.fonts.ready.then(re); let lw=innerWidth; addEventListener('resize',()=>{ if(innerWidth!==lw){ lw=innerWidth; re(); } });
  if(FX){ gsap.to(B,{b:1,ease:'none',onUpdate:apply,scrollTrigger:{trigger:h,start:'top 95%',end:'top 35%',scrub:.6}});
    gsap.from(cs,{opacity:0,duration:.8,ease:'power2.out',stagger:{each:.03,from:'center'},scrollTrigger:{trigger:h,start:'top 90%'}}); }
  else { B.b=1; apply(); }
})();

/* ============================================================
   ACTIVITÉS MANUELLES : rangée d'images qui tourne à l'intérieur d'un cylindre (TiltedGridHero, sans React).
   Chaque image est coupée en bandes verticales, chacune une facette du cylindre ; la tuile entière tourne,
   et reprend l'image suivante à chaque fois qu'elle repasse hors de l'écran.
   ============================================================ */
(function(){
  const el=$('#tilt'); if(!el) return; const band=$('.band',el), imgs=JSON.parse(el.dataset.imgs);
  const SLICES=MOBILE?10:16, CAMERA=1.6, MAXW=55, TILE=MOBILE?44:54, ASPECT=4/3, GAP=6, AXIS=50, BEND=72*Math.PI/180, FADE=10, SPEED=MOBILE?3.4:4;
  const arc=b=>(CAMERA-1+Math.cos(b))/(2*CAMERA*Math.sin(b));
  const deg=r=>r*180/Math.PI, rd=n=>+n.toFixed(4);
  function measure(w,h){ const th=Math.min(TILE/100*h,MAXW/100*w/ASPECT), R=w*arc(BEND); if(!(th>0)||!(R>0)) return null;
    const unit=deg(th/R), pitch=(ASPECT+GAP/100)*unit, limit=deg(BEND)+ASPECT*unit/2, columns=Math.min(60,Math.max(2,Math.ceil(2*limit/pitch)));
    const sweep=rd(columns*pitch/2); return {columns,sweep,unit:rd(unit),limit:rd(Math.min(sweep,limit))}; }
  const u=n=>`calc(${rd(n)} * min(${TILE}cqh, ${rd(MAXW/ASPECT)}cqw))`;
  const r=100*arc(BEND), radius=`${r.toFixed(3)}cqw`, turn=d=>`translateZ(${radius}) rotateY(${rd(d)}deg) translateZ(-${radius})`;
  const style=document.createElement('style'); document.head.appendChild(style);
  let key='';
  function build(){ const m=measure(el.clientWidth,el.clientHeight); if(!m) return; const k=m.columns+'|'+m.sweep+'|'+m.unit; if(k===key) return; key=k;
    const {columns,sweep,unit,limit}=m, hide=rd((sweep-limit)/(2*sweep||1)*100), dur=columns*SPEED, share=ASPECT/SLICES;
    style.textContent=`@keyframes tgo{from{transform:${turn(-sweep)}}to{transform:${turn(sweep)}}0%,${hide}%,${100-hide}%,100%{visibility:hidden}${hide+.001}%,${100-hide-.001}%{visibility:visible}}`+
      (RM?'.tilt .tile{animation-play-state:paused!important}':'');
    const mask=`linear-gradient(90deg,transparent,#000 ${FADE}%,#000 ${100-FADE}%,transparent)`;
    Object.assign(band.style,{perspective:`${(r*CAMERA).toFixed(3)}cqw`,perspectiveOrigin:`50% ${AXIS}%`,maskImage:mask,webkitMaskImage:mask});
    band.innerHTML='';
    for(let t=0;t<columns;t++){ const first=columns-1-t, tile=document.createElement('div'); tile.className='tile';
      Object.assign(tile.style,{left:`calc(50% - ${u(ASPECT/2)})`,top:`calc(${AXIS}% - ${u(.5)})`,width:u(ASPECT),height:u(1),animation:`tgo ${dur}s linear ${-t*SPEED}s infinite`});
      const setImg=i=>{ const im=imgs[i%imgs.length]; tile.querySelectorAll('img').forEach(x=>{ x.src=im.src; }); };
      for(let k=0;k<SLICES;k++){ const s=document.createElement('div'); s.className='sl'+(k===0?' f':'')+(k===SLICES-1?' l':'');
        Object.assign(s.style,{left:u((ASPECT-share)/2),width:k===SLICES-1?u(share):`calc(${u(share)} + 1px)`,height:u(1),transform:turn((ASPECT/2-(k+.5)*share)*unit)});
        const im=document.createElement('img'); im.alt=''; im.draggable=false; im.decoding='async'; Object.assign(im.style,{left:u(-k*share),width:u(ASPECT),height:u(1)}); s.appendChild(im); tile.appendChild(s); }
      setImg(first);
      tile.addEventListener('animationiteration',e=>{ const lap=Math.round(e.elapsedTime/dur); setImg(lap*columns+first); });
      band.appendChild(tile); }
    band.style.opacity=1; }
  imgs.forEach(i=>{ new Image().src=i.src; });
  if('ResizeObserver' in window) new ResizeObserver(build).observe(el); else build();
  whenVisible(el,v=>el.classList.toggle('off',!v));
})();

/* ============================================================
   LES PASSIONS : chaque passion est une scène plein écran ; la scène reste en place pendant que le défilement
   fait avancer son animation (qui se termine pile quand la scène se décolle), puis la suivante glisse par-dessus
   pendant que la précédente recule en parallaxe
   ============================================================ */
function scene(id, build){ const sc=$(id); if(!sc||!FX) return null;
  // pas d'invalidateOnRefresh : les tweens « from » reliraient leur état de départ comme état d'arrivée et resteraient figés
  const tl=gsap.timeline({defaults:{ease:'none'},scrollTrigger:{trigger:sc,start:'top top',end:'bottom bottom',scrub:.6}});
  build(tl,sc,$('.stage',sc)); tl.to({},{duration:.03}); return tl; }
const toCenter=(el,stage)=>({x:()=>stage.clientWidth/2-(el.offsetLeft),y:()=>stage.clientHeight/2-(el.offsetTop)});
if(FX){ const scenes=$$('.scene');
  scenes.forEach((sc,i)=>{ const st=$('.stage',sc);
    gsap.to(st,{yPercent:38,scale:.9,filter:'brightness(.4)',ease:'none',scrollTrigger:{trigger:sc,start:'bottom bottom',end:'bottom top',scrub:true}});
    if(i>0) gsap.fromTo(st,{borderRadius:'56px 56px 0 0'},{borderRadius:'0px 0px 0 0',ease:'none',scrollTrigger:{trigger:sc,start:'top bottom',end:'top top',scrub:true}}); }); }

/* Mes passions → F1 : « MES PASSIONS » est découpé dans un voile clair (on voit la F1 à travers les lettres),
   on zoome dans le « I » jusqu'à ce que la voiture remplisse l'écran ; puis le pilote préféré, puis la tache liquide
   qui efface la carrosserie s'agrandit (elle suit aussi la souris) */
const F1 = {xr:0};
(function(){
  const st=$('#f1stage'), fr=$('#f1frame'), svg=$('#xr'), car=$('#car'), c=$('#xc'), turb=$('#xt'), disp=$('#xd'), VW=1672, VH=941;
  // les deux images sont chargées à part et réessayées en cas d'échec réseau, puis seulement accrochées au dessin
  $$('image',car).forEach(im=>{ const url=im.dataset.src; let n=0;
    (function go(){ const i=new Image(), u=n?url+'?r='+n:url; i.onload=()=>im.setAttribute('href',u); i.onerror=()=>{ if(++n<9) setTimeout(go,300*n); }; i.src=u; })(); });
  if(MOBILE) svg.setAttribute('preserveAspectRatio','xMidYMid meet');
  if(!FINE) $('#f1hint').textContent='Sous la carrosserie ↓';
  let mx=0,my=0,hover=false,cx=836,cy=520,r=0,seed=0,px=cx,py=cy,vis=false;
  fr.addEventListener('pointermove',e=>{ if(e.pointerType!=='mouse') return; const pt=svg.createSVGPoint(); pt.x=e.clientX; pt.y=e.clientY; const p=pt.matrixTransform(svg.getScreenCTM().inverse()); mx=p.x; my=p.y; hover=true; });
  fr.addEventListener('pointerleave',()=>hover=false);
  (function loop(now){ requestAnimationFrame(loop); if(!vis) return; const t=now/1000;
    const tx=hover?mx:VW*(.5+.16*Math.sin(t*.5)), ty=hover?my:VH*(.55+.06*Math.sin(t*.9));
    const tr=Math.max(F1.xr*950, hover?240:0);
    // tache invisible : on ne retouche pas le filtre à chaque image (sinon tout le dessin est recalculé pendant le zoom du titre)
    if(tr===0 && r<.5){ if(r!==0){ r=0; c.setAttribute('r','0'); } return; }
    cx+=(tx-cx)*.08; cy+=(ty-cy)*.08; r+=(tr-r)*.12; const sp=Math.hypot(cx-px,cy-py); px=cx; py=cy; seed+=.018; const br=Math.sin(seed)*.005+.018;
    c.setAttribute('cx',cx.toFixed(1)); c.setAttribute('cy',cy.toFixed(1)); c.setAttribute('r',r.toFixed(1));
    turb.setAttribute('baseFrequency',`${(br+sp*.0003).toFixed(4)} ${(br*1.4+sp*.0003).toFixed(4)}`); disp.setAttribute('scale',Math.min(60+sp*6,130).toFixed(1)); })(0);
  whenVisible(fr,v=>vis=v);

  /* le voile « MES PASSIONS » : un rectangle clair masqué par le texte (lettres noires dans le masque = trous) */
  const pm=$('#pm'), pmr=$('#pmr'), pmo=$('#pmo'), zg=$('#pmz'), ig=$('#pmi'), NS='http://www.w3.org/2000/svg', Z={cx:0,cy:0,S:40,p:0};
  const zg2=$('#pmz2'), ol=$('#pml');   // contour foncé des lettres, posé par-dessus le voile pour qu'on lise bien « MES PASSIONS »
  // zoom géométrique (S^p) : la vitesse de zoom paraît constante, au lieu de traîner puis de s'emballer d'un coup
  function setZ(){ const s=Math.pow(Z.S,Z.p), tr=`translate(${Z.cx.toFixed(1)} ${Z.cy.toFixed(1)}) scale(${s.toFixed(3)}) translate(${(-Z.cx).toFixed(1)} ${(-Z.cy).toFixed(1)})`;
    zg.setAttribute('transform',tr); zg2.setAttribute('transform',tr); ol.style.opacity=Math.max(0,1-Z.p*3).toFixed(3); pm.style.visibility=Z.p>=.999?'hidden':'visible'; }
  function layout(){ const W=st.clientWidth, H=st.clientHeight, port=H>W*1.05; pm.setAttribute('viewBox',`0 0 ${W} ${H}`);
    [pmr,pmo].forEach(x=>{ x.setAttribute('width',W); x.setAttribute('height',H); });
    ig.innerHTML=''; const lines=port?['MES','PASSIONS']:['MES PASSIONS'];
    const ts=lines.map(t=>{ const e=document.createElementNS(NS,'text'); e.textContent=t; e.setAttribute('text-anchor','middle'); e.setAttribute('x',W/2);
      e.setAttribute('font-family','Anton, Impact, sans-serif'); e.setAttribute('font-size','100'); e.setAttribute('fill','#000'); ig.appendChild(e); return e; });
    const maxw=Math.max(...ts.map(t=>t.getComputedTextLength()))||1; let fs=Math.min(100*W*(port?.84:.88)/maxw, H*(port?.3:.44));
    ts.forEach(t=>t.setAttribute('font-size',fs.toFixed(1)));
    const lh=fs*.95, top=H/2-lh*lines.length/2; ts.forEach((t,i)=>t.setAttribute('y',(top+lh*(i+.5)+fs*.36).toFixed(1)));
    const last=ts[ts.length-1], k=last.textContent.indexOf('I'), ex=last.getExtentOfChar(k);
    Z.cx=ex.x+ex.width/2; Z.cy=ex.y+ex.height/2; Z.S=Math.max(W,H)/Math.max(4,ex.width*.45)*1.3;
    ol.innerHTML=''; ts.forEach(t=>{ const c=t.cloneNode(true); c.removeAttribute('fill'); ol.appendChild(c); }); setZ(); }
  if(!FX) return;
  layout(); if(document.fonts) document.fonts.ready.then(layout); let lw=innerWidth; addEventListener('resize',()=>{ if(innerWidth!==lw){ lw=innerWidth; layout(); } });
  gsap.fromTo([ig,zg2],{opacity:0},{opacity:1,duration:1.2,ease:'power2.out',scrollTrigger:{trigger:'#passions',start:'top 85%'}});
  scene('#passions',(tl)=>{
    // sur un écran vertical la voiture est petite : elle remplit d'abord les lettres, puis reprend sa taille pendant le zoom
    if(st.clientHeight>st.clientWidth*1.05) tl.fromTo(car,{scale:2.8,svgOrigin:'836 520'},{scale:1,svgOrigin:'836 520',duration:.3,ease:'power2.inOut'},.06);
    tl.to(Z,{p:1,duration:.3,ease:'power1.inOut',onUpdate:setZ},.06)
      .fromTo('#pstag',{opacity:0},{opacity:1,duration:.04},.36)
      .fromTo('#driver',{xPercent:-120,opacity:0},{xPercent:0,opacity:1,duration:.08,ease:'back.out(1.4)'},.42)
      .fromTo('#f1hint',{opacity:0},{opacity:1,duration:.04},.58)
      .to(F1,{xr:1,duration:.3},.56)
      .to({},{duration:.1},.86);
  });
})();

/* Tour de France : fond jaune, titre qui saute, et les photos explosent depuis le centre dans tous les sens */
scene('#sc-tdf',(tl,sc,st)=>{
  tl.from($$('.big .ch',sc),{yPercent:140,scale:.3,stagger:.01,duration:.12,ease:'back.out(2.2)'},0);
  $$('.pop',sc).forEach((c,i)=>tl.from(c,{...toCenter(c,st),scale:0,rotation:()=>gsap.utils.random(-120,120),duration:.13,ease:'back.out(1.5)'},.12+i*.085));
  tl.to($('.big',sc),{scale:.86,duration:.3},.6).to($$('.pop',sc),{scale:1.08,duration:.3},.6)
    .fromTo($('.cap2',sc),{xPercent:-120,opacity:0},{xPercent:0,opacity:1,duration:.1,ease:'back.out(1.4)'},.7);
});

/* Football : un tableau tactique à la craie. Les lignes se tracent, les joueurs apparaissent, les passes se dessinent
   pendant que le ballon les suit jusqu'au tir ; le filet tremble, « BUT ! », on plonge dans le but jusqu'à la photo du Racing,
   sur laquelle on reste longtemps pendant qu'elle se dézoome lentement */
(function(){
  const svg=$('#board'), g=$('#bg'); if(!svg) return;
  const portrait=()=>svg.parentElement.clientHeight>svg.parentElement.clientWidth*1.05;
  function orient(){ if(portrait()){ svg.setAttribute('viewBox','0 0 900 1600'); g.setAttribute('transform','rotate(-90) translate(-1600 0)'); }
    else { svg.setAttribute('viewBox','0 0 1600 900'); g.removeAttribute('transform'); } }
  orient(); addEventListener('resize',orient);
  if(!FX) return;
  const passes=$$('.ps',svg), ball=$('#fball'), net=$('#net'), lens=passes.map(p=>p.getTotalLength());
  const B={p:0};
  const moveBall=()=>{ const i=Math.min(passes.length-1,Math.floor(B.p)), f=Math.min(1,B.p-i);
    passes.forEach((p,j)=>p.style.strokeDashoffset=j<i?0:j>i?1:(1-f).toFixed(4));
    const pt=passes[i].getPointAtLength(lens[i]*f); ball.setAttribute('cx',pt.x.toFixed(1)); ball.setAttribute('cy',pt.y.toFixed(1)); };
  gsap.set($$('.ln',svg),{strokeDashoffset:1}); gsap.set(passes,{strokeDashoffset:1});
  scene('#sc-foot',(tl,sc)=>{
    tl.from($$('.ftitle .ch',sc),{yPercent:120,opacity:0,stagger:.012,duration:.08,ease:'back.out(2)'},0)
      .to($$('.ln',svg),{strokeDashoffset:0,stagger:.01,duration:.1},0)
      .from($$('.us,.them',svg),{scale:0,opacity:0,stagger:.01,duration:.05,ease:'back.out(3)'},.08)
      .from(ball,{opacity:0,duration:.02},.16);
    passes.forEach((p,i)=>tl.to(B,{p:i+1,duration:i===passes.length-1?.05:.08,ease:i===passes.length-1?'power2.in':'none',onUpdate:moveBall},.18+i*.08));
    tl.fromTo(net,{x:0},{x:14,duration:.01,yoyo:true,repeat:5},.55)
      .fromTo($('.but',sc),{opacity:0,scale:.2,rotation:-30},{opacity:1,scale:1,rotation:-8,duration:.05,ease:'back.out(2.5)'},.55)
      .to($('.but',sc),{opacity:0,scale:1.6,duration:.05},.63)
      .to(svg,{scale:5,transformOrigin:()=>{ const r=$('#goalpt').getBoundingClientRect(), s=svg.getBoundingClientRect(); return `${(r.left-s.left).toFixed(0)}px ${(r.top-s.top).toFixed(0)}px`; },opacity:0,duration:.1,ease:'power2.in'},.63)
      .to($('.fphoto',sc),{opacity:1,duration:.08},.66)
      .fromTo($('.fphoto img',sc),{scale:1.3},{scale:1,duration:.34},.66)
      .to($('.ftitle',sc),{opacity:0,duration:.04},.66)
      .fromTo($('.cap2',sc),{xPercent:-120,opacity:0},{xPercent:0,opacity:1,duration:.06,ease:'back.out(1.4)'},.74);
  });
})();

/* Randonnée : le sentier balisé rouge et blanc se trace ; quatre étapes apparaissent les unes après les autres
   pendant que le paysage passe de Chamonix au Verdon */
(function(){
  const wps=$$('.wp'), st=wps[0] && wps[0].parentElement;
  const DESK=[[.17,.36],[.39,.72],[.61,.34],[.83,.68]];
  function place(){ if(!st) return; const W=st.clientWidth, H=st.clientHeight, port=H>W*1.1;
    wps.forEach((w,i)=>{ const x=port?(i%2?.74:.26):DESK[i][0], y=port?(.3+i*.165):DESK[i][1];
      w.style.setProperty('--wx',(W*x).toFixed(0)+'px'); w.style.setProperty('--wy',(H*y).toFixed(0)+'px'); }); }
  place(); addEventListener('resize',place);
  scene('#sc-rando',(tl,sc)=>{
    tl.fromTo($('.rbg.b1 img',sc),{scale:1.3},{scale:1,duration:.5},0)
      .from($$('.big .ch',sc),{yPercent:120,opacity:0,stagger:.02,duration:.1,ease:'back.out(2)'},0)
      .fromTo(['#tpath','#tmask'],{strokeDashoffset:1},{strokeDashoffset:0,duration:.75},.1)
      .to($('.big',sc),{opacity:0,y:-60,duration:.1},.2)
      .to($('.rbg.b2',sc),{opacity:1,duration:.14},.48).fromTo($('.rbg.b2 img',sc),{scale:1.25},{scale:1,duration:.4},.48);
    wps.forEach((w,i)=>tl.from(w,{scale:0,rotation:i%2?12:-12,duration:.07,ease:'back.out(2)'},.2+i*.17));
    tl.to({},{duration:.08},.88);
  });
})();

/* ============================================================
   PROJETS EXTRASCOLAIRES : jeu vidéo en boucle, roman écrit « en direct », podcast, frise
   ============================================================ */
(function(){
  const v=$('#gvid'); const play=()=>{ const p=v.play(); if(p&&p.catch) p.catch(()=>{}); }; whenVisible(v,on=>on?play():v.pause());
  const tw=$('#tw'), text=tw.textContent;
  if(FX){ tw.textContent=''; let busy=false;
    whenVisible(tw,on=>{ if(!on||busy) return; busy=true; let i=0, back=false;
      (function k(){ if(!back){ tw.textContent=text.slice(0,++i); if(i<text.length) return setTimeout(k,text[i-1]===' '?110:45+Math.random()*70); back=true; return setTimeout(k,2600); }
        tw.textContent=text.slice(0,--i); if(i>0) return setTimeout(k,22); back=false; setTimeout(k,500); })(); },'-80px');
    const n=$('#n130'), c={v:0}; gsap.to(c,{v:130,duration:1.8,ease:'power2.out',onUpdate:()=>n.textContent=Math.round(c.v),scrollTrigger:{trigger:'.frise',start:'top 85%'}});
    /* les photos des grandes avancées surgissent une à une, puis le fond se rapproche doucement pendant le défilement */
    const hps=$$('.hp'); hps.forEach(h=>gsap.set(h,{x:0,y:0,xPercent:-50,yPercent:-50,rotation:parseFloat(getComputedStyle(h).getPropertyValue('--r'))||0}));
    gsap.from(hps,{scale:0,opacity:0,rotation:()=>gsap.utils.random(-40,40),duration:.7,ease:'back.out(1.8)',stagger:.16,scrollTrigger:{trigger:'.frise',start:'top 75%'}});
    // relief : pendant le défilement, les photos proches glissent plus vite que les lointaines ; la souris les décale selon leur profondeur
    hps.forEach(h=>{ const z=+h.dataset.z; gsap.fromTo(h,{y:60*z},{y:-60*z,ease:'none',immediateRender:false,scrollTrigger:{trigger:'.frise',start:'top bottom',end:'bottom top',scrub:true}}); });
    gsap.from('.fcap',{opacity:0,y:30,duration:1,ease:'expo.out',scrollTrigger:{trigger:'.frise',start:'top 75%'}});
    if(FINE){ const fr=$('.frise'), mvs=hps.map(h=>[$('.mv',h),+h.dataset.z]); let tx=0,ty=0,cx=0,cy=0,on=false;
      fr.addEventListener('pointermove',e=>{ const r=fr.getBoundingClientRect(); tx=(e.clientX-r.left)/r.width-.5; ty=(e.clientY-r.top)/r.height-.5; });
      fr.addEventListener('pointerleave',()=>{ tx=ty=0; });
      whenVisible(fr,v=>on=v);
      (function l(){ requestAnimationFrame(l); if(!on) return; cx+=(tx-cx)*.08; cy+=(ty-cy)*.08; if(Math.abs(cx)+Math.abs(cy)<.0005&&!tx&&!ty) return;
        mvs.forEach(([m,z])=>m.style.transform=`translate(${(-cx*46*z).toFixed(1)}px,${(-cy*32*z).toFixed(1)}px)`); })(); }
  }
  const cv=$('#wave'), ctx=cv.getContext('2d'); let W=0,H=0,vis=false;
  const fit=()=>{ const r=cv.getBoundingClientRect(); W=r.width; H=r.height; cv.width=W*DPR; cv.height=H*DPR; ctx.setTransform(DPR,0,0,DPR,0,0); };
  fit(); addEventListener('resize',fit); whenVisible(cv,on=>{ vis=on; if(on) fit(); });
  (function loop(now){ requestAnimationFrame(loop); if(!vis) return; const t=RM?0:now/1000, n=Math.max(20,Math.floor(W/6)), bw=W/n, mid=H/2; ctx.clearRect(0,0,W,H);
    for(let i=0;i<n;i++){ const u=i/n, v=Math.abs(Math.sin(t*2.3+i*.35)*.45+Math.sin(t*5.1+i*.13)*.3+Math.sin(t*.9+i*.05)*.25)*(.35+.65*Math.sin(Math.PI*u)), h=Math.max(1.5,v*mid*.95);
      ctx.fillStyle=i%7===0?'#EF4444':'#1f1f1f'; ctx.fillRect(i*bw+bw*.22,mid-h,bw*.56,h*2); } })(0);
  if(FX) addEventListener('load',()=>ScrollTrigger.refresh());
})();
