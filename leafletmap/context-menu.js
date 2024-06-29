class ContextMenu {
    constructor(items = []) {
        this.items = items;
        this.contextMenuId = 'context-menu-' + Date.now();
        this.styleElementId = 'context-menu-styles-' + Date.now();
        this.addContextMenuStyles();
    }

    addContextMenuStyles() {
        if (!document.getElementById(this.styleElementId)) {
            const style = document.createElement('style');
            style.id = this.styleElementId;
            style.innerHTML = `
                .context-menu {
                    position: absolute;
                    display: none;
                    background: white;
                    border: 1px solid #ccc;
                    z-index: 1000;
                }

                .context-menu ul {
                    list-style: none;
                    margin: 0;
                    padding: 0;
                }

                .context-menu li {
                    padding: 8px 12px;
                    cursor: pointer;
                }

                .context-menu li:hover {
                    background: #eee;
                }
            `;
            document.head.appendChild(style);
        }
    }

    createContextMenu(top, left) {
        // Create the context menu div
        const contextMenu = document.createElement('div');
        contextMenu.id = this.contextMenuId;
        contextMenu.className = 'context-menu';
        
        // Create the unordered list
        const ul = document.createElement('ul');
        
        // Create the list items
        this.items.forEach(item => {
            const li = document.createElement('li');
            li.id = item.id;
            li.innerText = item.text;
            li.addEventListener('click', item.onClick);
            ul.appendChild(li);
        });

        // Append the unordered list to the context menu div
        contextMenu.appendChild(ul);

        // Position element
        contextMenu.style.left = left;
        contextMenu.style.top = top;
        contextMenu.style.display = 'block';
        
        // Append the context menu div to the body
        document.body.appendChild(contextMenu);
    }

    removeContextMenu() {
        const element = document.getElementById(this.contextMenuId);
        if (element) {
            element.remove();
        }
        this.removeContextMenuStyles();
    }

    removeContextMenuStyles() {
        const styleElement = document.getElementById(this.styleElementId);
        if (styleElement) {
            styleElement.remove();
        }
    }
}
