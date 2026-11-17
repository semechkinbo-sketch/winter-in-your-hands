/* Paste into SoloLearn's JavaScript tab. Requires internet and WebGL. */
(async function () {
  try {
    const THREE = await import('three');
    const { OrbitControls } = await import('three/addons/controls/OrbitControls.js');

/* Cozy House in a Snow Globe - interactive 3D winter scene.
   Igor's "Cozy House: Winter" rebuilt as a miniature inside a glass snow globe.
   All geometry is made in code; no external assets. */
function startSnowGlobe(THREE, OrbitControls, mount) {
'use strict';

/* ---------- seeded randomness: the globe is always the same ---------- */
let seed = 20261117;
function rnd() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
function rand(a, b) { return a + (b - a) * rnd(); }

/* ---------- palette from his original CSS ---------- */
const C = {
  skyTopDay: 0xa1c4fd, skyBotDay: 0xc2e9fb,
  skyTopNight: 0x070722, skyBotNight: 0x1a1a4a,
  wall: 0xf6e58d, roof: 0xeb4d4b, door: 0x6e473b, chimney: 0xb03a2e,
  snow: 0xf4f7ff, snowShade: 0xdfe8f8,
};
C.pineDark = 0x175332;
C.pineMid = 0x1e6b41;
C.pineLight = 0x2f8f57;
C.trunk = 0x3e2723;
C.pinecone = 0x8d5a2b;
C.birdBack = 0x2d3436;
C.birdBelly = 0xe74c3c;
C.paneRed = 0xff6b6b; C.paneGreen = 0x1dd1a1; C.paneBlue = 0x54a0ff; C.paneYellow = 0xfeca57;

/* ---------- renderer / scene / camera ---------- */
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
mount.appendChild(renderer.domElement);
renderer.domElement.style.display = 'block';
renderer.domElement.style.borderRadius = 'inherit';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 60);
const TARGET = new THREE.Vector3(0, 0.53, 0);
camera.position.set(0.4, 1.6, 6.2);
camera.lookAt(TARGET);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.copy(TARGET);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.enablePan = false;
controls.minDistance = 2.6;
controls.maxDistance = 7.5;
controls.minPolarAngle = 0.55;
controls.maxPolarAngle = 1.62;
controls.rotateSpeed = 0.7;

/* ---------- lights ---------- */
const hemi = new THREE.HemisphereLight(0xffffff, 0x8fa7c9, 0.75);
scene.add(hemi);
const sunLight = new THREE.DirectionalLight(0xfff2d8, 2.1);
sunLight.position.set(2.6, 4.2, 1.8);
sunLight.castShadow = true;
sunLight.shadow.mapSize.set(2048, 2048);
sunLight.shadow.camera.left = -2.4; sunLight.shadow.camera.right = 2.4;
sunLight.shadow.camera.top = 2.4; sunLight.shadow.camera.bottom = -2.4;
sunLight.shadow.camera.far = 12;
sunLight.shadow.bias = -0.0003;
sunLight.shadow.normalBias = 0.012;
scene.add(sunLight);
/* no point light at the house: the lit window glows by pane emissive only,
   and the open doorway glows by the hallway plane - nothing floods the facade */

/* ---------- materials helper ---------- */
function std(color, extra) {
  return new THREE.MeshStandardMaterial(Object.assign({ color, roughness: 0.9, metalness: 0.0 }, extra || {}));
}
function shadowed(mesh) { mesh.castShadow = true; mesh.receiveShadow = true; return mesh; }

/* ---------- globe dimensions ---------- */
const R = 1.3;             // glass radius
const CY = 0.28;           // sphere centre height above base top

/* ---------- inner sky dome (day/night gradient inside the globe) ---------- */
const skyU = {
  cTop: { value: new THREE.Color(C.skyTopDay) },
  cBot: { value: new THREE.Color(C.skyBotDay) },
  uStars: { value: 0.0 },
};
const skyDome = new THREE.Mesh(
  new THREE.SphereGeometry(1.28, 40, 24, 0, Math.PI * 2, 0, Math.PI * 0.72),
  new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: skyU,
    vertexShader: 'varying vec3 vP; void main(){ vP=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
    fragmentShader: [
      'varying vec3 vP; uniform vec3 cTop; uniform vec3 cBot; uniform float uStars;',
      'float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }',
      'void main(){',
      '  float h = clamp(vP.y*0.5+0.5, 0.0, 1.0);',
      '  vec3 col = mix(cBot, cTop, pow(h, 0.85));',
      '  if(uStars > 0.01 && h > 0.45){',
      '    vec2 g = floor(vP.xz*90.0) + floor(vP.y*90.0);',
      '    float s = hash(g);',
      '    if(s > 0.985){ float tw = 0.6+0.4*sin(s*90.0+vP.x*40.0); col += vec3(tw)*uStars*smoothstep(0.45,0.75,h); }',
      '  }',
      '  gl_FragColor = vec4(col, 1.0);',
      '}',
    ].join('\n'),
  })
);
skyDome.position.y = CY;
scene.add(skyDome);

/* ---------- soft cloud from the original winter scene ---------- */
const cloud = new THREE.Group();
const cloudMat = new THREE.MeshStandardMaterial({color:0xffffff,roughness:1,transparent:true,opacity:0.92});
for (const [x,y,r] of [[-0.12,0,0.09],[-0.03,0.05,0.12],[0.08,0.02,0.10],[0.15,-0.01,0.07]]) {
  const puff = new THREE.Mesh(new THREE.SphereGeometry(r,16,12),cloudMat);
  puff.scale.z=0.65; puff.position.set(x,y,0); cloud.add(puff);
}
cloud.scale.setScalar(0.7);                  // small enough to stay inside the glass from every angle
cloud.position.set(-0.48,1.08,-0.50);
scene.add(cloud);

/* ---------- glass globe ---------- */
const glass = new THREE.Mesh(
  new THREE.SphereGeometry(R, 64, 48, 0, Math.PI * 2, 0, Math.PI * 0.70),
  new THREE.MeshPhysicalMaterial({
    color: 0xdfeaf5, transparent: true, opacity: 0.10, roughness: 0.03, metalness: 0,
    clearcoat: 1, clearcoatRoughness: 0.06, side: THREE.DoubleSide, depthWrite: false,
    envMapIntensity: 1.0,
  })
);
glass.position.y = CY;
glass.renderOrder = 10;
scene.add(glass);
/* fresnel rim so the ball reads as glass */
const rim = new THREE.Mesh(
  new THREE.SphereGeometry(R * 1.001, 64, 48, 0, Math.PI * 2, 0, Math.PI * 0.70),
  new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.FrontSide, fog: false,
    uniforms: { uCol: { value: new THREE.Color(0xcfe4ff) } },
    vertexShader: 'varying vec3 vN; varying vec3 vV; void main(){ vN=normalize(normalMatrix*normal); vec4 mv=modelViewMatrix*vec4(position,1.0); vV=normalize(-mv.xyz); gl_Position=projectionMatrix*mv; }',
    fragmentShader: 'varying vec3 vN; varying vec3 vV; uniform vec3 uCol; void main(){ float f=pow(1.0-abs(dot(normalize(vN),normalize(vV))),3.0); gl_FragColor=vec4(uCol, f*0.55); }',
  })
);
rim.position.y = CY;
rim.renderOrder = 11;
scene.add(rim);

