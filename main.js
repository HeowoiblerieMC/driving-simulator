import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.179.1/build/three.module.js";

// NOVA DRIVE 2.0 - rebuilt main.js
// Coordinate convention: car nose is +Z. Japanese left-side traffic:
// Screen-verified Japanese left-side traffic convention:
// +Z => +X, -Z => -X, +X => -Z, -X => +Z.

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
const camera = new THREE.PerspectiveCamera(
  60,
  innerWidth / innerHeight,
  0.1,
  10000,
);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.domElement.style.display = "none";
document.body.appendChild(renderer.domElement);
scene.add(new THREE.HemisphereLight(0xdff3ff, 0x556044, 1.45));
const sun = new THREE.DirectionalLight(0xffffff, 1.6);
sun.position.set(100, 180, 80);
scene.add(sun);

const U = 4 / 3;
const LANE = 5 * U;
const WALK = 3 * U;
const RES_WALK = 2 * U;
const RES_ROAD = 6 * U;
const MEDIAN = 5 * U;
const CARRIAGE = LANE * 2;
const ROAD_W = CARRIAGE * 2 + MEDIAN;
const ROAD_HALF = ROAD_W / 2;
const CARRIAGE_C = MEDIAN / 2 + CARRIAGE / 2;
const SIG_W = LANE * 2;
const SIG_HALF = SIG_W / 2;
const MAP_MIN = -5000;
const MAP_MAX = 5000;
const ROAD_Y = 0.1;
const MARK_Y = 0.225;
const CROSS_DEPTH = 4;
const CROSS_EDGE = 3;
const STOP_CLEAR = 1;
const STOP_THICK = 0.52;
const STOP_OFFSET = CROSS_DEPTH / 2 + STOP_CLEAR + STOP_THICK / 2;
const ARROW_GAP = 13;
const TURN_LEN = 60;

const mat = {
  ground: new THREE.MeshLambertMaterial({ color: 0x3f7526 }),
  road: new THREE.MeshLambertMaterial({ color: 0x2d2d2d }),
  major: new THREE.MeshLambertMaterial({ color: 0x292929 }),
  walk: new THREE.MeshLambertMaterial({ color: 0xc5c5c5 }),
  median: new THREE.MeshLambertMaterial({ color: 0x4d8a3d }),
  white: new THREE.MeshBasicMaterial({
    color: 0xffffff,
    side: THREE.DoubleSide,
  }),
  pole: new THREE.MeshStandardMaterial({
    color: 0x899193,
    metalness: 0.7,
    roughness: 0.43,
  }),
  housing: new THREE.MeshStandardMaterial({
    color: 0xd8dcdb,
    metalness: 0.18,
    roughness: 0.55,
  }),
  hood: new THREE.MeshStandardMaterial({
    color: 0x17191a,
    metalness: 0.08,
    roughness: 0.78,
    side: THREE.DoubleSide,
  }),
};

function box(w, h, d, material, x, y, z, parent = scene) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  m.position.set(x, y, z);
  parent.add(m);
  return m;
}
function cylinder(r1, r2, h, material, parent = scene, segments = 18) {
  const m = new THREE.Mesh(
    new THREE.CylinderGeometry(r1, r2, h, segments),
    material,
  );
  parent.add(m);
  return m;
}

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(10000, 10000),
  mat.ground,
);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

const minorRoads = [],
  signalIntersections = [],
  majorIntersections = [];
for (let z = MAP_MIN; z <= MAP_MAX; z += 125) {
  if (z === 0) continue;
  if (z % 500 === 0) majorIntersections.push(z);
  else if (z % 250 === 0) signalIntersections.push(z);
  else minorRoads.push(z);
}

// Main boulevard, including asphalt under every median opening.
box(CARRIAGE, 0.2, 10000, mat.road, -CARRIAGE_C, ROAD_Y, 0);
box(CARRIAGE, 0.2, 10000, mat.road, CARRIAGE_C, ROAD_Y, 0);
box(MEDIAN, 0.2, 10000, mat.road, 0, ROAD_Y, 0);

