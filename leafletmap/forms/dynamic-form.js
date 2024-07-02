class DynamicForm {
    constructor(onSave, onCancel) {
        this.onSave = onSave;
        this.onCancel = onCancel;
        this.#addStyles(); // Inject CSS styles
    }

    show(fields) {
        // Create overlay
        this.overlay = document.createElement('div');
        this.overlay.className = 'overlay';
        document.body.appendChild(this.overlay);

        // Create form container
        this.form = document.createElement('div');
        this.form.className = 'dynamic-form';

        fields.forEach(field => {
            // Create label
            const label = document.createElement('label');
            label.innerText = field.label;
            this.form.appendChild(label);

            // Create input field
            const input = document.createElement('input');
            input.type = 'text';
            input.name = field.field;
            input.placeholder = field.placeholder;
            this.form.appendChild(input);
        });

        // Create save button
        const saveButton = document.createElement('button');
        saveButton.innerText = 'Save';
        saveButton.addEventListener('click', () => {
            const formData = {};
            fields.forEach(field => {
                formData[field.field] = this.form.querySelector(`[name=${field.field}]`).value;
            });
            this.onSave(formData);
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

                .dynamic-form label {
                    display: block;
                    margin-bottom: 5px;
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
                    background: rgba(0, 0, 0, 0.5);
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