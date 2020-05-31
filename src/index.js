import * as THREE from "three"
import { ARButton } from "./lib/ar-button";


// three
let renderer, camera, light, reticle, object, scene;

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
    light.position.set(1,1,1).normalize();
    // reticle
    const innerRadius = 0.04;
    const outerRadius = 0.05;
    const thetaSegments = 30;
    const phiSegments = 1;
    const reticleGeometry = new THREE.RingGeometry(innerRadius, outerRadius, thetaSegments, phiSegments);
    const reticleMaterial = new THREE.MeshBasicMaterial({color: 0xffffff});
    reticle = new THREE.Mesh(reticleGeometry, reticleMaterial);
    reticle.rotation.set(-Math.PI/2,0,0);
    reticle.visible = false;
    // object(uzimal)
    // TODO:
    // scene
    scene = new THREE.Scene();
    scene.add(light);
    scene.add(reticle);
}

const update = () => {
    renderer.render(scene, camera);
}

// xr session
let xrSession;
const onRequestSession = () =>
    navigator.xr.requestSession(
        "immersive-ar", {
        requestFeatures: ["local"],
    }
    ).then(onStartSession); // TODO: onRequestSessionError...

const onStartSession = (session) => {
    // three
    renderer.xr.enable = true;
    renderer.xr.setReferenceSpaceType("local");
    renderer.xr.setSession(session);
    
    xrSession = session;
    renderer.setAnimationLoop(update);
}

// TODO:
const onEndSession = () => { }

// Entry point
window.onload = () => {
    startTHREE();
    const arButton = new ARButton({onRequestSession});
    document.body.appendChild(arButton);
}