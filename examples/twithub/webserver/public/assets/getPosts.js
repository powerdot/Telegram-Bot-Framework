function getPosts(user_id, cb) {
    var xhr = new XMLHttpRequest();
    let url = '/api/posts/' + (user_id ? '?chatId=' + user_id : '');
    xhr.open('GET', url, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && xhr.status === 200) {
            var data = JSON.parse(xhr.responseText);
            cb(data);
        }
    }
    xhr.send();
}