function crosswalkX(z, width) {
  const sw = 0.75,
    gap = 0.75;
  const count = Math.floor((width - 2 + gap) / (sw + gap));
  const total = count * sw + (count - 1) * gap;
  for (let i = 0; i < count; i++)
    box(
      sw,
      0.035,
      CROSS_DEPTH,
      mat.white,
      -total / 2 + sw / 2 + i * (sw + gap),
      MARK_Y,
      z,
    );
}
function crosswalkZ(x, width, z0) {
  const sw = 0.75,
    gap = 0.75;
  const count = Math.floor((width - 2 + gap) / (sw + gap));
  const total = count * sw + (count - 1) * gap;
  for (let i = 0; i < count; i++)
    box(
      CROSS_DEPTH,
      0.035,
      sw,
      mat.white,
      x,
      MARK_Y,
      z0 - total / 2 + sw / 2 + i * (sw + gap),
    );
}
function stopX(x, z, width) {
  box(width, 0.04, STOP_THICK, mat.white, x, MARK_Y + 0.01, z);
}
function stopZ(x, z, width) {
  box(STOP_THICK, 0.04, width, mat.white, x, MARK_Y + 0.01, z);
}
function lineX(a, b, z, t = 0.18) {
  if (b > a) box(b - a, 0.03, t, mat.white, (a + b) / 2, MARK_Y, z);
}
function lineZ(x, a, b, t = 0.18) {
  if (b > a) box(t, 0.03, b - a, mat.white, x, MARK_Y, (a + b) / 2);
}

function arrowShape(type) {
  const s = new THREE.Shape();
  const shaft = 0.17,
    rear = -3.8;
  if (type === "straight") {
    s.moveTo(-shaft, rear);
    s.lineTo(shaft, rear);
    s.lineTo(shaft, 1.65);
    s.lineTo(0.72, 1.65);
    s.lineTo(0, 3.8);
    s.lineTo(-0.72, 1.65);
    s.lineTo(-shaft, 1.65);
    s.closePath();
    return s;
  }
  const right = type === "right";
  const m = right ? -1 : 1;
  s.moveTo(-shaft, rear);
  s.lineTo(shaft, rear);
  s.lineTo(shaft, 0.25);
  s.bezierCurveTo(shaft, 0.72, 0.15 * m, 1.15, 0.55 * m, 1.15);
  s.lineTo(1.65 * m, 1.15);
  s.lineTo(1.65 * m, 0.43);
  s.lineTo(2.85 * m, 1.15);
  s.lineTo(1.65 * m, 1.87);
  s.lineTo(1.65 * m, 1.49);
  s.lineTo(0.55 * m, 1.49);
  s.bezierCurveTo(-0.55 * m, 1.49, -shaft, 0.8, -shaft, 0.25);
  s.closePath();
  return s;
}
function roadArrow(x, z, yaw, type = "straight") {
  const mesh = new THREE.Mesh(
    new THREE.ShapeGeometry(arrowShape(type)),
    mat.white,
  );
  mesh.rotation.x = -Math.PI / 2;
  const g = new THREE.Group();
  g.add(mesh);
  g.position.set(x, MARK_Y + 0.015, z);
  g.rotation.y = yaw;
  scene.add(g);
}

// Sidewalks are segmented around intersections.
const zones = [];
for (const z of minorRoads) zones.push({ z, h: RES_ROAD / 2 + RES_WALK });
for (const z of signalIntersections) zones.push({ z, h: SIG_HALF + WALK });
for (const z of majorIntersections) zones.push({ z, h: ROAD_HALF + WALK });
zones.push({ z: 0, h: ROAD_HALF + WALK });
zones.sort((a, b) => a.z - b.z);
const walkX = ROAD_HALF + WALK / 2;
let prev = MAP_MIN;
for (const q of zones) {
  const end = q.z - q.h;
  if (end > prev) {
    const len = end - prev,
      cz = (end + prev) / 2;
    box(WALK, 0.35, len, mat.walk, -walkX, 0.17, cz);
    box(WALK, 0.35, len, mat.walk, walkX, 0.17, cz);
  }
  prev = Math.max(prev, q.z + q.h);
}
if (prev < MAP_MAX) {
  const len = MAP_MAX - prev,
    cz = (MAP_MAX + prev) / 2;
  box(WALK, 0.35, len, mat.walk, -walkX, 0.17, cz);
  box(WALK, 0.35, len, mat.walk, walkX, 0.17, cz);
}

// 125m residential roads. Main-road dashed dividers remain visible.
const resCX = ROAD_HALF + 60;
for (const z of minorRoads)
  for (const side of [-1, 1]) {
    box(120, 0.2, RES_ROAD, mat.road, side * resCX, ROAD_Y, z);
    box(
      120,
      0.3,
      RES_WALK,
      mat.walk,
      side * resCX,
      0.17,
      z + RES_ROAD / 2 + RES_WALK / 2,
    );
    box(
      120,
      0.3,
      RES_WALK,
      mat.walk,
      side * resCX,
      0.17,
      z - RES_ROAD / 2 - RES_WALK / 2,
    );
  }

const NX_IN = -MEDIAN / 2 - LANE / 2,
  NX_OUT = -MEDIAN / 2 - 1.5 * LANE;
