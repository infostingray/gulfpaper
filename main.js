(function(){
  "use strict";
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGSAP = typeof gsap !== 'undefined';
  if (hasGSAP && typeof ScrollTrigger !== 'undefined') gsap.registerPlugin(ScrollTrigger);

  /* ---------- INDUSTRIES data ---------- */
  const BASE='images/';
  const inds=[
    ['Airports','airports.png'],
    ['Catering Companies','catering.png'],
    ['Hospitals','hospitals.png'],
    ['Cleaning Companies','cleaning.png'],
    ['Facility Management','facility.png'],
    ['Restaurants','restaurants.png'],
    ['Hotels','hotels.png']
  ];
  function card(name,file,i){
    return `<div class="ind-card"><div class="ph"><img src="${BASE+file}" alt="${name}" loading="lazy"></div>
      <div class="cap"><span>${name}</span><span>0${i+1}</span></div></div>`;
  }
  // duplicate the set twice for a seamless loop
  const set = inds.map((d,i)=>card(d[0],d[1],i)).join('');
  const _m1=document.getElementById('m1');
  if(_m1) _m1.innerHTML = set+set;

  /* ---------- PRELOADER — "The Press" ---------- */
  const pre=document.getElementById('preloader'), plNum=document.getElementById('plNum'), plFill=document.getElementById('plFill');

  // intro: tag + logo rise in
  if(hasGSAP && !reduce){
    gsap.to('#plTag span',{y:0,duration:.8,ease:'power4.out',delay:.1});
    gsap.to('#plLogo',{opacity:1,y:0,duration:.9,ease:'power3.out',delay:.25});
  }else{
    const t=document.querySelector('#plTag span'); if(t)t.style.transform='none';
    const l=document.getElementById('plLogo'); if(l)l.style.opacity=1;
  }

  let n=0;
  const tick=setInterval(()=>{
    n+=Math.max(1,Math.round((100-n)*0.10));
    if(n>=100){n=100;clearInterval(tick);finishPre();}
    plNum.textContent=n; plFill.style.width=n+'%';
  },60);

  function finishPre(){
    setTimeout(()=>{
      if(hasGSAP && !reduce){
        const tl=gsap.timeline({onComplete:()=>{pre.style.display='none';start();}});
        // core content lifts out first
        tl.to('.pl-core',{y:-34,opacity:0,duration:.5,ease:'power2.in'})
          // sheets pulled off the stack, left-to-right, with a touch of paper skew
          .to('.pl-panels .p',{yPercent:-100,duration:.9,ease:'power4.inOut',stagger:.06},'-=.15');
      }else{
        pre.style.display='none'; start();
      }
    },300);
  }

  /* ---------- SMOOTH SCROLL (Lenis) ---------- */
  let lenis=null;
  function initLenis(){
    if(reduce || typeof Lenis==='undefined') return;
    lenis=new Lenis({lerp:.085, wheelMultiplier:1, smoothWheel:true});
    lenis.on('scroll', ()=>{ if(hasGSAP) ScrollTrigger.update(); });
    function raf(t){ lenis.raf(t); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);
    if(hasGSAP){ gsap.ticker.add((t)=>lenis.raf(t*1000)); gsap.ticker.lagSmoothing(0); }
  }
  function scrollTo(target){
    const el=typeof target==='string'?document.querySelector(target):target;
    if(!el) return;
    if(lenis){ lenis.scrollTo(el,{offset:0,duration:1.3}); }
    else el.scrollIntoView({behavior: reduce?'auto':'smooth'});
  }

  /* ---------- MAGNETIC BUTTONS ---------- */
  function initMagnetic(){
    if(reduce) return;
    document.querySelectorAll('.magnetic').forEach(el=>{
      const str=22;
      el.addEventListener('mousemove',e=>{
        const r=el.getBoundingClientRect();
        const x=(e.clientX-r.left-r.width/2)/r.width*str;
        const y=(e.clientY-r.top-r.height/2)/r.height*str;
        el.style.transform=`translate(${x}px,${y}px)`;
      });
      el.addEventListener('mouseleave',()=>{el.style.transform='translate(0,0)';});
      el.style.transition='transform .4s cubic-bezier(.16,1,.3,1)';
    });
  }

  /* ---------- FOLD MENU ---------- */
  const toggle=document.getElementById('menuToggle'), menu=document.getElementById('foldMenu'),
        menuLabel=document.getElementById('menuLabel'), links=menu.querySelectorAll('a[data-link]');
  let open=false;
  function setMenu(state){
    open=state;
    menu.classList.toggle('open',open);
    menu.setAttribute('aria-hidden',!open);
    document.body.classList.toggle('lock',open);
    menuLabel.textContent=open?'Close':'Menu';
    const tb=document.getElementById('topbar'); if(tb) tb.classList.toggle('menu-active',open);
    if(window.__updateLogo) window.__updateLogo();
    if(hasGSAP && !reduce){
      if(open) gsap.to(links,{y:0,duration:.8,stagger:.07,ease:'power4.out',delay:.15});
      else gsap.to(links,{y:'110%',duration:.4,ease:'power2.in'});
    }else{
      links.forEach(l=>l.style.transform=open?'translateY(0)':'translateY(110%)');
    }
  }
  toggle.addEventListener('click',()=>setMenu(!open));
  links.forEach(a=>a.addEventListener('click',e=>{
    const t=a.getAttribute('href');
    if(t && t.charAt(0)==='#'){           // same-page anchor → smooth scroll
      e.preventDefault(); setMenu(false); setTimeout(()=>scrollTo(t),420);
    }else{ setMenu(false); }              // cross-page link (e.g. index.html#about) → navigate
  }));

  /* ---------- RAIL ---------- */
  document.querySelectorAll('.rail button').forEach(b=>{
    b.addEventListener('click',()=>scrollTo('#'+b.dataset.go));
  });

  /* contact form -> mailto (works on static hosting) */
  const cForm=document.getElementById('contactForm');
  if(cForm) cForm.addEventListener('submit',e=>{
    e.preventDefault();
    const nm=encodeURIComponent(document.getElementById('cName').value);
    const em=encodeURIComponent(document.getElementById('cEmail').value);
    const msg=encodeURIComponent(document.getElementById('cMsg').value);
    document.getElementById('sendLabel').textContent='Opening mail…';
    window.location.href=`mailto:info@gpiqatar.com?subject=Website enquiry from ${nm}&body=${msg}%0D%0A%0D%0AFrom: ${nm} (${em})`;
    setTimeout(()=>document.getElementById('sendLabel').textContent='Send',2500);
  });

  /* ---------- MAIN ANIMATIONS ---------- */
  function start(){
    initLenis();
    initMagnetic();

    /* header banner: fill with blurred bar once scrolling (transparent while menu open) */
    const topbar=document.getElementById('topbar');
    function updateLogo(){
      if(!topbar) return;
      const y=window.scrollY||window.pageYOffset||0;
      topbar.classList.toggle('scrolled', y>40);
    }
    window.addEventListener('scroll',updateLogo,{passive:true});
    window.addEventListener('resize',updateLogo);
    if(lenis) lenis.on('scroll',updateLogo);
    window.__updateLogo=updateLogo;
    updateLogo();

    /* robust content reveals — works with or without GSAP, never leaves text hidden */
    revealOnScroll();

    if(!hasGSAP){ // no animation library: show structural bits and bail
      document.querySelectorAll('.reveal-line>*,.mask').forEach(el=>{
        el.style.transform='none';el.style.opacity=1; if(el.classList.contains('mask'))el.style.display='none';
      });
      buildVerticalProducts(true); return;
    }

    /* hero load reveal (scoped to hero only) */
    const tl=gsap.timeline({delay:.1});
    tl.to('#heroH .reveal-line > *',{y:0,duration:1.1,stagger:.1,ease:'power4.out'})
      .from('#hero [data-fade]',{y:24,opacity:0,duration:.9,stagger:.08,ease:'power3.out'},'-=.7');

    if(!reduce){
      gsap.to('[data-float]',{yPercent:18,ease:'none',scrollTrigger:{trigger:'#hero',start:'top top',end:'bottom top',scrub:true}});
      gsap.to('#heroH',{yPercent:-12,opacity:.85,ease:'none',scrollTrigger:{trigger:'#hero',start:'top top',end:'bottom top',scrub:true}});
    }

    /* about image: accent side-wipe reveal + gentle parallax */
    gsap.utils.toArray('[data-fig]').forEach(fig=>{
      const mask=fig.querySelector('[data-mask]'), img=fig.querySelector('img');
      gsap.to(mask,{scaleX:0,transformOrigin:'right',duration:1.2,ease:'power4.inOut',
        scrollTrigger:{trigger:fig,start:'top 88%',once:true}});
      if(!reduce) gsap.fromTo(img,{yPercent:-8},{yPercent:8,ease:'none',
        scrollTrigger:{trigger:fig,start:'top bottom',end:'bottom top',scrub:true}});
    });

    /* products horizontal pin */
    setupProducts();

    /* products page filter (no reload) */
    setupFilter();

    /* industries marquees (scroll-velocity reactive) */
    setupMarquee();

    if(typeof ScrollTrigger!=='undefined') setTimeout(()=>ScrollTrigger.refresh(),300);
  }

  /* IntersectionObserver reveal — bulletproof, fires for in-view elements on load */
  function revealOnScroll(){
    const els=[...document.querySelectorAll('[data-fade],[data-lines],[data-fold]')].filter(el=>!el.closest('#hero'));
    if(reduce || !('IntersectionObserver' in window)){ els.forEach(el=>el.classList.add('reveal-in')); return; }
    els.forEach(el=>el.classList.add('reveal-init'));
    const io=new IntersectionObserver((ents)=>{
      ents.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('reveal-in'); io.unobserve(e.target); } });
    },{rootMargin:'0px 0px -7% 0px',threshold:0.04});
    els.forEach(el=>io.observe(el));
    // safety net: anything still hidden after 2.5s gets shown
    setTimeout(()=>els.forEach(el=>el.classList.add('reveal-in')),2500);
  }

  /* products page: instant client-side category filter (no reload) */
  function setupFilter(){
    const tabs=[...document.querySelectorAll('.filter-tabs button')];
    const cards=[...document.querySelectorAll('.gallery .pcard')];
    if(!tabs.length || !cards.length) return;
    const valid=tabs.map(t=>t.dataset.cat);
    function apply(cat){
      cards.forEach(c=>{ c.classList.toggle('is-hidden', !(cat==='all' || c.dataset.cat===cat)); });
      tabs.forEach(t=>t.classList.toggle('is-active', t.dataset.cat===cat));
      if(typeof ScrollTrigger!=='undefined') ScrollTrigger.refresh();
    }
    tabs.forEach(t=>t.addEventListener('click',()=>{
      apply(t.dataset.cat);
      history.replaceState(null,'','#'+t.dataset.cat);
    }));
    const hash=(location.hash||'').replace('#','');
    apply(valid.includes(hash)?hash:'all');
  }

  /* split a heading's text into masked lines (lightweight SplitText) */
  function splitLines(el){
    const html=el.innerHTML;
    const text=document.createElement('span');
    text.innerHTML=html; // preserves inline tags like <em>
    function wrapWords(parent){
      parent.childNodes.forEach(ch=>{
        if(ch.nodeType===3){
          const frag=document.createDocumentFragment();
          ch.textContent.split(/(\s+)/).forEach(tk=>{
            if(tk.trim()===''){frag.appendChild(document.createTextNode(tk));}
            else{const w=document.createElement('span');w.className='ln-w';w.style.display='inline-block';w.textContent=tk;frag.appendChild(w);}
          });
          ch.replaceWith(frag);
        }else if(ch.nodeType===1){ wrapWords(ch); }
      });
    }
    wrapWords(text);
    el.innerHTML=''; el.appendChild(text);
    // group words by top offset into lines
    const ws=[...el.querySelectorAll('.ln-w')];
    if(!ws.length){return;}
    const lines=[]; let cur=[], top=null;
    ws.forEach(w=>{ const t=w.offsetTop; if(top===null||Math.abs(t-top)<4){cur.push(w);top=(top===null)?t:top;} else {lines.push(cur);cur=[w];top=t;} });
    if(cur.length)lines.push(cur);
    // rebuild as masked lines
    el.innerHTML='';
    lines.forEach(ln=>{
      const mask=document.createElement('span'); mask.style.display='block'; mask.style.overflow='hidden';
      mask.style.paddingBottom='.14em'; mask.style.marginBottom='-.14em'; /* room for descenders, layout unchanged */
      const inner=document.createElement('span'); inner.className='ln-i'; inner.style.display='block';
      ln.forEach((w,idx)=>{ inner.appendChild(w); if(idx<ln.length-1) inner.appendChild(document.createTextNode(' ')); });
      mask.appendChild(inner); el.appendChild(mask);
    });
  }

  /* products: desktop = pinned horizontal; mobile = swipe carousel; reduced = stack */
  function setupProducts(){
    const wrap=document.getElementById('prodWrap'), track=document.getElementById('prodTrack'),
          bar=document.getElementById('prodBar');
    if(!wrap || !track) return;            // page has no products section
    const panels=track.querySelectorAll('.prod-panel');
    setupPoke();                            // clickable motifs (all viewports)
    const isMobile=window.matchMedia('(max-width:820px)').matches;
    if(reduce){ buildVerticalProducts(); return; }
    if(isMobile){ setupMobileCarousel(wrap,track,bar); return; }

    const dist=()=> track.scrollWidth - window.innerWidth;
    const horiz=gsap.to(track,{x:()=>-dist(),ease:'none',
      scrollTrigger:{
        trigger:'#products',start:'top top',end:()=>'+='+dist(),
        pin:true,scrub:.6,invalidateOnRefresh:true,anticipatePin:1,
        onUpdate:s=>{bar.style.width=(s.progress*100)+'%';}
      }});
    panels.forEach(p=>{ if(p.classList.contains('cat')){
      gsap.from(p.querySelector('.big'),{xPercent:8,opacity:0,ease:'power2.out',
        scrollTrigger:{trigger:p,containerAnimation:horiz,start:'left 70%',end:'left 30%',scrub:true}});
    }});
  }

  /* finger-swipe carousel for phones (native scroll-snap) + swipe UI */
  function setupMobileCarousel(wrap,track,bar){
    wrap.classList.add('carousel');
    const panels=track.querySelectorAll('.prod-panel');
    const section=wrap.closest('#products');

    // build swipe indicator (label + dots) below the carousel
    const ui=document.createElement('div'); ui.className='swipe-ui';
    const label=document.createElement('span'); label.className='swipe-label';
    label.innerHTML='Swipe to explore <span>&rarr;</span>';
    const dots=document.createElement('div'); dots.className='swipe-dots';
    panels.forEach((_,i)=>{ const b=document.createElement('button'); b.setAttribute('aria-label','Go to slide '+(i+1));
      b.addEventListener('click',()=>wrap.scrollTo({left:i*wrap.clientWidth,behavior:'smooth'}));
      dots.appendChild(b); });
    ui.appendChild(label); ui.appendChild(dots);
    if(section) section.appendChild(ui);

    const onScroll=()=>{
      const max=track.scrollWidth-wrap.clientWidth;
      if(bar) bar.style.width=(max>0?(wrap.scrollLeft/max*100):0)+'%';
      const idx=Math.round(wrap.scrollLeft/wrap.clientWidth);
      [...dots.children].forEach((d,i)=>d.classList.toggle('on',i===idx));
    };
    wrap.addEventListener('scroll',onScroll,{passive:true});
    onScroll();
  }

  /* click a category motif → playful one-shot reaction, then idle resumes */
  function setupPoke(){
    document.querySelectorAll('.cat-deco').forEach(d=>{
      d.addEventListener('click',()=>{
        d.classList.remove('poke'); void d.offsetWidth; d.classList.add('poke');
        clearTimeout(d._pk); d._pk=setTimeout(()=>d.classList.remove('poke'),850);
      });
    });
  }

  function buildVerticalProducts(noAnim){
    const wrap=document.getElementById('prodWrap');
    const track=document.getElementById('prodTrack');
    if(!wrap || !track) return;
    wrap.style.height='auto'; track.style.display='block'; track.style.transform='none';
    track.querySelectorAll('.prod-panel').forEach(p=>{p.style.flex='none';p.style.width='auto';p.style.minHeight='auto';p.style.padding='clamp(3.5rem,11vw,7rem) var(--pad)';p.style.borderBottom='1px solid rgba(243,239,230,.12)';});
    const bar=document.getElementById('prodBar'); if(bar) bar.parentElement.style.display='none';
    if(hasGSAP && !noAnim){
      gsap.utils.toArray('#prodTrack .cat .big').forEach(b=>{
        gsap.from(b,{y:40,opacity:0,duration:1,ease:'power3.out',scrollTrigger:{trigger:b,start:'top 85%'}});
      });
    }
  }

  /* marquee: single-row drift + scroll velocity boost */
  function setupMarquee(){
    const m1=document.getElementById('m1');
    if(!m1) return;
    const half1=m1.scrollWidth/2;
    let x1=0;
    function loop(){
      const v=lenis? (lenis.velocity||0):0;
      const boost=1+Math.min(Math.abs(v)*0.18,7);
      x1-=0.6*boost;
      if(x1<=-half1)x1+=half1; if(x1>0)x1-=half1;
      m1.style.transform=`translate3d(${x1}px,0,0)`;
      requestAnimationFrame(loop);
    }
    if(!reduce) loop();
  }

  /* ---------- RAIL active state via ScrollTrigger ---------- */
  window.addEventListener('load',()=>{
    if(!hasGSAP) return;
    const ids=['hero','about','products','industries','contact'];
    ids.forEach(id=>{
      const sec=document.getElementById(id); if(!sec) return;
      ScrollTrigger.create({trigger:sec,start:'top 55%',end:'bottom 55%',
        onToggle:self=>{ if(self.isActive){
          document.querySelectorAll('.rail button').forEach(b=>b.classList.toggle('active',b.dataset.go===id));
        }}});
    });
    setTimeout(()=>ScrollTrigger.refresh(),400);
  });

})();
