$(document).ready(function () {
    loadAlbumData();
    loadGallery();

    $('.btn-refresh-gallery').on('click', loadGallery);
    $('.btn-print').on('click', () => window.print());
    $('.btn-save-album').on('click', saveAlbum);

    $('.album').sortable({
        items: '.page-wrapper',
        // containment: 'parent',
        axis: 'y',
        tolerance: 'pointer',
        
        update: function() {
            refreshOrder();
        }
    });
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
                    caption: '',
                    id: generateId()
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
        const photos = data.album?.photos || [];
        photos.sort((a, b) => a.order - b.order);
        photos.forEach(function(photo) {
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
            <div class="page-wrapper" data-order="${photo.order}" data-id="${photo.id || ''}">
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
                    <div class="actions">
                        <div class="action btn-delete">Delete</div>
                    </div>
                </div>
            </div>
        `;

        const $page = $(pageHtml);
        $page.find('.page').append($img);

        $page.find('.btn-delete').on('click', function () {
            $page.remove();
            refreshOrder();
        });
        
        $page.find('.content').on('click', function (event) {
            mirrorWithEditor(event, quill);
        });

        $('.album').append($page);
    });
}

/* -------------------------------------------------------------------------- */
/*                                   ACTIONS                                  */
/* -------------------------------------------------------------------------- */

function refreshOrder() {
    $('.album .page-wrapper').each(function(index) {
        $(this).attr('data-order', index + 1);
        $(this).find('.page-bar span').text(`Page ${index + 1} - ${$(this).find('img').attr('src')?.split('/').pop() || ''}`);
    });
}

function saveAlbum() {
    const photos = [];
    $('.album .page-wrapper').each(function() {
        const $wrapper = $(this);

        photos.push({
            order: Number($wrapper.data('order')),
            id: $wrapper.data('id') || '',
            filename: $wrapper.find('img').attr('src')?.split('/').pop() || '',
            caption: $wrapper.find('.text').text().trim(),
        });
    });

    $.ajax({
        url: '/api/save/album',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(photos),
        success: function(response) {
            const $check = $('<span class="save-check" style="margin-left:8px;color:white;">&#10003;</span>');
            $('.btn-save-album').after($check);
            setTimeout(() => $check.fadeOut(400, function() { $(this).remove(); }), 1200);
        },
        error: function(xhr) {
            console.error('Erro ao salvar álbum: ' + (xhr.responseJSON?.error || xhr.statusText));
        }
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

        if (oddGroup.length) {
            const $oddA3 = $('<div class="a3-page odd printonly"></div>');
            $oddA3.append(createLabel(currentSheet++));
            $(oddGroup).each(function() {
                const $wrapper = $('<div class="page-wrapper"></div>');
                $wrapper.append($(this).clone(true, true));
                $oddA3.append($wrapper);
            });
            $('body').append($oddA3);
        }

        if (evenGroup.length) {
            const $evenA3 = $('<div class="a3-page even printonly"></div>');
            $evenA3.append(createLabel(currentSheet++));
            $(evenGroup).each(function() {
                const $wrapper = $('<div class="page-wrapper"></div>');
                $wrapper.append($(this).clone(true, true));
                $evenA3.append($wrapper);
            });
            $('body').append($evenA3);
        }
    }
});

window.addEventListener('afterprint', function () {
    $('.a3-page.printonly').remove();
});

/* -------------------------------------------------------------------------- */
/*                                    UTILS                                   */
/* -------------------------------------------------------------------------- */

function generateId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let id = '';
    for (let i = 0; i < 8; i++) {
        id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
}