import * as THREE from "three"
import { ARButton } from "./lib/ar-button";
import { loadTextureAsync } from "./lib/texture-loader";
import uzimalSrc from "./img/uzimaru.png";
import shadowSrc from "./img/shadow.png";
import "./style.css"

// three
let renderer, camera, light, reticle, scene;
let object;
const objectSize = 0.1;
let objects = [];
let camPos = new THREE.Vector3();
let camQuat = new THREE.Quaternion();
let camScale = new THREE.Vector3();
const MAX_OBJECT = 10;

// xr session
let xrSession;
let xrRefSpace;
let xrViewerSpace;
let xrHitTestSource;

// overlay
let overlayElement = document.createElement("div");
overlayElement.id = "overlay";
overlayElement.style.display = "none";
overlayElement.innerHTML = `
<button id="generate-button"></button>
`;

const startTHREE = async () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    // renderer
    renderer = new THREE.WebGLRenderer({
        antialias: false,
        alpha: true,
    });
    // camera
    camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 100);
    // light
    light = new THREE.DirectionalLight(0xffffff, 0.7);
    light.position.set(1, 1, 1).normalize();
    // reticle
    const innerRadius = 0.04;
    const outerRadius = 0.05;
    const thetaSegments = 30;
    const phiSegments = 1;
    const reticleGeometry = new THREE.RingGeometry(innerRadius, outerRadius, thetaSegments, phiSegments);
    const reticleMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    reticle = new THREE.Mesh(reticleGeometry, reticleMaterial);
    reticle.rotation.set(-Math.PI / 2, 0, 0);
    reticle.visible = false;
    /// uzimal
    const uzimalTexture = await loadTextureAsync(uzimalSrc);
    const uzimalHeight = objectSize;
    const uzimalWidth = uzimalHeight * (uzimalTexture.image.width / uzimalTexture.image.height);
    const uzimalGeometry = new THREE.PlaneGeometry(uzimalWidth, uzimalHeight);
    const uzimalMaterial = new THREE.MeshBasicMaterial({
        map: uzimalTexture,
        transparent: true,
        side: THREE.DoubleSide,
    });
    const uzimalMesh = new THREE.Mesh(uzimalGeometry, uzimalMaterial);
    uzimalMesh.position.y = uzimalHeight / 2;
    /// shadow
    const shadowTexture = await loadTextureAsync(shadowSrc);
    const shadowSize = objectSize * 2;
    const shadowGeometry = new THREE.PlaneBufferGeometry(shadowSize,shadowSize);
    const shadowMaterial = new THREE.MeshBasicMaterial({
        map: shadowTexture,
        transparent: true,
        depthWrite: false,
    });
    const shadowMesh = new THREE.Mesh(shadowGeometry, shadowMaterial);
    shadowMesh.position.y = 0.01;
    shadowMesh.rotation.x = Math.PI * -0.5;
    // object
    object = new THREE.Object3D();
    object.add(uzimalMesh);
    object.add(shadowMesh);

    // scene
    scene = new THREE.Scene();
    scene.add(light);
    scene.add(reticle);
}

const update = () => {
    xrSession.requestAnimationFrame((time, frame) => {
        const pose = frame.getViewerPose(xrRefSpace);
        reticle.visible = false;
        if (xrHitTestSource && pose) {
            const hitTestResults = frame.getHitTestResults(xrHitTestSource);
            if (hitTestResults.length > 0) {
                reticle.visible = true;
                const pose = hitTestResults[0].getPose(xrRefSpace);
                const position = pose.transform.position;
                reticle.position.set(position.x, position.y, position.z);
            }
        }
    });
    renderer.render(scene, camera);
}

const onSelect = () => {
    if (reticle.visible) {
        generateObject();
    }
}

const generateObject = () => {
    console.log("generateObject");
    camera.matrixWorld.decompose(camPos, camQuat, camScale);
    let obj = object.clone();
    obj.position.set(reticle.position.x, reticle.position.y, reticle.position.z);
    obj.lookAt(camPos.x, reticle.position.y, camPos.z);
    objects.push(obj);
    scene.add(obj);
    if (objects.length > MAX_OBJECT) {
        let o = objects.shift();
        scene.remove(o);
    }
}

const onRequestSession = () =>
    navigator.xr.requestSession(
        "immersive-ar", {
        requiredFeatures: ["local", "hit-test"],
        optionalFeatures: ["dom-overlay"],
        domOverlay: { root: document.getElementById("overlay") }
    })
        .then(onStartSession); // TODO: onRequestSessionError...

const onStartSession = (session) => {
    overlayElement.style.display = "block";
    // three
    renderer.xr.enabled = true;
    renderer.xr.setReferenceSpaceType("local");
    renderer.xr.setSession(session);
    // session
    xrSession = session;
    xrSession.requestReferenceSpace("viewer").then(refSpace => {
        xrViewerSpace = refSpace;
        xrSession.requestHitTestSource({ space: xrViewerSpace }).then(hitTestSource => {
            xrHitTestSource = hitTestSource;
        });
    });
    xrSession.requestReferenceSpace("local").then(refSpace => {
        xrRefSpace = refSpace;
        renderer.setAnimationLoop(update);
    });
}

// TODO:
const onEndSession = () => {
}

// Entry point
window.onload = async () => {
    await startTHREE();
    const arButton = new ARButton({ onRequestSession });
    document.body.appendChild(arButton);
    document.body.appendChild(overlayElement);
    document.getElementById("generate-button").addEventListener("click", onSelect);
}