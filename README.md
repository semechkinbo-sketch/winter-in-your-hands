# Winter in Your Hands ❄️ 3D Snow Globe

A tiny winter world you can touch. Turn the globe, switch between day and night, open the door, light the window and tap the bird to hear it sing. Tap the cloud for heavier snowfall, shake the trees or spin the globe to stir up the snow. A cozy house, a cat in the window and a little winter magic, built with JavaScript and Three.js.

## Live demo

[Open the snow globe](https://semechkinbo-sketch.github.io/winter-in-your-hands/)

## Controls

- Drag to look around; pinch or scroll to zoom.
- Tap the sun or moon to switch between day and night.
- Tap the door to open or close it.
- Tap the window to toggle its light.
- Tap the bird to hear it sing.
- Tap the cloud for a short burst of heavier snowfall throughout the globe.
- Tap a tree or spin the globe quickly to stir up the snow.
- Tap the chimney to toggle the smoke.

Sound begins after your first tap.

## Run locally

Serve this folder with a local HTTP server, for example:

```sh
python3 -m http.server 8000
```

Then open http://localhost:8000 in your browser.

## Requirements

A modern browser with WebGL 2 and JavaScript modules. Internet access is needed to load Three.js and OrbitControls from jsDelivr. Geometry, particle textures and sounds are generated in code.

The scene resizes to the viewport and caps rendering pixel ratio at 2. It has been checked at phone, tablet and desktop viewport sizes; performance depends on the device and browser. Real-device iOS and Android testing has not been performed.
