const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let scene;
let camera;
let renderer;
let modelGroup;
let phoneGroup;
let routeCurve;
let traveller;
let routeMaterial;
let cardMeshes = [];
let pinMeshes = [];
let pointerX = 0;
let pointerY = 0;
let pageScrollProgress = 0;
let activeStoryIndex = 0;

function drawRoundRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function makeScreenTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 720;
  canvas.height = 1400;
  const ctx = canvas.getContext("2d");

  const gradient = ctx.createLinearGradient(0, 0, 720, 1400);
  gradient.addColorStop(0, "#111b21");
  gradient.addColorStop(0.45, "#071014");
  gradient.addColorStop(1, "#040708");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 720, 1400);

  ctx.fillStyle = "rgba(77, 217, 255, 0.12)";
  drawRoundRect(ctx, 44, 52, 632, 92, 34);
  ctx.fill();
  ctx.fillStyle = "#edfaff";
  ctx.font = "800 34px Inter, Arial";
  ctx.fillText("IITM Co-traveller", 78, 112);
  ctx.fillStyle = "#7af2af";
  ctx.font = "700 22px Inter, Arial";
  ctx.fillText("Verified", 548, 109);

  ctx.fillStyle = "#dbe9ec";
  ctx.font = "900 56px Inter, Arial";
  ctx.fillText("Chennai", 54, 248);
  ctx.fillStyle = "#809099";
  ctx.font = "700 25px Inter, Arial";
  ctx.fillText("to Coimbatore exam centre", 58, 294);

  ctx.strokeStyle = "rgba(255, 255, 255, 0.13)";
  ctx.lineWidth = 2;
  drawRoundRect(ctx, 54, 342, 612, 380, 42);
  ctx.stroke();

  ctx.fillStyle = "rgba(77, 217, 255, 0.09)";
  drawRoundRect(ctx, 74, 362, 572, 340, 32);
  ctx.fill();

  ctx.strokeStyle = "#4dd9ff";
  ctx.lineWidth = 12;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(128, 620);
  ctx.bezierCurveTo(230, 500, 312, 665, 420, 540);
  ctx.bezierCurveTo(498, 452, 560, 506, 603, 418);
  ctx.stroke();

  const stops = [
    [128, 620, "#7af2af"],
    [360, 585, "#f8c96b"],
    [603, 418, "#ff7d66"]
  ];
  stops.forEach(([x, y, color]) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, 19, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#071014";
    ctx.beginPath();
    ctx.arc(x, y, 7, 0, Math.PI * 2);
    ctx.fill();
  });

  const cards = [
    ["92%", "Route match", "#f8c96b", 54, 776],
    ["3", "Seats open", "#7af2af", 272, 776],
    ["2.4 km", "Midway join", "#4dd9ff", 490, 776]
  ];

  cards.forEach(([value, label, color, x, y]) => {
    ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
    drawRoundRect(ctx, x, y, 176, 146, 28);
    ctx.fill();
    ctx.fillStyle = color;
    ctx.font = "900 38px Inter, Arial";
    ctx.fillText(value, x + 22, y + 62);
    ctx.fillStyle = "#a6b0b6";
    ctx.font = "700 20px Inter, Arial";
    ctx.fillText(label, x + 22, y + 100);
  });

  ctx.fillStyle = "#f5f7f8";
  ctx.font = "900 30px Inter, Arial";
  ctx.fillText("Suggested co-travellers", 54, 1012);

  const rows = [
    ["Aarav", "Foundation", "Tamil, English", "96"],
    ["Meera", "Diploma", "English, Hindi", "91"],
    ["Sanjay", "Degree", "Tamil, Telugu", "88"]
  ];

  rows.forEach((row, index) => {
    const y = 1052 + index * 104;
    ctx.fillStyle = "rgba(255, 255, 255, 0.07)";
    drawRoundRect(ctx, 54, y, 612, 78, 24);
    ctx.fill();
    ctx.fillStyle = ["#4dd9ff", "#7af2af", "#f8c96b"][index];
    ctx.beginPath();
    ctx.arc(92, y + 39, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#f5f7f8";
    ctx.font = "800 23px Inter, Arial";
    ctx.fillText(row[0], 130, y + 34);
    ctx.fillStyle = "#8f9ba2";
    ctx.font = "700 18px Inter, Arial";
    ctx.fillText(`${row[1]} / ${row[2]}`, 130, y + 61);
    ctx.fillStyle = "#f8c96b";
    ctx.font = "900 24px Inter, Arial";
    ctx.fillText(`${row[3]}%`, 598, y + 48);
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.encoding = THREE.sRGBEncoding;
  texture.anisotropy = 4;
  return texture;
}

function makePanelTexture(title, value, footer, accent) {
  const canvas = document.createElement("canvas");
  canvas.width = 640;
  canvas.height = 320;
  const ctx = canvas.getContext("2d");

  const gradient = ctx.createLinearGradient(0, 0, 640, 320);
  gradient.addColorStop(0, "rgba(17, 25, 31, 0.96)");
  gradient.addColorStop(1, "rgba(6, 10, 12, 0.96)");
  ctx.fillStyle = gradient;
  drawRoundRect(ctx, 8, 8, 624, 304, 34);
  ctx.fill();

  ctx.strokeStyle = "rgba(255, 255, 255, 0.18)";
  ctx.lineWidth = 3;
  drawRoundRect(ctx, 8, 8, 624, 304, 34);
  ctx.stroke();

  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.arc(70, 72, 18, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#a6b0b6";
  ctx.font = "800 28px Inter, Arial";
  ctx.fillText(title, 108, 82);

  ctx.fillStyle = "#f5f7f8";
  ctx.font = "900 76px Inter, Arial";
  ctx.fillText(value, 54, 188);

  ctx.fillStyle = "#d3dde1";
  ctx.font = "700 28px Inter, Arial";
  ctx.fillText(footer, 58, 248);

  const texture = new THREE.CanvasTexture(canvas);
  texture.encoding = THREE.sRGBEncoding;
  texture.anisotropy = 4;
  return texture;
}

function roundedRectShape(width, height, radius) {
  const x = -width / 2;
  const y = -height / 2;
  const shape = new THREE.Shape();
  shape.moveTo(x + radius, y);
  shape.lineTo(x + width - radius, y);
  shape.quadraticCurveTo(x + width, y, x + width, y + radius);
  shape.lineTo(x + width, y + height - radius);
  shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  shape.lineTo(x + radius, y + height);
  shape.quadraticCurveTo(x, y + height, x, y + height - radius);
  shape.lineTo(x, y + radius);
  shape.quadraticCurveTo(x, y, x + radius, y);
  return shape;
}

function makeRoundedBox(width, height, depth, radius, material) {
  const geometry = new THREE.ExtrudeGeometry(roundedRectShape(width, height, radius), {
    depth,
    bevelEnabled: true,
    bevelSegments: 10,
    bevelSize: 0.06,
    bevelThickness: 0.06,
    curveSegments: 18
  });
  geometry.center();
  return new THREE.Mesh(geometry, material);
}

function makePin(color) {
  const pin = new THREE.Group();
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.13, 24, 24),
    new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.45, metalness: 0.2, roughness: 0.28 })
  );
  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.035, 0.07, 0.42, 18),
    new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.28, metalness: 0.15, roughness: 0.32 })
  );
  stem.position.y = -0.26;
  pin.add(head, stem);
  return pin;
}

