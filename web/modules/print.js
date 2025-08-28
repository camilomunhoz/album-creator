/**
 * Print Module - Manages album printing functionality
 */

/**
 * Sets up pages for printing by organizing them into A3 sheets
 */
function setupPrintLayout() {
    const $pages = $('.page');

    const oddPages = [];
    const evenPages = [];

    const perPage = 9;

    // Groups pages into batches
    function groupPages(pages) {
        const groups = [];
        for (let i = 0; i < pages.length; i += perPage) {
            groups.push(pages.slice(i, i + perPage));
        }
        return groups;
    }

    $pages.each(function(index) {
        if ((index + 1) % 2 === 1) {
            oddPages.push(this);
        } else {
            evenPages.push(this);
        }
    });

    const oddPageGroups = groupPages(oddPages);
    const evenPageGroups = groupPages(evenPages);

    const totalSheets = oddPageGroups.length + evenPageGroups.length;

    let currentSheet = 1;

    for (let i = 0; i < Math.max(oddPageGroups.length, evenPageGroups.length); i++) {
        const oddGroup = oddPageGroups[i] || [];
        const evenGroup = evenPageGroups[i] || [];

        if (oddGroup.length) {
            const $oddA3 = createPrintSheet('odd', currentSheet++, totalSheets);
            $(oddGroup).each(function() {
                const $wrapper = $('<div class="page-wrapper"></div>');
                $wrapper.append($(this).clone(true, true));
                $oddA3.append($wrapper);
            });
            $('body').append($oddA3);
        }

        if (evenGroup.length) {
            const $evenA3 = createPrintSheet('even', currentSheet++, totalSheets);
            $(evenGroup).each(function() {
                const $wrapper = $('<div class="page-wrapper"></div>');
                if (needsRotation(this)) {
                    $wrapper.addClass('needs-rotation');
                }
                $wrapper.append($(this).clone(true, true));
                $evenA3.append($wrapper);
            });
            $('body').append($evenA3);
        }
    }
}

/**
 * Even pages need special rotation to fit the back print,
 * affected by factors as original orientation and current rotation.
 * 
 * Basically, if the final orientation is landscape, it needs to rotate.
 * If it is portrait (90deg), does not rotate.
 * 
 * @param {DOMElement} page
 * @returns {boolean}
 */
function needsRotation(page) {
    const data = $(page).parents('.page-wrapper')[0].dataset;
    return (
        data.orientation === 'horizontal' && (data.rotation % 2) === 0 ||
        data.orientation === 'vertical' && (data.rotation % 2) !== 0 
    )
}

/**
 * Creates an A3 print sheet
 * @param {string} type - Sheet type ('odd' or 'even')
 * @param {number} current - Current sheet number
 * @param {number} total - Total number of sheets
 * @returns {jQuery} jQuery A3 sheet element
 */
function createPrintSheet(type, current, total) {
    const $sheet = $(`<div class="a3-page ${type} printonly"></div>`);
    const $label = $('<label>', { html: `Sheet <b>${current}</b> of <b>${total}</b>` });
    $sheet.append($label);
    return $sheet;
}

/**
 * Removes print elements after printing
 */
function cleanupPrintLayout() {
    $('.a3-page.printonly').remove();
}

/**
 * Registers print event listeners
 */
function setupPrintEventListeners() {
    window.addEventListener('beforeprint', setupPrintLayout);
    window.addEventListener('afterprint', cleanupPrintLayout);
}

export {
    setupPrintLayout,
    cleanupPrintLayout,
    setupPrintEventListeners
};
