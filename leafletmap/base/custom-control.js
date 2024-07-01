class CustomControl extends L.Control {
    constructor(buttons, options = {}) {
        super(options);
        this.buttons = buttons;
    }

    onAdd(map) {
        var container = L.DomUtil.create('div', 'custom-control p-4 bg-white bg-opacity-40 rounded shadow-lg');

        // Prevent clicks on the control from propagating to the map
        L.DomEvent.disableClickPropagation(container);

        // Create the buttons
        this.buttons.forEach(button => {
            var btn = L.DomUtil.create('button', 'block w-full mb-2 p-2 bg-blue-500 text-white rounded hover:bg-blue-600', container);
            btn.innerHTML = button.text;
            btn.onclick = button.onClick;
        });

        return container;
    }
}