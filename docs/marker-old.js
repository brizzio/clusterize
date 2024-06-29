class MarkerWithContextMenu {
    constructor(map, latlng, options = {}) {
        this.map = map;
        this.latlng = latlng;
        this.options = options;

        this.marker = L.marker(latlng, {
            icon: L.icon({
                iconUrl: options.iconUrl || 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
                iconSize: [32, 32],
                iconAnchor: [16, 32]
            })
        }).addTo(this.map.map);

        this.marker.on('contextmenu', (event) => this.showContextMenu(event));
    }

    showContextMenu(event) {
        L.DomEvent.preventDefault(event);
        const markerContextMenu = document.getElementById('marker-context-menu');
        markerContextMenu.style.left = `${event.containerPoint.x}px`;
        markerContextMenu.style.top = `${event.containerPoint.y}px`;
        markerContextMenu.style.display = 'block';
        this.map.selectedMarker = this;
    }

    edit() {
        this.marker.setIcon(L.icon({
            iconUrl: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
            iconSize: [32, 32],
            iconAnchor: [16, 32]
        }));
        this.options.iconUrl = 'https://maps.google.com/mapfiles/ms/icons/red-dot.png';
        this.map.saveMapState();
    }

    remove() {
        this.map.map.removeLayer(this.marker);
        this.map.removeMarkerFromState(this);
        this.map.saveMapState();
    }
}