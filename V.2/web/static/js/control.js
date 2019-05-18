import Settings from './settings.js'

let socket = io();
let s = new Settings();
let frontCamera = document.getElementById('frontCamera');
let rearCamera = document.getElementById('rearCamera');

$(() => {

    loop();

    $('#shutdown').click(() => {
        if (s.isConnected) {
            socket.emit('shutdown', {})
        }
    });

});

function loop() {

    s.isConnected = socket.connected;

    s.updateAnalytics();
    s.updateConnectionStatus();
    s.updateBatteryStatus();

    socket.emit('message', {
        'data': 1
    });

    setTimeout(loop, 1000 / s.frameRate);

}

socket.on('disconnect', function() {
    frontCamera.src = 'img/no-image.png';
    rearCamera.src = 'img/no-image.png';
})

socket.on('message', function(payload){

    if (payload) {
        frontCamera.src = s.byteArrayToImage(payload['frontCamera']);
        rearCamera.src = s.byteArrayToImage(payload['rearCamera']);
    }


});