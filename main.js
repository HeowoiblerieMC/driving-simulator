import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.179.1/build/three.module.js";

// ======================================
// SCENE SETUP
// ======================================

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    10000
);
camera.position.set(0, 10, 20);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.domElement.style.display = "none";
document.body.appendChild(renderer.domElement);

// ======================================
// LIGHTING
// ======================================

const light = new THREE.DirectionalLight(0xffffff, 2);
light.position.set(100, 200, 100);
scene.add(light);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.42);
scene.add(ambientLight);

// ======================================
// GROUND
// ======================================

const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(10000, 10000),
    new THREE.MeshLambertMaterial({ color: 0x3f7526 })
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = 0;
scene.add(ground);

// ======================================
// SCALE AND ROAD DIMENSIONS
// Vehicle width: 4 units = 3 meters
// ======================================

const UNIT_PER_METER = 4 / 3;

const VEHICLE_WIDTH = 3 * UNIT_PER_METER;
const LANE_WIDTH = 5 * UNIT_PER_METER;
const STANDARD_SIDEWALK_WIDTH = 3 * UNIT_PER_METER;
const RESIDENTIAL_SIDEWALK_WIDTH = 2 * UNIT_PER_METER;
const RESIDENTIAL_ROAD_WIDTH = 6 * UNIT_PER_METER;
const MEDIAN_WIDTH = 5 * UNIT_PER_METER;

// Main boulevard: two lanes, median, two lanes.
const MAIN_CARRIAGEWAY_WIDTH = LANE_WIDTH * 2;
const MAJOR_CARRIAGEWAY_WIDTH = MAIN_CARRIAGEWAY_WIDTH;
const MAIN_ROAD_TOTAL_WIDTH = MAIN_CARRIAGEWAY_WIDTH * 2 + MEDIAN_WIDTH;
const MAIN_ROAD_HALF_WIDTH = MAIN_ROAD_TOTAL_WIDTH / 2;
const MAIN_CARRIAGEWAY_CENTER = MEDIAN_WIDTH / 2 + MAIN_CARRIAGEWAY_WIDTH / 2;

// 250m crossing road: one lane each direction, no median.
const SIGNAL_ROAD_WIDTH = LANE_WIDTH * 2;
const SIGNAL_ROAD_HALF_WIDTH = SIGNAL_ROAD_WIDTH / 2;

// 500m crossing road: two lanes each direction and median.
const MAJOR_ROAD_WIDTH = MAIN_ROAD_TOTAL_WIDTH;
const MAJOR_ROAD_HALF_WIDTH = MAJOR_ROAD_WIDTH / 2;

// Lane-center positions on the main boulevard.
const NEGATIVE_INNER_LANE_X = -MEDIAN_WIDTH / 2 - LANE_WIDTH / 2;
const NEGATIVE_OUTER_LANE_X = -MEDIAN_WIDTH / 2 - LANE_WIDTH * 1.5;
const POSITIVE_INNER_LANE_X = MEDIAN_WIDTH / 2 + LANE_WIDTH / 2;
const POSITIVE_OUTER_LANE_X = MEDIAN_WIDTH / 2 + LANE_WIDTH * 1.5;

// Road lengths.
const RESIDENTIAL_ROAD_LENGTH = 120;
const SIGNAL_ROAD_LENGTH = 180;
const MAJOR_ROAD_LENGTH = 220;
const MAP_START = -5000;
const MAP_END = 5000;

// Heights.
const ROAD_Y = 0.1;
const SIDEWALK_Y = 0.17;
const MEDIAN_Y = 0.25;
const MARKING_Y = 0.225;

// Road-marking settings.
const CROSSWALK_DISTANCE_FROM_EDGE = 3;
const CROSSWALK_DEPTH = 4;
const STOP_LINE_CLEARANCE = 1.0;
const STOP_LINE_THICKNESS = 0.52;
const STOP_LINE_OFFSET =
    CROSSWALK_DEPTH / 2 +
    STOP_LINE_CLEARANCE +
    STOP_LINE_THICKNESS / 2;
const ARROW_DISTANCE_FROM_STOP_LINE = 13;

// Right-turn approach settings.
const TURN_LANE_LENGTH = 60;
const TURN_ARROW_DISTANCE_FROM_INTERSECTION = 24;

// ======================================
// MATERIALS
// ======================================

const roadMaterial = new THREE.MeshLambertMaterial({ color: 0x2f2f2f });
const majorRoadMaterial = new THREE.MeshLambertMaterial({ color: 0x292929 });
const sidewalkMaterial = new THREE.MeshLambertMaterial({ color: 0xd0d0d0 });
const mainSidewalkMaterial = new THREE.MeshLambertMaterial({ color: 0xbcbcbc });
const medianMaterial = new THREE.MeshLambertMaterial({ color: 0x4d8a3d });
const whiteMarkingMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    side: THREE.DoubleSide
});
const yellowMarkingMaterial = new THREE.MeshBasicMaterial({
    color: 0xffcc33,
    side: THREE.DoubleSide
});

// ======================================
// GENERAL HELPERS
// ======================================

function createBox(width, height, depth, material, x, y, z) {
    const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(width, height, depth),
        material
    );
    mesh.position.set(x, y, z);
    scene.add(mesh);
    return mesh;
}

function addHorizontalMarkingSegment(
    startX,
    endX,
    z,
    thickness = 0.18,
    material = whiteMarkingMaterial
) {
    const length = endX - startX;
    if (length <= 0) return null;

    return createBox(
        length,
        0.03,
        thickness,
        material,
        startX + length / 2,
        MARKING_Y,
        z
    );
}

function addVerticalMarkingSegment(
    x,
    startZ,
    endZ,
    thickness = 0.18,
    material = whiteMarkingMaterial
) {
    const length = endZ - startZ;
    if (length <= 0) return null;

    return createBox(
        thickness,
        0.03,
        length,
        material,
        x,
        MARKING_Y,
        startZ + length / 2
    );
}

// ======================================
// STOP LINES
// ======================================

function createStopLineAcrossX(centerX, z, width) {
    return createBox(
        width,
        0.04,
        STOP_LINE_THICKNESS,
        whiteMarkingMaterial,
        centerX,
        MARKING_Y + 0.015,
        z
    );
}

function createStopLineAcrossZ(x, centerZ, width) {
    return createBox(
        STOP_LINE_THICKNESS,
        0.04,
        width,
        whiteMarkingMaterial,
        x,
        MARKING_Y + 0.015,
        centerZ
    );
}

// ======================================
// CROSSWALKS
// ======================================

function createCrosswalkAcrossX(centerZ, roadWidth) {
    const stripeWidth = 0.75;
    const stripeDepth = CROSSWALK_DEPTH;
    const stripeGap = 0.75;
    const sideMargin = 1;
    const usableWidth = roadWidth - sideMargin * 2;
    const stripeCount = Math.max(
        1,
        Math.floor((usableWidth + stripeGap) / (stripeWidth + stripeGap))
    );
    const totalWidth =
        stripeCount * stripeWidth + (stripeCount - 1) * stripeGap;
    const startX = -totalWidth / 2 + stripeWidth / 2;

    for (let i = 0; i < stripeCount; i++) {
        createBox(
            stripeWidth,
            0.035,
            stripeDepth,
            whiteMarkingMaterial,
            startX + i * (stripeWidth + stripeGap),
            MARKING_Y + 0.01,
            centerZ
        );
    }
}

