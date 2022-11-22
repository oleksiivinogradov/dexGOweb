// Copyright (c) 2022 8th Wall, Inc.
//
// app.js is the main entry point for your 8th Wall app. Code here will execute after head.html
// is loaded, and before body.html is loaded.

//import './index.css'
import {startGame as startBallThroughTorusGame} from './games/gameBallThroughTorus.js';
import {initScenePipelineModule} from './threejs-scene-init.js';
//import * as camerafeedHtml from './camerafeed.html'

let UI
let canvas
const layoutModules = [
  {file: 'test-ui.html', elementId: 'test-ui'},
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
    let userlat = pos.coords.latitude.toFixed(2)
    let userlong = pos.coords.longitude.toFixed(2)
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
  }, errorCallback)
}
checkGeolocation()
let checkGeolocationInterval
const checkGeolocationIntervalTime = 5000

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
    { title:'d833976eb9734957a39e633d7287304a.107', name:'d833976eb973', type:'private',
      location:'', coordinates: {lat:49.83, long:24.01},
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
    testUI: $('#test-ui')
  }
  UI.testUI.show()
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
  //document.body.insertAdjacentHTML('beforeend', camerafeedHtml)
  canvas = document.getElementById('camerafeed')
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