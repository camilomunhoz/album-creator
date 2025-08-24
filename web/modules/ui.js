/**
 * UI Module - Manages user interface functionality
 */

import { clearImageCache } from './cache.js';
import { refreshOrder } from './page.js';

/**
 * Toggles visibility of cut marks
 */
function toggleCutMarks() {
    const $album = $('.album');
    const currentState = $album.attr('data-cut-preview');
    const newState = currentState === 'true' ? 'false' : 'true';
    
    $album.attr('data-cut-preview', newState);
    
    // Updates button text
    const $button = $('.btn-toggle-marks');
    if (newState === 'true') {
        $button.text('Hide Cut Marks');
    } else {
        $button.text('Show Cut Marks');
    }
}

/**
 * Initializes page sorting functionality
 */
function initializeSortable() {
    $('.album').sortable({
        items: '.page-wrapper',
        axis: 'y',
        tolerance: 'pointer',
        placeholder: 'sortable-placeholder',
        scroll: true,
        scrollSensitivity: 200,
        scrollSpeed: 20,
        helper: 'clone',
        opacity: 0.8,
        
        start: function(event, ui) {
            ui.helper.addClass('sortable-being-dragged');
            ui.placeholder.height(0);
        },
        
        stop: function(event, ui) {
            ui.item.removeClass('sortable-being-dragged');
        },

        update: function() {
            refreshOrder();
        }
    });
}

/**
 * Handles print event
 */
function handlePrint() {
    window.print();
}

export {
    toggleCutMarks,
    initializeSortable,
    handlePrint,
    clearImageCache
};
