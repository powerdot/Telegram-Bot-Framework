document.addEventListener('DOMContentLoaded', function () {
    let chatId = document.location.hash.replace('#', '');
    getPosts(chatId, function (posts) {
        window['renderPosts'](posts);
    })
}, false);