function createCrosswalkAcrossZ(centerX, roadWidth, centerZ) {
    const stripeWidth = 0.75;
    const stripeDepth = CROSSWALK_DEPTH;
    const stripeGap = 0.75;
    const sideMargin = 1;
    const usableWidth = roadWidth - sideMargin * 2;
    const stripeCount = Math.max(
        1,
        Math.floor((usableWidth + stripeGap) / (stripeWidth + stripeGap))
    );
    const totalDepth =
        stripeCount * stripeWidth + (stripeCount - 1) * stripeGap;
    const startZ = centerZ - totalDepth / 2 + stripeWidth / 2;

    for (let i = 0; i < stripeCount; i++) {
        createBox(
            stripeDepth,
            0.035,
            stripeWidth,
            whiteMarkingMaterial,
            centerX,
            MARKING_Y + 0.01,
            startZ + i * (stripeWidth + stripeGap)
        );
    }
}

// ======================================
// JAPANESE-STYLE ROAD ARROWS
// Long, narrow arrows, one per lane.
// Local +Y is the forward direction before rotation.
// ======================================

function createStraightArrowShape() {
    const halfLength = 3.8;
    const shaftHalfWidth = 0.17;
    const headBaseY = 1.65;
    const headHalfWidth = 0.72;

    const shape = new THREE.Shape();
    shape.moveTo(-shaftHalfWidth, -halfLength);
    shape.lineTo(shaftHalfWidth, -halfLength);
    shape.lineTo(shaftHalfWidth, headBaseY);
    shape.lineTo(headHalfWidth, headBaseY);
    shape.lineTo(0, halfLength);
    shape.lineTo(-headHalfWidth, headBaseY);
    shape.lineTo(-shaftHalfWidth, headBaseY);
    shape.closePath();
    return shape;
}

function createTurnArrowShape(turnDirection) {
    const mirror = turnDirection === "right" ? -1 : 1;
    const shaftHalfWidth = 0.17;
    const rearY = -3.8;
    const curveStartY = 0.25;
    const branchY = 1.15;
    const branchInnerX = 0.55 * mirror;
    const branchBaseX = 1.65 * mirror;
    const tipX = 2.85 * mirror;
    const headHalfHeight = 0.72;

    const shape = new THREE.Shape();
    shape.moveTo(-shaftHalfWidth, rearY);
    shape.lineTo(shaftHalfWidth, rearY);
    shape.lineTo(shaftHalfWidth, curveStartY);

    if (mirror < 0) {
        shape.bezierCurveTo(
            shaftHalfWidth,
            0.7,
            0.05,
            branchY,
            branchInnerX,
            branchY
        );
        shape.lineTo(branchBaseX, branchY);
        shape.lineTo(branchBaseX, branchY - headHalfHeight);
        shape.lineTo(tipX, branchY);
        shape.lineTo(branchBaseX, branchY + headHalfHeight);
        shape.lineTo(branchBaseX, branchY + 0.34);
        shape.lineTo(branchInnerX, branchY + 0.34);
        shape.bezierCurveTo(
            -0.62,
            1.49,
            -shaftHalfWidth,
            0.85,
            -shaftHalfWidth,
            curveStartY
        );
    } else {
        shape.bezierCurveTo(
            shaftHalfWidth,
            0.85,
            0.62,
            1.49,
            branchInnerX,
            branchY + 0.34
        );
        shape.lineTo(branchBaseX, branchY + 0.34);
        shape.lineTo(branchBaseX, branchY + headHalfHeight);
        shape.lineTo(tipX, branchY);
        shape.lineTo(branchBaseX, branchY - headHalfHeight);
        shape.lineTo(branchBaseX, branchY);
        shape.lineTo(branchInnerX, branchY);
        shape.bezierCurveTo(
            -0.05,
            branchY,
            -shaftHalfWidth,
            0.7,
            -shaftHalfWidth,
            curveStartY
        );
    }

    shape.lineTo(-shaftHalfWidth, rearY);
    shape.closePath();
    return shape;
}

function createRoadArrow(x, z, direction = 0, type = "straight") {
    let shape;

    if (type === "right") {
        shape = createTurnArrowShape("right");
    } else if (type === "left") {
        shape = createTurnArrowShape("left");
    } else {
        shape = createStraightArrowShape();
    }

    const arrowMesh = new THREE.Mesh(
        new THREE.ShapeGeometry(shape),
        whiteMarkingMaterial
    );
    arrowMesh.rotation.x = -Math.PI / 2;

    const arrowGroup = new THREE.Group();
    arrowGroup.add(arrowMesh);
    arrowGroup.position.set(x, MARKING_Y + 0.015, z);
    arrowGroup.rotation.y = direction;
    scene.add(arrowGroup);
    return arrowGroup;
}

// ======================================
// INTERSECTION LISTS
// ======================================

const minorRoads = [];
const signalIntersections = [];
const majorIntersections = [];

for (let z = MAP_START; z <= MAP_END; z += 125) {
    if (z === 0) continue;

    if (z % 500 === 0) {
        majorIntersections.push(z);
    } else if (z % 250 === 0) {
        signalIntersections.push(z);
    } else {
        minorRoads.push(z);
    }
}

function isMinorIntersection(z) {
    return minorRoads.some((i) => Math.abs(z - i) < 7);
}

function isSignalIntersection(z) {
    return signalIntersections.some((i) => Math.abs(z - i) < 25);
}

function isMajorIntersection(z) {
    return majorIntersections.some((i) => Math.abs(z - i) < 35);
}

function isReservedArea(z) {
    return (
        isMinorIntersection(z) ||
        isSignalIntersection(z) ||
        isMajorIntersection(z) ||
        Math.abs(z) < 60
    );
}

// ======================================
// MAIN BOULEVARD
// ======================================

createBox(
    MAIN_CARRIAGEWAY_WIDTH,
    0.2,
    MAP_END - MAP_START,
    roadMaterial,
    -MAIN_CARRIAGEWAY_CENTER,
    ROAD_Y,
    0
);

createBox(
    MAIN_CARRIAGEWAY_WIDTH,
    0.2,
    MAP_END - MAP_START,
    roadMaterial,
    MAIN_CARRIAGEWAY_CENTER,
    ROAD_Y,
    0
);

// Asphalt base underneath every median opening.
createBox(
    MEDIAN_WIDTH,
    0.2,
    MAP_END - MAP_START,
    roadMaterial,
    0,
    ROAD_Y,
    0
);

// ======================================
// MAIN BOULEVARD SIDEWALKS
// ======================================

const sidewalkZones = [];

for (const z of minorRoads) {
    sidewalkZones.push({
        z,
        halfWidth: RESIDENTIAL_ROAD_WIDTH / 2 + RESIDENTIAL_SIDEWALK_WIDTH
    });
}

for (const z of signalIntersections) {
    sidewalkZones.push({
        z,
        halfWidth: SIGNAL_ROAD_HALF_WIDTH + STANDARD_SIDEWALK_WIDTH
    });
}

for (const z of majorIntersections) {
    sidewalkZones.push({
        z,
        halfWidth: MAJOR_ROAD_HALF_WIDTH + STANDARD_SIDEWALK_WIDTH
    });
}

sidewalkZones.push({
    z: 0,
    halfWidth: MAJOR_ROAD_HALF_WIDTH + STANDARD_SIDEWALK_WIDTH
});

