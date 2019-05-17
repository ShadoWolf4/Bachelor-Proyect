import Settings from './settings.js'

let socket = io();
let s = new Settings();

$(() => {
    loop();

    $('#shutdown').click(() => {
        socket.emit('shutdown', {})
    });

});

function loop() {

    s.isConnected = socket.connected;

    s.updateAnalytics();
    s.updateConnectionStatus();
    s.updateBatteryStatus();

    requestAnimationFrame(loop);

}

socket.on('message', function(msg){
    console.log(msg);
});