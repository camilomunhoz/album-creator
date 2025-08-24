/**
 * Gallery Module - Manages available image gallery
 */

import { createPage } from './page.js';

/**
 * Loads and displays available image gallery
 */
function loadGallery() {
    $.getJSON('/api/gallery', function (data) {
        const $gallery = $('.gallery');
        $gallery.empty();

        data.forEach(function (image) {
            const imgUrl = `/photos/${image}`;
            const $img = $('<img>', { src: imgUrl, alt: image, class: 'gallery-image' });
            
            $img.on('click', async function () {
                await addImageToAlbum(image);
            });
            
            $gallery.append($img);
        });
    }).fail(function() {
        console.error('Error loading gallery');
    });
}

/**
 * Adds an image from gallery to album
 * @param {string} imageName - Image filename
 */
async function addImageToAlbum(imageName) {
    try {
        const $page = await createPage({
            filename: imageName,
            order: $('.page').length + 1,
            caption: '',
            id: generateId()
        });
        
        if ($page) {
            $('.album').append($page);
        }
    } catch (error) {
        console.error('Error adding image to album:', error);
    }
}

/**
 * Generates unique ID for new pages
 * @returns {string} Unique 8-character ID
 */
function generateId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let id = '';
    for (let i = 0; i < 8; i++) {
        id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
}

export {
    loadGallery,
    addImageToAlbum,
    generateId
};
