$(document).ready(async function () {
    var port = chrome.runtime.connect({
        name: "dvo"
    });
    const gun = Gun({
        peers: ['http://gunjs.herokuapp.com/gun']
    });
    //let gun = Gun();
    //let user = gun.user();
    let page_url = await getPageUrl();
    let profile_url = localStorage.getItem("profile_url");
    let password = localStorage.getItem("password");
    $('#profile-url').val(profile_url);
    $('#password').val(password);
    //gun.get('DVO').get(page_url).put(null);
    gun.get('DVO').get(page_url).get('posts').map().on(function (res) {
        loadPosts(res.postId, res.userId);
        console.log(res);
    });
    async function getPageUrl() {
        return new Promise(resolve => {
            chrome.tabs.query({
                active: true
                , lastFocusedWindow: true
            }, function (tabs) {
                var tab = tabs[0];
                resolve(tab.url);
            });
        });
    }

    function loadPosts(postId, url) {
        //$('#comments-list').empty();
        $.ajax({
            type: "GET"
            , url: url + '/data/public/posts.xml'
            , dataType: "xml"
            , success: async function (xml) {
                let posts = $(xml).find("posts");
                if ($(posts).children().length == 0) {
                    $('#posts-container').html(`<div class="center">Nobody has posted anything yet</div>`);
                }
                else {
                    posts.children().each(function () {
                        let id = $(this).find('id').text();
                        if (postId.toString() === id.toString()) {
                            renderPosts($(this), url);
                        }
                    });
                }
            }
        });
    }

    function renderPosts($this, prof_url) {
        let url = $this.find("url").text();
        if (url === page_url) {
            let id = $this.find("id").text();
            let date = new Date(parseInt(id));
            let post = $this.find("body").html();
            $.ajax({
                type: "GET"
                , url: `${prof_url}/data/public/profile.xml`
                , dataType: "xml"
                , success: function (profile) {
                    let photo = $(profile).find("photo-url").html();
                    let name = $(profile).find("name").html();
                    let tpl = `<div id="${id}" class="post">
                    <div class="post-header">
                    <div><img src="${prof_url}/data/public/${photo}" class="post-photo" alt="User Image"></div>
                    <div><a target="_blank" href="${prof_url}">${name}</a></div>
                    <div>${date.toLocaleDateString()}</div>
                    </div>
                    <section>${post}</section>
                    </div>`;
                    $('#comments-list').prepend(tpl);
                }
            });
        }
    }
    $('textarea').on('click focusin', function () {
        this.value = '';
    });
    $('#add-comment').click(async function () {
        let post = $('#add #comment').val();
        let id = new Date().getTime();
        $.post(`${profile_url}api.php`, {
            id: id
            , url: page_url
            , post: post
            , user: profile_url
            , password: password
        }).done(function () {
            gun.get('DVO').get(page_url).get('posts').set({
                postId: id
                , userId: profile_url
            });
        });
    });
    $('#add-contact').click(async function () {
        $.post(`${profile_url}api.php`, {
            friend: page_url
            , password: password
        }).done(function (res) {
            console.log('page liked ' + res);
        });
    });
    $('#login').click(function () {
        let p_url = $('#profile-url').val();
        let p = $('#password').val();
        localStorage.setItem("profile_url", p_url);
        localStorage.setItem("password", p);
        $.ajax({
            type: "GET"
            , url: `${p_url}data/public/profile.xml`
            , dataType: "xml"
            , success: async function (xml) {
                let name = $(xml).find("name").text();
                $('.login-result').html(`Welcome ${name}!`);
            }
        });
    });
    $('#generate-token').click(function () {
        $('#token').val($.MD5($('#token').val()));
    });
    $('#change-password').click(function () {
        // NOTE: You probably don't need the old password field since it's assumed that you are already logged in
        let p_url = $('#profile-url').val();
        //let o_pw = $('#o_password').val();
        // NOTE: This is not working properly. It didn't check that the passwords matched
        let n_pw = $('#n_password').val();
        let c_n_pw = $('#c_n_password').val();
        $.post(`${p_url}api.php`, {
            change: true
            , o_password: password
            , n_password: n_pw
            , c_n_password: c_n_pw
        }).done(function (data) {
            if (data === '1') {
                $('.change-password-result').html('Your password has been changed');
            }
            else if (data === '2') {
                $('.change-password-result').html(`Passwords don't match`);
            }
            else if (data === '3') {
                $('.change-password-result').html(`Please make sure you are logged in`);
            }
            console.log(data);
        });
    });
    let likes = await getLikes('likes');
    let dislikes = await getLikes('dislikes');
    let key = 0;
    let count = 0;
    /* 
    When the like button is clicked, it is recorded in likes.xml in the POD. Then, the url of the POD is added to GUN.
    It can work without recording the like in the POD, however, I don't want to lock anyone into a technology, and so I would like an alternative ways to calculate how many likes a page has.
    */
    $('#like').click(async function () {
        $.post(`${profile_url}api.php`, {
            url: page_url
            , type: 'like'
            , password: password
        }).done(async function () {
            key = getKey(likes);
            if (key) {
                gun.get('DVO').get(page_url).get('likes').get(key).put(null);
            }
            else {
                gun.get('DVO').get(page_url).get('likes').set(profile_url);
                key = getKey(dislikes);
                if (key) {
                    gun.get('DVO').get(page_url).get('dislikes').get(key).put(null);
                }
            }
            count = await getLikes('likes');
            $('#likes').html(count.length);
        });
    });
    $('#dislike').click(async function () {
        $.post(`${profile_url}api.php`, {
            url: page_url
            , type: 'dislike'
            , password: password
        }).done(async function (res) {
            key = getKey(dislikes);
            if (key) {
                gun.get('DVO').get(page_url).get('dislikes').get(key).put(null);
            }
            else {
                gun.get('DVO').get(page_url).get('dislikes').set(profile_url);
                key = getKey(likes);
                if (key) {
                    gun.get('DVO').get(page_url).get('likes').get(key).put(null);
                }
            }
            count = await getLikes('dislikes');
            $('#dislikes').html(count.length);
        });
    });
    //////////////////////////////// GET LIKES //////////////////////////////////
    async function getLikes(type) {
        let array = [];
        return new Promise(async resolve => {
            let chain = await gun.get('DVO').get(page_url).get(type);
            if (chain === undefined) {
                resolve(array);
            }
            else {
                gun.get('DVO').get(page_url).get(type).map().on(function (data, key) {
                    if (data !== null) {
                        var id = key;
                        var url = data;
                        array.push({
                            id: id
                            , url: url
                        });
                        $('#' + type).html(array.length);
                    }
                    resolve(array);
                });
            }
        });
    }
    //////////////////////////////// GET KEY //////////////////////////////////
    function getKey(type) {
        for (var i = 0; i < type.length; i++) {
            if (type[i].url === profile_url) {
                return type[i].id;
            }
        }
    }
});