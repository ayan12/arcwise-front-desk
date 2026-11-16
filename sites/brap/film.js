/* BRAP hero film: scroll to watch a 500TX get made. Glass, resin, unfinished, paint, then the open road. */
(function(){
'use strict';
var film=document.getElementById('film');if(!film)return;
var frame=film.querySelector('.frame'),stage=document.getElementById('lid3d');
var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
var subEl=document.getElementById('sub'),tcEl=document.getElementById('tc');
var SUBS=[
 [0,.075,'Somewhere in Indonesia, a garage is still awake.'],
 [.09,.39,'First the glass. Laid into the mould by hand, one piece at a time.'],
 [.42,.535,'Then resin. It soaks the weave and sets it hard and light.'],
 [.56,.665,'Some lids stop here. We call them Unfinished.'],
 [.69,.80,'The rest get paint. Brap red, if you are asking.']
];
function cl(x){return x<0?0:x>1?1:x}
function sm(a,b,x){var t=cl((x-a)/(b-a));return t*t*(3-2*t)}
function lerp(a,b,t){return a+(b-a)*t}

/* ---------- letterbox size ---------- */
function bars(){
  var W=innerWidth,H=frame.clientHeight||innerHeight,img=H>W?W*1.25:W/2.39;
  var b=Math.max(96,Math.min(H*.3,(H-img)/2));
  film.style.setProperty('--bar',b+'px');return b;
}
var barPx=bars();

/* ---------- scroll ---------- */
var p=0,ps=0,curSub=-2;
function target(){
  if(reduce)return 1;
  var r=film.getBoundingClientRect(),span=r.height-frame.clientHeight;
  return span>0?cl(-r.top/span):1;
}
function text(v){
  var q=sm(.8,.93,v),q2=sm(.86,.99,v);
  film.style.setProperty('--q',q.toFixed(3));film.style.setProperty('--q2',q2.toFixed(3));
  var s=-1;for(var i=0;i<SUBS.length;i++)if(v>=SUBS[i][0]&&v<SUBS[i][1])s=i;
  if(s!==curSub){curSub=s;subEl.classList.remove('on');if(s>=0){subEl.textContent=SUBS[s][2];void subEl.offsetWidth;subEl.classList.add('on')}}
  var sec=v*88,f=Math.floor((sec%1)*24),ss=Math.floor(sec)%60,mm=Math.floor(sec/60);
  tcEl.textContent='00:0'+mm+':'+(ss<10?'0':'')+ss+':'+(f<10?'0':'')+f;
  film.classList.toggle('moving',v>.015);film.classList.toggle('done',v>.9);
}
document.getElementById('skip').addEventListener('click',function(){
  var top=film.getBoundingClientRect().top+scrollY+film.offsetHeight-frame.clientHeight;
  scrollTo({top:top,behavior:reduce?'auto':'smooth'});
});
if(reduce)film.classList.add('still');

/* ---------- 3D ---------- */
var T=window.THREE,renderer=null;
if(T){try{renderer=new T.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'})}catch(e){renderer=null}}
if(!renderer){film.classList.add('nogl');p=ps=target();text(ps);addEventListener('scroll',function(){text(target())},{passive:true});return}

renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));
renderer.outputEncoding=T.sRGBEncoding;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=.82;
renderer.localClippingEnabled=true;stage.appendChild(renderer.domElement);
var scene=new T.Scene(),cam=new T.PerspectiveCamera(30,1,.1,50);cam.position.set(0,.15,4.9);cam.lookAt(0,0,0);
var VH=2*Math.tan(15*Math.PI/180)*4.9;
function C(h){return new T.Color(h).convertSRGBToLinear()}

(function(){
  var env=new T.Scene();env.background=new T.Color(0x050403);
  function panel(c,i,w,h,x,y,z){var m=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({color:new T.Color(c).multiplyScalar(i),side:T.DoubleSide}));m.position.set(x,y,z);m.lookAt(0,0,0);env.add(m)}
  panel(0xffd9a8,2.6,4,4,0,7,1);panel(0xbfd4ff,1.1,1.6,7,-8,1,3);panel(0xff4a1c,.9,3,5,7,0,-5);panel(0xfff1dd,.5,8,1,0,-1,8);
  var pm=new T.PMREMGenerator(renderer);scene.environment=pm.fromScene(env,.04).texture;pm.dispose();
})();
var lamp=new T.SpotLight(0xffe2b8,0,20,.5,.6,1);lamp.position.set(1.2,6,2.5);scene.add(lamp);
var hemi=new T.HemisphereLight(0x8a8fa3,0x1a0f0a,0);scene.add(hemi);
var kick=new T.DirectionalLight(0xff5a2a,0);kick.position.set(-4,1,-4);scene.add(kick);

/* shell surface */
var D=Math.PI/180;
function edge(th){var d=Math.abs(Math.atan2(Math.sin(th),Math.cos(th)));return (66+52*sm(40*D,78*D,d)-5*sm(120*D,180*D,d))*D}
function pt(th,ph,s,out){
  var r,y;if(ph<=Math.PI/2){r=Math.sin(ph);y=Math.cos(ph)}else{var t=ph-Math.PI/2;r=1-.1*t*t;y=-t*.98}
  return (out||new T.Vector3()).set(Math.sin(th)*r*.93*s,y*s*1.02,Math.cos(th)*r*1.1*s);
}
function shellGeo(s,t0,t1,U,V){
  var pos=[],uv=[],idx=[],v=new T.Vector3(),i,j;
  for(i=0;i<=U;i++){var th=lerp(t0,t1,i/U),pm=edge(th);for(j=0;j<=V;j++){pt(th,j/V*pm,s,v);pos.push(v.x,v.y,v.z);uv.push(th/(Math.PI*2),j/V)}}
  for(i=0;i<U;i++)for(j=0;j<V;j++){var a=i*(V+1)+j,b=a+V+1;idx.push(a,a+1,b,b,a+1,b+1)}
  var g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return g;
}
var TAU=Math.PI*2;
/* woven glass mat, light so it can be tinted at each stage */
function weave(){
  var c=document.createElement('canvas');c.width=c.height=256;var x=c.getContext('2d');
  x.fillStyle='#d8d4cb';x.fillRect(0,0,256,256);
  for(var i=0;i<16;i++)for(var j=0;j<16;j++){var o=(i+j)%2;x.fillStyle=o?'#f4f1ea':'#bdb8ad';x.fillRect(i*16+1,j*16+1,14,14);x.strokeStyle=o?'rgba(255,255,255,.35)':'rgba(0,0,0,.12)';for(var k=3;k<14;k+=3){x.beginPath();if(o){x.moveTo(i*16+1,j*16+k);x.lineTo(i*16+15,j*16+k)}else{x.moveTo(i*16+k,j*16+1);x.lineTo(i*16+k,j*16+15)}x.stroke()}}
  for(i=0;i<900;i++){x.fillStyle='rgba(255,255,255,'+(Math.random()*.25)+')';x.fillRect(Math.random()*256,Math.random()*256,2,2)}
  var t=new T.CanvasTexture(c);t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(20,6);t.anisotropy=8;t.encoding=T.sRGBEncoding;return t;
}
var wv=weave(),lid=new T.Group();scene.add(lid);

/* the empty mould: a faint wire ghost before any glass goes in */
var ghostMat=new T.MeshBasicMaterial({color:0xf1eadc,wireframe:true,transparent:true,opacity:0,depthWrite:false});
lid.add(new T.Mesh(shellGeo(1.004,0,TAU,40,12),ghostMat));

/* glass pieces (gores) that fly in and settle */
var DRY=C(0xe6dfcf),RESIN=C(0xa5641a),RAW=C(0x46423c);
var N=16,gores=[];
for(var g=0;g<N;g++){
  var t0=g/N*TAU-.01,t1=(g+1)/N*TAU+.01,mid=(t0+t1)/2;
  var m=new T.Mesh(shellGeo(1,t0,t1,10,40),new T.MeshStandardMaterial({map:wv,color:DRY,roughness:.78,metalness:0,transparent:true,opacity:0,side:T.DoubleSide,depthWrite:false}));
  var dir=new T.Vector3(Math.sin(mid),.55,Math.cos(mid)).normalize();
  var order=(g*7)%N;/* laid in a crossing pattern, not in a ring */
  m.userData={dir:dir,start:.085+order*.0175,spin:new T.Vector3((Math.random()-.5)*1.6,(Math.random()-.5)*1.2,(Math.random()-.5)*1.6)};
  lid.add(m);gores.push(m);
}
/* the finished shell, swapped in once the glass is down */
var bodyMat=new T.MeshPhysicalMaterial({map:wv,bumpMap:wv,bumpScale:.01,color:DRY.clone(),roughness:.78,metalness:0,clearcoat:0,clearcoatRoughness:.08,side:T.DoubleSide});
var body=new T.Mesh(shellGeo(1,0,TAU,160,56),bodyMat);body.visible=false;lid.add(body);

/* paint coat, wiped on with a clipping plane */
var clip=new T.Plane(new T.Vector3(.18,1,.1).normalize(),-1.6);
var paintMat=new T.MeshPhysicalMaterial({color:C(0xd62906),roughness:.22,clearcoat:1,clearcoatRoughness:.06,side:T.DoubleSide,clippingPlanes:[clip],envMapIntensity:.75});
var paint=new T.Mesh(shellGeo(1.006,0,TAU,160,56),paintMat);paint.visible=false;lid.add(paint);

/* the kit: liner, leather trim, brass snaps, visor. Fades in when the shell is sanded. */
var kit=new T.Group(),kitMats=[];lid.add(kit);
function km(mat){mat.transparent=true;mat.opacity=0;kitMats.push(mat);return mat}
kit.add(new T.Mesh(shellGeo(.955,0,TAU,80,30),km(new T.MeshStandardMaterial({color:0x0d0b0a,roughness:1,side:T.DoubleSide,envMapIntensity:.05}))));
(function(){var q=[];for(var i=0;i<220;i++){var th=i/220*TAU;q.push(pt(th,edge(th),.985))}
  kit.add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(q,true),440,.042,10,true),km(new T.MeshStandardMaterial({color:0x100e0d,roughness:.55,envMapIntensity:.5}))))})();
