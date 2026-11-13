// KDPT body focus picker: a sculpted 3D figure whose muscle groups can be tapped,
// spun with a slider or by dragging. Loaded only by /enquire.html.
// three.js r160 (MIT licence, see /vendor/three-LICENSE.txt).
import * as THREE from "./vendor/three.module.min.js";

const COL = {
  base:  new THREE.Color("#3a4942"),
  idle:  new THREE.Color("#4b5e53"),
  hover: new THREE.Color("#6a8f78"),
  all:   new THREE.Color("#4f8666"),
  on:    new THREE.Color("#7ED597"),
};
const GROUPS = ["Shoulders", "Chest", "Arms", "Core", "Back", "Glutes", "Legs"];
const wrap = d => ((((d + 180) % 360) + 360) % 360) - 180;
const ss = (a, b, v) => { const t = Math.min(1, Math.max(0, (v - a) / (b - a))); return t * t * (3 - 2 * t); };
const band = (v, a, b, e = 0.014) => ss(a - e, a + e, v) * (1 - ss(b - e, b + e, v));
const bump = (dx, dy, sx, sy) => Math.exp(-((dx * dx) / (sx * sx) + (dy * dy) / (sy * sy)));
const V = (x, y, z) => new THREE.Vector3(x, y, z);

// Smooth surface of revolution from a [radius, height] profile. Returns the geometry and its grid size.
function lathe(pts, segs = 48, radial = 40) {
  const curve = new THREE.SplineCurve(pts.map(([r, y]) => new THREE.Vector2(r, y)));
  const p = curve.getPoints(segs).map(v => new THREE.Vector2(Math.max(0.0005, v.x), v.y));
  p[0].x = 0; p[p.length - 1].x = 0;
  const g = new THREE.LatheGeometry(p, radial);
  g.userData.grid = { P: p.length, R: radial };
  return g;
}
// Recompute normals after sculpting, then close the lathe's seam and poles so no crease shows.
function smoothNormals(geo) {
  const { P, R } = geo.userData.grid;
  geo.computeVertexNormals();
  const n = geo.attributes.normal, a = new THREE.Vector3(), b = new THREE.Vector3();
  for (let j = 0; j < P; j++) {
    a.fromBufferAttribute(n, j).add(b.fromBufferAttribute(n, R * P + j)).normalize();
    n.setXYZ(j, a.x, a.y, a.z); n.setXYZ(R * P + j, a.x, a.y, a.z);
  }
  for (const j of [0, P - 1]) {
    a.set(0, 0, 0);
    for (let i = 0; i <= R; i++) a.add(b.fromBufferAttribute(n, i * P + j));
    a.normalize();
    for (let i = 0; i <= R; i++) n.setXYZ(i * P + j, a.x, a.y, a.z);
  }
  n.needsUpdate = true;
}
// Tapered limb along local +Y (0..len), local +Z facing forward. `muscles` swell the surface:
// { t: position along the limb 0..1, st: spread, a: angle (0 front, PI back), sa: angular spread, k: amount }
function limbGeo(len, radii, muscles = [], sx = 1, sz = 1) {
  const n = radii.length, r0 = radii[0], rn = radii[n - 1];
  const pts = [[0, -r0 * 0.6], [r0 * 0.78, -r0 * 0.32]];
  radii.forEach((r, i) => pts.push([r, (len * i) / (n - 1)]));
  pts.push([rn * 0.78, len + rn * 0.32], [0, len + rn * 0.6]);
  const g = lathe(pts, 72, 40);
  const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i), t = y / len, th = Math.atan2(x, z);
    let f = 1;
    muscles.forEach(m => {
      let d = Math.abs(th - m.a); if (d > Math.PI) d = 2 * Math.PI - d;
      f += m.k * Math.exp(-(((t - m.t) / m.st) ** 2)) * Math.exp(-((d / m.sa) ** 2));
    });
    pos.setXYZ(i, x * f * sx, y, z * f * sz);
  }
  smoothNormals(g);
  return g;
}

function radialTexture(stops, size = 256) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d");
  const gr = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  stops.forEach(([o, col]) => gr.addColorStop(o, col));
  g.fillStyle = gr;
  g.fillRect(0, 0, size, size);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