/* ---------- turned wooden base ---------- */
const basePts = [
  [0.0, -0.52], [1.46, -0.52], [1.55, -0.47], [1.58, -0.38], [1.55, -0.22],
  [1.50, -0.10], [1.42, -0.02], [1.34, 0.02], [1.05, 0.055], [0.0, 0.06],
].map(p => new THREE.Vector2(p[0], p[1]));
const woodMat = new THREE.MeshStandardMaterial({ color: 0x5d3a22, roughness: 0.42, metalness: 0.08 });
const base = shadowed(new THREE.Mesh(new THREE.LatheGeometry(basePts, 72), woodMat));
scene.add(base);
const baseRim = shadowed(new THREE.Mesh(new THREE.TorusGeometry(1.335, 0.045, 16, 72), new THREE.MeshStandardMaterial({ color: 0x7a4e2c, roughness: 0.35, metalness: 0.15 })));
baseRim.rotation.x = Math.PI / 2;
baseRim.position.y = 0.045;
scene.add(baseRim);

/* ---------- snow mound inside the globe ---------- */
const R0 = Math.sqrt(R * R - CY * CY);   // radius where the ball meets the base
const mound = shadowed(new THREE.Mesh(
  new THREE.SphereGeometry(R0 * 1.02, 48, 20, 0, Math.PI * 2, 0, Math.PI * 0.42),
  std(C.snow, { roughness: 1 })
));
mound.scale.y = 0.34;
mound.position.y = 0.05 - 0.10;
scene.add(mound);
const GROUND_Y = 0.28;   // walking surface of the mound at the centre

/* ---------- the house ---------- */
const house = new THREE.Group();
house.position.set(0, GROUND_Y + 0.11, -0.05);
scene.add(house);

const HW = 0.70, HH = 0.47, HD = 0.58;   // walls width/height/depth
const walls = shadowed(new THREE.Mesh(new THREE.BoxGeometry(HW, HH, HD), std(C.wall, { roughness: 0.95 })));
walls.position.y = HH / 2;
house.add(walls);

/* gable roof: two slopes + snow caps */
const roof = new THREE.Group();
const slopeLen = Math.hypot(HW / 2 + 0.10, 0.26);
const slope = new THREE.BoxGeometry(slopeLen, 0.045, HD + 0.16);
const roofMat = std(C.roof, { roughness: 0.8 });
const roofL = shadowed(new THREE.Mesh(slope, roofMat));
const roofR = shadowed(new THREE.Mesh(slope, roofMat));
const ang = Math.atan2(0.26, HW / 2 + 0.10);
roofL.position.set(-(HW / 4 + 0.025), HH + 0.13, 0); roofL.rotation.z = ang;
roofR.position.set((HW / 4 + 0.025), HH + 0.13, 0); roofR.rotation.z = -ang;
roof.add(roofL, roofR);
/* gable triangles */
const gShape = new THREE.Shape();
gShape.moveTo(-HW / 2, 0); gShape.lineTo(HW / 2, 0); gShape.lineTo(0, 0.26); gShape.closePath();
const gGeo = new THREE.ExtrudeGeometry(gShape, { depth: 0.001, bevelEnabled: false });
const gableF = new THREE.Mesh(gGeo, std(C.wall, { roughness: 0.95 }));
gableF.position.set(0, HH, HD / 2);
const gableB = gableF.clone(); gableB.position.z = -HD / 2 - 0.001; gableB.rotation.y = Math.PI;
house.add(gableF, gableB);
/* snow caps on the slopes + ridge */
const snowMat = std(0xffffff, { roughness: 1 });
const capGeo = new THREE.BoxGeometry(slopeLen + 0.015, 0.03, HD + 0.17);
const capL = new THREE.Mesh(capGeo, snowMat);
const capR = new THREE.Mesh(capGeo, snowMat);
capL.position.copy(roofL.position); capL.position.y += 0.032; capL.rotation.z = ang;
capR.position.copy(roofR.position); capR.position.y += 0.032; capR.rotation.z = -ang;
roof.add(capL, capR);
const ridge = new THREE.Mesh(new THREE.CapsuleGeometry(0.028, HD + 0.14, 4, 10), snowMat);
ridge.rotation.x = Math.PI / 2;
ridge.position.set(0, HH + 0.26, 0);
roof.add(ridge);
house.add(roof);
const RIDGE_Y = house.position.y + HH + 0.26;

