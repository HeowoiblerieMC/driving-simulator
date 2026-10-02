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
        i => Math.abs(z - i) < 7
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

// ======================================
// ROAD SYSTEM
// ======================================

// Scale
// Vehicle width: 4 units = 3 meters

const UNIT_PER_METER = 4 / 3;

// Road dimensions

const RESIDENTIAL_ROAD_WIDTH =
    6 * UNIT_PER_METER;

const RESIDENTIAL_SIDEWALK_WIDTH =
    2 * UNIT_PER_METER;

const LANE_WIDTH =
    5 * UNIT_PER_METER;

const STANDARD_SIDEWALK_WIDTH =
    3 * UNIT_PER_METER;

const MEDIAN_WIDTH =
    5 * UNIT_PER_METER;

// Main boulevard
// 2 lanes each direction with a median

const MAIN_CARRIAGEWAY_WIDTH =
    LANE_WIDTH * 2;

const MAIN_ROAD_TOTAL_WIDTH =
    MAIN_CARRIAGEWAY_WIDTH * 2 +
    MEDIAN_WIDTH;

const MAIN_ROAD_CENTER_OFFSET =
    MEDIAN_WIDTH / 2 +
    MAIN_CARRIAGEWAY_WIDTH / 2;

const MAIN_ROAD_OUTER_EDGE =
    MAIN_ROAD_TOTAL_WIDTH / 2;

// 250m road
// 1 lane each direction, no median

const SIGNAL_ROAD_WIDTH =
    LANE_WIDTH * 2;

// 500m road
// 2 lanes each direction with median

const MAJOR_ROAD_WIDTH =
    MAIN_ROAD_TOTAL_WIDTH;

// Materials

const roadMaterial =
    new THREE.MeshLambertMaterial({
        color: 0x2f2f2f
    });

const majorRoadMaterial =
    new THREE.MeshLambertMaterial({
        color: 0x292929
    });

const sidewalkMaterial =
    new THREE.MeshLambertMaterial({
        color: 0xd0d0d0
    });

const mainSidewalkMaterial =
    new THREE.MeshLambertMaterial({
        color: 0xbcbcbc
    });

const medianMaterial =
    new THREE.MeshLambertMaterial({
        color: 0x4d8a3d
    });

const lineMaterial =
    new THREE.MeshBasicMaterial({
        color: 0xffffff
    });


// ======================================
// MAIN BOULEVARD
// ======================================

// Left carriageway

const leftMainRoad = new THREE.Mesh(
    new THREE.BoxGeometry(
        MAIN_CARRIAGEWAY_WIDTH,
        0.2,
        10000
    ),
    roadMaterial
);

leftMainRoad.position.set(
    -MAIN_ROAD_CENTER_OFFSET,
    0.1,
    0
);

scene.add(leftMainRoad);

// Right carriageway

const rightMainRoad = new THREE.Mesh(
    new THREE.BoxGeometry(
        MAIN_CARRIAGEWAY_WIDTH,
        0.2,
        10000
    ),
    roadMaterial
);

rightMainRoad.position.set(
    MAIN_ROAD_CENTER_OFFSET,
    0.1,
    0
);

scene.add(rightMainRoad);


// ======================================
// 125m RESIDENTIAL ROADS
// One-way
// Road: 6m
// Sidewalk: 2m
// ======================================

const residentialRoadLength = 120;

const residentialRoadCenter =
    MAIN_ROAD_OUTER_EDGE +
    residentialRoadLength / 2;

const residentialSidewalkOffset =
    RESIDENTIAL_ROAD_WIDTH / 2 +
    RESIDENTIAL_SIDEWALK_WIDTH / 2;

