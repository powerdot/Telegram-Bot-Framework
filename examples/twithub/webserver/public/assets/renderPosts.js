(function () {

    let PostComponent = `
    <div class="post">
        <div class='info'>
            <div class='user'>
                <div class='emoji'>[EMOJI]</div>
                <div class='username'>
                    <a href="/u/#[CHATID]">@[CHATID]</a>
                </div>
            </div>
            <div class='datetime'>[DATETIME]</div>
        </div>
        <div class='message'>[MESSAGE]</div>
        <div class='sent_by'>Sent by @powerdot_twithub_bot</div>
    </div>
    `;

    let Emojis = [
        '😇',
        '🙃',
        '😉',
        '😛',
        '🤓',
        '😎',
        '🥳',
        '🤩',
        '😍',
        '😅'
    ]

    function formatDate(createdAt) {
        let d = new Date(createdAt);
        let month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()];
        let day = d.getDate();
        let hour = d.getHours();
        let minute = d.getMinutes();
        return `${day} ${month} ${hour}:${minute}`;
    }

    window['renderPosts'] = function (posts) {
        let postsHolderElement = document.querySelector('.posts');

        let postsNodes = [];
        for (let post of posts) {
            let newPost = PostComponent.toString();
            newPost = newPost.replace(/\[EMOJI\]/g, Emojis[post.chatId % Emojis.length]);
            newPost = newPost.replace(/\[CHATID\]/g, post.chatId);
            newPost = newPost.replace(/\[DATETIME\]/g, formatDate(post.createdAt));
            newPost = newPost.replace(/\[MESSAGE\]/g, post.text);
            postsNodes.push(newPost);
        }
        postsHolderElement.innerHTML = postsNodes.join('');
    }
})()
