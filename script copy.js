document.addEventListener('DOMContentLoaded', () => {
    // Initialize the map
    const map = new LeafletMap('map', {
        center: [-23.561, -46.654],
        zoom: 13
    });
   

    // Add OpenStreetMap tile layer
    map.addTileLayer();

    map.addMarker(-23.561, -46.654, 'A pretty CSS3 popup.<br> Easily customizable.');
   

    // Initialize the FeatureGroup to store drawn layers
    const drawnItems = new L.FeatureGroup();
    map.addLayer();

    // Initialize the draw control and pass it the FeatureGroup of editable layers
    const drawControl = new L.Control.Draw({
        edit: {
            featureGroup: drawnItems,
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
    map.addControl(drawControl);

    // Function to calculate bounding box and draw it on the map
    function addBoundingBox(polygon) {
        const latlngs = polygon.getLatLngs()[0];

        // Calculate bounding box coordinates
        const lats = latlngs.map(latlng => latlng.lat);
        const lngs = latlngs.map(latlng => latlng.lng);
        const minLat = Math.min(...lats);
        const maxLat = Math.max(...lats);
        const minLng = Math.min(...lngs);
        const maxLng = Math.max(...lngs);
        const bbox = [[minLat, minLng], [maxLat, maxLng]];

        // Draw the bounding box on the map
        const bboxLayer = L.rectangle(bbox, {
            color: "#666",
            weight: 1,
            fillOpacity: 0.2
        }).addTo(drawnItems);

        // Return bounding box coordinates
        return bbox;
    }

    // Function to fetch stores within a bounding box and add them to the map
    async function fetchAndMarkStores(bbox) {
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

        const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery)}`;

        console.log("Overpass API URL:", url); // Debugging output

        try {
            const response = await fetch(url);
            const data = await response.json();

            console.log("Overpass API Response:", data); // Debugging output

            if (data.elements.length === 0) {
                console.warn("No shops found in the given bounding box area.");
                return;
            }

            const storeMarkers = [];
            data.elements.forEach(element => {
                let lat, lng;
                if (element.type === 'node') {
                    lat = element.lat;
                    lng = element.lon;
                } else if (element.type === 'way' || element.type === 'relation') {
                    lat = element.center.lat;
                    lng = element.center.lon;
                }

                const marker = L.marker([lat, lng], {
                    icon: L.icon({
                        iconUrl: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
                        iconSize: [32, 32],
                        iconAnchor: [16, 32]
                    })
                }).addTo(drawnItems);

                // Create popup content
                const popupContent = Object.keys(element.tags).map(tag => `${tag}: ${element.tags[tag]}`).join('<br>');

                // Bind popup to the marker
                marker.bindPopup(popupContent);

                storeMarkers.push(marker);
            });

            return storeMarkers;
        } catch (error) {
            console.error("Error fetching store data:", error);
        }
    }

    // Function to save the layer data to local storage
    function saveLayerData(featureGroup) {
        const data = featureGroup.toGeoJSON();
        localStorage.setItem('drawnLayers', JSON.stringify(data));
    }

    // Function to load the layer data from local storage
    function loadLayerData() {
        const data = localStorage.getItem('drawnLayers');
        if (data) {
            const geoJsonLayer = L.geoJSON(JSON.parse(data), {
                onEachFeature: async function (feature, layer) {
                    drawnItems.addLayer(layer);
                    if (layer instanceof L.Polygon) {
                        const bbox = addBoundingBox(layer);
                        await fetchAndMarkStores(bbox);
                    }
                }
            });
            map.addLayer(geoJsonLayer);
        }
    }

    // Handle the creation of a new polygon
    map.on(L.Draw.Event.CREATED, async function (event) {
        const layer = event.layer;
        drawnItems.addLayer(layer);

        // Calculate and draw bounding box
        const bbox = addBoundingBox(layer);

        // Display the bounding box coordinates
        document.getElementById('coordinates').innerText = `Bounding Box Coordinates: ${bbox}`;

        // Fetch and mark stores within the bounding box
        await fetchAndMarkStores(bbox);

        // Save the layer data to local storage as GeoJSON
        saveLayerData(drawnItems);
    });

    // Handle the update of an existing polygon
    map.on(L.Draw.Event.EDITED, async function (event) {
        // Clear all bounding boxes and store markers before recalculating
        drawnItems.eachLayer(layer => {
            if (layer instanceof L.Rectangle || layer instanceof L.Marker) {
                drawnItems.removeLayer(layer);
            }
        });

        // Recalculate bounding boxes and fetch stores for all polygons
        event.layers.eachLayer(async layer => {
            const bbox = addBoundingBox(layer);
            await fetchAndMarkStores(bbox);
        });

        // Save updated layer data
        saveLayerData(drawnItems);
    });

    // Load existing layer data on page load
    loadLayerData();
});
