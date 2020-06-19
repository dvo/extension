$(document).ready(async function () {

    let gun = Gun();

    var port = chrome.runtime.connect({
        name: "dvo"
    });

    async function getPageUrl() {
        return new Promise(resolve => {
            chrome.tabs.query({
                active: true,
                lastFocusedWindow: true
            }, function (tabs) {
                var tab = tabs[0];
                resolve(tab.url);
            });
        });
    }

    let page_url = await getPageUrl();
    let profileInfo = await getProfileInfo();
    let profile_url = profileInfo.profile_url;
    let password = profileInfo.password;
    password = window.atob(password);
    $('#profile-url').val(profile_url);
    $('#password').val(password);

    async function getProfileInfo() {
        return new Promise(resolve => {
            port.postMessage({
                type: "get-profile-info"
            });
            port.onMessage.addListener(function (res) {
                if (res.type === "get-profile-info") {
                    resolve(res);
                }
            });
        });
    }

    let likes = await getLikes('likes');
    let dislikes = await getLikes('dislikes');

    //$('#likes').html(likes.length);
    //$('#dislikes').html(dislikes.length);

    function getKey(type) {
        for (var i = 0; i < type.length; i++) {
            if (type[i].url === profile_url) {
                return type[i].id;
            }
        }
    }

    let key = 0;
    let count = 0;

    $('#like').click(async function () {
        key = getKey(likes);
        if (key) {
            gun.get(page_url).get('likes').get(key).put(null);
        } else {
            gun.get(page_url).get('likes').set(profile_url);
            key = getKey(dislikes);
            if (key) {
                gun.get(page_url).get('dislikes').get(key).put(null);
            }
        }
        count = await getLikes('likes');
        $('#likes').html(count.length);
    });

    $('#dislike').click(async function () {
        key = getKey(dislikes);
        if (key) {
            gun.get(page_url).get('dislikes').get(key).put(null);
        } else {
            gun.get(page_url).get('dislikes').set(profile_url);
            key = getKey(likes);
            if (key) {
                gun.get(page_url).get('likes').get(key).put(null);
            }
        }
        count = await getLikes('dislikes');
        $('#dislikes').html(count.length);
    });


    async function getLikes(type) {
        let array = [];
        return new Promise(async resolve => {
            let chain = await gun.get(page_url).get(type);
            if (chain === undefined) {
                resolve(array);
            } else {
                gun.get(page_url).get(type).map().on(function (data, key) {
                    if (data !== null) {
                        var id = key;
                        var url = data;
                        array.push({
                            id: id,
                            url: url
                        });
                        $('#' + type).html(array.length);
                    }
                    resolve(array);
                });
            }
        });
    }

    $('#login').click(function () {
        let p_url = $('#profile-url').val();
        let pw = $('#password').val();
        pw = window.btoa(pw);
        port.postMessage({
            type: "login",
            profile_url: p_url,
            password: pw
        });
    });

    $('#generate-token').click(function () {
        $('#token').val($.MD5($('#token').val()));
    });

    $('#change-password').click(function () {
        let p_url = $('#profile-url').val();
        let o_pw = $('#o_password').val();
        let n_pw = $('#n_password').val();
        let c_n_pw = $('#c_n_password').val();
        $.post(`${p_url}api.php`, {
            change: true,
            o_password: o_pw,
            n_password: n_pw,
            c_n_password: c_n_pw
        }).done(function (data) {
            if (data === '1') {
                $('.change-password-result').html('Your password has been changed');
            } else if (data === '2') {
                $('.change-password-result').html(`Passwords don't match`);
            } else if (data === '3') {
                $('.change-password-result').html(`Your old password was incorrect`);
            }
            console.log(data);
        });
    });

    getMail();
    showComments();

    function getMail() {
        console.log(password);
        $('#inbox section').empty();
        $.post(`${profile_url}api.php`, {
            getMail: true,
            password: window.atob(password)
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
    }

    async function showComments() {
        let chain = await gun.get(page_url).get('posts');
        if (chain !== undefined) {
            gun.get(page_url).get('posts').map().once(function (res) {
                $.ajax({
                    type: "GET",
                    url: `${res.user}data/public/posts/${res.id}.xml`,
                    dataType: "xml",
                    success: async function (xml) {
                        let body = $(xml).find("body").text();
                        $.ajax({
                            type: "GET",
                            url: `${res.user}data/public/profile.xml`,
                            dataType: "xml",
                            success: function (profile) {
                                let date = new Date(parseInt(res.id));
                                let photo = $(profile).find("photo-url").html();
                                let name = $(profile).find("name").html();
                                let tpl = `
                                <div id="${res.id}" class="post">
                                <div class="post-header">
                                    <div><img src="${res.user}data/public/photos/${photo}" class="post-photo" alt="User Image"></div>
                                    <div><a target="_blank" href="${res.user}">${name}</a></div>
                                    <div>${date.toLocaleDateString()}</div>
                                </div>
                                <section>
                                    ${body}
                                </section>
                                </div>
                                `;
                                $('#comments-list').prepend(tpl);
                            }
                        });
                    }
                });
            });
        }
    }

    $('textarea').on('click focusin', function () {
        this.value = '';
    });


    $('#add-comment').click(async function () {
        let id = new Date().getTime();
        let post = $('#add #comment').val();
        $.post(`${profile_url}api.php`, {
            id: id,
            url: page_url,
            post: post,
            password: window.atob(password)
        }).done(function (data) {
            gun.get(page_url).get('posts').set({
                id: id,
                user: profile_url
            });
            showComments();
        });
    });

    // Page routing

    $(document).on('click touchstart', '.link', function (e) {
        e.preventDefault;
        page = this.dataset.page;
        $('nav').find('.active').removeClass('active');
        $(`.${page}`).addClass('active');
        $('.page').hide();
        $(`#${page}`).show();
    });
});