const PX_IN = MEDIAN / 2 + LANE / 2,
  PX_OUT = MEDIAN / 2 + 1.5 * LANE;

function build250(z) {
  box(180, 0.2, SIG_W, mat.road, 0, ROAD_Y, z);
  lineX(-90, -ROAD_HALF, z);
  lineX(ROAD_HALF, 90, z);
  const nC = z + SIG_HALF + CROSS_EDGE,
    sC = z - SIG_HALF - CROSS_EDGE;
  const wC = -ROAD_HALF - CROSS_EDGE,
    eC = ROAD_HALF + CROSS_EDGE;
  crosswalkX(nC, ROAD_W);
  crosswalkX(sC, ROAD_W);
  crosswalkZ(wC, SIG_W, z);
  crosswalkZ(eC, SIG_W, z);
  const nS = nC + STOP_OFFSET,
    sS = sC - STOP_OFFSET,
    wS = wC - STOP_OFFSET,
    eS = eC + STOP_OFFSET;
  // Japanese left traffic: +Z uses -X, -Z uses +X, +X uses +Z, -X uses -Z.
  stopX(CARRIAGE_C, sS, CARRIAGE);
  stopX(-CARRIAGE_C, nS, CARRIAGE);
  stopZ(wS, z - LANE / 2, LANE);
  stopZ(eS, z + LANE / 2, LANE);
  roadArrow(PX_IN, sS - ARROW_GAP, Math.PI);
  roadArrow(PX_OUT, sS - ARROW_GAP, Math.PI);
  roadArrow(NX_IN, nS + ARROW_GAP, 0);
  roadArrow(NX_OUT, nS + ARROW_GAP, 0);
  roadArrow(wS - ARROW_GAP, z - LANE / 2, -Math.PI / 2);
  roadArrow(eS + ARROW_GAP, z + LANE / 2, Math.PI / 2);
}
for (const z of signalIntersections) build250(z);

function build500(z) {
  box(220, 0.2, ROAD_W, mat.major, 0, ROAD_Y, z);
  const medLen = (220 - ROAD_W) / 2,
    medCX = ROAD_HALF + medLen / 2;
  box(medLen, 0.3, MEDIAN, mat.median, -medCX, 0.25, z);
  box(medLen, 0.3, MEDIAN, mat.median, medCX, 0.25, z);
  for (const lz of [z - MEDIAN / 2 - LANE, z + MEDIAN / 2 + LANE]) {
    lineX(-110, -ROAD_HALF, lz);
    lineX(ROAD_HALF, 110, lz);
  }
  const nC = z + ROAD_HALF + CROSS_EDGE,
    sC = z - ROAD_HALF - CROSS_EDGE;
  const wC = -ROAD_HALF - CROSS_EDGE,
    eC = ROAD_HALF + CROSS_EDGE;
  crosswalkX(nC, ROAD_W);
  crosswalkX(sC, ROAD_W);
  crosswalkZ(wC, ROAD_W, z);
  crosswalkZ(eC, ROAD_W, z);
  const nS = nC + STOP_OFFSET,
    sS = sC - STOP_OFFSET,
    wS = wC - STOP_OFFSET,
    eS = eC + STOP_OFFSET;
  stopX(CARRIAGE_C, sS, CARRIAGE);
  stopX(-CARRIAGE_C, nS, CARRIAGE);
  stopZ(wS, z - CARRIAGE_C, CARRIAGE);
  stopZ(eS, z + CARRIAGE_C, CARRIAGE);

  // South approach: left / straight / right.
  roadArrow(PX_OUT, sS - ARROW_GAP, Math.PI, "left");
  roadArrow(PX_IN, sS - ARROW_GAP, Math.PI, "straight");
  roadArrow(MEDIAN / 4, sS - ARROW_GAP, Math.PI, "right");
  lineZ(MEDIAN / 2, z - ROAD_HALF - TURN_LEN, sS - 1, 0.22);
  // North approach.
  roadArrow(NX_OUT, nS + ARROW_GAP, 0, "left");
  roadArrow(NX_IN, nS + ARROW_GAP, 0, "straight");
  roadArrow(-MEDIAN / 4, nS + ARROW_GAP, 0, "right");
  lineZ(-MEDIAN / 2, nS + 1, z + ROAD_HALF + TURN_LEN, 0.22);

  const wIn = z - MEDIAN / 2 - LANE / 2,
    wOut = z - MEDIAN / 2 - 1.5 * LANE;
  const eIn = z + MEDIAN / 2 + LANE / 2,
    eOut = z + MEDIAN / 2 + 1.5 * LANE;
  roadArrow(wS - ARROW_GAP, wOut, -Math.PI / 2, "left");
  roadArrow(wS - ARROW_GAP, wIn, -Math.PI / 2, "straight");
  roadArrow(wS - ARROW_GAP, z - MEDIAN / 4, -Math.PI / 2, "right");
  lineX(-110, wS - 1, z - MEDIAN / 2, 0.22);
  roadArrow(eS + ARROW_GAP, eOut, Math.PI / 2, "left");
  roadArrow(eS + ARROW_GAP, eIn, Math.PI / 2, "straight");
  roadArrow(eS + ARROW_GAP, z + MEDIAN / 4, Math.PI / 2, "right");
  lineX(eS + 1, 110, z + MEDIAN / 2, 0.22);
}
for (const z of majorIntersections) build500(z);

