import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.179.1/build/three.module.js";

// Scene Setup

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

// Camera Setup

const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    10000
);

camera.position.set(0, 10, 20);

// Renderer Setup

const renderer = new THREE.WebGLRenderer({
    antialias: true
});

renderer.setSize(
    window.innerWidth,
    window.innerHeight
);

renderer.domElement.style.display = "none";

document.body.appendChild(renderer.domElement);

// Lighting

const light = new THREE.DirectionalLight(
    0xffffff,
    2
);

light.position.set(100, 200, 100);

scene.add(light);

// Ground

const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(5000, 5000),
    new THREE.MeshLambertMaterial({
        color: 0x3f7526
    })
);

ground.rotation.x = -Math.PI / 2;

scene.add(ground);

// Main Road

const road = new THREE.Mesh(
    new THREE.PlaneGeometry(50, 5000),
    new THREE.MeshLambertMaterial({
        color: 0x333333
    })
);

road.rotation.x = -Math.PI / 2;
road.position.y = 0.01;

scene.add(road);

// Dashed Lane Marking

for (let z = -2500; z <= 2500; z += 20) {

    const dash = new THREE.Mesh(
        new THREE.PlaneGeometry(0.35, 10),
        new THREE.MeshBasicMaterial({
            color: 0xffffff
        })
    );

    dash.rotation.x = -Math.PI / 2;

    dash.position.set(
        0,
        0.02,
        z
    );

    scene.add(dash);
}

// Vehicle

const car = new THREE.Mesh(
    new THREE.BoxGeometry(4, 2, 8),
    new THREE.MeshLambertMaterial({
        color: 0x555555
    })
);

car.position.y = 1;

scene.add(car);

// Vehicle Controls

const keys = {};

window.addEventListener("keydown", (event) => {
    keys[event.key.toLowerCase()] = true;
});

window.addEventListener("keyup", (event) => {
    keys[event.key.toLowerCase()] = false;
});

// Play Button

document.getElementById("playBtn").addEventListener("click", () => {

    document.getElementById("menu").style.display = "none";

    renderer.domElement.style.display = "block";

});

// Resize

window.addEventListener("resize", () => {

    camera.aspect =
        window.innerWidth / window.innerHeight;

    camera.updateProjectionMatrix();

    renderer.setSize(
        window.innerWidth,
        window.innerHeight
    );

});

// Animation Loop

function animate() {

    requestAnimationFrame(animate);

    if (keys["w"]) {
        car.position.z -= 0.6;
    }

    if (keys["s"]) {
        car.position.z += 0.6;
    }

    if (keys["a"]) {
        car.position.x -= 0.4;
    }

    if (keys["d"]) {
        car.position.x += 0.4;
    }

    // Chase Camera

    camera.position.x = car.position.x;

    camera.position.y = 10;

    camera.position.z = car.position.z + 20;

    camera.lookAt(car.position);

    renderer.render(scene, camera);
}

animate();
