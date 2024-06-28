class Polygon {
    constructor(map, layer, id, options = {}, showBoundingBox = true, latlngs=[]) {
        console.log('map', map, latlngs)
        this.id = id
        this.mapContext = map;
        this.latlngs = latlngs;
        this.layer = layer//?layer:L.polygon(latlngs, options).addTo(this.mapContext.map);;
        this.selected = false;
        this.stores = [];

        this.addContextMenuStyles(); // inject the CSS styles

        this.layer.on('contextmenu', (event) => {
            console.log(event)
            this.mapContext.hideContextMenus()
            this.mapContext.selectedPolygon = this
            this.selected = true

            this.showContextMenu(event)
        });
        this.searched = []
        if (showBoundingBox) L.rectangle(this.#getBoundingBox(), {color: "#ff7800", weight: 1}).addTo(this.mapContext.map);
        this.mapContext.map.addLayer(this.layer)
    }

    static parse(area){

        let st = this.stores.map(store => ({
            latlng: store.latlng,
            options: store.options
        }))

        return {
            id: this.id,
            map:this.mapContext.id,
            layer:this.layer,
            selected:this.selected,
            stores:st

        }
    }

    showContextMenu(event) {
        
        L.DomEvent.preventDefault(event);
        L.DomEvent.stopPropagation(event);
        
        let left = `${event.containerPoint.x}px`;
        let top = `${event.containerPoint.y}px`;
        
        this.createPolygonContextMenu(top, left)

        
        this.mapContext.contextMenuLatLng = event.latlng;
        this.mapContext.selectedMarker = this;
    }

    createPolygonContextMenu(top, left) {
       
        // Create the context menu div
        const contextMenu = document.createElement('div');
        contextMenu.id = this.id;
        contextMenu.className = 'polygon-context-menu';
        
        // Create the unordered list
        const ul = document.createElement('ul');
        
        // Create the list items
        const editPolygon = document.createElement('li');
        editPolygon.id = 'edit-polygon';
        editPolygon.innerText = 'Edit Area';
        
        const deletePolygon = document.createElement('li');
        deletePolygon.id = 'delete-polygon';
        deletePolygon.innerText = 'Delete Area';

        const selectPolygon = document.createElement('li');
        selectPolygon.id = 'select-polygon';
        selectPolygon.innerText = 'Select Area';
        
        // Append list items to the unordered list
        ul.appendChild(editPolygon);
        ul.appendChild(deletePolygon);
        ul.appendChild(selectPolygon);
        
        // Append the unordered list to the context menu div
        contextMenu.appendChild(ul);

        // Position element
        contextMenu.style.left = left;
        contextMenu.style.top = top;
        contextMenu.style.display = 'block';
        
        // Append the context menu div to the body
        document.body.appendChild(contextMenu);

        // Add event listener to the delete-Polygon list item
        deletePolygon.addEventListener('click', () => {
            // Define the function to execute when delete-Polygon is clicked
            console.log('Delete Polygon clicked');
            this.remove();
            // Remove menu
            this.removeContextMenu();
            // Call the deletePolygon function from your MapWithContextMenu class
            if (window.mapWithContextMenuInstance) {
                window.mapWithContextMenuInstance.deletePolygon();
            }
        });

        // Add event listener to the select-marker list item
        selectPolygon.addEventListener('click', () => {
            console.log('Select Area clicked');
            //this.mapContext.addSelectedItem(this);
            // Remove menu
            this.removeContextMenu();
        });
    }


    removeContextMenu() {
        const element = document.getElementById(this.id);
        if (element) {
            element.remove();
        } else {
            console.warn(`Element with id "${this.id}" not found.`);
        }
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

   /*  showContextMenu(event) {
        L.DomEvent.preventDefault(event);
        const polygonContextMenu = document.getElementById('polygon-context-menu');
        polygonContextMenu.style.left = `${event.containerPoint.x}px`;
        polygonContextMenu.style.top = `${event.containerPoint.y}px`;
        polygonContextMenu.style.display = 'block';
        this.mapContext.selectedPolygon = this;
    } */

    edit() {
        new L.EditToolbar.Edit(this.map.map, {
            featureGroup: L.featureGroup([this.layer])
        }).enable();
    }

    updateMapAreas(){
        this.mapContext.areas.map(poly=>{
            console.log('poly', poly, this, poly.id == this.id)
            return poly.id == this.id?this:poly
        })
        console.log('update map areas', this.map.areas)
    }

    remove() {
        this.mapContext.map.removeLayer(this.layer);
        this.mapContext.removePolygonFromState(this);
        this.mapContext.saveMapState();
    }

    addMarker() {
        const bounds = this.layer.getBounds();
        const center = bounds.getCenter();
        const newMarker = new Marker(this.map, center);
        this.markers.push(newMarker);
        
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
                        const options =  { 
                            id:generateUniqueId(),
                            info:element.tags 
                        }
                        new StoreMarker(this.map, latlng, options);
                        this.stores.push({latlng, options});
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

    addContextMenuStyles() {
        // Check if the style tag already exists
        if (!document.getElementById('polygon-context-menu-styles')) {
            const style = document.createElement('style');
            style.id = 'polygon-context-menu-styles';
            style.innerHTML = `
                .polygon-context-menu {
                    position: absolute;
                    display: none;
                    background: white;
                    border: 1px solid #ccc;
                    z-index: 1000;
                }

                .polygon-context-menu ul {
                    list-style: none;
                    margin: 0;
                    padding: 0;
                }

                .polygon-context-menu li {
                    padding: 8px 12px;
                    cursor: pointer;
                }

                .polygon-context-menu li:hover {
                    background: #eee;
                }
            `;
            document.head.appendChild(style);
        }
    }
}