// Scramble intersection.
box(220, 0.2, ROAD_W, mat.major, 0, ROAD_Y, 0);
const scN = ROAD_HALF + CROSS_EDGE,
  scS = -ROAD_HALF - CROSS_EDGE,
  scW = -ROAD_HALF - CROSS_EDGE,
  scE = ROAD_HALF + CROSS_EDGE;
crosswalkX(scN, ROAD_W);
crosswalkX(scS, ROAD_W);
crosswalkZ(scW, ROAD_W, 0);
crosswalkZ(scE, ROAD_W, 0);
function diagonalCross(yaw) {
  for (let i = 0; i < 15; i++) {
    const p = i / 14 - 0.5;
    const stripe = box(0.7, 0.035, 4, mat.white, 0, MARK_Y + 0.01, 0);
    stripe.rotation.y = yaw;
    stripe.position.x = Math.sin(yaw) * p * 32;
    stripe.position.z = Math.cos(yaw) * p * 32;
  }
}
diagonalCross(Math.PI / 4);
diagonalCross(-Math.PI / 4);
const scNS = scN + STOP_OFFSET,
  scSS = scS - STOP_OFFSET,
  scWS = scW - STOP_OFFSET,
  scES = scE + STOP_OFFSET;
stopX(CARRIAGE_C, scSS, CARRIAGE);
stopX(-CARRIAGE_C, scNS, CARRIAGE);
stopZ(scWS, -CARRIAGE_C, CARRIAGE);
stopZ(scES, CARRIAGE_C, CARRIAGE);
roadArrow(PX_IN, scSS - ARROW_GAP, Math.PI);
roadArrow(PX_OUT, scSS - ARROW_GAP, Math.PI);
roadArrow(NX_IN, scNS + ARROW_GAP, 0);
roadArrow(NX_OUT, scNS + ARROW_GAP, 0);
roadArrow(scWS - ARROW_GAP, -MEDIAN / 2 - LANE / 2, -Math.PI / 2);
roadArrow(scWS - ARROW_GAP, -MEDIAN / 2 - 1.5 * LANE, -Math.PI / 2);
roadArrow(scES + ARROW_GAP, MEDIAN / 2 + LANE / 2, Math.PI / 2);
roadArrow(scES + ARROW_GAP, MEDIAN / 2 + 1.5 * LANE, Math.PI / 2);

// Median and lane dashes. 125m junctions do not remove dashes.
function medianExcluded(z) {
  if (Math.abs(z) < 60) return true;
  if (signalIntersections.some((v) => Math.abs(z - v) < SIG_HALF + 12))
    return true;
  return majorIntersections.some((v) => Math.abs(z - v) < ROAD_HALF + TURN_LEN);
}
for (let z = MAP_MIN + 5; z < MAP_MAX; z += 10)
  if (!medianExcluded(z)) box(MEDIAN, 0.3, 10, mat.median, 0, 0.25, z);
function dashExcluded(z) {
  if (Math.abs(z) < 60) return true;
  if (signalIntersections.some((v) => Math.abs(z - v) < SIG_HALF + 4))
    return true;
  return majorIntersections.some((v) => Math.abs(z - v) < ROAD_HALF + TURN_LEN);
}
for (let z = MAP_MIN; z <= MAP_MAX; z += 20)
  if (!dashExcluded(z)) {
    box(0.18, 0.04, 8, mat.white, -(MEDIAN / 2 + LANE), MARK_Y, z);
    box(0.18, 0.04, 8, mat.white, MEDIAN / 2 + LANE, MARK_Y, z);
  }

// Right-turn asphalt openings on north/south main boulevard.
for (const z of [...majorIntersections, 0]) {
  box(
    MEDIAN,
    0.205,
    TURN_LEN,
    mat.major,
    0,
    ROAD_Y + 0.004,
    z + ROAD_HALF + TURN_LEN / 2,
  );
  box(
    MEDIAN,
    0.205,
    TURN_LEN,
    mat.major,
    0,
    ROAD_Y + 0.004,
    z - ROAD_HALF - TURN_LEN / 2,
  );
}

