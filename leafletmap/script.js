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

class PolygonWithContextMenu {
    constructor(map, layer, id, showBoundingBox = true) {
        console.log('map', map)
        this.id = id
        this.map = map;
        this.layer = layer;
        this.layer.on('contextmenu', (event) => this.showContextMenu(event));
        if (showBoundingBox) L.rectangle(this.#getBoundingBox(), {color: "#ff7800", weight: 1}).addTo(this.map.map);
        this.selected = false
        this.stores = [];
        
    }

    #getBoundingBox(){
        const latlngs = this.layer.getLatLngs()[0];

        // Calculate bounding box coordinates
        const lats = latlngs.map(latlng => latlng.lat);
        const lngs = latlngs.map(latlng => latlng.lng);
        const minLatbb = Math.min(...lats);
        const maxLatbb = Math.max(...lats);
        const minLngbb = Math.min(...lngs);
        const maxLngbb = Math.max(...lngs);
        const bbox = [[minLatbb, minLngbb], [maxLatbb, maxLngbb]];

        console.log(bbox)

        

        return bbox

    }

    get layerData(){
        let st = this.stores.map(store => ({
            latlng: store.latlng,
            options: store.options
        }))
        return{
            id:this.id,
            latlngs:this.layer.getLatLngs()[0],
            stores:st,
            selected:this.selected,
        }
    }

    showContextMenu(event) {
        L.DomEvent.preventDefault(event);
        const polygonContextMenu = document.getElementById('polygon-context-menu');
        polygonContextMenu.style.left = `${event.containerPoint.x}px`;
        polygonContextMenu.style.top = `${event.containerPoint.y}px`;
        polygonContextMenu.style.display = 'block';
        this.map.selectedPolygon = this;
    }

    edit() {
        new L.EditToolbar.Edit(this.map.map, {
            featureGroup: L.featureGroup([this.layer])
        }).enable();
    }

    remove() {
        this.map.map.removeLayer(this.layer);
        this.map.removePolygonFromState(this);
        this.map.saveMapState();
    }

    addMarker() {
        const bounds = this.layer.getBounds();
        const center = bounds.getCenter();
        const newMarker = new MarkerWithContextMenu(this.map, center);
        this.map.markers.push(newMarker);
        this.map.saveMapState();
    }

    searchStores() {
        const bounds = this.layer.getBounds();

        console.log(bounds)

        let bbox = this.#getBoundingBox()


        const [minLatLng, maxLatLng] = bbox;
        const [minLat, minLng] = minLatLng;
        const [maxLat, maxLng] = maxLatLng;

        const overpassQuery = `
            [out:json][timeout:25];
            (
                node["shop"](${minLat},${minLng},${maxLat},${maxLng});
                way["shop"](${minLat},${minLng},${maxLat},${maxLng});
                relation["shop"](${minLat},${minLng},${maxLat},${maxLng});
            );
            out center;
        `;

       
        const overpassUrl = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery)}`;

        fetch(overpassUrl)
            .then(response => response.json())
            .then(data => {
                // Clear existing stores
                this.stores = [];

                // Process Overpass API response to create MarkerWithContextMenu instances for each store
                data.elements.forEach(element => {
                    if (element.type === 'node' || element.type === 'way' || element.type === 'relation') {

                        let lat, lng;
                        if (element.type === 'node') {
                            lat = element.lat;
                            lng = element.lon;
                        } else if (element.type === 'way' || element.type === 'relation') {
                            lat = element.center.lat;
                            lng = element.center.lon;
                        }
                        const latlng = L.latLng(lat, lng);
                        const storeMarker = new StoreMarker(this.map, latlng, { 
                            id:generateUniqueId(),
                            info:element.tags 
                        });
                        this.stores.push(storeMarker);
                    }
                });

                // Save the stores to local storage
                this.map.saveMapState();
            })
            .catch(error => {
                console.error('Error searching stores:', error);
            });
    }
}



function generateUniqueId(identifier = 'id') {
    const timestamp = Date.now(); // Current timestamp in milliseconds
    const randomNum = Math.floor(Math.random() * 1000000); // Random number between 0 and 999999
    return `${identifier}-${timestamp}-${randomNum}`; // Concatenate to form the unique ID
}

// Make mapInstance global
const MAP = new Map('myLeafletMap');
window.mapInstance = MAP
