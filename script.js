// Example usage:
document.addEventListener('DOMContentLoaded', () => {
    // Initialize the first map
    const map1 = new LeafletMap('map1', {
        center: [-23.561, -46.654],
        zoom: 13
    });

    map1.addTileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors'
    });

    map1.addMarker(-23.561, -46.654, 'Map 1: A pretty CSS3 popup.<br> Easily customizable.');

    /* // Initialize the second map
    const map2 = new LeafletMap('map2', {
        center: [40.7128, -74.0060],
        zoom: 13
    });

    map2.addTileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors'
    });

    map2.addMarker(40.7128, -74.0060, 'Map 2: A pretty CSS3 popup.<br> Easily customizable.'); */

     // Custom control to add a marker at the clicked point
    



});
