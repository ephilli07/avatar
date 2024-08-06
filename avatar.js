import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

window.onload = () => loadModel();

function setupScene(gltf) {
    // Rendering model to html canvas
    const renderer = new THREE.WebGLRenderer({
        // Model has smooth edges
        antialias: true,
        // Transparent background
        alpha: true
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace; 

    // Set size and pixel ratio of renderer
    const container = document.getElementById('avatar-container');
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    // Setup camera
    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight);
    camera.position.set(0.2, 0.5, 1);

    // Camera control elements
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; 
    controls.enablePan = false;
    controls.enableZoom = false;
    controls.minDistance = 3; 
    controls.minPolarAngle = 1.4;
    controls.maxPolarAngle = 1.4;
    controls.target = new THREE.Vector3(0, 0.75, 0);
    controls.update();

    // Scene setup
    const scene = new THREE.Scene();

    // Lighting
    scene.add(new THREE.AmbientLight());

    // Additional lighting (spotlight)
    const spotlight = new THREE.SpotLight(0xffffff, 20, 8, 1);
    spotlight.penumbra = 0.5; 
    spotlight.position.set(0, 4, 2);
    spotlight.castShadow = true;
    scene.add(spotlight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2);
    keyLight.position.set(1, 1, 2);
    keyLight.lookAt(new THREE.Vector3());
    scene.add(keyLight);

    // Create pedestal 
    const groundGeometry = new THREE.CylinderGeometry(0.6, 0.6, 0.1, 64);
    const groundMaterial = new THREE.MeshStandardMaterial();
    const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
    groundMesh.castShadow = false; 
    groundMesh.receiveShadow = true;
    groundMesh.position.y -= 0.05;
    scene.add(groundMesh);

    // Load avatar
    const avatar = gltf.scene;
    // Go through all child meshes in avatar and make sure everything working properly
    avatar.traverse((child) => {
        if (child.isMesh) {
            child.castShadow = true; 
            child.receiveShadow = true;
        }
    });
    scene.add(avatar);

    // Load Animations
    const mixer = new THREE.AnimationMixer(avatar);
    const clips = gltf.animations; 
    // Parse clips
    const waveClip = THREE.AnimationClip.findByName(clips, 'waving');
    const dancingClip = THREE.AnimationClip.findByName(clips, 'salsa');
    // As animations
    const waveAction = mixer.clipAction(waveClip);
    const salsaAction = mixer.clipAction(dancingClip);

    // Add event listener 

    container.addEventListener('mousedown', (ev) => {
        // Compute coordinates
        const coords = {
            x: (ev.offsetX / container.clientWidth) * 2 - 1,
            y: -(ev.offsetY / container.clientHeight) * 2 + 1
        };
    });

    let isDancing = false; 
    // Use raycaster to see if user clicks on avatar
    const raycaster = new THREE.Raycaster();
    container.addEventListener('mousedown', (ev) => {
        const coords = {
            x: (ev.offsetX / container.clientWidth) * 2 - 1,
            y: -(ev.offsetY / container.clientHeight) * 2 + 1
        };

        raycaster.setFromCamera(coords, camera);
        const intersections = raycaster.intersectObject(avatar);

        // If the user clicks in the calculated area
        if (intersections.length > 0) {
            // Don't do anything if already spinning
            if (isDancing) return;

            isDancing = true;
            salsaAction.reset();
            salsaAction.play();
            waveAction.crossFadeTo(salsaAction, 0.3);
        
            // Make sure it stops
            setTimeout(() => {
                waveAction.reset();
                waveAction.play();
                salsaAction.crossFadeTo(waveAction, 1);
                setTimeout(() => isDancing = false, 1000);
            }, 4000)
        }
    })

    const clock = new THREE.Clock();

    // Animation function 

    function animate() {
        // Request animation frame from browser
        requestAnimationFrame(animate);
        mixer.update(clock.getDelta());
        // Ask renderer to render scene from camera perspective
        renderer.render(scene, camera);
    }

    // Call animate function
    animate();
    waveAction.play();
}


function loadModel() {
   const loader = new GLTFLoader();
   loader.load('Marty.glb',
        (gltf) => {
            // Loaded
            setupScene(gltf);
            document.getElementById('avatar-loading').style.display = 'none';
        },
        (xhr) => {
            // Progress
            const percentCompletion = Math.round((xhr.loaded / xhr.total) * 100);
            document.getElementById('avatar-loading').innerText = `LOADING... ${percentCompletion}%`
            console.log(`Loading model... ${percentCompletion}%`);
        },
        (error) => {
            // Error
            console.log(error);
        }
    );
}