sidewalkZones.sort((a, b) => a.z - b.z);

const mainSidewalkCenterX =
    MAIN_ROAD_HALF_WIDTH + STANDARD_SIDEWALK_WIDTH / 2;
let previousSidewalkEnd = MAP_START;

for (const zone of sidewalkZones) {
    const sectionEnd = zone.z - zone.halfWidth;
    const sectionLength = sectionEnd - previousSidewalkEnd;

    if (sectionLength > 0) {
        const sectionCenter = previousSidewalkEnd + sectionLength / 2;

        createBox(
            STANDARD_SIDEWALK_WIDTH,
            0.35,
            sectionLength,
            mainSidewalkMaterial,
            -mainSidewalkCenterX,
            SIDEWALK_Y,
            sectionCenter
        );

        createBox(
            STANDARD_SIDEWALK_WIDTH,
            0.35,
            sectionLength,
            mainSidewalkMaterial,
            mainSidewalkCenterX,
            SIDEWALK_Y,
            sectionCenter
        );
    }

    previousSidewalkEnd = Math.max(
        previousSidewalkEnd,
        zone.z + zone.halfWidth
    );
}

if (previousSidewalkEnd < MAP_END) {
    const sectionLength = MAP_END - previousSidewalkEnd;
    const sectionCenter = previousSidewalkEnd + sectionLength / 2;

    createBox(
        STANDARD_SIDEWALK_WIDTH,
        0.35,
        sectionLength,
        mainSidewalkMaterial,
        -mainSidewalkCenterX,
        SIDEWALK_Y,
        sectionCenter
    );

    createBox(
        STANDARD_SIDEWALK_WIDTH,
        0.35,
        sectionLength,
        mainSidewalkMaterial,
        mainSidewalkCenterX,
        SIDEWALK_Y,
        sectionCenter
    );
}

// ======================================
// 125m RESIDENTIAL ROADS
// One-way, road 6m, sidewalk 2m.
// ======================================

const residentialRoadCenterX =
    MAIN_ROAD_HALF_WIDTH + RESIDENTIAL_ROAD_LENGTH / 2;
const residentialSidewalkOffsetZ =
    RESIDENTIAL_ROAD_WIDTH / 2 + RESIDENTIAL_SIDEWALK_WIDTH / 2;

for (const z of minorRoads) {
    for (const side of [-1, 1]) {
        const roadCenterX = side * residentialRoadCenterX;

        createBox(
            RESIDENTIAL_ROAD_LENGTH,
            0.2,
            RESIDENTIAL_ROAD_WIDTH,
            roadMaterial,
            roadCenterX,
            ROAD_Y,
            z
        );

        createBox(
            RESIDENTIAL_ROAD_LENGTH,
            0.3,
            RESIDENTIAL_SIDEWALK_WIDTH,
            sidewalkMaterial,
            roadCenterX,
            SIDEWALK_Y,
            z + residentialSidewalkOffsetZ
        );

        createBox(
            RESIDENTIAL_ROAD_LENGTH,
            0.3,
            RESIDENTIAL_SIDEWALK_WIDTH,
            sidewalkMaterial,
            roadCenterX,
            SIDEWALK_Y,
            z - residentialSidewalkOffsetZ
        );
    }
}

// ======================================
// 250m SIGNAL INTERSECTIONS
// One lane each direction, no median.
// ======================================

const signalSidewalkOffsetZ =
    SIGNAL_ROAD_HALF_WIDTH + STANDARD_SIDEWALK_WIDTH / 2;
const signalSidewalkSegmentLength =
    (SIGNAL_ROAD_LENGTH - MAIN_ROAD_TOTAL_WIDTH) / 2;
const signalSidewalkCenterX =
    MAIN_ROAD_HALF_WIDTH + signalSidewalkSegmentLength / 2;

for (const z of signalIntersections) {
    createBox(
        SIGNAL_ROAD_LENGTH,
        0.2,
        SIGNAL_ROAD_WIDTH,
        roadMaterial,
        0,
        ROAD_Y,
        z
    );

    for (const x of [-signalSidewalkCenterX, signalSidewalkCenterX]) {
        createBox(
            signalSidewalkSegmentLength,
            0.3,
            STANDARD_SIDEWALK_WIDTH,
            sidewalkMaterial,
            x,
            SIDEWALK_Y,
            z + signalSidewalkOffsetZ
        );

        createBox(
            signalSidewalkSegmentLength,
            0.3,
            STANDARD_SIDEWALK_WIDTH,
            sidewalkMaterial,
            x,
            SIDEWALK_Y,
            z - signalSidewalkOffsetZ
        );
    }

    addHorizontalMarkingSegment(
        -SIGNAL_ROAD_LENGTH / 2,
        -MAIN_ROAD_HALF_WIDTH,
        z
    );
    addHorizontalMarkingSegment(
        MAIN_ROAD_HALF_WIDTH,
        SIGNAL_ROAD_LENGTH / 2,
        z
    );

    const northCrosswalkZ =
        z + SIGNAL_ROAD_HALF_WIDTH + CROSSWALK_DISTANCE_FROM_EDGE;
    const southCrosswalkZ =
        z - SIGNAL_ROAD_HALF_WIDTH - CROSSWALK_DISTANCE_FROM_EDGE;
    const westCrosswalkX =
        -MAIN_ROAD_HALF_WIDTH - CROSSWALK_DISTANCE_FROM_EDGE;
    const eastCrosswalkX =
        MAIN_ROAD_HALF_WIDTH + CROSSWALK_DISTANCE_FROM_EDGE;

    createCrosswalkAcrossX(northCrosswalkZ, MAIN_ROAD_TOTAL_WIDTH);
    createCrosswalkAcrossX(southCrosswalkZ, MAIN_ROAD_TOTAL_WIDTH);
    createCrosswalkAcrossZ(westCrosswalkX, SIGNAL_ROAD_WIDTH, z);
    createCrosswalkAcrossZ(eastCrosswalkX, SIGNAL_ROAD_WIDTH, z);

    const southStopLineZ = southCrosswalkZ - STOP_LINE_OFFSET;
    const northStopLineZ = northCrosswalkZ + STOP_LINE_OFFSET;
    const westStopLineX = westCrosswalkX - STOP_LINE_OFFSET;
    const eastStopLineX = eastCrosswalkX + STOP_LINE_OFFSET;

    createStopLineAcrossX(
        -MAIN_CARRIAGEWAY_CENTER,
        southStopLineZ,
        MAIN_CARRIAGEWAY_WIDTH
    );
    createStopLineAcrossX(
        MAIN_CARRIAGEWAY_CENTER,
        northStopLineZ,
        MAIN_CARRIAGEWAY_WIDTH
    );
    createStopLineAcrossZ(
        westStopLineX,
        z + LANE_WIDTH / 2,
        LANE_WIDTH
    );
    createStopLineAcrossZ(
        eastStopLineX,
        z - LANE_WIDTH / 2,
        LANE_WIDTH
    );

    // Main-boulevard arrows: one per lane.
    createRoadArrow(
        NEGATIVE_INNER_LANE_X,
        southStopLineZ - ARROW_DISTANCE_FROM_STOP_LINE,
        Math.PI,
        "straight"
    );
    createRoadArrow(
        NEGATIVE_OUTER_LANE_X,
        southStopLineZ - ARROW_DISTANCE_FROM_STOP_LINE,
        Math.PI,
        "straight"
    );
    createRoadArrow(
        POSITIVE_INNER_LANE_X,
        northStopLineZ + ARROW_DISTANCE_FROM_STOP_LINE,
        0,
        "straight"
    );
    createRoadArrow(
        POSITIVE_OUTER_LANE_X,
        northStopLineZ + ARROW_DISTANCE_FROM_STOP_LINE,
        0,
        "straight"
    );

    // Crossing-road arrows: one per approach lane.
    createRoadArrow(
        westStopLineX - ARROW_DISTANCE_FROM_STOP_LINE,
        z + LANE_WIDTH / 2,
        -Math.PI / 2,
        "straight"
    );
    createRoadArrow(
        eastStopLineX + ARROW_DISTANCE_FROM_STOP_LINE,
        z - LANE_WIDTH / 2,
        Math.PI / 2,
        "straight"
    );
}

