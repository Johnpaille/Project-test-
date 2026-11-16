// Mythic Brawl V2 engine, shared by every level page (classic script so the game still runs from file://).
// Same game ideas as V1, rendered in 3D with toon shading + outlines, isometric camera. Hero: Quaternius UAL mannequin (CC0, models/ual1.js).
// Usage, in a level page module: const E=await MBEngine({THREE,GLTFLoader,SkeletonUtils,OutlineEffect}); build the level with E.*; E.start({...}).
window.MBEngine=async function({THREE,GLTFLoader,SkeletonUtils,OutlineEffect}){
document.head.insertAdjacentHTML('beforeend','<style>'+"\n  html,body{margin:0;height:100%;overflow:hidden;background:#1a2350;font-family:system-ui,sans-serif;color:#fff;user-select:none}\n  canvas{display:block}\n  #hud{position:fixed;left:16px;top:12px;width:260px;pointer-events:none;text-shadow:0 1px 2px #000}\n  #hud b{font-size:18px;letter-spacing:1px;color:#9df}\n  .bar{height:12px;background:#300;border:2px solid #000;margin-top:4px}.bar i{display:block;height:100%;background:#3d3;transition:width .1s}\n  #en{height:7px}#en i{background:#58a}\n  #wave{position:fixed;right:16px;top:12px;text-align:right;font-weight:bold;text-shadow:0 1px 2px #000}\n  #msg{position:fixed;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;text-align:center;pointer-events:none;text-shadow:0 2px 4px #000}\n  #msg h1{margin:0;font-size:clamp(28px,6vw,56px);color:#ffe14d}\n  #help{position:fixed;left:0;right:0;bottom:8px;text-align:center;font-size:12px;color:#ccd;text-shadow:0 1px 2px #000;pointer-events:none;padding:0 16px}\n  #back{position:fixed;right:16px;bottom:8px;color:#aab;font-size:12px}\n  #touch{position:fixed;inset:0;pointer-events:none;display:none;-webkit-user-select:none;-webkit-touch-callout:none}\n  #touch div{pointer-events:auto;touch-action:none;position:absolute;border-radius:50%;background:rgba(255,255,255,.12);border:2px solid rgba(255,255,255,.35);\n    color:rgba(255,255,255,.85);font:bold 11px system-ui,sans-serif;display:flex;align-items:center;justify-content:center;width:58px;height:58px}\n  #touch div:active{background:rgba(255,255,255,.3)}\n  body.touch #help,body.touch #back{display:none}\n  #load{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;font-size:18px;background:#0a0820}\n"+'</style>');
document.body.insertAdjacentHTML('afterbegin','<div id="fade" style="position:fixed;inset:0;background:#000;opacity:0;pointer-events:none"></div><div id="bars" style="position:fixed;inset:0;pointer-events:none;display:none;border-top:11vh solid #000;border-bottom:11vh solid #000"></div>'+
  '<div id="say" style="position:fixed;left:50%;bottom:13vh;transform:translateX(-50%);width:min(720px,92vw);text-align:center;font-size:clamp(15px,2.4vw,20px);text-shadow:0 2px 4px #000;pointer-events:none"></div>'+
  '<div id="skip" style="position:fixed;right:16px;bottom:3vh;font-size:12px;color:#889;display:none">J / Entrée / toucher : passer</div>');
document.head.insertAdjacentHTML('beforeend','<style>body.cine #hud,body.cine #wave,body.cine #help,body.cine #back,body.cine #touch,body.cine #boss{display:none!important}body.cine #skip,body.cine #bars{display:block!important}</style>');
document.body.insertAdjacentHTML('afterbegin',"<div id=\"hud\"><b>THUNDERSTRUCK</b> <span id=\"pow\" style=\"color:#3ef0ff;font-weight:bold\"></span><div class=\"bar\" id=\"hp\"><i style=\"width:100%\"></i></div><div class=\"bar\" id=\"en\"><i style=\"width:0\"></i></div></div>\n<div id=\"boss\" style=\"position:fixed;left:50%;top:12px;width:min(320px,60vw);transform:translateX(-50%);display:none;text-align:center;text-shadow:0 1px 2px #000\"><b style=\"letter-spacing:2px\"></b><div class=\"bar\"><i style=\"width:100%\"></i></div></div><div id=\"wave\"></div><div id=\"msg\"></div>\n<div id=\"help\">ZQSD/flèches : bouger (2× : sprint) · J : frapper (maintenir : coup chargé) · K/Espace : sauter · L : tempête · M : poings chargés · H maintenu : charger l'énergie (pleine + 1 s : power-up) · G : invisible · F/Maj : garde (+direction : téléport) · contre un robot : saisie (J, J+dir, K, G) · manette OK · Échap : menu</div>\n<div id=\"touch\"><!-- shown on first touch; each button holds the keyboard key of BIND -->\n  <div id=\"stick\" style=\"left:18px;bottom:18px;width:130px;height:130px\">◀ ▲ ▼ ▶</div>\n  <div data-k=\"j\" style=\"right:84px;bottom:16px;width:66px;height:66px\">FRAPPE</div>\n  <div data-k=\"k\" style=\"right:14px;bottom:66px\">SAUT</div>\n  <div data-k=\"f\" style=\"right:160px;bottom:16px\">GARDE</div>\n  <div data-k=\"l\" style=\"right:160px;bottom:88px\">TEMPÊTE</div>\n  <div data-k=\"m\" style=\"right:88px;bottom:94px\">POINGS</div>\n  <div data-k=\"h\" style=\"right:14px;bottom:138px\">CHARGE</div>\n  <div data-k=\"g\" style=\"right:88px;bottom:166px\">INVISIBLE</div>\n  <div data-k=\"escape\" style=\"right:16px;top:40px;width:60px;height:30px;border-radius:8px\">MENU</div>\n</div>\n<a id=\"back\" href=\"../index.html\">← Menu</a>\n");
// V2 prototype: same game ideas as V1 (x = right, z = depth, y = up), rendered in 3D with toon shading + outlines, isometric camera.

let L,ZONES; // current level, set by start()
const DT=1/60,VIEW=6.6;
const rand=(a,b)=>a+Math.random()*(b-a),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

/* ---------- renderer, camera, lights ---------- */
const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
document.body.prepend(renderer.domElement);
const outline=new OutlineEffect(renderer,{defaultThickness:.006,defaultColor:[0,0,0]});
const scene=new THREE.Scene();scene.background=new THREE.Color('#25306a');scene.fog=new THREE.Fog('#25306a',60,110);
const cam=new THREE.OrthographicCamera(-1,1,1,-1,-100,300);const CAM_OFF=new THREE.Vector3(18,15,18);
// portrait: zoom out to keep the width
function resize(){const a=innerWidth/innerHeight,v=VIEW*Math.max(1,.9/a);Object.assign(cam,{left:-v*a,right:v*a,top:v,bottom:-v});cam.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)}
addEventListener('resize',resize);resize();
const hemi=new THREE.HemisphereLight('#c8d4ff','#3a3050',1.1);scene.add(hemi);
const sun=new THREE.DirectionalLight('#fff4dd',2.2);sun.position.set(8,20,6);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);
Object.assign(sun.shadow.camera,{left:-20,right:20,top:20,bottom:-20,near:1,far:60});scene.add(sun,sun.target);

// toon shading: 3 flat light bands
const grad=new THREE.DataTexture(new Uint8Array([90,90,90,255,175,175,175,255,255,255,255,255]),3,1);grad.minFilter=grad.magFilter=THREE.NearestFilter;grad.needsUpdate=true;
const toon=(color,o={})=>new THREE.MeshToonMaterial({color,gradientMap:grad,...o});

