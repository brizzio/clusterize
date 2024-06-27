class StoreMarker{
    constructor(mapContext, latlng, options = {}) {
        this.mapContext = mapContext;
        this.latlng = latlng;
        this.options = options;
        this.id = options.id
        this.marker = this.draw()
        
        this.marker.on('contextmenu', (event) => this.showContextMenu(event));

        this.marker.on('click', () => {
            this.mapContext.selectedMarker = this;
            //this.removeContextMenu();
        });
    }

    draw(){
        const id = this.options.id
        const type = this.options.type
        const info = this.options.info
        const marker = L.marker(this.latlng, {
            icon: L.icon({
                iconUrl: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
                iconSize: [32, 32],
                iconAnchor: [16, 32]
            })
        }).addTo(this.mapContext.map);

        // Create popup content
        const popupContent = Object.keys(info).map(tag => `${tag}: ${info[tag]}`).join('<br>');

       // Create a popup with options
       const popupOptions = {
        autoPan: true,
        offset: L.point(0, -16), // Adjust the value to move the popup above the marker
        autoPanPaddingTopLeft: L.point(0, 50)
    };

        // Bind popup to the marker
        marker.bindPopup(popupContent, popupOptions);

        return marker

    }

    showContextMenu(event) {
        L.DomEvent.stopPropagation(event);
        
        let left = `${event.containerPoint.x}px`;
        let top = `${event.containerPoint.y}px`;

        this.createMarkerContextMenu(top, left)

        
        this.mapContext.contextMenuLatLng = event.latlng;
        this.mapContext.selectedMarker = this;
    }

    createMarkerContextMenu(top, left) {
        // Create the context menu div
        const contextMenu = document.createElement('div');
        contextMenu.id = this.id;
        contextMenu.className = 'context-menu';
        
        // Create the unordered list
        const ul = document.createElement('ul');
        
        // Create the list items
        const editMarker = document.createElement('li');
        editMarker.id = 'edit-marker';
        editMarker.innerText = 'Edit Marker';
        
        const deleteMarker = document.createElement('li');
        deleteMarker.id = 'delete-marker';
        deleteMarker.innerText = 'Delete Marker';
        
        // Append list items to the unordered list
        ul.appendChild(editMarker);
        ul.appendChild(deleteMarker);
        
        // Append the unordered list to the context menu div
        contextMenu.appendChild(ul);

        //position element
        contextMenu.style.left = left;
        contextMenu.style.top = top;
        contextMenu.style.display = 'block';
        
        // Append the context menu div to the body
        document.body.appendChild(contextMenu);

        // Add event listener to the delete-marker list item
        deleteMarker.addEventListener('click', () => {
            // Define the function to execute when delete-marker is clicked
            console.log('Delete marker clicked');
            //this.remove()
            //remove menu
            this.removeContextMenu()
            // Call the deleteMarker function from your MapWithContextMenu class
            if (window.mapWithContextMenuInstance) {
                window.mapWithContextMenuInstance.deleteMarker();
            }
        });
    }

    edit() {
        // Implement marker editing logic here
    }

    removeContextMenu() {
        const element = document.getElementById(this.id);
        if (element) {
            element.remove();
        } else {
            console.warn(`Element with id "${this.id}" not found.`);
        }
    }

    remove() {
        this.mapContext.map.removeLayer(this.marker);
        this.mapContext.removeMarkerFromState(this);
        this.mapContext.saveMapState();
    }
}