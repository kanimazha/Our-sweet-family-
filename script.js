// ===============================
// ADMIN LOGIN (TEMP)
// ===============================
const ADMIN_PASSWORD = "1234";

function login(){
  const pass = prompt("Enter Admin Password");
  if(pass === ADMIN_PASSWORD){
    localStorage.setItem("isAdmin","true");
    location.reload();
  } else alert("Wrong password");
}

function logout(){
  localStorage.removeItem("isAdmin");
  location.reload();
}

const isAdmin = localStorage.getItem("isAdmin")==="true";

window.addEventListener("DOMContentLoaded",()=>{
  if(!isAdmin) document.getElementById("adminPanel").style.display="none";
});

// ===============================
// THREE SCENE
// ===============================
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0e0e0e);

const camera = new THREE.PerspectiveCamera(45, innerWidth/innerHeight, 0.1, 100);
camera.position.set(0,1.6,4);

const renderer = new THREE.WebGLRenderer({antialias:true,powerPreference:"high-performance"});
renderer.setSize(innerWidth,innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
document.getElementById("scene").appendChild(renderer.domElement);

// LIGHTING
scene.add(new THREE.AmbientLight(0xffffff,1.4));
const light = new THREE.DirectionalLight(0xffffff,1.6);
light.position.set(5,6,5);
scene.add(light);

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
const PAGE_SEGMENTS = 30;
const PAGE_THICKNESS = 0.003;

let pages=[];
let currentPage=0;

// ===============================
// ALBUM STORAGE
// ===============================
let album = JSON.parse(localStorage.getItem("album") || "[]");

function saveImages(){
  const files = document.getElementById("frontUpload").files;
  if(!files.length) return alert("Select images");

  const readers=[];
  for(let file of files){
    readers.push(new Promise(res=>{
      const reader=new FileReader();
      reader.onload=e=>res(e.target.result);
      reader.readAsDataURL(file);
    }));
  }

  Promise.all(readers).then(imgs=>{
    album = imgs.slice(0,22);
    localStorage.setItem("album", JSON.stringify(album));
    alert("Album saved ✔");
    location.reload();
  });
}

// ===============================
// PAGE CREATION (FIXED)
// ===============================
function createPage(frontImg, backImg, index){

  const geo = new THREE.PlaneGeometry(
    PAGE_WIDTH, PAGE_HEIGHT, PAGE_SEGMENTS, PAGE_SEGMENTS
  );

  const loader = new THREE.TextureLoader();
  const frontTex = loader.load(frontImg);
  const backTex  = loader.load(backImg);

  // performance fix
  frontTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  backTex.anisotropy  = renderer.capabilities.getMaxAnisotropy();

  const materials=[
    new THREE.MeshStandardMaterial({map:frontTex, side:THREE.FrontSide}),
    new THREE.MeshStandardMaterial({map:backTex,  side:THREE.BackSide})
  ];

  const mesh = new THREE.Mesh(geo, materials);
  mesh.position.z = -index * PAGE_THICKNESS;
  scene.add(mesh);

  mesh.userData={ flipped:false, progress:0, index:index };
  pages.push(mesh);
}

// ===============================
// BUILD BOOK (FIXED PAIRING)
// ===============================
if(album.length===0){
  album=["https://picsum.photos/1200/1600"]; // fallback demo image
}

for(let i=0;i<album.length;i++){
  const front = album[i];
  const back  = album[i+1] || album[i];
  createPage(front,back,i);
}

// ===============================
// PAGE FLIP (FIXED LOGIC)
// ===============================
function flipPage(dir){

  if(dir===1 && currentPage>=pages.length) return;
  if(dir===-1 && currentPage<=0) return;

  if(dir===1){
    pages[currentPage].userData.flipped=true;
    currentPage++;
  } else {
    currentPage--;
    pages[currentPage].userData.flipped=false;
  }
}

window.addEventListener("click",()=>flipPage(1));

// SWIPE
let startX=0;
window.addEventListener("touchstart",e=>startX=e.touches[0].clientX);
window.addEventListener("touchend",e=>{
  if(e.changedTouches[0].clientX < startX) flipPage(1);
  else flipPage(-1);
});

// PINCH ZOOM
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

// ===============================
// REAL PAGE CURL
// ===============================
function animate(){
  requestAnimationFrame(animate);

  pages.forEach(page=>{
    const ud=page.userData;

    if(ud.flipped && ud.progress<1) ud.progress+=0.04;
    if(!ud.flipped && ud.progress>0) ud.progress-=0.04;

    const pos=page.geometry.attributes.position;

    for(let i=0;i<pos.count;i++){
      const x=pos.getX(i);
      const curl=Math.sin(ud.progress*Math.PI)*0.6;
      pos.setZ(i,curl*(x/PAGE_WIDTH));
    }

    pos.needsUpdate=true;
    page.rotation.y = -ud.progress*Math.PI;
  });

  renderer.render(scene,camera);
}
animate();

// ===============================
function toggleFullscreen(){
  if(!document.fullscreenElement) document.body.requestFullscreen();
  else document.exitFullscreen();
}

document.body.addEventListener("click",()=>{
  const music=document.getElementById("bgMusic");
  if(music) music.play();
},{once:true});
