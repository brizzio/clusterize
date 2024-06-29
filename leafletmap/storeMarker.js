class StoreMarker extends Marker {
    constructor(mapContext, latlng, id, name, options, info, type) {
        const iconUrl='https://maps.google.com/mapfiles/ms/icons/pink-dot.png'
        super(mapContext, latlng,id, name, iconUrl,options);
        
        this.type = 'store' 
        this.id = id
        this.shop = type
        this.info = info
        this.name = name || 'Store Name'
        this.popupContent = this.generatePopupContent()

        this.draw()
        
    }
   
    static init(map, data){
        const {latlng,id,name,info,options,type} = data
        console.log('init store', data)
        let store = new StoreMarker(map, latlng,id,name,options,info,type)
        console.log('init store METOD END', store)
    }

    

    generatePopupContent() {
        console.log('calling store marker popup', this.info)
        // Generate HTML content for the popup from the info object
        let header = `<strong>Store Id:</strong> ${this.id}<br><strong>Store Name:</strong> ${this.name}<br>`
        let data = Object.keys(this.info).map(tag => `<strong>${tag}:</strong> ${this.info[tag]}`).join('<br>');
        return header + data
    }

      
}