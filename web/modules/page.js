/**
 * Page Module - Manages album page creation and manipulation
 */

import { processImage } from './imageProcessor.js';

/**
 * Creates a new album page with processed image
 * @param {Object} photo - Object containing photo data
 * @param {string} photo.filename - Image filename
 * @param {number} photo.order - Page order
 * @param {string} photo.caption - Image caption
 * @param {string} photo.id - Unique page ID
 * @returns {Promise<jQuery|null>} Promise that resolves with jQuery page element or null on error
 */
async function createPage(photo) {
    try {
        const imgUrl = `/photos/${photo.filename}`;
        const imageDataUrl = await processImage(imgUrl, photo.filename);
        
        const cutmarks = Array(4).fill('<div class="cutmark"></div>').join('');
        const punchmarks = Array(10).fill('<i></i>').join('');
        
        return createPageElement(photo, imageDataUrl, cutmarks, punchmarks);
    } catch (error) {
        console.error('Error creating page:', error);
        return null;
    }
}

/**
 * Creates the page DOM element
 * @param {Object} photo - Photo data
 * @param {string} imageDataUrl - Processed image URL
 * @param {string} cutmarks - Cutmarks HTML
 * @param {string} punchmarks - Punchmarks HTML
 * @returns {jQuery} jQuery page element
 */
function createPageElement(photo, imageDataUrl, cutmarks, punchmarks) {
    const pageHtml = `
        <div class="page-wrapper" data-order="${photo.order}" data-id="${photo.id || ''}">
            <div class="page">
                ${cutmarks}
                <div class="punchmarks">${punchmarks}</div>
                <div class="description">
                    <div class="content">
                        <div class="text">
                            <p>${photo.caption || ''}</p>
                        </div>
                    </div>
                </div>
            </div>
            <div class="page-bar">
                <div>
                    <span>Page ${photo.order} - ${photo.filename}</span>
                </div>
                <div class="actions">
                    <div class="action btn-delete">Delete</div>
                </div>
            </div>
        </div>
    `;

    const $page = $(pageHtml);
    
    // Create image div with background-image instead of img element
    const $imageDiv = $('<div>', { 
        class: 'page-image',
        'data-filename': photo.filename
    });
    
    // Set background image with proper CSS
    $imageDiv.css({
        'background-image': `url(${imageDataUrl})`,
        'background-size': 'cover',
        'background-position': 'center',
        'background-repeat': 'no-repeat',
        'width': '100%',
        'height': '100%'
    });
    
    $page.find('.page').append($imageDiv);
    
    // Add event listeners
    attachPageEventListeners($page);
    
    return $page;
}

/**
 * Adds event listeners to page elements
 * @param {jQuery} $page - jQuery page element
 */
function attachPageEventListeners($page) {
    $page.find('.btn-delete').on('click', function () {
        $page.remove();
        refreshOrder();
    });

    $page.find('.content').on('click', function (event) {
        window.mirrorWithEditor(event, window.quill);
    });
}

/**
 * Updates page order in album
 */
function refreshOrder() {
    $('.album .page-wrapper:not(.sortable-being-dragged)').each(function(index) {
        $(this).attr('data-order', index + 1);
        const filename = $(this).find('.page-image').attr('data-filename') || '<unknown>';
        $(this).find('.page-bar span').text(`Page ${index + 1} - ${filename}`);
    });
}

export {
    createPage,
    createPageElement,
    refreshOrder
};