function makeTraveller() {
  const group = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.34, 0.16, 0.18),
    new THREE.MeshStandardMaterial({ color: 0xf8c96b, emissive: 0xf8c96b, emissiveIntensity: 0.24, metalness: 0.25, roughness: 0.24 })
  );
  const cabin = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.12, 0.16),
    new THREE.MeshStandardMaterial({ color: 0x4dd9ff, emissive: 0x4dd9ff, emissiveIntensity: 0.18, metalness: 0.18, roughness: 0.18 })
  );
  cabin.position.set(-0.02, 0.12, 0);

  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x06090a, metalness: 0.4, roughness: 0.4 });
  [-0.11, 0.11].forEach((x) => {
    [-0.11, 0.11].forEach((z) => {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.035, 18), wheelMat);
      wheel.rotation.x = Math.PI / 2;
      wheel.position.set(x, -0.09, z);
      group.add(wheel);
    });
  });

  group.add(body, cabin);
  group.scale.setScalar(1.15);
  return group;
}

function createPhoneModel() {
  phoneGroup = new THREE.Group();
  phoneGroup.rotation.set(-0.08, -0.38, 0.08);

  const frameMaterial = new THREE.MeshStandardMaterial({
    color: 0x11181d,
    metalness: 0.82,
    roughness: 0.22,
    envMapIntensity: 1
  });
  const edgeMaterial = new THREE.MeshStandardMaterial({
    color: 0x29343b,
    metalness: 0.9,
    roughness: 0.18
  });
  const glassMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x0a1013,
    metalness: 0.1,
    roughness: 0.08,
    transmission: 0.05,
    transparent: true,
    opacity: 0.18,
    depthWrite: false,
    clearcoat: 1,
    clearcoatRoughness: 0.08
  });

  const body = makeRoundedBox(3.05, 6.45, 0.34, 0.44, frameMaterial);
  const edge = makeRoundedBox(3.18, 6.58, 0.18, 0.5, edgeMaterial);
  edge.position.z = -0.08;

  const glass = makeRoundedBox(2.82, 6.12, 0.035, 0.34, glassMaterial);
  glass.position.z = 0.21;

  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(2.62, 5.72),
    new THREE.MeshBasicMaterial({ map: makeScreenTexture(), transparent: true })
  );
  screen.position.z = 0.3;

  const speaker = makeRoundedBox(0.62, 0.08, 0.018, 0.04, new THREE.MeshStandardMaterial({ color: 0x030506, metalness: 0.4, roughness: 0.22 }));
  speaker.position.set(0, 2.82, 0.34);

  const cameraIsland = makeRoundedBox(0.58, 0.22, 0.024, 0.1, new THREE.MeshStandardMaterial({ color: 0x05080a, metalness: 0.55, roughness: 0.22 }));
  cameraIsland.position.set(0.86, 2.82, 0.345);

  const lens = new THREE.Mesh(
    new THREE.CircleGeometry(0.07, 32),
    new THREE.MeshStandardMaterial({ color: 0x4dd9ff, emissive: 0x4dd9ff, emissiveIntensity: 0.4 })
  );
  lens.position.set(0.73, 2.82, 0.365);

  const sideButton = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.8, 0.08), edgeMaterial);
  sideButton.position.set(1.63, 1.1, 0.02);
  const volumeButton = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.68, 0.08), edgeMaterial);
  volumeButton.position.set(-1.63, 1.35, 0.02);

  phoneGroup.add(edge, body, glass, screen, speaker, cameraIsland, lens, sideButton, volumeButton);
  return phoneGroup;
}