/* ---------- level frame: u runs to the right of the screen, w toward the camera. LV is turned 45° so its local x = u, local z = w ---------- */
const S2=Math.SQRT2,toUW=(x,z)=>[(x-z)/S2,(x+z)/S2],fromUW=(u,w)=>[(u+w)/S2,(w-u)/S2],WD=5.2;
const LV=new THREE.Group();LV.rotation.y=Math.PI/4;scene.add(LV);
const noInk=m=>(m.userData.outlineParameters={visible:false},m);
const glowM=c=>noInk(new THREE.MeshBasicMaterial({color:c}));
const fieldM=(c,o)=>noInk(new THREE.MeshBasicMaterial({color:c,transparent:true,opacity:o,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));
const lb=(w,h,d,mat,x,y,z)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;LV.add(m);return m};
const lc=(r,h,mat,x,y,z,o={})=>{const m=new THREE.Mesh(new THREE.CylinderGeometry(o.r2??r,r,h,o.seg||24,1,!!o.open),mat);m.position.set(x,y,z);m.castShadow=m.receiveShadow=!o.noShadow;LV.add(m);return m};

/* ---------- characters ---------- */
const loader=new GLTFLoader();
const ual=await new Promise((ok,ko)=>loader.parse(Uint8Array.from(atob(window.UAL1),c=>c.charCodeAt(0)).buffer,'',ok,ko));
document.getElementById('load').remove();
function makeChar(gltf,scale,colorOf){
  const root=SkeletonUtils.clone(gltf.scene),mats=[];root.scale.setScalar(scale);
  root.traverse(o=>{if(o.isMesh){o.castShadow=true;o.frustumCulled=false;const m=toon(colorOf(o.material.name,o.material.color));m.skinning=true;o.material=m;mats.push(m)}});
  scene.add(root);const mixer=new THREE.AnimationMixer(root),acts={};for(const c of gltf.animations)acts[c.name]=mixer.clipAction(c);
  return{root,mixer,acts,mats,cur:null,bone:n=>root.getObjectByName(n)};
}
function play(ch,name,{once=false,fade=.12,speed=1}={}){const a=ch.acts[name];if(!a||(ch.cur===a&&!once))return;
  a.reset();a.setLoop(once?THREE.LoopOnce:THREE.LoopRepeat,Infinity);a.clampWhenFinished=once;a.timeScale=speed;a.fadeIn(fade).play();
  if(ch.cur&&ch.cur!==a)ch.cur.fadeOut(fade);ch.cur=a}
function flash(ch,col){for(const m of ch.mats)m.emissive.set(col)}

// hero: Thunderstruck, "Tempête" costume (black suit, cyan joints, chest bolt, visor). Bone names lose their dots in three.js.
const CYAN='#3ef0ff';ual.scene.updateMatrixWorld(true);
const HEADY=ual.scene.getObjectByName('DEF-head').getWorldPosition(new THREE.Vector3()).y,H=makeChar(ual,2.05/HEADY,n=>n==='M_Joints'?CYAN:'#1b1d2a');
{const fwd=new THREE.Vector3(0,0,1),k=H.root.scale.x;H.root.updateMatrixWorld(true);const wp=n=>H.bone(n).getWorldPosition(new THREE.Vector3());
  const stick=(mesh,b,pos)=>{mesh.position.copy(pos);mesh.lookAt(pos.clone().add(fwd));mesh.castShadow=true;scene.add(mesh);H.bone(b).attach(mesh)};
  const sh=new THREE.Shape([[0,.11],[-.05,0],[0,0],[-.03,-.11],[.06,.02],[.01,.02],[.04,.11]].map(p=>new THREE.Vector2(...p)));
  stick(new THREE.Mesh(new THREE.ExtrudeGeometry(sh,{depth:.02,bevelEnabled:false}).scale(k,k,k),toon(CYAN,{emissive:CYAN,emissiveIntensity:.35})),'DEF-spine003',wp('DEF-spine003').addScaledVector(fwd,.13*k).add(new THREE.Vector3(0,.02*k,0)));
  stick(new THREE.Mesh(new THREE.BoxGeometry(.2*k,.05*k,.06*k),toon('#0e1a22')),'DEF-head',wp('DEF-head').addScaledVector(fwd,.1*k).add(new THREE.Vector3(0,.09*k,0)))}
// clip per state; attack clips are time-scaled to fit the combo timings
const ANIM={idle:'Idle_Loop',walk:'Jog_Fwd_Loop',jump:'Jump_Loop',cast:'Spell_Simple_Shoot',hit:'Hit_Chest',dead:'Death01',atk:['Punch_Jab','Punch_Cross','Sword_Attack'],
  guard:'Spell_Simple_Idle_Loop',charge:'Crouch_Idle_Loop',hold:'Punch_Enter',catk:'Spell_Simple_Shoot',dash:'Sprint_Loop',datk:'Punch_Cross',air:'Punch_Jab',grab:'Push_Loop',knee:'Punch_Jab',throw:'Sword_Attack'};
const P={x:-18,z:0,y:0,vy:0,face:0,hp:100,en:0,state:'idle',st:0,combo:0,buf:false,inv:0,hits:new Set(),pow:0,invis:0,zap:0,held:null,grabCd:0,ja:0,at:99,jvx:0,jvz:0,hold:0,ch:0,pf:0,tapK:null,tapT:-99};
[P.x,P.z]=fromUW(3,0);P.face=Math.PI*.75;H.root.position.set(P.x,0,P.z);play(H,ANIM.idle);

const robots=[];
/* ---------- street gang kit (levels 1-2) ---------- */
// street gang: v thug (hoodie), p punk (mohawk, fast), b brute (bulked, heavy). Mannequin repainted per vertex like Hawkees.
const SKIN='#e0ac7e',V3=()=>new THREE.Vector3(),pick=a=>a[Math.random()*a.length|0];
function dress(R,L){const m=R.root;m.updateMatrixWorld(true);const meshes=[];m.traverse(o=>{if(o.isSkinnedMesh)meshes.push(o)});
  const hipsY=m.getObjectByName('DEF-hips').getWorldPosition(V3()).y,H0=m.getObjectByName('DEF-head').getWorldPosition(V3()).y/1.6*1.8,c=new THREE.Color(),v=V3(),head=new THREE.Box3();R.mats.length=0;
  for(const mesh of meshes){const geo=mesh.geometry=mesh.geometry.clone(),si=geo.attributes.skinIndex,sw=geo.attributes.skinWeight,bones=mesh.skeleton.bones,n=geo.attributes.position.count,col=new Float32Array(n*3);
    for(let i=0;i<n;i++){let b=0,w=-1;for(let k=0;k<4;k++){const ww=sw.getComponent(i,k);if(ww>w){w=ww;b=si.getComponent(i,k)}}
      const name=bones[b].name;mesh.getVertexPosition(i,v);v.applyMatrix4(mesh.matrixWorld);let t;
      if(/-(head|neck|hand|f_|thumb)/.test(name)){t=L.skin||SKIN;if(name==='DEF-head')head.expandByPoint(v)}
      else if(/foot|toe|heel/i.test(name)||(/shin/i.test(name)&&v.y<H0*.14))t=L.boots;
      else if(/thigh|shin/i.test(name)||(/hips/i.test(name)&&v.y<hipsY+H0*.03))t=L.pants;
      else if(/spine|hips|breast|pelvis/i.test(name)&&v.z>0&&Math.abs(v.x)<H0*.05)t=L.tee;
      else t=L.jacket;
      c.set(t);col.set([c.r,c.g,c.b],i*3)}
    geo.setAttribute('color',new THREE.BufferAttribute(col,3));mesh.material=toon('#ffffff',{vertexColors:true});R.mats.push(mesh.material)}
  const hs=head.getSize(V3()),hc=head.getCenter(V3()),hb=m.getObjectByName('DEF-head'),stick=o=>{scene.add(o);hb.attach(o)};
  if(L.hair){const h=new THREE.Mesh(new THREE.SphereGeometry(.5,18,12,0,Math.PI*2,0,Math.PI*.55),toon(L.hair));h.scale.set(hs.x*1.12,hs.y*.9,hs.z*1.15);h.position.set(hc.x,hc.y+hs.y*.08,hc.z-hs.z*.06);h.rotation.x=-.25;stick(h)}
  if(L.mohawk){const k=new THREE.Mesh(new THREE.BoxGeometry(hs.x*.18,hs.y*.45,hs.z*1.05),toon(L.mohawk));k.position.set(hc.x,hc.y+hs.y*.55,hc.z-hs.z*.05);stick(k)}}
