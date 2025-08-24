/**
 * Editor Module - Manages text editor for captions
 */

/**
 * Initializes Quill editor
 * @returns {Quill} Quill editor instance
 */
function initializeEditor() {
    return new Quill('#caption-editor', {
        theme: 'snow'
    });
}

/**
 * Connects editor with specific page content
 * @param {Event} event - Click event
 * @param {Quill} quill - Quill editor instance
 */
function mirrorWithEditor(event, quill) {
    const $target = $(event.currentTarget);
    const content = $target.find('.text').html() || '';
    quill.root.innerHTML = content.trim();

    quill.off('text-change');
    quill.on('text-change', function () {
        $target.find('.text').html(quill.root.innerHTML);
    });

    quill.focus();
    setTimeout(_ => quill.setSelection(quill.getLength(), 0), 0);
}

export {
    initializeEditor,
    mirrorWithEditor
};
