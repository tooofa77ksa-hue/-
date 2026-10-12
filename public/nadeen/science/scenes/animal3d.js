// 3D animals that appear in the test, with free licences:
//  • fish  — Khronos glTF Sample "Barramundi Fish" (CC0, realistic textures). Static mesh (no rig) → a simple,
//            stated "swimming" sway of the whole body, not joint motion.
//  • sheep — Quaternius "Farm Animals" Sheep (CC0), rigged: real Idle / Walk joint animations (prepared in Blender).
import * as THREE from 'three';
import { OrbitControls } from '../lib/OrbitControls.js';
import { RoomEnvironment } from '../lib/RoomEnvironment.js';
import { loadModel } from '../lib/loadModel.js';

export const ANIMALS = {
  fish: { file: 'fish', name: 'السمكة', fact: 'من الأسماك: يغطي جلدها القشور.', rig: false },
  sheep: { file: 'sheep', name: 'الخروف', fact: 'من الثدييات: حرارة جسمه ثابتة.', rig: true, sound: 'sheep', photo: 'img/sheep_real.webp' }
};

export function mountAnimal(container, key, opts = {}) {
  const A = ANIMALS[key];
  const W = () => container.clientWidth, H = () => container.clientHeight;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.setSize(W(), H());
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
  scene.add(new THREE.HemisphereLight(0xffffff, 0x88aa99, 1.0));
  const sun = new THREE.DirectionalLight(0xffffff, 1.8); sun.position.set(3, 6, 4); scene.add(sun);
  const camera = new THREE.PerspectiveCamera(38, W() / H(), 0.01, 100);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true; controls.enablePan = false; controls.autoRotate = true; controls.autoRotateSpeed = 1.2;
  const holder = new THREE.Group(); scene.add(holder);
  const ground = new THREE.Mesh(new THREE.CircleGeometry(1.6, 48), new THREE.MeshStandardMaterial({ color: key === 'fish' ? 0x9fd8f5 : 0xa8d98a, roughness: 1, transparent: true, opacity: 0.55 }));
  ground.rotation.x = -Math.PI / 2; scene.add(ground);

  let mixer = null, actions = {}, current = null, playing = true, loaded = false, model = null, baseY = 0, walking = false;
  loadModel(A.file).then(g => {
    model = g.scene; holder.add(model);
    const box = new THREE.Box3().setFromObject(model), size = box.getSize(new THREE.Vector3()), c = box.getCenter(new THREE.Vector3());
    const s = (key === 'sheep' ? 1.6 : 2) / Math.max(size.x, size.y, size.z); model.scale.setScalar(s);
    model.position.set(-c.x * s, -box.min.y * s, -c.z * s); baseY = model.position.y;
    if (key === 'fish') { model.position.y += 0.35; baseY = model.position.y; ground.position.y = -0.05; }
    camera.position.set(2.9, 1.7, 3.2); controls.target.set(0, key === 'sheep' ? 0.55 : 0.6, 0); controls.minDistance = 1.4; controls.maxDistance = 7; controls.update();
    if (g.animations.length) {
      mixer = new THREE.AnimationMixer(model);
      g.animations.forEach(cl => { actions[cl.name] = mixer.clipAction(cl); });
      play(actions.Idle ? 'Idle' : g.animations[0].name);
    }
    loaded = true; opts.onReady && opts.onReady({ clips: Object.keys(actions) });
  }).catch(e => { container.insertAdjacentHTML('beforeend', '<p class="c3-err">تعذّر تحميل المجسّم</p>'); console.error(e); });

  function play(name) {
    const next = actions[name]; if (!next || next === current) return;
    next.reset().fadeIn(0.3).play(); if (current) current.fadeOut(0.3); current = next; walking = name === 'Walk';
  }
  let holdUntil = 0; container.addEventListener('pointerdown', () => { holdUntil = performance.now() + 8000; }, true);
  const clock = new THREE.Clock(); let raf = 0, t = 0;
  function frame() {
    raf = requestAnimationFrame(frame); const dt = clock.getDelta();
    if (playing) {
      t += dt; if (mixer) mixer.update(dt);
      if (key === 'fish' && model) {         // simple stated sway: the model has no joints
        holder.rotation.y = Math.sin(t * 2.2) * 0.18; model.position.y = baseY + Math.sin(t * 1.4) * 0.05;
      }
    }
    controls.autoRotate = playing && performance.now() > holdUntil; controls.update();
    renderer.render(scene, camera);
  }
  const ro = new ResizeObserver(() => { renderer.setSize(W(), H()); camera.aspect = W() / H(); camera.updateProjectionMatrix(); }); ro.observe(container);
  frame();
  return {
    ready: () => loaded,
    walk(on) { if (!mixer) return false; play(on ? 'Walk' : 'Idle'); return walking; },
    play() { playing = true; }, pause() { playing = false; }, isPlaying: () => playing,
    state: () => ({ key, loaded, playing, walking, clips: Object.keys(actions), time: t }),
    dispose() { cancelAnimationFrame(raf); ro.disconnect(); controls.dispose(); renderer.dispose(); container.innerHTML = ''; }
  };
}
