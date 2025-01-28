// Import Three.js and GLTFLoader for loading 3D models
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// Import HandTrack.js for hand motion tracking
import * as handTrack from 'handtrackjs';

// ====================
// SET UP THREE.JS SCENE
// ====================

// Create a scene, camera, and renderer
const scene = new THREE.Scene(); // The 3D scene where objects are placed
const camera = new THREE.PerspectiveCamera(
    75, // Field of view
    window.innerWidth / window.innerHeight, // Aspect ratio
    0.1, // Near clipping plane
    1000 // Far clipping plane
);
const renderer = new THREE.WebGLRenderer(); // Renderer to display the scene
renderer.setSize(window.innerWidth, window.innerHeight); // Set renderer size to fill the screen
document.body.appendChild(renderer.domElement); // Add the renderer to the HTML body

// ====================
// ADD GROUND (MAP)
// ====================

// Create a ground plane to represent the map
const groundGeometry = new THREE.PlaneGeometry(10, 10); // Width and height of the ground
const groundMaterial = new THREE.MeshBasicMaterial({
    color: 0xcccccc, // Light gray color
    side: THREE.DoubleSide // Render both sides of the plane
});
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = Math.PI / 2; // Rotate the ground to lie flat
scene.add(ground); // Add the ground to the scene

// ====================
// LOAD KIA K5 GT LINE MODEL
// ====================

const loader = new GLTFLoader(); // Create a GLTF loader to load 3D models
let car; // Variable to store the car model

loader.load(
    'assets/kia_k5.glb', // Path to the 3D model file
    (gltf) => {
        car = gltf.scene; // Get the loaded model
        car.scale.set(0.5, 0.5, 0.5); // Scale the model to fit the scene
        car.position.set(0, 0, 0); // Set initial position of the car
        scene.add(car); // Add the car to the scene
    },
    undefined, // Progress callback (not used here)
    (error) => {
        console.error('Error loading model:', error); // Handle errors
    }
);

// ====================
// SET UP CAMERA POSITION
// ====================

camera.position.set(0, 5, 5); // Set camera position (x, y, z)
camera.lookAt(0, 0, 0); // Make the camera look at the center of the scene

// ====================
// HAND TRACKING SETUP
// ====================

let model = null; // Variable to store the hand tracking model

// Load the hand tracking model
handTrack.load().then((loadedModel) => {
    model = loadedModel; // Store the loaded model
    startHandTracking(); // Start hand tracking
});

// Function to start hand tracking
function startHandTracking() {
    const video = document.createElement('video'); // Create a video element for the webcam feed
    document.body.appendChild(video); // Add the video element to the body

    // Start the webcam and hand tracking
    handTrack.startVideo(video).then((status) => {
        if (status) {
            runDetection(video); // Start detecting hands
        }
    });
}

// Function to detect hands and move the car
function runDetection(video) {
    model.detect(video).then((predictions) => {
        if (predictions.length > 0) {
            const hand = predictions[0].bbox; // Get the bounding box of the detected hand
            moveCar(hand[0], hand[1]); // Move the car based on hand position
        }
        requestAnimationFrame(() => runDetection(video)); // Continuously detect hands
    });
}

// Function to move the car based on hand position
function moveCar(x, y) {
    if (car) {
        // Map hand position to car position
        const carX = (x / window.innerWidth) * 10 - 5; // Scale to ground size
        const carZ = (y / window.innerHeight) * 10 - 5;

        // Move the car
        car.position.x = carX;
        car.position.z = carZ;

        // Rotate the car based on movement direction
        const deltaX = carX - car.position.x;
        const deltaZ = carZ - car.position.z;
        car.rotation.y = Math.atan2(deltaX, deltaZ); // Calculate rotation angle
    }
}

// ====================
// ANIMATION LOOP
// ====================

function animate() {
    requestAnimationFrame(animate); // Continuously update the scene
    renderer.render(scene, camera); // Render the scene
}
animate(); // Start the animation loop