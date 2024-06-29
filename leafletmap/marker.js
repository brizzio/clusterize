class Marker {
    constructor(mapContext, latlng, id, name='', iconUrl, options = {}) {
        this.mapContext = mapContext;
        this.latlng = latlng || null;
        this.options = options;
        this.id = id || Date.now();
        this.name = name  // Default name if not provided
        this.marker = null
               
        this.popupContent= this.id;
        this.iconUrl=iconUrl || 'https://maps.google.com/mapfiles/ms/icons/yellow-dot.png';

        this.addContextMenuStyles(); // inject the CSS styles
        this.create()
       
    }

    create() {

        if(!this.latlng) return

        console.log('creating marker', !this.latlng, this.latlng)
       
        const icon = this.iconUrl 
        
        const marker = L.marker(this.latlng, {
            icon: L.icon({
                iconUrl: icon,
                iconSize: [32, 32],
                iconAnchor: [16, 32]
            })
        })

        // Create popup content
        //const popupContent = Object.keys(info).map(tag => `${tag}: ${info[tag]}`).join('<br>');
        //const popupContent = this.generatePopupContent();

       

        this.marker = marker;

        this.marker.on('contextmenu', (event) => {
            this.mapContext.hideContextMenus();
            this.showContextMenu(event);
        });

        this.marker.on('click', () => {
            this.mapContext.selectedMarker = this;
            this.removeContextMenu();
        });

        
    }

    generatePopupContent() {
        return this.name?this.name:'pop up content'
    } 

    draw() {

        console.log('drasw marker', !this.marker, this)
        if(!this.marker) return 

         // Create a popup with options
         const popupOptions = {
            autoPan: true,
            offset: L.point(0, -16), // Adjust the value to move the popup above the marker
            autoPanPaddingTopLeft: L.point(0, 50)
        };

        // Bind popup to the marker
        this.marker.bindPopup(this.popupContent, popupOptions);

        //if(this.marker) this.mapContext.map.removeLayer(this.marker);
        
        this.marker.addTo(this.mapContext.map);

        
    }

    showContextMenu(event) {
        L.DomEvent.stopPropagation(event);

        let left = `${event.containerPoint.x}px`;
        let top = `${event.containerPoint.y}px`;

        this.createMarkerContextMenu(top, left);

        this.mapContext.contextMenuLatLng = event.latlng;
        this.mapContext.selectedMarker = this;
    }

    createMarkerContextMenu(top, left) {
        // Create the context menu div
        const contextMenu = document.createElement('div');
        contextMenu.id = this.id;
        contextMenu.className = 'marker-context-menu';

        // Create the unordered list
        const ul = document.createElement('ul');

        // Create the list items
        const editMarker = document.createElement('li');
        editMarker.id = 'edit-marker';
        editMarker.innerText = 'Edit Marker';

        const deleteMarker = document.createElement('li');
        deleteMarker.id = 'delete-marker';
        deleteMarker.innerText = 'Delete Marker';

        const selectMarker = document.createElement('li');
        selectMarker.id = 'select-marker';
        selectMarker.innerText = 'Select Marker';

        // Append list items to the unordered list
        ul.appendChild(editMarker);
        ul.appendChild(deleteMarker);
        ul.appendChild(selectMarker);

        // Append the unordered list to the context menu div
        contextMenu.appendChild(ul);

        // Position element
        contextMenu.style.left = left;
        contextMenu.style.top = top;
        contextMenu.style.display = 'block';

        // Append the context menu div to the body
        document.body.appendChild(contextMenu);

        // Add event listener to the edit-marker list item
        editMarker.addEventListener('click', () => {
            console.log('Edit marker clicked');
            this.showEditForm(); // Show the edit form when edit-marker is clicked

            // Remove menu
            this.removeContextMenu();
        });

        // Add event listener to the delete-marker list item
        deleteMarker.addEventListener('click', () => {
            console.log('Delete marker clicked');
            this.remove();

            // Remove menu
            this.removeContextMenu();
        });

        // Add event listener to the select-marker list item
        selectMarker.addEventListener('click', () => {
            console.log('Select marker clicked');
            this.mapContext.selectedMarker = this;
            console.log('selectedMarker', this)
            // Remove menu
            this.removeContextMenu();
        });
    }

    showEditForm() {
        const editForm = new EditForm(
            (name) => {
                this.updateName(name);
                this.draw()
            },
            () => {
                console.log('Edit form canceled');
            }
        );

        editForm.show(this.name);
    }

    updateName(name) {
        this.name = name;
        this.mapContext.updateMapState();
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

    addContextMenuStyles() {
        if (!document.getElementById('context-menu-styles')) {
            const style = document.createElement('style');
            style.id = 'context-menu-styles';
            style.innerHTML = `
                .marker-context-menu {
                    position: absolute;
                    display: none;
                    background: white;
                    border: 1px solid #ccc;
                    z-index: 1000;
                }

                .marker-context-menu ul {
                    list-style: none;
                    margin: 0;
                    padding: 0;
                }

                .marker-context-menu li {
                    padding: 8px 12px;
                    cursor: pointer;
                }

                .marker-context-menu li:hover {
                    background: #eee;
                }
            `;
            document.head.appendChild(style);
        }
    }
}
