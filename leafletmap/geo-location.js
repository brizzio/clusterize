class Geo {
    constructor() {
        this.latitude = null;
        this.longitude = null;
        this.position = null;
    }

    
    // Method to get the current position
    getCurrentPosition() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation is not supported by your browser'));
            } else {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        this.latitude = position.coords.latitude;
                        this.longitude = position.coords.longitude;
                        this.position = L.latLng(this.latitude, this.longitude);
                        resolve(this.position);
                    },
                    (error) => {
                        reject(error);
                    }
                );
            }
        });
    }
}

window.Geo = Geo;



