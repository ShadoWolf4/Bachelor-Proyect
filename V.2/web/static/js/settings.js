export default class Settings {

    constructor() {

        this.distanceDecimalPlaces = 2;
        this.velocityDecimalPlaces = 2;
        this.accelerationDecimalPlaces = 2;
        this.positionDecimalPlaces = 6;
        this.altitudeDecimalPlaces = 1;
        
        this.prevP = [0, 0, 0];
        this.p = [0, 0, 0];
        this.d = [0, 0, 0];
        this.v = [0, 0, 0];
        this.a = [0, 0, 0];
        this.lon = 0;
        this.lat = 0;
        this.alt = 0;
        this.date = "####";
        this.time = "####";
        this.gpsFix = false;
        this.gpsSatellites = 0;

        this.isConnected = false;
        this.battery = 100;
        this.frameRate = 24;


        this.socketURL = `ws://${document.domain}`;

        this.map = {
            'urls': {
                'Online': 'https://api.maptiler.com/maps/basic/{z}/{x}/{y}.png?key=OrA58S1v6SW3vr3lw43g',
                'Online Streets': 'https://api.maptiler.com/maps/streets/{z}/{x}/{y}.png?key=OrA58S1v6SW3vr3lw43g',
                'Offline': `http://${document.domain}/basic/{z}/{x}/{y}.png`,
            },
            'minZoom': 6,
            'maxZoom': 18,
            'maxMarkers': 30,
            'icon': undefined,
            'obj': undefined         
        };
        this.mapLayers = {};

        this.noCamera = 'data:image/png;base64,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';
    
    }


    setBatteryPercentage(p) {
        if (p > 100) {
            this.battery = 100;
        } else if (p < 0) {
            this.battery = 0
        } else {
            this.battery = Math.round(p);
        }
    }

    processGPSData(gps) {
        if (gps != undefined) {
            this.lat = gps['position'][0];
            this.lon = gps['position'][1];
            this.alt = gps['position'][2];
            this.prevP = this.p
            this.p = gps['position'];
            this.d = gps['distance'];
            this.v = gps['velocity'];
            this.a = gps['acceleration'];
            let date = gps['date'].split(' ');
            this.date = date[0];
            this.time = date[1];
            this.gpsFix = gps['fix'];
            this.gpsSatellites = gps['satellites'];
        }
    }

    updateAnalytics() {
        if (!this.isConnected) {
            $('#velX').html('####');
            $('#velY').html('####');
            $('#velZ').html('####');
            $('#acelX').html('####');
            $('#acelY').html('####');
            $('#acelZ').html('####');    
            $('#lat').html('####');
            $('#lon').html('####');
            $('#alt').html('####');
            $('#date').html('####');
            $('#time').html('####');
        } else {
            $('#velX').html(`${this.v[0].toFixed(this.velocityDecimalPlaces)} m/s`);
            $('#velY').html(`${this.v[1].toFixed(this.velocityDecimalPlaces)} m/s`);
            $('#velZ').html(`${this.v[2].toFixed(this.velocityDecimalPlaces)} m/s`);
            $('#acelX').html(`${this.a[0].toFixed(this.accelerationDecimalPlaces)} m²/s`);
            $('#acelY').html(`${this.a[1].toFixed(this.accelerationDecimalPlaces)} m²/s`);
            $('#acelZ').html(`${this.a[2].toFixed(this.accelerationDecimalPlaces)} m²/s`);
            $('#lat').html(`${this.lat.toFixed(this.positionDecimalPlaces)}°`);
            $('#lon').html(`${this.lon.toFixed(this.positionDecimalPlaces)}°`);
            $('#alt').html(`${this.alt.toFixed(this.altitudeDecimalPlaces)} m`);    
            $('#date').html(`${this.date}`);
            $('#time').html(`${this.time}`);
        }
        
    }

    updateConnectionStatus() {

        // Get sections.
        let off = $('#connectionStatusOff');
        let on = $('#connectionStatusOn');

        // Toggle sections.
        if (this.isConnected) {
            off.addClass('d-none');
            on.removeClass('d-none');
        } else {
            off.removeClass('d-none');
            on.addClass('d-none');
        }

    }

    updateBatteryStatus() {

        // Get icons.
        let full = $('#batteryStatusFull');
        let threeQuarters = $('#batteryStatusThreeQuarters');
        let half = $('#batteryStatusHalf');
        let quarter = $('#batteryStatusQuarter');
        let empty = $('#batteryStatusEmpty');
        let off = $('#batteryStatusOff');

        // Makes sure that all icons are hidden.
        off.addClass('d-noen');
        full.addClass('d-none');
        threeQuarters.addClass('d-none');
        half.addClass('d-none');
        quarter.addClass('d-none');
        empty.addClass('d-none');
        off.addClass('d-none');

        // Only show a colored icon if there is a connection to the vehicle.
        if (this.isConnected) {
            if (this.battery > 75) {
                full.removeClass('d-none');
            } else if (this.battery > 50) {
                threeQuarters.removeClass('d-none');
            } else if (this.battery > 25) {
                half.removeClass('d-none');
            } else if (this.battery > 5) {
                quarter.removeClass('d-none');
            } else {
                empty.removeClass('d-none');
            }
        } else {
            off.removeClass('d-none');
        }

    }

    byteArrayToImage(rawBytes) {

        // Initialize the output string by writing the base64 header.
        let binary = 'data:image/jpg;base64,';
    
        // Convert the byte to an array.
        let bytes = new Uint8Array(rawBytes);
    
        // Read every byte and convert it to string.
        const length = bytes.byteLength
        for (let i = 0; i < length; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
    
        // Send image.
        return binary;
    }

};