import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.179.1/build/three.module.js";

// Scene Setup

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

// Camera Setup

const camera = new THREE.PerspectiveCamera(
    60,
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

document.body.appendChild(
    renderer.domElement
);

// Lighting

const light = new THREE.DirectionalLight(
    0xffffff,
    2
);

light.position.set(
    100,
    200,
    100
);

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
    new THREE.BoxGeometry(
        50,
        0.2,
        5000
    ),
    new THREE.MeshLambertMaterial({
        color: 0x333333
    })
);

road.position.y = 0.1;

scene.add(road);

// Dashed Lane Marking

for(
    let z = -2500;
    z <= 2500;
    z += 20
){

    const dash = new THREE.Mesh(
        new THREE.BoxGeometry(
            0.4,
            0.05,
            10
        ),
        new THREE.MeshBasicMaterial({
            color: 0xffffff
        })
    );

    dash.position.set(
        0,
        0.25,
        z
    );

    scene.add(dash);
}

// Vehicle

const car = new THREE.Group();

// Body

const body = new THREE.Mesh(
    new THREE.BoxGeometry(
        4,
        1.5,
        8
    ),
    new THREE.MeshLambertMaterial({
        color: 0x555555
    })
);

body.position.y = 1;

car.add(body);

// Cabin

const cabin = new THREE.Mesh(
    new THREE.BoxGeometry(
        3,
        1.2,
        4
    ),
    new THREE.MeshLambertMaterial({
        color: 0x888888
    })
);

cabin.position.y = 2;

car.add(cabin);

// Wheels

for(const x of [-1.8, 1.8]){

    for(const z of [-2.5, 2.5]){

        const wheel = new THREE.Mesh(
            new THREE.CylinderGeometry(
                0.8,
                0.8,
                0.6,
                16
            ),
            new THREE.MeshLambertMaterial({
                color: 0x111111
            })
        );

        wheel.rotation.z =
            Math.PI / 2;

        wheel.position.set(
            x,
            0.8,
            z
        );

        car.add(wheel);

    }

}

scene.add(car);

// HUD

const speedometer =
document.getElementById(
    "speedometer"
);

const tachometer =
document.getElementById(
    "tachometer"
);

// Vehicle Controls

const keys = {};

window.addEventListener(
    "keydown",
    (event) => {

        keys[
            event.key.toLowerCase()
        ] = true;

    }
);

window.addEventListener(
    "keyup",
    (event) => {

        keys[
            event.key.toLowerCase()
        ] = false;

    }
);

let speed = 0;

// Play Button

document
.getElementById("playBtn")
.addEventListener(
"click",
() => {

    document
    .getElementById("menu")
    .style.display = "none";

    document
    .getElementById("hud")
    .style.display = "block";

    renderer
    .domElement
    .style.display = "block";

});

// Resize

window.addEventListener(
    "resize",
    () => {

        camera.aspect =
        window.innerWidth /
        window.innerHeight;

        camera.updateProjectionMatrix();

        renderer.setSize(
            window.innerWidth,
            window.innerHeight
        );

    }
);

// Animation Loop

function animate(){

    requestAnimationFrame(
        animate
    );

    // Acceleration

    if(keys["w"]){

        if(speed < 80){

            speed += 0.12;

        }
        else if(speed < 100){

            speed += 0.06;

        }
        else if(speed < 160){

            speed += 0.03;

        }

    }

    // Brake

    if(keys["s"]){

        speed -= 0.5;

    }

    // Natural Deceleration

    speed *= 0.995;

    // Speed Limit

    speed =
    Math.max(0, speed);

    speed =
    Math.min(160, speed);

    // Steering

    if(keys["a"]){

        car.rotation.y += 0.03;

    }

    if(keys["d"]){

        car.rotation.y -= 0.03;

    }

    // Vehicle Movement

    car.position.x -=
        Math.sin(
            car.rotation.y
        ) *
        speed *
        0.01;

    car.position.z -=
        Math.cos(
            car.rotation.y
        ) *
        speed *
        0.01;

    // HUD Update

    speedometer.textContent =
        Math.round(speed)
        + " km/h";

    tachometer.textContent =
        Math.round(
            800 +
            speed * 35
        )
        + " RPM";

    // Chase Camera

    camera.position.x =
        car.position.x +
        Math.sin(
            car.rotation.y
        ) *
        20;

    camera.position.z =
        car.position.z +
        Math.cos(
            car.rotation.y
        ) *
        20;

    camera.position.y = 10;

    camera.lookAt(
        car.position
    );

    renderer.render(
        scene,
        camera
    );

}

animate();
