import { ARButton } from "./lib/ar-button";

// Entry point
window.onload = () => {
    const arButton = new ARButton();
    document.body.appendChild(arButton);
}