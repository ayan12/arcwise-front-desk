/* BRAP hero: a 500TX shell built in code. Raw fibreglass first, paint on request. */
(function(){
'use strict';
var stage=document.getElementById('lid3d');if(!stage||!window.THREE)return;
var T=THREE,reduce=matchMedia('(prefers-reduced-motion: reduce)').matches,renderer;
try{renderer=new T.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'})}catch(e){return}
renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));
renderer.outputEncoding=T.sRGBEncoding;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=.82;
renderer.localClippingEnabled=true;
stage.appendChild(renderer.domElement);
var scene=new T.Scene(),cam=new T.PerspectiveCamera(30,1,.1,50);cam.position.set(0,.2,4.9);cam.lookAt(0,-.05,0);

/* a tiny lit room for reflections: one warm lamp overhead, one cool strip, one red kick */
(function(){
  var env=new T.Scene();env.background=new T.Color(0x050403);
  function panel(c,i,w,h,x,y,z){var m=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({color:new T.Color(c).multiplyScalar(i),side:T.DoubleSide}));m.position.set(x,y,z);m.lookAt(0,0,0);env.add(m)}
  panel(0xffd9a8,2.6,4,4,0,7,1);panel(0xbfd4ff,1.1,1.6,7,-8,1,3);panel(0xff4a1c,.9,3,5,7,0,-5);panel(0xfff1dd,.5,8,1,0,-1,8);
  var pm=new T.PMREMGenerator(renderer);scene.environment=pm.fromScene(env,.04).texture;pm.dispose();
})();
var lamp=new T.SpotLight(0xffe2b8,1.15,20,.5,.6,1);lamp.position.set(1.2,6,2.5);scene.add(lamp);
scene.add(new T.HemisphereLight(0x8a8fa3,0x1a0f0a,.22));
var kick=new T.DirectionalLight(0xff5a2a,.9);kick.position.set(-4,1,-4);scene.add(kick);

/* shell surface: open-face 3/4. For each angle round the head, the shell runs from the crown down to an edge. */
var R=1,D=Math.PI/180;
function sm(a,b,x){var t=Math.min(1,Math.max(0,(x-a)/(b-a)));return t*t*(3-2*t)}
function edge(th){var d=Math.abs(Math.atan2(Math.sin(th),Math.cos(th)));return (66+52*sm(40*D,78*D,d)-5*sm(120*D,180*D,d))*D}
function pt(th,ph,s,out){
  var r,y;if(ph<=Math.PI/2){r=R*Math.sin(ph);y=R*Math.cos(ph)}else{var t=ph-Math.PI/2;r=R*(1-.1*t*t);y=-R*t*.98}
  return (out||new T.Vector3()).set(Math.sin(th)*r*.93*s,y*s*1.02,Math.cos(th)*r*1.1*s);
}
function shellGeo(s){
  var U=160,V=56,pos=[],uv=[],idx=[],v=new T.Vector3();
  for(var i=0;i<=U;i++){var th=i/U*Math.PI*2,pm=edge(th);for(var j=0;j<=V;j++){pt(th,j/V*pm,s,v);pos.push(v.x,v.y,v.z);uv.push(i/U,j/V)}}
  for(i=0;i<U;i++)for(j=0;j<V;j++){var a=i*(V+1)+j,b=a+V+1;idx.push(a,a+1,b,b,a+1,b+1)}
  var g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return g;
}
/* raw fibreglass: woven mat, drawn once on a canvas */
function weave(){
  var c=document.createElement('canvas');c.width=c.height=256;var x=c.getContext('2d');
  x.fillStyle='#3a3833';x.fillRect(0,0,256,256);
  for(var i=0;i<16;i++)for(var j=0;j<16;j++){var o=(i+j)%2;x.fillStyle=o?'#55524a':'#2b2925';x.fillRect(i*16+1,j*16+1,14,14);x.strokeStyle=o?'rgba(255,255,255,.10)':'rgba(0,0,0,.25)';for(var k=3;k<14;k+=3){x.beginPath();if(o){x.moveTo(i*16+1,j*16+k);x.lineTo(i*16+15,j*16+k)}else{x.moveTo(i*16+k,j*16+1);x.lineTo(i*16+k,j*16+15)}x.stroke()}}
  for(i=0;i<900;i++){x.fillStyle='rgba(200,190,160,'+(Math.random()*.08)+')';x.fillRect(Math.random()*256,Math.random()*256,2,2)}
  var t=new T.CanvasTexture(c);t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(20,6);t.anisotropy=8;t.encoding=T.sRGBEncoding;return t;
}
var wv=weave(),lid=new T.Group();scene.add(lid);
var raw=new T.Mesh(shellGeo(1),new T.MeshStandardMaterial({map:wv,bumpMap:wv,bumpScale:.012,roughness:.62,metalness:.15,side:T.DoubleSide,envMapIntensity:.9}));lid.add(raw);
var clip=new T.Plane(new T.Vector3(.18,1,.1).normalize(),-1.6);
var paintMat=new T.MeshPhysicalMaterial({color:0xd62906,roughness:.22,metalness:0,clearcoat:1,clearcoatRoughness:.06,side:T.FrontSide,clippingPlanes:[clip],envMapIntensity:.75});
paintMat.color.convertSRGBToLinear();var paint=new T.Mesh(shellGeo(1.006),paintMat);lid.add(paint);
/* front faces only would vanish depending on winding, so check once */
paintMat.side=T.DoubleSide;
lid.add(new T.Mesh(shellGeo(.955),new T.MeshStandardMaterial({color:0x0d0b0a,roughness:1,side:T.DoubleSide,envMapIntensity:.05})));
/* leather trim round the edge */
(function(){var p=[];for(var i=0;i<220;i++){var th=i/220*Math.PI*2;p.push(pt(th,edge(th),.985))}
  var tube=new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(p,true),440,.042,10,true),new T.MeshStandardMaterial({color:0x100e0d,roughness:.55,envMapIntensity:.5}));lid.add(tube)})();
