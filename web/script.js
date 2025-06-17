$(document).ready(function () {
    loadAlbumData();
    loadGallery();
    $('.btn-refresh-gallery').on('click', loadGallery);
});

/* -------------------------------------------------------------------------- */
/*                             DESCRIPTION EDITOR                             */
/* -------------------------------------------------------------------------- */

const quill = new Quill('#caption-editor', {
    theme: 'snow'
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

/* -------------------------------------------------------------------------- */
/*                                   GALLERY                                  */
/* -------------------------------------------------------------------------- */

function loadGallery() {
    $.getJSON('/api/gallery', function (data) {
        const $gallery = $('.gallery');
        $gallery.empty();

        data.forEach(function (image) {
            const imgUrl = `/photos/${image}`;
            const $img = $('<img>', { src: imgUrl, alt: image, class: 'gallery-image' });
            $img.on('click', function () {
                createPage({
                    filename: image,
                    order: $('.page').length + 1,
                    caption: ''
                })
            })
            $gallery.append($img);
        });
    });
}

/* -------------------------------------------------------------------------- */
/*                                    ALBUM                                   */
/* -------------------------------------------------------------------------- */

function loadAlbumData() {
    $.getJSON('/api/album', function (data) {
        data.album.photos.forEach(function(photo) {
            createPage(photo);
        });
    });
}

function createPage(photo) {
    const imgUrl = `/photos/${photo.filename}`;
    const cutmarks = Array(4).fill('<div class="cutmark"></div>').join('');
    const punchmarks = Array(10).fill('<i></i>').join('');

    // Cria o elemento img para ler metadados dinamicamente
    const $img = $('<img>', { src: imgUrl, alt: `Image ${photo.order}` });

    $img.on('load', function () {
        // Detecta orientação baseada nas dimensões da imagem
        const isPortrait = this.naturalHeight > this.naturalWidth;
        if (isPortrait) {
            $img.addClass('portrait-rotate');
        }

        const pageHtml = `
            <div class="page-wrapper" data-order="${photo.order}">
                <div class="page">
                    ${cutmarks}
                    <div class="punchmarks">
                        ${punchmarks}
                    </div>
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
                    <div class="actions">Delete</div>
                </div>
            </div>
        `;

        const $page = $(pageHtml);
        $page.find('.page').append($img);
        
        $page.find('.content').off('click').on('click', function (event) {
            mirrorWithEditor(event, quill);
        });

        $('.album').append($page);
    });
}


/* -------------------------------------------------------------------------- */
/*                                  PRINTING                                  */
/* -------------------------------------------------------------------------- */

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
        return $('<label>', { html: `Sheet <b>${current}</b> of <b>${totalSheets}</b>` })
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
