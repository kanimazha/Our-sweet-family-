// ==========================
// MODE DETECTION
// ==========================
const ADMIN_MODE = new URLSearchParams(location.search).has("admin");
if(!ADMIN_MODE) document.getElementById("adminPanel").style.display="none";

// ==========================
// DEMO ALBUM (always works)
// ==========================
const DEMO = [
"https://picsum.photos/id/1011/1200/800",
"https://picsum.photos/id/1015/1200/800",
"https://picsum.photos/id/1021/1200/800",
"https://picsum.photos/id/1035/1200/800",
"https://picsum.photos/id/1043/1200/800",
"https://picsum.photos/id/1067/1200/800"
];

// ==========================
// LOAD ALBUM
// ==========================
function loadAlbum(){
  const saved = JSON.parse(localStorage.getItem("album")||"[]");
  return saved.length ? saved : DEMO;
}

// ==========================
// RESIZE + WEBP
// ==========================
async function processImage(file){
  const img = new Image();
  img.src = URL.createObjectURL(file);
  await img.decode();

  const max=2048;
  let w=img.width, h=img.height;
  if(w>max||h>max){
    const s=Math.min(max/w,max/h);
    w*=s; h*=s;
  }

  const c=document.createElement("canvas");
  c.width=w; c.height=h;
  c.getContext("2d").drawImage(img,0,0,w,h);
  return c.toDataURL("image/webp",0.85);
}

// ==========================
// ADMIN SAVE
// ==========================
async function saveImages(){
  if(!ADMIN_MODE) return alert("Open with ?admin");

  const files=document.getElementById("imageUpload").files;
  if(!files.length) return alert("Choose images");

  const arr=[];
  for(const f of files) arr.push(await processImage(f));

  localStorage.setItem("album",JSON.stringify(arr));
  alert("Album Saved! Refresh page");
}

// ==========================
// THREE SETUP
// ==========================
const scene=new THREE.Scene();
scene.background=new THREE.Color(0x111111);

const camera=new THREE.PerspectiveCamera(45,innerWidth/innerHeight,0.1,100);
camera.position.set(0,1.6,4);

const renderer=new THREE.WebGLRenderer({antialias:true});
renderer.setSize(innerWidth,innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
document.getElementById("scene").appendChild(renderer.domElement);

const controls=new THREE.OrbitControls(camera,renderer.domElement);
controls.enablePan=false;
controls.enableZoom=false;

scene.add(new THREE.AmbientLight(0xffffff,1.2));
const dir=new THREE.DirectionalLight(0xffffff,1.2);
dir.position.set(3,5,4);
scene.add(dir);

// ==========================
// BOOK CREATION
// ==========================
const PAGE_W=1.6, PAGE_H=2.2, SEG=30;
const pages=[];
let currentPage=0;

function createPage(textureURL,index){
  const geo=new THREE.PlaneGeometry(PAGE_W,PAGE_H,SEG,SEG);
  const tex=new THREE.TextureLoader().load(textureURL);
  const mat=new THREE.MeshStandardMaterial({map:tex,side:THREE.DoubleSide});
  const mesh=new THREE.Mesh(geo,mat);
  mesh.position.z=-index*0.003;
  mesh.userData={flip:false,prog:0};
  scene.add(mesh);
  pages.push(mesh);
}

const album=loadAlbum();
album.forEach((img,i)=>createPage(img,i));

// ==========================
// PAGE FLIP
// ==========================
function flip(dir){
  const page=pages[currentPage];
  if(!page) return;
  page.userData.flip=!page.userData.flip;
  currentPage=Math.max(0,Math.min(pages.length-1,currentPage+dir));
}
window.addEventListener("click",()=>flip(1));

// mobile swipe
let startX=0;
addEventListener("touchstart",e=>startX=e.touches[0].clientX);
addEventListener("touchend",e=>{
  if(e.changedTouches[0].clientX<startX) flip(1);
  else flip(-1);
});

// ==========================
// ANIMATION LOOP
// ==========================
function animate(){
  requestAnimationFrame(animate);

  pages.forEach(p=>{
    const u=p.userData;
    if(u.flip && u.prog<1) u.prog+=0.06;
    if(!u.flip && u.prog>0) u.prog-=0.06;

    const pos=p.geometry.attributes.position;
    for(let i=0;i<pos.count;i++){
      const x=pos.getX(i);
      const curl=Math.sin(u.prog*Math.PI)*0.6;
      pos.setZ(i,curl*(x/PAGE_W));
    }
    pos.needsUpdate=true;
    p.rotation.y=-u.prog*Math.PI;
  });

  renderer.render(scene,camera);
}
animate();

// ==========================
function toggleFullscreen(){
  if(!document.fullscreenElement) document.body.requestFullscreen();
  else document.exitFullscreen();
}

// music unlock mobile
document.body.addEventListener("click",()=>{
  document.getElementById("bgMusic").play();
},{once:true});
