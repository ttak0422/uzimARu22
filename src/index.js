import * as THREE from "three"
import { ARButton } from "./lib/ar-button";

// three
let renderer, camera, light, reticle, object, scene;
let objects = [];
const MAX_OBJECT = 10;

const startTHREE = () => {
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
    // TODO: uzimalにする
    const objectRadius = 0.1;
    const objectWidithRevisions = 32;
    const objectHeightRevisions = 16;
    const objectGeometry = new THREE.SphereBufferGeometry(objectRadius, objectWidithRevisions, objectHeightRevisions);
    const objectMaterial = new THREE.MeshPhongMaterial();
    object = new THREE.Mesh(objectGeometry, objectMaterial);
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
    let obj = object.clone();
    obj.position.set(reticle.position.x, reticle.position.y + 0.05, reticle.position.z);
    scene.add(obj);
    if (objects.length > MAX_OBJECT) {
        let o = objects.shift();
        scene.remove(o);
    }
}

// xr session
let xrSession;
let xrRefSpace;
let xrViewerSpace;
let xrHitTestSource;
const onRequestSession = () =>
    navigator.xr.requestSession(
        "immersive-ar", {
        requiredFeatures: ["local", "hit-test"],
    }
    ).then(onStartSession); // TODO: onRequestSessionError...

const onStartSession = (session) => {
    session.addEventListener('select', onSelect);
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
window.onload = () => {
    startTHREE();
    const arButton = new ARButton({ onRequestSession });
    document.body.appendChild(arButton);
}