var brass=km(new T.MeshStandardMaterial({color:C(0xc9a24a),metalness:1,roughness:.3}));
[[0,58],[-28,60],[28,60],[-96,104],[96,104]].forEach(function(a){var s=new T.Mesh(new T.SphereGeometry(.04,16,12),brass);pt(a[0]*D,a[1]*D,1.012,s.position);s.scale.z=.6;s.lookAt(0,0,0);kit.add(s)});
(function(){var NN=28,M=8,pos=[],idx=[],v=new T.Vector3(),i,j;
  for(i=0;i<=NN;i++){var a=(i/NN*2-1),th=a*33*D,e=pt(th,edge(th)-3*D,1.02),L=.3*Math.cos(a*Math.PI/2)+.02,dx=Math.sin(th)*.6;
    for(j=0;j<=M;j++){var s=j/M;v.set(e.x+dx*L*s,e.y-.2*L*s*s-.02*s,e.z+L*s);pos.push(v.x,v.y,v.z)}}
  for(i=0;i<NN;i++)for(j=0;j<M;j++){var k=i*(M+1)+j,b=k+M+1;idx.push(k,k+1,b,b,k+1,b+1)}
  var gg=new T.BufferGeometry();gg.setAttribute('position',new T.Float32BufferAttribute(pos,3));gg.setIndex(idx);gg.computeVertexNormals();
  kit.add(new T.Mesh(gg,km(new T.MeshPhysicalMaterial({color:C(0xf3eee4),roughness:.35,clearcoat:.6,side:T.DoubleSide}))))})();