// Turntable ring with tick marks and a mint marker at the front.
function ringTexture() {
  const s = 512, c = document.createElement("canvas");
  c.width = c.height = s;
  const g = c.getContext("2d");
  g.translate(s / 2, s / 2);
  for (let i = 0; i < 72; i++) {
    const a = (i / 72) * Math.PI * 2, major = i % 18 === 0;
    g.strokeStyle = major ? "rgba(126,213,151,0.75)" : "rgba(242,244,239,0.22)";
    g.lineWidth = major ? 4 : 2;
    const r1 = major ? 214 : 226, r2 = 244;
    g.beginPath();
    g.moveTo(Math.sin(a) * r1, Math.cos(a) * r1);
    g.lineTo(Math.sin(a) * r2, Math.cos(a) * r2);
    g.stroke();
  }
  g.strokeStyle = "rgba(126,213,151,0.35)";
  g.lineWidth = 2;
  g.beginPath(); g.arc(0, 0, 250, 0, Math.PI * 2); g.stroke();
  // front marker (canvas bottom faces the viewer once the plane is laid flat)
  g.fillStyle = "#7ED597";
  g.beginPath(); g.moveTo(0, 200); g.lineTo(-12, 180); g.lineTo(12, 180); g.closePath(); g.fill();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

// Torso: one sculpted surface. Each vertex records which muscle group it belongs to (and how strongly),
// so groups can light up and lift out of the skin without separate shapes glued on.
function buildTorso() {
  const geo = lathe([[0, 0.86], [0.085, 0.872], [0.145, 0.915], [0.158, 0.97], [0.152, 1.03], [0.146, 1.09],
                     [0.155, 1.17], [0.178, 1.26], [0.194, 1.33], [0.19, 1.40], [0.14, 1.462], [0.06, 1.497], [0, 1.502]], 160, 128);
  geo.scale(1, 1, 0.6);
  const pos = geo.attributes.position, count = pos.count;
  const NG = GROUPS.length, weights = new Float32Array(count * NG), region = new Int8Array(count).fill(-1), weight = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const r = Math.hypot(x, z / 0.6) || 1e-6, nz = z / (0.6 * r), ax = Math.abs(x);
    const front = ss(0.1, 0.42, nz), back = ss(0.1, 0.42, -nz);
    // relief
    let d = 0;
    d += 0.017 * front * bump(ax - 0.074, y - 1.323, 0.06, 0.042);                    // pecs
    d -= 0.005 * front * bump(0, y - 1.262, 1, 0.011) * (1 - ss(0.1, 0.16, ax));       // under the pecs
    [1.205, 1.148, 1.091].forEach(yy => { d += 0.0065 * front * bump(ax - 0.031, y - yy, 0.021, 0.02); }); // abs
    d -= 0.004 * front * bump(x, 0, 0.007, 1) * band(y, 1.02, 1.28);                  // centre line
    d += 0.006 * ss(-0.3, 0.2, nz) * (1 - front * 0.5) * bump(ax - 0.12, y - 1.115, 0.035, 0.06); // obliques
    d += 0.014 * back * bump(ax - 0.104, y - 1.24, 0.06, 0.09);                        // lats
    d += 0.011 * back * bump(x, y - 1.435, 0.09, 0.04);                                // traps
    d += 0.006 * back * bump(ax - 0.028, y - 1.085, 0.016, 0.07);                      // lower back
    d -= 0.005 * back * bump(x, 0, 0.008, 1) * band(y, 0.98, 1.44);                   // spine
    d += 0.038 * back * bump(ax - 0.07, y - 0.948, 0.062, 0.06);                       // glutes
    const k = 1 + d / r;
    pos.setXYZ(i, x * k, y, z * k);
    // muscle group membership
    const chest = front * (1 - ss(0.62, 1.2, ((ax - 0.075) / 0.094) ** 2 + ((y - 1.322) / 0.068) ** 2));
    const core = Math.max(front * band(y, 0.99, 1.3, 0.02), ss(-0.3, 0.05, nz) * band(y, 1.03, 1.21, 0.02)) * (1 - chest);
    const backW = Math.max(back * band(y, 0.965, 1.47, 0.02), ss(0.15, -0.1, nz) * band(y, 1.16, 1.36, 0.02));
    const glutes = back * (1 - ss(0.6, 1.25, ((ax - 0.07) / 0.088) ** 2 + ((y - 0.948) / 0.078) ** 2));
    const ws = [0, chest, 0, core, backW * (1 - glutes), glutes, 0];
    const sum = ws.reduce((a, b) => a + b, 0), norm = sum > 1 ? 1 / sum : 1;
    let best = -1, bw = 0.02;
    ws.forEach((w, gi) => { weights[i * NG + gi] = w * norm; if (w > bw) { bw = w; best = gi; } });
    region[i] = best; weight[i] = best < 0 ? 0 : bw;
  }
  smoothNormals(geo);
  geo.computeBoundingSphere();
  const colors = new Float32Array(count * 3);
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  return { geo, region, weight, weights, rest: Float32Array.from(pos.array), normals: Float32Array.from(geo.attributes.normal.array) };
}

