// ===== Scene Setup =====
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111);

const camera = new THREE.PerspectiveCamera(45, innerWidth/innerHeight,0.1,1000);
camera.position.set(0,1.5,4);

const renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setSize(innerWidth,innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.getElementById("scene").appendChild(renderer.domElement);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableZoom=false;
controls.enablePan=false;

// lights
scene.add(new THREE.AmbientLight(0xffffff,1.2));
const light = new THREE.DirectionalLight(0xffffff,1.2);
light.position.set(3,5,4);
scene.add(light);

// ===== Responsive Mode =====
let singlePage = false;
function checkOrientation(){
  singlePage = innerWidth < innerHeight;
}
checkOrientation();
window.addEventListener("resize",()=>{
  renderer.setSize(innerWidth,innerHeight);
  camera.aspect = innerWidth/innerHeight;
  camera.updateProjectionMatrix();
  checkOrientation();
});

// ===== Book Parameters =====
const PAGE_WIDTH = 1.6;
const PAGE_HEIGHT = 2.2;
const PAGE_SEGMENTS = 30;
let pages = [];

// ===== Load saved album =====
function loadAlbum(){
  return JSON.parse(localStorage.getItem("album") || "[]");
}

// ===== Save uploaded images =====
function saveImages(){
  const files = document.getElementById("frontUpload").files;
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

// ===== Page Curl Mesh =====
function createPage(frontImg, backImg, index){

  const geometry = new THREE.PlaneGeometry(
      PAGE_WIDTH, PAGE_HEIGHT, PAGE_SEGMENTS, PAGE_SEGMENTS
  );

  const loader = new THREE.TextureLoader();
  const frontTexture = loader.load(frontImg);
  const backTexture  = loader.load(backImg);

  const materials = [
    new THREE.MeshStandardMaterial({map:frontTexture}),
    new THREE.MeshStandardMaterial({map:backTexture})
  ];

  const mesh = new THREE.Mesh(geometry, materials[0]);
  mesh.position.z = -index * 0.003;
  scene.add(mesh);

  mesh.userData = {
    flipped:false,
    progress:0,
    frontTexture,
    backTexture
  };

  pages.push(mesh);
}

// ===== Create Book =====
const album = loadAlbum();
for(let i=0;i<album.length;i++){
  let front = album[i];
  let back = album[i+1] || album[0]; // next image as backside
  createPage(front, back, i);
}

// ===== Page Flip Physics =====
let currentPage = 0;

function flipPage(dir){
  const page = pages[currentPage];
  if(!page) return;

  page.userData.flipped = !page.userData.flipped;
  currentPage += dir;
}

window.addEventListener("click",()=>flipPage(1));

// ===== Real Curl Animation =====
function animate(){
  requestAnimationFrame(animate);

  pages.forEach(page=>{
    let ud = page.userData;

    if(ud.flipped && ud.progress < 1) ud.progress += 0.05;
    if(!ud.flipped && ud.progress > 0) ud.progress -= 0.05;

    // CURL deformation
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

// ===== Gestures =====

// swipe mobile
let touchStartX=0;
window.addEventListener("touchstart",e=>touchStartX=e.touches[0].clientX);
window.addEventListener("touchend",e=>{
  if(e.changedTouches[0].clientX < touchStartX) flipPage(1);
  else flipPage(-1);
});

// pinch zoom
let lastDist=0;
window.addEventListener("touchmove",e=>{
  if(e.touches.length==2){
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    const dist = Math.sqrt(dx*dx+dy*dy);
    if(lastDist) camera.position.z += (lastDist-dist)*0.01;
    lastDist = dist;
  }
});

// fullscreen
function toggleFullscreen(){
  if(!document.fullscreenElement)
    document.body.requestFullscreen();
  else document.exitFullscreen();
}

// autoplay fix (mobile)
document.body.addEventListener("click",()=>{
  document.getElementById("bgMusic").play();
},{once:true});
