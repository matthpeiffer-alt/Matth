/* Mes projets — effets de la page */
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const FX = !!(window.gsap && window.ScrollTrigger) && !RM;
if (!FX) document.documentElement.classList.add('no-fx');
const $ = (s,r=document)=>r.querySelector(s), $$ = (s,r=document)=>[...r.querySelectorAll(s)];
const MOBILE = matchMedia('(max-width: 899px)').matches, FINE = matchMedia('(pointer:fine)').matches;

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
  [...nd.textContent].forEach(c=>{ if(c===' '){ el.insertBefore(document.createTextNode(' '),nd); return; } const s=document.createElement('span'); s.className='lt'; s.textContent=c; el.insertBefore(s,nd); out.push(s); }); nd.remove(); }); return out; }
function splitWords(el){ const out=[]; [...el.childNodes].forEach(nd=>{ if(nd.nodeType!==3) return;
  nd.textContent.split(/(\s+)/).forEach(p=>{ if(!p) return; if(/^\s+$/.test(p)){ el.insertBefore(document.createTextNode(p),nd); return; } const s=document.createElement('span'); s.className='w'; s.textContent=p; el.insertBefore(s,nd); out.push(s); }); nd.remove(); }); return out; }

if(FX){
  gsap.registerPlugin(ScrollTrigger);
  gsap.to('#progress',{scaleX:1,ease:'none',scrollTrigger:{start:0,end:'max',scrub:true}});

  /* En-tête : le mot arrive plein, puis se vide en contour ; un projecteur le remplit sous la souris (sur mobile il se promène seul) */
  const stack=$('#stack'), fl=stack.querySelector('.fl'), hero=$('.phero'), intro={v:1.7};
  let hx=.5,hy=.5,sx=.5,sy=.5,inside=false;
  hero.addEventListener('pointermove',e=>{ if(e.pointerType!=='mouse') return; const r=stack.getBoundingClientRect(); hx=(e.clientX-r.left)/r.width; hy=(e.clientY-r.top)/r.height; inside=true; });
  hero.addEventListener('pointerleave',()=>inside=false);
  gsap.timeline({delay:.1})
    .from('.giant .g1',{opacity:0,y:30,filter:'blur(10px)',duration:1,ease:'expo.out'})
    .from(stack,{opacity:0,yPercent:18,filter:'blur(22px)',duration:1.4,ease:'expo.out'},'-=.75')
    .from('.phero .meta',{opacity:0,duration:.9,stagger:.12},'-=.8')
    .to(intro,{v:0,duration:1.6,ease:'expo.inOut'},'+=.2');
  gsap.ticker.add(t=>{ if(scrollY>innerHeight) return; const r=stack.getBoundingClientRect();
    const tx=inside?hx:.5+.4*Math.sin(t*.55), ty=inside?hy:.5+.22*Math.sin(t*1.13);
    sx+=(tx-sx)*.09; sy+=(ty-sy)*.09;
    fl.style.setProperty('--x',(sx*100).toFixed(2)+'%'); fl.style.setProperty('--y',(sy*100).toFixed(2)+'%');
    fl.style.setProperty('--r',Math.max(r.height*.62,intro.v*r.width).toFixed(1)+'px'); });
  gsap.to('.giant',{yPercent:-22,opacity:0,filter:'blur(10px)',scale:.95,transformOrigin:'0% 100%',ease:'none',scrollTrigger:{trigger:'.phero',start:'top top',end:'bottom top',scrub:true}});
  gsap.to('.blobs',{yPercent:25,ease:'none',scrollTrigger:{trigger:'.phero',start:'top top',end:'bottom top',scrub:true}});

  /* Éventail : titre qui sort du flou, puis les photos se déplient (aucun blocage du défilement) */
  const fc=$$('.fcard'), n=fc.length, mid=(n-1)/2, spread=MOBILE?92:Math.min(380,innerWidth*.26);
  fc.forEach((c,i)=>gsap.set(c,{rotate:(i-mid)*3,x:(i-mid)*6,y:Math.abs(i-mid)*6,zIndex:i===1?10:5}));
  gsap.timeline({scrollTrigger:{trigger:'.fan',start:'top 85%',end:'top 5%',scrub:.6}})
    .from('.fan-head .eyebrow',{opacity:0,y:20,filter:'blur(8px)',ease:'none',duration:.25},0)
    .from('.fan-head .h2',{opacity:0,y:40,filter:'blur(14px)',ease:'none',duration:.35},.08)
    .from('.fan-stage',{scale:.8,opacity:0,filter:'blur(12px)',ease:'none',duration:.4},.1)
    .to(fc,{x:i=>(i-mid)*spread,y:i=>Math.abs(i-mid)*(MOBILE?30:40),rotate:i=>(i-mid)*(MOBILE?9:8),ease:'none',duration:1},.25)
    .to(fc[1],{scale:1.1,ease:'none',duration:.4},.85);

  /* Projets : nom géant qui sort du flou puis dont les lettres flottent à des vitesses différentes au défilement */
  const drift=[-16,10,-7,14,-11,8,-13,11];
  $$('.proj').forEach(p=>{
    const name=p.querySelector('.pname'), letters=splitLetters(name), st={trigger:name,start:'top 88%'};
    gsap.from(p.querySelector('.sec-head'),{opacity:0,y:30,duration:.9,ease:'expo.out',scrollTrigger:st});
    gsap.from(letters,{opacity:0,y:70,filter:'blur(18px)',duration:1.3,ease:'expo.out',stagger:.06,scrollTrigger:st});
    gsap.from(name.querySelector('em'),{opacity:0,x:-40,filter:'blur(12px)',duration:1.2,ease:'expo.out',delay:.45,scrollTrigger:st});
    gsap.to(letters,{yPercent:i=>drift[i%drift.length],ease:'none',scrollTrigger:{trigger:name,start:'top bottom',end:'bottom top',scrub:true}});
    const pp=p.querySelector('.ppitch'), words=splitWords(pp);
    gsap.fromTo(words,{opacity:.08,filter:'blur(8px)',y:12},{opacity:1,filter:'blur(0px)',y:0,stagger:.1,ease:'none',scrollTrigger:{trigger:pp,start:'top 90%',end:'top 50%',scrub:true}});
    gsap.from(p.querySelectorAll('.chipx'),{opacity:0,y:20,scale:.9,duration:.7,ease:'back.out(2)',stagger:.08,scrollTrigger:{trigger:pp,start:'top 75%'}});
    p.querySelectorAll('.pstage').forEach(ps=>gsap.fromTo(ps,{clipPath:'inset(9% 7% 9% 7% round 34px)',scale:.96},{clipPath:'inset(0% 0% 0% 0% round 34px)',scale:1,ease:'none',scrollTrigger:{trigger:ps,start:'top 95%',end:'top 30%',scrub:true}}));
    ScrollTrigger.create({trigger:p,start:'top 55%',end:'bottom 45%',onToggle:s=>{ if(s.isActive) document.body.style.setProperty('--amb',p.dataset.c); }});
  });
  ScrollTrigger.create({trigger:'.phero',start:'top top',end:'bottom 45%',onToggle:s=>{ if(s.isActive) document.body.style.setProperty('--amb','#5AA9FF'); }});

  gsap.from('.ncard',{opacity:0,y:60,scale:.97,duration:1.1,ease:'expo.out',scrollTrigger:{trigger:'.ncard',start:'top 85%'}});
  addEventListener('load',()=>ScrollTrigger.refresh());
}