function buildFigure() {
  const body = new THREE.Group();
  const G = {};
  const baseMat = new THREE.MeshStandardMaterial({ color: COL.base, roughness: 0.5, metalness: 0.12 });
  GROUPS.forEach(name => {
    const mat = new THREE.MeshStandardMaterial({ color: COL.all.clone(), roughness: 0.42, metalness: 0.1 });
    G[name] = { name, mat, meshes: [], on: false, all: true, hover: false, popAt: -1e9, target: COL.all, lift: 0 };
  });
  const sphere = new THREE.SphereGeometry(1, 48, 32);
  const add = (geo, group, pop = "xyz") => {
    const m = new THREE.Mesh(geo, group ? G[group].mat : baseMat);
    body.add(m);
    if (group) { m.userData.group = group; m.userData.pop = pop; G[group].meshes.push(m); }
    return m;
  };
  // Point a limb from joint a to joint b, keeping its local +Z facing the front of the body.
  const limb = (group, a, b, radii, muscles, sx, sz) => {
    const m = add(limbGeo(a.distanceTo(b), radii, muscles, sx, sz), group, "xz");
    const y = b.clone().sub(a).normalize();
    const z = V(0, 0, 1).sub(y.clone().multiplyScalar(y.z)).normalize();
    m.position.copy(a);
    m.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(V().crossVectors(y, z), y, z));
    return m;
  };

  const torso = buildTorso();
  const torsoMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.45, metalness: 0.1 });
  const torsoMesh = new THREE.Mesh(torso.geo, torsoMat);
  torsoMesh.userData.torso = torso;
  body.add(torsoMesh);

  limb(null, V(0, 1.455, 0), V(0, 1.585, 0.008), [0.052, 0.047, 0.046]);
  const head = lathe([[0, 1.545], [0.045, 1.55], [0.072, 1.585], [0.09, 1.635], [0.095, 1.675], [0.088, 1.72], [0.062, 1.758], [0, 1.772]], 48, 48);
  head.scale(1, 1, 1.1); head.translate(0, 0, 0.012); smoothNormals(head);
  add(head);

  const PI = Math.PI;
  [1, -1].forEach(s => {
    const out = -PI / 2 * s, inn = PI / 2 * s;  // local angle of the outer / inner side of a limb
    // Arms
    const S = V(0.218 * s, 1.412, 0), E = V(0.258 * s, 1.13, -0.015), W = V(0.283 * s, 0.875, 0.02), H = V(0.295 * s, 0.725, 0.03);
    limb("Arms", S, E, [0.05, 0.052, 0.049, 0.043, 0.039], [
      { t: 0.55, st: 0.24, a: 0, sa: 0.9, k: 0.2 },       // biceps
      { t: 0.38, st: 0.28, a: PI, sa: 1.0, k: 0.17 },     // triceps
    ]);
    limb("Arms", E, W, [0.042, 0.046, 0.042, 0.033, 0.027], [
      { t: 0.22, st: 0.22, a: out * 0.6, sa: 1.0, k: 0.14 },  // forearm
    ]);
    limb(null, W, H, [0.028, 0.036, 0.038, 0.03, 0.016], [], 0.55, 1);   // hand
    const delt = add(sphere, "Shoulders");
    delt.position.copy(S).add(V(0.002 * s, -0.022, 0)); delt.scale.set(0.064, 0.088, 0.068); delt.rotation.z = 0.14 * s;
    // Legs
    const Hp = V(0.093 * s, 0.93, 0), K = V(0.1 * s, 0.5, 0.012), A = V(0.102 * s, 0.085, -0.012);
    limb("Legs", Hp, K, [0.082, 0.085, 0.078, 0.068, 0.058, 0.051, 0.048], [
      { t: 0.42, st: 0.3, a: 0, sa: 1.0, k: 0.13 },         // quads
      { t: 0.8, st: 0.12, a: inn * 0.55, sa: 0.7, k: 0.14 }, // teardrop above the knee
      { t: 0.45, st: 0.3, a: PI, sa: 1.0, k: 0.09 },        // hamstrings
      { t: 0.3, st: 0.25, a: out, sa: 0.8, k: 0.06 },       // outer quad
    ]);
    limb("Legs", K, A, [0.048, 0.052, 0.052, 0.045, 0.036, 0.03, 0.028], [
      { t: 0.3, st: 0.2, a: PI, sa: 1.2, k: 0.3 },          // calf
      { t: 0.28, st: 0.18, a: inn * 0.8, sa: 0.8, k: 0.12 },
    ]);
    const foot = add(sphere); foot.position.set(0.105 * s, 0.036, 0.045); foot.scale.set(0.043, 0.035, 0.106);
  });
  body.traverse(m => { if (m.isMesh) m.userData.base = m.scale.clone(); });
  return { body, G, torsoMesh };
}

