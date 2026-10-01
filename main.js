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
    new THREE.PlaneGeometry(10000, 10000),
    new THREE.MeshLambertMaterial({
        color: 0x3f7526
    })
);

ground.rotation.x = -Math.PI / 2;

scene.add(ground);

// Intersections

const minorRoads = [];
const signalIntersections = [];
const majorIntersections = [];

for(let z = -5000; z <= 5000; z += 125){

    if(z === 0) continue;

    if(z % 500 === 0){

        majorIntersections.push(z);

    }
    else if(z % 250 === 0){

        signalIntersections.push(z);

    }
    else{

        minorRoads.push(z);

    }

}

function isMinorIntersection(z){

    return minorRoads.some(
        i => Math.abs(z - i) < 9
    );

}

function isSignalIntersection(z){

    return signalIntersections.some(
        i => Math.abs(z - i) < 25
    );

}

function isMajorIntersection(z){

    return majorIntersections.some(
        i => Math.abs(z - i) < 35
    );

}

function isReservedArea(z){

    return (
        isMinorIntersection(z) ||
        isSignalIntersection(z) ||
        isMajorIntersection(z) ||
        Math.abs(z) < 60
    );

}

// ROAD SYSTEM

// Residential Roads (125m)

for(const z of minorRoads){

    const roadMaterial =
        new THREE.MeshLambertMaterial({
            color: 0x2f2f2f
        });

    const sidewalkMaterial =
        new THREE.MeshLambertMaterial({
            color: 0xd0d0d0
        });

    // Right Road

    const roadRight = new THREE.Mesh(
        new THREE.BoxGeometry(
            120,
            0.2,
            12
        ),
        roadMaterial
    );

    roadRight.position.set(
        74,
        0.1,
        z
    );

    scene.add(roadRight);

    // Left Road

    const roadLeft = new THREE.Mesh(
        new THREE.BoxGeometry(
            120,
            0.2,
            12
        ),
        roadMaterial
    );

    roadLeft.position.set(
        -74,
        0.1,
        z
    );

    scene.add(roadLeft);

    // Right Upper Sidewalk

    const s1 = new THREE.Mesh(
        new THREE.BoxGeometry(
            120,
            0.3,
            4
        ),
        sidewalkMaterial
    );

    s1.position.set(
        74,
        0.17,
        z + 5
    );

    scene.add(s1);

    // Right Lower Sidewalk

    const s2 = new THREE.Mesh(
        new THREE.BoxGeometry(
            120,
            0.3,
            4
        ),
        sidewalkMaterial
    );

    s2.position.set(
        74,
        0.17,
        z - 5
    );

    scene.add(s2);

    // Left Upper Sidewalk

    const s3 = new THREE.Mesh(
        new THREE.BoxGeometry(
            120,
            0.3,
            4
        ),
        sidewalkMaterial
    );

    s3.position.set(
        -74,
        0.17,
        z + 5
    );

    scene.add(s3);

    // Left Lower Sidewalk

    const s4 = new THREE.Mesh(
        new THREE.BoxGeometry(
            120,
            0.3,
            4
        ),
        sidewalkMaterial
    );

    s4.position.set(
        -74,
        0.17,
        z - 5
    );

    scene.add(s4);

}

// Left Road

const leftRoad = new THREE.Mesh(
    new THREE.BoxGeometry(
        12,
        0.2,
        10000
    ),
    new THREE.MeshLambertMaterial({
        color: 0x2f2f2f
    })
);

leftRoad.position.set(
    -8,
    0.1,
    0
);

scene.add(leftRoad);

// Right Road

const rightRoad = new THREE.Mesh(
    new THREE.BoxGeometry(
        12,
        0.2,
        10000
    ),
    new THREE.MeshLambertMaterial({
        color: 0x2f2f2f
    })
);

rightRoad.position.set(
    8,
    0.1,
    0
);

scene.add(rightRoad);

// Median Sections

