// 3D home hero: a clay-style beaver swimming in a moving river in front of his dam.
// Tap the beaver: he jumps and splashes. Falls back to the SVG drawing when WebGL is missing.
import * as THREE from "./vendor/three.module.min.js";

const host = document.getElementById("hero3d");
const svg = document.querySelector(".hero .dam");
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

function webglOK() {
  try { const c = document.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")); }
  catch (e) { return false; }
}

if (host && webglOK()) {
  try { start(); } catch (e) { host.remove(); if (svg) svg.style.display = ""; }
}

function start() {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  host.appendChild(renderer.domElement);
  if (svg) svg.style.display = "none";
  const tip = document.createElement("p"); tip.className = "tap-tip"; tip.textContent = "👆 اضغطوا على القندس ليقفز!"; host.after(tip);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 2, 0.1, 100);
  camera.position.set(0, 2.7, 8.6);
  camera.lookAt(0, 0.7, 0);

  scene.add(new THREE.HemisphereLight(0xfff6e6, 0x2b6f78, 1.15));
  const sun = new THREE.DirectionalLight(0xffffff, 1.5);
  sun.position.set(-4, 7, 6);
  scene.add(sun);

  const clay = (color, rough = 0.85) => new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: 0 });

  /* ---- river ---- */
  const waterGeo = new THREE.PlaneGeometry(26, 12, 90, 44);
  waterGeo.rotateX(-Math.PI / 2);
  const water = new THREE.Mesh(waterGeo, new THREE.MeshStandardMaterial({ color: 0x1f8a96, roughness: 0.35, metalness: 0.05, flatShading: true }));
  water.position.z = 1;
  scene.add(water);
  const wpos = waterGeo.attributes.position;
  const wbase = Float32Array.from(wpos.array);
  const waveH = (x, z, t) => Math.sin(x * 0.9 + t * 1.6) * 0.09 + Math.sin(z * 1.3 - t * 1.2) * 0.07 + Math.sin((x + z) * 0.5 + t) * 0.05;


  /* ---- sky: sun and clouds ---- */
  const sunBall = new THREE.Mesh(new THREE.SphereGeometry(0.55, 20, 14), new THREE.MeshBasicMaterial({ color: 0xffd36b }));
  sunBall.position.set(4.6, 3.6, -6); scene.add(sunBall);
  const clouds = [];
  const cloudMat = clay(0xffffff, 1);
  [[-4.2, 3.2, -6, 1], [-0.6, 3.8, -7, 0.8], [2.4, 3.0, -6.5, 0.7]].forEach(([x, y, z, k]) => {
    const c = new THREE.Group();
    [[0, 0, 0.5], [0.45, 0.08, 0.38], [-0.45, 0.05, 0.36], [0.15, 0.3, 0.34]].forEach(([dx, dy, r]) => { const b = new THREE.Mesh(new THREE.SphereGeometry(r, 14, 10), cloudMat); b.position.set(dx, dy, 0); c.add(b); });
    c.scale.setScalar(k); c.position.set(x, y, z); scene.add(c); clouds.push(c);
  });
  /* ---- dam (logs) ---- */
  const dam = new THREE.Group();
  const logColors = [0x7a4b22, 0xc58b4c, 0x8a5a2b];
  const logs = [[0, 0.15, 3.6], [0, 0.55, 3.0], [0, 0.95, 2.3]];
  logs.forEach(([x, y, len], i) => {
    const g = new THREE.CylinderGeometry(0.24, 0.24, len, 14);
    const m = new THREE.Mesh(g, clay(logColors[i % 3]));
    m.rotation.z = Math.PI / 2;
    m.position.set(x, y, 0);
    dam.add(m);
    [-1, 1].forEach(s => {
      const cap = new THREE.Mesh(new THREE.CircleGeometry(0.2, 14), clay(0xe7c08a));
      cap.position.set(s * len / 2 + s * 0.005, y, 0);
      cap.rotation.y = s * Math.PI / 2;
      dam.add(cap);
    });
  });
  dam.position.set(0, 0, -2.4);
  scene.add(dam);

  /* ---- banks: trees and grass ---- */
  const tree = (x, z, s) => {
    const t = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.08 * s, 0.1 * s, 0.6 * s, 8), clay(0x7a4b22));
    trunk.position.y = 0.3 * s;
    const c1 = new THREE.Mesh(new THREE.ConeGeometry(0.5 * s, 0.9 * s, 9), clay(0x4f9a5c));
    c1.position.y = 0.95 * s;
    const c2 = new THREE.Mesh(new THREE.ConeGeometry(0.38 * s, 0.7 * s, 9), clay(0x5fb26c));
    c2.position.y = 1.4 * s;
    t.add(trunk, c1, c2);
    t.position.set(x, 0, z);
    scene.add(t);
  };
  tree(-5.2, -2.6, 1.3); tree(-4.1, -3.2, 1.0); tree(4.6, -2.8, 1.25); tree(5.6, -2.0, 0.9);
  const bankL = new THREE.Mesh(new THREE.SphereGeometry(2.2, 18, 12), clay(0x86c28f));
  bankL.scale.set(1.4, 0.3, 1); bankL.position.set(-5.4, -0.2, -2.6); scene.add(bankL);
  const bankR = bankL.clone(); bankR.position.set(5.4, -0.2, -2.6); scene.add(bankR);

  /* lily pads */
  const pads = [];
  [[-3.2, 1.6], [3.4, 2.2], [-1.8, 3.4], [2.2, 0.4]].forEach(([x, z], i) => {
    const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.04, 16, 1, false, 0.4, Math.PI * 1.8), clay(0x5fb26c));
    pad.position.set(x, 0.05, z);
    if (i % 2 === 0) {
      const fl = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), clay(0xff8fb1));
      fl.position.set(0.05, 0.08, 0); pad.add(fl);
    }
    scene.add(pad); pads.push(pad);
  });

  /* ---- beaver ---- */
  const beaver = new THREE.Group();
  const fur = clay(0x9a6235), furDark = clay(0x6e4220), belly = clay(0xd9a774);
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.62, 24, 18), fur);
  body.scale.set(1, 0.85, 1.25); beaver.add(body);
  const tummy = new THREE.Mesh(new THREE.SphereGeometry(0.5, 20, 14), belly);
  tummy.scale.set(0.9, 0.75, 1.1); tummy.position.set(0, -0.06, 0.18); beaver.add(tummy);
  const head = new THREE.Group(); head.position.set(0, 0.55, 0.62); beaver.add(head);
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.46, 24, 18), fur); skull.scale.set(1, 0.95, 0.95); head.add(skull);
  const snout = new THREE.Mesh(new THREE.SphereGeometry(0.26, 18, 14), belly); snout.scale.set(1.25, 0.85, 0.9); snout.position.set(0, -0.1, 0.34); head.add(snout);
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.09, 14, 10), clay(0x2b1a12, 0.5)); nose.position.set(0, 0.0, 0.58); head.add(nose);
  [-1, 1].forEach(s => {
    const tooth = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.13, 0.04), clay(0xffffff, 0.4)); tooth.position.set(s * 0.042, -0.27, 0.52); head.add(tooth);
    const eyeW = new THREE.Mesh(new THREE.SphereGeometry(0.16, 18, 14), clay(0xffffff, 0.35)); eyeW.position.set(s * 0.19, 0.15, 0.34); head.add(eyeW);
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.09, 14, 10), clay(0x1d1410, 0.3)); pupil.position.set(s * 0.19, 0.15, 0.47); head.add(pupil);
    const shine = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 6), clay(0xffffff, 0.2)); shine.position.set(s * 0.19 + 0.035, 0.2, 0.55); head.add(shine);
    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 10), furDark); ear.scale.set(1, 1, 0.6); ear.position.set(s * 0.33, 0.36, 0.0); head.add(ear);
    const cheek = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), clay(0xf29b8f)); cheek.position.set(s * 0.29, -0.05, 0.33); head.add(cheek);
    const arm = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 10), furDark); arm.scale.set(0.8, 1, 0.8); arm.position.set(s * 0.42, -0.05, 0.55); beaver.add(arm); arm.userData.side = s; beaver.userData["arm" + s] = arm;
  });
  const tail = new THREE.Mesh(new THREE.SphereGeometry(0.5, 20, 12), clay(0x4a3020, 0.7));
  tail.scale.set(0.75, 0.13, 1.15); tail.position.set(0, -0.12, -0.95);
  const tailPivot = new THREE.Group(); tailPivot.position.set(0, -0.05, -0.55); tail.position.set(0, -0.07, -0.42); tailPivot.add(tail); beaver.add(tailPivot);
  beaver.scale.setScalar(1.25);
  scene.add(beaver);

  /* ---- ripples & splash ---- */
  const ripples = [];
  const ringGeo = new THREE.RingGeometry(0.42, 0.5, 40); ringGeo.rotateX(-Math.PI / 2);
  function ripple(x, z, big) {
    const m = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: 0xdff3f1, transparent: true, opacity: 0.8 }));
    m.position.set(x, 0.06, z); m.userData = { age: 0, big: !!big }; scene.add(m); ripples.push(m);
  }
  const drops = [];
  const dropGeo = new THREE.SphereGeometry(0.06, 8, 6);
  const dropMat = new THREE.MeshStandardMaterial({ color: 0xbff0f5, roughness: 0.2, transparent: true, opacity: 0.9 });
  function splash(x, z) {
    for (let i = 0; i < 16; i++) {
      const d = new THREE.Mesh(dropGeo, dropMat);
      const a = (i / 16) * Math.PI * 2;
      d.position.set(x, 0.1, z);
      d.userData = { vx: Math.cos(a) * (0.9 + Math.random()), vz: Math.sin(a) * (0.9 + Math.random()), vy: 2.6 + Math.random() * 1.6 };
      scene.add(d); drops.push(d);
    }
    ripple(x, z, true);
  }

  /* ---- tap to jump ---- */
  let jumpT = -1;
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  renderer.domElement.style.cursor = "pointer";
  renderer.domElement.addEventListener("pointerdown", e => {
    const r = renderer.domElement.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    if (ray.intersectObject(beaver, true).length && jumpT < 0) {
      jumpT = 0; splash(beaver.position.x, beaver.position.z);
      try { window.dispatchEvent(new CustomEvent("beaver-jump")); } catch (_) {}
    }
  });

  /* ---- sizing ---- */
  function resize() {
    const w = host.clientWidth || 320;
    const h = Math.round(Math.min(Math.max(w * 0.42, 190), 320));
    renderer.setSize(w, h, false);
    renderer.domElement.style.width = w + "px"; renderer.domElement.style.height = h + "px";
    camera.aspect = w / h;
    camera.fov = w < 480 ? 46 : 38;
    camera.updateProjectionMatrix();
  }
  resize();
  addEventListener("resize", resize);

  /* ---- animation ---- */
  const clock = new THREE.Clock();
  let t = 0, lastRipple = 0, running = true, visible = true;
  const path = s => ({ x: Math.sin(s) * 3.2, z: 1.5 + Math.sin(s * 2) * 0.7 }); // figure-eight in front of the dam
  function frame() {
    const dt = Math.min(clock.getDelta(), 0.05);
    t += dt;
    for (let i = 0; i < wpos.count; i++) {
      const x = wbase[i * 3], z = wbase[i * 3 + 2];
      wpos.array[i * 3 + 1] = waveH(x, z, t);
    }
    wpos.needsUpdate = true; waterGeo.computeVertexNormals();

    const s = t * 0.32, p = path(s), q = path(s + 0.02);
    let y = 0.12 + waveH(p.x, p.z - 1, t) + Math.sin(t * 4) * 0.03;
    if (jumpT >= 0) { jumpT += dt; const k = jumpT / 0.9; y += Math.sin(Math.min(k, 1) * Math.PI) * 1.4; beaver.rotation.x = -Math.sin(Math.min(k, 1) * Math.PI * 2) * 0.4; if (k >= 1) { jumpT = -1; beaver.rotation.x = 0; splash(p.x, p.z); } }
    beaver.position.set(p.x, y, p.z);
    const head0 = Math.atan2(q.x - p.x, q.z - p.z); beaver.rotation.y = Math.atan2(Math.sin(head0) * 0.55, Math.cos(head0) * 0.55 + 0.75);
    beaver.rotation.z = Math.sin(t * 2.2) * 0.06;
    tailPivot.rotation.x = Math.sin(t * 6) * 0.35;
    head.rotation.y = Math.sin(t * 0.9) * 0.25;
    beaver.userData["arm-1"].position.y = -0.05 + Math.sin(t * 6) * 0.06;
    beaver.userData["arm1"].position.y = -0.05 - Math.sin(t * 6) * 0.06;
    if (t - lastRipple > 0.45 && jumpT < 0) { ripple(p.x, p.z); lastRipple = t; }

    for (let i = ripples.length - 1; i >= 0; i--) {
      const r = ripples[i]; r.userData.age += dt; const a = r.userData.age, life = r.userData.big ? 1.6 : 1.3;
      r.scale.setScalar(1 + a * (r.userData.big ? 3.2 : 2)); r.material.opacity = Math.max(0, 0.75 * (1 - a / life));
      r.position.y = 0.06 + waveH(r.position.x, r.position.z - 1, t);
      if (a > life) { scene.remove(r); r.material.dispose(); ripples.splice(i, 1); }
    }
    for (let i = drops.length - 1; i >= 0; i--) {
      const d = drops[i], u = d.userData; u.vy -= 9 * dt;
      d.position.x += u.vx * dt; d.position.z += u.vz * dt; d.position.y += u.vy * dt;
      if (d.position.y < 0) { scene.remove(d); drops.splice(i, 1); }
    }
    clouds.forEach((c, i) => { c.position.x += dt * 0.12 * (i % 2 ? 1 : 0.7); if (c.position.x > 7) c.position.x = -7; });
    sunBall.scale.setScalar(1 + Math.sin(t * 1.5) * 0.04);
    pads.forEach((pd, i) => { pd.position.y = 0.05 + waveH(pd.position.x, pd.position.z - 1, t); pd.rotation.y = Math.sin(t * 0.5 + i) * 0.3; });

    renderer.render(scene, camera);
  }

  function loop() {
    if (!running) return;
    const homeOn = document.getElementById("s-home")?.classList.contains("on");
    if (visible && homeOn && !document.hidden) frame(); else clock.getDelta();
    requestAnimationFrame(loop);
  }
  if (reduce) { frame(); renderer.domElement.addEventListener("pointerdown", () => frame()); }
  else requestAnimationFrame(loop);

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(es => { visible = es[0].isIntersecting; }).observe(host);
  }
  window.__hero3d = { ok: true, jump: () => { if (jumpT < 0) { jumpT = 0; splash(beaver.position.x, beaver.position.z); } } };
}
