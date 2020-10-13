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
chrome.runtime.onConnect.addListener(function (port) {
    port.onMessage.addListener(async function (request) {
        if (request.type === 'add-post') {
            if (window.confirm(`Confirm add post`)) {
                let url = await getPageUrl();
                let id = new Date().getTime();
                let profile_url = localStorage.getItem("profile_url");
                let password = localStorage.getItem("password");
                $.post(`${profile_url}api.php`, {
                    id: id
                    , url: url
                    , post: request.post
                    , user: profile_url
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
    });
});