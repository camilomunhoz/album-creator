/**
 * Cache Module - Manages rotated image cache and canvas pool
 */

// Cache for rotated images
const rotatedImageCache = new Map();

// Canvas pool for reuse
const canvasPool = [];
const maxPoolSize = 5;

/**
 * Gets a canvas from the pool or creates a new one if needed
 * @returns {HTMLCanvasElement} Reusable canvas
 */
function getCanvas() {
    return canvasPool.length > 0 ? canvasPool.pop() : document.createElement('canvas');
}

/**
 * Returns a canvas to the pool after cleanup
 * @param {HTMLCanvasElement} canvas - Canvas to be returned to the pool
 */
function returnCanvas(canvas) {
    if (canvasPool.length < maxPoolSize) {
        // Cleans the canvas before returning to pool
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        canvasPool.push(canvas);
    }
}

/**
 * Checks if an image is in cache
 * @param {string} key - Image key in cache
 * @returns {boolean} True if image is in cache
 */
function hasInCache(key) {
    return rotatedImageCache.has(key);
}

/**
 * Gets image data from cache
 * @param {string} key - Image key in cache
 * @returns {Object|undefined} Image data or undefined if not found
 */
function getFromCache(key) {
    return rotatedImageCache.get(key);
}

/**
 * Adds an image to cache with size control
 * @param {string} key - Image key
 * @param {Object} data - Image data {imageDataUrl, isRotated}
 */
function addToCache(key, data) {
    rotatedImageCache.set(key, data);
    
    // Limits cache to avoid excessive memory usage
    if (rotatedImageCache.size > 50) {
        const firstKey = rotatedImageCache.keys().next().value;
        rotatedImageCache.delete(firstKey);
    }
}

/**
 * Completely clears cache and canvas pool
 */
function clearImageCache() {
    rotatedImageCache.clear();
    canvasPool.length = 0;
}

// Auto-cleanup cache when leaving page
window.addEventListener('beforeunload', clearImageCache);

export {
    getCanvas,
    returnCanvas,
    hasInCache,
    getFromCache,
    addToCache,
    clearImageCache
};
