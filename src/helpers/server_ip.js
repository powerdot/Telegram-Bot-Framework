export default function () {
    return new Promise(function (resolve, reject) {
        require('dns').lookup(require('os').hostname(), function (err, add, fam) {
            resolve(add);
        });
    });
}