// ===============================
// MODE DETECTION
// ===============================
const params = new URLSearchParams(window.location.search);
const ADMIN_MODE = params.has("admin");

if(!ADMIN_MODE){
  document.getElementById("adminPanel").style.display = "none";
}

// ===============================
// DEMO ALBUM (fallback)
// ===============================
const DEMO_ALBUM = [
"https://images.unsplash.com/photo-1529636798458-92182e662485",
"https://images.unsplash.com/photo-1519741497674-611481863552",
"https://images.unsplash.com/photo-1500530855697-b586d89ba3ee",
"https://images.unsplash.com/photo-1529333166437-7750a6dd5a70",
"https://images.unsplash.com/photo-1492724441997-5dc865305da7",
"https://images.unsplash.com/photo-1522673607200-164d1b6ce486"
];

// ===============================
// SMART ALBUM LOADER
// ===============================
function loadAlbum(){
  const saved = JSON.parse(localStorage.getItem("album") || "[]");
  if(saved.length === 0 && !ADMIN_MODE) return DEMO_ALBUM;
  return saved;
}

// ===============================
// IMAGE OPTIMIZER (resize + webp)
// ===============================
async function resizeAndConvert(file){
  const img = new Image();
  img.src = URL.createObjectURL(file);
  await img.decode();

  const canvas = document.createElement("canvas");
  const max = 2048;
  let w = img.width, h = img.height;

  if(w > max || h > max){
    const scale = Math.min(max/w, max/h);
    w *= scale; h *= scale;
  }

  canvas.width = w;
  canvas.height = h;
  canvas.getContext("2d").drawImage(img,0,0,w,h);

  return canvas.toDataURL("image/webp",0.8);
}

// ===============================
// ADMIN SAVE
// ===============================
async function saveImages(){
  if(!ADMIN_MODE) return alert("Open site with ?admin");

  const files = document.getElementById("frontUpload").files;
  if(files.length === 0) return alert("Select images");

  const imgs = [];
  for(const file of files){
    imgs.push(await resizeAndConvert(file));
  }

  localStorage.setItem("album", JSON.stringify(imgs));
  alert("Album Saved! Reload page.");
}

// ===============================
// THREE SCENE
// ===============================
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111);

const camera = new THREE.PerspectiveCamera(45, innerWidth/innerHeight,0.1,100);
camera.position.set(0,1.5,4);

const renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setSize(innerWidth,innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
document.getElementById("scene").appendChild(renderer.domElement);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enablePan=false;
controls.enableZoom=false;

scene.add(new THREE.AmbientLight(0xffffff,1.2));
const light = new THREE.DirectionalLight(0xffffff,1.2);
light.position.set(3,5,4);
scene.add(light);

// ===============================
// BOOK SYSTEM
// ===============================
const PAGE_WIDTH = 1.6;
const PAGE_HEIGHT = 2.2;
const PAGE_SEGMENTS = 30;
let pages = [];

function createPage(frontImg, backImg, index){

  const geo = new THREE.PlaneGeometry(
    PAGE_WIDTH, PAGE_HEIGHT, PAGE_SEGMENTS, PAGE_SEGMENTS
  );

  const loader = new THREE.TextureLoader();
  const frontTexture = loader.load(frontImg);
  const backTexture  = loader.load(backImg);

  const mat = new THREE.MeshStandardMaterial({
    map: frontTexture,
    side: THREE.DoubleSide
  });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.z = -index * 0.003;
  scene.add(mesh);

  mesh.userData = { flipped:false, progress:0 };
  pages.push(mesh);
}

// CREATE BOOK AFTER LOAD
window.addEventListener("load", ()=>{
  const album = loadAlbum();
  for(let i=0;i<album.length;i++){
    createPage(album[i], album[i+1] || album[0], i);
  }
});

// ===============================
// PAGE FLIP
// ===============================
let currentPage = 0;

function flipPage(dir){
  const page = pages[currentPage];
  if(!page) return;
  page.userData.flipped = !page.userData.flipped;
  currentPage = Math.max(0, Math.min(pages.length-1, currentPage+dir));
}

window.addEventListener("click",()=>flipPage(1));

// ===============================
// CURL ANIMATION
// ===============================
function animate(){
  requestAnimationFrame(animate);

  pages.forEach(page=>{
    const ud = page.userData;
    if(ud.flipped && ud.progress < 1) ud.progress += 0.05;
    if(!ud.flipped && ud.progress > 0) ud.progress -= 0.05;

    const pos = page.geometry.attributes.position;
    for(let i=0;i<pos.count;i++){
      const x = pos.getX(i);
      const curl = Math.sin(ud.progress*Math.PI)*0.6;
      pos.setZ(i, curl*(x/PAGE_WIDTH));
    }
    pos.needsUpdate = true;
    page.rotation.y = -ud.progress*Math.PI;
  });

  renderer.render(scene,camera);
}
animate();

// ===============================
// GESTURES + MUSIC + FULLSCREEN
// ===============================
let touchStartX=0;
window.addEventListener("touchstart",e=>touchStartX=e.touches[0].clientX);
window.addEventListener("touchend",e=>{
  if(e.changedTouches[0].clientX < touchStartX) flipPage(1);
  else flipPage(-1);
});

function toggleFullscreen(){
  if(!document.fullscreenElement)
    document.body.requestFullscreen();
  else document.exitFullscreen();
}

document.body.addEventListener("click",()=>{
  document.getElementById("bgMusic").play();
},{once:true});