// bulk build: push bind-pose vertices away from their bone axis (inverse of Phantom's slim); call after dress (geometry already cloned)
const BULK=[[/spine|hips/,1],[/shoulder/,1.4],[/upper_arm|forearm/,1.05],[/thigh|shin/,1]];
function bulk(R,f){R.root.traverse(mesh=>{if(!mesh.isSkinnedMesh)return;const geo=mesh.geometry,si=geo.attributes.skinIndex,sw=geo.attributes.skinWeight,bones=mesh.skeleton.bones,inv=mesh.matrixWorld.clone().invert(),pos=geo.attributes.position,v=V3(),d=V3(),q=V3();
  const ax=bones.map(b=>{const wk=BULK.find(([r])=>r.test(b.name))?.[1],c=b.children.find(o=>o.isBone),a=b.getWorldPosition(V3()).applyMatrix4(inv);return {k:wk?1+(f-1)/wk:1,a,d:c?c.getWorldPosition(V3()).applyMatrix4(inv).sub(a):V3()}});
  for(let i=0;i<pos.count;i++){let b=0,w=-1;for(let k=0;k<4;k++){const ww=sw.getComponent(i,k);if(ww>w){w=ww;b=si.getComponent(i,k)}}const A=ax[b];if(A.k===1)continue;
    v.fromBufferAttribute(pos,i);const L2=A.d.lengthSq(),t=L2?Math.min(1,Math.max(0,d.subVectors(v,A.a).dot(A.d)/L2)):0;q.copy(A.a).addScaledVector(A.d,t);v.sub(q).multiplyScalar(A.k).add(q);pos.setXYZ(i,v.x,v.y,v.z)}
  geo.computeVertexNormals()})}
const GANG={v:{look:()=>({jacket:pick(['#5a5f6a','#3d5a3a','#6a3a3a']),tee:'#2a2a30',pants:'#34405a',boots:'#e8e8e8',hair:'#22252c'}),hp:40},
  p:{look:()=>({jacket:'#1c1c22',tee:'#c8203a',pants:'#2a2a3a',boots:'#111111',mohawk:pick(['#ff2fa0','#ffd23a'])}),hp:32,spd:3.3,dmg:6},
  b:{look:()=>({jacket:'#d8d2c4',tee:'#d8d2c4',pants:'#4a5236',boots:'#2a2018'}),hp:110,spd:1.9,dmg:15,heavy:1,bulk:1.4,h:2.15}};
const RA={Walking:'Jog_Fwd_Loop',Idle:'Idle_Loop',Punch:'Punch_Cross',Death:'Death01',Dance:'Dance_Loop',Hit:'Hit_Chest'}; // generic action names -> UAL clips
function spawnGang(x,z,kind='v'){const K=GANG[kind],R=makeChar(ual,(K.h||1.85)/HEADY,()=>'#ffffff');dress(R,K.look());if(K.bulk)bulk(R,K.bulk);
  for(const [a,c] of Object.entries(RA))R.acts[a]=R.acts[c];
  const r={ch:R,x,z,face:0,hp:K.hp,state:'walk',st:0,cd:rand(40,90),kx:0,kz:0,spd:K.spd,dmg:K.dmg,heavy:K.heavy};R.root.position.set(x,0,z);play(R,'Walking');robots.push(r);return r}
// Deadeye: sharpshooter of The Beast's gang. Returns the character and the crossbow tip (for the laser sight and bolts).
const DEADEYE={jacket:'#4a4f58',tee:'#2a2a2a',pants:'#5a3a1a',boots:'#2a1a10',hair:'#111111'};
function makeDeadeye(){const R=makeChar(ual,1.95/HEADY,()=>'#ffffff');dress(R,DEADEYE);R.root.updateMatrixWorld(true);
  const hand=R.bone('DEF-handR'),p=hand.getWorldPosition(V3()),dir=p.clone().sub(R.bone('DEF-forearmR').getWorldPosition(V3())).normalize();
  const bow=new THREE.Group(),stock=new THREE.Mesh(new THREE.BoxGeometry(.06,.07,.5),toon('#5a3a1a')),limb=new THREE.Mesh(new THREE.BoxGeometry(.55,.04,.05),toon('#9aa4b4')),tip=new THREE.Object3D();
  stock.position.z=.12;limb.position.z=.34;tip.position.z=.38;bow.add(stock,limb,tip);bow.position.copy(p);bow.lookAt(p.clone().add(dir));scene.add(bow);hand.attach(bow);
  return {ch:R,tip}}
const laserSight=new THREE.Line(new THREE.BufferGeometry().setFromPoints([V3(),V3()]),new THREE.LineBasicMaterial({color:'#ff2020'}));laserSight.visible=false;scene.add(laserSight);
function aimLaser(from,to){laserSight.visible=!!from;if(from)laserSight.geometry.setFromPoints([from,to])} // aimLaser() hides it
// metro car of the Steel City elevated line, built along local x (use it inside LV); roof top at y = hgt
function metroCar(len,wid=2.6,hgt=2.6){const g=new THREE.Group(),add=(w,h,d,c,x,y,z=0)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),c);m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;g.add(m);return m};
  add(len,hgt*.8,wid,toon('#b9c2cc'),0,hgt*.55);add(len,hgt*.05,wid*.96,toon('#8a929c'),0,hgt*.975);add(len+.02,hgt*.07,wid+.02,toon('#c0392b'),0,hgt*.33);
  for(let x=-len/2+1.2;x<len/2-1;x+=2.2)add(1.3,hgt*.22,wid+.03,glowM('#fff1c0'),x,hgt*.65);
  for(const s of [-1,1])add(2.6,hgt*.16,wid*.8,toon('#22252e'),s*len*.33,hgt*.08);
  add(.6,.08,.08,toon('#22252e'),0,hgt+.3,0).rotation.z=.7;add(.6,.08,.08,toon('#22252e'),.4,hgt+.3,0).rotation.z=-.7; // pantograph
  return g}


/* ---------- effects ---------- */
const fx=[];
function spark(x,y,z,n,col,sp=6,life=.4){const g=new THREE.SphereGeometry(.08,6,4),m=new THREE.MeshBasicMaterial({color:col});
  for(let i=0;i<n;i++){const s=new THREE.Mesh(g,m);s.position.set(x,y,z);s.userData={v:new THREE.Vector3(rand(-sp,sp),rand(0,sp),rand(-sp,sp)),life,max:life};scene.add(s);fx.push(s)}}
function bolt(x0,y0,z0,x1,y1,z1,col='#bfe8ff',life=.18){const pts=[],n=10;for(let i=0;i<=n;i++){const k=i/n,j=i&&i<n?.45:0;pts.push(new THREE.Vector3(x0+(x1-x0)*k+rand(-j,j),y0+(y1-y0)*k+rand(-j,j),z0+(z1-z0)*k+rand(-j,j)))}
  const l=new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),new THREE.LineBasicMaterial({color:col}));l.userData={life,max:life};scene.add(l);fx.push(l)}
