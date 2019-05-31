import Settings from './settings.js'
import Car from './car.js'


//All this Code is for the Control section of the User Interface

//Canvas Section of the Control Section
let canvas = document.getElementById('control');
let ctx = canvas.getContext('2d');
let car = new Car(ctx);


let width = 0;
let height = 0;
let markers = [];
let s = new Settings();
let socket = io.connect(s.socketURL);

//Camera Section
let frontCamera = document.getElementById('frontCamera');
let rearCamera = document.getElementById('rearCamera');

function setCallbacks() {

    //Event happens when the Key UP is activated, in this case the car would move up
    $(document).on('keyup', (event) => {
        car.keyUp(event);
    });
    
    //Event happens when the Key Down is activated, in this case the car would move down
    $(document).on('keydown', (event) => {
        car.keyDown(event);
    });

    //This would Update the Map Status, in case we get out of range or in case we get out of internet
    function updateMapStatus(status) {
        let online = $('#mapOnline');
        let offline = $('#mapOffline');
        if (status) {
            online.removeClass('d-none');
            offline.addClass('d-none');
        } else {
            online.addClass('d-none');
            offline.removeClass('d-none');
        }
    }

    //If we don't have internet access, this would change the Map Status, between Online and Offline
    function toggleOnlineMap(online) {
        console.log('switching to ',online);
        if (online) {
            s.map['obj'].removeLayer(s.mapLayers['Offline']);
            s.map['obj'].addLayer(s.mapLayers['Online']);
        } else {
            s.isGPSOn = false;
            s.map['obj'].removeLayer(s.mapLayers['Online']);
            s.map['obj'].addLayer(s.mapLayers['Offline']);
        }
    }

    //Special Function to resize the Canvas
    function resize() {
        //Because a problem we had, we have to take the height of the frontCamera as our base of the size
        //So, the Canvas would change if the Front Camera Section changes
        height = Math.round($('#frontCamera').height());
        width = $('#canvasContainer').width();
        let pixelRatio = window.devicePixelRatio;
        canvas.width = Math.floor(width * pixelRatio);
        canvas.height = Math.floor(height * pixelRatio);
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        ctx.scale(pixelRatio, pixelRatio);
        $('#map').height(height);
        s.map['obj'].invalidateSize();
        car.resize(width, height);
    }

    $(window).on('resize', resize);
    $('#sidebarToggle').on('click', resize);

    resize();

    //Shutdown Button Selection 
    $('#shutdown').click(() => {
        if (s.isConnected) {
            socket.emit('shutdown', {})
        }
    });

    //In case of errors, or In case of no Internet, this would send Informtaion to the function of preselection of Online or Offline maps
    s.mapLayers['Online'].on('tileerror', (error, tile) => {
        toggleOnlineMap(false);
    });
    s.mapLayers['Online Streets'].on('tileerror', (error, tile) => {
        toggleOnlineMap(false);
    });
    s.map['obj'].on('layeradd', (event) => {
        if (event.layer == s.mapLayers['Online'] || event.layer == s.mapLayers['Online Streets']) {
            updateMapStatus(true);
        } else if (event.layer == s.mapLayers['Offline']) {
            updateMapStatus(false);
        }
    });
    updateMapStatus(true);

}


//Main Loop
$(() => {


    //Save the information of the ID, and zoom settings on Map Layers
    for (let key in s.map['urls']) {
        s.mapLayers[key] = L.tileLayer(s.map['urls'][key], {
            maxZoom: s.map['maxZoom'], 
            minZoom: s.map['minZoom'], 
            id: 'map', 
            attribution: '' 
        });
    }

    //We put this coordinate to be the center of the map
    s.map['obj'] = L.map('map', { 
        center: [25.6275, -100.3098],
        zoom: 10,
        layers: [s.mapLayers[Object.keys(s.mapLayers)[0]]],
        attributionControl: false 
    });

    //This is to change the icon size, in case we do a zoom
    s.map['icon'] = L.icon({
        iconUrl: '../vendor/leaflet/img/icon.png',
        shadowSize: [0, 0],
        iconSize: [19, 31],
        iconAnchor: [9, 31]
    });

    L.control.layers(s.mapLayers).addTo(s.map['obj']);

    //Calls all the functions of the Actions, Canvas, GPS, and Cameras
    setCallbacks();
    loop();
    animationLoop();

});

