import Settings from './settings.js'

let s = new Settings();
let socket = io.connect(s.socketURL);

//If shutdown is selcted, this would send an emit socket to the main.py to kill the system
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

//We use this loop to update all the anayltics, conections Status, and battery Status
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
        s.processGPSData(payload['gps']);
    }
});