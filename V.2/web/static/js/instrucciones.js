import Settings from './settings.js'

let s = new Settings();
let socket = io.connect(s.socketURL);

function setCallbacks() {

    $('#shutdown').click(() => {
        if (s.isConnected) {
            socket.emit('shutdown', {})
        }
    });

}

$(() => {
    setCallbacks();
    loop();

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

socket.on('message', function(payload){

    if (payload) {
    }

});