//Updates the animation of the Canvas
function animationLoop() {
    ctx.clearRect(0, 0, width, height);
    car.update();
    car.draw();
    requestAnimationFrame(animationLoop);
}


function loop() {
    s.isConnected = socket.connected;
    if (s.isConnected) {
        //Shows the amount of Satellites we are connected to
        $('#satelliteCount').html(`${s.gpsSatellites} / 12`);
        let gray = $('#satelliteGray');
        let yellow = $('#satelliteYellow');
        let green = $('#satelliteGreen');
        gray.addClass('d-none');
        yellow.addClass('d-none');
        green.addClass('d-none');
        //In some cases we decided to change de color of the symbol of Satellite
        //If there is less than 4 is gray, 4 is yellow, above 4 is green
        if (s.gpsSatellites <= 0) {
            gray.removeClass('d-none');
        } else if (s.gpsSatellites <= 4) {
            yellow.removeClass('d-none');
        } else {
            green.removeClass('d-none');
        }
    }
    //Call the functions that Update the ANalytics, Conection and Battery Status
    s.updateAnalytics();
    s.updateConnectionStatus();
    s.updateBatteryStatus();

    //Send Message for the speed of the vehicle
    socket.emit('message', {
        'left': car.leftSpeed,
        'right': car.rightSpeed
    });
    setTimeout(loop, 1000 / s.frameRate);
}

//In case of disconnect, this would she no Camera image
socket.on('disconnect', function() {
    frontCamera.src = s.noCamera;
    rearCamera.src = s.noCamera;
})

socket.on('message', function(payload){

    if (payload) {
        frontCamera.src = s.byteArrayToImage(payload['frontCamera']);
        rearCamera.src = s.byteArrayToImage(payload['rearCamera']);

        s.processGPSData(payload['gps']);

        if (s.gpsFix) {

            //Checks the diference between the actial and last point
            const deltaLatitude = Math.abs(s.p[0] - s.prevP[0]);
            const deltaLongitude = Math.abs(s.p[1] - s.prevP[1]);

            //If the Points have a difference in latitude or longitud of 0.0001, we would put a marker
            //This value can change, but this is the one thata gave us better results
            if (deltaLatitude > 0.0001 || deltaLongitude > 0.0001) {
                
                //Put the marker on the map
                let marker = L.marker([s.lat, s.lon], { icon: s.map['icon'] });
                let markerLabel = '';

                //All the data that is show in the marker
                markerLabel += `<b>Date:</b> ${s.date} ${s.time}<br>`;
                markerLabel += `<b>Altitude:</b> ${s.alt}<br>`;
                markerLabel += `<b>D<sub>x</sub>:</b> ${s.d[0].toFixed(s.distanceDecimalPlaces)} m <br>`;
                markerLabel += `<b>D<sub>y</sub>:</b> ${s.d[1].toFixed(s.distanceDecimalPlaces)} m <br>`;
                markerLabel += `<b>D<sub>z</sub>:</b> ${s.d[2].toFixed(s.distanceDecimalPlaces)} m`;
                marker.bindPopup(markerLabel);

                //This is to delete the first marker, in Case the Map is full of markers
                if (markers.length >= s.map['maxMarkers']) {
                    s.map['obj'].removeLayer(markers[0]);
                    markers.shift();
                } 

                markers.push(marker);
                marker.addTo(s.map['obj']);
                s.map['obj'].flyTo([s.lat, s.lon], s.map['maxZoom']);

            }
            
        }



    }

});