// Copyright (c) 2022 8th Wall, Inc.
//
// app.js is the main entry point for your 8th Wall app. Code here will execute after head.html
// is loaded, and before body.html is loaded.

import { initScenePipelineModule } from './threejs-scene-init.js'
//import { SimplifyModifier } from './modules/SimplifyModifier.js'
import { startGame as startBallThroughTorusGame } from './games/gameBallThroughTorus.js'

let UI
let canvas
let map
let defaultZoom = 13
let userLocationMarker
let userLocated = false

const layoutModules = [
  {file: 'test-ui.html', elementId: 'test-ui'},
  {file: 'anchors-ui.html', elementId: 'anchors-ui'},
  {file: 'instructions.html', elementId: 'start-game'},
  {file: 'main-page.html', elementId: 'main-page'},
  {file: 'ball-through-torus-game-ui.html', elementId: 'ball-through-torus-game-ui'},
  {file: 'end-game.html', elementId: 'end-game'},
]

// Check Location Permissions at beginning of session
const errorCallback = (error) => {
  if (error.code === error.PERMISSION_DENIED) {
    alert('LOCATION PERMISSIONS DENIED. PLEASE ALLOW AND TRY AGAIN.')
  }
}
const checkGeolocation = () => {
  navigator.geolocation.getCurrentPosition((pos) => {
    currentLat = pos.coords.latitude
    let userlat = currentLat.toFixed(2)
    currentLong = pos.coords.longitude
    let userlong = currentLong.toFixed(2)
    const wayspotList = $('#quest-list ul')
    wayspotList.find('li').each(function(){
      //userlat = 50.32
      //userlong = 30.54
      const lat = parseFloat($(this).data('lat')).toFixed(2)
      const long = parseFloat($(this).data('long')).toFixed(2)
      if(lat == userlat && long == userlong){
        $(this).addClass('active')
      }else{
        $(this).removeClass('active')
      }
    })
    if(map != undefined && userLocationMarker == undefined){
      // User location marker
      userLocationMarker = new mapboxgl.Marker(document.getElementById('user-location-marker')).setLngLat([currentLong,currentLat]).addTo(map)
      map.easeTo({center: [currentLong,currentLat], zoom: defaultZoom})
      userLocated = true
    }

  }, errorCallback)
  
}

let currentLat
let currentLong
checkGeolocation()
let checkGeolocationInterval
const checkGeolocationIntervalTime = 2500

// Route data
let routeJSON = {
  id: 1,
  title: 'Test Route',
  status: {
    available: true,
    started: false,
    completedQuests: 0,
    finished: false,
  },
  googleRoute: {}, 
  wayspots: [
    { title:'700eb893eee64aff9f1046c7d2ea4007.107', name:'700eb893eee6', type:'private',
      location:'', coordinates: {lat:50.68, long:30.18},
      quest:{ status:{
        available: true,
        started: false,
        finished: false,
        score: 0,
      } } },
    { title:'Old Ukrainian village', name:'old-ukrainia', type:'public',
      location:'Havrylivka, Kyiv Oblast, UA', coordinates: {lat:50.68, long:30.18},
      quest:{ status:{
        available: true,
        started: false,
        finished: false,
        score: 0,
      } } },
    { title:'6be453f792014d2aa0931bf20f018368.107', name:'6be453f79201', type:'private',
      location:'', coordinates: {lat:50.32, long:30.54},
      quest:{ status:{
        available: true,
        started: false,
        finished: false,
        score: 0,
      } } },
    { title:'c776d43912874c5ba5c2503c8db7b1af.107', name:'c776d4391287', type:'private',
      location:'', coordinates: {lat:49.83, long:24.01},
      quest:{ status:{
        available: true,
        started: false,
        finished: false,
        score: 0,
      } } },
    { title:'80076c9b8dbe4591bf34075d496213f5.107', name:'80076c9b8dbe', type:'private',
      location:'', coordinates: {lat:50.68, long:30.18},
      quest:{ status:{
        available: true,
        started: false,
        finished: false,
        score: 0,
      } } },
  ],
}
const renderWayspots = () => {
  for (let i = 0; i < routeJSON.wayspots.length; i++){
    $('#quest-list ul').append('<li data-name='+routeJSON.wayspots[i].name+' data-lat='+routeJSON.wayspots[i].coordinates.lat+' data-long='+routeJSON.wayspots[i].coordinates.long+'><a href="#">'+routeJSON.wayspots[i].name+'</a></li>')
  }
}