/* chimney with snow cap */
const chim = shadowed(new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.24, 0.11), std(C.chimney, { roughness: 0.85 })));
chim.position.set(-0.17, HH + 0.24, -0.10);
house.add(chim);
const chimSnow = new THREE.Mesh(new THREE.BoxGeometry(0.125, 0.03, 0.125), snowMat);
chimSnow.position.set(-0.17, HH + 0.365, -0.10);
house.add(chimSnow);
const chimTop = new THREE.Vector3();   // world position of the chimney mouth
house.updateMatrixWorld(true);
chimTop.set(-0.17, HH + 0.38, -0.10).add(house.position);

/* smoke: soft white spheres drifting up */
const smokePuffs = [];
const smokeMat = new THREE.MeshStandardMaterial({ color: 0xf2f5fa, transparent: true, opacity: 0.55, roughness: 1 });
for (let i = 0; i < 7; i++) {
  const s = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 10), smokeMat.clone());
  s.userData.t = i / 7;
  scene.add(s);
  smokePuffs.push(s);
}
let smokeOn = true;

/* door: brown arched door with yellow knob, opens on tap */
const doorGroup = new THREE.Group();
doorGroup.position.set(0.13, 0, HD / 2 + 0.005);
house.add(doorGroup);
const dShape = new THREE.Shape();
dShape.moveTo(-0.075, 0); dShape.lineTo(-0.075, 0.20);
dShape.absarc(0, 0.20, 0.075, Math.PI, 0, true);
dShape.lineTo(0.075, 0); dShape.closePath();
const doorGeo = new THREE.ExtrudeGeometry(dShape, { depth: 0.02, bevelEnabled: false });
doorGeo.translate(0, 0, -0.01);
const door = shadowed(new THREE.Mesh(doorGeo, std(C.door, { roughness: 0.8 })));
door.position.set(0.075, 0, 0);        // hinge at the left edge
const doorPivot = new THREE.Group();
doorPivot.position.set(-0.075 + 0.0, 0, 0);
doorPivot.add(door);
door.position.x = 0.075;
doorGroup.add(doorPivot);
const knob = new THREE.Mesh(new THREE.SphereGeometry(0.012, 10, 8), std(0xf7d354, { roughness: 0.3, metalness: 0.6 }));
knob.position.set(0.05, 0.10, 0.018);
door.add(knob);
/* warm hallway glow seen when the door is open */
const hallway = new THREE.Mesh(
  new THREE.ShapeGeometry(dShape),
  new THREE.MeshBasicMaterial({ color: 0x17131b, transparent: true, opacity: 0.0 })
);
hallway.position.set(0, 0, -0.004);
doorGroup.add(hallway);
let doorOpen = 0, doorTarget = 0;

/* colourful four-pane window with the cat in the yellow pane */
const win = new THREE.Group();
win.position.set(-0.16, 0.20, HD / 2 + 0.004);
house.add(win);
const winFrame = shadowed(new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.20, 0.015), std(0xffffff, { roughness: 0.6 })));
win.add(winFrame);
const paneCols = [C.paneRed, C.paneGreen, C.paneBlue, C.paneYellow];
const paneMeshes = [];
for (let i = 0; i < 4; i++) {
  const p = new THREE.Mesh(
    new THREE.PlaneGeometry(0.082, 0.082),
    new THREE.MeshStandardMaterial({ color: paneCols[i], roughness: 0.25, emissive: paneCols[i], emissiveIntensity: 0.18 })
  );
  p.position.set((i % 2 ? 0.045 : -0.045), (i < 2 ? 0.045 : -0.045), 0.009);
  win.add(p);
  paneMeshes.push(p);
}
/* the cat: dark silhouette with ears and two eyes, in the yellow pane */
const cat = new THREE.Group();
const catBody = new THREE.Mesh(new THREE.CircleGeometry(0.030, 20), new THREE.MeshBasicMaterial({ color: 0x14161c }));
catBody.scale.y = 0.86;
const earGeo = new THREE.CircleGeometry(0.011, 3);
const earL = new THREE.Mesh(earGeo, catBody.material); earL.position.set(-0.016, 0.026, 0);
const earR = new THREE.Mesh(earGeo, catBody.material); earR.position.set(0.016, 0.026, 0);
const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffe28a });
const eyeL = new THREE.Mesh(new THREE.CircleGeometry(0.0048, 8), eyeMat); eyeL.position.set(-0.011, 0.004, 0.001);
const eyeR = eyeL.clone(); eyeR.position.x = 0.011;
cat.add(catBody, earL, earR, eyeL, eyeR);
cat.position.set(0.045, -0.052, 0.012);
win.add(cat);
let catBlinkT = rand(2, 5);
let windowLit = false;