const glow=new THREE.PointLight('#9df',0,12);scene.add(glow);
// power-up aura: short cyan arcs jumping between random points of the body
const arcMat=new THREE.MeshBasicMaterial({color:CYAN});arcMat.userData.outlineParameters={visible:false};
const AURA=['DEF-head','DEF-spine003','DEF-hips','DEF-handL','DEF-handR','DEF-shinL','DEF-shinR','DEF-upper_armL','DEF-upper_armR'].map(n=>H.bone(n));
const auraLight=new THREE.PointLight(CYAN,0,6);scene.add(auraLight);
function aura(){const a=AURA[Math.random()*AURA.length|0].getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(rand(-.2,.2),rand(-.2,.2),rand(-.2,.2))),pts=[a];
  for(let i=1;i<=5;i++)pts.push(a.clone().add(new THREE.Vector3(rand(-.5,.5),rand(-.5,.5),rand(-.5,.5)).multiplyScalar(i/5)));
  const m=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts,false,'catmullrom',0),12,.02,4),arcMat);m.userData={life:.08,max:.08};scene.add(m);fx.push(m);
  auraLight.position.copy(a);auraLight.intensity=4}
function updateFx(){auraLight.intensity*=.8;for(let i=fx.length;i--;){const o=fx[i],u=o.userData;u.life-=DT;if(u.v){if(!u.ng)u.v.y-=15*DT;o.position.addScaledVector(u.v,DT);o.scale.setScalar(Math.max(.01,u.life/u.max))}
  if(u.life<=0){scene.remove(o);o.geometry.dispose?.();fx.splice(i,1)}}glow.intensity=Math.max(0,glow.intensity-60*DT)}

/* ---------- input: same actions as V1 (keyboard + gamepad); movement also on ZQSD/WASD ---------- */
const keys={},prev={},pad={};
const BIND={left:['arrowleft','q','a'],right:['arrowright','d'],up:['arrowup','z'],down:['arrowdown','s'],
  attack:['j','w'],jump:['k',' '],special:['l','c'],special2:['m','v'],charge:['h','b'],power:['g'],guard:['f','shift','n'],back:['escape']};
// gamepad, same layout as V1: A jump, B special, X attack, Y special 2, LB/RB charge, LT/RT guard, stick clicks power
const PAD={jump:[0],special:[1],attack:[2],special2:[3],charge:[4,5],guard:[6,7],power:[10,11],back:[8]};
addEventListener('keydown',e=>{const k=e.key.toLowerCase();if(k.startsWith('arrow')||k===' ')e.preventDefault();keys[k]=true});
addEventListener('keyup',e=>{keys[e.key.toLowerCase()]=false});addEventListener('blur',()=>{for(const k in keys)keys[k]=false});
const held=a=>BIND[a].some(k=>keys[k])||!!pad[a];let pressedNow={};
function pollInput(){for(const a in BIND)pad[a]=false;
  const g=navigator.getGamepads?[...navigator.getGamepads()].find(g=>g&&g.connected):null;
  if(g){const b=i=>!!(g.buttons[i]&&g.buttons[i].pressed);for(const a in PAD)pad[a]=PAD[a].some(b);
    const ax=g.axes[0]||0,ay=g.axes[1]||0;pad.left=ax<-.4||b(14);pad.right=ax>.4||b(15);pad.up=ay<-.4||b(12);pad.down=ay>.4||b(13)}
  for(const a in BIND){const h=held(a);pressedNow[a]=h&&!prev[a];prev[a]=h}}
const pressed=a=>pressedNow[a];
// touch controls: virtual stick + buttons hold the same keys as the keyboard (double tap the stick = sprint)
{const TOUCH=document.getElementById('touch'),stick=document.getElementById('stick'),vkey=(k,on)=>{keys[k]=on};
  addEventListener('touchstart',()=>{TOUCH.style.display='block';document.body.classList.add('touch')},{once:true});
  for(const b of TOUCH.querySelectorAll('[data-k]')){const k=b.dataset.k;
    b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);vkey(k,true)});
    for(const ev of['pointerup','pointercancel'])b.addEventListener(ev,()=>vkey(k,false))}
  let sx=0,sy=0;const moveStick=e=>{const dx=e.clientX-sx,dy=e.clientY-sy,d=16;vkey('arrowleft',dx<-d);vkey('arrowright',dx>d);vkey('arrowup',dy<-d);vkey('arrowdown',dy>d)};
  stick.addEventListener('pointerdown',e=>{e.preventDefault();stick.setPointerCapture(e.pointerId);const r=stick.getBoundingClientRect();sx=r.left+r.width/2;sy=r.top+r.height/2;moveStick(e)});
  stick.addEventListener('pointermove',e=>{if(e.buttons||e.pointerType==='touch')moveStick(e)});
  for(const ev of['pointerup','pointercancel'])stick.addEventListener(ev,()=>{for(const k of['arrowleft','arrowright','arrowup','arrowdown'])vkey(k,false)});
  renderer.domElement.addEventListener('pointerdown',e=>{if(G.cine)G.cine.skip=1;else if(e.pointerType!=='mouse'&&(G.over||P.hp<=0))location.reload()})} // tap: skip cutscene / replay
// screen-relative directions for the isometric camera
const RIGHT=new THREE.Vector3(1,0,-1).normalize(),UP=new THREE.Vector3(-1,0,-1).normalize();

/* ---------- combat (ported from V1, distances in metres) ---------- */
const COMBO=[{len:16,hit:6,reach:1.9,dmg:9,kb:2},{len:16,hit:6,reach:1.9,dmg:10,kb:2},{len:26,hit:9,reach:2.3,dmg:18,kb:9}];
const CH_MIN=20,CH_FULL=60,POW_COST=25,alive=r=>r.hp>0&&!(r.ally>0);
function hitRobots(reach,dmg,kb,arc=.9){const fx_=Math.sin(P.face),fz=Math.cos(P.face);let n=0;
  for(const r of robots){if(!alive(r)||P.hits.has(r))continue;const dx=r.x-P.x,dz=r.z-P.z,d=Math.hypot(dx,dz);
    if(d<reach&&(d<.6||(dx*fx_+dz*fz)/d>arc*.5)){P.hits.add(r);hurtRobot(r,dmg,dx/d||fx_,dz/d||fz,kb);n++}}L.onStrike?.(reach,fx_,fz);return n}
const unflash=r=>flash(r.ch,r.boss?L.BOSS_COL[r.state]||r.base||'#000000':r.ally>0&&!r.pris?'#5a1f8a':'#000000'); // mind-controlled robots keep a violet tint, Indigo glows his telegraph
// src: 'p' player strike, 'c' player lightning (no link bolt), 'x' side damage (perks, allies): no gauge, no invisibility bonus
function hurtRobot(r,dmg,nx,nz,kb,src='p'){if(r.hp<=0)return;if(src==='c')L.onLightning?.(r);
  if(src!=='x'){if(P.invis>0){dmg*=2;setInvis(0)}if(P.pow>0){dmg*=1.5;kb*=1.3;chainPerk(r,dmg)}P.en=Math.min(100,P.en+6)}
  if(src==='p')bolt(P.x,1.5,P.z,r.x,1.4,r.z);
  if(r.boss&&L.bossDmg)dmg*=L.bossDmg(r);r.hp-=dmg;flash(r.ch,'#ffffff');r.fl=6;spark(r.x,1.4,r.z,8,'#bfe8ff');glow.position.set(r.x,2,r.z);glow.intensity=20;G.shake=.15;
  if(r.hp<=0){if(r.boss)return L.bossDown(r);if(P.held===r)releaseGrab();r.state='dead';r.st=0;r.ally=0;play(r.ch,'Death',{once:true});return}
  if(r.state==='grabbed')return; // a held robot takes the hit in place
  if(r.boss){r.kx=nx*kb*.2;r.kz=nz*kb*.2;return} // Indigo shrugs hits off and keeps his attack going
  if(r.heavy)kb*=.35;r.kx=nx*kb;r.kz=nz*kb;r.state='hit';r.st=0;play(r.ch,'Hit',{once:true,speed:1.5})}
