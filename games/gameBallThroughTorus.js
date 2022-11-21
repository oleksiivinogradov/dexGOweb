export const startGame = (UI, coachingOverlay, vps, Ammo, wayspotId) => {
  //  Assets
  const assets = [
    {file: 'ring.glb', scale: 0.4, convexPhysicsBody: true},
    {file: 'ball.glb', scale: 0.04},
    //{file: 'torus-700eb893eee6.glb', scale: 1},
    //{file: 'torus-6be453f79201.glb', scale: 1},
  ]
  //  Ball settings
	const ballMass = 1
	const ballColliderRadius = 0.1
	const ballThrowForce = 15
	let ball
	let ballBB
	// Ring settings
	const torusVerticalPosition = 0
	const torusDistance = 2
  //  Config
  let config = {
    objects: {
      ring: assets[0],
      ball: assets[1],
      //torus700eb893eee6: assets[2],
      //torus6be453f79201: assets[3],
    },
    game: {
      status: {
        enabled: false,
      },
    },
    ringsTotal: 5,
    ringsCurrent: 0,
  }

  const clock = new THREE.Clock()
  let scene, camera, timer
  let world
  let animationLoop
  const mainGroup = new THREE.Group()
  const floorGroup = new THREE.Group()
  const independentGroup = new THREE.Group()
  let scannedMesh = null
  //const mainGroup700eb893eee6 = new THREE.Group()
  //const mainGroup6be453f79201 = new THREE.Group()
  const manager = new THREE.LoadingManager()
  manager.onLoad = function () {
    console.log('Assets loaded')
    initPhysics()
  }
  const loader = new THREE.GLTFLoader(manager)

  // Physics variables
	const gravityConstant = 9.8
	let collisionConfiguration
	let dispatcher
	let broadphase
	let solver
	let physicsWorld
	const margin = 0.1

  let rigidBodies = []
  let staticBodies = []
	const pos = new THREE.Vector3()
	const quat = new THREE.Quaternion()
	const raycaster = new THREE.Raycaster()
	let transformAux1
	let tempBtVec3_1
	let collisionTriggers = []
  
  const init = () => {
    console.log('Init game')
    mainGroup.visible = false
    // UI
    UI.instructionsScreen.fadeIn(500)
    UI.instructionsScreen.find('#start-game-button').on('touchstart', function () {
      console.log('initial start')
      UI.instructionsScreen.fadeOut(500)
      start()
    })

    UI.gameBallThroughTorusMainUI.find('#restart-button').on('touchstart', function () {
      console.log('restart button')
      start()
    })

    UI.gameBallThroughTorusMainUI.find('#end-button').on('touchstart', function () {
      //  game UI
      UI.gameBallThroughTorusEndUI.find('#game-score').html(config.ringsCurrent)
      UI.gameBallThroughTorusEndUI.find('#game-time').html(UI.gameBallThroughTorusMainUI.find('#clock').html())
      
      config.game.status.enabled = false
      
      UI.gameBallThroughTorusMainUI.fadeOut(500)
      setTimeout(function () {
        clearInterval(timer)
        UI.gameBallThroughTorusMainUI.find('#clock').html('00:00')
        UI.gameBallThroughTorusMainUI.find('#total-count').html(config.ringsTotal)
        config.ringsCurrent = 0
        UI.gameBallThroughTorusMainUI.find('#current-count').html(config.ringsCurrent)
        UI.gameBallThroughTorusEndUI.fadeIn(500)  
      }, 500)
    })

    
		
    scene.add(mainGroup)
    scene.add(floorGroup)
    scene.add(independentGroup)

    UI.gameBallThroughTorusEndUI.find('#end-restart-button').on('touchstart', function () {
      console.log('end start')
      UI.gameBallThroughTorusEndUI.fadeOut(1000)
      start()
    })
   
  }

  const clearScene = () => {
    //  stop ball launch button event listener
    UI.gameBallThroughTorusMainUI.find('#launch-ball-button').unbind()
    
    //  remove all objects
    for (let i = mainGroup.children.length - 1; i >= 0; i--) {
      mainGroup.remove(mainGroup.children[i])
    }
    for (let i = floorGroup.children.length - 1; i >= 0; i--) {
      mainGroup.remove(floorGroup.children[i])
    }
    for (let i = independentGroup.children.length - 1; i >= 0; i--) {
      mainGroup.remove(independentGroup.children[i])
    }
    for (let i = rigidBodies.length - 1; i >= 0; i--) {
      physicsWorld.removeRigidBody( rigidBodies[i] )
    }
    for (let i = staticBodies.length - 1; i >= 0; i--) {
      physicsWorld.removeRigidBody( staticBodies[i] )
    }
    rigidBodies = []
    staticBodies = []
    collisionTriggers = []
    
    
    //  reset clock and UI
    clearInterval(timer)
    UI.gameBallThroughTorusMainUI.find('#clock').html('00:00')
    UI.gameBallThroughTorusMainUI.find('#total-count').html(config.ringsTotal)
    config.ringsCurrent = 0
    UI.gameBallThroughTorusMainUI.find('#current-count').html(config.ringsCurrent)
  }

  const start = () => {
    console.log('start game')
    config.game.status.enabled = true
    // UI
    setTimeout(function () {
      $('.tracking #game').fadeIn(500)
      
      coachingOverlay.configure({
        disablePrompt: false,
      })
      
    }, 500)

    clearScene()

    //  add test torus at scene center
    /*
    let torus = config.objects.torus700eb893eee6.model.clone()
    torus.scale.set(config.objects.torus700eb893eee6.scale,config.objects.torus700eb893eee6.scale,config.objects.torus700eb893eee6.scale)
    //  random color
    let color = new THREE.Color()
    color.setHex(Math.random() * 0xffff00)
    let material = new THREE.MeshLambertMaterial({color: color})
    torus.children[0].material = material
    
    //const mainGroup700eb893eee6 = new THREE.Group()
    mainGroup700eb893eee6.visible = false
    mainGroup.add(mainGroup700eb893eee6)
    mainGroup700eb893eee6.add(torus)
    */

    //  add test torus at scene center
    /*
    torus = config.objects.torus6be453f79201.model.clone()
    torus.scale.set(config.objects.torus6be453f79201.scale,config.objects.torus6be453f79201.scale,config.objects.torus6be453f79201.scale)
    //  random color
    color = new THREE.Color()
    color.setHex(Math.random() * 0xffff00)
    material = new THREE.MeshLambertMaterial({color: color})
    torus.children[0].material = material
    
    //const mainGroup6be453f79201 = new THREE.Group()
    mainGroup6be453f79201.visible = false
    mainGroup.add(mainGroup6be453f79201)
    mainGroup6be453f79201.add(torus)
    */

    //  add center point
    const centerGeometry = new THREE.SphereGeometry( 0.05, 16, 8 )
    const centerMaterial = new THREE.MeshBasicMaterial( { color: 0xff0000 } )
    const centerSphere = new THREE.Mesh( centerGeometry, centerMaterial )
    mainGroup.add( centerSphere )

    //  add scanned mesh
    if(scannedMesh != null){
      mainGroup.add(scannedMesh)
    }

    //  add ground
    
    pos.set( 0, - 2, 0 )
		quat.set( 0, 0, 0, 1 )
    const object = new THREE.Mesh( new THREE.BoxGeometry( 100, 0.1, 100, 1, 1, 1 ), new THREE.MeshPhongMaterial( { color: 0xFFFFFF } ) )
		const shape = new Ammo.btBoxShape( new Ammo.btVector3( 100, 0.5, 100 ) )
		shape.setMargin( margin )
		object.visible = false
		createRigidBody( object, shape, 0, pos, quat, floorGroup )
		
    
    //  spawn random rings
    
    for (let i = 0; i < config.ringsTotal; i++) {
      const torus = config.objects.ring.model.clone()
      torus.scale.set(config.objects.ring.scale,config.objects.ring.scale,config.objects.ring.scale)
      //  random color
      const color = new THREE.Color()
      color.setHex(Math.random() * 0xffff00)
      const material = new THREE.MeshLambertMaterial({color: color})
      torus.children[0].material = material
      //torus.children[0].renderOrder = 3
      
      //  random position and rotation
      const randPos = -1 * Math.random() - torusDistance
      const randRot = Math.random() * 360
      torus.rotation.set(0, randRot, 0)
      torus.translateY(torusVerticalPosition).translateZ(randPos)
      mainGroup.add(torus)

      //  collision
      //  inner collision
      /*
      const sphere = new THREE.Mesh( new THREE.SphereGeometry( 0.37, 32, 16 ), new THREE.MeshBasicMaterial( { color: 0xffff00 } ) )
      sphere.position.copy(torus.position)
      sphere.mainObject = torus
      independentGroup.add(sphere)
      collisionTriggers.push(sphere)
      */

      let torusPos = torus.position
      let sphereBS = new THREE.Sphere(new THREE.Vector3(torusPos.x,torusPos.y,torusPos.z),0.4)
      sphereBS.mainObject = torus
      collisionTriggers.push(sphereBS)

      

      
      //  shape collision
      const triangle_mesh = config.objects.ring.convexPhysicsBody
      triangle_mesh.setScaling(new Ammo.btVector3(config.objects.ring.scale, config.objects.ring.scale, config.objects.ring.scale))
      const torusShape = new Ammo.btBvhTriangleMeshShape(triangle_mesh, true, true)
      torusShape.setMargin( margin )

      pos.copy(torus.position)
      quat.copy(torus.quaternion)
  		const transform = new Ammo.btTransform()
  		transform.setIdentity()
  		transform.setOrigin( new Ammo.btVector3( pos.x, pos.y, pos.z ) )
  		transform.setRotation( new Ammo.btQuaternion( quat.x, quat.y, quat.z, quat.w ) )
  		let motionState = new Ammo.btDefaultMotionState( transform )
  
  		let localInertia = new Ammo.btVector3( 0, 0, 0 )
  		torusShape.calculateLocalInertia( 0, localInertia )
  
  		const rbInfo = new Ammo.btRigidBodyConstructionInfo( 0, motionState, torusShape, localInertia )
  		const body = new Ammo.btRigidBody( rbInfo )
  
  		body.setFriction(0.5)
  		body.setRestitution(0.5)

  		//body.setActivationState( STATE.DISABLE_DEACTIVATION )
  		body.setActivationState( 4 )
      //body.setCollisionFlags( FLAGS.CF_KINEMATIC_OBJECT )
      body.setCollisionFlags( 2 )

  		torus.children[0].userData.physicsBody = body
  		physicsWorld.addRigidBody( body )
  		sphereBS.staticBody = body
  		staticBodies.push(body)
  		
    }

    //  bind launch event
    UI.gameBallThroughTorusMainUI.find('#launch-ball-button').on('touchstart', function(){
      spawnBall()
    })

    //  start clock
    timer = setInterval(renderClock, 1000)
  }
  
  const renderClock = () => {
    const myTime = UI.gameBallThroughTorusMainUI.find('#clock').html()
    const ss = myTime.split(':')
    const dt = new Date()
    dt.setHours(0)
    dt.setMinutes(ss[0])
    dt.setSeconds(ss[1])

    const dt2 = new Date(dt.valueOf() + 1000)
    const temp = dt2.toTimeString().split(' ')
    const ts = temp[0].split(':')

    UI.gameBallThroughTorusMainUI.find('#clock').html(ts[1] + ':' + ts[2])
  };
  
  const spawnBall = () => {
    console.log('Launch ball')
    // Creates a ball and throws it
    ball = config.objects.ball.model.clone()
    ball.scale.set(config.objects.ball.scale,config.objects.ball.scale,config.objects.ball.scale)
    //ball.children[0].renderOrder = 3
    //  collision
    ballBB = new THREE.Sphere(ball.position,0.1)

    raycaster.setFromCamera( new THREE.Vector2(0,-0.6), camera )
		const ballShape = new Ammo.btSphereShape( ballColliderRadius )
		ballShape.setMargin( margin )
		pos.copy( raycaster.ray.origin )
		let dir = raycaster.ray.direction
		dir.multiplyScalar( 0.45 )
		pos.add( dir )
		quat.set( 0, 0, 0, 1 )
		const ballBody = createRigidBody( ball, ballShape, ballMass, pos, quat, independentGroup )

		pos.copy( raycaster.ray.direction )
		pos.add( new THREE.Vector3(0,0.4,0))
		pos.multiplyScalar( ballThrowForce )
		ballBody.setLinearVelocity( new Ammo.btVector3( pos.x, pos.y, pos.z ) )
  }

  const loadAssets = () => {
    for (let i = 0; i < assets.length; i++) {
      const modelFile = require('../assets/' + assets[i].file)
      const scale = assets[i].scale
      loader.load(modelFile, (gltf) => {
        const model = gltf.scene
        const mesh = model.children[0]
        assets[i].model = model
        model.castShadow = true
      })
    }
  }

  const initPhysics = () => {

		// Physics configuration
    
		collisionConfiguration = new Ammo.btDefaultCollisionConfiguration()
		dispatcher = new Ammo.btCollisionDispatcher( collisionConfiguration )
		broadphase = new Ammo.btDbvtBroadphase()
		solver = new Ammo.btSequentialImpulseConstraintSolver()
		physicsWorld = new Ammo.btDiscreteDynamicsWorld( dispatcher, broadphase, solver, collisionConfiguration )
		physicsWorld.setGravity( new Ammo.btVector3( 0, - gravityConstant, 0 ) )
		console.log('init physics')

		transformAux1 = new Ammo.btTransform()
		tempBtVec3_1 = new Ammo.btVector3( 0, 0, 0 )

    //  custom shape physics
		for (let i = 0; i < assets.length; i++) {
      const mesh = assets[i].model.children[0]
      const scale = assets[i].scale

      if (assets[i].convexPhysicsBody) {

        let indices = mesh.geometry.index.array
    		let verticesPos = mesh.geometry.getAttribute('position').array
    		let vertices = []
    		
    		for (let i = 0; i < verticesPos.length; i += 3) {
    		  vertices.push({
    		    x: verticesPos[i],
    		    y: verticesPos[i+1],
    		    z: verticesPos[i+2]
    		  })
    		}
    		
    		//let triangle
    		let triangle_mesh = new Ammo.btTriangleMesh(true, true)
    		let vecA = new Ammo.btVector3(0, 0, 0)
    		let vecB = new Ammo.btVector3(0, 0, 0)
    		let vecC = new Ammo.btVector3(0, 0, 0)
    		
    		for (let i = 0; i < indices.length - 3; i += 3) {
    		  vecA.setX(vertices[indices[i]].x)
    		  vecA.setY(vertices[indices[i]].y)
    		  vecA.setZ(vertices[indices[i]].z)

    		  vecB.setX(vertices[indices[i+1]].x)
    		  vecB.setY(vertices[indices[i+1]].y)
    		  vecB.setZ(vertices[indices[i+1]].z)

    		  vecC.setX(vertices[indices[i+2]].x)
    		  vecC.setY(vertices[indices[i+2]].y)
    		  vecC.setZ(vertices[indices[i+2]].z)

    		  triangle_mesh.addTriangle(vecA, vecB, vecC, true)
    		}
    		Ammo.destroy(vecA)
    		Ammo.destroy(vecB)
    		Ammo.destroy(vecC)

    		assets[i].convexPhysicsBody = triangle_mesh
      }
    
    }

    init()
		loop()

	}

	const updatePhysics = ( deltaTime ) => {
		// Step world
		physicsWorld.stepSimulation( deltaTime, 10 )
		// Update rigid bodies
		for ( let i = 0, il = rigidBodies.length; i < il; i ++ ) {
			const objThree = rigidBodies[ i ]
			const objPhys = objThree.userData.physicsBody
			const ms = objPhys.getMotionState()
			if ( ms ) {
				ms.getWorldTransform( transformAux1 )
				const p = transformAux1.getOrigin()
				const q = transformAux1.getRotation()
				objThree.position.set( p.x(), p.y(), p.z() )
				objThree.quaternion.set( q.x(), q.y(), q.z(), q.w() )

				objThree.userData.collided = false
			}
		}
	}

	const createRigidBody = ( object, physicsShape, mass, pos, quat, parent, vel, angVel ) => {

		if ( pos ) {
			object.position.copy( pos )
		} else {
			pos = object.position
		}

		if ( quat ) {
			object.quaternion.copy( quat )
		} else {
			quat = object.quaternion
		}

		const transform = new Ammo.btTransform()
		transform.setIdentity()
		transform.setOrigin( new Ammo.btVector3( pos.x, pos.y, pos.z ) )
		transform.setRotation( new Ammo.btQuaternion( quat.x, quat.y, quat.z, quat.w ) )
		const motionState = new Ammo.btDefaultMotionState( transform )

		const localInertia = new Ammo.btVector3( 0, 0, 0 )
		physicsShape.calculateLocalInertia( mass, localInertia )

		const rbInfo = new Ammo.btRigidBodyConstructionInfo( mass, motionState, physicsShape, localInertia )
		const body = new Ammo.btRigidBody( rbInfo )

		body.setFriction(0.5)
		body.setRestitution(0.5)

		if ( vel ) {
			body.setLinearVelocity( new Ammo.btVector3( vel.x, vel.y, vel.z ) )
		}

		if ( angVel ) {
			body.setAngularVelocity( new Ammo.btVector3( angVel.x, angVel.y, angVel.z ) )
		}

		object.userData.physicsBody = body
		object.userData.collided = false

		parent.add( object )

		if ( mass > 0 ) {
			rigidBodies.push( object )
			// Disable deactivation
			body.setActivationState( 4 )
		}

		physicsWorld.addRigidBody( body )
		return body
	}

	

	const loop = () => {
    animationLoop = requestAnimationFrame(loop)
    const deltaTime = clock.getDelta()
    if(ballBB){
      ballBB.set(ball.position,0.1)
      checkCollisions()
    }
    updatePhysics( deltaTime )
  }

  const checkCollisions = () => {
    for (let i = collisionTriggers.length - 1; i >= 0; i--) {
      if(ballBB.intersectsSphere(collisionTriggers[i])){
        config.ringsCurrent += 1
        UI.gameBallThroughTorusMainUI.find('#current-count').html(config.ringsCurrent)
        //  remove ring
        mainGroup.remove(collisionTriggers[i].mainObject)
        physicsWorld.removeRigidBody( collisionTriggers[i].staticBody )
        collisionTriggers.splice(i, 1)
        if(config.ringsCurrent == config.ringsTotal){
          //  game UI
          UI.gameBallThroughTorusEndUI.find('#game-score').html(config.ringsCurrent)
          UI.gameBallThroughTorusEndUI.find('#game-time').html(UI.gameBallThroughTorusMainUI.find('#clock').html())
          
          config.game.status.enabled = false
          
          coachingOverlay.configure({
            disablePrompt: true,
          })
          
          UI.gameBallThroughTorusMainUI.fadeOut(500)
          setTimeout(function () {
            clearInterval(timer)
            UI.gameBallThroughTorusMainUI.find('#clock').html('00:00')
            UI.gameBallThroughTorusMainUI.find('#total-count').html(config.ringsTotal)
            config.ringsCurrent = 0
            UI.gameBallThroughTorusMainUI.find('#current-count').html(config.ringsCurrent)
            UI.gameBallThroughTorusEndUI.fadeIn(500)  
          }, 500)
          
        }
      }
    }
  }

  const updateTriggersAndPhysics = () => {
    for (let i = collisionTriggers.length - 1; i >= 0; i--) {
      // trigger
      const triggerPos = new THREE.Vector3()
      const triggerRadius = collisionTriggers[i].radius
      collisionTriggers[i].mainObject.getWorldPosition(triggerPos)
      collisionTriggers[i].set(new THREE.Vector3(triggerPos.x,triggerPos.y,triggerPos.z), triggerRadius)

      // collision
      const colliderPos = new THREE.Vector3()
      const colliderQuat = new THREE.Quaternion()
      const physicsBody = collisionTriggers[i].mainObject.children[0].userData.physicsBody
      collisionTriggers[i].mainObject.getWorldPosition(colliderPos)
      collisionTriggers[i].mainObject.getWorldQuaternion(colliderQuat)
      const tmpTrans = new Ammo.btTransform()
      const ammoTmpPos = new Ammo.btVector3()
      const ammoTmpQuat = new Ammo.btQuaternion()
      let ms = physicsBody.getMotionState()
      if ( ms ) {
        console.log(JSON.stringify(ms))
        ammoTmpPos.setValue(colliderPos.x, colliderPos.y, colliderPos.z)
        ammoTmpQuat.setValue( colliderQuat.x, colliderQuat.y, colliderQuat.z, colliderQuat.w)

        tmpTrans.setIdentity()
        tmpTrans.setOrigin( ammoTmpPos )
        tmpTrans.setRotation( ammoTmpQuat )

        ms.setWorldTransform(tmpTrans)
      }
    }
  }

  
  const handleTrackingStatusChange = ({detail}) => {
    if (detail.status === 'LIMITED' && detail.reason === 'INITIALIZING') {
      mainGroup.visible = false
      $('body').removeClass('tracking')
      UI.gameBallThroughTorusMainUI.fadeOut(500)
    }
    if (detail.status === 'NORMAL') {
      mainGroup.visible = true
      $('body').addClass('tracking')
      if (config.game.status.enabled) {
        $('.tracking #game').fadeIn(500)
      }
    }
  }

  const wayspotFound = ({detail}) => {
    /*
    switch(detail.name){
      case '700eb893eee6':
        mainGroup700eb893eee6.visible = true
        break;
      case '6be453f79201':
        mainGroup6be453f79201.visible = true
        break;
    }
    */
    if(detail.name == wayspotId){
      mainGroup.visible = true
      mainGroup.position.copy(detail.position)
      mainGroup.quaternion.copy(detail.rotation)
      updateTriggersAndPhysics()
      $('body').addClass('tracking')
      if (config.game.status.enabled) {
        $('.tracking #game').fadeIn(500)
      }
      $('#tracking-status').html(detail.name)
    }
  }
  const wayspotUpdated = ({detail}) => {
    if(detail.name == wayspotId){
      mainGroup.position.copy(detail.position)
      mainGroup.quaternion.copy(detail.rotation)
      updateTriggersAndPhysics()
    }
  }
  const wayspotLost = ({detail}) => {
    /*
    switch(detail.name){
      case '700eb893eee6':
        mainGroup700eb893eee6.visible = false
        break;
      case '6be453f79201':
        mainGroup6be453f79201.visible = false
        break;
    }
    */
    if(detail.name == wayspotId){
      mainGroup.visible = false
      $('body').removeClass('tracking')
      UI.gameBallThroughTorusMainUI.fadeOut(500)
      $('#tracking-status').html('no tracking')
    }
  }

  const foundMesh = ({detail}) => {
    if(scannedMesh == null){
      //console.log('mesh found')
      const {id, position, rotation, geometry} = detail
      const bufferGeometry = new THREE.BufferGeometry()
      const indices = geometry.index
      const vertices = geometry.attributes[0].array
      bufferGeometry.setAttribute( 'position', new THREE.Float32BufferAttribute( vertices, 3 ) )
      bufferGeometry.setIndex( indices )
      const material = new THREE.MeshBasicMaterial({
        color: 0x999999,
        wireframe: true,
      })
      const occlMaterial = new THREE.MeshBasicMaterial({
        color: 0x999999,
        colorWrite: false,
      })
      const vpsMesh = new THREE.Mesh(bufferGeometry, material)  // construct VPS mesh - wireframe
      //const vpsMeshOcclusion = new THREE.Mesh(bufferGeometry, occlMaterial)  // construct VPS mesh - occlusion
      //vpsMeshOcclusion.renderOrder = 2
      scannedMesh = vpsMesh
      mainGroup.add(scannedMesh)
      //mainGroup.add(vpsMeshOcclusion)
    }
  }

  // Setup listeners
  let listeners
  if(vps){
    listeners = [
      {event: 'reality.projectwayspotfound', process: wayspotFound},
      {event: 'reality.projectwayspotupdated', process: wayspotUpdated},
      {event: 'reality.projectwayspotlost', process: wayspotLost},
      {event: 'reality.meshfound', process: foundMesh},
    ]
  }else{
    listeners = [
      {event: 'reality.trackingstatus', process: handleTrackingStatusChange},
    ]
  }

  //stop game
  $('#exit-button').on('touchstart', function (e) {
    e.preventDefault()
    // stop UI
    $('body').removeClass('tracking')
    UI.gameBallThroughTorusEndUI.fadeOut(500)
    setTimeout(function(){
      UI.testUI.fadeIn(500)
    },500)
    UI.instructionsScreen.find('#start-game-button').unbind()
    UI.gameBallThroughTorusMainUI.find('#restart-button').unbind()
    UI.gameBallThroughTorusMainUI.find('#end-button').unbind()
    // clear Scene
    clearScene()
    // stop animation loop
    cancelAnimationFrame(animationLoop)
		// stop XR8
    XR8.stop()
    XR8.Threejs.xrScene().renderer.dispose()
    XR8.clearCameraPipelineModules()
  })
  
  return {
    name: 'gameBallThroughTorus',
    onStart: () => {
      scene = XR8.Threejs.xrScene().scene
      camera = XR8.Threejs.xrScene().camera
      loadAssets()
    },
    listeners: listeners,
  }
}
