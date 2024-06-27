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
        this.selected = false;
        this.layer.on('contextmenu', (event) => {
            this.map.selectedPolygon = this
            this.selected = true
            this.showContextMenu(event)
        });
        this.searched = []
        if (showBoundingBox) L.rectangle(this.#getBoundingBox(), {color: "#ff7800", weight: 1}).addTo(this.map.map);
        
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

    updateMapAreas(){
        this.map.areas.map(poly=>{
            console.log('poly', poly, this, poly.id == this.id)
            return poly.id == this.id?this:poly
        })
        console.log('update map areas', this.map.areas)
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
                this.updateMapAreas();
                this.map.saveMapState();
            })
            .catch(error => {
                console.error('Error searching stores:', error);
            });
    }
}

class MapWithContextMenu {
    constructor(mapId) {
        this.mapId = mapId;
        this.map = L.map('map').setView([51.505, -0.09], 13);
        this.selectedMarker = null;
        this.selectedPolygon = null;
        this.markers = [];
        this.areas = [];
        this.selectedItems = [];
        this.contextMenuLatLng = null;

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap contributors'
        }).addTo(this.map);

        this.map.on('contextmenu', (event) => this.showContextMenu(event));
        this.map.on('click', () => this.hideContextMenus());

        // Bind marker context menu actions
        document.getElementById('edit-marker').addEventListener('click', () => this.editMarker());
        document.getElementById('delete-marker').addEventListener('click', () => this.deleteMarker());

        // Bind polygon context menu actions
        document.getElementById('edit-polygon').addEventListener('click', () => this.editPolygon());
        document.getElementById('save').addEventListener('click', () => this.save());
        document.getElementById('delete-polygon').addEventListener('click', () => this.deletePolygon());
        document.getElementById('add-marker-to-polygon').addEventListener('click', () => this.addMarkerToPolygon());
        document.getElementById('search-stores').addEventListener('click', () => this.searchStores());

        /* // Leaflet Draw Control
        this.drawControl = new L.Control.Draw({
            draw: {
                marker: false,
                polyline: false,
                circle: false,
                rectangle: false,
                circlemarker: false
            }
        });
        this.map.addControl(this.drawControl); */

        this.map.on(L.Draw.Event.CREATED, (event) => this.addArea(event));
        this.map.on(L.Draw.Event.EDITED, () => console.log('edited fired'));

        // Restore map state
        this.restoreMapState();
    }

    showContextMenu(event) {
        L.DomEvent.preventDefault(event);
        const contextMenu = document.getElementById('context-menu');
        contextMenu.style.left = `${event.containerPoint.x}px`;
        contextMenu.style.top = `${event.containerPoint.y}px`;
        contextMenu.style.display = 'block';
        this.contextMenuLatLng = event.latlng;
    }

    hideContextMenus() {
        document.getElementById('context-menu').style.display = 'none';
        document.getElementById('marker-context-menu').style.display = 'none';
        document.getElementById('polygon-context-menu').style.display = 'none';
        const contextMenus = document.getElementsByClassName('context-menu');
        Array.from(contextMenus).forEach(menu => {
            menu.style.display = 'none';
        });
    }

    addMarker() {
        if (this.contextMenuLatLng) {
            const newMarker = new MarkerWithContextMenu(this, this.contextMenuLatLng);
            this.markers.push(newMarker);
            this.saveMapState();
            this.hideContextMenus();
        }
    }

    editMarker() {
        if (this.selectedMarker) {
            this.selectedMarker.edit();
            this.hideContextMenus();
        }
    }

    deleteMarker() {
        if (this.selectedMarker) {
            this.selectedMarker.remove();
            this.hideContextMenus();
        }
    }

    editPolygon() {
        if (this.selectedPolygon) {
            this.selectedPolygon.edit();
            this.hideContextMenus();
        }
    }

    save() {
        if (this.selectedPolygon) {
            console.log('saving', this.selectedPolygon)
            this.selectedPolygon=null;
            this.saveMapState()
            this.hideContextMenus();
             // Restore map state
            this.restoreMapState();
        }
    }

    deletePolygon() {
        if (this.selectedPolygon) {
            this.selectedPolygon.remove();
            this.hideContextMenus();
        }
    }

    addMarkerToPolygon() {
        if (this.selectedPolygon) {
            this.selectedPolygon.addMarker();
            this.hideContextMenus();
        }
    }

    searchStores() {
        if (this.selectedPolygon) {
            this.selectedPolygon.searchStores();
            this.hideContextMenus();
        }
    }

    saveMapState() {
        const markersState = this.markers.map(marker => ({
            latlng: marker.latlng,
            options: marker.options
        }));
        console.log('areas:',this.areas)
       
        localStorage.setItem(this.mapId, JSON.stringify({ markers: markersState, areas: this.areas }));
    
    
    
    }

    removeMarkerFromState(markerToRemove) {
        this.markers = this.markers.filter(marker => marker !== markerToRemove);
    }

    removePolygonFromState(polygonToRemove) {
        this.areas = this.areas.filter(area => area !== polygonToRemove);
    }

    restoreMapState() {
        const savedMapState = JSON.parse(localStorage.getItem(this.mapId));
        if (savedMapState) {
            if (savedMapState.markers) {
                savedMapState.markers.forEach(markerData => {
                    const restoredMarker = new MarkerWithContextMenu(this, markerData.latlng, markerData.options);
                    this.markers.push(restoredMarker);
                });
            }
            if (savedMapState.areas) {
                savedMapState.areas.forEach(areaData => {
                    const {id, latlngs} = areaData
                    //const restoredLayer = L.geoJSON(areaData.geojson).getLayers()[0];
                    const restoredArea = new Polygon(this, latlngs, id, { color: 'green' });
                    restoredArea.stores = areaData.stores?.map(storeData => {
                        //console.log('restoreMapState', storeData)
                        return new StoreMarker(this, storeData.latlng, storeData.options);
                    });
                    this.areas.push(restoredArea);
                    //this.map.addLayer(restoredLayer);
                });
            }
        }
    }

    startDrawingArea() {
        new L.Draw.Polygon(this.map).enable();
        this.hideContextMenus();
    }

    addArea(event) {
       // console.log('add area', event.layer.getLatLngs()[0])
        const layer = event.layer;
        const latlngs = event.layer.getLatLngs()[0].map((v)=>{
            let lat = v.lat
            let lng = v.lng
            return [lat, lng]
        },[])
        console.log('add area latlngs', latlngs)
        const id=Math.round(Math.random()*1000 + 1)
        const newArea = new Polygon(this, latlngs, id, { color: 'blue' });
        //this.map.addLayer(layer);
        //const newArea = new PolygonWithContextMenu(this, layer);
        this.areas.push({id,latlngs,stores:[]});
        this.selectedPolygon = newArea
        this.saveMapState();
    }
}

function generateUniqueId(identifier = 'id') {
    const timestamp = Date.now(); // Current timestamp in milliseconds
    const randomNum = Math.floor(Math.random() * 1000000); // Random number between 0 and 999999
    return `${identifier}-${timestamp}-${randomNum}`; // Concatenate to form the unique ID
}

// Make mapInstance global
const mapInstance = new MapWithContextMenu('myLeafletMap');
window.mapInstance = mapInstance
