let crawler = require('map-tiles-crawler');

// https://www.openstreetmap.org/export#map=12/25.6627/-100.3807

crawler.crawl({
    url: 'https://api.maptiler.com/maps/basic/{z}/{x}/{y}.png?key=OrA58S1v6SW3vr3lw43g',
    targetFolder: './basic/',
    level : 9,
    
    topLeft: [25.6787, -100.4465],
    bottomRight: [25.6466, -100.3895],
    // topLeft: [25.7173, -100.4813],
    // bottomRight: [25.6081, -100.2801],


    wait: 50,
    progress : (tile) => {
        console.log(tile);
    },
    success : () => {
        console.log('success!');
    },
    error : (tile) => {
        console.log('error', tile);
    }
});