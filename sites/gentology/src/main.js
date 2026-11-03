const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
const $=id=>document.getElementById(id);

/* hero: deco sunburst + lamp light */
(function(){
  const hero=$('hero');if(!hero)return;
  const NS='http://www.w3.org/2000/svg',cx=600,cy=700;
  hero.querySelectorAll('h1 span').forEach((el,i)=>el.style.setProperty('--i',i));
  const N=37,mid=(N-1)/2;
  const steps=[[620,250],[760,200],[900,150]];
  function stepPath(w,ty){const l=cx-w/2,r=cx+w/2,s=26;return `M${l} 700 V${ty+3*s} H${l+s} V${ty+2*s} H${l+2*s} V${ty+s} H${l+3*s} V${ty} H${r-3*s} V${ty+s} H${r-2*s} V${ty+2*s} H${r-s} V${ty+3*s} H${r} V700`}
  hero.querySelectorAll('.deco').forEach(svg=>{
    const rg=svg.querySelector('.rays'),sg=svg.querySelector('.steps');
    for(let i=0;i<N;i++){const a=Math.PI+Math.PI*(i/(N-1)),long=i%2===0,r0=long?150:240,r1=long?1100:620;
      const l=document.createElementNS(NS,'line');
      l.setAttribute('x1',cx+Math.cos(a)*r0);l.setAttribute('y1',cy+Math.sin(a)*r0);l.setAttribute('x2',cx+Math.cos(a)*r1);l.setAttribute('y2',cy+Math.sin(a)*r1);
      l.setAttribute('pathLength',1);l.classList.add('dr');l.style.setProperty('--d',(Math.abs(i-mid)*.035)+'s');rg.appendChild(l)}
    steps.forEach(([w,ty],k)=>{const p=document.createElementNS(NS,'path');p.setAttribute('d',stepPath(w,ty));p.setAttribute('pathLength',1);p.classList.add('dr');p.style.setProperty('--d',(.5+k*.18)+'s');sg.appendChild(p)});
    [320,470].forEach((r,k)=>{const c=document.createElementNS(NS,'path');c.setAttribute('d',`M${cx-r} 700 A${r} ${r} 0 0 1 ${cx+r} 700`);c.setAttribute('pathLength',1);c.classList.add('dr');c.style.setProperty('--d',(.3+k*.2)+'s');sg.appendChild(c)});
  });
  if(reduce){hero.classList.add('lamp');return}
  const lit=hero.querySelector('.deco.lit');let tx=50,ty=55,x=50,y=55,user=0,t0=performance.now();
  setTimeout(()=>hero.classList.add('lamp'),1600);
  hero.addEventListener('pointermove',e=>{if(e.pointerType!=='mouse')return;const r=hero.getBoundingClientRect();tx=(e.clientX-r.left)/r.width*100;ty=(e.clientY-r.top)/r.height*100;user=performance.now()});
  let vis=true;new IntersectionObserver(([en])=>{vis=en.isIntersecting;if(vis)requestAnimationFrame(loop)}).observe(hero);
  function loop(now){if(!vis)return;
    if(now-user>2500){const t=(now-t0)/1000;tx=50+Math.sin(t*.23)*30;ty=52+Math.sin(t*.31+1)*16}
    x+=(tx-x)*.06;y+=(ty-y)*.06;lit.style.setProperty('--mx',x+'%');lit.style.setProperty('--my',y+'%');requestAnimationFrame(loop)}
  requestAnimationFrame(loop);
})();

/* reveal */
document.documentElement.classList.add('js');
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.remove('pre');io.unobserve(e.target)}}),{threshold:.12});
document.querySelectorAll('.reveal').forEach(el=>{if(el.getBoundingClientRect().top>innerHeight){el.classList.add('pre');io.observe(el)}});

/* waiting list call card: shows the branch phone number only. No queue numbers are generated. */
(function(){
  const ticket=$('ticket'),data=$('branch-data');if(!ticket||!data)return;
  const B=JSON.parse(data.textContent);
  function show(i){
    const b=B[i],fill=()=>{ticket.classList.remove('blank');
      $('tBr').textContent=b.name;$('tAddr').textContent=b.address;
      const tel=$('tTel');tel.textContent=b.tel;tel.href='tel:'+b.e164;tel.removeAttribute('tabindex');tel.removeAttribute('aria-hidden')};
    if(ticket.classList.contains('out')&&!reduce){ticket.classList.remove('out');setTimeout(()=>{fill();ticket.classList.add('out')},700)}
    else{fill();requestAnimationFrame(()=>ticket.classList.add('out'))}
  }
  document.querySelectorAll('.branches button').forEach(btn=>btn.addEventListener('click',()=>{
    document.querySelectorAll('.branches button').forEach(o=>o.setAttribute('aria-pressed',o===btn));show(+btn.dataset.b)}));
})();