/* brass snaps */
var brass=new T.MeshStandardMaterial({color:new T.Color(0xc9a24a).convertSRGBToLinear(),metalness:1,roughness:.3});
[[0,58],[-28,60],[28,60],[-96,104],[96,104]].forEach(function(a){var m=new T.Mesh(new T.SphereGeometry(.04,16,12),brass);pt(a[0]*D,a[1]*D,1.012,m.position);m.scale.z=.6;m.lookAt(0,0,0);lid.add(m)});
/* white snap visor */
(function(){var N=28,M=8,pos=[],idx=[],v=new T.Vector3();
  for(var i=0;i<=N;i++){var a=(i/N*2-1),th=a*33*D,e=pt(th,edge(th)-3*D,1.02),L=.3*Math.cos(a*Math.PI/2)+.02,dx=Math.sin(th)*.6,dz=1;
    for(var j=0;j<=M;j++){var s=j/M;v.set(e.x+dx*L*s,e.y-.2*L*s*s-.02*s,e.z+dz*L*s);pos.push(v.x,v.y,v.z)}}
  for(i=0;i<N;i++)for(j=0;j<M;j++){var k=i*(M+1)+j,b=k+M+1;idx.push(k,k+1,b,b,k+1,b+1)}
  var g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();
  lid.add(new T.Mesh(g,new T.MeshPhysicalMaterial({color:new T.Color(0xf3eee4).convertSRGBToLinear(),roughness:.35,clearcoat:.6,side:T.DoubleSide})))})();
lid.position.y=.02;lid.rotation.set(.06,-.75,0);

/* paint wipe */
var NAMES={raw:'Unfinished',red:'Brap red',bone:'Bone',black:'Gloss black',sky:'Sky blue',orange:'Tangerine'},HEX={red:0xd62906,bone:0xefe8da,black:0x0c0b0b,sky:0x7fa9c4,orange:0xe46a1c};
var cur='raw',h=1.6,hTo=1.6,label=document.getElementById('lid3d-name');
function setPaint(k){
  if(k===cur)return;
  if(k==='raw'){hTo=1.6}else{if(cur==='raw'||h>1){paintMat.color.setHex(HEX[k]).convertSRGBToLinear();h=1.6}else{paintMat.color.setHex(HEX[k]).convertSRGBToLinear()}hTo=-1.8}
  cur=k;if(label)label.textContent='500TX, '+NAMES[k].toLowerCase();
  document.querySelectorAll('[data-paint]').forEach(function(b){b.setAttribute('aria-pressed',b.dataset.paint===k)});
}
document.querySelectorAll('[data-paint]').forEach(function(b){b.addEventListener('click',function(){setPaint(b.dataset.paint)})});

/* drag to spin, with a slow steady turn when left alone */
var vy=0,drag=false,lx=0,ly=0,tilt=.06,el=renderer.domElement;el.style.touchAction='pan-y';el.style.cursor='grab';
el.addEventListener('pointerdown',function(e){drag=true;lx=e.clientX;ly=e.clientY;el.setPointerCapture(e.pointerId);el.style.cursor='grabbing';stage.classList.add('touched')});
el.addEventListener('pointermove',function(e){if(!drag)return;var dx=e.clientX-lx,dy=e.clientY-ly;lx=e.clientX;ly=e.clientY;vy=dx*.008;lid.rotation.y+=vy;tilt=Math.max(-.35,Math.min(.5,tilt+dy*.004))});
function up(){drag=false;el.style.cursor='grab'}el.addEventListener('pointerup',up);el.addEventListener('pointercancel',up);

function size(){var w=stage.clientWidth,hh=stage.clientHeight;if(!w||!hh)return;renderer.setSize(w,hh,false);cam.aspect=w/hh;cam.position.z=4.9;cam.updateProjectionMatrix()}
size();addEventListener('resize',size);
var vis=true,last=performance.now();
if('IntersectionObserver' in window)new IntersectionObserver(function(en){vis=en[0].isIntersecting;if(vis){last=performance.now();requestAnimationFrame(frame)}}).observe(stage);
function frame(now){
  if(!vis)return;var dt=Math.min(.05,(now-last)/1000);last=now;
  if(!drag){vy*=.94;lid.rotation.y+=vy+(reduce?0:dt*.16)}
  lid.rotation.x+=(tilt-lid.rotation.x)*.1;
  if(!reduce)lid.position.y=.02+Math.sin(now/1900)*.025;
  if(Math.abs(hTo-h)>.002){h+=(hTo-h)*Math.min(1,dt*(reduce?30:2.4));clip.constant=-h}
  renderer.render(scene,cam);requestAnimationFrame(frame);
}
stage.classList.add('ready');requestAnimationFrame(frame);
window.__lid3d={setPaint:setPaint,lid:lid};
})();