// Trees.
for (let z = MAP_MIN; z <= MAP_MAX; z += 70)
  if (!medianExcluded(z)) {
    const h = 4 + Math.random() * 2;
    const trunk = cylinder(
      0.25,
      0.35,
      h,
      new THREE.MeshLambertMaterial({ color: 0x6b4423 }),
    );
    trunk.position.set(0, h / 2, z);
    const leaves = new THREE.Mesh(
      new THREE.SphereGeometry(1.65, 14, 12),
      new THREE.MeshLambertMaterial({ color: 0x2f7f35 }),
    );
    leaves.position.set(0, h + 0.8, z);
    scene.add(leaves);
  }

// SIGNALS
const signalControllers = [];
function lampMaterial(color) {
  return new THREE.MeshStandardMaterial({
    color: 0x181818,
    emissive: color,
    emissiveIntensity: 0,
    roughness: 0.25,
  });
}
function hood(radius, depth) {
  const h = new THREE.Mesh(
    new THREE.CylinderGeometry(
      radius,
      radius * 1.08,
      depth,
      30,
      1,
      true,
      0,
      Math.PI,
    ),
    mat.hood,
  );
  h.rotation.x = Math.PI / 2;
  h.rotation.z = Math.PI / 2;
  return h;
}
function vehicleHead() {
  const g = new THREE.Group();
  box(3.35, 1.1, 0.48, mat.housing, 0, 0, 0, g);
  const lamps = {};
  // Japanese order when viewed from approach: green, yellow, red.
  for (const [name, x, color] of [
    ["red", -1.08, 0xff1d0d],
    ["yellow", 0, 0xffb300],
    ["green", 1.08, 0x18db79],
  ]) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.4, 0.075, 12, 28),
      mat.hood,
    );
    ring.position.set(x, 0, -0.26);
    g.add(ring);
    const l = new THREE.Mesh(
      new THREE.CylinderGeometry(0.31, 0.31, 0.13, 30),
      lampMaterial(color),
    );
    l.rotation.x = Math.PI / 2;
    l.position.set(x, 0, -0.3);
    g.add(l);
    const h = hood(0.42, 0.8);
    h.position.set(x, 0.2, -0.5);
    g.add(h);
    lamps[name] = l;
  }
  g.userData.lamps = lamps;
  return g;
}
function pedestrianTexture(color, walk) {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const x = c.getContext("2d");
  x.strokeStyle = x.fillStyle = color;
  x.lineWidth = 22;
  x.lineCap = "round";
  x.lineJoin = "round";
  x.beginPath();
  x.arc(128, 48, 22, 0, Math.PI * 2);
  x.fill();
  x.beginPath();
  if (walk) {
    x.moveTo(124, 82);
    x.lineTo(110, 146);
    x.lineTo(72, 210);
    x.moveTo(111, 146);
    x.lineTo(168, 201);
    x.moveTo(118, 103);
    x.lineTo(76, 136);
    x.moveTo(118, 103);
    x.lineTo(169, 128);
  } else {
    x.moveTo(128, 82);
    x.lineTo(128, 158);
    x.moveTo(128, 108);
    x.lineTo(86, 143);
    x.moveTo(128, 108);
    x.lineTo(170, 143);
    x.moveTo(128, 158);
    x.lineTo(96, 216);
    x.moveTo(128, 158);
    x.lineTo(160, 216);
  }
  x.stroke();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
function pedestrianHead() {
  const g = new THREE.Group();
  box(1.18, 2.2, 0.5, mat.housing, 0, 0, 0, g);
  const panels = {};
  for (const [name, y, color, walk] of [
    ["red", 0.53, 0xff301f, false],
    ["green", -0.53, 0x25df79, true],
  ]) {
    box(1.02, 0.96, 0.06, mat.hood, 0, y, -0.28, g);
    const tex = pedestrianTexture(name === "red" ? "#ff301f" : "#27e37c", walk);
    // MeshBasicMaterial keeps the pedestrian pictogram clearly visible
    // regardless of sunlight, mast rotation, or scene lighting.
    const pm = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      map: tex,
      transparent: true,
      opacity: 0.12,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });
    const p = new THREE.Mesh(new THREE.PlaneGeometry(0.74, 0.74), pm);
    p.position.set(0, y, -0.335);
    p.renderOrder = 20;
    g.add(p);
    panels[name] = p;
    const h = hood(0.5, 0.62);
    h.position.set(0, y + 0.2, -0.5);
    g.add(h);
  }
  g.userData.lamps = panels;
  return g;
}
function signMesh(text) {
  const c = document.createElement("canvas");
  c.width = 1400;
  c.height = 260;
  const x = c.getContext("2d");
  x.fillStyle = "#faf8ef";
  x.fillRect(0, 0, c.width, c.height);
  x.strokeStyle = "#2475b6";
  x.lineWidth = 22;
  x.strokeRect(11, 11, c.width - 22, c.height - 22);
  x.fillStyle = "#176eac";
  x.font = 'bold 118px "Noto Sans JP", "Yu Gothic", sans-serif';
  x.textAlign = "center";
  x.textBaseline = "middle";
  x.fillText(text, c.width / 2, c.height / 2 + 4);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return new THREE.Mesh(
    new THREE.PlaneGeometry(7.0, 1.3),
    new THREE.MeshBasicMaterial({ map: t, side: THREE.DoubleSide }),
  );
}
function mast(x, z, yaw, armLen, scramble) {
  const g = new THREE.Group();
  const poleH = 7.35,
    vehH = 6.5,
    pedH = 3.55,
    a = Math.min(armLen, 7.3);
  const pole = cylinder(0.16, 0.22, poleH, mat.pole, g, 20);
  pole.position.y = poleH / 2;
  const clamp = cylinder(0.25, 0.25, 0.38, mat.housing, g, 20);
  clamp.position.y = vehH + 0.23;
  const arm = cylinder(0.12, 0.12, a, mat.pole, g, 18);
  arm.rotation.z = Math.PI / 2;
  arm.position.set(a / 2, vehH + 0.23, 0);
  const vh = vehicleHead();
  vh.position.set(a - 1.68, vehH, 0);
  g.add(vh);
  for (const dy of [-0.72, 0.72]) {
    const b = cylinder(0.065, 0.065, 0.82, mat.pole, g, 12);
    b.rotation.z = Math.PI / 2;
    b.position.set(0.41, pedH + dy, 0);
  }
  const ph = pedestrianHead();
  ph.position.set(0.86, pedH, 0);
  g.add(ph);
  if (scramble) {
    const sign = signMesh(
      "\u30b9\u30af\u30e9\u30f3\u30d6\u30eb\u4ea4\u5dee\u70b9",
    );
    sign.position.set(a - 1.68, vehH + 1.22, -0.28);
    g.add(sign);
  }
  g.position.set(x, 0, z);
  g.rotation.y = yaw;
  scene.add(g);
  return { vh, ph };
}
function installSignals(z, kind) {
  const crossHalf = kind === "250" ? SIG_HALF : ROAD_HALF;
  const ox = ROAD_HALF + WALK + 0.8,
    oz = crossHalf + WALK + 0.8;
  const nsArm = CARRIAGE + WALK + 2,
    ewArm = (kind === "250" ? SIG_HALF : CARRIAGE) + WALK + 2;
  const scr = kind === "scramble";
  const south = mast(-ox, z - oz, 0, nsArm, scr);
  const north = mast(ox, z + oz, Math.PI, nsArm, scr);
  const west = mast(-ox, z + oz, Math.PI / 2, ewArm, scr);
  const east = mast(ox, z - oz, -Math.PI / 2, ewArm, scr);
  signalControllers.push({
    kind,
    nsV: [south.vh, north.vh],
    ewV: [west.vh, east.vh],
    nsP: [west.ph, east.ph],
    ewP: [south.ph, north.ph],
  });
}
for (const z of signalIntersections) installSignals(z, "250");
for (const z of majorIntersections) installSignals(z, "500");
installSignals(0, "scramble");
function setVeh(h, state) {
  for (const k of ["red", "yellow", "green"])
    h.userData.lamps[k].material.emissiveIntensity = k === state ? 4.2 : 0;
}
function setPed(h, state, blink) {
  const greenVisible =
    state === "green" &&
    (!blink || Math.floor(performance.now() / 420) % 2 === 0);

  // The unlit pictogram remains faintly visible, while the active one
  // becomes fully bright. This directly controls the rendered panel.
  h.userData.lamps.red.material.opacity = state === "red" ? 1 : 0.1;
  h.userData.lamps.green.material.opacity = greenVisible ? 1 : 0.1;
}
function updateSignals(t) {
  for (const c of signalControllers) {
    const phases =
      c.kind === "250"
        ? [
            [32, "nsG"],
            [4, "nsY"],
            [3, "all"],
            [18, "ewG"],
            [4, "ewY"],
            [3, "all"],
          ]
        : c.kind === "500"
          ? [
              [25, "nsG"],
              [4, "nsY"],
              [3, "all"],
              [25, "ewG"],
              [4, "ewY"],
              [3, "all"],
            ]
          : [
              [18, "nsG"],
              [4, "nsY"],
              [3, "all"],
              [18, "ewG"],
              [4, "ewY"],
              [3, "all"],
              [28, "ped"],
              [5, "blink"],
              [3, "all"],
            ];
    const cycle = phases.reduce((a, p) => a + p[0], 0);
    let q = t % cycle,
      state = "all";
    for (const [d, n] of phases) {
      if (q < d) {
        state = n;
        break;
      }
      q -= d;
    }
    for (const h of c.nsV)
      setVeh(h, state === "nsG" ? "green" : state === "nsY" ? "yellow" : "red");
    for (const h of c.ewV)
      setVeh(h, state === "ewG" ? "green" : state === "ewY" ? "yellow" : "red");
    const allPed = state === "ped" || state === "blink";
    for (const h of c.nsP)
      setPed(
        h,
        allPed || (c.kind !== "scramble" && state === "ewG") ? "green" : "red",
        state === "blink",
      );
    for (const h of c.ewP)
      setPed(
        h,
        allPed || (c.kind !== "scramble" && state === "nsG") ? "green" : "red",
        state === "blink",
      );
  }
}