/* ---------- the bullfinch on the roof ridge ---------- */
const bird = new THREE.Group();
const bBody = new THREE.Mesh(new THREE.SphereGeometry(0.035, 16, 12), std(C.birdBack, { roughness: 0.9 }));
bBody.scale.set(1, 0.95, 1.25);
const bBelly = new THREE.Mesh(new THREE.SphereGeometry(0.028, 14, 10), std(C.birdBelly, { roughness: 0.9 }));
bBelly.position.set(0, -0.008, 0.020); bBelly.scale.set(0.92, 0.9, 1.0);
const bHead = new THREE.Mesh(new THREE.SphereGeometry(0.020, 14, 10), std(C.birdBack, { roughness: 0.9 }));
bHead.position.set(0, 0.032, 0.028);
const bBeak = new THREE.Mesh(new THREE.ConeGeometry(0.006, 0.016, 8), std(0x30343a, { roughness: 0.6 }));
bBeak.rotation.x = Math.PI / 2; bBeak.position.set(0, 0.030, 0.050);
const bTail = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.006, 0.045), std(C.birdBack, { roughness: 0.9 }));
bTail.position.set(0, 0.004, -0.048); bTail.rotation.x = 0.35;
const wingGeo = new THREE.SphereGeometry(0.020, 10, 8);
const wingL = new THREE.Mesh(wingGeo, std(0x3b4048, { roughness: 0.9 }));
wingL.scale.set(0.35, 0.8, 1.1); wingL.position.set(-0.026, 0.004, -0.004);
const wingR = wingL.clone(); wingR.position.x = 0.026;
bird.add(bBody, bBelly, bHead, bBeak, bTail, wingL, wingR);
const BIRD_REST_Y = RIDGE_Y + 0.061; // ridge radius .028 + body underside .033
bird.position.set(0, BIRD_REST_Y, 0.02);
bird.rotation.y = -0.5;
scene.add(bird);
let birdHop = 0, birdIdle = rand(0, 6);

/* musical note sprite when it sings */
function noteTexture() {
  const cv = document.createElement('canvas'); cv.width = cv.height = 64;
  const g = cv.getContext('2d');
  g.fillStyle = '#fff'; g.font = 'bold 46px serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText('\u266A', 32, 34);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
}
const noteTex = noteTexture();
const notes = [];
function singNote() {
  const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: noteTex, transparent: true, opacity: 1, depthWrite: false }));
  m.scale.set(0.09, 0.09, 1);
  m.position.copy(bird.position).add(new THREE.Vector3(rand(-0.02, 0.05), 0.07, 0.02));
  m.userData.t = 0;
  scene.add(m); notes.push(m);
}

/* ---------- snowy pines ---------- */
const pines = [];
function makePine(scale, x, z, tiers) {
  const g = new THREE.Group();
  const trunk = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(0.028 * scale, 0.038 * scale, 0.16 * scale, 8), std(C.trunk)));
  trunk.position.y = 0.08 * scale;
  g.add(trunk);
  const greens = [C.pineDark, C.pineMid, C.pineLight];
  let y = 0.14 * scale;
  for (let i = 0; i < tiers; i++) {
    const r = (0.20 - i * 0.038) * scale;
    const h = 0.17 * scale;
    const cone = shadowed(new THREE.Mesh(new THREE.ConeGeometry(r, h, 12), std(greens[Math.min(i, 2)], { roughness: 0.95 })));
    cone.position.y = y + h / 2;
    g.add(cone);
    const snowCone = new THREE.Mesh(new THREE.ConeGeometry(r * 0.62, h * 0.45, 12), snowMat);
    snowCone.position.y = y + h * 0.78;
    g.add(snowCone);
    y += h * 0.62;
  }
  const topSnow = new THREE.Mesh(new THREE.SphereGeometry(0.022 * scale, 8, 8), snowMat);
  topSnow.position.y = y + 0.015;
  g.add(topSnow);
  /* pinecones */
  const nCones = 2 + Math.floor(rnd() * 2);
  for (let i = 0; i < nCones; i++) {
    const pc = new THREE.Mesh(new THREE.SphereGeometry(0.016 * scale, 8, 6), std(C.pinecone, { roughness: 1 }));
    pc.scale.y = 1.35;
    const a = rand(0, Math.PI * 2);
    rand(0.10, 0.16); // retain the seeded scene layout
    const py = rand(0.22, 0.42) * scale;
    const tier = Math.min(tiers - 1, Math.max(0, Math.floor((py / scale - 0.14) / (0.17 * 0.62))));
    const baseY = (0.14 + tier * 0.17 * 0.62) * scale;
    const tierR = (0.20 - tier * 0.038) * scale;
    const faceA = (Math.floor(a / (Math.PI / 6)) + 0.5) * Math.PI / 6;
    const radial = tierR * (1 - (py - baseY) / (0.17 * scale)) * Math.cos(Math.PI / 12);
    const slope = tierR * Math.cos(Math.PI / 12) / (0.17 * scale);
    const norm = Math.hypot(1, slope);
    const nr = 1 / norm, ny = slope / norm;
    const contact = 0.016 * scale * Math.sqrt(nr * nr + 1.35 * 1.35 * ny * ny) * 0.96;
    const rr = radial + nr * contact;
    pc.position.set(Math.sin(faceA) * rr, py + ny * contact, Math.cos(faceA) * rr);
    g.add(pc);
  }
  g.position.set(x, GROUND_Y - 0.04, z);
  g.userData.shake = 0;
  scene.add(g);
  pines.push(g);
  return g;
}
makePine(1.2, -0.68, -0.28, 4);
makePine(1.0, -0.78, 0.20, 3);
makePine(1.1, 0.72, -0.30, 4);
makePine(0.85, 0.66, 0.26, 3);

/* distant pines at the back of the globe: same solid full-colour style as the near ones */
for (let i = 0; i < 7; i++) {
  const a = Math.PI + (i - 3) * 0.38;
  const rr = 1.00;
  makePine(rand(0.5, 0.7), Math.sin(a) * rr, Math.cos(a) * rr, 3);
}

