// ===============================
// MODE DETECTION (?admin)
// ===============================
const isAdmin = window.location.search.includes("admin");

window.addEventListener("DOMContentLoaded", () => {
  const adminPanel = document.getElementById("adminPanel");
  if (!isAdmin && adminPanel) adminPanel.style.display = "none";
});

// ===============================
// THREE SCENE
// ===============================
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0e0e0e);

const camera = new THREE.PerspectiveCamera(45, innerWidth/innerHeight, 0.1, 100);
camera.position.set(0,1.6,4);

const renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setSize(innerWidth,innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
document.getElementById("scene").appendChild(renderer.domElement);

// LIGHT
scene.add(new THREE.AmbientLight(0xffffff,1.4));
const dirLight = new THREE.DirectionalLight(0xffffff,1.5);
dirLight.position.set(5,6,5);
scene.add(dirLight);

// Responsive
window.addEventListener("resize",()=>{
  renderer.setSize(innerWidth,innerHeight);
  camera.aspect = innerWidth/innerHeight;
  camera.updateProjectionMatrix();
});

// ===============================
// LOAD ALBUM FROM STORAGE
// ===============================
let album = JSON.parse(localStorage.getItem("album") || "[]");

// ===============================
// ADMIN → SAVE IMAGES
// ===============================
function saveImages() {
  const input = document.getElementById("frontUpload");
  const files = input.files;

  if (!files.length) {
    alert("Select images first");
    return;
  }

  const readers = [];

  for (let file of files) {
    readers.push(new Promise(res=>{
      const reader = new FileReader();
      reader.onload = e => res(e.target.result);
      reader.readAsDataURL(file);
    }));
  }

  Promise.all(readers).then(images=>{
    localStorage.setItem("album", JSON.stringify(images));
    alert("Album saved successfully!");
    location.reload(); // VERY IMPORTANT
  });
}

// ===============================
// BOOK SETTINGS
// ===============================
const PAGE_WIDTH = 1.6;
const PAGE_HEIGHT = 2.2;
const PAGE_SEGMENTS = 30;

let pages = [];
let currentPage = 0;

// ===============================
// CREATE PAGE
// ===============================
function createPage(frontImg, backImg, index){
  const geo = new THREE.PlaneGeometry(
    PAGE_WIDTH, PAGE_HEIGHT, PAGE_SEGMENTS, PAGE_SEGMENTS
  );

  const loader = new THREE.TextureLoader();
  const frontTex = loader.load(frontImg);
  const backTex  = loader.load(backImg);

  const materials = [
    new THREE.MeshStandardMaterial({map:frontTex, side:THREE.FrontSide}),
    new THREE.MeshStandardMaterial({map:backTex, side:THREE.BackSide})
  ];

  const page = new THREE.Mesh(geo, materials);
  page.position.z = -index * 0.004;
  page.userData = { flipped:false, progress:0 };
  scene.add(page);
  pages.push(page);
}

// ===============================
// BUILD BOOK FROM ALBUM
// ===============================
if(album.length === 0){
  console.log("No album found");
}else{
  album.forEach((img,i)=>{
    const front = img;
    const back  = album[i+1] || img;
    createPage(front, back, i);
  });
}

// ===============================
// PAGE FLIP CONTROLS
// ===============================
function flipPage(dir){
  if(dir===1 && currentPage>=pages.length) return;
  if(dir===-1 && currentPage<=0) return;

  const page = pages[currentPage];
  page.userData.flipped = !page.userData.flipped;
  currentPage += dir;
}

window.addEventListener("click",()=>flipPage(1));

// Swipe mobile
let startX=0;
window.addEventListener("touchstart",e=>startX=e.touches[0].clientX);
window.addEventListener("touchend",e=>{
  if(e.changedTouches[0].clientX < startX) flipPage(1);
  else flipPage(-1);
});

// ===============================
// PAGE CURL ANIMATION
// ===============================
function animate(){
  requestAnimationFrame(animate);

  pages.forEach(page=>{
    const ud = page.userData;

    if(ud.flipped && ud.progress<1) ud.progress += 0.04;
    if(!ud.flipped && ud.progress>0) ud.progress -= 0.04;

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
// FULLSCREEN + MUSIC
// ===============================
function toggleFullscreen(){
  if(!document.fullscreenElement) document.body.requestFullscreen();
  else document.exitFullscreen();
}

document.body.addEventListener("click",()=>{
  const music = document.getElementById("bgMusic");
  if(music) music.play();
},{once:true});