// ======================================
// 500m MAJOR INTERSECTIONS
// Two lanes each direction and median.
// ======================================

const majorSidewalkOffsetZ =
    MAJOR_ROAD_HALF_WIDTH + STANDARD_SIDEWALK_WIDTH / 2;
const majorSidewalkSegmentLength =
    (MAJOR_ROAD_LENGTH - MAIN_ROAD_TOTAL_WIDTH) / 2;
const majorSidewalkCenterX =
    MAIN_ROAD_HALF_WIDTH + majorSidewalkSegmentLength / 2;

for (const z of majorIntersections) {
    createBox(
        MAJOR_ROAD_LENGTH,
        0.2,
        MAJOR_ROAD_WIDTH,
        majorRoadMaterial,
        0,
        ROAD_Y,
        z
    );

    for (const x of [-majorSidewalkCenterX, majorSidewalkCenterX]) {
        createBox(
            majorSidewalkSegmentLength,
            0.3,
            STANDARD_SIDEWALK_WIDTH,
            sidewalkMaterial,
            x,
            SIDEWALK_Y,
            z + majorSidewalkOffsetZ
        );

        createBox(
            majorSidewalkSegmentLength,
            0.3,
            STANDARD_SIDEWALK_WIDTH,
            sidewalkMaterial,
            x,
            SIDEWALK_Y,
            z - majorSidewalkOffsetZ
        );
    }

    const horizontalMedianLength =
        (MAJOR_ROAD_LENGTH - MAIN_ROAD_TOTAL_WIDTH) / 2;
    const horizontalMedianCenterX =
        MAIN_ROAD_HALF_WIDTH + horizontalMedianLength / 2;

    createBox(
        horizontalMedianLength,
        0.3,
        MEDIAN_WIDTH,
        medianMaterial,
        -horizontalMedianCenterX,
        MEDIAN_Y,
        z
    );
    createBox(
        horizontalMedianLength,
        0.3,
        MEDIAN_WIDTH,
        medianMaterial,
        horizontalMedianCenterX,
        MEDIAN_Y,
        z
    );

    const horizontalLaneLineOffset = MEDIAN_WIDTH / 2 + LANE_WIDTH;

    for (const lineZ of [
        z - horizontalLaneLineOffset,
        z + horizontalLaneLineOffset
    ]) {
        addHorizontalMarkingSegment(
            -MAJOR_ROAD_LENGTH / 2,
            -MAIN_ROAD_HALF_WIDTH,
            lineZ
        );
        addHorizontalMarkingSegment(
            MAIN_ROAD_HALF_WIDTH,
            MAJOR_ROAD_LENGTH / 2,
            lineZ
        );
    }

    const northCrosswalkZ =
        z + MAJOR_ROAD_HALF_WIDTH + CROSSWALK_DISTANCE_FROM_EDGE;
    const southCrosswalkZ =
        z - MAJOR_ROAD_HALF_WIDTH - CROSSWALK_DISTANCE_FROM_EDGE;
    const westCrosswalkX =
        -MAIN_ROAD_HALF_WIDTH - CROSSWALK_DISTANCE_FROM_EDGE;
    const eastCrosswalkX =
        MAIN_ROAD_HALF_WIDTH + CROSSWALK_DISTANCE_FROM_EDGE;

    createCrosswalkAcrossX(northCrosswalkZ, MAIN_ROAD_TOTAL_WIDTH);
    createCrosswalkAcrossX(southCrosswalkZ, MAIN_ROAD_TOTAL_WIDTH);
    createCrosswalkAcrossZ(westCrosswalkX, MAJOR_ROAD_WIDTH, z);
    createCrosswalkAcrossZ(eastCrosswalkX, MAJOR_ROAD_WIDTH, z);

    const southStopLineZ = southCrosswalkZ - STOP_LINE_OFFSET;
    const northStopLineZ = northCrosswalkZ + STOP_LINE_OFFSET;
    const westStopLineX = westCrosswalkX - STOP_LINE_OFFSET;
    const eastStopLineX = eastCrosswalkX + STOP_LINE_OFFSET;

    createStopLineAcrossX(
        -MAIN_CARRIAGEWAY_CENTER,
        southStopLineZ,
        MAIN_CARRIAGEWAY_WIDTH
    );
    createStopLineAcrossX(
        MAIN_CARRIAGEWAY_CENTER,
        northStopLineZ,
        MAIN_CARRIAGEWAY_WIDTH
    );
    createStopLineAcrossZ(
        westStopLineX,
        z + MAIN_CARRIAGEWAY_CENTER,
        MAJOR_CARRIAGEWAY_WIDTH
    );
    createStopLineAcrossZ(
        eastStopLineX,
        z - MAIN_CARRIAGEWAY_CENTER,
        MAJOR_CARRIAGEWAY_WIDTH
    );

    // Main-boulevard straight arrows, one per lane.
    createRoadArrow(
        NEGATIVE_INNER_LANE_X,
        southStopLineZ - ARROW_DISTANCE_FROM_STOP_LINE,
        Math.PI,
        "straight"
    );
    createRoadArrow(
        NEGATIVE_OUTER_LANE_X,
        southStopLineZ - ARROW_DISTANCE_FROM_STOP_LINE,
        Math.PI,
        "straight"
    );
    createRoadArrow(
        POSITIVE_INNER_LANE_X,
        northStopLineZ + ARROW_DISTANCE_FROM_STOP_LINE,
        0,
        "straight"
    );
    createRoadArrow(
        POSITIVE_OUTER_LANE_X,
        northStopLineZ + ARROW_DISTANCE_FROM_STOP_LINE,
        0,
        "straight"
    );

    // Crossing major-road arrows, one per lane.
    const westInnerLaneZ = z + MEDIAN_WIDTH / 2 + LANE_WIDTH / 2;
    const westOuterLaneZ = z + MEDIAN_WIDTH / 2 + LANE_WIDTH * 1.5;
    const eastInnerLaneZ = z - MEDIAN_WIDTH / 2 - LANE_WIDTH / 2;
    const eastOuterLaneZ = z - MEDIAN_WIDTH / 2 - LANE_WIDTH * 1.5;

    createRoadArrow(
        westStopLineX - ARROW_DISTANCE_FROM_STOP_LINE,
        westInnerLaneZ,
        -Math.PI / 2,
        "straight"
    );
    createRoadArrow(
        westStopLineX - ARROW_DISTANCE_FROM_STOP_LINE,
        westOuterLaneZ,
        -Math.PI / 2,
        "straight"
    );
    createRoadArrow(
        eastStopLineX + ARROW_DISTANCE_FROM_STOP_LINE,
        eastInnerLaneZ,
        Math.PI / 2,
        "straight"
    );
    createRoadArrow(
        eastStopLineX + ARROW_DISTANCE_FROM_STOP_LINE,
        eastOuterLaneZ,
        Math.PI / 2,
        "straight"
    );
}

