// ===============================
// ADMIN LOGIN SYSTEM
// ===============================
// TEMP AUTH BYPASS
const user = {
  name: "Guest User",
  email: "guest@demo.com"
};

console.log("Auth bypass enabled");

const ADMIN_PASSWORD = "1234";

function login(){
  const pass = prompt("Enter Admin Password");
  if(pass === ADMIN_PASSWORD){
    localStorage.setItem("isAdmin","true");
    location.reload();
  }else{
    alert("Wrong password");
  }
}

function logout(){
  localStorage.removeItem("isAdmin");
  location.reload();
}

const isAdmin = localStorage.getItem("isAdmin") === "true";

window.addEventListener("DOMContentLoaded", ()=>{
  const adminPanel = document.getElementById("adminPanel");
  if(!isAdmin) adminPanel.style.display = "none";
});

// ===============================
// THREE SCENE
// ===============================
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0e0e0e);

const camera = new THREE.PerspectiveCamera(45, innerWidth/innerHeight, 0.1, 100);
camera.position.set(0,1.6,4);

const renderer = new THREE.WebGLRenderer({antialias:true, powerPreference:"high-performance"});
renderer.setSize(innerWidth,innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
document.getElementById("scene").appendChild(renderer.domElement);

// lighting
scene.add(new THREE.AmbientLight(0xffffff,1.4));
const light = new THREE.DirectionalLight(0xffffff,1.5);
light.position.set(5,6,5);
scene.add(light);

// responsive
window.addEventListener("resize",()=>{
  renderer.setSize(innerWidth,innerHeight);
  camera.aspect = innerWidth/innerHeight;
  camera.updateProjectionMatrix();
});

// ===============================
// BOOK SETTINGS
// ===============================
const PAGE_WIDTH = 1.6;
const PAGE_HEIGHT = 2.2;
const PAGE_SEGMENTS = 40;

let pages = [];
let currentPage = 0;

// ===============================
// ALBUM STORAGE (LOCAL)
// ===============================
let album = JSON.parse(localStorage.getItem("album") || "[]");

// admin upload images
function saveImages(){
  const files = document.getElementById("frontUpload").files;
  if(!files.length) return alert("Select images");

  const readers = [];
  for(let file of files){
    readers.push(new Promise(res=>{
      const reader = new FileReader();
      reader.onload = e=>res(e.target.result);
      reader.readAsDataURL(file);
    }));
  }

  Promise.all(readers).then(imgs=>{
    album = imgs.slice(0,22); // max 22 pages
    localStorage.setItem("album", JSON.stringify(album));
    alert("Album saved!");
    location.reload();
  });
}

// ===============================
// PAGE CREATION
// ===============================
function createPage(frontImg, backImg, index){

  const geo = new THREE.PlaneGeometry(
    PAGE_WIDTH, PAGE_HEIGHT, PAGE_SEGMENTS, PAGE_SEGMENTS
  );

  const loader = new THREE.TextureLoader();
  const frontTex = loader.load(frontImg);
  const backTex  = loader.load(backImg);

  const frontMat = new THREE.MeshStandardMaterial({map:frontTex, side:THREE.FrontSide});
  const backMat  = new THREE.MeshStandardMaterial({map:backTex,  side:THREE.BackSide});

  const mesh = new THREE.Mesh(geo,[frontMat,backMat]);
  mesh.position.z = -index * 0.003;
  scene.add(mesh);

  mesh.userData = {flipped:false, progress:0};
  pages.push(mesh);
}

// build book from album
album.forEach((img,i)=>{
  const front = img;
  const back  = album[i+1] || img;
  createPage(front, back, i);
});

// ===============================
// PAGE FLIP
// ===============================
function flipPage(dir){
  if(dir===1 && currentPage>=pages.length) return;
  if(dir===-1 && currentPage<=0) return;

  const page = pages[currentPage];
  if(!page) return;

  page.userData.flipped = !page.userData.flipped;
  currentPage += dir;
}

window.addEventListener("click",()=>flipPage(1));

// mobile swipe
let touchStartX = 0;
window.addEventListener("touchstart",e=>touchStartX=e.touches[0].clientX);
window.addEventListener("touchend",e=>{
  if(e.changedTouches[0].clientX < touchStartX) flipPage(1);
  else flipPage(-1);
});

// ===============================
// PAGE CURL PHYSICS
// ===============================
function animate(){
  requestAnimationFrame(animate);

  pages.forEach(page=>{
    const ud = page.userData;

    if(ud.flipped && ud.progress<1) ud.progress += 0.05;
    if(!ud.flipped && ud.progress>0) ud.progress -= 0.05;

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
// FULLSCREEN + MUSIC FIX
// ===============================
function toggleFullscreen(){
  if(!document.fullscreenElement) document.body.requestFullscreen();
  else document.exitFullscreen();
}

document.body.addEventListener("click",()=>{
  const music = document.getElementById("bgMusic");
  if(music) music.play();
},{once:true});