for(const z of minorRoads){

    // Right road

    const rightResidentialRoad =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                residentialRoadLength,
                0.2,
                RESIDENTIAL_ROAD_WIDTH
            ),
            roadMaterial
        );

    rightResidentialRoad.position.set(
        residentialRoadCenter,
        0.1,
        z
    );

    scene.add(rightResidentialRoad);

    // Left road

    const leftResidentialRoad =
        rightResidentialRoad.clone();

    leftResidentialRoad.position.x =
        -residentialRoadCenter;

    scene.add(leftResidentialRoad);

    // Right upper sidewalk

    const rightUpperSidewalk =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                residentialRoadLength,
                0.3,
                RESIDENTIAL_SIDEWALK_WIDTH
            ),
            sidewalkMaterial
        );

    rightUpperSidewalk.position.set(
        residentialRoadCenter,
        0.17,
        z + residentialSidewalkOffset
    );

    scene.add(rightUpperSidewalk);

    // Right lower sidewalk

    const rightLowerSidewalk =
        rightUpperSidewalk.clone();

    rightLowerSidewalk.position.z =
        z - residentialSidewalkOffset;

    scene.add(rightLowerSidewalk);

    // Left upper sidewalk

    const leftUpperSidewalk =
        rightUpperSidewalk.clone();

    leftUpperSidewalk.position.set(
        -residentialRoadCenter,
        0.17,
        z + residentialSidewalkOffset
    );

    scene.add(leftUpperSidewalk);

    // Left lower sidewalk

    const leftLowerSidewalk =
        rightUpperSidewalk.clone();

    leftLowerSidewalk.position.set(
        -residentialRoadCenter,
        0.17,
        z - residentialSidewalkOffset
    );

    scene.add(leftLowerSidewalk);

}


// ======================================
// 250m SIGNAL ROADS
// 1 lane each direction
// No median
// Sidewalk: 3m
// ======================================

const signalRoadLength = 180;

const signalSidewalkOffset =
    SIGNAL_ROAD_WIDTH / 2 +
    STANDARD_SIDEWALK_WIDTH / 2;

const signalSidewalkSegmentLength =
    (
        signalRoadLength -
        MAIN_ROAD_TOTAL_WIDTH
    ) / 2;

const signalSidewalkCenter =
    MAIN_ROAD_OUTER_EDGE +
    signalSidewalkSegmentLength / 2;

for(const z of signalIntersections){

    // Main crossing road

    const signalRoad =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                signalRoadLength,
                0.2,
                SIGNAL_ROAD_WIDTH
            ),
            roadMaterial
        );

    signalRoad.position.set(
        0,
        0.1,
        z
    );

    scene.add(signalRoad);

    // Upper left sidewalk

    const upperLeft =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                signalSidewalkSegmentLength,
                0.3,
                STANDARD_SIDEWALK_WIDTH
            ),
            sidewalkMaterial
        );

    upperLeft.position.set(
        -signalSidewalkCenter,
        0.17,
        z + signalSidewalkOffset
    );

    scene.add(upperLeft);

    // Upper right sidewalk

    const upperRight =
        upperLeft.clone();

    upperRight.position.x =
        signalSidewalkCenter;

    scene.add(upperRight);

    // Lower left sidewalk

    const lowerLeft =
        upperLeft.clone();

    lowerLeft.position.set(
        -signalSidewalkCenter,
        0.17,
        z - signalSidewalkOffset
    );

    scene.add(lowerLeft);

    // Lower right sidewalk

    const lowerRight =
        upperLeft.clone();

    lowerRight.position.set(
        signalSidewalkCenter,
        0.17,
        z - signalSidewalkOffset
    );

    scene.add(lowerRight);

    // Center line

    const centerLine =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                signalRoadLength,
                0.03,
                0.18
            ),
            lineMaterial
        );

    centerLine.position.set(
        0,
        0.22,
        z
    );

    scene.add(centerLine);

}


// ======================================
// 500m MAJOR ROADS
// 2 lanes each direction
// Median: 5m
// Sidewalk: 3m
// ======================================

const majorRoadLength = 220;

