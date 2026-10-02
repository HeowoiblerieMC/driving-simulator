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
const STOP_LINE_GAP = 1.35;
const STOP_LINE_THICKNESS = 0.52;
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
    const stripeDepth = 4;
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
    const stripeDepth = 4;
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

function createRoadArrow(x, z, rotationY = 0, type = "straight") {
    let shape;

    if (type === "right") {
        shape = createTurnArrowShape("right");
    } else if (type === "left") {
        shape = createTurnArrowShape("left");
    } else {
        shape = createStraightArrowShape();
    }

    const arrow = new THREE.Mesh(
        new THREE.ShapeGeometry(shape),
        whiteMarkingMaterial
    );
    arrow.rotation.x = -Math.PI / 2;
    arrow.rotation.z = rotationY;
    arrow.position.set(x, MARKING_Y + 0.015, z);
    scene.add(arrow);
    return arrow;
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

    const southStopLineZ = southCrosswalkZ - STOP_LINE_GAP;
    const northStopLineZ = northCrosswalkZ + STOP_LINE_GAP;
    const westStopLineX = westCrosswalkX - STOP_LINE_GAP;
    const eastStopLineX = eastCrosswalkX + STOP_LINE_GAP;

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
        0,
        "straight"
    );
    createRoadArrow(
        NEGATIVE_OUTER_LANE_X,
        southStopLineZ - ARROW_DISTANCE_FROM_STOP_LINE,
        0,
        "straight"
    );
    createRoadArrow(
        POSITIVE_INNER_LANE_X,
        northStopLineZ + ARROW_DISTANCE_FROM_STOP_LINE,
        Math.PI,
        "straight"
    );
    createRoadArrow(
        POSITIVE_OUTER_LANE_X,
        northStopLineZ + ARROW_DISTANCE_FROM_STOP_LINE,
        Math.PI,
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

    const southStopLineZ = southCrosswalkZ - STOP_LINE_GAP;
    const northStopLineZ = northCrosswalkZ + STOP_LINE_GAP;
    const westStopLineX = westCrosswalkX - STOP_LINE_GAP;
    const eastStopLineX = eastCrosswalkX + STOP_LINE_GAP;

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
        0,
        "straight"
    );
    createRoadArrow(
        NEGATIVE_OUTER_LANE_X,
        southStopLineZ - ARROW_DISTANCE_FROM_STOP_LINE,
        0,
        "straight"
    );
    createRoadArrow(
        POSITIVE_INNER_LANE_X,
        northStopLineZ + ARROW_DISTANCE_FROM_STOP_LINE,
        Math.PI,
        "straight"
    );
    createRoadArrow(
        POSITIVE_OUTER_LANE_X,
        northStopLineZ + ARROW_DISTANCE_FROM_STOP_LINE,
        Math.PI,
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
const scrambleSouthStopLineZ = scrambleSouthZ - STOP_LINE_GAP;
const scrambleNorthStopLineZ = scrambleNorthZ + STOP_LINE_GAP;
const scrambleWestStopLineX = scrambleWestX - STOP_LINE_GAP;
const scrambleEastStopLineX = scrambleEastX + STOP_LINE_GAP;

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
    0,
    "straight"
);
createRoadArrow(
    NEGATIVE_OUTER_LANE_X,
    scrambleSouthStopLineZ - ARROW_DISTANCE_FROM_STOP_LINE,
    0,
    "straight"
);
createRoadArrow(
    POSITIVE_INNER_LANE_X,
    scrambleNorthStopLineZ + ARROW_DISTANCE_FROM_STOP_LINE,
    Math.PI,
    "straight"
);
createRoadArrow(
    POSITIVE_OUTER_LANE_X,
    scrambleNorthStopLineZ + ARROW_DISTANCE_FROM_STOP_LINE,
    Math.PI,
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
        Math.PI,
        "right"
    );

    // South approach travels toward positive Z.
    createRoadArrow(
        0,
        z - MAJOR_ROAD_HALF_WIDTH - TURN_ARROW_DISTANCE_FROM_INTERSECTION,
        0,
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

    if (
        minorRoads.some((intersectionZ) =>
            Math.abs(z - intersectionZ) <
            RESIDENTIAL_ROAD_WIDTH / 2 + 4
        )
    ) {
        return true;
    }

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
// Continue your existing vehicle code below.
// ======================================

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
