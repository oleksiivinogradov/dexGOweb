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
const GPSprecision = 6

const layoutModules = [
  {file: 'test-ui.html', elementId: 'test-ui'},
  {file: 'anchors-ui.html', elementId: 'anchors-ui'},
  {file: 'instructions.html', elementId: 'start-game'},
  {file: 'main-page.html', elementId: 'main-page'},
  {file: 'MainPage_Route_Marker.html', elementId: 'route-marker'},
  {file: 'MainPage_Route_Distance.html', elementId: 'distance-marker'},
  {file: 'ball-through-torus-game-ui.html', elementId: 'ball-through-torus-game-ui'},
  {file: 'end-game.html', elementId: 'end-game'},
]

// Check Location Permissions at beginning of session
const errorCallback = (error) => {
  if (error.code === error.PERMISSION_DENIED) {
    alert('Turn "ON" location on your device')
  }
}
const checkGeolocation = () => {
  navigator.geolocation.getCurrentPosition((pos) => {
    currentLat = pos.coords.latitude
    let userlat = currentLat.toFixed(GPSprecision)
    currentLong = pos.coords.longitude
    let userlong = currentLong.toFixed(GPSprecision)
    const wayspotList = $('#quest-list ul')
    wayspotList.find('li').each(function(){
      //userlat = 50.32
      //userlong = 30.54
      const lat = parseFloat($(this).data('lat')).toFixed(GPSprecision)
      const long = parseFloat($(this).data('long')).toFixed(GPSprecision)
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
      location:'', coordinates: {lat:50.676502, long:30.184893},
      profit: 25,
      quest:{ status:{
        available: true,
        started: false,
        finished: false,
        score: 0,
      } } },
    { title:'Old Ukrainian village', name:'old-ukrainia', type:'public',
      location:'Havrylivka, Kyiv Oblast, UA', coordinates: {lat:50.67644, long:30.184683},
      profit: 30,
      quest:{ status:{
        available: true,
        started: false,
        finished: false,
        score: 0,
      } } },
    { title:'6be453f792014d2aa0931bf20f018368.107', name:'6be453f79201', type:'private',
      location:'', coordinates: {lat:50.319702, long:30.541243},
      profit: 35,
      quest:{ status:{
        available: true,
        started: false,
        finished: false,
        score: 0,
      } } },
    { title:'c776d43912874c5ba5c2503c8db7b1af.107', name:'c776d4391287', type:'private',
      location:'', coordinates: {lat:49.827854, long:24.009167},
      profit: 40,
      quest:{ status:{
        available: true,
        started: false,
        finished: false,
        score: 0,
      } } },
    { title:'80076c9b8dbe4591bf34075d496213f5.107', name:'80076c9b8dbe', type:'private',
      location:'', coordinates: {lat:50.676346, long:30.18481},
      profit: 20,
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
    routeMarker: $('#route-marker'),
    distanceMarker: $('#distance-marker'),
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
    style: 'mapbox://styles/mapbox/streets-v12',
  })

  // Wayspots markers
  for(let i=0; i < routeJSON.wayspots.length; i++){
    UI.routeMarker.clone().appendTo($('#mapbox-map').parent())
    $('#mapbox-map').parent().find('#route-marker').prop('id','wayspot'+routeJSON.wayspots[i].name+'-marker')
    routeJSON.wayspots[i].marker = new mapboxgl.Marker(document.getElementById('wayspot'+routeJSON.wayspots[i].name+'-marker')).setLngLat([routeJSON.wayspots[i].coordinates.long,routeJSON.wayspots[i].coordinates.lat]).addTo(map)
    const marker = $('#wayspot'+routeJSON.wayspots[i].name+'-marker')
    marker.find('.MP_Route_Profit > b').html(routeJSON.wayspots[i].profit+'$')
    marker.find('.MP_Route_Marker > b').html(routeJSON.wayspots[i].name)
    marker.find('.MP_Route_Marker > p').html(routeJSON.wayspots[i].coordinates.long.toFixed(4)+' '+routeJSON.wayspots[i].coordinates.lat.toFixed(4))
    marker.data('long',routeJSON.wayspots[i].coordinates.long)
    marker.data('lat',routeJSON.wayspots[i].coordinates.lat)
    marker.find('.MP_Route_Marker').on('touchstart mousedown', function(){
      //console.log($(this).find('b').html())
      $('.MP_Route_Marker_Pos').removeClass('active')
      $(this).parent().parent().addClass('active')
      const markerCoordinates = [$(this).parent().parent().data('long'),$(this).parent().parent().data('lat')]
      getRoute([currentLong,currentLat],markerCoordinates)
    })
    marker.show()
  }

  // Navigation buttons
  $('#map-reset').on('touchstart mousedown', function(){
    map.easeTo({center: [currentLong,currentLat], zoom: defaultZoom})
  })
  $('#map-zoom-in').on('touchstart mousedown', function(){
    map.zoomIn()
  })
  $('#map-zoom-out').on('touchstart mousedown', function(){
    map.zoomOut()
  })
  $('#map-routes-reset').on('touchstart mousedown', function(){
    $('.MP_Route_Marker_Pos').removeClass('active')
    map.removeLayer('route')
    map.removeSource('route')
    map.easeTo({center: [currentLong,currentLat], zoom: defaultZoom})
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

async function getRoute(start,end) {
  // make a directions request using cycling profile
  // an arbitrary start will always be the same
  // only the end or destination will change
  const query = await fetch(
    'https://api.mapbox.com/directions/v5/mapbox/walking/'+start[0]+','+start[1]+';'+end[0]+','+end[1]+'?steps=true&geometries=geojson&access_token='+mapboxgl.accessToken,
    { method: 'GET' }
  )
  const json = await query.json()
  const data = json.routes[0]
  const distance = data.distance
  console.log(distance)
  const route = data.geometry.coordinates
  const geojson = {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'LineString',
      coordinates: route
    }
  };
  // if the route already exists on the map, we'll reset it using setData
  if (map.getSource('route')) {
    map.getSource('route').setData(geojson);
  }
  // otherwise, we'll make a new request
  else {
    map.addLayer({
      id: 'route',
      type: 'line',
      source: {
        type: 'geojson',
        data: geojson
      },
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': '#3887be',
        'line-width': 5,
        'line-opacity': 0.75
      }
    });
  }
  // add turn instructions here at the end
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

  // Waypost data debug
  /*
  XR8.XrController.configure({scale: 'responsive', enableVps: true})
  XR8.addCameraPipelineModule(XR8.XrController.pipelineModule())
  XR8.addCameraPipelineModule({
    name: 'eventlogger',
    listeners: [
      {event: 'reality.projectwayspotscanning', process: logEvent },
    ],
  })
  canvas = document.getElementById('camerafeed')
  XR8.run({canvas, allowedDevices: 'any'})
  */
}

const logEvent = ({detail}) => {
  console.log(JSON.stringify(detail))
}

window.XR8 ? onxrloaded() : window.addEventListener('xrloaded', onxrloaded)