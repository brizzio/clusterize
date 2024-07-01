document.addEventListener('DOMContentLoaded', function() {

    const geo = new Geo();
    geo.getCurrentPosition()
    .then((position) => {
        console.log('User position:', position);
        // Use the position as a Leaflet LatLng object
        // Make mapInstance global
        retailMap(position);
        
    })
    .catch((error) => {
        console.error('Error getting position:', error);
    });

});


const retailMap = (latlngs)=>{

    const retailMap = new Map('retailMap', latlngs)

    // Define buttons and actions
    const buttons = [
        { text: 'Button 1', onClick: () => alert('Button 1 clicked') },
        { text: 'Button 2', onClick: () => alert('Button 2 clicked') },
        { text: 'Button 3', onClick: () => alert('Button 3 clicked') },
        { text: 'Button 4', onClick: () => alert('Button 4 clicked') }
    ];

    // Add the custom control to the map
    retailMap.map.addControl(new CustomControl(buttons, { position: 'topleft' }));

    window.mapInstance = retailMap

}




function generateUniqueId(identifier = 'id') {
    const timestamp = Date.now(); // Current timestamp in milliseconds
    const randomNum = Math.floor(Math.random() * 1000000); // Random number between 0 and 999999
    return `${identifier}-${timestamp}-${randomNum}`; // Concatenate to form the unique ID
}

function deleteKeysFromObject(obj, keys) {
    keys.forEach(key => delete obj[key]);
}

function toPlainObject(instance) {
    if (instance === null || typeof instance !== 'object') {
        return instance;
    }

    if (Array.isArray(instance)) {
        return instance.map(toPlainObject);
    }

    const plainObject = {};

    for (const key in instance) {
        if (instance.hasOwnProperty(key)) {
            plainObject[key] = toPlainObject(instance[key]);
        }
    }

    // Optionally handle prototype properties
    // for (const key of Object.getOwnPropertyNames(Object.getPrototypeOf(instance))) {
    //     if (key !== 'constructor') {
    //         plainObject[key] = toPlainObject(instance[key]);
    //     }
    // }

    return plainObject;
}