function createRouteSystem() {
  const group = new THREE.Group();

  const ringMaterial = new THREE.MeshStandardMaterial({
    color: 0x18232a,
    emissive: 0x4dd9ff,
    emissiveIntensity: 0.08,
    metalness: 0.55,
    roughness: 0.32
  });
  const torusA = new THREE.Mesh(new THREE.TorusGeometry(3.8, 0.018, 14, 160), ringMaterial);
  torusA.rotation.set(Math.PI / 2.2, 0.28, -0.22);
  torusA.position.z = -0.65;

  const torusB = new THREE.Mesh(new THREE.TorusGeometry(4.55, 0.012, 14, 160), ringMaterial);
  torusB.rotation.set(Math.PI / 2.35, -0.3, 0.18);
  torusB.position.z = -0.95;

  routeCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-3.35, -1.72, 0.42),
    new THREE.Vector3(-2.25, -0.58, 0.8),
    new THREE.Vector3(-0.98, -1.06, 0.95),
    new THREE.Vector3(0.54, 0.12, 1.08),
    new THREE.Vector3(1.9, 0.52, 0.86),
    new THREE.Vector3(3.08, 1.7, 0.52)
  ]);

  routeMaterial = new THREE.MeshStandardMaterial({
    color: 0x4dd9ff,
    emissive: 0x4dd9ff,
    emissiveIntensity: 0.65,
    metalness: 0.15,
    roughness: 0.18
  });

  const tube = new THREE.Mesh(new THREE.TubeGeometry(routeCurve, 180, 0.045, 16, false), routeMaterial);

  const pinStops = [
    { t: 0, color: 0x7af2af },
    { t: 0.46, color: 0xf8c96b },
    { t: 1, color: 0xff7d66 }
  ];

  pinStops.forEach((stop) => {
    const pin = makePin(stop.color);
    const point = routeCurve.getPointAt(stop.t);
    pin.position.copy(point);
    pin.position.y += 0.45;
    pinMeshes.push(pin);
    group.add(pin);
  });

  traveller = makeTraveller();
  group.add(torusA, torusB, tube, traveller);
  return group;
}

