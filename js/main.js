import * as THREE from "https://unpkg.com/three@0.179.1/build/three.module.js";

export function startGame(){

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);

    const camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        10000
    );

    const renderer = new THREE.WebGLRenderer({
        antialias:true
    });

    renderer.setSize(
        window.innerWidth,
        window.innerHeight
    );

    document.body.appendChild(
        renderer.domElement
    );

    // 太陽

    const light = new THREE.DirectionalLight(
        0xffffff,
        2
    );

    light.position.set(100,200,100);
    scene.add(light);

    // 地面

    const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(5000,5000),
        new THREE.MeshLambertMaterial({
            color:0x4f8f3a
        })
    );

    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    // 仮の車

    const car = new THREE.Mesh(
        new THREE.BoxGeometry(4,2,8),
        new THREE.MeshLambertMaterial({
            color:0xff0000
        })
    );

    car.position.y = 1;
    scene.add(car);

    camera.position.set(
        0,
        20,
        30
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
}