/* ---------- paint pots (after the film) ---------- */
var HEX={red:0xd62906,bone:0xefe8da,black:0x0c0b0b,sky:0x7fa9c4,orange:0xe46a1c},NAMES={raw:'unfinished',red:'Brap red',bone:'bone',black:'gloss black',sky:'sky blue',orange:'tangerine'};
var pick='red',hU=null,hTo=-1.8,label=document.getElementById('lid3d-name');
document.querySelectorAll('[data-paint]').forEach(function(b){b.addEventListener('click',function(){
  var k=b.dataset.paint;if(k===pick&&hU!==null)return;
  if(k==='raw'){hU=hU===null?-1.8:hU;hTo=1.6}else{paintMat.color.copy(C(HEX[k]));hU=1.6;hTo=-1.8}
  pick=k;if(label)label.textContent='500TX, '+NAMES[k];
  document.querySelectorAll('[data-paint]').forEach(function(x){x.setAttribute('aria-pressed',x===b)});
})});

/* ---------- drag to turn (after the film) ---------- */
var spin=0,vel=0,drag=false,lx=0,el=renderer.domElement;el.style.touchAction='pan-y';
el.addEventListener('pointerdown',function(e){if(!film.classList.contains('done'))return;drag=true;lx=e.clientX;el.setPointerCapture(e.pointerId);film.classList.add('touched')});
el.addEventListener('pointermove',function(e){if(!drag)return;var dx=e.clientX-lx;lx=e.clientX;vel=dx*.008;spin+=vel});
function up(){drag=false}el.addEventListener('pointerup',up);el.addEventListener('pointercancel',up);

