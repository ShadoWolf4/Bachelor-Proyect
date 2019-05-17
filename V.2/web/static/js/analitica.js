import * as common  from "./common.js"

let socket = io();

$(() => {
    
    loop();
});

function loop() {

    common.updateConnectionStatus(socket.connected);
    common.updateBatteryStatus(100, socket.connected);

    requestAnimationFrame(loop);

}

socket.on('message', function(msg){
    console.log(msg);
});