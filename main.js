import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.179.1/build/three.module.js";

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

// camera
const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    10000
);

camera.position.set(0, 20, 30);

// renderer
const renderer = new THREE.WebGLRenderer({
    antialias: true
});

renderer.setSize(
    window.innerWidth,
    window.innerHeight
);

renderer.domElement.style.display = "none";

document.body.appendChild(renderer.domElement);

// light
const light = new THREE.DirectionalLight(0xffffff, 2);

light.position.set(100, 200, 100);

scene.add(light);

// ground
const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(5000, 5000),
    new THREE.MeshLambertMaterial({
        color: 0x3f7526
    })
);

ground.rotation.x = -Math.PI / 2;

scene.add(ground);

// road
const road = new THREE.Mesh(
    new THREE.PlaneGeometry(30, 5000),
    new THREE.MeshLambertMaterial({
        color: 0x333333
    })
);

road.rotation.x = -Math.PI / 2;
road.position.y = 0.01;

scene.add(road);

// center line
const centerLine = new THREE.Mesh(
    new THREE.PlaneGeometry(0.5, 5000),
    new THREE.MeshBasicMaterial({
        color: 0xffff00
    })
);

centerLine.rotation.x = -Math.PI / 2;
centerLine.position.y = 0.02;

scene.add(centerLine);

// Median Strip

const median = new THREE.Mesh(
    new THREE.BoxGeometry(3, 0.5, 5000),
    new THREE.MeshLambertMaterial({
        color: 0x777777
    })
);

median.position.y = 0.25;

scene.add(median);

// Cross Road

const crossRoad = new THREE.Mesh(
    new THREE.PlaneGeometry(5000, 50),
    new THREE.MeshLambertMaterial({
        color: 0x333333
    })
);

crossRoad.rotation.x = -Math.PI / 2;
crossRoad.position.y = 0.01;

scene.add(crossRoad);

// Cross Road Center Line

const crossCenterLine = new THREE.Mesh(
    new THREE.PlaneGeometry(5000, 0.5),
    new THREE.MeshBasicMaterial({
        color: 0xffff00
    })
);

crossCenterLine.rotation.x = -Math.PI / 2;
crossCenterLine.position.y = 0.02;

scene.add(crossCenterLine);

// car
const car = new THREE.Mesh(
    new THREE.BoxGeometry(4, 2, 8),
    new THREE.MeshLambertMaterial({
        color: 0x555555
    })
);

car.position.y = 1;

scene.add(car);

camera.lookAt(car.position);

// PLAY button
document.getElementById("playBtn").addEventListener("click", () => {

    document.getElementById("menu").style.display = "none";

    renderer.domElement.style.display = "block";

});

// resize
window.addEventListener("resize", () => {

    camera.aspect =
        window.innerWidth / window.innerHeight;

    camera.updateProjectionMatrix();

    renderer.setSize(
        window.innerWidth,
        window.innerHeight
    );

});

// animate
function animate() {

    requestAnimationFrame(animate);

    renderer.render(scene, camera);

}

animate();
