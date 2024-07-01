class Polygon {
    constructor(map, latlngs, id, name = '', options, showBoundingBox = true, stores, markers) {
        console.log('map', map, latlngs)
        this.id = id
        this.name = name || 'AR' + id
        this.mapContext = map;
        this.latlngs = latlngs || null;
        this.boundingBoxLayer = null
        this.selected = false;
        this.stores = stores || [];
        this.options = options ||  {color: "green", weight: 1}
        this.searched = []
        this.showBoundingBox=showBoundingBox
        this.markers=markers || []

        this.polygon = L.polygon(this.latlngs, this.options)

        if (this.showBoundingBox) {
            this.boundingBoxLayer = L.rectangle(this.#getBoundingBox(), {color: "#ff7800", weight: 1}).addTo(this.mapContext.map);
        }

        this.contextMenu = new ContextMenu([
            { id: 'edit-polygon', text: 'Edit Area', onClick: this.editPolygon.bind(this) },
            { id: 'select-polygon', text: 'Select Area', onClick: this.selectPolygon.bind(this) },
            { id: 'add-marker-to-polygon', text: 'Add Marker', onClick: this.addMarker.bind(this)},
            { id: 'search-stores', text: 'Search Stores', onClick: this.searchStores.bind(this)},
            { id: 'delete-polygon', text: 'Delete Area', onClick: this.deletePolygon.bind(this) },
        
        ]);

        this.polygon.on('contextmenu', (event) => {
            this.contextMenu.hideContextMenus();
            this.showContextMenu(event);
        });

        this.polygon.on('click', () => {
            this.mapContext.selectedPolygon = this;
            this.contextMenu.removeContextMenu();
        });
        
        this.mapContext.map.addLayer(this.polygon)
    }

    static createFromObject(mapContext, areaObject){
        let latlngs = areaObject.latlngs
        let id = areaObject.id
        let name = areaObject.name || ''
        let options = areaObject.options
        let showBoundingBox = areaObject.showBoundingBox
        let markers = areaObject.markers
        let stores = []
        if (areaObject.stores.length){
            areaObject.stores.map(s=>{
                let store =  StoreMarker.init(
                    s.latlng, 
                    s.id, 
                    s.name, 
                    s.options, 
                    s.info, 
                    s.type
                )
                store.shop = s.shop
                return store
            })
        }
        
        new Polygon(
            mapContext, 
            latlngs, 
            id, 
            name, 
            options, 
            showBoundingBox = true, 
            stores, 
            markers)

    }

    showContextMenu(event) {
        L.DomEvent.stopPropagation(event);
        
        const left = `${event.containerPoint.x}px`;
        const top = `${event.containerPoint.y}px`;

        this.contextMenu.createContextMenu(top, left);
    }

    editPolygon() {
        console.log('Edit Polygon clicked');
        // Implement the edit logic here
        new L.EditToolbar.Edit(this.mapContext.map, {
            featureGroup: L.featureGroup([this.polygon])
        }).enable();
        this.contextMenu.removeContextMenu();
    }

    deletePolygon() {
        console.log('Delete Polygon clicked');
        this.mapContext.map.removeLayer(this.polygon);
        if(this.boundingBoxLayer) this.mapContext.map.removeLayer(this.boundingBoxLayer);
        this.mapContext.selectedPolygon = null;
        this.mapContext.removePolygonFromState(this);

        this.mapContext.saveMapState();
        // Implement additional delete logic here
        this.contextMenu.removeContextMenu();
    }

    selectPolygon() {
        console.log('Select Polygon clicked');
        this.mapContext.selectedPolygon = this;
        // Implement additional select logic here
        console.log('parsed', this.parse(this))
        this.contextMenu.removeContextMenu();
    }

    addMarker() {
        console.log('Add Marker to area clicked');
        const bounds = this.layer.getBounds();
        const center = bounds.getCenter();
        const newMarker = new Marker(this.mapContext, center);
        this.markers.push(newMarker);
        this.contextMenu.removeContextMenu();
        
    }


    parse(){

        let st = this.stores.map(store =>store.parse())

        let mk = this.markers.map(marker => ({
            latlng: marker.latlng,
            options: marker.options
        }))

        return {
            id: this.id,
            map:this.mapContext.id,
            layer:this.polygon,
            selected:this.selected,
            stores:st,
            markers:mk

        }
    }

   
    #getBoundingBox(){
        const latlngs = this.polygon.getLatLngs()[0];
        // Calculate bounding box coordinates
        const lats = latlngs.map(latlng => latlng.lat);
        const lngs = latlngs.map(latlng => latlng.lng);
        const minLatbb = Math.min(...lats);
        const maxLatbb = Math.max(...lats);
        const minLngbb = Math.min(...lngs);
        const maxLngbb = Math.max(...lngs);
        const bbox = [[minLatbb, minLngbb], [maxLatbb, maxLngbb]];
        //console.log(bbox)
        return bbox

    }

    searchStores() {
        console.log('Search Stores clicked');
        const bounds = this.polygon.getBounds();

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
                        let id = generateUniqueId()
                        let info = element.tags 
                        let type = info.shop?info.shop:'search-result'
                        let searchItemData = {
                            latlng, 
                            id,
                            name:'',
                            info, 
                            options:{}, 
                            type
                        }
                        console.log('element info', info)
                        let store = StoreMarker.init(this.mapContext, searchItemData);
                        this.stores.push(store);
                    }
                });

                console.log('search', this.stores)
                // Save the stores to local storage
                //this.map.updateMapAreas();
                //this.map.saveMapState();
                this.contextMenu.removeContextMenu();
            })
            .catch(error => {
                console.error('Error searching stores:', error);
            });
    }

   
}