function createFloatingPanel(title, value, footer, accent, position, rotation) {
  const texture = makePanelTexture(title, value, footer, accent);
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    side: THREE.DoubleSide
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2.18, 1.09), material);
  mesh.position.set(position.x, position.y, position.z);
  mesh.rotation.set(rotation.x, rotation.y, rotation.z);
  cardMeshes.push(mesh);
  return mesh;
}

function createSceneObjects() {
  modelGroup = new THREE.Group();
  modelGroup.position.set(0, -0.1, 0);

  const phone = createPhoneModel();
  const routes = createRouteSystem();

  const panelA = createFloatingPanel("Route match", "92%", "Tambaram to Coimbatore", "#f8c96b", { x: -3.25, y: 1.72, z: 0.72 }, { x: 0.02, y: 0.28, z: -0.08 });
  const panelB = createFloatingPanel("Exam group", "22", "Students same centre", "#7af2af", { x: 2.9, y: -1.35, z: 0.92 }, { x: -0.04, y: -0.36, z: 0.07 });
  const panelC = createFloatingPanel("Midway joins", "5", "Pickup points found", "#4dd9ff", { x: 2.74, y: 1.55, z: -0.22 }, { x: 0.08, y: -0.42, z: 0.04 });

  modelGroup.add(routes, phone, panelA, panelB, panelC);
  scene.add(modelGroup);
}

function initThreeModel() {
  const canvas = document.getElementById("route-model");
  if (!canvas || !window.THREE) return;

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  camera.position.set(0.55, 0.12, 10.6);

  renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputEncoding = THREE.sRGBEncoding;

  const ambient = new THREE.AmbientLight(0xffffff, 0.72);
  const key = new THREE.DirectionalLight(0xffffff, 1.4);
  key.position.set(4, 6, 8);
  const cyan = new THREE.PointLight(0x4dd9ff, 1.9, 12);
  cyan.position.set(-3.2, 2.2, 3.5);
  const amber = new THREE.PointLight(0xf8c96b, 1.25, 10);
  amber.position.set(3.1, -2, 3.2);
  const coral = new THREE.PointLight(0xff7d66, 0.85, 10);
  coral.position.set(2.7, 2.9, 1.4);
  scene.add(ambient, key, cyan, amber, coral);

  createSceneObjects();

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const width = Math.max(1, rect.width);
    const height = Math.max(1, rect.height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);

    if (modelGroup) {
      const compact = width < 600;
      modelGroup.scale.setScalar(compact ? 0.82 : 1);
      modelGroup.position.x = compact ? 0.02 : 0.18;
    }
  }

  resize();
  window.addEventListener("resize", resize);

  document.addEventListener("pointermove", (event) => {
    pointerX = (event.clientX / window.innerWidth - 0.5) * 2;
    pointerY = (event.clientY / window.innerHeight - 0.5) * 2;
  });

  animateModel();
}

