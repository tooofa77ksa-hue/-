// الكرة الأرضية الافتتاحية: صورة الأرض من NASA، تقترب حتى تستقر على المملكة،
// ثم تُرسم حدودها بخط ذهبي ويتلوّن داخلها بالأخضر.
import * as THREE from "three";

const canvas = document.getElementById("globe");
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const gsap = window.gsap;

function hasWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(window.WebGLRenderingContext && (c.getContext("webgl2") || c.getContext("webgl")));
  } catch (e) { return false; }
}

if (canvas && hasWebGL()) init().catch((e) => console.warn("globe:", e));

async function init() {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 200);
  camera.position.set(0, 0, 9);

  // التحويل من خط الطول/العرض إلى نقطة على الكرة (متوافق مع إحداثيات SphereGeometry)
  const v3 = (lon, lat, r = 1) => {
    const phi = THREE.MathUtils.degToRad(lon + 180);
    const th = THREE.MathUtils.degToRad(90 - lat);
    return new THREE.Vector3(-r * Math.sin(th) * Math.cos(phi), r * Math.cos(th), r * Math.sin(th) * Math.sin(phi));
  };

  const holder = new THREE.Group(); // الإزاحة على الشاشة
  const tilt = new THREE.Group(); // الميل
  const spin = new THREE.Group(); // الدوران
  holder.add(tilt); tilt.add(spin); scene.add(holder);

  // الأرض
  const tex = await new THREE.TextureLoader().loadAsync("assets/earth.jpg");
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  const earth = new THREE.Mesh(
    new THREE.SphereGeometry(1, 96, 96),
    new THREE.MeshPhongMaterial({ map: tex, shininess: 6, specular: new THREE.Color(0x223322) })
  );
  spin.add(earth);

  // الغلاف الجوي
  const atmo = new THREE.Mesh(
    new THREE.SphereGeometry(1.1, 64, 64),
    new THREE.ShaderMaterial({
      vertexShader: "varying vec3 vN; void main(){ vN = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
      fragmentShader: "varying vec3 vN; void main(){ float i = pow(0.68 - dot(vN, vec3(0.0,0.0,1.0)), 3.2); gl_FragColor = vec4(0.55,0.85,0.75,1.0) * i * 1.4; }",
      side: THREE.BackSide, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false,
    })
  );
  holder.add(atmo);

  // الإضاءة
  scene.add(new THREE.AmbientLight(0xffffff, 0.75));
  const sun = new THREE.DirectionalLight(0xfff4dc, 1.9);
  sun.position.set(-3, 2, 4);
  scene.add(sun);

  // النجوم
  {
    const n = 1400, pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const v = new THREE.Vector3().randomDirection().multiplyScalar(40 + Math.random() * 40);
      pos.set([v.x, v.y, v.z], i * 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    scene.add(new THREE.Points(g, new THREE.PointsMaterial({ color: 0xf4e4b5, size: 0.12, transparent: true, opacity: 0.7, sizeAttenuation: true })));
  }

  // حدود المملكة
  const ring = await (await fetch("assets/sau.json")).json();
  const pts = ring.map(([lo, la]) => v3(lo, la, 1.004));
  const curve = new THREE.CatmullRomCurve3(pts, true, "catmullrom", 0.1);
  const SEG = 900, RAD = 6;
  const tubeGeo = new THREE.TubeGeometry(curve, SEG, 0.0042, RAD, true);
  const tubeMat = new THREE.MeshBasicMaterial({ color: 0xf2d27e, transparent: true, opacity: 1 });
  const tube = new THREE.Mesh(tubeGeo, tubeMat);
  const fullCount = tubeGeo.index.count;
  tubeGeo.setDrawRange(0, 0);
  spin.add(tube);

  // التعبئة الخضراء: تثليث داخل الحدود ثم تقسيم المثلثات حتى تنحني مع الكرة
  {
    const shape = new THREE.Shape(ring.map(([lo, la]) => new THREE.Vector2(lo, la)));
    const sg = new THREE.ShapeGeometry(shape).toNonIndexed();
    const src = sg.attributes.position.array;
    const out = [];
    const split = (a, b, c, d) => {
      const e = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]);
      if (d > 6 || Math.max(e(a, b), e(b, c), e(c, a)) < 1.5) { out.push(a, b, c); return; }
      const m = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
      const ab = m(a, b), bc = m(b, c), ca = m(c, a);
      split(a, ab, ca, d + 1); split(ab, b, bc, d + 1); split(ca, bc, c, d + 1); split(ab, bc, ca, d + 1);
    };
    for (let i = 0; i < src.length; i += 9) split([src[i], src[i + 1]], [src[i + 3], src[i + 4]], [src[i + 6], src[i + 7]], 0);
    const arr = new Float32Array(out.length * 3);
    out.forEach((p, i) => { const v = v3(p[0], p[1], 1.003); arr.set([v.x, v.y, v.z], i * 3); });
    const fg = new THREE.BufferGeometry();
    fg.setAttribute("position", new THREE.BufferAttribute(arr, 3));
    var fillMat = new THREE.MeshBasicMaterial({ color: 0x00a35a, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide });
    spin.add(new THREE.Mesh(fg, fillMat));
  }

  // نبضة ذهبية فوق الرياض
  const dotTex = (() => {
    const c = document.createElement("canvas"); c.width = c.height = 128;
    const x = c.getContext("2d");
    const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, "rgba(255,246,214,1)"); g.addColorStop(0.25, "rgba(242,210,126,.95)"); g.addColorStop(1, "rgba(242,210,126,0)");
    x.fillStyle = g; x.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  })();
  const pulse = new THREE.Sprite(new THREE.SpriteMaterial({ map: dotTex, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
  pulse.position.copy(v3(46.7, 24.7, 1.01));
  pulse.scale.setScalar(0.06);
  spin.add(pulse);

  // الاتجاه النهائي: المملكة في مواجهة الكاميرا
  const c = v3(45, 23.8);
  const A = Math.atan2(-c.x, c.z);
  const zp = -c.x * Math.sin(A) + c.z * Math.cos(A);
  const B = Math.atan2(c.y, zp);

  // التموضع حسب حجم الشاشة
  let layout = { x: 0, y: 0, z: 3 };
  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    const narrow = w < 700;
    layout = narrow ? { x: 0, y: 0.42, z: 3.15 } : w < 1020 ? { x: -0.25, y: 0.12, z: 2.85 } : { x: -0.4, y: 0.02, z: 2.7 };
    if (!introRunning) { holder.position.set(layout.x, layout.y, 0); camera.position.z = layout.z; }
  }
  let introRunning = false;
  addEventListener("resize", resize);
  resize();

  // ميل خفيف مع حركة المؤشر أو الجهاز
  const look = { x: 0, y: 0 }, lookT = { x: 0, y: 0 };
  addEventListener("pointermove", (e) => { lookT.x = (e.clientX / innerWidth - 0.5) * 0.12; lookT.y = (e.clientY / innerHeight - 0.5) * 0.08; }, { passive: true });

  const state = { draw: 0, idle: 0 };
  function finalState() {
    spin.rotation.y = A; tilt.rotation.x = B;
    holder.position.set(layout.x, layout.y, 0); camera.position.z = layout.z;
    state.draw = 1; fillMat.opacity = 0.42; pulse.material.opacity = 1; state.idle = 1;
  }

  if (reduce || !gsap) {
    finalState();
  } else {
    introRunning = true;
    spin.rotation.y = A - 2.6;
    tilt.rotation.x = 0.35;
    holder.position.set(0, 0, 0);
    camera.position.z = 9;
    const tl = gsap.timeline({ delay: 0.2, onComplete: () => { introRunning = false; gsap.to(state, { idle: 1, duration: 2.5, ease: "sine.inOut" }); } });
    tl.to(spin.rotation, { y: A, duration: 3.6, ease: "power3.inOut" }, 0)
      .to(tilt.rotation, { x: B, duration: 3.6, ease: "power2.inOut" }, 0)
      .to(camera.position, { z: () => layout.z, duration: 3.6, ease: "power2.inOut" }, 0)
      .to(holder.position, { x: () => layout.x, y: () => layout.y, duration: 2.4, ease: "power2.inOut" }, 1.2)
      .to(state, { draw: 1, duration: 2.2, ease: "power1.inOut" }, 2.7)
      .to(fillMat, { opacity: 0.42, duration: 1.6, ease: "power2.out" }, 3.4)
      .to(pulse.material, { opacity: 1, duration: 0.8 }, 4.4);
  }

  // التشغيل فقط حين تكون الواجهة ظاهرة
  let visible = true;
  new IntersectionObserver((e) => { visible = e[0].isIntersecting; if (visible) loop(); }, { threshold: 0 }).observe(canvas);

  const clock = new THREE.Clock();
  let raf = 0;
  function loop() {
    cancelAnimationFrame(raf);
    if (!visible) return;
    raf = requestAnimationFrame(loop);
    const t = clock.getElapsedTime();
    tubeGeo.setDrawRange(0, Math.floor((fullCount / (RAD * 6)) * state.draw) * RAD * 6);
    look.x += (lookT.x - look.x) * 0.05; look.y += (lookT.y - look.y) * 0.05;
    if (!introRunning) {
      const k = state.idle;
      spin.rotation.y = A + (Math.sin(t * 0.22) * 0.05 - look.x) * k;
      tilt.rotation.x = B + (Math.cos(t * 0.18) * 0.025 + look.y) * k;
    }
    const p = (t * 0.7) % 1;
    pulse.scale.setScalar(0.03 + p * 0.06);
    if (!introRunning) pulse.material.opacity = 1 - p * 0.85;
    tubeMat.opacity = 0.85 + Math.sin(t * 2) * 0.15;
    renderer.render(scene, camera);
  }
  loop();
  canvas.style.opacity = 0;
  if (gsap) gsap.to(canvas, { opacity: 1, duration: 1.4, ease: "power2.out" }); else canvas.style.opacity = 1;
}
