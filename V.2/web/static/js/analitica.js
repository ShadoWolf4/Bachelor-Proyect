import Settings from './settings.js'

let socket = io();
let s = new Settings();

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

    setTimeout(loop, 1000);
}

socket.on('message', function(msg){
    console.log(msg);
});