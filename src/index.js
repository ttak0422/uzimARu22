import * as THREE from "three"
import { ARButton } from "./lib/ar-button";
import { loadTextureAsync } from "./lib/texture-loader";
import uzimalSrc from "./img/uzimaru.png";
import "./style.css"

// TODO: 
// [ ] 設置したオブジェクトの向き
// [ ] shadow

// three
let renderer, camera, light, reticle, scene;
let uzimalMesh;
const uzimalHeight = 0.1;
let objects = [];
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
    // object
    const uzimalTexture = await loadTextureAsync(uzimalSrc);
    const uzimalWidth = uzimalHeight * (uzimalTexture.image.width / uzimalTexture.image.height);
    const uzimalGeometry = new THREE.PlaneGeometry(uzimalWidth, uzimalHeight);
    const uzimalMaterial = new THREE.MeshBasicMaterial({
        map: uzimalTexture,
        transparent: true,
        side: THREE.DoubleSide,
    });
    uzimalMesh = new THREE.Mesh(uzimalGeometry, uzimalMaterial);
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
    let obj = uzimalMesh.clone();
    obj.position.set(reticle.position.x, reticle.position.y + uzimalHeight / 2, reticle.position.z);
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
    // session.addEventListener('select', onSelect);
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