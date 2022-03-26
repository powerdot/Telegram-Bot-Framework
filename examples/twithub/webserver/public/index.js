document.addEventListener('DOMContentLoaded', function () {
    getPosts(null, function (posts) {
        window['renderPosts'](posts);
    })
}, false);