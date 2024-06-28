class Map {
    constructor(mapId, state = {}) {
        this.mapId = mapId;
        this.map = L.map('map').setView([51.505, -0.09], 13);
        this.selectedMarker = null;
        this.selectedPolygon = null;
        this.markers = [];
        this.areas = [];
        this.selectedItems = [];
        this.contextMenuLatLng = null;
        this.state = state

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap contributors'
        }).addTo(this.map);

        this.addContextMenuStyles();

        this.map.on('contextmenu', (event) => this.showContextMenu(event));
        this.map.on('click', () => this.hideContextMenus());

       /*  // Bind marker context menu actions
        document.getElementById('edit-marker').addEventListener('click', () => this.editMarker());
        document.getElementById('delete-marker').addEventListener('click', () => this.deleteMarker());

        // Bind polygon context menu actions
        document.getElementById('edit-polygon').addEventListener('click', () => this.editPolygon());
        document.getElementById('save').addEventListener('click', () => this.save());
        document.getElementById('delete-polygon').addEventListener('click', () => this.deletePolygon());
        document.getElementById('add-marker-to-polygon').addEventListener('click', () => this.addMarkerToPolygon());
        document.getElementById('search-stores').addEventListener('click', () => this.searchStores());
 */
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
        const areasState = this.areas.map(area => {
            console.log('area:',area, area.layerData)
            return{
            id:area.id,
            geojson: area.layer.toGeoJSON(),
            ...area.layerData
        }});
        localStorage.setItem(this.mapId, JSON.stringify({ markers: markersState, areas: areasState }))

    }

    showContextMenu(event) {
        L.DomEvent.preventDefault(event);
        L.DomEvent.stopPropagation(event);
        let left = `${event.containerPoint.x}px`;
        let top = `${event.containerPoint.y}px`;
        this.hideContextMenus()
        this.createMapContextMenu(top, left)
        this.contextMenuLatLng = event.latlng;
    }

    createMapContextMenu(top, left) {
        
        // Create the context menu div
        const contextMenu = document.createElement('div');
        contextMenu.id = 'map-context-menu';
        contextMenu.className = 'map-context-menu';
        
        // Create the unordered list
        const ul = document.createElement('ul');
        
        // Create the list items
        const addMarker = document.createElement('li');
        addMarker.id = 'add-marker';
        addMarker.innerText = 'Add Marker';
        
        const addArea = document.createElement('li');
        addArea.id = 'add-area';
        addArea.innerText = 'Add Area';

      
        // Append list items to the unordered list
        ul.appendChild(addMarker);
        ul.appendChild(addArea);
            
        // Append the unordered list to the context menu div
        contextMenu.appendChild(ul);

        // Position element
        contextMenu.style.left = left;
        contextMenu.style.top = top;
        contextMenu.style.display = 'block';
        
        // Append the context menu div to the body
        document.body.appendChild(contextMenu);

        // Add event listener to the delete-marker list item
        addMarker.addEventListener('click', () => {
            // Define the function to execute when delete-marker is clicked
            console.log('Add marker clicked');
            this.addMarker()
            // Remove menu
            this.removeContextMenu();
            this.updateMapState()
            // Call the deleteMarker function from your MapWithContextMenu class
            if (window.mapWithContextMenuInstance) {
                window.mapWithContextMenuInstance.deleteMarker();
            }
        });

        // Add event listener to the add area item
        addArea.addEventListener('click', () => {
            console.log('add area clicked');
            this.startDrawingArea()
            // Remove menu
            this.removeContextMenu();
        });
    }

    removeContextMenu() {
        const contextMenus = document.getElementsByClassName("map-context-menu");
        Array.from(contextMenus).forEach(menu => {
            menu.remove();
        });
       /*  const element = document.getElementById("map-context-menu");
        if (element) {
            element.remove();
        } else {
            console.warn(`Element with id "map-context-menu" not found.`);
        } */
    }

    addContextMenuStyles() {
        // Check if the style tag already exists
        if (!document.getElementById('map-menu-styles')) {
            const style = document.createElement('style');
            style.id = 'map-context-menu-styles';
            style.innerHTML = `
                .map-context-menu {
                    position: absolute;
                    display: none;
                    background: white;
                    border: 1px solid #ccc;
                    z-index: 1000;
                }

                .map-context-menu ul {
                    list-style: none;
                    margin: 0;
                    padding: 0;
                }

                .map-context-menu li {
                    padding: 8px 12px;
                    cursor: pointer;
                }

                .map-context-menu li:hover {
                    background: #eee;
                }
            `;
            document.head.appendChild(style);
        }
    }

    hideContextMenus() {
        
            // Select all elements in the document
            const elements = document.querySelectorAll('*');
        
             // Loop through each element
            elements.forEach(element => {
                // Ensure the className is a string before checking if it includes 'context'
                if (typeof element.className === 'string' && element.className.includes('context')) {
                    // Remove the element from the DOM
                    element.remove();
                }
            });
    
    }

    addMarker() {
        if (this.contextMenuLatLng) {
            const newMarker = new Marker(this, this.contextMenuLatLng);
            this.markers.push(newMarker);
            this.saveMapState();
            //this.hideContextMenus();
        }
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
            /* if (savedMapState.areas) {
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
                }); */
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

    draw() {
        
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
        
    }

    startDrawingArea() {
        new L.Draw.Polygon(this.map).enable();
        
    }

    addArea(event) {
        const layer = event.layer;
        
        let id = Math.round(Math.random()*1000 + 1)
        const newArea = new Polygon(this, layer,id);
        this.areas.push(newArea);
        //this.saveMapState();
        //this.draw();
        this.updateMapState()

    }
}