export function createBody({ reduceMotion = false } = {}) {
  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "low-power" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(27, 1, 0.1, 50);
  const look = V(0, 0.86, 0);
  camera.position.set(0, 1.0, 3.95);
  camera.lookAt(look);

  scene.add(new THREE.HemisphereLight("#e6efe9", "#0b0f0d", 0.6));
  const key = new THREE.DirectionalLight("#ffffff", 1.9); key.position.set(2.2, 3.2, 4); scene.add(key);
  const fill = new THREE.DirectionalLight("#cfe3d6", 0.5); fill.position.set(-3, 1, 2.5); scene.add(fill);
  const rimL = new THREE.DirectionalLight("#7ED597", 2.6); rimL.position.set(-3, 2.2, -3); scene.add(rimL);
  const rimR = new THREE.DirectionalLight("#7ED597", 1.6); rimR.position.set(3, 1.4, -3); scene.add(rimR);

  // Floor: glow, contact shadow, and a turntable that spins with the figure
  const flat = (size, map, opts = {}) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size), new THREE.MeshBasicMaterial({ map, transparent: true, depthWrite: false, ...opts }));
    m.rotation.x = -Math.PI / 2;
    return m;
  };
  const glow = flat(1.9, radialTexture([[0, "rgba(126,213,151,0.28)"], [0.45, "rgba(126,213,151,0.07)"], [1, "rgba(126,213,151,0)"]]), { blending: THREE.AdditiveBlending });
  glow.position.y = 0.001; scene.add(glow);
  const shadow = flat(0.8, radialTexture([[0, "rgba(0,0,0,0.8)"], [0.55, "rgba(0,0,0,0.35)"], [1, "rgba(0,0,0,0)"]]));
  shadow.scale.set(1, 0.7, 1); shadow.position.y = 0.003; scene.add(shadow);

  const root = new THREE.Group();
  scene.add(root);
  const ring = flat(1.12, ringTexture());
  ring.position.y = 0.002; root.add(ring);
  const { body, G, torsoMesh } = buildFigure();
  root.add(body);
  const T = torsoMesh.userData.torso, groupList = GROUPS.map(n => G[n]);

  let cur = 0, tgt = 0, last = 0, running = false, intro = reduceMotion ? 1 : 0, lastEmit = null;
  let px = 0, py = 0, down = null, hovered = null, torsoKey = "";

  const api = {
    canvas, onPick: null, onAngle: null,
    pickAt: (clientX, clientY) => groupAt({ clientX, clientY }),
    get angle() { return tgt; },
    setAngle(d) { tgt = wrap(d); },
    turnTo(side) { tgt = side === "back" ? (cur < 0 ? -180 : 180) : 0; },
    setFocus(list) {
      const all = list.length === 0, now = performance.now();
      groupList.forEach(g => {
        const on = list.includes(g.name);
        if ((on && !g.on) || (all && !g.all)) g.popAt = now;
        g.on = on; g.all = all; refresh(g);
      });
    },
    mount(el, angle = 0) {
      cur = tgt = wrap(angle);
      el.appendChild(canvas);
      ro.disconnect(); ro.observe(el);
      io.disconnect(); io.observe(el);
      resize(); start();
    },
  };

  function refresh(g) { g.target = g.on ? COL.on : g.hover ? COL.hover : g.all ? COL.all : COL.idle; }
  function setHover(name) {
    if (hovered === name) return;
    if (hovered) { G[hovered].hover = false; refresh(G[hovered]); }
    hovered = name;
    if (name) { G[name].hover = true; refresh(G[name]); }
  }

  // Which group sits under a pointer position.
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  function groupAt(e) {
    const r = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObject(body, true)[0];
    if (!hit) return null;
    if (hit.object.userData.group) return hit.object.userData.group;
    if (hit.object !== torsoMesh || !hit.face) return null;
    let best = -1, bw = 0.3;
    [hit.face.a, hit.face.b, hit.face.c].forEach(i => { if (T.weight[i] > bw) { bw = T.weight[i]; best = T.region[i]; } });
    return best < 0 ? null : GROUPS[best];
  }

  canvas.addEventListener("pointerdown", e => { down = { x: e.clientX, a: tgt, moved: false }; });
  canvas.addEventListener("pointermove", e => {
    const r = canvas.getBoundingClientRect();
    px = ((e.clientX - r.left) / r.width) * 2 - 1;
    py = ((e.clientY - r.top) / r.height) * 2 - 1;
    if (down) {
      const dx = e.clientX - down.x;
      if (!down.moved && Math.abs(dx) > 6) {
        down.moved = true;
        try { canvas.setPointerCapture(e.pointerId); } catch (_) {}
        canvas.classList.add("drag"); setHover(null);
      }
      if (down.moved) tgt = wrap(down.a + dx * 0.6);
      return;
    }
    if (e.pointerType === "mouse") {
      const g = groupAt(e);
      setHover(g);
      canvas.style.cursor = g ? "pointer" : "grab";
    }
  });
  const end = e => {
    if (down && !down.moved && e.type === "pointerup") {
      const g = groupAt(e);
      if (g && api.onPick) api.onPick(g);
    }
    down = null; canvas.classList.remove("drag");
  };
  canvas.addEventListener("pointerup", end);
  canvas.addEventListener("pointercancel", end);
  canvas.addEventListener("pointerleave", () => { if (!down) { setHover(null); px = py = 0; } });

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(resize);
  let visible = true;
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) start(); });

  // Paint the torso's muscle areas in their group colours and lift selected / popping areas off the body.
  function updateTorso() {
    const key = groupList.map(g => g.mat.color.getHexString() + g.lift.toFixed(4)).join("");
    if (key === torsoKey) return;
    torsoKey = key;
    const pos = T.geo.attributes.position, col = T.geo.attributes.color, b = COL.base, NG = groupList.length;
    for (let i = 0; i < pos.count; i++) {
      let r = b.r, g = b.g, bl = b.b, l = 0;
      for (let gi = 0; gi < NG; gi++) {
        const w = T.weights[i * NG + gi];
        if (!w) continue;
        const grp = groupList[gi], c = grp.mat.color;
        r += (c.r - b.r) * w; g += (c.g - b.g) * w; bl += (c.b - b.b) * w; l += grp.lift * w;
      }
      col.setXYZ(i, r, g, bl);
      const i3 = i * 3;
      pos.setXYZ(i, T.rest[i3] + T.normals[i3] * l, T.rest[i3 + 1] + T.normals[i3 + 1] * l, T.rest[i3 + 2] + T.normals[i3 + 2] * l);
    }
    col.needsUpdate = true; pos.needsUpdate = true;
  }

  function start() {
    if (running) return;
    running = true; last = performance.now();
    requestAnimationFrame(frame);
  }
  function frame(now) {
    if (!canvas.isConnected || !visible) { running = false; return; }
    const dt = Math.min(0.05, (now - last) / 1000); last = now;

    const d = wrap(tgt - cur);
    cur = Math.abs(d) < 0.05 ? tgt : wrap(cur + d * Math.min(1, dt * 9));
    if (intro < 1) intro = Math.min(1, intro + dt / 1.3);
    const e = 1 - Math.pow(1 - intro, 3);
    root.rotation.y = THREE.MathUtils.degToRad(cur) - (1 - e) * Math.PI * 1.5;
    root.position.y = (e - 1) * 0.22 + (reduceMotion ? 0 : Math.sin(now / 950) * 0.007);
    root.scale.setScalar(0.88 + 0.12 * e);

    if (!reduceMotion) {
      const k = Math.min(1, dt * 4);
      camera.position.x += (px * 0.28 - camera.position.x) * k;
      camera.position.y += (1.0 - py * 0.12 - camera.position.y) * k;
      camera.lookAt(look);
    }

    const ck = Math.min(1, dt * 10);
    groupList.forEach(g => {
      const c = g.mat.color;
      c.lerp(g.target, ck);
      if (Math.abs(c.r - g.target.r) + Math.abs(c.g - g.target.g) + Math.abs(c.b - g.target.b) < 0.002) c.copy(g.target);
      const t = (now - g.popAt) / 450;
      const popping = t >= 0 && t < 1 && !reduceMotion;
      const pop = popping ? Math.sin(Math.PI * t) : 0;
      g.lift = pop * 0.014 + (g.on ? 0.004 : 0);
      const k = (1 + 0.16 * pop) * (g.on ? 1.04 : 1);
      g.meshes.forEach(m => {
        const b = m.userData.base;
        if (m.userData.pop === "xz") m.scale.set(b.x * k, b.y, b.z * k);
        else m.scale.set(b.x * k, b.y * k, b.z * k);
      });
    });
    updateTorso();

    if (api.onAngle && cur !== lastEmit) { lastEmit = cur; api.onAngle(cur); }
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }

  return api;
}