const majorSidewalkOffset =
    MAJOR_ROAD_WIDTH / 2 +
    STANDARD_SIDEWALK_WIDTH / 2;

const majorSidewalkSegmentLength =
    (
        majorRoadLength -
        MAIN_ROAD_TOTAL_WIDTH
    ) / 2;

const majorSidewalkCenter =
    MAIN_ROAD_OUTER_EDGE +
    majorSidewalkSegmentLength / 2;

for(const z of majorIntersections){

    // Main crossing road

    const majorRoad =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                majorRoadLength,
                0.2,
                MAJOR_ROAD_WIDTH
            ),
            majorRoadMaterial
        );

    majorRoad.position.set(
        0,
        0.1,
        z
    );

    scene.add(majorRoad);

    // Upper left sidewalk

    const upperLeft =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                majorSidewalkSegmentLength,
                0.3,
                STANDARD_SIDEWALK_WIDTH
            ),
            sidewalkMaterial
        );

    upperLeft.position.set(
        -majorSidewalkCenter,
        0.17,
        z + majorSidewalkOffset
    );

    scene.add(upperLeft);

    // Upper right sidewalk

    const upperRight =
        upperLeft.clone();

    upperRight.position.x =
        majorSidewalkCenter;

    scene.add(upperRight);

    // Lower left sidewalk

    const lowerLeft =
        upperLeft.clone();

    lowerLeft.position.set(
        -majorSidewalkCenter,
        0.17,
        z - majorSidewalkOffset
    );

    scene.add(lowerLeft);

    // Lower right sidewalk

    const lowerRight =
        upperLeft.clone();

    lowerRight.position.set(
        majorSidewalkCenter,
        0.17,
        z - majorSidewalkOffset
    );

    scene.add(lowerRight);

    // Left-side lane divider

    const leftLaneLine =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                majorRoadLength,
                0.03,
                0.18
            ),
            lineMaterial
        );

    leftLaneLine.position.set(
        0,
        0.22,
        z - (
            MEDIAN_WIDTH / 2 +
            LANE_WIDTH
        )
    );

    scene.add(leftLaneLine);

    // Right-side lane divider

    const rightLaneLine =
        leftLaneLine.clone();

    rightLaneLine.position.z =
        z + (
            MEDIAN_WIDTH / 2 +
            LANE_WIDTH
        );

    scene.add(rightLaneLine);

}


// ======================================
// SCRAMBLE INTERSECTION
// Center: z = 0
// Road shape only
// Crosswalks are added later
// ======================================

const scrambleRoad =
    new THREE.Mesh(
        new THREE.BoxGeometry(
            majorRoadLength,
            0.2,
            MAJOR_ROAD_WIDTH
        ),
        majorRoadMaterial
    );

scrambleRoad.position.set(
    0,
    0.1,
    0
);

scene.add(scrambleRoad);


// ======================================
// MAIN BOULEVARD SIDEWALKS
// ======================================

const mainSidewalkCenter =
    MAIN_ROAD_OUTER_EDGE +
    STANDARD_SIDEWALK_WIDTH / 2;

const sidewalkSectionLength = 10;

function shouldSkipMainSidewalk(z){

    if(Math.abs(z) < 60){
        return true;
    }

    const minorClearance =
        RESIDENTIAL_ROAD_WIDTH / 2 +
        RESIDENTIAL_SIDEWALK_WIDTH +
        sidewalkSectionLength / 2;

    const signalClearance =
        SIGNAL_ROAD_WIDTH / 2 +
        STANDARD_SIDEWALK_WIDTH +
        sidewalkSectionLength / 2;

    const majorClearance =
        MAJOR_ROAD_WIDTH / 2 +
        STANDARD_SIDEWALK_WIDTH +
        sidewalkSectionLength / 2;

    if(
        minorRoads.some(
            intersectionZ =>
                Math.abs(
                    z - intersectionZ
                ) < minorClearance
        )
    ){
        return true;
    }

    if(
        signalIntersections.some(
            intersectionZ =>
                Math.abs(
                    z - intersectionZ
                ) < signalClearance
        )
    ){
        return true;
    }

    if(
        majorIntersections.some(
            intersectionZ =>
                Math.abs(
                    z - intersectionZ
                ) < majorClearance
        )
    ){
        return true;
    }

    return false;
}

