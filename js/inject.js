chrome.extension.sendMessage({}, function (response) {
    var readyStateCheckInterval = setInterval(function () {
        if (document.readyState === "complete") {
            clearInterval(readyStateCheckInterval);
            window.addEventListener("message", function (e) {
                // We only accept messages from ourselves
                if (e.source != window) return;
                var port = chrome.runtime.connect({
                    name: "dvo"
                });
                /////////////////////////// ADD POST ///////////////////////////
                if (e.data.type && (e.data.type === "post")) {
                    port.postMessage({
                        type: "add-post"
                        , post: e.data.post
                    });
                    port.onMessage.addListener(function (res) {
                        if (res.type === "add-post") {
                            console.log(res);
                            window.postMessage(res, "*");
                        }
                    });
                }
                /////////////////////////////////////////////////////////////////
            });
        }
    }, 10);
});

function editPost() {}

function deletePost() {}

function readAllPostsForUrl() {}

function readAllPosts() {}