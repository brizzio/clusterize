class DynamicForm {
    constructor(onSave, onCancel) {
        this.onSave = onSave;
        this.onCancel = onCancel;
        this.#addStyles(); // Inject CSS styles
    }

    show(currentName) {
        // Create overlay
        this.overlay = document.createElement('div');
        this.overlay.className = 'overlay';
        document.body.appendChild(this.overlay);

        // Create form container
        this.form = document.createElement('div');
        this.form.className = 'dynamic-form';

        // Create input field
        this.input = document.createElement('input');
        this.input.type = 'text';
        this.input.value = currentName;
        this.form.appendChild(this.input);

        // Create save button
        const saveButton = document.createElement('button');
        saveButton.innerText = 'Save';
        saveButton.addEventListener('click', () => {
            this.onSave(this.input.value);
            this.hide();
        });
        this.form.appendChild(saveButton);

        // Create cancel button
        const cancelButton = document.createElement('button');
        cancelButton.innerText = 'Cancel';
        cancelButton.addEventListener('click', () => {
            this.onCancel();
            this.hide();
        });
        this.form.appendChild(cancelButton);

        document.body.appendChild(this.form);
    }

    hide() {
        if (this.form) {
            this.form.remove();
        }
        if (this.overlay) {
            this.overlay.remove();
        }
        this.#removeStyles();
    }

    #addStyles() {
        if (!document.getElementById('dynamic-form-styles')) {
            const style = document.createElement('style');
            style.id = 'dynamic-form-styles';
            style.innerHTML = `
                .dynamic-form {
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: white;
                    border: 1px solid #ccc;
                    padding: 20px;
                    z-index: 1001;
                }

                .dynamic-form input {
                    display: block;
                    margin-bottom: 10px;
                    padding: 5px;
                    width: 100%;
                    box-sizing: border-box;
                }

                .dynamic-form button {
                    margin-right: 10px;
                    padding: 5px 10px;
                }

                .overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.2);
                    z-index: 1000;
                }
            `;
            document.head.appendChild(style);
        }
    }

    #removeStyles() {
        const style = document.getElementById('dynamic-form-styles');
        if (style) {
            style.remove();
        }
    }
}
