import { TextureLoader } from "three"

const textureLoader = new TextureLoader();

const loadTextureAsync = (src) => 
    new Promise(resolve => {
        textureLoader.load(src, resolve);
    });

export { loadTextureAsync } 