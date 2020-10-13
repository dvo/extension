// Page routing
$(document).on('click touchstart', '.link', function (e) {
    e.preventDefault;
    page = this.dataset.page;
    $('nav').find('.active').removeClass('active');
    $(`.${page}`).addClass('active');
    $('.page').hide();
    $(`#${page}`).show();
});