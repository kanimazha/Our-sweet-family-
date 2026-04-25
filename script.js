// ===============================
// Detect Admin Mode
// ===============================
const isAdmin = window.location.search.includes("admin");
document.getElementById("adminPanel").style.display = isAdmin ? "block" : "none";


// ===============================
// Scene Setup
// ===============================
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a0a);

const camera = new THREE.PerspectiveCamera(45, innerWidth/innerHeight,0.1,100);
camera.position.set(0,1.7,4);

const renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setSize(innerWidth,innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.5));
renderer.shadowMap.enabled = true;
document.getElementById("scene").appendChild(renderer.domElement);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enablePan=false;
controls.maxDistance=6;
controls.minDistance=2;


// ===============================
// Lighting (Cinematic)
// ===============================
scene.add(new THREE.AmbientLight(0xffffff,0.6));

const keyLight = new THREE.DirectionalLight(0xffffff,1.2);
keyLight.position.set(4,6,3);
keyLight.castShadow=true;
scene.add(keyLight);


// ===============================
// TABLE (book sits on table)
// ===============================
const table = new THREE.Mesh(
    new THREE.PlaneGeometry(20,20),
    new THREE.MeshStandardMaterial({color:0x2c2c2c})
);
table.rotation.x = -Math.PI/2;
table.receiveShadow = true;
scene.add(table);


// ===============================
// Demo Album (auto load)
// ===============================
const demoAlbum = [
"https://images.unsplash.com/photo-1519741497674-611481863552",
"https://images.unsplash.com/photo-1522673607200-164d1b6ce486",
"https://images.unsplash.com/photo-1500530855697-b586d89ba3ee",
"https://images.unsplash.com/photo-1511285560929-80b456fea0bc",
"https://images.unsplash.com/photo-1529626455594-4ff0802cfb7"
];

function loadAlbum(){
    let album = JSON.parse(localStorage.getItem("album") || "[]");
    if(album.length === 0) album = demoAlbum;
    return album;
}


// ===============================
// BOOK PARAMETERS
// ===============================
const PAGE_WIDTH = 1.6;
const PAGE_HEIGHT = 2.2;
const PAGE_SEGMENTS = 30;
const SPINE_OFFSET = 0.02;
let pages = [];


// ===============================
// Page Creation
// ===============================
function createPage(textureURL,index){
    const geo = new THREE.PlaneGeometry(PAGE_WIDTH,PAGE_HEIGHT,PAGE_SEGMENTS,PAGE_SEGMENTS);
    const tex = new THREE.TextureLoader().load(textureURL);

    const mat = new THREE.MeshStandardMaterial({
        map: tex,
        roughness:0.9,
        metalness:0.05
    });

    const mesh = new THREE.Mesh(geo,mat);
    mesh.castShadow=true;
    mesh.position.set(0,1.1,-index*0.003);

    mesh.userData={
        flipped:false,
        progress:0,
        index:index
    };

    scene.add(mesh);
    pages.push(mesh);
}


// ===============================
// Build Book
// ===============================
const album = loadAlbum();
album.forEach((img,i)=> createPage(img,i));


// ===============================
// PAGE FLIP (easing)
// ===============================
let currentPage = 0;

function flipPage(dir){
    if(dir===1 && currentPage>=pages.length) return;
    if(dir===-1 && currentPage<=0) return;

    const page = pages[currentPage];
    if(!page) return;

    page.userData.flipped = !page.userData.flipped;
    currentPage += dir;
}

window.addEventListener("click",()=>flipPage(1));


// ===============================
// REAL PAGE CURL PHYSICS
// ===============================
function updatePage(page){
    const ud = page.userData;

    // smooth easing
    const target = ud.flipped ? 1 : 0;
    ud.progress += (target - ud.progress) * 0.12;

    const pos = page.geometry.attributes.position;

    for(let i=0;i<pos.count;i++){
        const x = pos.getX(i);
        const curl = Math.sin(ud.progress*Math.PI) * 0.7;
        pos.setZ(i, curl * (x/PAGE_WIDTH));
    }
    pos.needsUpdate = true;

    // rotate from spine
    page.rotation.y = -ud.progress * Math.PI;
    page.position.x = ud.progress * SPINE_OFFSET;
}


// ===============================
// RENDER LOOP
// ===============================
function animate(){
    requestAnimationFrame(animate);
    pages.forEach(updatePage);
    renderer.render(scene,camera);
}
animate();


// ===============================
// Gestures
// ===============================
let touchStartX=0;

window.addEventListener("touchstart",e=>touchStartX=e.touches[0].clientX);
window.addEventListener("touchend",e=>{
    if(e.changedTouches[0].clientX < touchStartX) flipPage(1);
    else flipPage(-1);
});


// Pinch zoom
let lastDist=0;
window.addEventListener("touchmove",e=>{
if(e.touches.length==2){
const dx=e.touches[0].clientX-e.touches[1].clientX;
const dy=e.touches[0].clientY-e.touches[1].clientY;
const dist=Math.sqrt(dx*dx+dy*dy);
if(lastDist) camera.position.z += (lastDist-dist)*0.01;
lastDist=dist;
}
});


// fullscreen
function toggleFullscreen(){
if(!document.fullscreenElement) document.body.requestFullscreen();
else document.exitFullscreen();
}


// music autoplay fix
document.body.addEventListener("click",()=>{
document.getElementById("bgMusic").play();
},{once:true});
