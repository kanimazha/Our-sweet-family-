// ===== Scene Setup =====
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth/window.innerHeight, 0.1, 100);
camera.position.set(0,1.5,4);

const renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.getElementById("scene").appendChild(renderer.domElement);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableZoom=false;
controls.enablePan=false;

// ===== Lights =====
scene.add(new THREE.AmbientLight(0xffffff,1.2));
const light = new THREE.DirectionalLight(0xffffff,1.2);
light.position.set(3,5,4);
scene.add(light);

// ===== Responsive =====
window.addEventListener("resize",()=>{
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
});

// ===== Book Parameters =====
const PAGE_WIDTH = 1.6;
const PAGE_HEIGHT = 2.2;
const PAGE_SEGMENTS = 30;
let pages = [];

// ===== Load Album =====
function loadAlbum(){
  return JSON.parse(localStorage.getItem("album") || "[]");
}

// ===== Save Uploaded Images (max 30) =====
function saveImages(){
  const files = document.getElementById("frontUpload").files;

  if(files.length > 30){
    alert("Maximum 30 images മാത്രം upload ചെയ്യാം");
    return;
  }

  let readerPromises = [];
  for(let f of files){
    readerPromises.push(new Promise(res=>{
      let reader = new FileReader();
      reader.onload = e => res(e.target.result);
      reader.readAsDataURL(f);
    }));
  }

  Promise.all(readerPromises).then(imgs=>{
    localStorage.setItem("album", JSON.stringify(imgs));
    location.reload();
  });
}

// ===== Create Page Mesh =====
function createPage(frontImg, backImg, index){

  const geometry = new THREE.PlaneGeometry(
    PAGE_WIDTH, PAGE_HEIGHT, PAGE_SEGMENTS, PAGE_SEGMENTS
  );

  const loader = new THREE.TextureLoader();
  const frontTexture = loader.load(frontImg);
  const backTexture  = loader.load(backImg);

  // FRONT MATERIAL
  const frontMaterial = new THREE.MeshStandardMaterial({
    map: frontTexture,
    side: THREE.FrontSide
  });

  // BACK MATERIAL
  const backMaterial = new THREE.MeshStandardMaterial({
    map: backTexture,
    side: THREE.BackSide
  });

  const mesh = new THREE.Mesh(geometry, [frontMaterial, backMaterial]);
  mesh.position.z = -index * 0.003;
  scene.add(mesh);

  mesh.userData = {
    flipped:false,
    progress:0
  };

  pages.push(mesh);
}

// ===== CREATE BOOK (FIXED PAIRING) =====
const album = loadAlbum();

if(album.length < 2){
  alert("Upload photos to create album");
}

let pageIndex = 0;

// 30 images → 15 pages
for(let i=0; i < album.length; i += 2){
  const front = album[i];
  const back  = album[i+1] || album[i]; // duplicate if odd
  createPage(front, back, pageIndex);
  pageIndex++;
}

// ===== Page Flip =====
let currentPage = 0;

function flipPage(dir){
  if(dir === 1 && currentPage >= pages.length) return;
  if(dir === -1 && currentPage <= 0) return;

  const page = pages[currentPage];
  if(!page) return;

  page.userData.flipped = !page.userData.flipped;
  currentPage += dir;
}

// click flip
window.addEventListener("click",()=>flipPage(1));

// ===== Page Curl Physics =====
function animate(){
  requestAnimationFrame(animate);

  pages.forEach(page=>{
    let ud = page.userData;

    if(ud.flipped && ud.progress < 1) ud.progress += 0.05;
    if(!ud.flipped && ud.progress > 0) ud.progress -= 0.05;

    const pos = page.geometry.attributes.position;

    for(let i=0;i<pos.count;i++){
      let x = pos.getX(i);
      let curl = Math.sin(ud.progress*Math.PI) * 0.6;
      pos.setZ(i, curl * (x/PAGE_WIDTH));
    }

    pos.needsUpdate = true;
    page.rotation.y = -ud.progress * Math.PI;
  });

  renderer.render(scene,camera);
}
animate();

// ===== Mobile Gestures =====
let touchStartX = 0;

window.addEventListener("touchstart",e=>{
  touchStartX = e.touches[0].clientX;
});

window.addEventListener("touchend",e=>{
  if(e.changedTouches[0].clientX < touchStartX) flipPage(1);
  else flipPage(-1);
});

// pinch zoom
let lastDist = 0;
window.addEventListener("touchmove",e=>{
  if(e.touches.length == 2){
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    const dist = Math.sqrt(dx*dx + dy*dy);

    if(lastDist) camera.position.z += (lastDist - dist) * 0.01;
    lastDist = dist;
  }
});

// ===== Fullscreen =====
function toggleFullscreen(){
  if(!document.fullscreenElement) document.body.requestFullscreen();
  else document.exitFullscreen();
}

// ===== Mobile Music Autoplay =====
document.body.addEventListener("click",()=>{
  const music = document.getElementById("bgMusic");
  if(music) music.play();
},{once:true});