// Crown-style sedan.
let car,
  speed = 0,
  steer = 0,
  last = performance.now();
let tails = [],
  reverses = [],
  reverseSpots = [],
  wheels = [];
const keys = Object.create(null);
function carMat(color, opts = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: opts.roughness ?? 0.38,
    metalness: opts.metalness ?? 0.22,
    transparent: opts.transparent ?? false,
    opacity: opts.opacity ?? 1,
    emissive: opts.emissive ?? 0,
    emissiveIntensity: opts.emissiveIntensity ?? 0,
  });
}
function carBox(parent, size, pos, material, rot = [0, 0, 0]) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
  m.position.set(...pos);
  m.rotation.set(...rot);
  parent.add(m);
  return m;
}
function makeCar() {
  car = new THREE.Group();
  const body = carMat(0xe4e4df, { metalness: 0.32, roughness: 0.3 }),
    trim = carMat(0x4b5151),
    chrome = carMat(0xc3c7c6, { metalness: 0.78 }),
    dark = carMat(0x171a1a),
    glass = carMat(0x273640, { transparent: true, opacity: 0.76 });
  carBox(car, [4, 0.64, 10.9], [0, 0.88, 0], body);
  carBox(car, [3.92, 0.36, 10.55], [0, 0.52, 0], trim);
  carBox(car, [3.84, 0.34, 3.5], [0, 1.28, 3.62], body);
  carBox(car, [3.84, 0.42, 2.6], [0, 1.19, -4.02], body);
  carBox(car, [3.18, 0.14, 3.65], [0, 2.52, -0.3], body);
  carBox(car, [3.02, 0.78, 0.08], [0, 1.98, 1.56], glass, [-0.58, 0, 0]);
  carBox(car, [3.02, 0.74, 0.08], [0, 1.95, -2.15], glass, [0.52, 0, 0]);
  for (const side of [-1, 1]) {
    carBox(car, [0.07, 0.82, 1.5], [side * 1.59, 2.14, 0.72], glass);
    carBox(car, [0.07, 0.82, 1.48], [side * 1.59, 2.14, -1.08], glass);
    carBox(car, [0.08, 0.14, 8.8], [side * 2.02, 0.88, -0.1], trim);
    carBox(car, [0.42, 0.3, 0.55], [side * 1.95, 1.82, 1.48], body);
  }
  carBox(car, [2.25, 0.52, 0.1], [0, 1.02, 5.39], dark);
  for (let x = -1; x <= 1.01; x += 0.2)
    carBox(car, [0.035, 0.42, 0.03], [x, 1.02, 5.46], chrome);
  for (const side of [-1, 1])
    carBox(
      car,
      [0.92, 0.42, 0.1],
      [side * 1.43, 1.03, 5.4],
      carMat(0xf5f1d8, { emissive: 0x332f1d, emissiveIntensity: 0.45 }),
    );
  carBox(car, [4.18, 0.32, 0.42], [0, 0.48, 5.33], chrome);
  carBox(car, [4.18, 0.34, 0.43], [0, 0.42, -5.35], chrome);
  for (const side of [-1, 1]) {
    const x = side * 1.18;
    carBox(car, [1.58, 0.48, 0.12], [x, 0.96, -5.47], dark);
    carBox(
      car,
      [0.36, 0.34, 0.07],
      [x + side * 0.53, 0.96, -5.55],
      carMat(0x8a3c02),
    );
    tails.push(
      carBox(
        car,
        [0.72, 0.34, 0.07],
        [x, 0.96, -5.55],
        carMat(0x5a0000, { emissive: 0x220000, emissiveIntensity: 0.55 }),
      ),
    );
    reverses.push(
      carBox(
        car,
        [0.3, 0.3, 0.07],
        [x - side * 0.51, 0.96, -5.55],
        carMat(0xb8bcb8),
      ),
    );
  }
  for (const side of [-1, 1])
    for (const az of [3.45, -3.35]) {
      const w = new THREE.Group();
      const tire = cylinder(0.82, 0.82, 0.5, carMat(0x111111), w, 32);
      tire.rotation.z = Math.PI / 2;
      const rim = cylinder(0.56, 0.56, 0.53, chrome, w, 28);
      rim.rotation.z = Math.PI / 2;
      w.position.set(side * 1.9, 0.82, az);
      car.add(w);
      wheels.push(w);
    }
  scene.add(car);
  car.position.set(PX_OUT, 0, -90);
  car.rotation.y = 0;
}
makeCar();
function updateCarLights() {
  const braking = (keys.s || keys.arrowdown) && speed > 0.5,
    reversing = speed < -0.5;
  for (const l of tails) {
    l.material.color.set(braking ? 0xff180d : 0x640000);
    l.material.emissive.set(braking ? 0xff0900 : 0x260000);
    l.material.emissiveIntensity = braking ? 3.2 : 0.6;
  }
  for (const l of reverses) {
    l.material.color.set(reversing ? 0xffffff : 0xb8bcb8);
    l.material.emissive.set(reversing ? 0xffffff : 0);
    l.material.emissiveIntensity = reversing ? 2.8 : 0;
  }
}

