class Map {
     constructor(mapId, latlngs, state = {}) {
        this.mapId = mapId;
        this.latlngs = latlngs || [51.505, -0.09]
        //this.zoom = zoom || 10
        this.selectedMarker = null;
        this.selectedPolygon = null;
        this.markers = [];
        this.areas = [];
        this.selectedItems = [];
        this.contextMenuLatLng = null;
        this.state = state

        this.map = L.map('map', {
            zoomControl: false // Disable the default zoom control
        }).setView(this.latlngs,10);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap contributors'
        }).addTo(this.map);

        this.contextMenu = new ContextMenu([
            { id: 'add-marker', text: 'Add Marker', onClick: this.addMarker.bind(this) },
            { id: 'add-area', text: 'Add Area', onClick: this.startDrawingArea.bind(this) },        
        ]);

        this.map.on('contextmenu', (event) => {
            this.contextMenuLatLng = event.latlng;
            this.contextMenu.hideContextMenus();
            this.showContextMenu(event)
        });

        this.map.on('click', () => this.contextMenu.hideContextMenus());

       
      
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
        L.DomEvent.stopPropagation(event);
        let left = `${event.containerPoint.x}px`;
        let top = `${event.containerPoint.y}px`;
        this.contextMenu.createContextMenu(top, left);
    }

    addMarker() {
    
        const newMarker = new Marker(this, this.contextMenuLatLng);
        this.markers.push(newMarker);
        this.contextMenu.removeContextMenu();
        newMarker.draw()
        //this.saveMapState();
        
    }

    startDrawingArea() {
        new L.Draw.Polygon(this.map).enable();
        this.contextMenu.removeContextMenu();
        
    }

    addArea(event) {
        const layer = event.layer;
        let latlngs = layer.getLatLngs()[0]
        let id = Math.round(Math.random()*1000 + 1)
        const newArea = new Polygon(this, latlngs, id);
        this.areas.push(newArea);
        this.updateMapState()

    }

    updateMapState(){
        console.log('markers:',this.markers)
        const markersState = this.markers.map(marker => ({
            id:marker.id,
            name:marker.name,
            latlng: marker.latlng,
            options: marker.options,
            info:marker.info,
            type:marker.type
        }));
        console.log('areas:',this.areas)
        //geojson: area.layer.toGeoJSON(),
        const areasState = this.areas.map(area => {
            console.log('area:',area, area.layerData)
            return{
            id:area.id,
            name:area.name,
            latlngs:area.latlngs,
            options:area.options,
            showBoundingBox:area.showBoundingBox,
            stores:area.stores
        }});
        localStorage.setItem(this.mapId, JSON.stringify({ markers: markersState, areas: areasState }))

    }

    save() {
        if (this.selectedPolygon) {
            console.log('saving', this.selectedPolygon)
            this.selectedPolygon=null;
            this.saveMapState()
            //this.remo();
             // Restore map state
            this.restoreMapState();
        }
    }


    saveMapState() {
        const markersState = this.markers.map(marker => ({
            latlng: marker.latlng,
            options: marker.options
        }));
        console.log('areas:',this.areas)
        const areasState = this.areas.map(area => {
            console.log('area:',area, area.layerData)
            return{
            id:area.id,
            geojson: area.layer.toGeoJSON(),
            ...area.layerData
        }});
        localStorage.setItem(this.mapId, JSON.stringify({ markers: markersState, areas: areasState }));
        //this.restoreMapState()
    }

    restoreMapState() {
        
        const savedMapState = JSON.parse(localStorage.getItem(this.mapId));
        if (savedMapState) {
            this.clearMap()
            if (savedMapState.markers) {
                savedMapState.markers.forEach(markerData => {
                    const restoredMarker = new Marker(
                        this, 
                        markerData.latlng,
                        markerData.id, 
                        markerData.name,
                        markerData.options,
                        markerData.info,
                    );
                    this.markers.push(restoredMarker);
                    //this.map.addLayer(restoredMarker);
                });
            }
             if (savedMapState.areas) {
                savedMapState.areas.forEach(areaData => {
                    const {latlngs, id, name, options, showBoundingBox, stores } = areaData
                    const restoredLayer = L.geoJSON(areaData.geojson).getLayers()[0];
                    const restoredArea = new Polygon(this,latlngs, id, name, options, showBoundingBox, stores);
                    this.areas.push(restoredArea);
                    //this.map.addLayer(restoredLayer);
                }); 
            }
        
    } 

}

    removeMarkerFromState(markerToRemove) {
        this.markers = this.markers.filter(marker => marker !== markerToRemove);
    }

    removePolygonFromState(polygonToRemove) {
        this.areas = this.areas.filter(area => area !== polygonToRemove);
    }

    /* restoreMapState() {
        
        const savedMapState = JSON.parse(localStorage.getItem(this.mapId));
        if (savedMapState) {
            this.clearMap()
            if (savedMapState.markers) {
                savedMapState.markers.forEach(markerData => {
                    const restoredMarker = new Marker(this, markerData.latlng, markerData.options);
                    this.markers.push(restoredMarker);
                    //this.map.addLayer(restoredMarker);
                });
            }
            if (savedMapState.areas) {
                savedMapState.areas.forEach(areaData => {
                    const {id} = areaData
                    const restoredLayer = L.geoJSON(areaData.geojson).getLayers()[0];
                    const restoredArea = new PolygonWithContextMenu(this, restoredLayer, id);
                    restoredArea.stores = areaData.stores?.map(storeData => {
                        console.log('restoreMapState', storeData)
                        return new StoreMarker(this, storeData.latlng, storeData.options);
                    });
                    //this.areas.push(restoredArea);
                    this.map.addLayer(restoredLayer);
                });
            }
        }
    } */

    clearMap() {
        this.map.eachLayer((layer) => {
            if (!(layer instanceof L.TileLayer)) {
                this.map.removeLayer(layer);
            }
        });
        
    }

    /* draw() {
        
        this.clearMap()
        this.removeContextMenu()
        console.log('drawing map markers', this.markers)
        console.log('drawing map areas', this.areas)
        if (this.markers.length) {
            this.markers.forEach(markerData => {
                const restoredMarker = new Marker(this, markerData.latlng, markerData.options);
                this.markers.push(restoredMarker);
                //this.map.addLayer(restoredMarker);
            });
        }
        if (this.areas.length) {
            console.log('draw areas', this.areas.length)
            this.areas.forEach(areaData => {
                const {id} = areaData
                //const layer = L.geoJSON(areaData.geojson).getLayers()[0];
                const area = new Polygon(this, areaData.layer, id);
                area.stores = areaData.stores?.map(storeData => {
                    console.log('restoreMapState', storeData)
                    return new StoreMarker(this, storeData.latlng, storeData.options);
                });
                
                
            });
        }
        
    } */

    

    
}