/* ============================================================
   WALL-E : trajet A → B avec les écrous dans la tête
   ============================================================ */
(function(){
  if(!window.gsap || RM){ return; }
  const NS='http://www.w3.org/2000/svg', dust=$('#dust'), status=$('#wStatus'), distTxt=$('#distTxt');
  const setStatus = t => gsap.fromTo(status,{opacity:0,x:-6},{opacity:1,x:0,duration:.35,onStart:()=>status.textContent=t});
  const bx = () => gsap.getProperty('#bot','x');                    // position du robot (unités internes)
  const puff = side => {                                             // petit nuage de poussière sous un pied
    const c=document.createElementNS(NS,'circle'), x=150+(bx()+side*54)*.8;
    c.setAttribute('cx',x); c.setAttribute('cy',360); c.setAttribute('r',4); c.setAttribute('fill','#8C97AB'); dust.appendChild(c);
    gsap.to(c,{attr:{r:14,cy:352},opacity:0,duration:.7,ease:'power1.out',onComplete:()=>c.remove()});
  };
  /* Démarche « en crabe » : les jambes pivotent en alternance, le buste se balance */
  const walk = gsap.timeline({repeat:-1,paused:true,defaults:{duration:.26,ease:'sine.inOut'}});
  walk.to('#legL',{rotation:10,transformOrigin:'50% 0%'},0).to('#legR',{rotation:-6,transformOrigin:'50% 0%'},0).to('#upper',{y:-6,rotation:1.5,transformOrigin:'50% 100%'},0).call(puff,[-1])
      .to('#legL',{rotation:-6},.26).to('#legR',{rotation:10},.26).to('#upper',{y:0,rotation:-1.5},.26).call(puff,[1]);
  const moving = on => { if(on) walk.play(); else { walk.pause(); gsap.to(['#legL','#legR','#upper'],{rotation:0,y:0,duration:.25}); } };
  const arrow = (id,on) => gsap.to(id,{attr:{fill:on?'#5AA9FF':'#121c33'},duration:.2});
  const prog = {v:0};
  const updDist = () => { $('#distFill').setAttribute('x2', 150+500*prog.v); distTxt.setAttribute('x',150+500*prog.v); distTxt.textContent=(prog.v*4).toFixed(1).replace('.',',')+' m'; };
  gsap.set('#nuts .nut',{opacity:0}); updDist();
  const tl = gsap.timeline({repeat:-1,repeatDelay:.8,paused:true});
  tl.call(setStatus,['Chargement au point A'])
    .fromTo('#nuts .nut',{y:-280,opacity:1},{y:0,duration:1,ease:'bounce.out',stagger:.22})
    .call(setStatus,['Transport · piloté en WiFi'])
    .call(()=>{ arrow('#arrR',true); moving(true); }).to(distTxt,{opacity:1,duration:.2},'<')
    .to('#bot',{x:625,duration:5.2,ease:'none'})
    .to(prog,{v:1,duration:5.2,ease:'none',onUpdate:updDist},'<')
    .call(()=>{ arrow('#arrR',false); moving(false); })
    .call(setStatus,['Déchargement au point B'],'+=.2')
    .to('#head',{rotation:38,x:22,transformOrigin:'50% 100%',duration:.6,ease:'power2.inOut'})
    .set('#nuts .nut',{opacity:0}).set('#fly',{opacity:1})
    .fromTo('#fly use',{x:0,y:0,rotation:0,opacity:1},{x:i=>128+i*10,y:i=>182+i*3,rotation:240,duration:.75,ease:'power2.in',stagger:.08,transformOrigin:'50% 50%'})
    .set('#fly',{opacity:0}).to('#pile',{opacity:1,duration:.15})
    .fromTo('#pile',{y:-8},{y:0,duration:.5,ease:'bounce.out'},'<')
    .to('#head',{rotation:0,x:0,duration:.5,ease:'power2.inOut'},'+=.15')
    .call(setStatus,['Retour au point A'])
    .call(()=>{ arrow('#arrL',true); moving(true); })
    .to('#bot',{x:0,duration:4.2,ease:'none'})
    .to(prog,{v:0,duration:4.2,ease:'none',onUpdate:updDist},'<')
    .call(()=>{ arrow('#arrL',false); moving(false); })
    .to([distTxt,'#pile'],{opacity:0,duration:.4});
  new IntersectionObserver(e=>{ e[0].isIntersecting ? tl.play() : (tl.pause(), walk.pause()); },{threshold:.2}).observe($('#walle'));
})();