function animateModel() {
  if (!renderer || !scene || !camera) return;

  const time = performance.now() * 0.001;

  if (modelGroup && !prefersReducedMotion) {
    modelGroup.rotation.y = Math.sin(time * 0.32) * 0.08 + pointerX * 0.08 + pageScrollProgress * 0.42;
    modelGroup.rotation.x = Math.sin(time * 0.24) * 0.025 - pointerY * 0.035 - pageScrollProgress * 0.08;
    modelGroup.position.y = Math.sin(time * 0.62) * 0.08 - pageScrollProgress * 0.18;
  }

  if (phoneGroup && !prefersReducedMotion) {
    phoneGroup.position.y = Math.sin(time * 0.95) * 0.05;
  }

  if (routeMaterial && !prefersReducedMotion) {
    routeMaterial.emissiveIntensity = 0.52 + Math.sin(time * 2.4) * 0.16;
  }

  if (traveller && routeCurve && !prefersReducedMotion) {
    const progress = (time * 0.08) % 1;
    const point = routeCurve.getPointAt(progress);
    const next = routeCurve.getPointAt((progress + 0.012) % 1);
    traveller.position.copy(point);
    traveller.position.y += 0.22;
    traveller.lookAt(next);
  }

  if (!prefersReducedMotion) {
    cardMeshes.forEach((mesh, index) => {
      mesh.position.y += Math.sin(time * 1.1 + index) * 0.0016;
    });

    pinMeshes.forEach((pin, index) => {
      pin.scale.setScalar(1 + Math.sin(time * 2.1 + index) * 0.035);
    });
  }

  renderer.render(scene, camera);
  requestAnimationFrame(animateModel);
}

function updateScrollProgress() {
  const hero = document.querySelector(".hero");
  if (!hero) return;
  const rect = hero.getBoundingClientRect();
  const distance = Math.max(1, rect.height);
  pageScrollProgress = Math.min(1, Math.max(0, -rect.top / distance));
}

function updateStoryScreen(chapter, index) {
  const storyPhone = document.querySelector(".story-phone");
  const label = document.getElementById("story-label");
  const title = document.getElementById("story-title");
  const copy = document.getElementById("story-copy");
  const metricA = document.getElementById("story-metric-a");
  const metricB = document.getElementById("story-metric-b");
  const metricLabelA = document.getElementById("story-metric-label-a");
  const metricLabelB = document.getElementById("story-metric-label-b");
  const routeWidget = document.querySelector(".route-widget");
  if (!chapter || !storyPhone || !label || !title || !copy || !metricA || !metricB || !metricLabelA || !metricLabelB || !routeWidget) return;

  activeStoryIndex = index;
  label.textContent = `Step ${String(index + 1).padStart(2, "0")}`;
  title.textContent = chapter.dataset.storyTitle || "";
  copy.textContent = chapter.dataset.storyCopy || "";
  metricA.textContent = chapter.dataset.storyA || "";
  metricB.textContent = chapter.dataset.storyB || "";
  metricLabelA.textContent = chapter.dataset.storyLabelA || "";
  metricLabelB.textContent = chapter.dataset.storyLabelB || "";
  routeWidget.style.setProperty("--route-draw", String(0.42 + index * 0.13));
  storyPhone.style.setProperty("--story-lift", String(index / 4));
}

function initStoryChapters() {
  const chapters = [...document.querySelectorAll(".story-chapter")];
  if (!chapters.length) return;

  updateStoryScreen(chapters[0], 0);

  const observer = new IntersectionObserver((entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!visible) return;
    const index = chapters.indexOf(visible.target);
    chapters.forEach((chapter) => chapter.classList.toggle("active", chapter === visible.target));
    updateStoryScreen(visible.target, index);
  }, {
    rootMargin: "-36% 0px -36% 0px",
    threshold: [0.08, 0.24, 0.42, 0.64]
  });

  chapters.forEach((chapter) => observer.observe(chapter));

  window.addEventListener("scroll", () => {
    const phone = document.querySelector(".story-phone");
    if (!phone || prefersReducedMotion) return;
    const cinematic = document.querySelector(".cinematic");
    if (!cinematic) return;
    const rect = cinematic.getBoundingClientRect();
    const progress = Math.min(1, Math.max(0, -rect.top / Math.max(1, rect.height - window.innerHeight)));
    phone.style.setProperty("--story-tilt-x", `${Math.sin(progress * Math.PI) * 6}deg`);
    phone.style.setProperty("--story-tilt-y", `${Math.cos(progress * Math.PI * 0.7) * 3}deg`);
  }, { passive: true });
}

function initDepthCards() {
  const cards = document.querySelectorAll("[data-depth-card]");
  cards.forEach((card) => {
    card.addEventListener("pointermove", (event) => {
      if (prefersReducedMotion) return;
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;
      card.style.setProperty("--mx", `${x * 100}%`);
      card.style.setProperty("--my", `${y * 100}%`);
      card.style.setProperty("--rx", `${(0.5 - y) * 5}deg`);
      card.style.setProperty("--ry", `${(x - 0.5) * 6}deg`);
    });

    card.addEventListener("pointerleave", () => {
      card.style.setProperty("--rx", "0deg");
      card.style.setProperty("--ry", "0deg");
      card.style.setProperty("--mx", "50%");
      card.style.setProperty("--my", "30%");
    });
  });
}