/* loyalty card: demo only, nothing is stored */
(function(){
  const box=$('holes');if(!box)return;
  const holes=[...box.querySelectorAll('.hole:not(.free)')],free=$('freeHole'),pmsg=$('pmsg'),preset=$('preset');
  const lines=['Punch the first hole.','One down. Four to go.','Two visits. Three to go.','Three visits. Two to go.','Four visits. One more.','Five visits. The next one is on the house.'];
  const count=()=>holes.filter(h=>h.classList.contains('done')).length;
  const sync=()=>{const n=count();holes.forEach((h,i)=>{h.disabled=i!==n})};
  holes.forEach((h,i)=>h.addEventListener('click',()=>{
    if(h.classList.contains('done')||i!==count())return;
    h.classList.add('done');h.setAttribute('aria-label',`Visit ${i+1}, punched`);
    if(!reduce){const c=document.createElement('span');c.className='chad';c.style.setProperty('--dx',(Math.random()*40-20)+'px');h.appendChild(c);setTimeout(()=>c.remove(),900)}
    const n=count();pmsg.textContent=lines[n];sync();
    if(n<5)holes[n].focus();
    else{free.classList.add('won');preset.hidden=false;preset.focus()}
  }));
  preset.addEventListener('click',()=>{holes.forEach((h,i)=>{h.classList.remove('done');h.setAttribute('aria-label',`Visit ${i+1}`)});free.classList.remove('won');preset.hidden=true;pmsg.textContent=lines[0];sync();holes[0].focus()});
  sync();
})();

/* hours: today + open now (Jakarta) */
(function(){
  const table=$('hours'),now=$('now');if(!table||!now)return;
  const H={};table.querySelectorAll('tr[data-d]').forEach(r=>{H[r.dataset.d]=[+r.dataset.o,+r.dataset.c]});
  const parts=new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Jakarta',weekday:'short',hour:'numeric',minute:'numeric',hour12:false}).formatToParts(new Date());
  const wd={Sun:0,Mon:1,Tue:2,Wed:3,Thu:4,Fri:5,Sat:6}[parts.find(p=>p.type==='weekday').value];
  const hr=+parts.find(p=>p.type==='hour').value%24,mn=+parts.find(p=>p.type==='minute').value,t=hr+mn/60;
  const row=table.querySelector(`tr[data-d="${wd}"]`);if(row)row.classList.add('today');
  const [o,c]=H[wd],fmt=h=>h===12?'12pm':h>12?(h-12)+'pm':h+'am';
  if(t>=o&&t<c-1)now.innerHTML=`<b>Open now</b> in Jakarta, by the published hours. Last order at ${fmt(c-1)}.`;
  else if(t>=c-1&&t<c)now.innerHTML=`<b>Last orders have passed</b> for today. We close at ${fmt(c)}.`;
  else if(t<o)now.innerHTML=`<b>Closed</b> right now. We open at ${fmt(o)} today.`;
  else{const n=(wd+1)%7;now.innerHTML=`<b>Closed</b> for the night. Tomorrow we open at ${fmt(H[n][0])}.`}
})();

