function getRandome(randomes) {
    for (; ;) {
        let rnd_i = parseInt(randomes.length * Math.random());
        let val = randomes[rnd_i];
        if (randomes[rnd_i]) {
            val = randomes[rnd_i].toString();
            delete randomes[rnd_i]
            return val;
            break;
        }
    }
}


module.exports = function () {
    let what = "";

    let tastes = {
        intro: ['Предлагаю взять', "Советую попробовать", "Настаиваю:", 'Давай сегодня', 'Может быть', 'Советую взять', 'Наставиваю взять', 'Возьми сегодня', 'Предлагаю попробовать', 'Настаиваю попробовать', 'Значит так... Записывай:'],
        only: ['в чистую', 'просто', 'чистоганчиком'],
        sweet: ['грушу', 'дыню', 'сладкий ананас', 'что-нибудь сладенькое', 'сладкий грейп', 'виноград', 'банан', 'эпл кенди'],
        sour: ['лимон', 'вишню', 'танж мимон', 'мандарин', 'лайм', 'фейхоа', 'клюкву'],
        fresh: ['немного холодка', 'маленько мяты', 'чуть-чуть свежести'],
        rare: ['может добавить немного имбиря', 'может быть чуть-чуть бергамота не помешает', 'немного астроти', 'щепотку корицы']
    }

    let taste_kombo = [['only', 'sweet', ' и ', 'fresh'], ['only', 'sour', ' и ', 'fresh'], ['sweet', ' и ', 'sour'], ['sweet', ', ', 'sweet', ' и ', 'sour'], ['sweet', ', ', 'sweet', 'и', 'fresh'], ['sweet', ', ', 'sour', 'и', 'fresh'], ['sour', ', ', 'sour', 'и', 'fresh'], ['sweet', ', ', 'sour', ' и ', 'rare'], ['sweet', ' и ', 'rare']]

    let random_taste = taste_kombo[parseInt(taste_kombo.length * Math.random())]
    random_taste.unshift('intro');

    for (let t of random_taste) {
        let randomes = tastes[t];
        let randome;
        if (randomes) {
            randome = getRandome(randomes);
        } else {
            randome = t;
        }
        what += randome + " ";
    }

    what = what.replace(/ ,/g, ',').replace(/  /g, ' ');

    return (what);
}