/* ============================================================
   NUAGE DE POINTS (illustration) — une tasse
   ============================================================ */
(function(){
  const cv=$('#cloud'), ctx=cv.getContext('2d');
  /* Modèle complet de la tasse (pour le nuage final) */
  const FULL=[];
  for(let i=0;i<1300;i++){const a=Math.random()*Math.PI*2,y=Math.random()*2-1;FULL.push([Math.cos(a)*.62,y*.8,Math.sin(a)*.62]);}
  for(let i=0;i<180;i++){const a=Math.random()*Math.PI*2,r=.62*Math.sqrt(Math.random());FULL.push([Math.cos(a)*r,.8,Math.sin(a)*r]);}
  for(let i=0;i<300;i++){const t=Math.random()*Math.PI-Math.PI/2,a=Math.random()*Math.PI*2,R=.3,rr=.06;FULL.push([.62+(R+rr*Math.cos(a))*Math.cos(t),(R+rr*Math.cos(a))*Math.sin(t)*.9,rr*Math.sin(a)]);}
  /* Grille de balayage pan / tilt (serpentin) : on calcule où le rayon touche la tasse */
  const COLS=54, ROWS=40, SCAN=[];
  for(let r=0;r<ROWS;r++) for(let k=0;k<COLS;k++){ const c = r%2 ? COLS-1-k : k;
    const x=-1+c/(COLS-1)*2.1, y=-.92+r/(ROWS-1)*1.84; let hit=null;
    if(Math.abs(x)<=.62 && Math.abs(y)<=.8) hit=[x,y,-Math.sqrt(.62*.62-x*x)];
    else if(x>.6){ const d=Math.hypot(x-.62,y/.9); if(Math.abs(d-.3)<.075) hit=[x,y,0]; }
    SCAN.push({c,r,x,y,hit}); }
  const NOISE=Array.from({length:70},()=>[ (Math.random()*2.2-1.1), (Math.random()*1.9-.95), (Math.random()-.5)*1.6 ]);
  const H={t:$('#hT'),p:$('#hP'),d:$('#hD'),n:$('#hN'),bar:$('#hBar'),stream:$('#hStream'),ai:$('#hAItxt'),st:[1,2,3,4].map(i=>$('#s'+i))};
  let t0=performance.now(), vis=false, w, h, lastStream=0, lastIdx=-1;
  const fit=()=>{const r=cv.getBoundingClientRect();w=r.width;h=r.height;cv.width=w*devicePixelRatio;cv.height=h*devicePixelRatio;ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);};
  new IntersectionObserver(e=>{vis=e[0].isIntersecting; if(vis){fit();t0=performance.now();}},{threshold:.1}).observe(cv);
  addEventListener('resize',()=>vis&&fit());
  const LOOP=12, TS=5.5, TW=7, TC=8.4;
  const proj=(x,y,z,ang,s,cx,cy)=>{ const X=x*Math.cos(ang)-z*Math.sin(ang), Z=x*Math.sin(ang)+z*Math.cos(ang), Y=y*Math.cos(-.32)-Z*Math.sin(-.32), Z2=y*Math.sin(-.32)+Z*Math.cos(-.32), k=2.8/(2.8+Z2); return [cx+X*s*k, cy+Y*s*k, k, Z2]; };
  const col=(d,a)=>`hsla(${160+d*55},95%,${52+d*14}%,${a})`;
  const setSteps=k=>H.st.forEach((li,i)=>{ li.classList.toggle('ok',i<k); li.classList.toggle('on',i===k); });
  const pushStream=t=>{ const d=document.createElement('div'); d.textContent=t; H.stream.appendChild(d); while(H.stream.children.length>6) H.stream.firstChild.remove(); };
  const AI='« C\'est une tasse. »';
  (function f(now){ requestAnimationFrame(f); if(!vis||!w) return;
    const T=Math.max(0,(now-t0)/1000)%LOOP; ctx.clearRect(0,0,w,h);   // t0 peut être plus récent que l'horodatage de la frame
    const s=Math.min(w*.62,h)*.34, cx=w*.58, cy=h*.6, dev=[w*.14,h*.2];
    // grille de fond
    ctx.strokeStyle='rgba(160,180,220,.06)'; ctx.lineWidth=1; for(let gx=0;gx<w;gx+=32){ctx.beginPath();ctx.moveTo(gx,0);ctx.lineTo(gx,h);ctx.stroke();} for(let gy=0;gy<h;gy+=32){ctx.beginPath();ctx.moveTo(0,gy);ctx.lineTo(w,gy);ctx.stroke();}
    H.bar.style.width=(T/LOOP*100)+'%';
    if(T<TS){                                   /* 1 — balayage */
      setSteps(0); const n=Math.floor(T/TS*SCAN.length), cur=SCAN[Math.min(n,SCAN.length-1)];
      let pts=0;
      for(let i=0;i<=n&&i<SCAN.length;i++){ const p=SCAN[i]; if(!p.hit) continue; pts++; const [X,Y,k,Z]=proj(...p.hit,-.35,s,cx,cy); ctx.fillStyle=col((Z+1)/2,.9); ctx.fillRect(X-1.3,Y-1.3,2.6*k,2.6*k); }
      const tgt = cur.hit ? proj(...cur.hit,-.35,s,cx,cy) : proj(cur.x*1.15,cur.y*1.1,1.4,-.35,s,cx,cy);
      const a=Math.atan2(tgt[1]-dev[1],tgt[0]-dev[0]);
      // cône + faisceau infrarouge
      const g=ctx.createLinearGradient(dev[0],dev[1],tgt[0],tgt[1]); g.addColorStop(0,'rgba(255,84,112,.0)'); g.addColorStop(1,'rgba(255,84,112,.18)');
      ctx.fillStyle=g; ctx.beginPath(); ctx.moveTo(dev[0],dev[1]); ctx.lineTo(tgt[0]-14,tgt[1]-14); ctx.lineTo(tgt[0]+14,tgt[1]+14); ctx.fill();
      ctx.strokeStyle='#ff5470'; ctx.lineWidth=1.6; ctx.shadowColor='#ff5470'; ctx.shadowBlur=12; ctx.beginPath(); ctx.moveTo(dev[0],dev[1]); ctx.lineTo(tgt[0],tgt[1]); ctx.stroke(); ctx.shadowBlur=0;
      if(cur.hit){ ctx.fillStyle='rgba(255,84,112,.35)'; ctx.beginPath(); ctx.arc(tgt[0],tgt[1],7+Math.sin(now/60)*2,0,7); ctx.fill(); }
      // tête pan / tilt
      ctx.save(); ctx.translate(dev[0],dev[1]);
      ctx.fillStyle='#1b2338'; ctx.fillRect(-26,-46,52,30); ctx.fillStyle='#0b0f18'; ctx.fillRect(-18,-30,36,34);
      ctx.rotate(a); ctx.fillStyle='#1d7a3a'; ctx.fillRect(-6,-12,30,24); ctx.fillStyle='#f5c542'; ctx.fillRect(18,-5,8,10); ctx.restore();
      ctx.fillStyle='#8C97AB'; ctx.font='600 11px "JetBrains Mono", monospace'; ctx.fillText('capteur IR · 2 servos', dev[0]-40, dev[1]+38);
      const th=-30+cur.c/(COLS-1)*60, ph=22-cur.r/(ROWS-1)*44;
      H.t.textContent=(th>=0?'+':'')+th.toFixed(1)+'°'; H.p.textContent=(ph>=0?'+':'')+ph.toFixed(1)+'°';
      H.d.textContent=cur.hit? (28+(cur.hit[2]+.62)*9).toFixed(1)+' cm' : 'hors objet'; H.n.textContent=pts;
      if(n!==lastIdx && now-lastStream>90){ lastStream=now; pushStream(`θ=${th.toFixed(1)}° φ=${ph.toFixed(1)}° ${cur.hit?'d='+(28+(cur.hit[2]+.62)*9).toFixed(1):'—'}`); } lastIdx=n;
      H.ai.textContent='…';
    } else {
      const pts = SCAN.filter(p=>p.hit);
      if(T<TW){                                 /* 2 — envoi WiFi vers le PC */
        setSteps(1); pts.forEach(p=>{ const [X,Y,k,Z]=proj(...p.hit,-.35,s,cx,cy); ctx.fillStyle=col((Z+1)/2,.85); ctx.fillRect(X-1.3,Y-1.3,2.6*k,2.6*k); });
        const pc=[w*.9,h*.16]; ctx.strokeStyle='rgba(90,169,255,.35)'; ctx.setLineDash([4,6]); ctx.beginPath(); ctx.moveTo(dev[0]+30,dev[1]-30); ctx.lineTo(pc[0]-30,pc[1]); ctx.stroke(); ctx.setLineDash([]);
        for(let i=0;i<6;i++){ const u=((T-TS)/(TW-TS)*2+i/6)%1; ctx.fillStyle='#5AA9FF'; ctx.fillRect(dev[0]+30+(pc[0]-30-dev[0]-30)*u-3, dev[1]-30+(pc[1]-dev[1]+30)*u-3,6,6); }
        ctx.strokeStyle='#4DA3FF'; ctx.lineWidth=2; ctx.strokeRect(pc[0]-28,pc[1]-20,56,36); ctx.fillStyle='#4DA3FF'; ctx.fillRect(pc[0]-10,pc[1]+18,20,4);
        ctx.fillStyle='#8C97AB'; ctx.font='600 11px "JetBrains Mono", monospace'; ctx.textAlign='center'; ctx.fillText('PC', pc[0], pc[1]+38); ctx.textAlign='left';
        if(now-lastStream>140){ lastStream=now; pushStream(`TX paquet #${Math.floor(Math.random()*900+100)} → PC  ok`); }
      } else if(T<TC){                          /* 3 — nettoyage : points parasites retirés, nuage densifié */
        setSteps(2); const u=(T-TW)/(TC-TW);
        NOISE.forEach(([x,y,z])=>{ const [X,Y]=proj(x,y,z,-.35,s,cx,cy); ctx.fillStyle=`rgba(255,84,112,${(1-u)*.8})`; ctx.fillRect(X-1.5,Y-1.5,3,3); });
        FULL.forEach(([x,y,z],i)=>{ if(i/FULL.length>u) return; const [X,Y,k,Z]=proj(x,y,z,-.35,s,cx,cy); ctx.fillStyle=col((Z+1)/2,.75); ctx.fillRect(X-1.2,Y-1.2,2.4*k,2.4*k); });
        if(now-lastStream>160){ lastStream=now; pushStream(`filtre : ${Math.round(u*70)} points parasites retirés`); }
      } else {                                  /* 4 — rotation du nuage + réponse du LLM */
        setSteps(3); const ang=-.35+(T-TC)*.9;
        FULL.forEach(([x,y,z])=>{ const [X,Y,k,Z]=proj(x,y,z,ang,s,cx,cy); ctx.fillStyle=col((Z+1)/2,.35+(1-(Z+1)/2)*.6); ctx.fillRect(X-1.2,Y-1.2,2.4*k,2.4*k); });
        const c=Math.min(AI.length,Math.floor((T-TC-.4)*14)); H.ai.textContent = c>0 ? AI.slice(0,c) : '…';
        if(T>LOOP-1.2) setSteps(4);
      }
      H.n.textContent = T<TC ? pts.length : FULL.length;
    }
  })(performance.now());
})();

