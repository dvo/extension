let password = profileInfo.password;
let profile_url = 'http://localhost/bob/';
$('#inbox section').empty();
$.post(`${profile_url}api.php`, {
    getMail: true
    , password: window.atob(password)
}).done(function (xml) {
    let msg = $(xml).find("inbox");
    chrome.browserAction.setBadgeBackgroundColor({
        color: "#008d4c"
    });
    let count = $(msg).find("message").length;
    if (count > 0) {
        $('.msg-count').html(count);
        chrome.browserAction.setBadgeText({
            text: count.toString()
        });
    }
    msg.children().each(async function () {
        $('#inbox > section').prepend(`
                <details>
                    <summary>
                        <div>${$(this).find("subject").text()}</div>
                        <div></div>
                        <div><i class="fa fa-plus"></i></div>
                    </summary>
                    <section>
                    <div class="spacer-15px"></div>
                    <span class="red" style="margin-right:10px;">From:</span>${$(this).find("from").text()}
                    <div class="spacer-15px"></div>
                    ${$(this).find("body").text()}
                    </section>
                </details>
                <div class="spacer-15px"></div>
                `);
    });
});