const KEY_UP = 87;
const KEY_DOWN = 83;
const KEY_LEFT = 65;
const KEY_RIGHT = 68;

// ------------------------------------------------------------------
// Settings
// ------------------------------------------------------------------

/**
 * The settings class stores all of the settings used in this application.
 */
class Settings {
    constructor() {   

        // URLs 
        this.onlineMapAPI = 'https://api.maptiler.com/maps/basic/{z}/{x}/{y}.png?key=OrA58S1v6SW3vr3lw43g';
        this.onlineStreetsAPI = 'https://api.maptiler.com/maps/streets/{z}/{x}/{y}.png?key=OrA58S1v6SW3vr3lw43g';
        this.offlineMapAPI = `http://${document.domain}:${location.port}/basic/{z}/{x}/{y}.png`;
        this.socketServer = `ws://${document.domain}:${location.port}`;

        // Sockets
        this.socket = io.connect(this.socketServer);

        // Maps
        this.initialPosition = [25.66241661, -100.41727066];
        this.icon = 
        this.minZoom = 6;
        this.maxZoom = 18;
        this.map = undefined;
        this.baseMaps = undefined;

        // State
        this.isConnected = false;
        this.isGPSOn = true;

        // Gps
        this.isGeolocationSupported = 'geolocation' in navigator;
        this.latitude = 0;
        this.longitude = 0;
        this.altitude = 0;
        this.velocityX = 0;
        this.velocityY=0;
        this.velocityZ=0;
        this.accelerationX =0;
        this.accelerationY =0;
        this.accelerationZ =0;

        // Car
        this.maxSpeed = 80;
        this.leftSpeed = 0;
        this.rightSpeed = 0;
        this.direction1 = 33;

    }
    reset() {
        this.isConnected = false;
    }
}

let s = new Settings();

// ------------------------------------------------------------------
// Init
// ------------------------------------------------------------------

/**
 * Function gets executed when the document loads completelly. This
 * is the start of the application.
 */
$(() => {
    
    // Create the tile map objects.
    s.baseMaps = {
        'Online': L.tileLayer(s.onlineMapAPI, {  maxZoom: s.maxZoom, minZoom: s.minZoom, id: 'map', attribution: '' }),
        'Online Streets': L.tileLayer(s.onlineStreetsAPI, {  maxZoom: s.maxZoom, minZoom: s.minZoom, id: 'map', attribution: '' }),
        'Offline': L.tileLayer(s.offlineMapAPI, {  maxZoom: s.maxZoom, minZoom: s.minZoom, id: 'map', attribution: '' })
    };

    // Initalize map with the online map. Also add a control for changing the layer type.
    s.map = L.map('GpsOn', { 
        center: s.initialPosition,
        zoom: 13,
        layers: [s.baseMaps['Online']],
        attributionControl: false 
    });
    L.control.layers(s.baseMaps).addTo(s.map);
    
    // Set all callbacks required.
    setCallbacks();

    // Start the main loop.
    loop();

});

/**
 * Sets the event listeners for buttons and inputs.
 */
function setCallbacks() {

    /**
     * Toggles betwween the online and offline map.
     * @param {boolean} online state of the online map.
     */
    function toggleOnlineMap(online) {

        if (online) {
            
            // Select the online map.
            s.isGPSOn = true;
            s.map.removeLayer(s.baseMaps['Offline']);
            s.map.addLayer(s.baseMaps['Online']);

        } else {

            // Select the online map.
            s.isGPSOn = false;
            s.map.removeLayer(s.baseMaps['Online']);
            s.map.addLayer(s.baseMaps['Offline']);

        }

    }

    // If an online map can't load this could mean that there is no internet.
    // Toggle automatically to the offline map.
    s.baseMaps['Online'].on('tileerror', (error, tile) => {
        if (s.isGPSOn) {
            console.log('No internet. Switching to an offline map.')
            toggleOnlineMap(false);
        }
    });
    s.baseMaps['Online Streets'].on('tileerror', (error, tile) => {
        if (s.isGPSOn) {
            console.log('No internet. Switching to an offline map.')
            toggleOnlineMap(false);
        }
    });

    // GPS online and offline buttons.
    $('#btnGpsOn').on('click', () => { toggleOnlineMap(true); });
    $('#btnGpsOff').on('click', () => { toggleOnlineMap(false); });

    // Keyboard events for vehicle movement.
    $(document).on('keyup', (event) => {
        switch(event.keyCode) {
            case KEY_UP: 
            case KEY_DOWN: 
            case KEY_LEFT:
            case KEY_RIGHT:
                s.leftSpeed = 0;
                s.rightSpeed = 0;
                break;
        }
    });
    $(document).on('keydown', (event) => {
        switch(event.keyCode) {
            case KEY_UP:
                s.leftSpeed = s.maxSpeed;
                s.rightSpeed = s.maxSpeed;
                break;
            case KEY_DOWN:
                s.leftSpeed = -s.maxSpeed;
                s.rightSpeed = -s.maxSpeed;
                break;
            case KEY_LEFT:
                s.leftSpeed = -s.maxSpeed;
                s.rightSpeed = s.maxSpeed;
                break;
            case KEY_RIGHT:
                s.leftSpeed = s.maxSpeed;
                s.rightSpeed = -s.maxSpeed;
                break;
        }
    });
    

}

