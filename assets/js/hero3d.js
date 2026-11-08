/* =====================================================================
   hero3d.js — the interactive Three.js hero artifact.
   A "sync gimbal": three thin glowing tori on different axes that
   slowly fall into alignment, around a pulsing wireframe icosahedron
   core with an additive glow sprite and a particle halo.

   · Reacts to cursor (lerped rotation + parallax)
   · Reacts to scroll (rotation + camera dolly)
   · Reacts to click/tap (an impulse ripple through the rings)
   · Touch devices drive it via touch-drag (pointer events unify this)

   Performance & resilience:
   · DPR capped at 2 · paused when tab hidden or hero off-screen
   · Particle count downgraded on mobile / low core counts
   · Three.js is dynamically imported — if the CDN fails, WebGL is
     unavailable, or the device is weak, the canvas is removed and the
     animated CSS gradient mesh beneath it simply carries the hero.
   ===================================================================== */
export async function initHero3D(ctx) {
  const canvas = document.querySelector('[data-hero-canvas]');
  const hero = document.querySelector('[data-hero]');
  if (!canvas || !hero) return;

  const cores = navigator.hardwareConcurrency || 4;
  const reduced = ctx.reduced.matches;

  /* --- Eligibility checks --- */
  let gl = null;
  try { gl = canvas.getContext('webgl2') || canvas.getContext('webgl'); } catch (_) { gl = null; }
  if (!gl || cores <= 2) { canvas.remove(); return; }

  let THREE;
  try {
    THREE = await import('https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js');
  } catch (_) {
    canvas.remove(); // CSS mesh fallback stays
    return;
  }

  const isMobile = window.matchMedia('(max-width: 767px)').matches;
  const light = isMobile || cores <= 4;

  /* --- Renderer / scene / camera --- */
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, canvas.clientWidth / canvas.clientHeight, 0.1, 60);
  camera.position.set(0, 0, 7.4);

  const artifact = new THREE.Group();
  artifact.position.x = isMobile ? 0 : 1.55; // offset right of the headline on desktop
  scene.add(artifact);

  /* --- Gimbal rings --- */
  const VIOLET = 0x6e4bff;
  const CYAN = 0x22d3ee;
  const CHALK = 0xf2f4f8;

  const ringSpecs = [
    { r: 2.35, tube: 0.018, color: VIOLET, opacity: 0.9, axis: 'x', speed: 0.16 },
    { r: 1.86, tube: 0.024, color: CYAN, opacity: 0.85, axis: 'y', speed: -0.22 },
    { r: 1.42, tube: 0.03, color: CHALK, opacity: 0.5, axis: 'z', speed: 0.3 },
  ];
  const rings = ringSpecs.map((spec) => {
    const mesh = new THREE.Mesh(
      new THREE.TorusGeometry(spec.r, spec.tube, 10, light ? 96 : 128),
      new THREE.MeshBasicMaterial({ color: spec.color, transparent: true, opacity: spec.opacity, blending: THREE.AdditiveBlending })
    );
    mesh.userData = { speed: spec.speed, phase: Math.random() * Math.PI * 2 };
    artifact.add(mesh);
    return mesh;
  });

  /* --- Wireframe icosahedron core --- */
  const core = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.72, 1),
    new THREE.MeshBasicMaterial({ color: CYAN, wireframe: true, transparent: true, opacity: 0.5 })
  );
  artifact.add(core);

  /* --- Additive glow sprite (canvas-generated texture) --- */
  const glowCanvas = document.createElement('canvas');
  glowCanvas.width = glowCanvas.height = 128;
  const gctx = glowCanvas.getContext('2d');
  const grd = gctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, 'rgba(110,75,255,0.85)');
  grd.addColorStop(0.35, 'rgba(110,75,255,0.28)');
  grd.addColorStop(0.7, 'rgba(34,211,238,0.10)');
  grd.addColorStop(1, 'rgba(34,211,238,0)');
  gctx.fillStyle = grd;
  gctx.fillRect(0, 0, 128, 128);
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: new THREE.CanvasTexture(glowCanvas), blending: THREE.AdditiveBlending, transparent: true, depthWrite: false
  }));
  glow.scale.setScalar(3.4);
  artifact.add(glow);

  /* --- Particle halo --- */
  const COUNT = light ? 350 : 1400;
  const positions = new Float32Array(COUNT * 3);
  const seeds = new Float32Array(COUNT);
  for (let i = 0; i < COUNT; i += 1) {
    const radius = 2.6 + Math.random() * 2.6;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta) * 0.62;
    positions[i * 3 + 2] = radius * Math.cos(phi);
    seeds[i] = Math.random();
  }
  const haloGeo = new THREE.BufferGeometry();
  haloGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const halo = new THREE.Points(haloGeo, new THREE.PointsMaterial({
    color: CHALK, size: 0.022, transparent: true, opacity: 0.55, sizeAttenuation: true, depthWrite: false
  }));
  scene.add(halo);

  /* --- Interaction state --- */
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  let impulse = 0;
  let scrollP = 0;
  let intro = 0; // 0 → 1 entrance blend
  let running = false;
  let rafId = null;
  const clock = { t: 0 };

  const onPointerMove = (e) => {
    const rect = hero.getBoundingClientRect();
    pointer.tx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    pointer.ty = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
  };
  hero.addEventListener('pointermove', onPointerMove, { passive: true });

  const onActivate = () => { impulse = 1; };
  hero.addEventListener('pointerdown', onActivate, { passive: true });
  hero.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { /* hero is not a control; ignore */ } });

  let scrollRaf = null;
  const readScroll = () => {
    scrollRaf = null;
    const h = hero.offsetHeight || 1;
    scrollP = Math.min(1, Math.max(0, window.scrollY / (h * 1.1)));
  };
  window.addEventListener('scroll', () => { if (!scrollRaf) scrollRaf = requestAnimationFrame(readScroll); }, { passive: true });
  readScroll();

  /* --- Render loop --- */
  const render = () => {
    clock.t += 0.016;
    intro = Math.min(1, intro + 0.012);
    const ease = 1 - Math.pow(1 - intro, 3);

    pointer.x += (pointer.tx - pointer.x) * 0.055;
    pointer.y += (pointer.ty - pointer.y) * 0.055;
    impulse *= 0.94;

    // Entrance scale-in + breathing
    artifact.scale.setScalar((0.62 + 0.38 * ease) * (1 - scrollP * 0.18));

    // Cursor parallax + scroll rotation
    artifact.rotation.y = pointer.x * 0.35 + scrollP * 2.1 + clock.t * 0.05;
    artifact.rotation.x = pointer.y * 0.22 + scrollP * 0.5;
    artifact.rotation.z = Math.sin(clock.t * 0.22) * 0.05;

    // Rings: individual orbits + click impulse ripple (phase-offset)
    rings.forEach((ring, i) => {
      const { speed, phase } = ring.userData;
      const rip = Math.sin(clock.t * 6 + phase) * impulse * (0.5 + i * 0.35);
      ring.rotation[speed > 0 ? 'x' : 'y'] += Math.abs(speed) * 0.0022 + impulse * 0.004 * (i + 1);
      ring.rotation.z = ring.rotation.z || 0;
      ring.rotation[(i % 2 ? 'z' : 'x')] += rip * 0.01;
    });

    // Core pulse
    const pulse = 1 + Math.sin(clock.t * 1.7) * 0.05 + impulse * 0.22;
    core.scale.setScalar(pulse);
    core.rotation.y += 0.004 + impulse * 0.02;
    core.rotation.x += 0.0016;
    core.material.opacity = 0.35 + Math.sin(clock.t * 1.7) * 0.14 + impulse * 0.3;
    glow.material.opacity = 0.75 + Math.sin(clock.t * 1.7) * 0.18 + impulse * 0.5;

    // Halo drift (opposite direction)
    halo.rotation.y -= 0.0011;
    halo.rotation.x = Math.sin(clock.t * 0.14) * 0.12;

    // Camera dolly on scroll + pointer parallax
    camera.position.z = 7.4 + scrollP * 2.3;
    camera.position.x = pointer.x * 0.28;
    camera.position.y = -pointer.y * 0.2;
    camera.lookAt(artifact.position.x * (1 - scrollP * 0.6), 0, 0);

    renderer.render(scene, camera);
    if (running) rafId = requestAnimationFrame(render);
  };

  const start = () => { if (!running && !reduced) { running = true; rafId = requestAnimationFrame(render); } };
  const stop = () => { running = false; if (rafId) cancelAnimationFrame(rafId); };

  /* --- Pause when hidden / off-screen --- */
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((entries) => {
      entries.forEach((entry) => (entry.isIntersecting && !document.hidden ? start() : stop()));
    }, { threshold: 0.02 }).observe(hero);
  } else { start(); }

  /* --- Resize (debounced) --- */
  let resizeTimer = null;
  const onResize = () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (!w || !h) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    }, 150);
  };
  window.addEventListener('resize', onResize, { passive: true });

  /* --- Reduced motion: render one beautiful static frame --- */
  artifact.scale.setScalar(1);
  rings.forEach((ring) => { ring.rotation.x = Math.PI / 3; ring.rotation.y = Math.PI / 5; });
  camera.position.set(0.4, 0.2, 7.4);
  renderer.render(scene, camera);

  // Fade the CSS mesh back a touch once WebGL is live (avoids double glow)
  hero.dataset.webgl = 'true';

  return () => {
    stop();
    window.removeEventListener('resize', onResize);
    hero.removeEventListener('pointermove', onPointerMove);
    hero.removeEventListener('pointerdown', onActivate);
    renderer.dispose();
    scene.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) obj.material.dispose();
    });
  };
}