const finalPreparation = () => {
  UI = {
    instructionsScreen: $('#start-game'),
    mainPage: $('#main-page'),
    gameBallThroughTorusMainUI: $('#ball-through-torus-game-ui'),
    gameBallThroughTorusEndUI: $('#end-game'),
    testUI: $('#test-ui'),
    anchorsUI: $('#anchors-ui'),
  }
  
  renderWayspots()
  // launch game without VPS
  $('#quest-single > a').on('touchstart', function (e) {
    e.preventDefault()
    UI.testUI.fadeOut(500)
    launchGame(false,startBallThroughTorusGame)
  })
  // launch game with VPS
  $('#quest-list ul li').on('touchstart', function (e) {
    if($(this).hasClass('active')){
      e.preventDefault()
      UI.testUI.fadeOut(500)
      const wayspotId = $(this).data('name')
      launchGame(true,startBallThroughTorusGame,wayspotId)
    }else{
      $('#message').html('You can\'t run the game at this location').show().fadeOut(1000)
    }
  })
  // Enable Physics
  enablePhysics()
  // Start checking location with interval
  checkGeolocationInterval = setInterval(checkGeolocation, checkGeolocationIntervalTime)
  // Add a canvas to the document for our xr scene.
  canvas = document.getElementById('camerafeed')

  // TEMPORARY
  //UI.testUI.show()
  UI.mainPage.show()
  // Mapbox
  
  mapboxgl.accessToken = 'pk.eyJ1Ijoib2xla3NpaXZpbm9ncmFkb3YiLCJhIjoiY2w4YTI0NnMzMGNyODNubnVhZ2J5NjMwZyJ9.bTob5w7nd9autIIxbqt5RQ'
  map = new mapboxgl.Map({
    container: 'mapbox-map', // container ID
    style: 'mapbox://styles/mapbox/streets-v12', // style URL
    //center: [currentLong, currentLat], // starting position [lng, lat]
    //zoom: defaultZoom // starting zoom
  })

  // Wayspots markers
  for(let i=0; i < routeJSON.wayspots.length; i++){
    $('#mapbox-map').parent().append('<div id="wayspot'+routeJSON.wayspots[i].name+'-marker" class="marker"></div>')
    routeJSON.wayspots[i].marker = new mapboxgl.Marker(document.getElementById('wayspot'+routeJSON.wayspots[i].name+'-marker')).setLngLat([routeJSON.wayspots[i].coordinates.long,routeJSON.wayspots[i].coordinates.lat]).addTo(map)
  }
  // Navigation buttons
  $('#map-reset').on('touchstart', function(){
    map.easeTo({center: [currentLong,currentLat], zoom: defaultZoom})
  })
  $('#map-zoom-in').on('touchstart', function(){
    map.zoomIn()
  })
  $('#map-zoom-out').on('touchstart', function(){
    map.zoomOut()
  })
  /*
  const anchorsJSON = {
    anchors: [
      { id:1, position: { x:0,y:0,z:0 }, rotation: { x:0,y:0,z:0,w:0 } },
      { id:2, position: { x:1,y:0,z:0 }, rotation: { x:1,y:0,z:0,w:0 } },
      { id:3, position: { x:2,y:0,z:0 }, rotation: { x:2,y:0,z:0,w:0 } },
    ]
  }
  console.log(JSON.stringify(anchorsJSON))
  */
}

//console.log(JSON.stringify(routeJSON))

const launchGame = (vps,module,wayspotId) => {
  
  // Configure VPS, scale and coaching overlay
  if(vps){
    XR8.XrController.configure({scale: 'responsive', enableVps: true})
  }else{
    XR8.XrController.configure({scale: 'absolute', enableVps: false})  
  }
  
  window.CoachingOverlay.configure({
    disablePrompt: true,
  })
  window.VpsCoachingOverlay.configure({
    disablePrompt: true,
  })

  XR8.addCameraPipelineModules([  // Add camera pipeline modules.
    // Existing pipeline modules.
    XR8.GlTextureRenderer.pipelineModule(),      // Draws the camera feed.
    XR8.Threejs.pipelineModule(),                // Creates a ThreeJS AR Scene.
    XR8.XrController.pipelineModule(),           // Enables SLAM tracking.
    XRExtras.FullWindowCanvas.pipelineModule(),  // Modifies the canvas to fill the window.
    XRExtras.Loading.pipelineModule(),           // Manages the loading screen on startup.
    XRExtras.RuntimeError.pipelineModule(),      // Shows an error image on runtime error.
    window.LandingPage.pipelineModule(),         // Detects unsupported browsers and gives hints.
  ])
  if(vps){
    XR8.addCameraPipelineModule(window.VpsCoachingOverlay.pipelineModule())
    XR8.addCameraPipelineModule(initScenePipelineModule())
    XR8.addCameraPipelineModule(module(UI,window.VpsCoachingOverlay,vps,Ammo,wayspotId))
  }else{
    XR8.addCameraPipelineModule(window.CoachingOverlay.pipelineModule())
    XR8.addCameraPipelineModule(initScenePipelineModule())
    XR8.addCameraPipelineModule(module(UI,window.CoachingOverlay,vps,Ammo))
  }

  // Open the camera and start running the camera run loop.
  XR8.run({canvas, allowedDevices: 'any'})
}

const enablePhysics = () => {
  Ammo().then( function ( AmmoLib ) {
    Ammo = AmmoLib
  })
}

const onxrloaded = () => {

  $( document ).ready(function() {
    // Load layout modules
    $('body').append('<div id="temp"></div>')
    let layoutModulesLoaded = 0
    for(let i = 0; i < layoutModules.length; i++){
      $( '#temp' ).load( './layout/'+layoutModules[i].file+' #'+layoutModules[i].elementId, function() {
        $('#'+layoutModules[i].elementId).appendTo('body').hide()
        layoutModulesLoaded += 1
        if(layoutModulesLoaded == layoutModules.length){
          $('#temp').remove()
          finalPreparation()
        }
      })
    }
  })

}

window.XR8 ? onxrloaded() : window.addEventListener('xrloaded', onxrloaded)