/* parlour radio: original 1920s-style tunes synthesised with Web Audio (no audio files) */
(function(){
  const tray=$('tray'),btn=$('trayPlay');if(!tray||!btn)return;
  const AC=window.AudioContext||window.webkitAudioContext;if(!AC){tray.hidden=true;document.querySelectorAll('[data-music]').forEach(b=>b.hidden=true);return}
  const titleEl=$('trayTitle'),vol=$('trayVol'),next=$('trayNext');
  const N={C:0,Db:1,D:2,Eb:3,E:4,F:5,Gb:6,G:7,Ab:8,A:9,Bb:10,B:11};
  const ch=(r,q)=>{const b=N[r]+48,i=q==='7'?[0,4,7,10]:q==='m'?[0,3,7,12]:q==='6'?[0,4,7,9]:[0,4,7,12];return i.map(x=>b+x)};
  const T=[
    {name:'Cideng Stomp',bpm:126,beats:4,swing:.64,prog:[['C','6'],['C','6'],['A','7'],['A','7'],['D','7'],['G','7'],['C','6'],['G','7']],pat:[[2,1,0,1,2,3,2,-1],[3,2,1,2,3,-1,4,3],[1,2,3,4,3,2,1,-1],[4,3,2,1,0,-1,2,-1]]},
    {name:'Grogol Blues',bpm:84,beats:4,swing:.66,prog:[['F','7'],['F','7'],['F','7'],['F','7'],['Bb','7'],['Bb','7'],['F','7'],['F','7'],['C','7'],['Bb','7'],['F','7'],['C','7']],pat:[[3,-1,2,1,-1,-1,0,-1],[-1,1,2,3,4,-1,3,-1],[2,-1,-1,1,0,-1,-1,-1]]},
    {name:'Cipete Waltz',bpm:138,beats:3,swing:.5,prog:[['G',''],['D','7'],['D','7'],['G',''],['G',''],['C',''],['D','7'],['G','']],pat:[[2,-1,3,-1,4,-1],[4,-1,3,2,1,-1],[0,-1,-1,-1,2,-1]]}
  ];
  let ctx=null,master=null,noise=null,ti=0,bar=0,nextT=0,timer=null,on=false;
  const hz=m=>440*Math.pow(2,(m-69)/12);
  function note(m,t,d,v,type){const o=ctx.createOscillator(),o2=ctx.createOscillator(),g=ctx.createGain();o.type=type||'triangle';o2.type='sine';o.frequency.value=hz(m);o2.frequency.value=hz(m)*2;
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.008);g.gain.exponentialRampToValueAtTime(.0008,t+d);
    const g2=ctx.createGain();g2.gain.value=.25;o.connect(g);o2.connect(g2);g2.connect(g);g.connect(master);o.start(t);o2.start(t);o.stop(t+d+.05);o2.stop(t+d+.05)}
  function crackle(){const len=ctx.sampleRate*2,b=ctx.createBuffer(1,len,ctx.sampleRate),d=b.getChannelData(0);
    for(let i=0;i<len;i++)d[i]=(Math.random()<.0006?(Math.random()*2-1):0)+(Math.random()*2-1)*.02;
    const s=ctx.createBufferSource();s.buffer=b;s.loop=true;const f=ctx.createBiquadFilter();f.type='highpass';f.frequency.value=1200;const g=ctx.createGain();g.gain.value=.35;
    s.connect(f);f.connect(g);g.connect(master);s.start();return s}
  function schedBar(t0){const tune=T[ti],beat=60/tune.bpm,[r,q]=tune.prog[bar%tune.prog.length],c=ch(r,q),root=N[r]+36;
    for(let b=0;b<tune.beats;b++){const t=t0+b*beat;
      if(b===0)note(root,t,beat*.9,.22,'triangle');
      else if(tune.beats===4&&b===2)note(root+7,t,beat*.9,.2,'triangle');
      else c.slice(0,3).forEach(m=>note(m+12,t,beat*.45,.06));}
    const p=tune.pat[bar%tune.pat.length],tones=c.concat(c.map(x=>x+12));
    p.forEach((ix,k)=>{if(ix<0)return;const pair=Math.floor(k/2),off=k%2?tune.swing:0,t=t0+(pair+off)*beat;note(tones[ix]+12,t,beat*.6,.12,'triangle')});
    return tune.beats*beat}
  function loop(){while(nextT<ctx.currentTime+.2){nextT+=schedBar(nextT);bar++}}
  function setTitle(){titleEl.textContent=T[ti].name}
  function start(){if(!ctx){ctx=new AC();master=ctx.createGain();master.connect(ctx.destination)}
    master.gain.value=(+vol.value/100)*.5;if(ctx.state==='suspended')ctx.resume();if(!noise)noise=crackle();
    nextT=ctx.currentTime+.08;timer=setInterval(loop,25);loop();on=true;sync()}
  function stop(){clearInterval(timer);timer=null;if(ctx)ctx.suspend();on=false;sync()}
  function sync(){btn.setAttribute('aria-pressed',on);btn.setAttribute('aria-label',on?'Pause parlour music':'Play parlour music');document.documentElement.classList.toggle('music-on',on);
    document.querySelectorAll('[data-music] span').forEach(s=>s.textContent=on?'Pause the parlour radio':'Play the parlour radio')}
  btn.addEventListener('click',()=>on?stop():start());
  document.querySelectorAll('[data-music]').forEach(b=>b.addEventListener('click',()=>on?stop():start()));
  next.addEventListener('click',()=>{ti=(ti+1)%T.length;bar=0;setTitle();if(on){clearInterval(timer);nextT=ctx.currentTime+.08;timer=setInterval(loop,25)}});
  vol.addEventListener('input',()=>{if(master)master.gain.value=(+vol.value/100)*.5});
  setTitle();
})();


/* the work: fade frame by frame (tap a step, drag the strip, or let it play while in view) */
(function(){
  const box=$('fade');if(!box)return;
  const imgs=[...box.querySelectorAll('.fade-stage img')],btns=[...box.querySelectorAll('.fade-steps button')],range=$('fadeRange');
  let i=0,timer=null,touched=false;
  const now=$('fadeNow');const show=n=>{i=n;imgs.forEach((im,k)=>im.classList.toggle('on',k===n));btns.forEach((b,k)=>b.setAttribute('aria-selected',k===n));range.value=n;if(now){const b=btns[n];now.innerHTML='';const t=document.createElement('b');t.textContent=(n+1)+'. '+b.querySelector('b').textContent;now.append(t,' '+b.querySelector('b + span').textContent)}};
  const stop=()=>{touched=true;clearInterval(timer);timer=null};
  btns.forEach(b=>b.addEventListener('click',()=>{stop();show(+b.dataset.i)}));
  range.addEventListener('input',()=>{stop();show(+range.value)});
  if(!reduce)new IntersectionObserver(([e])=>{if(touched)return;if(e.isIntersecting&&!timer)timer=setInterval(()=>show((i+1)%imgs.length),2200);else if(!e.isIntersecting){clearInterval(timer);timer=null}},{threshold:.4}).observe(box);
})();

;(function(){var s=document.createElement("script");s.src="https://arcwise-front-desk.vercel.app/widget.js";s.defer=true;s.setAttribute("data-client","gentology");s.setAttribute("data-mobile-bottom","84");s.setAttribute("data-mobile-at","560");document.body.appendChild(s)})();