// ======================================
// SCRAMBLE INTERSECTION
// Center: z = 0
// ======================================

createBox(
    MAJOR_ROAD_LENGTH,
    0.2,
    MAJOR_ROAD_WIDTH,
    majorRoadMaterial,
    0,
    ROAD_Y,
    0
);

const scrambleNorthZ =
    MAJOR_ROAD_HALF_WIDTH + CROSSWALK_DISTANCE_FROM_EDGE;
const scrambleSouthZ =
    -MAJOR_ROAD_HALF_WIDTH - CROSSWALK_DISTANCE_FROM_EDGE;
const scrambleWestX =
    -MAIN_ROAD_HALF_WIDTH - CROSSWALK_DISTANCE_FROM_EDGE;
const scrambleEastX =
    MAIN_ROAD_HALF_WIDTH + CROSSWALK_DISTANCE_FROM_EDGE;

createCrosswalkAcrossX(scrambleNorthZ, MAIN_ROAD_TOTAL_WIDTH);
createCrosswalkAcrossX(scrambleSouthZ, MAIN_ROAD_TOTAL_WIDTH);
createCrosswalkAcrossZ(scrambleWestX, MAJOR_ROAD_WIDTH, 0);
createCrosswalkAcrossZ(scrambleEastX, MAJOR_ROAD_WIDTH, 0);

// ======================================
// SCRAMBLE DIAGONAL CROSSWALKS
// ======================================

function createDiagonalCrosswalk(rotation) {
    const stripeCount = 15;
    const crossingLength = 32;
    const crossingWidth = 4;

    for (let i = 0; i < stripeCount; i++) {
        const progress = i / (stripeCount - 1) - 0.5;
        const stripe = createBox(
            0.7,
            0.035,
            crossingWidth,
            whiteMarkingMaterial,
            0,
            MARKING_Y + 0.012,
            0
        );

        stripe.rotation.y = rotation;
        stripe.position.x =
            Math.sin(rotation) * progress * crossingLength;
        stripe.position.z =
            Math.cos(rotation) * progress * crossingLength;
    }
}

createDiagonalCrosswalk(Math.PI / 4);
createDiagonalCrosswalk(-Math.PI / 4);

// Scramble stop lines.
const scrambleSouthStopLineZ = scrambleSouthZ - STOP_LINE_OFFSET;
const scrambleNorthStopLineZ = scrambleNorthZ + STOP_LINE_OFFSET;
const scrambleWestStopLineX = scrambleWestX - STOP_LINE_OFFSET;
const scrambleEastStopLineX = scrambleEastX + STOP_LINE_OFFSET;

createStopLineAcrossX(
    -MAIN_CARRIAGEWAY_CENTER,
    scrambleSouthStopLineZ,
    MAIN_CARRIAGEWAY_WIDTH
);
createStopLineAcrossX(
    MAIN_CARRIAGEWAY_CENTER,
    scrambleNorthStopLineZ,
    MAIN_CARRIAGEWAY_WIDTH
);
createStopLineAcrossZ(
    scrambleWestStopLineX,
    MAIN_CARRIAGEWAY_CENTER,
    MAJOR_CARRIAGEWAY_WIDTH
);
createStopLineAcrossZ(
    scrambleEastStopLineX,
    -MAIN_CARRIAGEWAY_CENTER,
    MAJOR_CARRIAGEWAY_WIDTH
);

// Scramble approach arrows, one per lane.
createRoadArrow(
    NEGATIVE_INNER_LANE_X,
    scrambleSouthStopLineZ - ARROW_DISTANCE_FROM_STOP_LINE,
    Math.PI,
    "straight"
);
createRoadArrow(
    NEGATIVE_OUTER_LANE_X,
    scrambleSouthStopLineZ - ARROW_DISTANCE_FROM_STOP_LINE,
    Math.PI,
    "straight"
);
createRoadArrow(
    POSITIVE_INNER_LANE_X,
    scrambleNorthStopLineZ + ARROW_DISTANCE_FROM_STOP_LINE,
    0,
    "straight"
);
createRoadArrow(
    POSITIVE_OUTER_LANE_X,
    scrambleNorthStopLineZ + ARROW_DISTANCE_FROM_STOP_LINE,
    0,
    "straight"
);

const scrambleWestInnerLaneZ = MEDIAN_WIDTH / 2 + LANE_WIDTH / 2;
const scrambleWestOuterLaneZ = MEDIAN_WIDTH / 2 + LANE_WIDTH * 1.5;
const scrambleEastInnerLaneZ = -MEDIAN_WIDTH / 2 - LANE_WIDTH / 2;
const scrambleEastOuterLaneZ = -MEDIAN_WIDTH / 2 - LANE_WIDTH * 1.5;

createRoadArrow(
    scrambleWestStopLineX - ARROW_DISTANCE_FROM_STOP_LINE,
    scrambleWestInnerLaneZ,
    -Math.PI / 2,
    "straight"
);
createRoadArrow(
    scrambleWestStopLineX - ARROW_DISTANCE_FROM_STOP_LINE,
    scrambleWestOuterLaneZ,
    -Math.PI / 2,
    "straight"
);
createRoadArrow(
    scrambleEastStopLineX + ARROW_DISTANCE_FROM_STOP_LINE,
    scrambleEastInnerLaneZ,
    Math.PI / 2,
    "straight"
);
createRoadArrow(
    scrambleEastStopLineX + ARROW_DISTANCE_FROM_STOP_LINE,
    scrambleEastOuterLaneZ,
    Math.PI / 2,
    "straight"
);

// ======================================
// MAIN MEDIAN
// Removed near intersections.
// ======================================

const medianZones = [];

for (const z of signalIntersections) {
    medianZones.push({
        z,
        halfWidth: SIGNAL_ROAD_HALF_WIDTH + 12
    });
}

for (const z of majorIntersections) {
    medianZones.push({
        z,
        halfWidth: MAJOR_ROAD_HALF_WIDTH + TURN_LANE_LENGTH
    });
}

medianZones.push({
    z: 0,
    halfWidth: 60
});

function isInsideMedianZone(z) {
    return medianZones.some((zone) =>
        Math.abs(z - zone.z) < zone.halfWidth
    );
}

const medianSectionLength = 10;

for (
    let z = MAP_START + medianSectionLength / 2;
    z < MAP_END;
    z += medianSectionLength
) {
    if (isInsideMedianZone(z)) continue;

    createBox(
        MEDIAN_WIDTH,
        0.3,
        medianSectionLength,
        medianMaterial,
        0,
        MEDIAN_Y,
        z
    );
}

// ======================================
// RIGHT-TURN APPROACH AREAS
// 500m intersections only.
// The removed median is already asphalt.
// ======================================