for(let z = -5000; z <= 5000; z += 50){

    if(
        isSignalIntersection(z) ||
        isMajorIntersection(z) ||
        Math.abs(z) < 60
    ){
        continue;
    }

    const median = new THREE.Mesh(
        new THREE.BoxGeometry(
            4,
            0.3,
            50
        ),
        new THREE.MeshLambertMaterial({
            color: 0x4d8a3d
        })
    );

    median.position.set(
        0,
        0.25,
        z
    );

    scene.add(median);

}

// Sidewalk System

for(let z = -5000; z <= 5000; z += 10){

    let skip = false;

    // Residential Road Access

    if(
        isMinorIntersection(z)
    ){
        skip = true;
    }

    // Signalized Intersection

    if(
        isSignalIntersection(z)
    ){
        skip = true;
    }

    // Major Intersection

    if(
        isMajorIntersection(z)
    ){
        skip = true;
    }

    // Future Scramble Crossing Area

    if(
        Math.abs(z) < 60
    ){
        skip = true;
    }

    if(skip){
        continue;
    }

    // Left Sidewalk

    const leftSidewalk =
        new THREE.Mesh(

            new THREE.BoxGeometry(
                4,
                0.35,
                10
            ),

            new THREE.MeshLambertMaterial({
                color: 0xbcbcbc
            })

        );

    leftSidewalk.position.set(
        -16,
        0.17,
        z
    );

    scene.add(
        leftSidewalk
    );

    // Right Sidewalk

    const rightSidewalk =
        new THREE.Mesh(

            new THREE.BoxGeometry(
                4,
                0.35,
                10
            ),

            new THREE.MeshLambertMaterial({
                color: 0xbcbcbc
            })

        );

    rightSidewalk.position.set(
        16,
        0.17,
        z
    );

    scene.add(
        rightSidewalk
    );

    // Tile Line Left

    const leftTile =
        new THREE.Mesh(

            new THREE.BoxGeometry(
                4,
                0.01,
                0.05
            ),

            new THREE.MeshBasicMaterial({
                color: 0xa8a8a8
            })

        );

    leftTile.position.set(
        -16,
        0.36,
        z
    );

    scene.add(
        leftTile
    );

    // Tile Line Right

    const rightTile =
        new THREE.Mesh(

            new THREE.BoxGeometry(
                4,
                0.01,
                0.05
            ),

            new THREE.MeshBasicMaterial({
                color: 0xa8a8a8
            })

        );

    rightTile.position.set(
        16,
        0.36,
        z
    );

    scene.add(
        rightTile
    );

}

// Lane Markings

for(let z = -5000; z <= 5000; z += 20){
if(
    isSignalIntersection(z) ||
    isMajorIntersection(z) ||
    Math.abs(z) < 60
){
    continue;
}

    for(const x of [-8, 8]){

        const dash = new THREE.Mesh(
            new THREE.BoxGeometry(
                0.2,
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

// Street Trees

for(let z = -5000; z <= 5000; z += 70){

    if(
        isSignalIntersection(z) ||
        isMajorIntersection(z) ||
        Math.abs(z) < 60
    ){
        continue;
    }

    const trunkHeight =
        4 + Math.random() * 2;

    const crownSize =
        1.5 + Math.random() * 0.5;

    const leafColor = [
        0x2e7d32,
        0x388e3c,
        0x228b22
    ][
        Math.floor(
            Math.random() * 3
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
        0,
        trunkHeight / 2,
        z
    );

    scene.add(trunk);

    const leafMaterial =
        new THREE.MeshLambertMaterial({
            color: leafColor
        });

    for(let i = 0; i < 4; i++){

        const leaf = new THREE.Mesh(
            new THREE.SphereGeometry(
                crownSize,
                16,
                16
            ),
            leafMaterial
        );

        leaf.position.set(
            (Math.random() - 0.5) * 1.5,
            trunkHeight + 0.5 + Math.random() * 1.5,
            z + (Math.random() - 0.5) * 0.5
        );

        scene.add(leaf);

    }

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

car.position.x = -7;

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