function chainPerk(r,dmg){const o=nearestRobot(r.x,r.z,7,r);if(o){bolt(r.x,1.4,r.z,o.x,1.4,o.z,'#bfe8ff',.2);hurtRobot(o,dmg*.5,0,0,1,'x')}}
function nearestRobot(x,z,max,not){let best=null,bd=max;for(const r of robots)if(r!==not&&alive(r)&&r.state!=='grabbed'){const d=Math.hypot(r.x-x,r.z-z);if(d<bd){bd=d;best=r}}return best}
function hurtPlayer(dmg,nx,nz,src){if(P.inv>0||P.hp<=0)return;
  if(P.state==='guard'&&src&&(src.x-P.x)*Math.sin(P.face)+(src.z-P.z)*Math.cos(P.face)>0){ // guarding, hit from the front
    if(P.st<=10){P.en=Math.min(100,P.en+10);src.stun=70;src.state='walk';src.kx=-nx*4;src.kz=-nz*4;shield.material.color.set('#ffffff');glow.position.set(P.x,1.5,P.z);glow.intensity=30;G.shake=.15;return} // parry
    P.hp=Math.max(1,P.hp-dmg*.2);P.kx=nx*2;P.kz=nz*2;spark(P.x+Math.sin(P.face)*.7,1.3,P.z+Math.cos(P.face)*.7,4,'#fff');return}
  if(P.invis>0)setInvis(0);if(P.held)releaseGrab();
  P.hp-=dmg;P.inv=40;P.kx=nx*5;P.kz=nz*5;flash(H,'#ff2222');G.shake=.2;spark(P.x,1.4,P.z,6,'#f55');
  if(P.hp<=0){P.state='dead';play(H,ANIM.dead,{once:true});msg('K.O.','Entrée pour recommencer')}else if(P.state!=='cast'){P.state='hit';P.st=0;play(H,ANIM.hit,{once:true,speed:1.5})}}
// special 1 (L): lightning from the sky on every robot around
function storm(){if(P.en<50)return;P.en-=50;P.state='cast';P.st=0;play(H,ANIM.cast,{once:true,speed:1.4});glow.position.set(P.x,4,P.z);glow.intensity=40;G.shake=.3;
  for(const r of robots)if(alive(r)&&Math.hypot(r.x-P.x,r.z-P.z)<10){bolt(r.x+rand(-1,1),14,r.z+rand(-1,1),r.x,0,r.z,'#fff7b0',.3);bolt(r.x,14,r.z,r.x,0,r.z,'#9df',.3);hurtRobot(r,28,Math.sign(r.x-P.x)||1,0,3,'c')}
  for(let i=0;i<4;i++){const x=P.x+rand(-9,9),z=P.z+rand(-6,6);bolt(x,14,z,x,0,z,'#fff7b0',.25)}}
// special 2 (M): charged fists for 6 s, every combo hit fires a lightning shot
function zapFists(){if(P.en<50)return;P.en-=50;P.zap=360;P.state='cast';P.st=0;play(H,ANIM.cast,{once:true,speed:1.4});glow.position.set(P.x,2,P.z);glow.intensity=30}
const proj=[],zapGeo=new THREE.SphereGeometry(.16,8,6),zapMat=new THREE.MeshBasicMaterial({color:'#bff8ff'});zapMat.userData.outlineParameters={visible:false};
function shootZap(dmg){const m=new THREE.Mesh(zapGeo,zapMat);m.scale.set(1,1,2.5);const fx_=Math.sin(P.face),fz=Math.cos(P.face);
  m.position.set(P.x+fx_*.8,1.4,P.z+fz*.8);m.rotation.y=P.face;scene.add(m);proj.push({m,vx:fx_*16,vz:fz*16,life:50,dmg})}
function updateProj(){for(let i=proj.length;i--;){const p=proj[i],m=p.m;m.position.x+=p.vx*DT;m.position.z+=p.vz*DT;
  const r=robots.find(r=>alive(r)&&Math.hypot(r.x-m.position.x,r.z-m.position.z)<.9);
  if(r)hurtRobot(r,p.dmg,Math.sign(p.vx)||0,Math.sign(p.vz)||0,4,'c');
  if(r||--p.life<=0){scene.remove(m);proj.splice(i,1)}}}
// charged attack (hold J): chain lightning, jumps to neighbours and paralyses them
function chainLightning(f){const fx_=Math.sin(P.face),fz=Math.cos(P.face),hand=H.bone('DEF-handR').getWorldPosition(new THREE.Vector3());
  let src=null,best=4+(f>1?2:0);for(const r of robots)if(alive(r)){const dx=r.x-P.x,dz=r.z-P.z,d=Math.hypot(dx,dz);if(dx*fx_+dz*fz>-.5&&d<best){best=d;src=r}}
  G.shake=f>1?.3:.2;glow.position.copy(hand);glow.intensity=30;
  if(!src)return bolt(hand.x,hand.y,hand.z,hand.x+fx_*3,hand.y,hand.z+fz*3,'#bff8ff',.2);
  const chain=[];let cur=src;while(cur&&chain.length<(f>1?4:3)){chain.push(cur);let nx=null,nb=9;for(const o of robots)if(alive(o)&&!chain.includes(o)){const d=Math.hypot(o.x-cur.x,o.z-cur.z);if(d<nb){nb=d;nx=o}}cur=nx}
  let p0=hand;for(const r of chain){const p1=new THREE.Vector3(r.x,1.4,r.z);bolt(p0.x,p0.y,p0.z,p1.x,p1.y,p1.z,'#bff8ff',.3);p0=p1;hurtRobot(r,14*f,0,0,1,'c');if(r.hp>0)r.stun=110*f|0}}
// G: invisibility (¼ gauge), robots lose track; the next strike does double damage
function setInvis(on){P.invis=on?180:0;H.root.traverse(o=>{if(o.isMesh){const m=o.material;m.transparent=!!on;m.opacity=on?.3:1;m.userData.outlineParameters={visible:!on}}})}
function power(){if(P.en<POW_COST)return;P.en-=POW_COST;setInvis(1);glow.position.set(P.x,1.5,P.z);glow.intensity=20}
function teleport(dir){const fx_=dir.lengthSq()?dir.x:Math.sin(P.face),fz=dir.lengthSq()?dir.z:Math.cos(P.face);let best=null,bd=12;
  for(const r of robots){if(!alive(r))continue;const dx=r.x-P.x,dz=r.z-P.z,d=Math.hypot(dx,dz);if(d<bd&&(dx*fx_+dz*fz)/d>.3){bd=d;best=r}}
  const x0=P.x,z0=P.z;if(best){const d=Math.hypot(best.x-P.x,best.z-P.z);P.x=best.x+(best.x-P.x)/d*1.6;P.z=best.z+(best.z-P.z)/d*1.6;P.face=Math.atan2(best.x-P.x,best.z-P.z)}
  else{P.x+=fx_*5;P.z+=fz*5}P.inv=Math.max(P.inv,12);P.state='idle';P.st=0;
  for(const [x,z] of[[x0,z0],[P.x,P.z]]){bolt(x,12,z,x,0,z,'#9df',.2);spark(x,1,z,10,'#bfe8ff')}glow.position.set(P.x,2,P.z);glow.intensity=25}
// grabs: walk into a robot; J knee (3rd knocks down), J+direction throw, K vault over, G mind control
function tryGrab(dir){for(const r of robots){if(!alive(r)||r.boss||!['walk','hit'].includes(r.state))continue;const dx=r.x-P.x,dz=r.z-P.z,d=Math.hypot(dx,dz);
  if(d<1.3&&(dx*dir.x+dz*dir.z)/d>.7){Object.assign(P,{state:'grab',st:0,held:r,knees:0,kn:0,face:Math.atan2(dx,dz)});Object.assign(r,{state:'grabbed',st:0,kx:0,kz:0});return true}}}