for(
    let z = -5000;
    z <= 5000;
    z += sidewalkSectionLength
){

    if(shouldSkipMainSidewalk(z)){
        continue;
    }

    // Left sidewalk

    const leftSidewalk =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                STANDARD_SIDEWALK_WIDTH,
                0.35,
                sidewalkSectionLength
            ),
            mainSidewalkMaterial
        );

    leftSidewalk.position.set(
        -mainSidewalkCenter,
        0.17,
        z
    );

    scene.add(leftSidewalk);

    // Right sidewalk

    const rightSidewalk =
        leftSidewalk.clone();

    rightSidewalk.position.x =
        mainSidewalkCenter;

    scene.add(rightSidewalk);

}


// ======================================
// MAIN BOULEVARD MEDIAN
// The median is removed near intersections.
// Major intersections receive turn-lane space.
// ======================================

const medianSectionLength = 10;

function shouldSkipMedian(z){

    if(Math.abs(z) < 60){
        return true;
    }

    if(
        signalIntersections.some(
            intersectionZ =>
                Math.abs(
                    z - intersectionZ
                ) <
                SIGNAL_ROAD_WIDTH / 2 +
                8
        )
    ){
        return true;
    }

    if(
        majorIntersections.some(
            intersectionZ =>
                Math.abs(
                    z - intersectionZ
                ) < 80
        )
    ){
        return true;
    }

    return false;
}

for(
    let z = -5000;
    z <= 5000;
    z += medianSectionLength
){

    if(shouldSkipMedian(z)){
        continue;
    }

    const median =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                MEDIAN_WIDTH,
                0.3,
                medianSectionLength
            ),
            medianMaterial
        );

    median.position.set(
        0,
        0.25,
        z
    );

    scene.add(median);

}


// ======================================
// 500m RIGHT-TURN APPROACH LANES
// One approach becomes 3 lanes.
// The opposite side remains 2 lanes.
// ======================================

const turnApproachLength = 60;

for(const z of majorIntersections){

    // Approach from positive Z

    const positiveApproach =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                MEDIAN_WIDTH,
                0.21,
                turnApproachLength
            ),
            majorRoadMaterial
        );

    positiveApproach.position.set(
        0,
        0.11,
        z + (
            MAJOR_ROAD_WIDTH / 2 +
            turnApproachLength / 2
        )
    );

    scene.add(positiveApproach);

    // Approach from negative Z

    const negativeApproach =
        positiveApproach.clone();

    negativeApproach.position.z =
        z - (
            MAJOR_ROAD_WIDTH / 2 +
            turnApproachLength / 2
        );

    scene.add(negativeApproach);

}


// ======================================
// MAIN BOULEVARD LANE MARKINGS
// ======================================

const laneDashLength = 8;
const laneDashGap = 12;

for(
    let z = -5000;
    z <= 5000;
    z += laneDashLength + laneDashGap
){

    if(
        isSignalIntersection(z) ||
        isMajorIntersection(z) ||
        Math.abs(z) < 60
    ){
        continue;
    }

    // Left carriageway divider

    const leftDash =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                0.18,
                0.04,
                laneDashLength
            ),
            lineMaterial
        );

    leftDash.position.set(
        -MAIN_ROAD_CENTER_OFFSET,
        0.22,
        z
    );

    scene.add(leftDash);

    // Right carriageway divider

    const rightDash =
        leftDash.clone();

    rightDash.position.x =
        MAIN_ROAD_CENTER_OFFSET;

    scene.add(rightDash);

}


