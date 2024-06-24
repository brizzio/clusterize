class LeafletMap {
    constructor(mapId, options) {
        this.id = mapId
        let opt = options || {
            center: [-23.561, -46.654],
            zoom: 13
        }
        if (L.DomUtil.get(mapId)._leaflet_id) {
            // If the map is already initialized, remove the existing map instance.
            L.DomUtil.get(mapId)._leaflet_id = null;
        }
        this.map = L.map(this.id, opt);

        // Initialize the FeatureGroup to store drawn layers
        this.features = new L.FeatureGroup();

        this.map.add
    }

    setView(lat, lng, zoom) {
        this.map.setView([lat, lng], zoom);
    }

    addTileLayer(url, options) {

        

        let tileUrl= url || 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
        let opt = options || {
            maxZoom: 19,
            attribution: '© OpenStreetMap contributors'
        }
        L.tileLayer(tileUrl, opt).addTo(this.map);
    }

    addMarker(lat, lng, popupText) {
        const marker = L.marker([lat, lng]).addTo(this.map);
        if (popupText) {
            marker.bindPopup(popupText);
        }
    }

    addCircle(lat, lng, options) {
        const circle = L.circle([lat, lng], options).addTo(this.map);
        return circle;
    }

    addPolygon(latlngs, options) {
        const polygon = L.polygon(latlngs, options).addTo(this.map);
        return polygon;
    }
}


