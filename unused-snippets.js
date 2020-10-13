// These are some snippets that I may or may not include
// Inject API to web page
var s = document.createElement('script');
s.src = chrome.extension.getURL('js/api.js');
s.onload = function () {
    this.parentNode.removeChild(this);
};
(document.head || document.documentElement).appendChild(s);
/*getPageLikes();
function getPageLikes() {
    let count = 0;
    $.ajax({
        type: "GET"
        , url: `${profile_url}data/public/likes.xml`
        , dataType: "xml"
        , success: async function (xml) {
            let likes = $(xml).find("likes");
            likes.children().each(function () {
                let t = $(this).find("type").text();
                if (t === 'like') {
                    count++;
                    $('#likes').html(count);
                }
                else if (t === 'dislike') {
                    count++;
                    $('#dislikes').html(count);
                }
            });
        }
    });
}*/
/*async function getProfileInfo() {
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
}*/
//let profileInfo = await getProfileInfo();
//let profile_url = profileInfo.profile_url;
//let password = profileInfo.password;
//password = window.atob(password);
/*port.postMessage({
    type: "add-post"
    , post: post
});
port.onMessage.addListener(function (res) {
    if (res.type === "add-post") {
        loadPosts(profile_url);
    }
});*/
/*<div><span id="score">0</span>%</div>
< div id = "comment" > < i class = "yellow fa fa-comment" > < /i></div > < div id = "comments" > 0 < /div>

        <!-- <div>
            <button data-page="apps" class="apps link">
                <div><i class="fa fa-search"></i></div>Apps</button>
        </div>-->
        
                  
                  
                                          <!--<div>Old Password</div>
                        <div class="spacer-15px"></div>
                        <input type="text" id="o_password" class="form-control">
                        <div class="spacer-15px"></div>--><!--<div>Username</div>
                        <div class="spacer-15px"></div>
                        <input type="text" id="username" class="form-control">
                        <div class="spacer-15px"></div>-->
                        
                                                <!--<div>Old Password</div>
                        <div class="spacer-15px"></div>
                        <input type="text" id="o_password" class="form-control">
                        <div class="spacer-15px"></div>-->*/
chrome.runtime.onConnectExternal.addListener(function (port) {
    port.onMessage.addListener(async function (request) {
        // This is so the web page can check that the extension is installed
        if (request.type === 'ping') {
            let profile_url = localStorage.getItem("profile_url");
            port.postMessage({
                type: "pong"
                , profile_url: profile_url
            });
        }
        if (request.type === 'sync') {
            if (window.confirm(`Connect with this user`)) {
                let profile_url = localStorage.getItem("profile_url");
                let password = localStorage.getItem("password");
                password = window.atob(password);
                let url = request.url;
                $.post(`${profile_url}api.php`, {
                    sync: true
                    , url: url
                    , password: password
                }).done(function () {
                    port.postMessage({
                        type: "sync"
                    });
                });
            }
        }
        if (request.type === 'count-messages') {
            $.post(`${localStorage.getItem("profile_url")}api.php`, {
                getMail: true
            }).done(function (xml) {
                chrome.browserAction.setBadgeBackgroundColor({
                    color: "#008d4c"
                });
                let count = $(xml).find("message").length;
                $('.msg-count').html(count);
                chrome.browserAction.setBadgeText({
                    text: count.toString()
                });
            });
        }
        /*if (request.type === 'sync') {
            if (window.confirm(`Are you sure you want to sync with this app?`)) {
                let profile_url = localStorage.getItem("profile_url");
                port.postMessage({
                    type: "sync",
                    profile_url: profile_url
                });
            }
        }*/
        if (request.type === 'add-post') {
            if (window.confirm(`Confirm add post`)) {
                let url = await getPageUrl();
                let id = new Date().getTime();
                //let profile_url = localStorage.getItem("profile_url");
                //let profile_url = 'http://localhost/bob/';
                let password = localStorage.getItem("password");
                $.post(`${profile_url}api.php`, {
                    id: id
                    , url: url
                    , post: request.post
                    , password: password
                }).done(function () {
                    // send a message back to the application with the profile url
                    port.postMessage({
                        type: "add-post"
                        , profile_url: profile_url
                    });
                });
            }
        }
        return true;
    });
});
if (request.type === 'login') {
    localStorage.setItem("profile_url", request.profile_url);
    localStorage.setItem("password", request.password);
    /*let u = request.username;
    let p = request.password;
    try {
        await user.create(u, p, function () {
            user.auth(u, p, function (msg) {
                user.get('profile_url').put(request.profile_url);
            });
        });
    } catch (e) {
        console.log(e);
        await user.auth(u, p, function (msg) {
            console.log(msg);
        });
    }*/
}