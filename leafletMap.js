class Popup {
    constructor(tags) {
        this.tags = tags;
    }

    createPopupContent() {
        return Object.keys(this.tags).map(tag => `${tag}: ${this.tags[tag]}`).join('<br>');
    }
}

class Marker {
    constructor(lat, lng, tags) {
        this.lat = lat;
        this.lng = lng;
        this.tags = tags;
    }

    createMarker(map, layerGroup) {
        const marker = L.marker([this.lat, this.lng], {
            icon: L.icon({
                iconUrl: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
                iconSize: [32, 32],
                iconAnchor: [16, 32]
            })
        }).addTo(layerGroup);

        const popup = new Popup(this.tags);
        const popupContent = popup.createPopupContent();
        marker.bindPopup(popupContent);

        return marker;
    }
}

class Polygon {
    constructor(latlngs) {
        this.latlngs = latlngs;
    }

    addToMap(map, layerGroup) {
        const polygon = L.polygon(this.latlngs).addTo(layerGroup);
        return polygon;
    }

    static calculateBoundingBox(polygon) {
        const latlngs = polygon.getLatLngs()[0];
        const lats = latlngs.map(latlng => latlng.lat);
        const lngs = latlngs.map(latlng => latlng.lng);
        const minLat = Math.min(...lats);
        const maxLat = Math.max(...lats);
        const minLng = Math.min(...lngs);
        const maxLng = Math.max(...lngs);
        const bbox = [[minLat, minLng], [maxLat, maxLng]];

        const bboxLayer = L.rectangle(bbox, {
            color: "#666",
            weight: 1,
            fillOpacity: 0.2
        });

        return bboxLayer;
    }
}

class LeafletMap {
    constructor(mapId, options) {
        const mapContainer = L.DomUtil.get(mapId);
        if (mapContainer._leaflet_id) {
            mapContainer._leaflet_id = null;
        }
        this.map = L.map(mapId, options);
        this.drawnItems = new L.FeatureGroup();
        this.map.addLayer(this.drawnItems);

        this.initDrawControl();
        this.loadLayerData();

        this.map.on(L.Draw.Event.CREATED, async (event) => {
            const layer = event.layer;
            this.drawnItems.addLayer(layer);

            const bboxLayer = Polygon.calculateBoundingBox(layer);
            bboxLayer.addTo(this.drawnItems);

            document.getElementById('coordinates').innerText = `Bounding Box Coordinates: ${bboxLayer.getBounds().toBBoxString()}`;

            await this.fetchAndMarkStores(bboxLayer.getBounds().toBBoxString());

            this.saveLayerData();
        });

        this.map.on(L.Draw.Event.EDITED, async (event) => {
            this.drawnItems.eachLayer(layer => {
                if (layer instanceof L.Rectangle || layer instanceof L.Marker) {
                    this.drawnItems.removeLayer(layer);
                }
            });

            event.layers.eachLayer(async layer => {
                const bboxLayer = Polygon.calculateBoundingBox(layer);
                bboxLayer.addTo(this.drawnItems);
                await this.fetchAndMarkStores(bboxLayer.getBounds().toBBoxString());
            });

            this.saveLayerData();
        });
    }



    

    initDrawControl() {
        const drawControl = new L.Control.Draw({
            edit: {
                featureGroup: this.drawnItems,
            },
            draw: {
                polygon: true,
                marker: false,
                polyline: false,
                circle: false,
                rectangle: false,
                circlemarker: false
            }
        });
        this.map.addControl(drawControl);
    }

    addTileLayer(tileUrl, options) {
        L.tileLayer(tileUrl, options).addTo(this.map);
    }

    setView(lat, lng, zoom) {
        this.map.setView([lat, lng], zoom);
    }

    addMarker(lat, lng, tags) {
        const marker = new Marker(lat, lng, tags);
        marker.createMarker(this.map, this.drawnItems);
    }

    async fetchAndMarkStores(bbox) {
        const [minLat, minLng, maxLat, maxLng] = bbox.split(',').map(Number);

        const overpassQuery = `
            [out:json][timeout:25];
            (
                node["shop"](${minLat},${minLng},${maxLat},${maxLng});
                way["shop"](${minLat},${minLng},${maxLat},${maxLng});
                relation["shop"](${minLat},${minLng},${maxLat},${maxLng});
            );
            out center;
        `;

        const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery)}`;

        console.log("Overpass API URL:", url);

        try {
            const response = await fetch(url);
            const data = await response.json();

            console.log("Overpass API Response:", data);

            if (data.elements.length === 0) {
                console.warn("No shops found in the given bounding box area.");
                return;
            }

            data.elements.forEach(element => {
                let lat, lng;
                if (element.type === 'node') {
                    lat = element.lat;
                    lng = element.lon;
                } else if (element.type === 'way' || element.type === 'relation') {
                    lat = element.center.lat;
                    lng = element.center.lon;
                }

                const marker = new Marker(lat, lng, element.tags);
                marker.createMarker(this.map, this.drawnItems);
            });

        } catch (error) {
            console.error("Error fetching store data:", error);
        }
    }

    saveLayerData() {
        const data = this.drawnItems.toGeoJSON();
        localStorage.setItem(`drawnLayers_${this.map._container.id}`, JSON.stringify(data));
    }

    loadLayerData() {
        const data = localStorage.getItem(`drawnLayers_${this.map._container.id}`);
        if (data) {
            const geoJsonLayer = L.geoJSON(JSON.parse(data), {
                onEachFeature: async (feature, layer) => {
                    this.drawnItems.addLayer(layer);
                    if (layer instanceof L.Polygon) {
                        const bboxLayer = Polygon.calculateBoundingBox(layer);
                        bboxLayer.addTo(this.drawnItems);
                        await this.fetchAndMarkStores(bboxLayer.getBounds().toBBoxString());
                    }
                }
            });
            this.map.addLayer(geoJsonLayer);
        }
    }
}

