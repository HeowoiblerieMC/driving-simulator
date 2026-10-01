import * as THREE from
"https://unpkg.com/three@0.166.1/build/three.module.js";

// SCENE

const scene =
new THREE.Scene();

scene.background =
new THREE.Color(
    0x87ceeb
);

// CAMERA

const camera =
new THREE.PerspectiveCamera(
    75,
    window.innerWidth /
    window.innerHeight,
    0.1,
    10000
);

camera.position.set(
    0,
    10,
    20
);

// RENDERER

const renderer =
new THREE.WebGLRenderer({
    antialias:true
});

renderer.setSize(
    window.innerWidth,
    window.innerHeight
);

renderer.shadowMap.enabled =
true;

document.body.appendChild(
    renderer.domElement
);

// LIGHT

const sun =
new THREE.DirectionalLight(
    0xffffff,
    2
);

sun.position.set(
    200,
    300,
    100
);

scene.add(sun);

const ambient =
new THREE.AmbientLight(
    0xffffff,
    1
);

scene.add(ambient);

// GROUND

const ground =
new THREE.Mesh(

    new THREE.PlaneGeometry(
        5000,
        5000
    ),

    new THREE.MeshLambertMaterial({
        color:0x55aa55
    })

);

ground.rotation.x =
-Math.PI / 2;

scene.add(ground);

// TEST CUBE

const cube =
new THREE.Mesh(

    new THREE.BoxGeometry(
        5,
        5,
        5
    ),

    new THREE.MeshLambertMaterial({
        color:0xff0000
    })

);

cube.position.y = 2.5;

scene.add(cube);

// REMOVE LOADING

document.getElementById(
    "loading"
).remove();

// RESIZE

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

// LOOP

function animate(){

    requestAnimationFrame(
        animate
    );

    cube.rotation.y +=
    0.01;

    renderer.render(
        scene,
        camera
    );

}

animate();