function releaseGrab(){const r=P.held;P.held=null;P.grabCd=30;if(P.state==='grab')P.state='idle';if(r&&r.state==='grabbed'){r.state='walk';r.cd=15}}
function updateGrab(dir){const r=P.held;if(P.kn>0)P.kn--;
  if(!r||r.state!=='grabbed'||P.st>110)return releaseGrab(); // the robot breaks free
  if(pressed('jump')){releaseGrab();r.stun=40;jump(new THREE.Vector3(Math.sin(P.face),0,Math.cos(P.face)),5);return}
  if(pressed('power')&&P.en>=POW_COST)return mindControl(r);
  if(!pressed('attack'))return;
  if(dir.lengthSq()){P.held=null;P.grabCd=30;P.state='throw';P.st=0;P.face=Math.atan2(dir.x,dir.z);r.state='walk';hurtRobot(r,12,dir.x,dir.z,12);play(H,ANIM.throw,{once:true,speed:1.6});G.shake=.25;return}
  P.knees++;P.kn=10;play(H,ANIM.knee,{once:true,speed:2});
  if(P.knees>=3){P.held=null;P.grabCd=30;P.state='idle';r.state='walk';hurtRobot(r,5,Math.sin(P.face),Math.cos(P.face),8)}else hurtRobot(r,5,0,0,0)}
function mindControl(r){P.en-=POW_COST;P.held=null;P.grabCd=30;P.state='cast';P.st=0;play(H,ANIM.cast,{once:true,speed:1.4});
  Object.assign(r,{state:'walk',ally:480,cd:20,st:0});unflash(r);bolt(P.x,1.8,P.z,r.x,1.8,r.z,'#c6f',.3);glow.position.set(r.x,2,r.z);glow.intensity=20}
function jump(dir,boost=0){Object.assign(P,{state:'jump',st:0,vy:11,y:.01,ja:0,at:99,jvx:dir.x*boost,jvz:dir.z*boost})}
function startAtk(i){P.combo=i;P.state='atk';P.st=0;P.hits.clear();P.buf=false;P.hold=0;playAtk()}
// power-up form (hold H at full gauge for 1 s): aura, harder hits that chain, static zaps
function startForm(){Object.assign(P,{pow:600,en:0,state:'idle',st:0,inv:Math.max(P.inv,40)});G.shake=.4;glow.position.set(P.x,2,P.z);glow.intensity=50}
function handArc(name){const a=H.bone(name).getWorldPosition(new THREE.Vector3()),pts=[a];for(let i=1;i<=3;i++)pts.push(a.clone().add(new THREE.Vector3(rand(-.25,.25),rand(-.25,.25),rand(-.25,.25))));
  const m=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts,false,'catmullrom',0),8,.015,4),arcMat);m.userData={life:.06,max:.06};scene.add(m);fx.push(m)}
const shield=new THREE.Mesh(new THREE.CircleGeometry(.75,28),new THREE.MeshBasicMaterial({color:CYAN,transparent:true,opacity:.35,side:THREE.DoubleSide,depthWrite:false}));
shield.material.userData.outlineParameters={visible:false};shield.visible=false;scene.add(shield);

