/**
 * Image Processing Module - Processes and rotates images using canvas
 */

import { getCanvas, returnCanvas, hasInCache, getFromCache, addToCache } from './cache.js';

/**
 * Processes an image, applying rotation if needed
 * @param {string} imgUrl - Image URL
 * @param {string} filename - Filename for cache
 * @returns {Promise<Object>} Promise that resolves with processed image data
 */
function processImage(imgUrl, filename) {
    return new Promise((resolve, reject) => {
        // Check cache first
        if (hasInCache(filename)) {
            const cachedData = getFromCache(filename);
            resolve({
                imageDataUrl: cachedData.imageDataUrl,
                originalOrientation: cachedData.originalOrientation,
                isRotated: cachedData.isRotated
            });
            return;
        }

        const img = new Image();
        
        img.onload = function () {
            const isPortrait = img.height > img.width;
            const originalOrientation = isPortrait ? 'vertical' : 'horizontal';
            let imageDataUrl;

            if (isPortrait) {
                imageDataUrl = rotateImage(img);
            } else {
                imageDataUrl = imgUrl;
            }

            // Store in cache with orientation info
            const cacheData = { 
                imageDataUrl, 
                isRotated: isPortrait, 
                originalOrientation 
            };
            addToCache(filename, cacheData);
            
            resolve({
                imageDataUrl,
                originalOrientation,
                isRotated: isPortrait
            });
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

/**
 * Rotates an image by a specific number of 90-degree steps
 * @param {HTMLImageElement} img - Image element to be rotated
 * @param {number} rotationSteps - Number of 90° rotations (0-3)
 * @returns {string} Data URL of rotated image
 */
function rotateImageBySteps(img, rotationSteps) {
    // Normalize rotation steps to 0-3 range
    const normalizedSteps = ((rotationSteps % 4) + 4) % 4;
    
    // No rotation needed
    if (normalizedSteps === 0) {
        const canvas = getCanvas();
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        returnCanvas(canvas);
        return dataUrl;
    }
    
    const canvas = getCanvas();
    const ctx = canvas.getContext('2d');
    
    // Set canvas dimensions based on rotation
    if (normalizedSteps % 2 === 0) {
        // 0° or 180° - same aspect ratio
        canvas.width = img.width;
        canvas.height = img.height;
    } else {
        // 90° or 270° - swapped aspect ratio
        canvas.width = img.height;
        canvas.height = img.width;
    }
    
    // Optimizations
    ctx.imageSmoothingEnabled = false;
    ctx.imageSmoothingQuality = 'low';
    ctx.globalCompositeOperation = 'copy';
    
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    
    // Apply rotation based on steps (clockwise for manual rotations)
    switch (normalizedSteps) {
        case 1: // 90° clockwise
            ctx.rotate(Math.PI / 2);
            break;
        case 2: // 180°
            ctx.rotate(Math.PI);
            break;
        case 3: // 270° clockwise (equivalent to 90° counter-clockwise)
            ctx.rotate(-Math.PI / 2);
            break;
    }
    
    ctx.drawImage(img, -img.width / 2, -img.height / 2, img.width, img.height);
    ctx.restore();
    
    const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
    returnCanvas(canvas);
    
    return dataUrl;
}

/**
 * Rotates an existing image element directly to the target rotation
 * @param {HTMLElement} imageDiv - Div element with background-image
 * @param {number} targetRotationSteps - Target number of 90° rotations
 * @param {string} filename - Filename for cache
 * @returns {Promise<void>} Promise that resolves when rotation is complete
 */
function rotateToTarget(imageDiv, targetRotationSteps, filename) {
    return new Promise((resolve, reject) => {
        // Get original image URL (not the rotated one)
        const originalImageUrl = `/photos/${filename}`;
        
        // Create image element to load original
        const img = new Image();
        
        img.onload = function() {
            try {
                const isPortrait = img.height > img.width;
                
                // Calculate total rotation needed
                let totalRotationSteps = targetRotationSteps;
                
                // If portrait, we need to account for the automatic counter-clockwise rotation
                // The automatic rotation is -90° (counter-clockwise), which is equivalent to +3 steps
                if (isPortrait) {
                    totalRotationSteps = (targetRotationSteps + 3) % 4;
                }
                
                // Calculate final rotation directly
                const rotatedDataUrl = rotateImageBySteps(img, totalRotationSteps);
                
                // Update the background image
                imageDiv.style.backgroundImage = `url(${rotatedDataUrl})`;
                
                resolve();
            } catch (error) {
                reject(error);
            }
        };
        
        img.onerror = function() {
            reject(new Error('Failed to load original image'));
        };
        
        img.src = originalImageUrl;
    });
}

/**
 * Rotates an existing image element by one 90° step clockwise
 * @param {HTMLElement} imageDiv - Div element with background-image
 * @param {string} filename - Filename for cache
 * @returns {Promise<void>} Promise that resolves when rotation is complete
 */
function rotateExistingImage(imageDiv, filename) {
    return new Promise((resolve, reject) => {
        const currentBgImage = imageDiv.style.backgroundImage;
        const urlMatch = currentBgImage.match(/url\("?([^"]*)"?\)/);
        
        if (!urlMatch) {
            reject(new Error('No background image found'));
            return;
        }
        
        const imageUrl = urlMatch[1];
        
        // Create temporary image element to load the current image
        const img = new Image();
        
        img.onload = function() {
            try {
                // Rotate the image one step clockwise
                const rotatedDataUrl = rotateImageClockwise(img);
                
                // Update the background image
                imageDiv.style.backgroundImage = `url(${rotatedDataUrl})`;
                
                resolve();
            } catch (error) {
                reject(error);
            }
        };
        
        img.onerror = function() {
            reject(new Error('Failed to load image for rotation'));
        };
        
        img.src = imageUrl;
    });
}

/**
 * Rotates an image 90 degrees clockwise using canvas
 * @param {HTMLImageElement} img - Image element to be rotated
 * @returns {string} Data URL of rotated image
 */
function rotateImageClockwise(img) {
    const canvas = getCanvas();
    canvas.width = img.height;  // Swap width and height for 90° rotation
    canvas.height = img.width;
    
    const ctx = canvas.getContext('2d');
    
    // Optimizations for better performance
    ctx.imageSmoothingEnabled = false;
    ctx.imageSmoothingQuality = 'low';
    ctx.globalCompositeOperation = 'copy';
    
    ctx.save();
    // Move to center, rotate 90° clockwise and draw image centered
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(Math.PI / 2); // Positive for clockwise rotation
    ctx.drawImage(img, -img.width / 2, -img.height / 2, img.width, img.height);
    ctx.restore();
    
    // Use lower quality for better performance
    const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
    
    // Return canvas to pool
    returnCanvas(canvas);
    
    return dataUrl;
}

export {
    processImage,
    rotateImage,
    rotateImageBySteps,
    rotateToTarget,
    rotateExistingImage
};