// Define an 8th Wall XR Camera Pipeline Module that adds a cube to a threejs scene on startup.
export const initScenePipelineModule = () => {

  const animate = () => {
    requestAnimationFrame(animate)
  }

  const initXrScene = ({scene, camera, renderer}) => {

    // Enable shadows in the renderer.
    renderer.shadowMap.enabled = true

    // Add some light to the scene.
    renderer.physicallyCorrectLights = true
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    renderer.outputEncoding = THREE.sRGBEncoding;
    scene.add(new THREE.AmbientLight(0x404040, 3))  // Add soft white light to the scene.
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 8)
    directionalLight.position.set(5, 10, 7)
    directionalLight.castShadow = true
    scene.add(directionalLight)

    animate()
    // Set the initial camera position relative to the scene we just laid out. This must be at a
    // height greater than y=0.
    camera.position.set(0, 2, 0)
  }

  // Return a camera pipeline module that adds scene elements on start.
  return {
    // Camera pipeline modules need a name. It can be whatever you want but must be unique within
    // your app.
    name: 'threejsinitscene',

    // onStart is called once when the camera feed begins. In this case, we need to wait for the
    // XR8.Threejs scene to be ready before we can access it to add content. It was created in
    // XR8.Threejs.pipelineModule()'s onStart method.
    onStart: ({canvas}) => {
      const {scene, camera, renderer} = XR8.Threejs.xrScene()  // Get the 3js scene from XR8.Threejs

      initXrScene({scene, camera, renderer})  // Add objects set the starting camera position.

      // prevent scroll/pinch gestures on canvas
      canvas.addEventListener('touchmove', (event) => {
        event.preventDefault()
      })

      // Sync the xr controller's 6DoF position and camera paremeters with our scene.
      XR8.XrController.updateCameraProjectionMatrix(
        {origin: camera.position, facing: camera.quaternion}
      )
    },
  }
}