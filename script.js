/* =====================================================
   3D FAMILY FLIPBOOK – PRO VERSION
   Admin / Viewer Mode + Real Page Curl + Optimized
===================================================== */

// ===== MODE DETECTION =====
const isAdmin = window.location.search.includes("admin");

window.addEventListener("DOMContentLoaded", () => {
  const adminPanel = document.getElementById("adminPanel");
  if (!isAdmin && adminPanel) adminPanel.style.display = "none";
});

// ===== THREE SCENE =====
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0e0e0e);

const camera = new THREE.PerspectiveCamera(45, innerWidth/innerHeight, 0.1, 100);
camera.position.set(0,1.6,4);

const renderer = new THREE.WebGLRenderer({antialias:true, powerPreference:"high-performance"});
renderer.setSize(innerWidth,innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio,2)); // 🔥 performance control
document.getElementById("scene").appendChild(renderer.domElement);

// ===== LIGHTING =====
scene.add(new THREE.AmbientLight(0xffffff,1.4));
const dirLight = new THREE.DirectionalLight(0xffffff,1.5);
dirLight.position.set(5,6,5);
scene.add(dirLight);

// ===== RESPONSIVE =====
window.addEventListener("resize",()=>{
  renderer.setSize(innerWidth,innerHeight);
  camera.aspect = innerWidth/innerHeight;
  camera.updateProjectionMatrix();
});

// ===== BOOK SETTINGS =====
const PAGE_WIDTH = 1.6;
const PAGE_HEIGHT = 2.2;
const PAGE_SEGMENTS = 40; // smoother curl
let pages = [];

// ===== ADMIN IMAGE SAVE (max 22) =====
function saveImages(){
  if(!isAdmin){ alert("Admin mode only"); return; }

  const files = document.getElementById("frontUpload").files;
  if(files.length > 22){ alert("Max 22 images മാത്രം"); return; }

  let readers = [];
  for(let f of files){
    readers.push(new Promise(res=>{
      let r = new FileReader();
      r.onload = e => res(e.target.result);
      r.readAsDataURL(f);
    }));
  }

  Promise.all(readers).then(imgs=>{
    localStorage.setItem("album", JSON.stringify(imgs));
    location.reload();
  });
}

// ===== LOAD ALBUM =====
function loadAlbum(){
  return JSON.parse(localStorage.getItem("album") || "[]");
}

// ===== CREATE PAGE (FRONT + BACK FIXED) =====
function createPage(frontImg, backImg, index){

  const geometry = new THREE.PlaneGeometry(
    PAGE_WIDTH, PAGE_HEIGHT, PAGE_SEGMENTS, PAGE_SEGMENTS
  );

  const loader = new THREE.TextureLoader();

  const frontTexture = loader.load(frontImg);
  const backTexture  = loader.load(backImg);

  frontTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  backTexture.anisotropy  = renderer.capabilities.getMaxAnisotropy();

  const materials = [
    new THREE.MeshStandardMaterial({ map: frontTexture, side: THREE.FrontSide }),
    new THREE.MeshStandardMaterial({ map: backTexture,  side: THREE.BackSide  })
  ];

  const page = new THREE.Mesh(geometry, materials);
  page.position.z = -index * 0.0025;
  scene.add(page);

  page.userData = { flipped:false, progress:0 };
  pages.push(page);
}

// ===== BUILD BOOK FROM UPLOADED IMAGES =====
const album = loadAlbum();

if(album.length === 0){
  alert("Admin mode തുറന്ന് images upload ചെയ്യുക");
}

for(let i=0; i<album.length; i+=2){
  let front = album[i];
  let back  = album[i+1] || album[i]; // 🔥 backside bug fixed
  createPage(front, back, i);
}

// ===== PAGE FLIP CONTROL =====
let currentPage = 0;

function flipPage(dir){
  if(dir === 1 && currentPage >= pages.length) return;
  if(dir === -1 && currentPage <= 0) return;

  const page = pages[currentPage];
  if(!page) return;

  page.userData.flipped = !page.userData.flipped;
  currentPage += dir;
}

window.addEventListener("click",()=>flipPage(1));

// ===== REAL PAGE CURL PHYSICS =====
function animate(){
  requestAnimationFrame(animate);

  pages.forEach(page=>{
    let u = page.userData;

    if(u.flipped && u.progress<1) u.progress+=0.045;
    if(!u.flipped && u.progress>0) u.progress-=0.045;

    const pos = page.geometry.attributes.position;

    for(let i=0;i<pos.count;i++){
      let x = pos.getX(i);
      let y = pos.getY(i);

      // realistic bending curve
      let bend = Math.sin(u.progress*Math.PI) * 0.55;
      let lift = Math.pow(x/PAGE_WIDTH,2) * bend;

      pos.setZ(i, lift);
    }

    pos.needsUpdate = true;
    page.rotation.y = -u.progress * Math.PI;
  });

  renderer.render(scene,camera);
}
animate();

// ===== MOBILE SWIPE =====
let touchStartX=0;
window.addEventListener("touchstart",e=> touchStartX=e.touches[0].clientX);
window.addEventListener("touchend",e=>{
  if(e.changedTouches[0].clientX < touchStartX) flipPage(1);
  else flipPage(-1);
});

// ===== PINCH ZOOM =====
let lastDist=0;
window.addEventListener("touchmove",e=>{
  if(e.touches.length===2){
    const dx=e.touches[0].clientX-e.touches[1].clientX;
    const dy=e.touches[0].clientY-e.touches[1].clientY;
    const dist=Math.sqrt(dx*dx+dy*dy);
    if(lastDist) camera.position.z += (lastDist-dist)*0.01;
    lastDist=dist;
  }
});

// ===== FULLSCREEN =====
function toggleFullscreen(){
  if(!document.fullscreenElement) document.body.requestFullscreen();
  else document.exitFullscreen();
}

// ===== MOBILE AUTOPLAY MUSIC =====
document.body.addEventListener("click",()=>{
  const music=document.getElementById("bgMusic");
  if(music) music.play();
},{once:true});