function createRightTurnApproach(z, showArrows = true) {
    // Slightly raised asphalt prevents z-fighting with the asphalt base.
    createBox(
        MEDIAN_WIDTH,
        0.205,
        TURN_LANE_LENGTH,
        majorRoadMaterial,
        0,
        ROAD_Y + 0.004,
        z + MAJOR_ROAD_HALF_WIDTH + TURN_LANE_LENGTH / 2
    );

    createBox(
        MEDIAN_WIDTH,
        0.205,
        TURN_LANE_LENGTH,
        majorRoadMaterial,
        0,
        ROAD_Y + 0.004,
        z - MAJOR_ROAD_HALF_WIDTH - TURN_LANE_LENGTH / 2
    );

    if (!showArrows) return;

    // North approach travels toward negative Z.
    createRoadArrow(
        0,
        z + MAJOR_ROAD_HALF_WIDTH + TURN_ARROW_DISTANCE_FROM_INTERSECTION,
        0,
        "right"
    );

    // South approach travels toward positive Z.
    createRoadArrow(
        0,
        z - MAJOR_ROAD_HALF_WIDTH - TURN_ARROW_DISTANCE_FROM_INTERSECTION,
        Math.PI,
        "right"
    );
}

for (const z of majorIntersections) {
    createRightTurnApproach(z, true);
}

// At z = 0, fill the opening but do not add special right-turn arrows.
createRightTurnApproach(0, false);

// ======================================
// MAIN BOULEVARD LANE MARKINGS
// ======================================

const MAIN_LANE_LINE_X = MEDIAN_WIDTH / 2 + LANE_WIDTH;
const laneDashLength = 8;
const laneDashCycle = 20;

function isInsideRoadIntersection(z) {
    if (Math.abs(z) < 60) return true;

    // Keep the dashed lane divider through 125m residential junctions.

    if (
        signalIntersections.some((intersectionZ) =>
            Math.abs(z - intersectionZ) < SIGNAL_ROAD_HALF_WIDTH + 4
        )
    ) {
        return true;
    }

    if (
        majorIntersections.some((intersectionZ) =>
            Math.abs(z - intersectionZ) <
            MAJOR_ROAD_HALF_WIDTH + TURN_LANE_LENGTH
        )
    ) {
        return true;
    }

    return false;
}

for (let z = MAP_START; z <= MAP_END; z += laneDashCycle) {
    if (isInsideRoadIntersection(z)) continue;

    createBox(
        0.18,
        0.04,
        laneDashLength,
        whiteMarkingMaterial,
        -MAIN_LANE_LINE_X,
        MARKING_Y,
        z
    );

    createBox(
        0.18,
        0.04,
        laneDashLength,
        whiteMarkingMaterial,
        MAIN_LANE_LINE_X,
        MARKING_Y,
        z
    );
}

// ======================================
// STREET TREES
// Trees remain inside intact medians.
// ======================================

for (let z = MAP_START; z <= MAP_END; z += 70) {
    if (isInsideMedianZone(z)) continue;

    const trunkHeight = 4 + Math.random() * 2;
    const crownSize = 1.5 + Math.random() * 0.5;
    const leafColor = [0x2e7d32, 0x388e3c, 0x228b22][
        Math.floor(Math.random() * 3)
    ];

    const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.25, 0.35, trunkHeight, 12),
        new THREE.MeshLambertMaterial({ color: 0x6b4423 })
    );
    trunk.position.set(0, trunkHeight / 2, z);
    scene.add(trunk);

    const leafMaterial = new THREE.MeshLambertMaterial({
        color: leafColor
    });

    for (let i = 0; i < 4; i++) {
        const leaf = new THREE.Mesh(
            new THREE.SphereGeometry(crownSize, 16, 16),
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

// ======================================
// VEHICLES
// Rebuilt vehicle system.
// ======================================
// ======================================
// VEHICLES
// 1990s Japanese luxury sedan inspired design.
// ======================================

let car = null;
let speed = 0;
let steeringVisual = 0;
let lastFrameTime = performance.now();

let taillights = [];
let reverseLights = [];
let rearIndicators = [];
let reverseSpotLights = [];
let wheelMeshes = [];

const keys = Object.create(null);

const CAR_PRESETS = {
    sedan:  { body: 0xe4e4df, trim: 0x4b5151 },
    compact:{ body: 0x4e9b55, trim: 0x353b3b },
    suv:    { body: 0x495b8f, trim: 0x30363a },
    sports: { body: 0xa72d29, trim: 0x303030 }
};

function carMaterial(color, options = {}) {
    return new THREE.MeshStandardMaterial({
        color,
        roughness: options.roughness ?? 0.38,
        metalness: options.metalness ?? 0.22,
        transparent: options.transparent ?? false,
        opacity: options.opacity ?? 1,
        emissive: options.emissive ?? 0x000000,
        emissiveIntensity: options.emissiveIntensity ?? 0
    });
}

function addCarBox(parent, size, position, material, rotation = [0, 0, 0]) {
    const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(size[0], size[1], size[2]),
        material
    );
    mesh.position.set(position[0], position[1], position[2]);
    mesh.rotation.set(rotation[0], rotation[1], rotation[2]);
    parent.add(mesh);
    return mesh;
}

function createCabinShell(bodyMaterial) {
    const shape = new THREE.Shape();
    shape.moveTo(-2.35, 0);
    shape.lineTo(-1.55, 1.45);
    shape.lineTo(1.25, 1.45);
    shape.lineTo(2.1, 0);
    shape.closePath();

    const geometry = new THREE.ExtrudeGeometry(shape, {
        depth: 3.15,
        bevelEnabled: true,
        bevelThickness: 0.08,
        bevelSize: 0.08,
        bevelSegments: 2
    });
    geometry.rotateY(Math.PI / 2);
    geometry.translate(-1.575, 0, 0);

    const shell = new THREE.Mesh(geometry, bodyMaterial);
    shell.position.set(0, 1.18, -0.35);
    return shell;
}

function createWheel(sideX, axleZ) {
    const wheelGroup = new THREE.Group();
    const tireMaterial = carMaterial(0x121212, { roughness: 0.9, metalness: 0 });
    const rimMaterial = carMaterial(0xb8bcba, { roughness: 0.25, metalness: 0.75 });
    const darkRimMaterial = carMaterial(0x4a4d4c, { roughness: 0.4, metalness: 0.55 });

    const tire = new THREE.Mesh(
        new THREE.CylinderGeometry(0.82, 0.82, 0.5, 32),
        tireMaterial
    );
    tire.rotation.z = Math.PI / 2;
    wheelGroup.add(tire);

    const rim = new THREE.Mesh(
        new THREE.CylinderGeometry(0.56, 0.56, 0.53, 32),
        rimMaterial
    );
    rim.rotation.z = Math.PI / 2;
    wheelGroup.add(rim);

    const hub = new THREE.Mesh(
        new THREE.CylinderGeometry(0.16, 0.16, 0.56, 20),
        darkRimMaterial
    );
    hub.rotation.z = Math.PI / 2;
    wheelGroup.add(hub);

    for (let i = 0; i < 12; i++) {
        const spoke = addCarBox(
            wheelGroup,
            [0.56, 0.045, 0.07],
            [0, 0, 0],
            darkRimMaterial
        );
        spoke.rotation.x = (Math.PI * 2 * i) / 12;
    }

    wheelGroup.position.set(sideX, 0.82, axleZ);
    wheelMeshes.push(wheelGroup);
    return wheelGroup;
}

function createRearLampUnit(parent, side) {
    const x = side * 1.18;
    const rearZ = -5.47;
    const housingMaterial = carMaterial(0x141414, { roughness: 0.55, metalness: 0 });
    const amberMaterial = carMaterial(0x8a3c02, {
        roughness: 0.28,
        metalness: 0,
        emissive: 0x1a0700,
        emissiveIntensity: 0.25
    });
    const redMaterial = carMaterial(0x5a0000, {
        roughness: 0.25,
        metalness: 0,
        emissive: 0x220000,
        emissiveIntensity: 0.55
    });
    const reverseMaterial = carMaterial(0xb8bcb8, {
        roughness: 0.2,
        metalness: 0,
        emissive: 0x000000,
        emissiveIntensity: 0
    });

    addCarBox(parent, [1.58, 0.48, 0.12], [x, 0.96, rearZ], housingMaterial);

    const indicator = addCarBox(
        parent,
        [0.36, 0.34, 0.07],
        [x + side * 0.53, 0.96, rearZ - 0.08],
        amberMaterial
    );
    rearIndicators.push(indicator);

    const tail = addCarBox(
        parent,
        [0.72, 0.34, 0.07],
        [x, 0.96, rearZ - 0.08],
        redMaterial
    );
    taillights.push(tail);

    const reverse = addCarBox(
        parent,
        [0.3, 0.3, 0.07],
        [x - side * 0.51, 0.96, rearZ - 0.08],
        reverseMaterial
    );
    reverseLights.push(reverse);

    const lensLineMaterial = new THREE.MeshBasicMaterial({
        color: 0xd8d8d8,
        transparent: true,
        opacity: 0.32
    });
    for (const yOffset of [-0.11, 0, 0.11]) {
        addCarBox(
            parent,
            [1.45, 0.018, 0.018],
            [x, 0.96 + yOffset, rearZ - 0.122],
            lensLineMaterial
        );
    }

    const reverseSpot = new THREE.SpotLight(
        0xf7fbff,
        0,
        18,
        Math.PI / 8,
        0.6,
        1.5
    );
    reverseSpot.position.set(x - side * 0.51, 0.98, rearZ - 0.12);
    const target = new THREE.Object3D();
    target.position.set(x - side * 0.51, 0.15, -14);
    parent.add(reverseSpot, target);
    reverseSpot.target = target;
    reverseSpotLights.push(reverseSpot);
}

function disposeObject3D(root) {
    root.traverse((child) => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
            const materials = Array.isArray(child.material)
                ? child.material
                : [child.material];
            for (const material of materials) material.dispose();
        }
    });
}

