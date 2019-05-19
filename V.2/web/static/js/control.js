import Settings from './settings.js'
import Car from './car.js'

let canvas = document.getElementById('control');
let ctx = canvas.getContext('2d');
let car = new Car(ctx);
let width = 0;
let height = 0;
let markers = [];
let s = new Settings();
let socket = io.connect(s.socketURL);
let frontCamera = document.getElementById('frontCamera');
let rearCamera = document.getElementById('rearCamera');

function setCallbacks() {

    $(document).on('keyup', (event) => {
        car.keyUp(event);
    });
    
    $(document).on('keydown', (event) => {
        car.keyDown(event);
    });

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

    function resize() {
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

    $('#shutdown').click(() => {
        if (s.isConnected) {
            socket.emit('shutdown', {})
        }
    });

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

$(() => {

    for (let key in s.map['urls']) {
        s.mapLayers[key] = L.tileLayer(s.map['urls'][key], {
            maxZoom: s.map['maxZoom'], 
            minZoom: s.map['minZoom'], 
            id: 'map', 
            attribution: '' 
        });
    }

    s.map['obj'] = L.map('map', { 
        center: [25.6275, -100.3098],
        zoom: 10,
        layers: [s.mapLayers[Object.keys(s.mapLayers)[0]]],
        attributionControl: false 
    });

    s.map['icon'] = L.icon({
        iconUrl: '../vendor/leaflet/img/icon.png',
        shadowSize: [0, 0],
        iconSize: [19, 31],
        iconAnchor: [9, 31]
    });

    L.control.layers(s.mapLayers).addTo(s.map['obj']);

    setCallbacks();
    loop();
    animationLoop();

});

function animationLoop() {
    ctx.clearRect(0, 0, width, height);
    car.update();
    car.draw();
    requestAnimationFrame(animationLoop);
}


function loop() {
    s.isConnected = socket.connected;
    if (s.isConnected) {
        $('#satelliteCount').html(`${s.gpsSatellites} / 12`);
        let gray = $('#satelliteGray');
        let yellow = $('#satelliteYellow');
        let green = $('#satelliteGreen');
        gray.addClass('d-none');
        yellow.addClass('d-none');
        green.addClass('d-none');
        if (s.gpsSatellites <= 0) {
            gray.removeClass('d-none');
        } else if (s.gpsSatellites <= 4) {
            yellow.removeClass('d-none');
        } else {
            green.removeClass('d-none');
        }
    }
    s.updateAnalytics();
    s.updateConnectionStatus();
    s.updateBatteryStatus();
    socket.emit('message', {
        'data': 1
    });
    setTimeout(loop, 1000 / s.frameRate);
}

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

            const deltaLatitude = Math.abs(s.p[0] - s.prevP[0]);
            const deltaLongitude = Math.abs(s.p[1] - s.prevP[1]);

            if (deltaLatitude > 0.0001 || deltaLongitude > 0.0001) {

                let marker = L.marker([s.lat, s.lon], { icon: s.map['icon'] });
                let markerLabel = '';
                markerLabel += `<b>Date:</b> ${s.date} ${s.time}<br>`;
                markerLabel += `<b>Altitude:</b> ${s.alt}<br>`;
                markerLabel += `<b>D<sub>x</sub>:</b> ${s.d[0].toFixed(s.distanceDecimalPlaces)} m <br>`;
                markerLabel += `<b>D<sub>y</sub>:</b> ${s.d[1].toFixed(s.distanceDecimalPlaces)} m <br>`;
                markerLabel += `<b>D<sub>z</sub>:</b> ${s.d[2].toFixed(s.distanceDecimalPlaces)} m`;
                marker.bindPopup(markerLabel);

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