// ======================================
// STREET TREES
// ======================================

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

    const trunk =
        new THREE.Mesh(
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

        const leaf =
            new THREE.Mesh(
                new THREE.SphereGeometry(
                    crownSize,
                    16,
                    16
                ),
                leafMaterial
            );

        leaf.position.set(
            (Math.random() - 0.5) * 1.5,
            trunkHeight +
            0.5 +
            Math.random() * 1.5,
            z +
            (Math.random() - 0.5) * 0.5
        );

        scene.add(leaf);

    }

}

// Vehicle

let car;

let taillights = [];
let reverseLights = [];

function createCar(type){

    taillights = [];
    reverseLights = [];

    if(car){
        scene.remove(car);
    }

    car = new THREE.Group();

    let bodyColor = 0x888888;

    if(type === "compact"){
        bodyColor = 0x44aa44;
    }

    if(type === "suv"){
        bodyColor = 0x4444aa;
    }

    if(type === "sports"){
        bodyColor = 0xaa2222;
    }

    // Main Body

    const body = new THREE.Mesh(
        new THREE.BoxGeometry(
            4,
            0.7,
            11
        ),
        new THREE.MeshLambertMaterial({
            color: bodyColor
        })
    );

    body.position.y = 0.7;

    car.add(body);

    // Cabin

    const cabin = new THREE.Mesh(
        new THREE.BoxGeometry(
            2.7,
            0.7,
            4.2
        ),
        new THREE.MeshLambertMaterial({
            color: 0x222222
        })
    );

    cabin.position.set(
        0,
        1.15,
        -0.4
    );

    car.add(cabin);

    // Hood

    const hood = new THREE.Mesh(
        new THREE.BoxGeometry(
            3.8,
            0.55,
            4
        ),
        new THREE.MeshLambertMaterial({
            color: bodyColor
        })
    );

    hood.position.set(
        0,
        0.85,
        3.2
    );

    car.add(hood);

    // Trunk

    const trunk = new THREE.Mesh(
        new THREE.BoxGeometry(
            3.8,
            0.55,
            2.8
        ),
        new THREE.MeshLambertMaterial({
            color: bodyColor
        })
    );

    trunk.position.set(
        0,
        0.85,
        -4.2
    );

    car.add(trunk);

    // Front Window

    const frontWindow = new THREE.Mesh(
        new THREE.BoxGeometry(
            2.5,
            0.7,
            0.08
        ),
        new THREE.MeshLambertMaterial({
            color: 0x88bbff,
            transparent: true,
            opacity: 0.7
        })
    );

    frontWindow.rotation.x = -0.65;

    frontWindow.position.set(
        0,
        1.35,
        1.5
    );

    car.add(frontWindow);

    // Rear Window

    const rearWindow = new THREE.Mesh(
        new THREE.BoxGeometry(
            2.5,
            0.7,
            0.08
        ),
        new THREE.MeshLambertMaterial({
            color: 0x88bbff,
            transparent: true,
            opacity: 0.7
        })
    );

    rearWindow.rotation.x = 0.45;

    rearWindow.position.set(
        0,
        1.3,
        -2.4
    );

    car.add(rearWindow);

    // Side Windows

    const leftWindow = new THREE.Mesh(
        new THREE.BoxGeometry(
            0.08,
            0.6,
            3.8
        ),
        new THREE.MeshLambertMaterial({
            color: 0x88bbff,
            transparent: true,
            opacity: 0.7
        })
    );

    leftWindow.position.set(
        -1.36,
        1.3,
        -0.4
    );

    car.add(leftWindow);

    const rightWindow = leftWindow.clone();

    rightWindow.position.x = 1.36;

    car.add(rightWindow);

    // Grille

    const grille = new THREE.Mesh(
        new THREE.BoxGeometry(
            2.3,
            0.45,
            0.08
        ),
        new THREE.MeshLambertMaterial({
            color: 0xc0c0c0
        })
    );

    grille.position.set(
        0,
        0.8,
        5.55
    );

    car.add(grille);

    // Headlights

    const leftHeadlight = new THREE.Mesh(
        new THREE.BoxGeometry(
            0.9,
            0.2,
            0.08
        ),
        new THREE.MeshBasicMaterial({
            color: 0xffffdd
        })
    );

    leftHeadlight.position.set(
        -1.3,
        0.8,
        5.55
    );

    car.add(leftHeadlight);

    const rightHeadlight =
        leftHeadlight.clone();

    rightHeadlight.position.x = 1.3;

    car.add(rightHeadlight);

    // Left Taillight

    const leftTaillight = new THREE.Mesh(
        new THREE.BoxGeometry(
            1.8,
            0.25,
            0.08
        ),
        new THREE.MeshBasicMaterial({
            color: 0x660000
        })
    );

    leftTaillight.position.set(
        -0.9,
        0.8,
        -5.55
    );

    car.add(leftTaillight);

    // Right Taillight

    const rightTaillight =
        leftTaillight.clone();

    rightTaillight.position.x = 0.9;

    car.add(rightTaillight);

    taillights.push(
        leftTaillight,
        rightTaillight
    );

    // Reverse Lights

    const leftReverseLight = new THREE.Mesh(
        new THREE.BoxGeometry(
            0.5,
            0.2,
            0.08
        ),
        new THREE.MeshBasicMaterial({
            color: 0xffffff
        })
    );

    leftReverseLight.position.set(
        -0.2,
        0.8,
        -5.55
    );

    car.add(leftReverseLight);

    const rightReverseLight =
        leftReverseLight.clone();

    rightReverseLight.position.x = 0.2;

    car.add(rightReverseLight);

    reverseLights.push(
        leftReverseLight,
        rightReverseLight
    );

    reverseLights.forEach(
        light => {
            light.visible = false;
        }
    );

    // Wheels

    for(const x of [-1.8, 1.8]){

        for(const z of [-3.2, 3.2]){

            const wheel = new THREE.Mesh(
                new THREE.CylinderGeometry(
                    1,
                    1,
                    0.7,
                    32
                ),
                new THREE.MeshLambertMaterial({
                    color: 0x111111
                })
            );

            wheel.rotation.z =
                Math.PI / 2;

            wheel.position.set(
                x,
                0.6,
                z
            );

            const hubcap = new THREE.Mesh(
                new THREE.CylinderGeometry(
                    0.55,
                    0.55,
                    0.72,
                    24
                ),
                new THREE.MeshLambertMaterial({
                    color: 0xc0c0c0
                })
            );

            hubcap.rotation.z =
                Math.PI / 2;

            wheel.add(hubcap);

            car.add(wheel);

        }

    }

    scene.add(car);

    car.position.set(
        -7,
        0,
        0
    );

}

createCar("sedan");

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

document
.getElementById("carBtn")
.addEventListener(
"click",
() => {

    const choice = prompt(
`SELECT CAR

compact
sedan
suv
sports`
    );

    if(
        choice === "compact" ||
        choice === "sedan" ||
        choice === "suv" ||
        choice === "sports"
    ){

        createCar(choice);

    }

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
    Math.max(-40, speed);

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

    // Rear Lights

taillights.forEach(
    light => {

        if(keys["s"]){

            light.material.color.set(
                0xff0000
            );

        }
        else if(speed <= 1){

            light.material.color.set(
                0xff4444
            );

        }
        else{

            light.material.color.set(
                0x660000
            );

        }

    }
);

// Reverse Lights

reverseLights.forEach(
    light => {

        light.visible =
            speed < 0;

    }
);

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
        15;

    camera.position.z =
        car.position.z +
        Math.cos(
            car.rotation.y
        ) *
        15;

    camera.position.y = 6;

    camera.lookAt(
        car.position
    );

    renderer.render(
        scene,
        camera
    );

}

animate();
