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

// Left Road

const leftRoad = new THREE.Mesh(
    new THREE.BoxGeometry(
        16,
        0.2,
        5000
    ),
    new THREE.MeshLambertMaterial({
        color: 0x2f2f2f
    })
);

leftRoad.position.set(
    -10,
    0.1,
    0
);

scene.add(leftRoad);

// Right Road

const rightRoad = new THREE.Mesh(
    new THREE.BoxGeometry(
        16,
        0.2,
        5000
    ),
    new THREE.MeshLambertMaterial({
        color: 0x2f2f2f
    })
);

rightRoad.position.set(
    10,
    0.1,
    0
);

scene.add(rightRoad);

// Median Strip

const median = new THREE.Mesh(
    new THREE.BoxGeometry(
        4,
        0.3,
        5000
    ),
    new THREE.MeshLambertMaterial({
        color: 0x4f8f3f
    })
);

median.position.y = 0.25;

scene.add(median);

// Lane Markings

for(let z = -2500; z <= 2500; z += 20){

    for(const x of [-14, -6, 6, 14]){

        const dash = new THREE.Mesh(
            new THREE.BoxGeometry(
                0.3,
                0.05,
                10
            ),
            new THREE.MeshBasicMaterial({
                color: 0xffffff
            })
        );

        dash.position.set(
            x,
            0.31,
            z
        );

        scene.add(dash);
    }
}

// Sidewalks

const leftSidewalk = new THREE.Mesh(
    new THREE.BoxGeometry(
        5,
        0.3,
        5000
    ),
    new THREE.MeshLambertMaterial({
        color: 0xcfcfcf
    })
);

leftSidewalk.position.set(
    -20.5,
    0.15,
    0
);

scene.add(leftSidewalk);

const rightSidewalk = new THREE.Mesh(
    new THREE.BoxGeometry(
        5,
        0.3,
        5000
    ),
    new THREE.MeshLambertMaterial({
        color: 0xcfcfcf
    })
);

rightSidewalk.position.set(
    20.5,
    0.15,
    0
);

scene.add(rightSidewalk);

// Street Trees

for(let z = -2500; z <= 2500; z += 60){

    const treeX =
        (Math.random() - 0.5) * 1.5;

    const trunkHeight =
        4 + Math.random() * 2;

    const crownSize =
        1.5 + Math.random() * 0.8;

    const greenColors = [
        0x228b22,
        0x2e8b57,
        0x3cb371,
        0x1f7a1f
    ];

    const leafColor =
        greenColors[
            Math.floor(
                Math.random() *
                greenColors.length
            )
        ];

    const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(
            0.25,
            0.35,
            trunkHeight,
            12
        ),
        new THREE.MeshLambertMaterial({
            color: 0x6b4423
        })
    );

    trunk.position.set(
        treeX,
        trunkHeight / 2,
        z
    );

    scene.add(trunk);

    const leafMaterial =
        new THREE.MeshLambertMaterial({
            color: leafColor
        });

    const crown1 = new THREE.Mesh(
        new THREE.SphereGeometry(
            crownSize,
            16,
            16
        ),
        leafMaterial
    );

    crown1.position.set(
        treeX,
        trunkHeight + 1.0,
        z
    );

    scene.add(crown1);

    const crown2 = new THREE.Mesh(
        new THREE.SphereGeometry(
            crownSize * 0.8,
            16,
            16
        ),
        leafMaterial
    );

    crown2.position.set(
        treeX - 1.0,
        trunkHeight + 0.5,
        z
    );

    scene.add(crown2);

    const crown3 = new THREE.Mesh(
        new THREE.SphereGeometry(
            crownSize * 0.8,
            16,
            16
        ),
        leafMaterial
    );

    crown3.position.set(
        treeX + 1.0,
        trunkHeight + 0.5,
        z
    );

    scene.add(crown3);

    const crown4 = new THREE.Mesh(
        new THREE.SphereGeometry(
            crownSize * 0.7,
            16,
            16
        ),
        leafMaterial
    );

    crown4.position.set(
        treeX,
        trunkHeight + 2.0,
        z
    );

    scene.add(crown4);
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

        if(speed < 70){

            speed += 0.3;

        }
        else if(speed < 100){

            speed += 0.15;

        }
        else if(speed < 160){

            speed += 0.12;

        }

    }

    // Brake

    if(keys["s"]){

        speed -= 0.4;

    }

    // Natural Deceleration

    speed *= 0.999;

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
    0.007;

car.position.z -=
    Math.cos(
        car.rotation.y
    ) *
    speed *
    0.007;

    // HUD Update

    speedometer.textContent =
        Math.round(speed)
        + " km/h";

    tachometer.textContent =
        Math.round(
            700 +
            speed * 40
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