/* ---------- snowfall inside the globe ---------- */
const NSNOW = 420;
const sPos = new Float32Array(NSNOW * 3);
const sSpd = new Float32Array(NSNOW);
const sPh = new Float32Array(NSNOW);
const SNOW_OY = CY - 0.85;   // container origin, so local y -> world y = local + SNOW_OY
function snowRadiusAt(localY) {
  const wy = localY + SNOW_OY - CY;                 // offset from sphere centre
  return Math.sqrt(Math.max(0.0004, R * R - wy * wy)) * 0.94;
}
for (let i = 0; i < NSNOW; i++) {
  const y = rand(0.75, 2.0);
  const r = Math.sqrt(rnd()) * snowRadiusAt(y), a = rnd() * Math.PI * 2;
  sPos[i * 3] = Math.cos(a) * r;
  sPos[i * 3 + 1] = y;
  sPos[i * 3 + 2] = Math.sin(a) * r;
  sSpd[i] = rand(0.10, 0.22);
  sPh[i] = rnd() * Math.PI * 2;
}
const snowGeo = new THREE.BufferGeometry();
snowGeo.setAttribute('position', new THREE.BufferAttribute(sPos, 3).setUsage(THREE.DynamicDrawUsage));
const flakeTex = (() => {
  const cv = document.createElement('canvas'); cv.width = cv.height = 32;
  const g = cv.getContext('2d');
  const grad = g.createRadialGradient(16, 16, 1, 16, 16, 15);
  grad.addColorStop(0, 'rgba(255,255,255,1)'); grad.addColorStop(0.5, 'rgba(255,255,255,0.8)'); grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad; g.fillRect(0, 0, 32, 32);
  const t = new THREE.CanvasTexture(cv); return t;
})();
const snowPts = new THREE.Points(snowGeo, new THREE.PointsMaterial({
  size: 0.035, map: flakeTex, transparent: true, depthWrite: false, opacity: 0.95, color: 0xffffff, sizeAttenuation: true,
}));
snowPts.position.y = SNOW_OY;
snowPts.renderOrder = 5;
scene.add(snowPts);
/* A tap briefly strengthens snowfall across the whole globe. */
const NCLOUD = 260;
const cloudFall = new Float32Array(NCLOUD);
const cloudPos = new Float32Array(NCLOUD * 3);
const cloudSnowGeo = new THREE.BufferGeometry();
cloudSnowGeo.setAttribute('position', new THREE.BufferAttribute(cloudPos, 3).setUsage(THREE.DynamicDrawUsage));
const cloudSnow = new THREE.Points(cloudSnowGeo, snowPts.material.clone());
cloudSnow.material.size = 0.04;
cloudSnow.visible = false;
cloudSnow.renderOrder = 5;
scene.add(cloudSnow);
let cloudSnowTime = 0;
/* settled snow lying on the mound: a strong shake lifts it, then it falls back */
const NGS = 320;
const gsHome = new Float32Array(NGS * 3);
const gsPos = new Float32Array(NGS * 3);
const gsVel = new Float32Array(NGS * 3);
const gsAir = new Uint8Array(NGS);
function moundY(x, z) {
  const rr = R0 * 1.02;
  return -0.05 + 0.34 * Math.sqrt(Math.max(0, rr * rr - x * x - z * z));
}
for (let i = 0; i < NGS; i++) {
  const r = Math.sqrt(rnd()) * R0 * 0.90, a = rnd() * Math.PI * 2;
  const x = Math.cos(a) * r, z = Math.sin(a) * r;
  gsHome[i * 3] = x; gsHome[i * 3 + 1] = moundY(x, z) + 0.008; gsHome[i * 3 + 2] = z;
  gsPos.set([x, gsHome[i * 3 + 1], z], i * 3);
}
const gsGeo = new THREE.BufferGeometry();
gsGeo.setAttribute('position', new THREE.BufferAttribute(gsPos, 3).setUsage(THREE.DynamicDrawUsage));
const groundSnow = new THREE.Points(gsGeo, new THREE.PointsMaterial({
  size: 0.042, map: flakeTex, transparent: true, depthWrite: false, opacity: 0.97, color: 0xfbfdff, sizeAttenuation: true,
}));
groundSnow.renderOrder = 4;
scene.add(groundSnow);
let kickTimer = 0;
function kickSnow(strength) {
  for (let i = 0; i < NGS; i++) {
    if (gsAir[i] || rnd() > 0.85) continue;
    gsAir[i] = 1;
    gsVel[i * 3] = rand(-0.6, 0.6) * strength;
    gsVel[i * 3 + 1] = rand(0.9, 1.9) * strength;
    gsVel[i * 3 + 2] = rand(-0.6, 0.6) * strength;
  }
}

let snowBoost = 0;   // extra swirl after a tree shake or a fast spin
let spinBoost = 0, lastAz = 0;
if (window.DeviceMotionEvent) {
  let lastAcc = null;
  window.addEventListener('devicemotion', (e) => {
    const a = e.accelerationIncludingGravity; if (!a || a.x == null) return;
    const v = [a.x, a.y, a.z];
    if (lastAcc) {
      const jolt = Math.hypot(v[0] - lastAcc[0], v[1] - lastAcc[1], v[2] - lastAcc[2]);
      if (jolt > 9) { snowBoost = Math.min(2.0, snowBoost + 0.9); spinBoost = Math.min(1.8, spinBoost + 0.6); }
    }
    lastAcc = v;
  });
}

/* ---------- sun / moon inside the globe ---------- */
const cel = new THREE.Group();
const sunMesh = new THREE.Mesh(new THREE.SphereGeometry(0.085, 20, 16), new THREE.MeshBasicMaterial({ color: 0xffd94d, fog: false }));
const sunGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: flakeTex, color: 0xffe89a, transparent: true, opacity: 0.85, depthWrite: false, fog: false }));
sunGlow.scale.set(0.42, 0.42, 1);
cel.add(sunMesh, sunGlow);
const moonMesh = new THREE.Mesh(new THREE.SphereGeometry(0.075, 20, 16), new THREE.MeshBasicMaterial({ color: 0xf2f0e6, fog: false }));
const moonShade = new THREE.Mesh(new THREE.SphereGeometry(0.068, 20, 16), new THREE.MeshBasicMaterial({ color: 0x1a1a4a, fog: false }));
moonShade.position.set(0.030, 0.012, 0.012);
const moonGroup = new THREE.Group();
moonGroup.add(moonMesh, moonShade);
moonGroup.visible = false;
cel.add(moonGroup);
cel.position.set(0.62, CY + 0.62, -0.55);
scene.add(cel);
/* The small sun represents a distant sun. Its direction from the snow centre
   is also the real directional light direction, fixed in the world during orbit. */