const speedometer = document.getElementById("speedometer"),
  tachometer = document.getElementById("tachometer");
addEventListener("keydown", (e) => {
  const k = e.key.toLowerCase();
  if (
    [
      "w",
      "a",
      "s",
      "d",
      "arrowup",
      "arrowdown",
      "arrowleft",
      "arrowright",
    ].includes(k)
  )
    e.preventDefault();
  keys[k] = true;
});
addEventListener("keyup", (e) => (keys[e.key.toLowerCase()] = false));
document.getElementById("playBtn")?.addEventListener("click", () => {
  document.getElementById("menu")?.style.setProperty("display", "none");
  document.getElementById("hud")?.style.setProperty("display", "block");
  renderer.domElement.style.display = "block";
});
addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
function updateCar(dt) {
  const up = keys.w || keys.arrowup,
    down = keys.s || keys.arrowdown,
    left = keys.a || keys.arrowleft,
    right = keys.d || keys.arrowright;
  if (up) speed += speed < 70 ? 18 * dt : speed < 100 ? 9 * dt : 7.2 * dt;
  if (down) speed -= speed > 1 ? 30 * dt : 15 * dt;
  if (!up && !down) {
    const d = 3.6 * dt;
    speed = Math.abs(speed) <= d ? 0 : speed - Math.sign(speed) * d;
  }
  speed = THREE.MathUtils.clamp(speed, -35, 160);
  steer = THREE.MathUtils.lerp(
    steer,
    (left ? 1 : 0) - (right ? 1 : 0),
    1 - Math.exp(-10 * dt),
  );
  if (Math.abs(speed) > 0.4)
    car.rotation.y +=
      steer *
      (speed >= 0 ? 1 : -1) *
      THREE.MathUtils.lerp(0.75, 0.3, Math.min(Math.abs(speed) / 160, 1)) *
      dt;
  const move = speed * dt * 0.42;
  car.position.x += Math.sin(car.rotation.y) * move;
  car.position.z += Math.cos(car.rotation.y) * move;
  for (const w of wheels) w.rotation.x += move / 0.82;
}
const camPos = new THREE.Vector3(),
  camTarget = new THREE.Vector3();
function updateCamera(dt) {
  const fx = Math.sin(car.rotation.y),
    fz = Math.cos(car.rotation.y);
  camPos.set(
    car.position.x - fx * 16,
    car.position.y + 6.2,
    car.position.z - fz * 16,
  );
  camera.position.lerp(camPos, 1 - Math.exp(-7.5 * dt));
  camTarget.set(
    car.position.x + fx * 4.5,
    car.position.y + 1.15,
    car.position.z + fz * 4.5,
  );
  camera.lookAt(camTarget);
}
function animate(now = performance.now()) {
  requestAnimationFrame(animate);
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;
  updateCar(dt);
  updateCarLights();
  updateSignals(now / 1000);
  updateCamera(dt);
  if (speedometer)
    speedometer.textContent = `${Math.round(Math.abs(speed))} km/h`;
  if (tachometer)
    tachometer.textContent = `${Math.round(700 + Math.abs(speed) * 40)} RPM`;
  renderer.render(scene, camera);
}
animate();
