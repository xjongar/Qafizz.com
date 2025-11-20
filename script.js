// Notes App with Google Keep-like features
class NotesApp {
    constructor() {
        this.notes = JSON.parse(localStorage.getItem('notes')) || [];
        this.theme = localStorage.getItem('theme') || 'light';
        this.currentColor = 'default';
        this.searchQuery = '';

        this.container = document.getElementById('notes-container');
        this.addButton = document.getElementById('add-note');
        this.themeToggle = document.getElementById('theme-toggle');
        this.searchInput = document.getElementById('search-input');

        this.modal = document.getElementById('note-modal');
        this.modalTitle = document.getElementById('modal-title');
        this.modalContent = document.getElementById('modal-content');
        this.modalClose = document.getElementById('modal-close');
        this.modalSave = document.getElementById('modal-save');
        this.modalColors = document.getElementById('modal-colors');
        this.modalOverlay = this.modal.querySelector('.modal-overlay');

        this.colors = ['default', 'red', 'orange', 'yellow', 'green', 'teal', 'blue', 'purple', 'pink'];

        this.addButton.addEventListener('click', () => this.openModal());
        this.themeToggle.addEventListener('click', () => this.toggleTheme());
        this.searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
        this.modalClose.addEventListener('click', () => this.closeModal());
        this.modalOverlay.addEventListener('click', () => this.closeModal());
        this.modalSave.addEventListener('click', () => this.saveFromModal());

        this.applyTheme();
        this.renderModalColors();
        this.render();
    }

    toggleTheme() {
        this.theme = this.theme === 'light' ? 'dark' : 'light';
        localStorage.setItem('theme', this.theme);
        this.applyTheme();
        this.renderModalColors(); // Update modal colors
    }

    applyTheme() {
        const body = document.body;
        const icon = this.themeToggle.querySelector('.theme-icon');

        if (this.theme === 'dark') {
            body.classList.add('dark-mode');
            icon.textContent = '🌙';
        } else {
            body.classList.remove('dark-mode');
            icon.textContent = '☀️';
        }
    }

    handleSearch(query) {
        this.searchQuery = query.toLowerCase();
        this.render();
    }

    filterNotes() {
        if (!this.searchQuery) return this.notes;

        return this.notes.filter(note => {
            const title = note.title.toLowerCase();
            const content = note.content.toLowerCase();
            return title.includes(this.searchQuery) || content.includes(this.searchQuery);
        });
    }

    openModal() {
        this.currentColor = 'default';
        this.modalTitle.value = '';
        this.modalContent.value = '';
        this.modal.classList.add('active');
        this.renderModalColors();
        this.modalTitle.focus();
    }

    closeModal() {
        this.modal.classList.remove('active');
    }