sunLight.target.position.set(0, GROUND_Y, 0);
sunLight.position.copy(cel.position).sub(sunLight.target.position).multiplyScalar(6).add(sunLight.target.position);
scene.add(sunLight.target);
let night = 0, nightTarget = 0;   // 0 day, 1 night

/* ---------- tiny WebAudio chirp + soft wind ---------- */
let actx = null, windNode = null;
function audio() {
  if (!actx) { const AC = window.AudioContext || window.webkitAudioContext; if (AC) actx = new AC(); }
  if (actx && actx.state === 'suspended') actx.resume();
  return actx;
}
function chirp() {
  const a = audio(); if (!a) return;
  const t0 = a.currentTime;
  for (let i = 0; i < 2; i++) {
    const o = a.createOscillator(), g = a.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(2300 - i * 300, t0 + i * 0.12);
    o.frequency.exponentialRampToValueAtTime(1400, t0 + i * 0.12 + 0.09);
    g.gain.setValueAtTime(0.0001, t0 + i * 0.12);
    g.gain.exponentialRampToValueAtTime(0.08, t0 + i * 0.12 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + i * 0.12 + 0.10);
    o.connect(g).connect(a.destination);
    o.start(t0 + i * 0.12); o.stop(t0 + i * 0.12 + 0.12);
  }
}
function startWind() {
  const a = audio(); if (!a || windNode) return;
  const len = a.sampleRate * 2;
  const buf = a.createBuffer(1, len, a.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * 0.05;
  const src = a.createBufferSource(); src.buffer = buf; src.loop = true;
  const f = a.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 320;
  const g = a.createGain(); g.gain.value = 0.05;
  src.connect(f).connect(g).connect(a.destination);
  src.start();
  windNode = g;
}
function tapThock(freq, dur, vol) {
  const a = audio(); if (!a) return;
  const o = a.createOscillator(), g = a.createGain();
  o.type = 'triangle'; o.frequency.value = freq;
  const t0 = a.currentTime;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(a.destination);
  o.start(t0); o.stop(t0 + dur + 0.05);
}

/* ---------- first-open hint, disappears after the first tap ---------- */
const hint = document.createElement('div');
hint.className = 'globe-hint globe-hint-top';
hint.textContent = 'Tap the sun, door, window, bird & trees · spin fast to shake the snow';
mount.appendChild(hint);
mount.addEventListener('contextmenu', (e) => e.preventDefault());
let hintGone = false;
function dropHint() {
  if (hintGone) return; hintGone = true;
  hint.classList.add('is-gone');
  setTimeout(() => hint.remove(), 900);
}
setTimeout(dropHint, 12000);

/* ---------- picking ---------- */
const ray = new THREE.Raycaster();
const ptr = new THREE.Vector2();
let downAt = 0, downXY = [0, 0];
renderer.domElement.addEventListener('pointerdown', (e) => { downAt = performance.now(); downXY = [e.clientX, e.clientY]; flTrail.length = 0; });
/* a sharp flick across the globe shakes the settled snow loose */
const flTrail = [];
renderer.domElement.addEventListener('pointermove', (e) => {
  if (e.buttons === 0) return;
  flTrail.push([performance.now(), e.clientX, e.clientY]);
  if (flTrail.length > 12) flTrail.shift();
});
renderer.domElement.addEventListener('pointerup', (e) => {
  flTrail.push([performance.now(), e.clientX, e.clientY]);
  const now = performance.now();
  while (flTrail.length && now - flTrail[0][0] > 140) flTrail.shift();
  if (flTrail.length >= 2) {
    const a = flTrail[0], b = flTrail[flTrail.length - 1];
    const v = Math.hypot(b[1] - a[1], b[2] - a[2]) / Math.max(1, b[0] - a[0]) * 1000;  // px per second
    if (v > 850) {
      const s = Math.min(1.8, 0.9 + v / 2200);
      kickSnow(s);
      spinBoost = Math.max(spinBoost, Math.min(1.8, s));
      kickTimer = 1.6;
    }
  }
  flTrail.length = 0;
});
renderer.domElement.addEventListener('pointerup', (e) => {
  if (performance.now() - downAt > 350) return;                  // it was a drag
  if (Math.hypot(e.clientX - downXY[0], e.clientY - downXY[1]) > 12) return;
  const rct = renderer.domElement.getBoundingClientRect();
  ptr.x = ((e.clientX - rct.left) / rct.width) * 2 - 1;
  ptr.y = -((e.clientY - rct.top) / rct.height) * 2 + 1;
  ray.setFromCamera(ptr, camera);
  const pick = (obj) => ray.intersectObject(obj, true).length > 0;
  startWind(); dropHint();
  if (pick(bird)) {
    birdHop = 1; chirp(); singNote(); setTimeout(singNote, 160);
  } else if (pick(cloud)) {
    cloudSnowTime = 6;
    for (let i = 0; i < NCLOUD; i++) cloudFall[i] = (i * 0.61803398875) % 1;
  } else if (pick(doorPivot) || pick(hallway)) {
    doorTarget = doorTarget > 0.5 ? 0 : 1;
    tapThock(doorTarget ? 340 : 240, 0.18, 0.10);
  } else if (pick(win)) {
    setWindowLit(!windowLit);
    tapThock(520, 0.12, 0.07);
  } else if (pick(chim) || pick(chimSnow)) {
    smokeOn = !smokeOn;
    tapThock(300, 0.12, 0.06);
  } else if (pick(cel)) {
    nightTarget = nightTarget > 0.5 ? 0 : 1;
    setWindowLit(nightTarget === 1);
    tapThock(nightTarget ? 260 : 620, 0.3, 0.08);
  } else {
    for (const p of pines) {
      if (pick(p)) { p.userData.shake = 1; snowBoost = Math.min(1.6, snowBoost + 0.8); tapThock(190, 0.16, 0.09); break; }
    }
  }
});
function setWindowLit(on) {
  windowLit = on;
  for (const p of paneMeshes) p.material.emissiveIntensity = on ? 1.6 : 0.18;
}

/* ---------- resize ---------- */
function resize() {
  const w = mount.clientWidth || 1, h = mount.clientHeight || 1;
  renderer.setSize(w, h);
  camera.aspect = w / h;
  /* fit the whole globe (bounding sphere around centre y=0.53, r~1.66) in the tighter of the two fovs */
  const vHalf = THREE.MathUtils.degToRad(camera.fov / 2);
  const hHalf = Math.atan(Math.tan(vHalf) * camera.aspect);
  const need = 1.65 / Math.sin(Math.min(vHalf, hHalf));
  const dir = camera.position.clone().sub(controls.target).normalize();
  camera.position.copy(controls.target).addScaledVector(dir, need);
  controls.minDistance = need * 0.55;
  controls.maxDistance = need * 1.8;
  /* the viewer shows the top part of a taller canvas: lift the composition */
  camera.setViewOffset(w, h, 0, h * 0.13, w, h);
  camera.updateProjectionMatrix();
}
resize();
window.addEventListener('resize', resize);

/* ---------- animation ---------- */
const clock = new THREE.Clock();
const colTmp = new THREE.Color(), colTop = new THREE.Color(), colBot = new THREE.Color();
const dayTop = new THREE.Color(C.skyTopDay), dayBot = new THREE.Color(C.skyBotDay);
const nightTop = new THREE.Color(C.skyTopNight), nightBot = new THREE.Color(C.skyBotNight);
let alive = true;

function frame() {
  if (!alive) return;
  requestAnimationFrame(frame);
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;
  controls.update();

  /* day / night blend */
  night += (nightTarget - night) * Math.min(1, dt * 2.2);
  skyU.cTop.value.copy(dayTop).lerp(nightTop, night);
  skyU.cBot.value.copy(dayBot).lerp(nightBot, night);
  skyU.uStars.value = night;
  cloudMat.opacity = 0.92 - night * 0.58;
  hemi.intensity = 0.75 - night * 0.52;
  sunLight.intensity = 2.1 - night * 1.75;
  sunLight.color.setHex(night > 0.5 ? 0x9db4ff : 0xfff2d8);
  moonGroup.visible = night > 0.5;
  sunMesh.visible = sunGlow.visible = night <= 0.5;

  /* door swing */
  doorOpen += (doorTarget - doorOpen) * Math.min(1, dt * 5);
  doorPivot.rotation.y = -doorOpen * 1.9;
  hallway.material.opacity = doorOpen;
  hallway.material.color.setHex(windowLit ? 0xffc98a : 0x17131b);

  /* smoke */
  for (const s of smokePuffs) {
    s.userData.t += dt * 0.24;
    if (s.userData.t > 1) s.userData.t -= 1;
    const q = s.userData.t;
    s.visible = smokeOn;
    if (!smokeOn) continue;
    s.position.set(
      chimTop.x + Math.sin(q * 9 + t) * 0.02 + q * 0.06,
      chimTop.y + q * 0.25,
      chimTop.z + Math.cos(q * 7) * 0.015
    );
    const sc = 0.35 + q * 1.5;
    s.scale.setScalar(sc);
    s.material.opacity = 0.5 * (q < 0.12 ? q / 0.12 : 1 - (q - 0.12) / 0.88);
  }

  /* bird idle + hop */
  birdIdle += dt;
  const bob = 0; // keep the resting body touching the ridge
  if (birdHop > 0) {
    birdHop = Math.max(0, birdHop - dt * 3.2);
    const hp = Math.sin(birdHop * Math.PI);
    bird.position.y = BIRD_REST_Y + hp * 0.09 + bob;
    wingL.rotation.z = hp * 1.1; wingR.rotation.z = -hp * 1.1;
  } else {
    bird.position.y = BIRD_REST_Y + bob;
    wingL.rotation.z = 0; wingR.rotation.z = 0;
  }
  bird.rotation.y = -0.5 + Math.sin(t * 0.4) * 0.25;

  /* floating notes */
  for (let i = notes.length - 1; i >= 0; i--) {
    const n = notes[i];
    n.userData.t += dt;
    n.position.y += dt * 0.12;
    n.position.x += Math.sin(n.userData.t * 4) * dt * 0.03;
    n.material.opacity = Math.max(0, 1 - n.userData.t / 1.4);
    if (n.userData.t > 1.4) { scene.remove(n); n.material.dispose(); notes.splice(i, 1); }
  }

  /* cat blink */
  catBlinkT -= dt;
  if (catBlinkT < 0) { catBlinkT = rand(2, 5); eyeL.visible = eyeR.visible = false; setTimeout(() => { eyeL.visible = eyeR.visible = true; }, 160); }

  /* pine shake */
  for (const p of pines) {
    if (p.userData.shake > 0) {
      p.userData.shake = Math.max(0, p.userData.shake - dt * 1.8);
      p.rotation.z = Math.sin(p.userData.shake * 22) * 0.06 * p.userData.shake;
    } else p.rotation.z = 0;
  }

  /* Extra snow is spread throughout the globe, never emitted by the cloud. */
  cloudSnowTime = Math.max(0, cloudSnowTime - dt);
  cloudSnow.visible = cloudSnowTime > 0;
  if (cloudSnowTime > 0) {
    cloudSnow.material.opacity = Math.min(1, cloudSnowTime * 2);
    for (let i = 0; i < NCLOUD; i++) {
      cloudFall[i] = (cloudFall[i] + dt * (0.15 + (i % 11) * 0.008)) % 1;
      const yy = 1.40 - cloudFall[i] * 1.20;
      const radius = Math.sqrt(Math.max(0, (R * 0.90) ** 2 - (yy - CY) ** 2));
      const rr = Math.sqrt((i * 0.754877666) % 1) * radius;
      const aa = i * 2.39996323 + Math.sin(t * 1.4 + i) * 0.025;
      cloudPos[i * 3] = Math.cos(aa) * rr;
      cloudPos[i * 3 + 1] = yy;
      cloudPos[i * 3 + 2] = Math.sin(aa) * rr;
    }
    cloudSnowGeo.attributes.position.needsUpdate = true;
  }

  /* snowfall */
  snowBoost = Math.max(0, snowBoost - dt * 0.7);
  const pos = snowGeo.attributes.position.array;
  for (let i = 0; i < NSNOW; i++) {
    let y = pos[i * 3 + 1];
    y -= sSpd[i] * dt * (1 + snowBoost);
    const drift = Math.sin(t * 1.4 + sPh[i]) * 0.05 * dt * (1 + snowBoost * 3);
    pos[i * 3] += drift;
    if (y < 0.72) {   // reached the snow ground inside the globe
      y = 1.84 + rand(0, 0.16);   // back near the top, still inside the glass
      const r = Math.sqrt(rnd()) * snowRadiusAt(y), a = rnd() * Math.PI * 2;
      pos[i * 3] = Math.cos(a) * r; pos[i * 3 + 2] = Math.sin(a) * r;
    }
    /* hard containment: no flake ever crosses the glass, drift included */
    const wyc = y + SNOW_OY - CY;
    const rad = Math.sqrt(pos[i * 3] * pos[i * 3] + pos[i * 3 + 2] * pos[i * 3 + 2] + wyc * wyc);
    if (rad > R * 0.90) {
      const k = R * 0.90 / rad;
      pos[i * 3] *= k; pos[i * 3 + 2] *= k;
      y = CY + wyc * k - SNOW_OY;
    }
    pos[i * 3 + 1] = y;
  }
  snowGeo.attributes.position.needsUpdate = true;

  /* shake the snow: fast spin of the globe, or a physical shake where the browser allows it */
const azNow = controls.getAzimuthalAngle();
let azDelta = Math.abs(azNow - lastAz); lastAz = azNow;
if (azDelta > Math.PI) azDelta = Math.PI * 2 - azDelta;
if (dt > 0) spinBoost = Math.max(spinBoost - dt * 2.2, Math.min(1.8, azDelta / dt * 0.22));
snowBoost = Math.max(snowBoost, spinBoost);
kickTimer = Math.max(0, kickTimer - dt);
if (spinBoost > 0.6 && kickTimer <= 0) { kickSnow(Math.min(1.7, spinBoost + 0.3)); kickTimer = 2.0; }
let groundSnowMoved = false;
for (let i = 0; i < NGS; i++) {
  if (!gsAir[i]) continue;
  groundSnowMoved = true;
  gsVel[i * 3 + 1] -= 2.2 * dt;
  gsPos[i * 3] += gsVel[i * 3] * dt;
  gsPos[i * 3 + 1] += gsVel[i * 3 + 1] * dt;
  gsPos[i * 3 + 2] += gsVel[i * 3 + 2] * dt;
  /* hard containment: shaken grains bounce back off the glass instead of crossing it */
  const gwy = gsPos[i * 3 + 1] - CY;
  const grad = Math.sqrt(gsPos[i * 3] * gsPos[i * 3] + gsPos[i * 3 + 2] * gsPos[i * 3 + 2] + gwy * gwy);
  if (grad > R * 0.90) {
    const k = R * 0.90 / grad;
    gsPos[i * 3] *= k; gsPos[i * 3 + 1] = CY + gwy * k; gsPos[i * 3 + 2] *= k;
    gsVel[i * 3] *= 0.25; gsVel[i * 3 + 1] = Math.min(gsVel[i * 3 + 1], 0) * 0.25; gsVel[i * 3 + 2] *= 0.25;
  }
  if (gsPos[i * 3 + 1] <= gsHome[i * 3 + 1]) {
    gsPos[i * 3] = gsHome[i * 3];
    gsPos[i * 3 + 1] = gsHome[i * 3 + 1];
    gsPos[i * 3 + 2] = gsHome[i * 3 + 2];
    gsVel.fill(0, i * 3, i * 3 + 3);
    gsAir[i] = 0;
  }
}
if (groundSnowMoved) gsGeo.attributes.position.needsUpdate = true;

/* celestial gentle pulse */
  const pulse = 1 + Math.sin(t * 2) * 0.04;
  sunGlow.scale.set(0.42 * pulse, 0.42 * pulse, 1);

  renderer.render(scene, camera);
}



frame();

return function stop() { alive = false; window.removeEventListener('resize', resize); renderer.dispose(); };
}

    const mount = document.getElementById('stage');
    if (document.readyState === 'loading') await new Promise(resolve => document.addEventListener('DOMContentLoaded',resolve,{once:true}));
    startSnowGlobe(THREE, OrbitControls, document.getElementById('stage'));
  } catch (error) {
    console.error(error);
    const msg = document.createElement('p');
    msg.textContent = 'The globe could not load. Please check your connection and WebGL support.';
    msg.style.cssText = 'color:white;padding:24px;font:16px system-ui';
    document.body.appendChild(msg);
  }
})();