/* ============================================================
   LABYRINTHE MICROMOUSE 16×16
   ============================================================ */
(function(){
  const N=16, GOALS=[[7,7],[8,7],[7,8],[8,8]], isGoal=(x,y)=>GOALS.some(g=>g[0]===x&&g[1]===y);
  const D=[{dx:0,dy:-1,b:1,a:-Math.PI/2},{dx:1,dy:0,b:2,a:0},{dx:0,dy:1,b:4,a:Math.PI/2},{dx:-1,dy:0,b:8,a:Math.PI}], OPP={1:4,2:8,4:1,8:2};
  const cv=$('#maze'), ctx=cv.getContext('2d'), info=$('#mazeInfo');
  let walls,known,seen,dist,rob,trail,state='idle',anim=null,visible=false,timer;
  const I=(x,y)=>y*N+x, inb=(x,y)=>x>=0&&y>=0&&x<N&&y<N;
  function open(x,y,d){ walls[I(x,y)]&=~d.b; walls[I(x+d.dx,y+d.dy)]&=~OPP[d.b]; }
  function gen(){
    walls=new Uint8Array(N*N).fill(15); const v=new Uint8Array(N*N), st=[[0,N-1]]; v[I(0,N-1)]=1;
    while(st.length){ const [x,y]=st[st.length-1]; const o=D.filter(d=>inb(x+d.dx,y+d.dy)&&!v[I(x+d.dx,y+d.dy)]); if(!o.length){st.pop();continue;} const d=o[Math.random()*o.length|0]; open(x,y,d); v[I(x+d.dx,y+d.dy)]=1; st.push([x+d.dx,y+d.dy]); }
    open(7,7,D[1]); open(7,8,D[1]); open(7,7,D[2]); open(8,7,D[2]);               // centre 2×2 ouvert
    for(let k=0;k<22;k++){ const x=1+Math.random()*(N-2)|0, y=1+Math.random()*(N-2)|0, d=D[Math.random()*4|0]; if(inb(x+d.dx,y+d.dy)) open(x,y,d); }
    known=new Uint8Array(N*N); seen=new Uint8Array(N*N); rob={x:0,y:N-1,px:0,py:N-1,a:-Math.PI/2}; trail=[[0,N-1]];
    sense(); flood(); state='ready'; info.textContent='départ en bas à gauche → centre'; draw();
  }
  function sense(){ const i=I(rob.x,rob.y); seen[i]=1; D.forEach(d=>{ if(walls[i]&d.b){ known[i]|=d.b; if(inb(rob.x+d.dx,rob.y+d.dy)) known[I(rob.x+d.dx,rob.y+d.dy)]|=OPP[d.b]; } }); }
  function flood(){ dist=new Int16Array(N*N).fill(-1); const q=GOALS.map(g=>{dist[I(g[0],g[1])]=0;return g;});
    while(q.length){ const [x,y]=q.shift(), i=I(x,y); D.forEach(d=>{ const nx=x+d.dx,ny=y+d.dy; if(!inb(nx,ny)||(known[i]&d.b)) return; const j=I(nx,ny); if(dist[j]<0){dist[j]=dist[i]+1;q.push([nx,ny]);} }); } }
  function step(){
    if(state!=='run') return;
    if(isGoal(rob.x,rob.y)){ state='done'; info.textContent=`arrivé au centre ✓ ${trail.length-1} cases`; draw(); timer=setTimeout(()=>{ if(visible){ gen(); go(); } },3200); return; }
    flood(); const i=I(rob.x,rob.y); let best=null;
    D.forEach(d=>{ const nx=rob.x+d.dx,ny=rob.y+d.dy; if(!inb(nx,ny)||(known[i]&d.b)) return; const v=dist[I(nx,ny)]; if(v>=0&&(!best||v<best.v)) best={x:nx,y:ny,v,a:d.a}; });
    if(!best) return;
    let da=best.a-rob.a; while(da>Math.PI) da-=2*Math.PI; while(da<-Math.PI) da+=2*Math.PI;
    anim={fx:rob.x,fy:rob.y,tx:best.x,ty:best.y,fa:rob.a,ta:rob.a+da,t0:performance.now(),dur:Math.abs(da)>.1?210:120};
    rob.x=best.x; rob.y=best.y;
  }
  function go(){ clearTimeout(timer); if(state==='done'||state==='idle') gen(); state='run'; info.textContent='exploration…'; step(); }
  function frame(now){
    requestAnimationFrame(frame); if(!visible) return;
    if(anim){ const k=Math.min(1,(now-anim.t0)/anim.dur), e=k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2;
      rob.px=anim.fx+(anim.tx-anim.fx)*e; rob.py=anim.fy+(anim.ty-anim.fy)*e; rob.a=anim.fa+(anim.ta-anim.fa)*Math.min(1,e*1.6);
      if(k>=1){ rob.a=anim.ta; anim=null; trail.push([rob.x,rob.y]); sense(); step(); } }
    draw();
  }
  function draw(){
    const W=cv.width, pad=18, s=(W-pad*2)/N;
    ctx.fillStyle='#121B30'; ctx.fillRect(0,0,W,W);
    // centre
    ctx.fillStyle='rgba(90,169,255,.12)'; ctx.fillRect(pad+7*s,pad+7*s,2*s,2*s);
    // cases vues
    for(let y=0;y<N;y++)for(let x=0;x<N;x++) if(seen[I(x,y)]){ ctx.fillStyle='rgba(77,163,255,.07)'; ctx.fillRect(pad+x*s+1,pad+y*s+1,s-2,s-2); }
    // trace
    if(trail.length>1){ ctx.strokeStyle='rgba(90,169,255,.55)'; ctx.lineWidth=s*.16; ctx.lineJoin=ctx.lineCap='round'; ctx.beginPath(); trail.forEach(([x,y],k)=>{const X=pad+x*s+s/2,Y=pad+y*s+s/2; k?ctx.lineTo(X,Y):ctx.moveTo(X,Y);}); ctx.lineTo(pad+rob.px*s+s/2,pad+rob.py*s+s/2); ctx.stroke(); }
    // murs (inconnus très discrets, découverts bien visibles)
    for(let y=0;y<N;y++)for(let x=0;x<N;x++){ const i=I(x,y),px=pad+x*s,py=pad+y*s;
      [[1,px,py,px+s,py],[2,px+s,py,px+s,py+s],[4,px,py+s,px+s,py+s],[8,px,py,px,py+s]].forEach(([b,a,c,e,f])=>{ if(!(walls[i]&b)) return; const k=known[i]&b;
        ctx.strokeStyle=k?'#EEF2F7':'rgba(160,180,220,.13)'; ctx.lineWidth=k?3.5:1.5; ctx.lineCap='square'; ctx.beginPath(); ctx.moveTo(a,c); ctx.lineTo(e,f); ctx.stroke(); }); }
    // poteaux
    ctx.fillStyle='#3a4762'; for(let y=0;y<=N;y++)for(let x=0;x<=N;x++) ctx.fillRect(pad+x*s-2,pad+y*s-2,4,4);
    // robot vu de dessus
    const X=pad+rob.px*s+s/2, Y=pad+rob.py*s+s/2, r=s*.36;
    ctx.save(); ctx.translate(X,Y); ctx.rotate(rob.a);
    ctx.shadowColor='#5AA9FF'; ctx.shadowBlur=14;
    ctx.fillStyle='#1b2338'; ctx.beginPath(); ctx.roundRect(-r,-r*.8,r*1.7,r*1.6,[r*.25,r*.8,r*.8,r*.25]); ctx.fill(); ctx.shadowBlur=0;
    ctx.fillStyle='#000'; ctx.fillRect(-r*.4,-r*1.05,r*.8,r*.28); ctx.fillRect(-r*.4,r*.77,r*.8,r*.28);   // roues
    ctx.fillStyle='#5AA9FF'; ctx.beginPath(); ctx.arc(r*.55,-r*.28,r*.14,0,7); ctx.arc(r*.55,r*.28,r*.14,0,7); ctx.fill(); // capteurs
    ctx.restore();
  }
  $('#mazeNew').addEventListener('click',()=>{ state='idle'; anim=null; gen(); go(); });
  gen();
  new IntersectionObserver(e=>{ visible=e[0].isIntersecting; if(visible&&state==='ready'&&!RM) go(); },{threshold:.3}).observe(cv);
  requestAnimationFrame(frame);
})();