    renderModalColors() {
        const colorStyles = {
            'default': this.theme === 'dark' ? '#292a2d' : '#fff',
            'red': this.theme === 'dark' ? '#5c2b29' : '#f28b82',
            'orange': this.theme === 'dark' ? '#614a19' : '#fbbc04',
            'yellow': this.theme === 'dark' ? '#635d19' : '#fff475',
            'green': this.theme === 'dark' ? '#345920' : '#ccff90',
            'teal': this.theme === 'dark' ? '#16504b' : '#a7ffeb',
            'blue': this.theme === 'dark' ? '#2d555e' : '#cbf0f8',
            'purple': this.theme === 'dark' ? '#472e5b' : '#d7aefb',
            'pink': this.theme === 'dark' ? '#5b2245' : '#fdcfe8'
        };

        this.modalColors.innerHTML = this.colors.map(color => {
            const activeClass = color === this.currentColor ? 'active' : '';
            const borderStyle = color === 'default' ? 'border: 2px solid var(--border-color);' : '';
            return `<button
                class="modal-color-btn ${activeClass}"
                data-color="${color}"
                style="background: ${colorStyles[color]}; ${borderStyle}"
                title="${color}"
            ></button>`;
        }).join('');

        // Add event listeners to color buttons
        this.modalColors.querySelectorAll('.modal-color-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.currentColor = e.target.dataset.color;
                this.renderModalColors();
            });
        });
    }

    saveFromModal() {
        const title = this.modalTitle.value.trim();
        const content = this.modalContent.value.trim();

        if (!title && !content) {
            this.closeModal();
            return;
        }

        const note = {
            id: Date.now(),
            title: title,
            content: content,
            color: this.currentColor,
            timestamp: new Date().toISOString()
        };

        this.notes.unshift(note);
        this.saveNotes();
        this.closeModal();
        this.render();
    }

    addNote() {
        const note = {
            id: Date.now(),
            title: '',
            content: '',
            color: 'default',
            timestamp: new Date().toISOString()
        };

        this.notes.unshift(note);
        this.saveNotes();
        this.render();
    }

    deleteNote(id) {
        this.notes = this.notes.filter(note => note.id !== id);
        this.saveNotes();
        this.render();
    }

    updateNote(id, field, value) {
        const note = this.notes.find(note => note.id === id);
        if (note) {
            note[field] = value;
            note.timestamp = new Date().toISOString();
            this.saveNotes();
        }
    }

    changeNoteColor(id, color) {
        this.updateNote(id, 'color', color);
        this.render();
    }

    saveNotes() {
        localStorage.setItem('notes', JSON.stringify(this.notes));
    }

    formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;

        return date.toLocaleDateString();
    }

    createColorPicker(noteId, currentColor) {
        const colorPalette = this.colors.map(color => {
            const colorStyles = {
                'default': this.theme === 'dark' ? '#292a2d' : '#fff',
                'red': this.theme === 'dark' ? '#5c2b29' : '#f28b82',
                'orange': this.theme === 'dark' ? '#614a19' : '#fbbc04',
                'yellow': this.theme === 'dark' ? '#635d19' : '#fff475',
                'green': this.theme === 'dark' ? '#345920' : '#ccff90',
                'teal': this.theme === 'dark' ? '#16504b' : '#a7ffeb',
                'blue': this.theme === 'dark' ? '#2d555e' : '#cbf0f8',
                'purple': this.theme === 'dark' ? '#472e5b' : '#d7aefb',
                'pink': this.theme === 'dark' ? '#5b2245' : '#fdcfe8'
            };

            const activeClass = color === currentColor ? 'active' : '';
            return `<button
                class="color-btn ${activeClass}"
                data-color="${color}"
                data-note-id="${noteId}"
                style="background: ${colorStyles[color]}; ${color === 'default' ? 'border: 2px solid var(--border-color);' : ''}"
                title="${color}"
            ></button>`;
        }).join('');

        return `<div class="note-actions">${colorPalette}</div>`;
    }

    createNoteElement(note) {
        const noteEl = document.createElement('div');
        noteEl.className = 'note';
        noteEl.setAttribute('data-color', note.color);
        noteEl.innerHTML = `
            <div class="note-header">
                <textarea
                    class="note-title"
                    placeholder="Title"
                    rows="1"
                >${note.title}</textarea>
                <button class="btn-delete" data-id="${note.id}">×</button>
            </div>
            <textarea
                class="note-content"
                placeholder="Take a note..."
            >${note.content}</textarea>
            ${this.createColorPicker(note.id, note.color)}
            <div class="note-timestamp">${this.formatTimestamp(note.timestamp)}</div>
        `;

        const titleInput = noteEl.querySelector('.note-title');
        const contentInput = noteEl.querySelector('.note-content');
        const deleteBtn = noteEl.querySelector('.btn-delete');
        const colorButtons = noteEl.querySelectorAll('.color-btn');

        // Auto-resize title
        titleInput.addEventListener('input', (e) => {
            e.target.style.height = 'auto';
            e.target.style.height = e.target.scrollHeight + 'px';
            this.updateNote(note.id, 'title', e.target.value);
        });

        // Update content
        contentInput.addEventListener('input', (e) => {
            this.updateNote(note.id, 'content', e.target.value);
        });

        // Delete note
        deleteBtn.addEventListener('click', () => {
            this.deleteNote(note.id);
        });

        // Color picker
        colorButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const color = e.target.dataset.color;
                const noteId = parseInt(e.target.dataset.noteId);
                this.changeNoteColor(noteId, color);
            });
        });

        // Trigger resize for existing title
        titleInput.style.height = 'auto';
        titleInput.style.height = titleInput.scrollHeight + 'px';

        return noteEl;
    }

    render() {
        this.container.innerHTML = '';
        const filteredNotes = this.filterNotes();

        if (filteredNotes.length === 0) {
            const message = this.searchQuery
                ? `<h2>No notes found</h2><p>Try a different search term</p>`
                : `<h2>No notes yet</h2><p>Click "+ New Note" to get started</p>`;

            this.container.innerHTML = `<div class="empty-state">${message}</div>`;
            return;
        }

        filteredNotes.forEach(note => {
            const noteEl = this.createNoteElement(note);
            this.container.appendChild(noteEl);
        });
    }
}

// Initialize app
new NotesApp();
