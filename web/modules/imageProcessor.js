/**
 * Image Processing Module - Processes and rotates images using canvas
 */

import { getCanvas, returnCanvas, hasInCache, getFromCache, addToCache } from './cache.js';

/**
 * Processes an image, applying rotation if needed
 * @param {string} imgUrl - Image URL
 * @param {string} filename - Filename for cache
 * @returns {Promise<string>} Promise that resolves with processed image URL
 */
function processImage(imgUrl, filename) {
    return new Promise((resolve, reject) => {
        // Check cache first
        if (hasInCache(filename)) {
            const cachedData = getFromCache(filename);
            resolve(cachedData.imageDataUrl);
            return;
        }

        const img = new Image();
        
        img.onload = function () {
            const isPortrait = img.height > img.width;
            let imageDataUrl;

            if (isPortrait) {
                imageDataUrl = rotateImage(img);
            } else {
                imageDataUrl = imgUrl;
            }

            // Store in cache
            addToCache(filename, { imageDataUrl, isRotated: isPortrait });
            
            resolve(imageDataUrl);
        };

        img.onerror = function () {
            reject(new Error(`Failed to load image: ${imgUrl}`));
        };
        
        img.src = imgUrl;
    });
}

/**
 * Rotates an image 90 degrees using canvas
 * @param {HTMLImageElement} img - Image element to be rotated
 * @returns {string} Data URL of rotated image
 */
function rotateImage(img) {
    const canvas = getCanvas();
    canvas.width = img.height;  // Swap width and height
    canvas.height = img.width;
    
    const ctx = canvas.getContext('2d');
    
    // Optimization: disable smoothing for better performance
    ctx.imageSmoothingEnabled = false;
    
    ctx.save();
    // Move to center, rotate and draw image centered
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.drawImage(img, -img.width / 2, -img.height / 2, img.width, img.height);
    ctx.restore();
    
    // Use lower quality for better performance (0.8 instead of default 0.92)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    
    // Return canvas to pool
    returnCanvas(canvas);
    
    return dataUrl;
}

export {
    processImage,
    rotateImage
};
