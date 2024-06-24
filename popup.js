class Popup {
    constructor(lat, lng, tags) {
        this.lat = lat;
        this.lng = lng;
        this.tags = tags;
    }

    createPopupContent() {
        return Object.keys(this.tags).map(tag => `${tag}: ${this.tags[tag]}`).join('<br>');
    }

    createMarker(map, layerGroup) {
        const marker = L.marker([this.lat, this.lng], {
            icon: L.icon({
                iconUrl: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
                iconSize: [32, 32],
                iconAnchor: [16, 32]
            })
        }).addTo(layerGroup);

        const popupContent = this.createPopupContent();
        marker.bindPopup(popupContent);
        return marker;
    }
}
