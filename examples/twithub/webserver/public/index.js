document.addEventListener('DOMContentLoaded', function () {
    getPosts(null, function (posts) {
        window['renderPosts'](posts);
    });
    setInterval(function () {
        getPosts(null, function (posts) {
            window['renderPosts'](posts);
        });
    }, 1000);
}, false);