let socket = io();
let isConnected = false;

function updateVelocity(vx, vy, vz) {

    $('#velX').html(`${vx} m/s`);
    $('#velY').html(`${vy} m/s`);
    $('#velZ').html(`${vz} m/s`);

}

function updateAcceleration(ax, ay, az) {

    $('#acelX').html(`${ax} m²/s`);
    $('#acelY').html(`${ay} m²/s`);
    $('#acelZ').html(`${az} m²/s`);

}


function updateGeoloctaion(lat, lon, alt) {

    $('#lat').html(`${lat} °`);
    $('#lon').html(`${lon} °`);
    $('#alt').html(`${alt} m`);

}

function updateTime(date, time) {

    $('#date').html(`${date} °`);
    $('#time').html(`${time} °`);

}

function updateConnectionStatus(isConnected) {

    // Get sections.
    let off = $('#connectionStatusOff');
    let on = $('#connectionStatusOn');

    // Toggle sections.
    if (isConnected) {
        off.addClass('d-none');
        on.removeClass('d-none');
    } else {
        off.removeClass('d-none');
        on.addClass('d-none');
    }

}

function updateBatteryStatus(percentage, isConnected) {

    // Get icons.
    let full = $('#batteryStatusFull');
    let threeQuarters = $('#batteryStatusThreeQuarters');
    let half = $('#batteryStatusHalf');
    let quarter = $('#batteryStatusQuarter');
    let empty = $('#batteryStatusEmpty');
    let off = $('#batteryStatusOff');

    // Constain the percentage between 0 and 100%.
    let p = percentage;
    if (p > 100) {
        p = 100;
    } else if (p < 0) {
        p = 0
    }

    // Makes sure that all icons are hidden.
    off.addClass('d-noen');
    full.addClass('d-none');
    threeQuarters.addClass('d-none');
    half.addClass('d-none');
    quarter.addClass('d-none');
    empty.addClass('d-none');
    off.addClass('d-none');

    // Only show a colored icon if there is a connection to the vehicle.
    if (isConnected) {
        if (p > 75) {
            full.removeClass('d-none');
        } else if (p > 50) {
            threeQuarters.removeClass('d-none');
        } else if (p > 25) {
            half.removeClass('d-none');
        } else if (p > 5) {
            quarter.removeClass('d-none');
        } else {
            empty.removeClass('d-none');
        }
    } else {
        off.removeClass('d-none');
    }

}

$(() => {
    loop();
});

function loop() {

    updateConnectionStatus(isConnected);
    updateBatteryStatus(100, isConnected);

    requestAnimationFrame(loop);

}

socket.on('connect', () => {
    isConnected = socket.connected;
});

socket.on('disconnect', () => {
    isConnected = !socket.disconnected;
});

socket.on('message', function(msg){
    console.log(msg);
});