/* ---------- update ---------- */
// shared mutable state (levels read and write it through G)
const G={shake:0,over:false,T:0,zone:0,cleared:-1,fighting:false,msgT:0},UB=[0,0];
// keep a body inside the open part of the level (the locked zone during a fight)
function keep(o){let [u,w]=toUW(o.x,o.z);const wd=L?.WD??WD;u=clamp(u,UB[0],UB[1]);w=clamp(w,-wd,wd);[o.x,o.z]=fromUW(u,w)}
const msgEl=document.getElementById('msg');function msg(h,s=''){msgEl.innerHTML=h?`<h1>${h}</h1><div>${s}</div>`:''}
function updatePlayer(){G.T++;
  if(P.inv>0&&--P.inv===0)flash(H,'#000000');if(P.inv===30)flash(H,'#000000');
  if(P.state==='dead'){if(pressed('attack')||keys.enter)location.reload();return}
  const dx=(held('right')?1:0)-(held('left')?1:0),dz=(held('down')?1:0)-(held('up')?1:0);
  const dir=new THREE.Vector3().addScaledVector(RIGHT,dx).addScaledVector(UP,-dz);if(dir.lengthSq())dir.normalize();
  const spd=P.pow>0?7.2:6,face=()=>{if(dir.lengthSq())P.face=Math.atan2(dir.x,dir.z)};
  P.st++;if(P.grabCd>0)P.grabCd--;if(P.invis>0&&--P.invis===0)setInvis(0);
  if(P.kx){P.x+=P.kx*DT;P.z+=P.kz*DT;P.kx*=.85;P.kz*=.85;if(Math.abs(P.kx)+Math.abs(P.kz)<.05)P.kx=P.kz=0}
  if(P.y>0||P.vy){P.vy-=30*DT;P.x+=P.jvx*DT;P.z+=P.jvz*DT;P.y=Math.max(0,P.y+P.vy*DT);if(P.y===0&&P.vy<0){P.vy=0;P.jvx=P.jvz=0;if(P.state==='jump')P.state='idle'}}
  const S=P.state;
  if(S==='idle'||S==='walk'){
    if(P.en>=50&&pressed('special'))return storm();
    if(P.en>=50&&pressed('special2'))return zapFists();
    if(pressed('power'))return power();
    if(pressed('guard')){if(dir.lengthSq())return teleport(dir);P.state='guard';P.st=0;shield.material.color.set('#ffffff');return}
    if(held('charge')){P.state='power';P.st=0;P.pf=0;return}
    if(pressed('jump'))return jump(dir);
    if(pressed('attack'))return startAtk(0);
    for(const k of['left','right','up','down'])if(pressed(k)){if(P.tapK===k&&G.T-P.tapT<14){P.state='dash';P.st=0;return}P.tapK=k;P.tapT=G.T} // double tap: sprint
    if(dir.lengthSq()){P.x+=dir.x*spd*DT;P.z+=dir.z*spd*DT;face();P.state='walk';if(!(P.grabCd>0)&&tryGrab(dir))return}else P.state='idle';
  }else if(S==='dash'){
    if(!dir.lengthSq()){P.state='idle';return}
    if(pressed('attack')){P.state='datk';P.st=0;P.hits.clear();play(H,ANIM.datk,{once:true,speed:1.3});return}
    if(pressed('jump'))return jump(dir,6);
    if(pressed('guard'))return teleport(dir);
    face();P.x+=dir.x*11*DT;P.z+=dir.z*11*DT;
  }else if(S==='datk'){ // dash attack: flying strike that sends robots far
    if(P.st<12){const v=(12-P.st*.6);P.x+=Math.sin(P.face)*v*DT;P.z+=Math.cos(P.face)*v*DT;hitRobots(2.2,12,10)}
    if(P.st>=22)P.state='idle';
  }else if(S==='jump'){
    if(dir.lengthSq()){P.x+=dir.x*5*DT;P.z+=dir.z*5*DT;face()}
    P.at++;if(pressed('attack')&&P.at>12&&P.ja<3){P.at=0;P.ja++;P.hits.clear();play(H,ANIM.air,{once:true,fade:.05,speed:1.8})} // up to 3 air attacks per jump
    if(P.at>=3&&P.at<10)hitRobots(2,10,5);
  }else if(S==='atk'){const a=COMBO[P.combo];if(pressed('attack'))P.buf=true;P.hold=held('attack')?P.hold+1:0;
    if(P.combo===0&&P.hold>=12&&P.st>=a.hit+3){P.state='hold';P.st=0;P.ch=0;play(H,ANIM.hold,{once:true});return} // held past the first jab: charge up
    if(P.combo===2&&P.st>=a.hit+3&&pressed('jump'))return jump(dir);
    if(P.st<a.hit)P.x+=Math.sin(P.face)*2.5*DT,P.z+=Math.cos(P.face)*2.5*DT;
    if(P.zap>0){if(P.st===a.hit)shootZap(a.dmg)}else if(P.st>=a.hit&&P.st<a.hit+3)hitRobots(a.reach,a.dmg,a.kb);
    if(P.st>=a.len){if(P.buf&&P.combo<2)startAtk(P.combo+1);else{P.state='idle';P.buf=false}}
  }else if(S==='hold'){face();
    if(!held('attack')){if(P.ch>=CH_MIN){P.state='catk';P.st=0;P.full=P.ch>=CH_FULL;play(H,ANIM.catk,{once:true,speed:1.6})}else P.state='idle';return}
    if(++P.ch===CH_FULL){glow.position.copy(H.bone('DEF-handR').getWorldPosition(new THREE.Vector3()));glow.intensity=25;G.shake=.1}
    if(P.ch%Math.max(2,8-(P.ch/10|0))===0)handArc('DEF-handR');
  }else if(S==='catk'){if(P.st===6)chainLightning(P.full?1.5:1);if(P.st>=26)P.state='idle';}
  else if(S==='guard'){
    if(!held('guard'))P.state='idle';
    else if(dir.lengthSq()&&['left','right','up','down'].some(pressed))teleport(dir);
    else if(P.st===11)shield.material.color.set(CYAN); // end of the parry window
  }else if(S==='power'){ // hold H: fill the gauge, keep holding at full for the power-up
    if(!held('charge')){P.state='idle';return}
    if(P.en>=50&&pressed('special'))return storm();
    if(P.en>=50&&pressed('special2'))return zapFists();
    const was=P.en;P.en=Math.min(100,P.en+.4);
    if(was<100&&P.en>=100){G.shake=.15;glow.position.set(P.x,1.5,P.z);glow.intensity=30}
    if(P.en>=100&&!(P.pow>0)&&++P.pf>=60)return startForm();
    if(P.st%5===0)aura();
  }else if(S==='grab')updateGrab(dir);
  else if(S==='throw'&&P.st>=16)P.state='idle';
  else if(S==='cast'&&P.st>30)P.state='idle';
  else if(S==='hit'&&P.st>18)P.state='idle';
  keep(P);
  if(P.pow>0){P.pow--;if(P.pow%3===0)aura();
    if(P.pow%40===0){const r=nearestRobot(P.x,P.z,10);if(r){bolt(P.x,1.6,P.z,r.x,1.4,r.z,'#bff8ff',.2);hurtRobot(r,6,0,0,1,'x')}}} // static perk
  if(P.zap>0&&--P.zap%6===0)handArc(P.zap%12?'DEF-handL':'DEF-handR');
  document.getElementById('pow').textContent=[P.pow>0&&'⚡ POWER-UP',P.invis>0&&'INVISIBLE',P.zap>0&&'POINGS CHARGÉS',P.state==='power'&&P.en>=100&&!(P.pow>0)&&'transformation…'].filter(Boolean).join(' · ');
  const LOOP={idle:ANIM.idle,walk:ANIM.walk,guard:ANIM.guard,power:ANIM.charge,dash:ANIM.dash};
  if(LOOP[P.state])play(H,LOOP[P.state]);else if(P.state==='jump'&&P.at>=14)play(H,ANIM.jump);else if(P.state==='grab'&&!P.kn)play(H,ANIM.grab);
}
function playAtk(){const a=COMBO[P.combo],c=H.acts[ANIM.atk[P.combo]];play(H,ANIM.atk[P.combo],{once:true,fade:.06,speed:clamp(c.getClip().duration/(a.len*DT*1.4),.8,2.5)})}
function updateRobots(){
  for(const r of robots){const R=r.ch;r.st++;if(r.fl>0&&--r.fl===0)unflash(r);
    if(r.state==='dead'){if(r.blow){r.x+=r.blow[0]*7*DT;r.z+=r.blow[1]*7*DT;R.root.position.y+=(r.blow[2]-r.st*.25)*DT}else if(r.st>70)R.root.position.y-=DT*1.5;continue}
    if(r.boss){L.bossAI(r);continue}
    if(r.state==='grabbed'){r.x=P.x+Math.sin(P.face)*1.1;r.z=P.z+Math.cos(P.face)*1.1;r.face=P.face+Math.PI;play(R,'Idle');continue}
    if(r.kx||r.kz){r.x+=r.kx*DT;r.z+=r.kz*DT;r.kx*=.88;r.kz*=.88;if(Math.abs(r.kx)+Math.abs(r.kz)<.1)r.kx=r.kz=0}
    if(Math.abs(r.kx)+Math.abs(r.kz)>4&&L.onKnock?.(r))continue; // knocked into something deadly (SkyCell lasers)
    if(r.state==='hit'){if(r.st>20){r.state='walk';play(R,'Walking')}continue}
    if(r.stun>0){r.stun--;play(R,'Idle');if(r.stun%15===0)bolt(r.x-.3,1.8,r.z,r.x+.3,.6,r.z,'#bff8ff',.1);continue}
    if(r.ally>0&&--r.ally===0){r.hp=0;r.state='dead';r.st=0;unflash(r);play(R,'Death',{once:true});continue} // control wears off: it collapses
    // targets: controlled robots hunt the others; the rest hunt the player, or wander while he is invisible
    const tgt=r.ally>0?nearestRobot(r.x,r.z,40,r):null,lost=!tgt&&P.invis>0;
    if(lost&&(!r.wx||r.st%120===0)){r.wx=r.x+rand(-5,5);r.wz=r.z+rand(-4,4)}
    if(r.ally>0&&!tgt){play(R,r.pris?'Dance':'Idle');continue}
    const tx=tgt?tgt.x:lost?r.wx:P.x,tz=tgt?tgt.z:lost?r.wz:P.z,dx=tx-r.x,dz=tz-r.z,d=Math.hypot(dx,dz)||1;
    if(r.gun&&!tgt&&!lost&&P.hp>0){r.face=Math.atan2(dx,dz); // gunner: keeps 4.5-8 m away and fires slow bolts
      if(r.state==='shoot'){if(r.st===14)eshot(r.x,r.z,dx/d,dz/d,'#ff3040',10,6);if(r.st>45){r.state='walk';r.cd=rand(80,140)}}
      else{r.cd--;const k=d<4.5?-1:d>8?1:0;if(k){r.x+=dx/d*k*2.2*DT;r.z+=dz/d*k*2.2*DT;play(R,'Walking')}else play(R,'Idle');
        if(r.cd<=0&&d<11){r.state='shoot';r.st=0;play(R,'Punch',{once:true})}}
      keep(r);continue}
    if(r.state==='punch'){if(r.st===22&&d<2.2){if(tgt)hurtRobot(tgt,8,dx/d,dz/d,4,'x');else if(!lost&&P.y<1)hurtPlayer(r.dmg||8,dx/d,dz/d,r)}if(r.st>50){r.state='walk';r.cd=rand(50,100);play(R,'Walking')}continue}
    r.face=Math.atan2(dx,dz);r.cd--;
    if(P.hp<=0&&!tgt){play(R,'Dance');continue}
    if(d>1.8){const v=lost?1.2:r.spd||2.6;r.x+=dx/d*v*DT;r.z+=dz/d*v*DT;play(R,'Walking')}else{play(R,'Idle');if(!lost&&r.cd<=0){r.state='punch';r.st=0;play(R,'Punch',{once:true})}}
    for(const o of robots)if(o!==r&&o.hp>0&&o.state!=='grabbed'){const ox=r.x-o.x,oz=r.z-o.z,od=Math.hypot(ox,oz);if(od<1.4&&od>0){r.x+=ox/od*.03;r.z+=oz/od*.03}}
    keep(r)}
  for(let i=robots.length;i--;)if(robots[i].state==='dead'&&robots[i].st>160){scene.remove(robots[i].ch.root);robots.splice(i,1)}
}
function updateWaves(){if(G.msgT>0&&--G.msgT===0&&!G.over)msg('');
  if(G.over||P.hp<=0)return;
  if(G.fighting){if(robots.some(alive))return;G.fighting=false;G.cleared=G.zone;msg('ZONE SÉCURISÉE','→');G.msgT=90}
  else{const n=G.cleared+1,N=ZONES[n];{if(N&&!N.seen&&toUW(P.x,P.z)[0]>N.u0+4){G.zone=n;N.seen=1;msg(N.name,N.hint);G.msgT=150;
      for(let i=robots.length;i--;)if(robots[i].pris){scene.remove(robots[i].ch.root);robots.splice(i,1)}
      document.getElementById('wave').textContent='ZONE '+(n+1)+'/'+ZONES.length;
      G.fighting=true;if(N.boss)L.spawnBoss(...fromUW(N.u0+14,0));else for(const [u,w,k] of N.wave)L.spawn(...fromUW(N.u0+u,w),k)}}}
  const Z=ZONES[G.zone];if(G.fighting){UB[0]=Z.u0+.6;UB[1]=Z.u1-.6}else{UB[0]=ZONES[0].u0+.6;UB[1]=ZONES[Math.min(G.cleared+1,ZONES.length-1)].u1-.6}
  for(const g of L.gates)g.beams.visible=G.fighting?(g.u===Z.u0||g.u===Z.u1):g.u===ZONES[G.cleared+1]?.u1}
