const crawler = require('./../src/crawler');
const fs = require('fs');
const rimraf = require('rimraf');

describe('Path', function() {

    it('Calculate tile coordinates', function() {
        var result = crawler.getPaths("http://url.com/maps/vt?lyrs=s@189&gl=cn&x={x}&y={y}&z={z}#.jpeg", {
            x : 1,
            y : 2,
            z : 3
        });
        
        expect(result.source).toEqual("http://url.com/maps/vt?lyrs=s@189&gl=cn&x=1&y=2&z=3#.jpeg");
        expect(result.target).toEqual("1/2/3.jpeg");
    });

});