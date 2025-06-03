$(document).ready(function () {
    const $album = $('.album');
    const $setup = $('.setup');

    $('#fileInput').on('change', function (event) {
        const files = event.target.files;

        $album.empty(); // Clear previous content
        $setup.empty(); // Clear previous setup content

        $.each(files, function (index, file) {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = function (e) {
                    const img = new Image();
                    img.onload = function () {
                        const isPortrait = img.height > img.width;
                        let imageDataUrl;

                        if (isPortrait) {
                            // Create a canvas and rotate the image 90 degrees, preserving aspect ratio
                            const canvas = document.createElement('canvas');
                            canvas.width = img.height;  // Swap width and height
                            canvas.height = img.width;
                            const ctx = canvas.getContext('2d');
                            ctx.save();
                            // Move to center, rotate, then draw image centered
                            ctx.translate(canvas.width / 2, canvas.height / 2);
                            ctx.rotate(Math.PI / 2);
                            ctx.drawImage(img, -img.width / 2, -img.height / 2, img.width, img.height);
                            ctx.restore();
                            imageDataUrl = canvas.toDataURL();
                        } else {
                            imageDataUrl = e.target.result;
                        }

                        const cutmarks = [1, 1, 1, 1].reduce((html, _) => {
                            return html + `<div class="cutmark"></div>`;
                        }, '');

                        const punchmarks = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1].reduce((html, _) => {
                            return html + `<i></i>`;
                        }, '');

                        const pageHtml = `
                            <div class="page">
                                ${cutmarks}
                                <div class="punchmarks">
                                    ${punchmarks}
                                </div>
                                <div class="sidebar">
                                    <div class="content">
                                        Escrevendo qualquer coisa aqui para ver se vira um texto longo o suficiente para ocupar o espaço necessário.
                                    </div>
                                </div>
                                <img src="${imageDataUrl}" alt="Image ${index + 1}">
                            </div>
                        `;
                        $album.append(pageHtml);
                    };
                    img.src = e.target.result;
                };
                reader.readAsDataURL(file);
            }
        });

        // Update album content dynamically based on setup inputs
        $setup.on('input', 'input, textarea', function () {
            const index = $(this).data('index');
            const type = $(this).data('type');
            const value = $(this).val();
            $(`#${type}-${index}`).text(value);
        });
    });
});

const quill = new Quill('#text-editor', {
    theme: 'snow'
});

$('.content').on('click', function (event) {
    mirrorWithEditor(event, quill);
    
});

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

window.addEventListener('beforeprint', function () {
    const $pages = $('.page');

    const oddPages = [];
    const evenPages = [];

    // Group pages into patches of 6
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

    function createLabel(current) {
        return $('<label>', { html: `Sheet <b>${current}</b> out of <b>${totalSheets}</b>` })
    }

    let currentSheet = 1;

    for (let i = 0; i < Math.max(oddPageGroups.length, evenPageGroups.length); i++) {
        const oddGroup = oddPageGroups[i] || [];
        const evenGroup = evenPageGroups[i] || [];

        const $oddA3 = $('<div class="a3-page odd printonly"></div>');
        const $evenA3 = $('<div class="a3-page even printonly"></div>');

        $oddA3.append(createLabel(currentSheet++));
        $evenA3.append(createLabel(currentSheet++));

        $(oddGroup).each(function() {
            const $wrapper = $('<div class="page-wrapper"></div>');
            $wrapper.append($(this).clone(true, true));
            $oddA3.append($wrapper);
        });
        $(evenGroup).each(function() {
            const $wrapper = $('<div class="page-wrapper"></div>');
            $wrapper.append($(this).clone(true, true));
            $evenA3.append($wrapper);
        });

        $('body').append($oddA3, $evenA3);
    }
});

window.addEventListener('afterprint', function () {
    $('.a3-page.printonly').remove();
});
