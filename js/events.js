$(document).ready(async function () {
    $('.dvo-widget').show();
    
    var port = chrome.runtime.connect({
        name: "dvo"
    });
    $('.dvo-post-button').on('click', function () {
        let input = $('.dvo-post-input').val();
        port.postMessage({
            type: "add-post",
            post: input
        });
    })
});
