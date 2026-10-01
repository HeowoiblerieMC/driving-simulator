import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.179.1/build/three.module.js";

let scene;
let camera;
let renderer;

function init(){

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);

    camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        10000
    );

    renderer = new THREE.WebGLRenderer({
        antialias:true
    });

    renderer.setSize(
        window.innerWidth,
        window.innerHeight
    );

    renderer.domElement.style.display = "none";

    document.body.appendChild(renderer.domElement);

    // 光

    const sun = new THREE.DirectionalLight(
        0xffffff,
        2
    );

    sun.position.set(100,200,100);

    scene.add(sun);

    // 地面

    const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(5000,5000),
        new THREE.MeshLambertMaterial({
            color:0x4f8f3a
        })
    );

    ground.rotation.x = -Math.PI / 2;

    scene.add(ground);

    // 車

    const car = new THREE.Mesh(
        new THREE.BoxGeometry(4,2,8),
        new THREE.MeshLambertMaterial({
            color:0x666666
        })
    );

    car.position.y = 1;

    scene.add(car);

    camera.position.set(
        0,
        10,
        20
    );

    camera.lookAt(car.position);

    function animate(){

        requestAnimationFrame(animate);

        renderer.render(
            scene,
            camera
        );
    }

    animate();

    // PLAYボタン

    document
        .getElementById("playBtn")
        .addEventListener("click",()=>{

            document.getElementById("menu").style.display = "none";

            renderer.domElement.style.display = "block";
        });

}

init();
