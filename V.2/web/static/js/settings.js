export default class Settings {

    constructor() {
        this.vx = '####';
        this.vy = '####';
        this.vz = '####';
        this.ax = '####';
        this.ay = '####';
        this.az = '####';
        this.lon = '####';
        this.lat = '####';
        this.alt = '####';
        this.date = "####";
        this.time = "####";
        this.isConnected = false;
        this.battery = 100;

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

    reset() {
        this.vx = '####';
        this.vy = '####';
        this.vz = '####';
        this.ax = '####';
        this.ay = '####';
        this.az = '####';
        this.lon = '####';
        this.lat = '####';
        this.alt = '####';
        this.date = "####";
        this.time = "####";
    }

    updateAnalytics() {
        if (!this.isConnected) {
            this.reset();
        }
        $('#velX').html(`${this.vx} m/s`);
        $('#velY').html(`${this.vy} m/s`);
        $('#velZ').html(`${this.vz} m/s`);
        $('#acelX').html(`${this.ax} m²/s`);
        $('#acelY').html(`${this.ay} m²/s`);
        $('#acelZ').html(`${this.az} m²/s`);
        $('#lat').html(`${this.lat}°`);
        $('#lon').html(`${this.lon}°`);
        $('#alt').html(`${this.alt} m`);
        $('#date').html(`${this.date}`);
        $('#time').html(`${this.time}`);
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

};