/* ---------- layout ---------- */
var aspect=1,VW=VH,fsFilm=1,fsEnd=1,endX=0,endY=0;
function size(){
  var w=frame.clientWidth,h=frame.clientHeight;if(!w||!h)return;
  renderer.setSize(w,h,false);cam.aspect=aspect=w/h;cam.updateProjectionMatrix();
  barPx=bars();VW=VH*aspect;var imgFrac=1-2*barPx/h;
  fsFilm=Math.min(1,VW/2.7,VH*imgFrac/2.35);
  if(aspect>1){fsEnd=Math.min(.74,VH/3.4,VW/5.6);endX=Math.min(VW*.25,1.25);endY=.02}else{fsEnd=Math.min(.7,VW/2.8);endX=0;endY=VH*.17}
}
size();addEventListener('resize',size);

/* ---------- frame loop ---------- */
var born=performance.now(),last=born,vis=true,hFilm=1.6,driftAcc=0;
if('IntersectionObserver' in window)new IntersectionObserver(function(en){vis=en[0].isIntersecting;if(vis){last=performance.now();requestAnimationFrame(loop)}}).observe(film);
function loop(now){
  if(!vis)return;var dt=Math.min(.05,(now-last)/1000);last=now;
  p=target();ps=reduce?p:ps+(p-ps)*Math.min(1,dt*7);text(ps);
  var on=reduce?1:sm(0,2.4,(now-born)/1000);
  lamp.intensity=1.15*on;hemi.intensity=.22*on;kick.intensity=.9*on;film.style.setProperty('--lamp',on.toFixed(3));

  /* mould ghost */
  ghostMat.opacity=.13*on*(1-sm(.3,.42,ps));
  /* glass lay-up */
  var laid=ps>=.4;
  for(var i=0;i<N;i++){var m=gores[i],u=m.userData,t=cl((ps-u.start)/.085),e=1-Math.pow(1-t,3);
    m.visible=!laid&&t>0;if(!m.visible)continue;
    var d=(1-e)*2.2;m.position.copy(u.dir).multiplyScalar(d);m.rotation.set(u.spin.x*(1-e),u.spin.y*(1-e),u.spin.z*(1-e));
    m.material.opacity=Math.min(1,t*2.2);m.material.depthWrite=t>.9;}
  body.visible=laid;
  /* resin, then sanded raw */
  var r1=sm(.42,.53,ps),r2=sm(.56,.66,ps);
  bodyMat.color.copy(DRY).lerp(RESIN,r1).lerp(RAW,r2);
  bodyMat.roughness=lerp(lerp(.78,.14,r1),.55,r2);bodyMat.clearcoat=lerp(r1,.25,r2);bodyMat.bumpScale=lerp(.01,.004,r1);
  var k=sm(.58,.67,ps);for(i=0;i<kitMats.length;i++)kitMats[i].opacity=k;kit.visible=k>0;
  /* paint */
  hFilm=lerp(1.6,-1.8,sm(.69,.8,ps));
  if(ps<.82){hU=null;if(pick!=='red'){pick='red';paintMat.color.copy(C(HEX.red))}}
  var h=hFilm;if(hU!==null){hU+=(hTo-hU)*Math.min(1,dt*2.4);h=hU}
  clip.constant=-h;paint.visible=h<1.55;
  /* camera move: one full turn through the film, then settle to the side */
  var q=sm(.8,.95,ps);
  if(!drag)vel*=.93;spin+=drag?0:vel;
  if(!reduce)driftAcc+=dt*.1*q;if(q===0)driftAcc=0;var drift=driftAcc;
  lid.rotation.y=-.75+TAU*sm(0,.68,ps)+spin+drift;
  lid.rotation.x=lerp(.18,.06,q)+(reduce?0:Math.sin(now/2600)*.03);
  var s=lerp(fsFilm,fsEnd,q);lid.scale.setScalar(s);
  lid.position.set(lerp(0,endX,q),lerp(.02,endY,q)+(reduce?0:Math.sin(now/1900)*.02),0);
  renderer.render(scene,cam);
  requestAnimationFrame(loop);
}
film.classList.add('ready');requestAnimationFrame(loop);
window.__film={set:function(v){ps=v}};
})();
