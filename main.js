/* Bishwas Adhikari — shared behaviour for every page.
   Each module checks for its elements first, so pages only run what they use. */
(function(){
  'use strict';
  var $=function(s,c){return (c||document).querySelector(s)};
  var $$=function(s,c){return Array.prototype.slice.call((c||document).querySelectorAll(s))};
  var NS='http://www.w3.org/2000/svg';
  var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer=matchMedia('(hover: hover) and (pointer: fine)').matches;
  function el(tag,attrs,parent){var e=document.createElementNS(NS,tag);for(var k in attrs)e.setAttribute(k,attrs[k]);if(parent)parent.appendChild(e);return e}

  /* ---------- Theme toggle (persisted) ---------- */
  var themeBtn=$('#theme');
  if(themeBtn)themeBtn.addEventListener('click',function(){
    var root=document.documentElement;
    var cur=root.getAttribute('data-theme')||(matchMedia('(prefers-color-scheme: light)').matches?'light':'dark');
    var next=cur==='dark'?'light':'dark';
    root.setAttribute('data-theme',next);
    try{localStorage.setItem('theme',next)}catch(e){}
  });

  /* ---------- Nav: glass after scrolling, mobile menu ---------- */
  var shell=$('#navShell');
  if(shell){
    var sentinel=document.createElement('div');
    sentinel.style.cssText='position:absolute;top:0;left:0;height:40px;width:1px;pointer-events:none';
    document.body.prepend(sentinel);
    new IntersectionObserver(function(e){shell.classList.toggle('scrolled',!e[0].isIntersecting)}).observe(sentinel);
  }
  var menuBtn=$('#menuBtn'),navLinks=$('#navLinks');
  if(menuBtn&&navLinks){
    var setMenu=function(open){navLinks.classList.toggle('open',open);menuBtn.setAttribute('aria-expanded',String(open));menuBtn.setAttribute('aria-label',open?'Close menu':'Open menu')};
    menuBtn.addEventListener('click',function(){setMenu(!navLinks.classList.contains('open'))});
    $$('a',navLinks).forEach(function(a){a.addEventListener('click',function(){setMenu(false)})});
    document.addEventListener('keydown',function(e){if(e.key==='Escape')setMenu(false)});
  }

  /* ---------- Scroll reveal ---------- */
  var revealObs=new IntersectionObserver(function(entries){
    entries.forEach(function(en){if(en.isIntersecting){en.target.classList.add('in');revealObs.unobserve(en.target)}});
  },{rootMargin:'0px 0px -10% 0px'});
  $$('[data-reveal]').forEach(function(n){revealObs.observe(n)});

  /* ---------- Text scramble for numeric readouts ---------- */
  function scramble(node,finalText,dur){
    if(reduce){node.textContent=finalText;return}
    var start=performance.now(),chars='0123456789';
    (function tick(now){
      var p=Math.min(1,(now-start)/dur),settled=Math.floor(p*finalText.length),out='';
      for(var i=0;i<finalText.length;i++){
        var c=finalText[i];
        out+=(i<settled||!/[0-9]/.test(c))?c:chars[(Math.random()*10)|0];
      }
      node.textContent=out;
      if(p<1)requestAnimationFrame(tick);
    })(start);
  }

  /* ---------- Home hero figure: a voice wave becomes a scatter plot ---------- */
  var fig=$('#fig');
  if(fig){
    for(var k=0;k<5;k++){var gy=300+k*72;el('line',{x1:40,x2:580,y1:gy,y2:gy,'class':'grid'},fig)}
    el('line',{x1:30,x2:570,y1:240,y2:240,'class':'grid'},fig);
    var d='';
    for(var x=0;x<=540;x+=3){
      var t=x/540,env=Math.sin(Math.PI*t)*.9+.1;
      var y=120+env*(40*Math.sin(x/9)+20*Math.sin(x/3.7)+9*Math.sin(x/1.9));
      d+=(x?'L':'M')+(x+30)+' '+y.toFixed(1);
    }
    var wave=el('path',{d:d,'class':'wave'},fig);
    wave.style.setProperty('--len',Math.ceil(wave.getTotalLength()));
    el('line',{x1:30,x2:30,y1:40,y2:200,'class':'scan'},fig);

    var seed=7,rnd=function(){seed=(seed*9301+49297)%233280;return seed/233280};
    var n=28,pts=[];
    for(var i=0;i<n;i++)pts.push([60+i*(510/(n-1)),Math.max(304,Math.min(588,560-i*8.6+(rnd()-.5)*70))]);
    var mx=0,my=0;pts.forEach(function(p){mx+=p[0];my+=p[1]});mx/=n;my/=n;
    var sxy=0,sxx=0,syy=0;pts.forEach(function(p){var dx=p[0]-mx,dy=p[1]-my;sxy+=dx*dy;sxx+=dx*dx;syy+=dy*dy});
    var b=sxy/sxx,a=my-b*mx,r=sxy/Math.sqrt(sxx*syy);
    el('line',{x1:45,y1:(a+b*45).toFixed(1),x2:575,y2:(a+b*575).toFixed(1),'class':'fit'},fig);
    pts.forEach(function(p,i){var c=el('circle',{cx:p[0].toFixed(1),cy:p[1].toFixed(1),r:4.5,'class':'dot'},fig);c.style.animationDelay=(2.2+i*.045)+'s'});
    el('text',{x:30,y:28},fig).textContent='voice';
    el('text',{x:40,y:282},fig).textContent='data';
    el('text',{x:580,y:612,'text-anchor':'end'},fig).textContent='time';
    $('#figN').textContent='n = '+n;
    // SVG y grows downward, so flip the sign to report the visual (upward) correlation
    setTimeout(function(){scramble($('#figR b'),'r = '+(-r).toFixed(2),900)},reduce?0:3400);
  }

  /* ---------- Marquee: duplicate content for a seamless loop ---------- */
  $$('.marquee-track').forEach(function(track){
    var clone=$('ul',track).cloneNode(true);clone.setAttribute('aria-hidden','true');track.appendChild(clone);
  });

  /* ---------- Periodic stream chart (two identical halves loop seamlessly) ---------- */
  var streamLine=$('#streamLine');
  if(streamLine){
    var line='',H=180;
    for(var sx=0;sx<=800;sx+=4){
      var u=(sx%400)/400*Math.PI*2;
      line+=(sx?'L':'M')+sx+' '+(H*.55-28*Math.sin(u)-14*Math.sin(u*3+1)-8*Math.sin(u*5+2)).toFixed(1);
    }
    streamLine.setAttribute('d',line);
    $('#streamArea').setAttribute('d',line+'L800 '+H+'L0 '+H+'Z');
  }

  /* ---------- Spotlight surfaces (CSS vars only) ---------- */
  if(finePointer){
    $$('.panel,.essay-feature').forEach(function(t){
      t.addEventListener('pointermove',function(e){var r=t.getBoundingClientRect();t.style.setProperty('--mx',(e.clientX-r.left)+'px');t.style.setProperty('--my',(e.clientY-r.top)+'px')});
    });
  }

  /* ---------- Magnetic buttons: transform only, batched in rAF ---------- */
  if(finePointer&&!reduce){
    $$('.magnet').forEach(function(m){
      var raf=0,tx=0,ty=0;
      var apply=function(){raf=0;m.style.transform='translate('+tx+'px,'+ty+'px)'};
      m.addEventListener('pointermove',function(e){
        var r=m.getBoundingClientRect();
        tx=(e.clientX-r.left-r.width/2)*.22;ty=(e.clientY-r.top-r.height/2)*.3;
        m.style.transitionDuration='.2s';
        if(!raf)raf=requestAnimationFrame(apply);
      });
      m.addEventListener('pointerleave',function(){tx=ty=0;m.style.transitionDuration='';if(!raf)raf=requestAnimationFrame(apply)});
    });
  }

  /* ---------- YouTube facade: thumbnail first, iframe only on click ---------- */
  function ytThumb(id){return 'https://i.ytimg.com/vi/'+id+'/hqdefault.jpg'}
  function ytReady(yt){
    var img=$('img',yt);if(!img)return;
    var done=function(){yt.classList.add('ready')};
    if(img.complete&&img.naturalWidth)done();else{img.addEventListener('load',done);img.addEventListener('error',done)}
  }
  function ytPlay(yt){
    var id=yt.dataset.yt,old=$('iframe',yt);if(old)old.remove();
    var f=document.createElement('iframe');
    f.src='https://www.youtube-nocookie.com/embed/'+id+'?autoplay=1&rel=0&modestbranding=1';
    f.title=(yt.dataset.title||'YouTube video')+' on YouTube';
    f.allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    f.allowFullscreen=true;
    yt.appendChild(f);yt.classList.add('playing');$('.yt-cover',yt).hidden=true;
  }
  function ytSet(yt,id,title,sub){
    var old=$('iframe',yt);if(old)old.remove();
    yt.classList.remove('playing','ready');$('.yt-cover',yt).hidden=false;
    yt.dataset.yt=id;yt.dataset.title=title;
    $('.yt-title',yt).textContent=title;$('.yt-sub',yt).textContent=sub;
    $('.yt-cover',yt).setAttribute('aria-label','Play '+title+', '+sub);
    $('img',yt).src=ytThumb(id);ytReady(yt);
  }
  $$('.yt').forEach(function(yt){
    ytReady(yt);
    $('.yt-cover',yt).addEventListener('click',function(){ytPlay(yt)});
  });

  /* ---------- Music page: song versions drive the main player ---------- */
  var stage=$('#stage');
  if(stage){
    var vers=$$('.ver'),nowViews=$('#nowViews'),nowLink=$('#nowLink');
    vers.forEach(function(v){v.addEventListener('click',function(){
      vers.forEach(function(o){o.setAttribute('aria-pressed',String(o===v))});
      ytSet(stage,v.dataset.id,v.dataset.title,v.dataset.kind);
      nowViews.textContent=v.dataset.views+' views';
      nowLink.href='https://www.youtube.com/watch?v='+v.dataset.id;
      ytPlay(stage);
      if(innerWidth<1024)stage.scrollIntoView({behavior:reduce?'auto':'smooth',block:'center'});
    })});
  }

  /* ---------- Writing: filter + search + empty state ---------- */
  var postsWrap=$('#posts');
  if(postsWrap){
    var chips=$$('.chip'),posts=$$('.post'),q=$('#q'),empty=$('#empty'),emptyText=$('#emptyText'),filter='all';
    chips.forEach(function(c){
      var f=c.dataset.f;
      $('.n',c).textContent=posts.filter(function(p){return f==='all'||p.dataset.c===f}).length;
    });
    var applyFilter=function(){
      var term=q.value.trim().toLowerCase(),shown=0;
      posts.forEach(function(p){
        var ok=(filter==='all'||p.dataset.c===filter)&&(!term||p.textContent.toLowerCase().indexOf(term)>-1);
        p.hidden=!ok;p.classList.remove('enter');
        if(ok){void p.offsetWidth;p.style.setProperty('--i',shown++);p.classList.add('enter')}
      });
      empty.hidden=shown>0;
      if(!shown){
        var label=filter==='all'?'':' in '+$('.chip[aria-pressed="true"]').firstChild.textContent.trim();
        emptyText.textContent=term?'No essays match “'+q.value.trim()+'”'+label+'. Try a broader word.':'No essays'+label+' yet. New ones are on the way.';
      }
    };
    chips.forEach(function(c){c.addEventListener('click',function(){
      filter=c.dataset.f;chips.forEach(function(o){o.setAttribute('aria-pressed',String(o===c))});applyFilter();
    })});
    var deb;q.addEventListener('input',function(){clearTimeout(deb);deb=setTimeout(applyFilter,120)});
    $('#clear').addEventListener('click',function(){q.value='';filter='all';chips.forEach(function(o){o.setAttribute('aria-pressed',String(o.dataset.f==='all'))});applyFilter();q.focus()});
  }

  /* ---------- Sparklines (drawn when revealed) ---------- */
  $$('[data-spark]').forEach(function(host){
    var v=host.dataset.spark.split(',').map(Number),svg=$('.spark',host)||host;
    var min=Math.min.apply(0,v),max=Math.max.apply(0,v),d='';
    var X=function(i){return 4+i*(120/(v.length-1))},Y=function(n){return 50-(n-min)/(max-min||1)*42};
    v.forEach(function(n,i){d+=(i?'L':'M')+X(i).toFixed(1)+' '+Y(n).toFixed(1)});
    var path=el('path',{d:d},svg);path.style.setProperty('--len',Math.ceil(path.getTotalLength()));
    el('circle',{cx:X(v.length-1).toFixed(1),cy:Y(v[v.length-1]).toFixed(1),r:3.5},svg);
  });

  /* ---------- Subscribe form: validation, loading, success (demo) ---------- */
  var form=$('#subForm');
  if(form){
    var input=$('#em'),err=$('#emErr'),btn=$('#subBtn');
    var showErr=function(msg){err.hidden=!msg;$('span',err).textContent=msg||'';input.setAttribute('aria-invalid',msg?'true':'false')};
    input.addEventListener('input',function(){if(input.getAttribute('aria-invalid')==='true')showErr('')});
    form.addEventListener('submit',function(e){
      e.preventDefault();
      var v=input.value.trim();
      if(!v){showErr('Enter your email address to subscribe.');input.focus();return}
      if(!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)){showErr('That address looks incomplete. Check for a missing @ or domain.');input.focus();return}
      showErr('');btn.classList.add('loading');btn.setAttribute('aria-busy','true');
      setTimeout(function(){
        btn.classList.remove('loading');btn.removeAttribute('aria-busy');
        form.hidden=true;$('#doneText').textContent='The next essay will go to '+v+'.';$('#done').hidden=false;
      },reduce?0:1200);
    });
  }

  /* ---------- Decorative equalizers ---------- */
  $$('[data-eq]').forEach(function(node){
    var count=+node.dataset.eq||24;
    for(var i=0;i<count;i++){
      var b=document.createElement('i');
      b.style.setProperty('--h',(.2+Math.abs(Math.sin(i/2.4)*Math.cos(i/5))*.8).toFixed(3));
      b.style.setProperty('--s',(.45+((i*37)%11)/14).toFixed(2)+'s');
      b.style.setProperty('--d',(-((i*53)%17)/10).toFixed(2)+'s');
      node.appendChild(b);
    }
  });

  /* ---------- Music page: thumbnails and badge jump to a song and play it ---------- */
  $$('[data-play]').forEach(function(a){
    var ver=$('.ver[data-id="'+a.dataset.play+'"]');
    if(!ver||!stage)return;
    a.addEventListener('click',function(e){
      e.preventDefault();
      $('#watch').scrollIntoView({behavior:reduce?'auto':'smooth',block:'start'});
      ver.click();
    });
  });

  /* If GSAP did not load (home page only), show the hero immediately */
  if(!window.gsap)document.documentElement.classList.remove('g-wait');

  $$('.yr').forEach(function(n){n.textContent=new Date().getFullYear()});
})();
