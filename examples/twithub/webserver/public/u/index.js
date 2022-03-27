document.addEventListener('DOMContentLoaded', function () {
    let chatId = document.location.hash.replace('#', '');
    getPosts(chatId, function (posts) {
        window['renderPosts'](posts);
    })
    document.querySelector(".accountName").innerHTML = `@${chatId}'s account`;
    setInterval(function () {
        getPosts(chatId, function (posts) {
            window['renderPosts'](posts);
        });
    }, 1000);
}, false);