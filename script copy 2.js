// Example usage:
document.addEventListener('DOMContentLoaded', () => {
    // Ensure the map is initialized only once.
    if (!window.leafletMap) {
        window.leafletMap = new LeafletMap('map', {
            center: [51.505, -0.09],
            zoom: 13
        });

        window.leafletMap.addTileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap contributors'
        });

        window.leafletMap.addMarker(51.5, -0.09, 'A pretty CSS3 popup.<br> Easily customizable.');
    }
});