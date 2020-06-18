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

chrome.runtime.onConnectExternal.addListener(function (port) {
    port.onMessage.addListener(async function (request) {

        // This is so the web page can check that the extension is installed
        if (request.type === 'ping') {
            let profile_url = localStorage.getItem("profile_url");
            port.postMessage({
                type: "pong",
                profile_url: profile_url
            });
        }

        if (request.type === 'sync') {
            if (window.confirm(`Connect with this user`)) {
                let profile_url = localStorage.getItem("profile_url");
                let password = localStorage.getItem("password");
                password = window.atob(password);
                let url = request.url;
                $.post(`${profile_url}api.php`, {
                    sync: true,
                    url: url,
                    password: password
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
                let profile_url = localStorage.getItem("profile_url");
                let password = localStorage.getItem("password");
                password = window.atob(password);
                $.post(`${profile_url}api.php`, {
                    id: id,
                    url: url,
                    post: request.post,
                    user: profile_url,
                    password: password
                }).done(function () {
                    // send a message back to the application with the profile url
                    port.postMessage({
                        type: "add-post",
                        profile_url: profile_url
                    });
                });
            }
        }
        return true;
    });
});

chrome.runtime.onConnect.addListener(function (port) {
    port.onMessage.addListener(async function (request) {
        if (request.type === 'login') {
            localStorage.setItem("profile_url", request.profile_url);
            localStorage.setItem("password", request.password);
        }

        if (request.type === 'get-profile-info') {
            let profile_url = localStorage.getItem("profile_url");
            let password = localStorage.getItem("password");
            port.postMessage({
                type: "get-profile-info",
                profile_url: profile_url,
                password: window.btoa(password)
            });
        }

        if (request.type === 'like') {
            alert('like');
            let page_url = await getPageUrl();
            let profile_url = localStorage.getItem("profile_url");
            gun.get(page_url).set(profile_url);
            gun.get(page_url).once(function (likes) {
                port.postMessage({
                    type: "like",
                    likes: likes
                });
            })
        }

        if (request.type === 'add-post') {
            if (window.confirm(`Confirm add post`)) {
                let url = await getPageUrl();
                let id = new Date().getTime();
                let profile_url = localStorage.getItem("profile_url");
                let password = localStorage.getItem("password");
                password = window.atob(password);
                $.post(`${profile_url}api.php`, {
                    id: id,
                    url: url,
                    post: request.post,
                    user: profile_url,
                    password: password
                }).done(function () {
                    // send a message back to the application with the profile url
                    port.postMessage({
                        type: "add-post",
                        profile_url: profile_url
                    });
                });
            }
        }
    });
});