function createCar(type = "sedan") {
    taillights = [];
    reverseLights = [];
    rearIndicators = [];
    reverseSpotLights = [];
    wheelMeshes = [];

    if (car) {
        scene.remove(car);
        disposeObject3D(car);
    }

    const preset = CAR_PRESETS[type] || CAR_PRESETS.sedan;
    car = new THREE.Group();
    car.name = "playerCar";

    const bodyMaterial = carMaterial(preset.body, { roughness: 0.3, metalness: 0.32 });
    const lowerBodyMaterial = carMaterial(preset.trim, { roughness: 0.6, metalness: 0.12 });
    const chromeMaterial = carMaterial(0xc3c7c6, { roughness: 0.22, metalness: 0.78 });
    const blackMaterial = carMaterial(0x171a1a, { roughness: 0.7, metalness: 0.05 });
    const glassMaterial = carMaterial(0x273640, {
        roughness: 0.15,
        metalness: 0.08,
        transparent: true,
        opacity: 0.76
    });

    // Main three-box sedan body.
    addCarBox(car, [4.0, 0.64, 10.9], [0, 0.88, 0], bodyMaterial);
    addCarBox(car, [3.92, 0.36, 10.55], [0, 0.52, 0], lowerBodyMaterial);
    addCarBox(car, [3.84, 0.34, 3.5], [0, 1.28, 3.62], bodyMaterial, [-0.025, 0, 0]);
    addCarBox(car, [3.84, 0.42, 2.6], [0, 1.19, -4.02], bodyMaterial, [0.018, 0, 0]);
    car.add(createCabinShell(bodyMaterial));

    // Roof and glazing.
    addCarBox(car, [3.18, 0.14, 3.65], [0, 2.52, -0.3], bodyMaterial);
    addCarBox(car, [3.02, 0.78, 0.08], [0, 1.98, 1.56], glassMaterial, [-0.58, 0, 0]);
    addCarBox(car, [3.02, 0.74, 0.08], [0, 1.95, -2.15], glassMaterial, [0.52, 0, 0]);

    // Side windows and pillars.
    for (const side of [-1, 1]) {
        const sideX = side * 1.59;
        addCarBox(car, [0.07, 0.82, 1.52], [sideX, 2.14, 0.72], glassMaterial);
        addCarBox(car, [0.07, 0.82, 1.48], [sideX, 2.14, -1.08], glassMaterial);
        addCarBox(car, [0.1, 0.94, 0.14], [sideX, 2.14, -0.18], blackMaterial);
        addCarBox(car, [0.12, 0.9, 0.15], [sideX, 2.1, -1.92], bodyMaterial, [0.2, 0, 0]);

        // Door seams, handles and side molding.
        addCarBox(car, [0.035, 0.72, 0.055], [side * 2.01, 1.22, -0.1], blackMaterial);
        addCarBox(car, [0.055, 0.12, 0.48], [side * 2.03, 1.58, 0.7], chromeMaterial);
        addCarBox(car, [0.055, 0.12, 0.48], [side * 2.03, 1.58, -1.6], chromeMaterial);
        addCarBox(car, [0.07, 0.14, 8.8], [side * 2.02, 0.88, -0.1], lowerBodyMaterial);
        addCarBox(car, [0.055, 0.06, 8.65], [side * 2.06, 1.0, -0.1], chromeMaterial);

        // Door mirror.
        addCarBox(car, [0.42, 0.3, 0.55], [side * 1.95, 1.82, 1.48], bodyMaterial);
        addCarBox(car, [0.06, 0.22, 0.34], [side * 2.18, 1.82, 1.48], glassMaterial);
    }

    // Front grille, lamps and bumper.
    addCarBox(car, [2.25, 0.52, 0.1], [0, 1.02, 5.39], blackMaterial);
    for (let x = -1.0; x <= 1.001; x += 0.2) {
        addCarBox(car, [0.035, 0.42, 0.03], [x, 1.02, 5.46], chromeMaterial);
    }
    addCarBox(car, [2.4, 0.06, 0.04], [0, 1.27, 5.48], chromeMaterial);
    addCarBox(car, [2.4, 0.06, 0.04], [0, 0.77, 5.48], chromeMaterial);

    const headlightMaterial = carMaterial(0xf5f1d8, {
        roughness: 0.16,
        metalness: 0,
        emissive: 0x332f1d,
        emissiveIntensity: 0.45
    });
    const frontIndicatorMaterial = carMaterial(0xb55b06, {
        roughness: 0.2,
        metalness: 0,
        emissive: 0x2a0e00,
        emissiveIntensity: 0.25
    });
    for (const side of [-1, 1]) {
        addCarBox(car, [0.92, 0.42, 0.1], [side * 1.43, 1.03, 5.4], headlightMaterial);
        addCarBox(car, [0.3, 0.31, 0.1], [side * 1.9, 0.98, 5.37], frontIndicatorMaterial);
    }
    addCarBox(car, [4.18, 0.32, 0.42], [0, 0.48, 5.33], chromeMaterial);
    addCarBox(car, [4.08, 0.1, 0.46], [0, 0.53, 5.38], blackMaterial);
    addCarBox(car, [1.18, 0.43, 0.06], [0, 0.55, 5.58], carMaterial(0xf0f0e8));

    // Rear panel, combination lamps and bumper.
    createRearLampUnit(car, -1);
    createRearLampUnit(car, 1);
    addCarBox(car, [1.08, 0.5, 0.12], [0, 0.96, -5.47], bodyMaterial);
    addCarBox(car, [0.85, 0.055, 0.04], [0, 1.2, -5.56], chromeMaterial);
    addCarBox(car, [1.25, 0.46, 0.055], [0, 0.55, -5.6], carMaterial(0xf2f2e8));
    addCarBox(car, [1.38, 0.56, 0.04], [0, 0.55, -5.54], blackMaterial);
    addCarBox(car, [4.18, 0.34, 0.43], [0, 0.42, -5.35], chromeMaterial);
    addCarBox(car, [4.06, 0.1, 0.47], [0, 0.48, -5.42], blackMaterial);

    // Wheels and simple wheel arches.
    const frontAxleZ = 3.45;
    const rearAxleZ = -3.35;
    for (const side of [-1, 1]) {
        car.add(createWheel(side * 1.9, frontAxleZ));
        car.add(createWheel(side * 1.9, rearAxleZ));
    }

    // Exhaust.
    const exhaust = new THREE.Mesh(
        new THREE.CylinderGeometry(0.11, 0.11, 0.75, 12),
        carMaterial(0x3d4141, { roughness: 0.45, metalness: 0.65 })
    );
    exhaust.rotation.x = Math.PI / 2;
    exhaust.position.set(-1.25, 0.22, -5.55);
    car.add(exhaust);

    scene.add(car);
    car.position.set(NEGATIVE_OUTER_LANE_X, 0, -90);
    car.rotation.y = 0;
}