function initNavigation() {
  const navbar = document.getElementById("navbar");
  const navToggle = document.getElementById("nav-toggle");
  const navMenu = document.getElementById("nav-menu");

  window.addEventListener("scroll", () => {
    navbar?.classList.toggle("scrolled", window.scrollY > 20);
  });

  navToggle?.addEventListener("click", () => {
    const open = navMenu?.classList.toggle("open") || false;
    navToggle.setAttribute("aria-expanded", String(open));
  });

  document.querySelectorAll("[data-scroll], a[href^='#']").forEach((element) => {
    element.addEventListener("click", (event) => {
      const targetSelector = element.getAttribute("data-scroll") || element.getAttribute("href");
      const target = targetSelector ? document.querySelector(targetSelector) : null;
      if (!target) return;
      event.preventDefault();
      navMenu?.classList.remove("open");
      navToggle?.setAttribute("aria-expanded", "false");
      target.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "start" });
    });
  });
}

function initReveal() {
  const elements = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window)) {
    elements.forEach((element) => element.classList.add("visible"));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  elements.forEach((element) => observer.observe(element));
}

function initFilters() {
  document.querySelectorAll("[data-filter-group]").forEach((group) => {
    group.addEventListener("click", (event) => {
      const button = event.target.closest("button");
      if (!button) return;
      const multiSelect = group.classList.contains("chip-cloud");
      if (multiSelect) {
        button.classList.toggle("active");
        return;
      }
      group.querySelectorAll("button").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
    });
  });

  document.querySelectorAll(".subject-pill").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".subject-pill").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
    });
  });
}

function initHighlightCarousel() {
  const carousel = document.getElementById("highlight-carousel");
  const dots = document.getElementById("highlight-dots");
  const cards = carousel ? [...carousel.querySelectorAll(".highlight-card")] : [];
  const prev = document.querySelector("[data-highlight-prev]");
  const next = document.querySelector("[data-highlight-next]");
  if (!carousel || !dots || !cards.length) return;

  cards.forEach((_, index) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.setAttribute("aria-label", `Go to highlight ${index + 1}`);
    dot.addEventListener("click", () => {
      cards[index].scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", inline: "start", block: "nearest" });
    });
    dots.appendChild(dot);
  });

  const dotButtons = [...dots.querySelectorAll("button")];

  function updateDots() {
    const center = carousel.scrollLeft + carousel.clientWidth / 2;
    let activeIndex = 0;
    let activeDistance = Infinity;
    cards.forEach((card, index) => {
      const cardCenter = card.offsetLeft + card.offsetWidth / 2;
      const distance = Math.abs(center - cardCenter);
      if (distance < activeDistance) {
        activeDistance = distance;
        activeIndex = index;
      }
    });
    dotButtons.forEach((dot, index) => dot.classList.toggle("active", index === activeIndex));
  }

  function scrollByCard(direction) {
    const firstCard = cards[0];
    const gap = parseFloat(getComputedStyle(carousel).columnGap || getComputedStyle(carousel).gap) || 18;
    carousel.scrollBy({
      left: direction * (firstCard.offsetWidth + gap),
      behavior: prefersReducedMotion ? "auto" : "smooth"
    });
  }

  prev?.addEventListener("click", () => scrollByCard(-1));
  next?.addEventListener("click", () => scrollByCard(1));
  carousel.addEventListener("scroll", updateDots, { passive: true });
  window.addEventListener("resize", updateDots);
  updateDots();
}

document.addEventListener("DOMContentLoaded", () => {
  if (window.lucide) {
    window.lucide.createIcons();
  }

  initNavigation();
  initReveal();
  initFilters();
  initHighlightCarousel();
  initStoryChapters();
  initDepthCards();
  updateScrollProgress();
  window.addEventListener("scroll", updateScrollProgress, { passive: true });
  initThreeModel();
});