// ------------------------------------------------------------------
// Main Loop
// ------------------------------------------------------------------

/**
 * Loop function runs at 60fps.
 */
function loop() {

    $('#latRes').html(`${s.latitude.toFixed(5)}°`);
    $('#lonRes').html(`${s.longitude.toFixed(5)}°`);
    $('#altRes').html(`${s.altitude} m`);
    $('#velxRes').html(`${s.velocityX.toFixed(3)} m/s`);
    $('#velyRes').html(`${s.velocityY.toFixed(3)} m/s`);
    $('#velzRes').html(`${s.velocityZ.toFixed(3)} m/s`);
    $('#acelxRes').html(`${s.accelerationX.toFixed(3)} m2/s`);
    $('#acelyRes').html(`${s.accelerationY.toFixed(3)} m2/s`);
    $('#acelzRes').html(`${s.accelerationZ.toFixed(3)} m2/s`);





    s.socket.emit('message', {
        'leftSpeed': s.leftSpeed,
        'rightSpeed': s.rightSpeed,
        'direction1': s.direction1
    });

    // Call loop again. Maintain a framerate of 60 fps.
    requestAnimationFrame(loop);

}

// ------------------------------------------------------------------
// Sockets
// ------------------------------------------------------------------

/**
 * Callback function for when the connection to the server is established.
 */
s.socket.on('connect', () => {
    s.isConnected = true;
})

/**
 * Callback function for when the connection to the server is lost.
 */
s.socket.on('disconnect', () => {
    s.reset()
});

/**
 * Callback function for the 'status' message. This message is sent 
 * from the server.
 */
s.socket.on('status', (data) => {

    if (data) {

        // Only process position if the gps has locked a position.
        if (data['positionChanged']) {
            
            // Extract coordinates from position.
            let position = data['position'];    
            let latitude = position[0];
            let longitude = position[1];
            let altitude = position[2];

            // Extract distance from message.
            let distance = data['distance'];

            let velocity = data['velocity'];
            let velX = velocity[0];
            let velY = velocity[1];
            let velZ = velocity[2];



            let acceleration = data['acceleration'];
            let acelX = acceleration[0];
            let acely =acceleration[1];
            let acelz = acceleration[2];

            // Check that a change in latitude or longitude has occured.
            if (Math.abs(latitude - s.latitude) > 0.00001 || Math.abs(longitude - s.longitude) > 0.00001) {
                
                // Calculate total distance.
                console.log(distance);

                // Store new coordinates.
                s.latitude = latitude;
                s.longitude = longitude;
                s.altitude = altitude;

                //Store new velocity
                s.velocityX = velX;
                s.velocityY =velY;
                s.velocityZ=velZ;

                //store new acceleration
                s.accelerationX=acelX;
                s.accelerationY=acely;
                s.accelerationZ=acelz;

                // Place marker on the map.
                console.log(`Marker added on lat: ${s.latitude} lon: ${s.longitude}`);
                let marker = L.marker([s.latitude, s.longitude], { icon: s.icon });
                let markerLabel = `<b>Date:</b> ${data['date']}<br><b>Altitude:</b> ${s.altitude}<br><b>D<sub>x</sub>:</b> ${distance[0].toFixed(2)} m <br><b>D<sub>y</sub>:</b> ${distance[1].toFixed(2)} m <br><b>D<sub>z</sub>: </b>${distance[2].toFixed(2)} m`;
                marker.bindPopup(markerLabel);
                marker.addTo(s.map);

                // Move map to the coordinates received.
                s.map.flyTo([s.latitude, s.longitude], s.maxZoom);

            }

        }
        
    }
});


// ------------------------------------------------------------------
// Other Functions
// ------------------------------------------------------------------

function adelante(){
    var socket = io.connect('http://' + document.domain + ':' + location.port + '/movimiento');
    socket.emit('movimiento', {data: 'Adelente'} )
    console.log("Adelate")
}


function atras(){
    var socket = io.connect('http://' + document.domain + ':' + location.port + '/movimiento');
    socket.emit('my event',{data: 'Atras'} )
    console.log("Atras")
}

document.getElementsByClassName("IntDatos")[0].style.display = 'none';

function IntPri(){
   document.getElementsByClassName("IntPrincipal")[0].style.display = 'block';
   document.getElementsByClassName("IntDatos")[0].style.display = 'none';

}

function IntDat(){
    document.getElementsByClassName("IntPrincipal")[0].style.display = 'none';
    document.getElementsByClassName("IntDatos")[0].style.display = 'block';
 
 }


function inicial(){
    var socket = io.connect('http://' + document.domain + ':' + location.port + '/control');
    document.direccionGra1.dirGra1.value=parseFloat(0);
    document.direccionGra2.dirGra2.value=parseFloat(0);
    document.direccionGra3.dirGra3.value=parseFloat(0);
    document.direccionGra4.dirGra4.value=parseFloat(0);
    socket.emit('my event', {direccion1: document.direccionGra1.dirGra1.value, direccion2: document.direccionGra2.dirGra2.value, direccion3: document.direccionGra3.dirGra3.value, direccion4: document.direccionGra4.dirGra4.value   });
    
}