function updateVehicleLights() {
    const braking = keys["s"] && speed > 0.5;
    const reversing = speed < -0.5;

    for (const light of taillights) {
        light.material.color.set(braking ? 0xff180d : 0x640000);
        light.material.emissive.set(braking ? 0xff0900 : 0x260000);
        light.material.emissiveIntensity = braking ? 3.2 : 0.6;
    }

    for (const light of reverseLights) {
        light.material.color.set(reversing ? 0xffffff : 0xb8bcb8);
        light.material.emissive.set(reversing ? 0xffffff : 0x000000);
        light.material.emissiveIntensity = reversing ? 2.8 : 0;
    }

    for (const spot of reverseSpotLights) {
        spot.intensity = reversing ? 11 : 0;
    }
}

createCar("sedan");

// ======================================
// HUD AND INPUT
// ======================================

const speedometer = document.getElementById("speedometer");
const tachometer = document.getElementById("tachometer");

window.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();
    if (["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(key)) {
        event.preventDefault();
    }
    keys[key] = true;
});

window.addEventListener("keyup", (event) => {
    keys[event.key.toLowerCase()] = false;
});

const playButton = document.getElementById("playBtn");
if (playButton) {
    playButton.addEventListener("click", () => {
        const menu = document.getElementById("menu");
        const hud = document.getElementById("hud");
        if (menu) menu.style.display = "none";
        if (hud) hud.style.display = "block";
        renderer.domElement.style.display = "block";
    });
}

const carButton = document.getElementById("carBtn");
if (carButton) {
    carButton.addEventListener("click", () => {
        const choice = prompt("SELECT CAR\n\ncompact\nsedan\nsuv\nsports");
        if (choice && CAR_PRESETS[choice]) createCar(choice);
    });
}

window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// ======================================
// VEHICLE PHYSICS AND ANIMATION
// ======================================

function updateVehicle(deltaSeconds) {
    const accelerating = keys["w"] || keys["arrowup"];
    const brakingOrReverse = keys["s"] || keys["arrowdown"];
    const steerLeft = keys["a"] || keys["arrowleft"];
    const steerRight = keys["d"] || keys["arrowright"];

    // speed is displayed as km/h. Acceleration is time based.
    if (accelerating) {
        if (speed < -1) {
            speed += 42 * deltaSeconds;
        } else if (speed < 70) {
            speed += 18 * deltaSeconds;
        } else if (speed < 100) {
            speed += 9 * deltaSeconds;
        } else {
            speed += 7.2 * deltaSeconds;
        }
    }

    if (brakingOrReverse) {
        if (speed > 1) {
            speed -= 30 * deltaSeconds;
        } else {
            speed -= 15 * deltaSeconds;
        }
    }

    if (!accelerating && !brakingOrReverse) {
        const rollingResistance = 3.6 * deltaSeconds;
        if (Math.abs(speed) <= rollingResistance) speed = 0;
        else speed -= Math.sign(speed) * rollingResistance;
    }

    speed = THREE.MathUtils.clamp(speed, -35, 160);

    const steerInput = (steerLeft ? 1 : 0) - (steerRight ? 1 : 0);
    steeringVisual = THREE.MathUtils.lerp(
        steeringVisual,
        steerInput,
        1 - Math.exp(-10 * deltaSeconds)
    );

    if (Math.abs(speed) > 0.4) {
        const reverseSteer = speed >= 0 ? 1 : -1;
        const speedSteerScale = THREE.MathUtils.lerp(
            0.75,
            0.3,
            Math.min(Math.abs(speed) / 160, 1)
        );
        car.rotation.y +=
            steeringVisual * reverseSteer * speedSteerScale * deltaSeconds;
    }

    // The modeled vehicle nose is +Z. rotation.y = 0 therefore moves +Z.
    // 0.42 reproduces the original project's apparent road speed at 60 fps.
    const movement = speed * deltaSeconds * 0.42;
    car.position.x += Math.sin(car.rotation.y) * movement;
    car.position.z += Math.cos(car.rotation.y) * movement;

    for (const wheel of wheelMeshes) {
        wheel.rotation.x += movement / 0.82;
    }
}

const cameraTarget = new THREE.Vector3();
const cameraDesired = new THREE.Vector3();

function updateCamera(deltaSeconds) {
    const forwardX = Math.sin(car.rotation.y);
    const forwardZ = Math.cos(car.rotation.y);

    // Camera stays behind the +Z-facing nose and looks ahead of the car.
    cameraDesired.set(
        car.position.x - forwardX * 16,
        car.position.y + 6.2,
        car.position.z - forwardZ * 16
    );

    const followAmount = 1 - Math.exp(-7.5 * deltaSeconds);
    camera.position.lerp(cameraDesired, followAmount);

    cameraTarget.set(
        car.position.x + forwardX * 4.5,
        car.position.y + 1.15,
        car.position.z + forwardZ * 4.5
    );
    camera.lookAt(cameraTarget);
}

function updateHud() {
    if (speedometer) {
        speedometer.textContent = `${Math.round(Math.abs(speed))} km/h`;
    }
    if (tachometer) {
        const rpm = 700 + Math.abs(speed) * 40;
        tachometer.textContent = `${Math.round(rpm)} RPM`;
    }
}

function animate(now = performance.now()) {
    requestAnimationFrame(animate);

    const deltaSeconds = Math.min((now - lastFrameTime) / 1000, 0.05);
    lastFrameTime = now;

    updateVehicle(deltaSeconds);
    updateVehicleLights();
    updateCamera(deltaSeconds);
    updateHud();
    renderer.render(scene, camera);
}

animate();
