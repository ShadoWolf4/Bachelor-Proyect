import Settings from './settings.js'

let socket = io();
let s = new Settings();

$(() => {
    loop();
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