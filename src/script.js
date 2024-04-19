import * as THREE from 'three'
import GUI from 'lil-gui'
import gsap from 'gsap'


/**
 * Debug
 */
const gui = new GUI()
gui.close()

const parameters = {
    materialColor: '#ffeded'
}

gui
    .addColor(parameters, 'materialColor')
    // INFO: Change the color material and particlesmaterial color in debug gui
    .onChange(() => {
        material.color.set(parameters.materialColor),
        particlesMaterial.color.set(parameters.materialColor)
    })

/**
 * Base
 */
// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

/**
 * INFO: Add texture loader
 */

const textureLoader = new THREE.TextureLoader();
const gradientTexture = textureLoader.load('./textures/gradients/3.jpg')
gradientTexture.magFilter = THREE.NearestFilter

/**
 * INFO: Add objects
 */

// INFO: Material
const material = new THREE.MeshToonMaterial({ //material appears only when there is light in the scene
    color: parameters.materialColor,
    gradientMap: gradientTexture //by default, webgl will try to merge the gradient colors, not do shading. This needs to be changed in settings with THREE.NearestFilter
    
}) 

// INFO: Meshes
const objectsDistance = 4 //distance between objects

const mesh1 = new THREE.Mesh(
    new THREE.TorusGeometry(1, 0.4, 16, 60),
    material
)

const mesh2 = new THREE.Mesh(
    new THREE.ConeGeometry(1, 2, 32),
    material
)

const mesh3 = new THREE.Mesh(
    new THREE.TorusKnotGeometry(0.8, 0.35, 100, 16),
    material
)

mesh1.position.y = - objectsDistance * 0;
mesh2.position.y = - objectsDistance * 1;
mesh3.position.y = - objectsDistance * 2;

mesh1.position.x = 2;
mesh2.position.x = -2;
mesh3.position.x = 2;



scene.add(mesh1, mesh2, mesh3)

const sectionMeshes = [mesh1, mesh2, mesh3];


/**
 * INFO: Particles
 */


const particleCount = 200;
const positions = new Float32Array(particleCount * 3);

for (let i = 0; i < particleCount; i++) {
    positions[i * 3 + 0] = (Math.random() - 0.5) * 10 //increase amplitude;
    positions[i * 3 + 1] = objectsDistance * 0.5 - Math.random() * objectsDistance * sectionMeshes.length// objectsDistance * 3; //particles start above the object equally and go down by object distance 3 times (number of objects)
    positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
}

const particlesGeometry = new THREE.BufferGeometry()
particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))

const particlesMaterial = new THREE.PointsMaterial({
    color: parameters.materialColor,
    sizeAttenuation: true,
    size: 0.03,
    transparent: true,
    
})

const particles = new THREE.Points(particlesGeometry, particlesMaterial);
scene.add(particles)

// INFO: Lights

const directionalLight = new THREE.DirectionalLight('#ffffff', 3)
directionalLight.position.set(1, 1, 0)
scene.add(directionalLight)


/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

//  INFO: Camera group (parallax solution)

const cameraGroup = new THREE.Group();
scene.add(cameraGroup)

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(35, sizes.width / sizes.height, 0.1, 100)
camera.position.z = 6
cameraGroup.add(camera)

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas, 
    alpha: true
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

/**
 * INFO: Scroll
 */

let scrollY = window.scrollY;
let currentSection = 0

window.addEventListener('scroll', () => {
    // console.log(scrollY)
    scrollY = window.scrollY;
    // console.log(scrollY / sizes.height)
    const newSection = Math.round(scrollY / sizes.height);
    console.log(newSection)

    if (newSection != currentSection) { //new section is diff current section
        currentSection = newSection 
        console.log('changed', currentSection)
        gsap.to(
            sectionMeshes[currentSection].rotation,
            {
                duration: 1.5,
                ease: 'power2.inOut',
                x: '+=6',
                y: '+=3', //add to current obj value
                z: '+=1.5'
            }
        )
    }
})

/**
 * INFO: Cursor
 */

const cursor = {}
cursor.x = 0;
cursor.y = 0;

window.addEventListener('mousemove', (event) => {
    // console.log('the mouse moved')
    // console.log(event.clientX) //number of pizels left to right depending on the screen size
    cursor.x = event.clientX / sizes.width - 0.5;
    cursor.y = event.clientY / sizes.height - 0.5; //these values need to be adapted to context:normalize the val from 0 to 1 by dividing them to the size of the viewport. -0.5 for values as negative as positive

    // console.log(cursor)

})

/**
 * Animate
 */
const clock = new THREE.Clock()

// INFO: Calculate frame time delta
let previousTime = 0;


const tick = () =>
{
    const elapsedTime = clock.getElapsedTime();
    // console.log(elapsedTime)
    const deltaTime = elapsedTime - previousTime;
    // console.log(deltaTime)
    previousTime = elapsedTime //reset the time

    // INFO: Animate camera
    camera.position.y = - scrollY / sizes.height * objectsDistance; //camera too sensitive and moving too fast.Fixes: add - to change direction
// ScrollY contains the amount of pizels that have been scrolled. If we scroll 1000 pixels, the camera will go down 1000 pixels
    // console.log(camera.position.y)

    const parallaxX = cursor.x * 0.5;
    const parallaxY = - cursor.y * 0.5; //object and camera are async - solution: negative value
    cameraGroup.position.x += (parallaxX - cameraGroup.position.x) * 5 * deltaTime; //camera locked vertically - we have already updated camera once in a line up. solution: put camera in a Group and apply the parallax on the group and not the camera itself
    cameraGroup.position.y += (parallaxY - cameraGroup.position.y) * 5 * deltaTime; //cameraGroup - camera moves only inside the group, not the entire scene


    // INFO: Animate meshes
    for (const mesh of sectionMeshes)
    {
        mesh.rotation.x += deltaTime * 0.1;   // elapsedTime * 0.1; before triggering animation
        mesh.rotation.y += deltaTime * 0.1     //elapsedTime * 0.12;
    }

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()