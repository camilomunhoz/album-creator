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

    // Groups pages into batches of 6
    function groupPages(pages) {
        const groups = [];
        for (let i = 0; i < pages.length; i += 6) {
            groups.push(pages.slice(i, i + 6));
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
                $wrapper.append($(this).clone(true, true));
                $evenA3.append($wrapper);
            });
            $('body').append($evenA3);
        }
    }
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