/* ---------- enemy shots ---------- */
// short-lived mesh effect (no gravity)
function fxMesh(geo,col,o,life,v,op=.8){const m=new THREE.Mesh(geo,noInk(new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:op,depthWrite:false,side:THREE.DoubleSide})));
  m.position.set(...o);m.userData={life,max:life,ng:1,v};scene.add(m);fx.push(m);return m}
function kill(r){if(P.held===r)releaseGrab();r.hp=0;r.state='dead';r.st=0;r.ally=0;play(r.ch,'Death',{once:true})}

const eproj=[];
function eshot(x,z,nx,nz,col,spd,dmg,s=.18){const m=new THREE.Mesh(new THREE.SphereGeometry(s,10,8),glowM(col));m.position.set(x+nx*.7,1.3,z+nz*.7);scene.add(m);eproj.push({m,vx:nx*spd,vz:nz*spd,life:150,dmg})}
function updateEproj(){for(let i=eproj.length;i--;){const p=eproj[i],m=p.m;m.position.x+=p.vx*DT;m.position.z+=p.vz*DT;
  const hit=P.hp>0&&P.y<1.5&&Math.hypot(P.x-m.position.x,P.z-m.position.z)<.7,v=Math.hypot(p.vx,p.vz);
  if(hit)hurtPlayer(p.dmg,p.vx/v,p.vz/v,{x:m.position.x-p.vx*.05,z:m.position.z-p.vz*.05}); // src = where it came from, so the guard can block it
  if(hit||--p.life<=0){scene.remove(m);eproj.splice(i,1)}}}


function step(){
  pollInput();if(pressed('back'))location.href='../index.html';
  if(G.over&&keys.enter)location.reload();
  if(G.cine)updateCine();else{updatePlayer();updateRobots();updateWaves()}L.update(performance.now());updateFx();updateProj();updateEproj();
  {const B=robots.find(r=>r.boss),el=document.getElementById('boss');el.style.display=B&&B.hp>0?'block':'none';if(B)el.querySelector('i').style.width=Math.max(0,B.hp/B.max*100)+'%'}
  shield.visible=P.state==='guard';shield.position.set(P.x+Math.sin(P.face)*.7,1.2,P.z+Math.cos(P.face)*.7);shield.rotation.y=P.face;
  H.mixer.update(DT);for(const r of robots)r.ch.mixer.update(DT);
  H.root.position.set(P.x,P.y,P.z);H.root.rotation.y=P.face;H.root.visible=!(P.inv>0&&P.inv<30&&(P.inv>>2)%2);
  for(const r of robots){r.ch.root.position.x=r.x;r.ch.root.position.z=r.z;r.ch.root.rotation.y=r.face}
  document.querySelector('#hp i').style.width=Math.max(0,P.hp)+'%';const en=document.querySelector('#en i');en.style.width=P.en+'%';en.style.background=P.en>=50?'#9df':'#58a';
}
/* ---------- cutscenes: {len, u(t) run each frame, end() cleanup, camU camera position}; the level script moves P, H and its actors ---------- */
const sayEl=document.getElementById('say'),fadeEl=document.getElementById('fade');
function say(who='',text='',col='#ffe14d'){sayEl.innerHTML=text?(who?'<b style="color:'+col+'">'+who+'</b><br>':'<i>')+text+(who?'':'</i>'):''}
const fade=v=>{fadeEl.style.opacity=clamp(v,0,1)};
function startCine(c){G.cine={t:0,...c};document.body.classList.add('cine')}
function endCine(){const c=G.cine;G.cine=null;c.end?.();say();fade(0);msg('');document.body.classList.remove('cine')}
function updateCine(){const c=G.cine;if(c.t>20&&(c.skip||pressed('attack')||pressed('jump')||keys.enter))return endCine();c.u(++c.t);if(c.t>=c.len)endCine()}
let acc=0,last=performance.now();
function placeCam(){const [tx,tz]=fromUW(G.cine?.camU??toUW(P.x,P.z)[0],-1.4),tgt=new THREE.Vector3(tx,G.cine?.camY??1.4,tz); // beat em up camera: follows along the level, fixed depth
  cam.position.copy(tgt).add(CAM_OFF);if(G.shake>0){cam.position.x+=rand(-G.shake,G.shake);cam.position.y+=rand(-G.shake,G.shake);G.shake=Math.max(0,G.shake-DT)}
  cam.lookAt(tgt);sun.position.set(P.x+8,20,P.z+6);sun.target.position.set(P.x,0,P.z)}
function frame(now){acc+=Math.min(.1,(now-last)/1000);last=now;while(acc>=DT){step();acc-=DT}placeCam();outline.render(scene,cam);requestAnimationFrame(frame)}
// level: {ZONES, gates, WD? (half width of the walkable strip), spawn(x,z,kind), spawnBoss(x,z), bossAI(r), bossDown(r), BOSS_COL, update(t), bossName, bossColor:[label,bar]}
// optional: intro cutscene (see startCine); hooks bossDmg(r) damage factor, onLightning(r), onStrike(reach,fx,fz), onKnock(r) -> true if it killed r
function start(level){L=level;if(L.intro)startCine(L.intro);ZONES=L.ZONES;UB[0]=ZONES[0].u0+.6;UB[1]=ZONES[0].u1-.6;
  const b=document.querySelector('#boss b');b.textContent=L.bossName;b.style.color=L.bossColor[0];document.querySelector('#boss i').style.background=L.bossColor[1];
  requestAnimationFrame(frame);window.__v2={P,H,robots,step,G,ZONES,fromUW,toUW,render:()=>{placeCam();outline.render(scene,cam)},cam,L}} // test hook
return {DT,rand,clamp,renderer,scene,hemi,sun,toon,S2,toUW,fromUW,WD,LV,noInk,glowM,fieldM,lb,lc,ual,HEADY,makeChar,play,flash,CYAN,P,H,robots,fx,spark,bolt,glow,fxMesh,kill,
  hurtRobot,hurtPlayer,releaseGrab,alive,nearestRobot,unflash,keep,msg,pressed,G,UB,eshot,eproj,start,aura,handArc,say,fade,startCine,dress,bulk,spawnGang,metroCar,V3,SKIN,makeDeadeye,aimLaser};
};
