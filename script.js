import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { OrbitControls } from "https://unpkg.com/three@0.160.0/examples/jsm/controls/OrbitControls.js";

let scene, camera, renderer, controls;
let book;
let pages = [];
let currentPage = 0;
let isFlipping = false;

const PAGE_WIDTH = 4;
const PAGE_HEIGHT = 6;
const PAGE_THICKNESS = 0.015;
const COVER_THICKNESS = 0.18;
const TOTAL_PAGES = 8;

init();
animate();

function init() {

  const container = document.getElementById("container");

  // Scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1e1e1e);

  // Camera
  camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  );
  camera.position.set(0, 6, 10);

  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;

  // Color + tone mapping (prevents black mobile issue)
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;

  container.appendChild(renderer.domElement);

  // Controls
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.enablePan = false;
  controls.minDistance = 6;
  controls.maxDistance = 14;
  controls.maxPolarAngle = Math.PI / 2.1;

  setupLighting();
  createTable();
  createBook();

  window.addEventListener("resize", onResize);
  window.addEventListener("pointerdown", handleFlip);
}

function setupLighting() {

  const ambient = new THREE.AmbientLight(0xffffff, 0.4);
  scene.add(ambient);

  const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
  dirLight.position.set(5, 10, 5);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.set(2048, 2048);
  scene.add(dirLight);

  const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
  fillLight.position.set(-5, 5, -5);
  scene.add(fillLight);
}

function createTable() {

  const tableGeo = new THREE.PlaneGeometry(30, 30);
  const tableMat = new THREE.MeshStandardMaterial({
    color: 0x3a2a1d,
    roughness: 0.9,
    metalness: 0.1
  });

  const table = new THREE.Mesh(tableGeo, tableMat);
  table.rotation.x = -Math.PI / 2;
  table.receiveShadow = true;

  scene.add(table);
}

function createBook() {

  book = new THREE.Group();
  scene.add(book);

  const coverMaterial = new THREE.MeshStandardMaterial({
    color: 0x4b1e1e,
    roughness: 0.6,
    metalness: 0.2
  });

  const pageMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.95,
    metalness: 0
  });

  // FRONT COVER
  const frontCover = new THREE.Mesh(
    new THREE.BoxGeometry(PAGE_WIDTH, PAGE_HEIGHT, COVER_THICKNESS),
    coverMaterial
  );

  frontCover.position.set(
    0,
    PAGE_HEIGHT / 2 + COVER_THICKNESS / 2,
    0
  );

  frontCover.castShadow = true;
  frontCover.receiveShadow = true;

  book.add(frontCover);
  pages.push(frontCover);

  // INNER PAGES
  for (let i = 0; i < TOTAL_PAGES; i++) {

    const page = new THREE.Mesh(
      new THREE.BoxGeometry(PAGE_WIDTH, PAGE_HEIGHT, PAGE_THICKNESS),
      pageMaterial
    );

    page.position.set(
      0,
      PAGE_HEIGHT / 2 + COVER_THICKNESS + PAGE_THICKNESS / 2,
      -i * PAGE_THICKNESS - 0.01
    );

    page.castShadow = true;
    page.receiveShadow = true;

    book.add(page);
    pages.push(page);
  }

  // BACK COVER
  const backCover = new THREE.Mesh(
    new THREE.BoxGeometry(PAGE_WIDTH, PAGE_HEIGHT, COVER_THICKNESS),
    coverMaterial
  );

  backCover.position.set(
    0,
    PAGE_HEIGHT / 2 + COVER_THICKNESS / 2,
    -TOTAL_PAGES * PAGE_THICKNESS - COVER_THICKNESS
  );

  backCover.castShadow = true;
  backCover.receiveShadow = true;

  book.add(backCover);
  pages.push(backCover);
}

function handleFlip() {
  if (isFlipping) return;
  flipPage();
}

function flipPage() {

  if (currentPage >= pages.length - 1) return;

  isFlipping = true;
  const page = pages[currentPage];

  const duration = 900;
  const startTime = performance.now();

  function animateFlip(time) {

    let elapsed = time - startTime;
    let progress = Math.min(elapsed / duration, 1);

    // Smooth easing
    progress = progress < 0.5
      ? 2 * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 2) / 2;

    page.rotation.y = -Math.PI * progress;

    if (progress < 1) {
      requestAnimationFrame(animateFlip);
    } else {
      currentPage++;
      isFlipping = false;
    }
  }

  requestAnimationFrame(animateFlip);
}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
