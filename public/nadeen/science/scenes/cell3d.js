// 3D animal + plant cell — models prepared in Blender (models/build_cells.py) with ONLY the parts named in the
// test: wall, membrane, nucleus, mito, vacuole, chloro. Every part is a separate node → pick, label, separate
// step by step, reassemble to its exact place. Teaching colors only (stated on the page).
import * as THREE from 'three';
import { OrbitControls } from '../lib/OrbitControls.js';
import { RoomEnvironment } from '../lib/RoomEnvironment.js';
import { loadModel } from '../lib/loadModel.js';

const SHELL = new Set(['membrane', 'wall']);
const ORDER = ['wall', 'membrane', 'vacuole', 'nucleus', 'chloro', 'mito'];      // separation order (outside → inside)
// teaching colors (clear, saturated) applied over the Blender materials
const TINT = { membrane: [0xf48fb1, 0.2], wall: [0x4caf50, 0.42], nucleus: [0x7e57c2, 1], mito: [0xff8a3d, 1], vacuole: [0x4fc3f7, 0.6], chloro: [0x2e9e45, 1] };
const keyOf = name => (name || '').replace(/_\d+$/, '').replace(/\.\d+$/, '');

export function mountCell(container, opts = {}) {
  const W = () => container.clientWidth, H = () => container.clientHeight;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.setSize(W(), H());
  renderer.localClippingEnabled = true; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer); scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  const camera = new THREE.PerspectiveCamera(40, W() / H(), 0.1, 100); camera.position.set(0, 1.6, 6.2);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true; controls.minDistance = 2.5; controls.maxDistance = 11; controls.enablePan = false;
  controls.autoRotate = true; controls.autoRotateSpeed = 0.8;
  scene.add(new THREE.HemisphereLight(0xffffff, 0x9aa7c7, 0.9));
  const dl = new THREE.DirectionalLight(0xffffff, 1.6); dl.position.set(3, 5, 4); scene.add(dl);

  const cutPlane = new THREE.Plane(new THREE.Vector3(0, 0, -1), 0);
  const animal = new THREE.Group(), plant = new THREE.Group(); scene.add(animal, plant);
  const parts = [];      // { mesh, key, home, dir, group, anchor, o0 }
  const ANCHOR = { membrane: new THREE.Vector3(-1.1, -0.95, 0.9), wall: new THREE.Vector3(1.45, 1.05, 1.0) };
  const D = opts.data || {};
  let mode = 'animal', exploded = false, cut = false, playing = true, highlight = null, loaded = false, tl = null;
  const pending = [];

  function prepare(root, group) {
    root.traverse(o => {
      if (!o.isMesh) return;
      const key = keyOf(o.name); o.userData.key = key;
      const m = o.material = o.material.clone();
      const tint = TINT[key]; if (tint) { m.color.setHex(group === plant && key === 'membrane' ? 0xd4ef7a : tint[0]); m.opacity = tint[1]; m.transparent = tint[1] < 1; }
      m.roughness = SHELL.has(key) ? 0.25 : 0.35; m.metalness = 0;
      if (m.transparent || m.opacity < 1) { m.transparent = true; m.depthWrite = false; m.side = THREE.DoubleSide; }
      if (!m.emissive) m.emissive = new THREE.Color(0); m.emissiveIntensity = 0;
      if (key === 'mito') m.emissive.setHex(0xff7a00);
      o.renderOrder = SHELL.has(key) ? 2 : (m.transparent ? 1 : 0);
      parts.push({ mesh: o, key, home: o.position.clone(), dir: (key === 'nucleus' ? new THREE.Vector3(0.2, 1, 0.3) : o.position.clone()).normalize(),
                   group, anchor: ANCHOR[key] || null, o0: m.opacity });
    });
    group.add(root);
  }
    Promise.all(['cell_animal', 'cell_plant'].map(loadModel)).then(([a, p]) => {
    prepare(a.scene, animal); prepare(p.scene, plant); loaded = true; layout();
    pending.splice(0).forEach(f => f());
    opts.onReady && opts.onReady();
  }).catch(e => { container.insertAdjacentHTML('beforeend', '<p class="c3-err">تعذّر تحميل المجسّم</p>'); console.error(e); });
  const whenReady = f => (loaded ? f() : pending.push(f));

  // ---------- labels ----------
  const labelLayer = document.createElement('div'); labelLayer.className = 'c3-labels'; container.appendChild(labelLayer);
  const labels = []; let showLabels = true;
  function makeLabels() {
    labels.forEach(l => l.el.remove()); labels.length = 0;
    for (const g of [animal, plant]) {
      if (!g.visible) continue; const seen = new Set();
      for (const p of parts) if (p.group === g && !seen.has(p.key)) {
        if (mode === 'compare' && p.key !== highlight) continue;
        seen.add(p.key); const el = document.createElement('button'); el.type = 'button'; el.className = 'c3-label'; el.textContent = (D[p.key] || {}).name || p.key;
        el.addEventListener('click', e => { e.stopPropagation(); pick(p.key, g); }); labelLayer.appendChild(el);
        labels.push({ el, part: p });
      }
    }
  }

  // ---------- state ----------
  function layout() {
    animal.visible = mode !== 'plant'; plant.visible = mode !== 'animal';
    animal.position.x = mode === 'compare' ? -2.25 : 0; plant.position.x = mode === 'compare' ? 2.35 : 0;
    const s = mode === 'compare' ? 0.78 : 1; animal.scale.setScalar(s); plant.scale.setScalar(s);
    camera.position.set(0, mode === 'compare' ? 2 : 1.6, mode === 'compare' ? 8.6 : 6.2); controls.target.set(0, 0, 0); controls.update();
    makeLabels();
  }
  // separate step by step (outside → inside), each step lights its part and label; reassemble in reverse to the exact home
  function setExplode(on, step = 0.45) {
    exploded = on; if (tl) tl.kill();
    const groups = [animal, plant].filter(g => g.visible);
    const keys = on ? ORDER : ORDER.slice().reverse();
    tl = gsap.timeline({ onComplete: () => { tl = null; if (!on) pick(null); opts.onExplode && opts.onExplode(on); } });
    keys.forEach((k, i) => {
      const ps = parts.filter(p => p.key === k && groups.includes(p.group)); if (!ps.length) return;
      const at = i * step;
      tl.call(() => pick(k), null, at);
      ps.forEach(p => {
        if (SHELL.has(k)) tl.to(p.mesh.material, { opacity: on ? p.o0 * 0.4 : p.o0, duration: 0.5 }, at);
        else { const to = on ? p.home.clone().add(p.dir.clone().multiplyScalar(k === 'nucleus' ? 1.1 : 1.35)) : p.home;
               tl.to(p.mesh.position, { x: to.x, y: to.y, z: to.z, duration: 0.7, ease: 'power2.inOut' }, at); }
      });
    });
    return tl;
  }
  function setCut(on) {
    cut = on;
    for (const p of parts) if (SHELL.has(p.key) || (p.key === 'vacuole' && p.group === plant)) {
      const m = p.mesh.material; m.clippingPlanes = on ? [cutPlane] : []; m.opacity = on ? Math.min(0.8, p.o0 * 1.8) : (exploded && SHELL.has(p.key) ? p.o0 * 0.4 : p.o0); m.needsUpdate = true;
    }
  }
  function pick(key, group) {
    highlight = key;
    for (const p of parts) {
      const m = p.mesh.material; const on = key && p.key === key && (!group || p.group === group);
      m.emissive.setHex(on ? 0xffffaa : (p.key === 'mito' ? 0xff7a00 : 0x000000)); m.emissiveIntensity = on ? 0.35 : 0;
    }
    if (mode === 'compare') makeLabels();
    labels.forEach(l => l.el.classList.toggle('on', l.part.key === key));
    key && opts.onPick && opts.onPick(key);
  }

  // ---------- picking ----------
  const ray = new THREE.Raycaster(), ptr = new THREE.Vector2(); let down = null;
  renderer.domElement.addEventListener('pointerdown', e => { down = [e.clientX, e.clientY]; });
  renderer.domElement.addEventListener('pointerup', e => {
    if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 8) return;
    const r = renderer.domElement.getBoundingClientRect(); ptr.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ptr, camera);
    const hits = ray.intersectObjects(parts.filter(p => p.group.visible).map(p => p.mesh), false)
      .filter(h => !(cut && SHELL.has(h.object.userData.key) && h.point.z > 0));
    const inner = hits.find(h => !SHELL.has(h.object.userData.key)) || hits[0];      // prefer the organelle over its shell
    if (inner) pick(inner.object.userData.key, parts.find(p => p.mesh === inner.object).group);
  });
  let holdUntil = 0; container.addEventListener('pointerdown', () => { holdUntil = performance.now() + 8000; }, true);

  // ---------- loop ----------
  const clock = new THREE.Clock(); let raf = 0; const v = new THREE.Vector3();
  function frame() {
    raf = requestAnimationFrame(frame); const t = clock.getElapsedTime();
    controls.autoRotate = playing && performance.now() > holdUntil; controls.update();
    if (playing && !tl) for (const p of parts) {
      if (p.key === 'mito' && highlight !== 'mito') p.mesh.material.emissiveIntensity = 0.12 + 0.12 * Math.sin(t * 3 + p.home.x * 4);   // "energy" glow
      if (p.key === 'chloro' && !exploded) p.mesh.position.y = p.home.y + 0.03 * Math.sin(t * 1.2 + p.home.x * 3);
    }
    renderer.render(scene, camera);
    if (showLabels) {
      const r = renderer.domElement.getBoundingClientRect(), placed = [];
      for (const l of labels) {
        if (l.part.anchor) v.copy(l.part.anchor).applyMatrix4(l.part.group.matrixWorld); else l.part.mesh.getWorldPosition(v);
        v.project(camera);
        const vis = v.z < 1 && l.part.group.visible;
        l.el.style.display = vis ? '' : 'none'; if (!vis) continue;
        let x = (v.x * 0.5 + 0.5) * r.width, y = (-v.y * 0.5 + 0.5) * r.height - 18;
        const w = l.el.offsetWidth || 80, h = (l.el.offsetHeight || 22) + 4;
        for (let k = 0; k < 8; k++) { const hit = placed.find(q => Math.abs(q.x - x) < (q.w + w) / 2 && Math.abs(q.y - y) < h); if (!hit) break; y = hit.y + h; }
        x = Math.max(w / 2 + 4, Math.min(r.width - w / 2 - 4, x)); y = Math.max(h / 2, Math.min(r.height - h / 2, y));
        x = Math.round(x); y = Math.round(y); placed.push({ x, y, w }); const tr = `translate(${x}px, ${y}px) translate(-50%, -50%)`; if (l.el.style.transform !== tr) l.el.style.transform = tr;
      }
    }
  }
  function resize() { renderer.setSize(W(), H()); camera.aspect = W() / H(); camera.updateProjectionMatrix(); }
  const ro = new ResizeObserver(resize); ro.observe(container);
  layout(); frame();
  const homeOK = () => parts.filter(p => p.group.visible).every(p => SHELL.has(p.key) || p.mesh.position.distanceTo(p.home) < (p.key === 'chloro' ? 0.04 : 1e-3));   // chloroplasts drift ±0.03 when playing
  return {
    ready: () => loaded,
    setMode(m) { mode = m; whenReady(() => { if (exploded) { if (tl) tl.kill(); exploded = false; parts.forEach(p => { p.mesh.position.copy(p.home); p.mesh.material.opacity = p.o0; }); } layout(); }); },
    explode(on) { const t = on == null ? !exploded : on; whenReady(() => setExplode(t)); return t; },
    cut(on) { const t = on == null ? !cut : on; whenReady(() => setCut(t)); return t; },
    labels(on) { showLabels = on == null ? !showLabels : on; labelLayer.style.display = showLabels ? '' : 'none'; return showLabels; },
    focus(key) { whenReady(() => pick(key)); },
    play() { playing = true; }, pause() { playing = false; }, isPlaying: () => playing,
    reset() { whenReady(() => { if (tl) tl.kill(); tl = null; exploded = false; parts.forEach(p => { p.mesh.position.copy(p.home); p.mesh.material.opacity = p.o0; }); setCut(false); pick(null); layout(); }); },
    state: () => ({ mode, exploded, cut, playing, highlight, loaded, busy: !!tl, parts: parts.length, labels: labels.length, atHome: homeOK(),
                    keys: [...new Set(parts.filter(p => p.group.visible).map(p => p.key))] }),
    dispose() { cancelAnimationFrame(raf); if (tl) tl.kill(); ro.disconnect(); controls.dispose(); renderer.dispose(); container.innerHTML = ''; }
  };
}