function vertical(){
    var socket = io.connect('http://' + document.domain + ':' + location.port + '/control');
    document.direccionGra1.dirGra1.value=parseFloat(90);
    document.direccionGra2.dirGra2.value=parseFloat(90);
    document.direccionGra3.dirGra3.value=parseFloat(90);
    document.direccionGra4.dirGra4.value=parseFloat(90);
    socket.emit('my event', {direccion1: document.direccionGra1.dirGra1.value, direccion2: document.direccionGra2.dirGra2.value, direccion3: document.direccionGra3.dirGra3.value, direccion4: document.direccionGra4.dirGra4.value  });
}

function subir1(num){
    s.direction1 += 5;
}

function bajar1(num){
    s.direction1 -= 5;
}

function subir2(num){
    var socket = io.connect('http://' + document.domain + ':' + location.port + '/control');
    document.direccionGra2.dirGra2.value=parseFloat(document.direccionGra2.dirGra2.value)+parseFloat(num);
    socket.emit('my event', {direccion1: document.direccionGra1.dirGra1.value, direccion2: document.direccionGra2.dirGra2.value, direccion3: document.direccionGra3.dirGra3.value, direccion4: document.direccionGra4.dirGra4.value   });
}

function bajar2(num){
    var socket = io.connect('http://' + document.domain + ':' + location.port + '/control');
    document.direccionGra2.dirGra2.value=parseFloat(document.direccionGra2.dirGra2.value)-parseFloat(num);
    socket.emit('my event', {direccion1: document.direccionGra1.dirGra1.value, direccion2: document.direccionGra2.dirGra2.value, direccion3: document.direccionGra3.dirGra3.value, direccion4: document.direccionGra4.dirGra4.value   });
}

function subir3(num){
    var socket = io.connect('http://' + document.domain + ':' + location.port + '/control');
    document.direccionGra3.dirGra3.value=parseFloat(document.direccionGra3.dirGra3.value)+parseFloat(num);
    socket.emit('my event', {direccion1: document.direccionGra1.dirGra1.value, direccion2: document.direccionGra2.dirGra2.value, direccion3: document.direccionGra3.dirGra3.value, direccion4: document.direccionGra4.dirGra4.value   });
}

function bajar3(num){
    var socket = io.connect('http://' + document.domain + ':' + location.port + '/control');
    document.direccionGra3.dirGra3.value=parseFloat(document.direccionGra3.dirGra3.value)-parseFloat(num);
    socket.emit('my event', {direccion1: document.direccionGra1.dirGra1.value, direccion2: document.direccionGra2.dirGra2.value, direccion3: document.direccionGra3.dirGra3.value, direccion4: document.direccionGra4.dirGra4.value   });;
}

function subir4(num){
    var socket = io.connect('http://' + document.domain + ':' + location.port + '/control');
    document.direccionGra4.dirGra4.value=parseFloat(document.direccionGra4.dirGra4.value)+parseFloat(num);
    socket.emit('my event', {direccion1: document.direccionGra1.dirGra1.value, direccion2: document.direccionGra2.dirGra2.value, direccion3: document.direccionGra3.dirGra3.value, direccion4: document.direccionGra4.dirGra4.value   });
}

function bajar4(num){
    var socket = io.connect('http://' + document.domain + ':' + location.port + '/control');
    document.direccionGra4.dirGra4.value=parseFloat(document.direccionGra4.dirGra4.value)-parseFloat(num);
    socket.emit('my event', {direccion1: document.direccionGra1.dirGra1.value, direccion2: document.direccionGra2.dirGra2.value, direccion3: document.direccionGra3.dirGra3.value, direccion4: document.direccionGra4.dirGra4.value   });
}

function adelante(){
    if (document.direccionGra1.dirGra1.value!=0){
        alert("No se puede dirección 1 no esta en 0°")
    } else if (document.direccionGra2.dirGra2.value!=0){
        alert("No se puede dirección 2 no esta en 0°")
    } else if (document.direccionGra3.dirGra3.value!=0){
        alert("No se puede dirección 3 no esta en 0°")
    } else if (document.direccionGra4.dirGra4.value!=0){
        alert("No se puede dirección 4 no esta en 0°")
    }
}

function atras(){
    if (document.direccionGra1.dirGra1.value!=0){
        alert("No se puede dirección 1 no esta en 0°")
    } else if (document.direccionGra2.dirGra2.value!=0){
        alert("No se puede dirección 2 no esta en 0°")
    } else if (document.direccionGra3.dirGra3.value!=0){
        alert("No se puede dirección 3 no esta en 0°")
    } else if (document.direccionGra4.dirGra4.value!=0){
        alert("No se puede dirección 4 no esta en 0°")
    }
}


function myMap() {
    var mapProp= {
      center:new google.maps.LatLng(25.662639,-100.417094),
      zoom:17,
    };
    var map = new google.maps.Map(document.getElementById("googleMap"),mapProp);
    }