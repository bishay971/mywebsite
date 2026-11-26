/* Home page scroll choreography (GSAP + ScrollTrigger).
   Loaded only on index.html, after gsap, ScrollTrigger and main.js. */
(function(){
  'use strict';
  var root=document.documentElement;
  function release(){root.classList.remove('g-wait')}
  if(!window.gsap||!window.ScrollTrigger){release();return}
  gsap.registerPlugin(ScrollTrigger);
  var $=function(s){return document.querySelector(s)};
  var all=function(s){return gsap.utils.toArray(s)};

  // Wrap each word in a span so it can be revealed on scroll.
  // Element children (like an accent <span>) are kept intact as one "word".
  function splitWords(el){
    var out=[];
    if(!el)return out;
    Array.prototype.slice.call(el.childNodes).forEach(function(n){
      if(n.nodeType===3){
        var frag=document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(function(part){
          if(!part)return;
          if(/^\s+$/.test(part)){frag.appendChild(document.createTextNode(part));return}
          var s=document.createElement('span');s.className='wd';s.textContent=part;frag.appendChild(s);out.push(s);
        });
        n.parentNode.replaceChild(frag,n);
      }else if(n.nodeType===1){n.classList.add('wd');out.push(n)}
    });
    return out;
  }
  var essayWords=splitWords($('.essay-body h3'));
  var quoteWords=splitWords($('.quote'));

  var mm=gsap.matchMedia();
  mm.add({motion:'(prefers-reduced-motion: no-preference)',desktop:'(min-width: 1024px)'},function(ctx){
    var c=ctx.conditions;
    if(!c.motion){release();return}
    root.classList.add('gsap-on');

    /* 1. Hero intro: lines rise out of their masks, then the supporting pieces */
    gsap.timeline({defaults:{ease:'expo.out'}})
      .from('.h-line > span',{yPercent:115,duration:1.2,stagger:.09})
      .from('[data-g="status"]',{y:16,autoAlpha:0,duration:.8},.1)
      .from('[data-g="lead"],[data-g="btns"],[data-g="index"]',{y:24,autoAlpha:0,duration:1,stagger:.1},.45)
      .from('[data-g="fig"]',{y:60,scale:.94,autoAlpha:0,duration:1.4},.25);
    release();

    /* 2. Hero drifts apart as you leave it */
    var heroST={trigger:'.hero',start:'top top',end:'bottom top',scrub:true};
    gsap.to('.hero-copy',{yPercent:-18,autoAlpha:.2,ease:'none',scrollTrigger:heroST});
    gsap.to('.hero-side',{yPercent:c.desktop?-12:-4,ease:'none',scrollTrigger:heroST});

    /* 3. Marquee loops on its own and speeds up with scroll velocity */
    var track=$('.marquee .marquee-track');
    if(track){
      var loop=gsap.to(track,{xPercent:-50,ease:'none',duration:44,repeat:-1});
      ScrollTrigger.create({start:0,end:'max',onUpdate:function(self){
        var boost=1+Math.min(Math.abs(self.getVelocity())/220,9);
        gsap.to(loop,{timeScale:boost,duration:.2,overwrite:true,onComplete:function(){
          gsap.to(loop,{timeScale:1,duration:1.4,ease:'power2.out'});
        }});
      }});
    }

    /* 4. Themed bands grow into place */
    all('.band[data-grow]').forEach(function(b){
      gsap.fromTo(b,{scale:c.desktop?.92:.97,y:48},{scale:1,y:0,ease:'none',
        scrollTrigger:{trigger:b,start:'top bottom',end:'top 30%',scrub:.6}});
    });

    /* 5. Music: video straightens up, badge turns with scroll, views count up */
    gsap.fromTo('.hl-music .yt-wrap',{rotate:-3,yPercent:10},{rotate:0,yPercent:0,ease:'none',
      scrollTrigger:{trigger:'#music',start:'top bottom',end:'center center',scrub:.8}});
    gsap.to('.hl-music .spin-badge svg',{rotate:300,ease:'none',
      scrollTrigger:{trigger:'#music',start:'top bottom',end:'bottom top',scrub:true}});
    var num=$('[data-count]');
    if(num){
      var target=+num.dataset.count,suf=num.dataset.suffix||'',o={v:0};
      gsap.to(o,{v:target,duration:1.8,ease:'power3.out',
        scrollTrigger:{trigger:num,start:'top 85%',once:true},
        onStart:function(){num.textContent='0'+suf},
        onUpdate:function(){num.textContent=Math.round(o.v)+suf}});
    }

    /* 6. Statistics: pinned on desktop while the table "builds" */
    var stats=$('#statistics .hl-stats');
    if(stats){
      var tl=gsap.timeline({scrollTrigger:c.desktop
        ?{trigger:stats,start:'center center',end:'+=900',pin:true,scrub:.8}
        :{trigger:stats,start:'top 75%'}});
      tl.from('#statistics .hl-copy > *',{y:30,autoAlpha:0,stagger:.08,duration:.6})
        .from('#statistics .cl',{autoAlpha:.06,x:-12,stagger:.22,duration:.5},'<.15')
        .fromTo('#statistics .mini-tbl',{clipPath:'inset(0 0 100% 0 round 18px)'},{clipPath:'inset(0 0 0% 0 round 18px)',duration:1.2,ease:'none'},'<.4')
        .from('#statistics .mini-tbl i',{scaleX:0,transformOrigin:'right',stagger:.05,duration:.5},'-=.6');
    }

    /* 7. Writing and About: words light up as you read down */
    [[essayWords,'.essay-body h3'],[quoteWords,'.quote']].forEach(function(pair){
      if(!pair[0].length)return;
      gsap.fromTo(pair[0],{opacity:.14},{opacity:1,stagger:.1,ease:'none',
        scrollTrigger:{trigger:pair[1],start:'top 82%',end:'top 38%',scrub:true}});
    });

    /* 8. Portrait parallax */
    gsap.fromTo('.portrait-frame',{yPercent:6},{yPercent:-6,ease:'none',
      scrollTrigger:{trigger:'#about',start:'top bottom',end:'bottom top',scrub:true}});

    return function(){root.classList.remove('gsap-on')};
  });

  // Fonts and images change layout: re-measure trigger positions once they settle
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(function(){ScrollTrigger.refresh()});
  window.addEventListener('load',function(){ScrollTrigger.refresh()});
})();
