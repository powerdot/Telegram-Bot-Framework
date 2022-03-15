let moment = require("moment");
const config = require('../../config.js');
let db = require("./db");
let page = require("../paginator");
let axios = require("axios").default;

let kb = {
    main_menu: async function (ctx, user_params) {
        let default_params = {
            action_text: undefined,
            replace_secret_url_token: true
        }
        let params = { ...default_params, ...user_params };
        // основываемся на группу пользователя
        let user_group = await db.users.group.get(ctx);
        // console.log("🙆‍♂️",user_group);

        let selected_menu = config.menus[user_group];

        // генерируем меню из конфига
        let menu_lines = selected_menu.structure;
        let url_replace_with_secret_token = params.replace_secret_url_token;
        let menu = [];
        for (let line of menu_lines) {
            let current_line_i = menu.push([]) - 1;
            let current_line = menu[current_line_i];
            for (let cell of line) {
                let item = {
                    text: await buttonReplacements(ctx, cell.text, cell)
                };
                if (cell.page_id) item.callback_data = cell.page_id;
                if (cell.url) {
                    item.url = await convertUrl(ctx, cell.url, url_replace_with_secret_token);
                    item.hide_url = true;
                    url_replace_with_secret_token = false;
                }
                current_line.push(item);
            }
        }


        // Shop id and name

        // let shop_id = await db.getValue(ctx, 'shop_id');
        // let shop_name = await db.getValue(ctx, 'shop_name');

        if (user_group == 'franchise') {
            let selected_shop_name = await db.getValue(ctx, "selected_shop_name");
            if (selected_shop_name) {
                menu.push([{ text: selected_shop_name, callback_data: 'SELECT_SHOP' }]);
            } else {
                menu.push([{ text: '- не настроен -', callback_data: 'SELECT_SHOP' }]);
            }
        }

        // локализация и модифицированный текст

        if (params.action_text) {
            if (params.action_text == 'welcome') params.action_text = selected_menu.welcome_text;
            if (params.action_text == 'cancel') params.action_text = selected_menu.cancel_text;
            params.action_text = await replacements(ctx, params.action_text);
        }

        return params.action_text ? { action_text: params.action_text, menu } : menu;
    },
    places: function () {
        let places_buttons = [];
        for (let place_i in config.places) {
            let place = config.places[place_i];
            places_buttons.push([{ text: "📍 " + place.name, callback_data: `SELECT_HOMEPLACE-set-${place_i}` }]);
        }
        places_buttons.push([{ text: '🧭 Найти ближайшее', callback_data: 'SELECT_HOMEPLACE-find_nearest' }])
        places_buttons.push([{ text: 'Вернуться обратно', callback_data: 'cancel' }])
        return places_buttons;
    },
    feedback: {
        stars: function (amount, selected) {
            let star = "⭐️";
            let star_selected = "🌟";
            let stars = [[]];
            let star_prefix = "LEAVE_FEEDBACK-star-";
            for (let i = 1; i < amount + 1; i++) {
                stars[0].push({ text: i > selected ? star : star_selected, callback_data: `${star_prefix}${i}` });
            }
            return stars;
        },
        no_comment: function () {
            return [
                [{ text: 'Оставить без отзыва', callback_data: 'LEAVE_FEEDBACK-no_comment' }],
                [{ text: 'Отмена', callback_data: 'cancel' }]
            ];
        }
    },

    /**
     * Отдает при первом вызове клавиатуру таймтейбл
     * @param {*} ctx 
     * @param {*} date 
     */
    time: async function (ctx, date) {
        await db.setValue(ctx, "BOOKING-selected_hour", "");
        await db.setValue(ctx, "BOOKING-selected_minute", "");
        let timetable = await kb.time_keyboard._create_timetable(ctx, date, 0);
        // console.log(timetable);
        return timetable;
    },
    time_keyboard: {
        usage_data: {},
        pagination: {
            step: 4,
        },
        time_step: 15,
        filler: { text: '	 ', callback_data: 'none' },
        generate_default_append: async (ctx) => {
            let selected_hour = await db.getValue(ctx, "BOOKING-selected_hour");
            let selected_minute = await db.getValue(ctx, "BOOKING-selected_minute");
            let build = [
                [{ text: '⬅️ Обратно', callback_data: 'BOOKING' }],
                [{ text: '❌ Отмена', callback_data: 'cancel' }]
            ];
            if (selected_hour != '' && selected_minute != '') {
                build[0].push({ text: '✅ Дальше', callback_data: 'BOOKING-time_done' });
            } else {
                build[0].push(kb.time_keyboard.filler);
            }
            return build;
        },

        /**
         * Возвращает всю необходимую информацию для рендера времени по дате и ctx
         */
        _get_place_data: async (ctx, date) => {
            let r = {};
            r.place_id = await db.getValue(ctx, 'home_place');
            r.place = config.places[r.place_id];
            r.place_hours = r.place.work_time;
            r.weekday = moment(date).day();
            r.hours_range = r.place_hours[r.weekday];
            // console.log('r.hours_range:',r.hours_range);
            r.time_step_minutes = kb.time_keyboard.time_step;
            r.first_hour = moment(date).hours(r.hours_range[0].split(":")[0]).minutes(r.hours_range[0].split(":")[1]);
            r.last_hour = moment(date).hours(r.hours_range[1].split(":")[0]).minutes(r.hours_range[1].split(":")[1]);
            if (r.last_hour < r.first_hour) r.last_hour.add(1, 'day');
            r.hours_array = [];
            r.minutes_array = [];
            for (let current_hour = r.first_hour.clone(); current_hour < r.last_hour; current_hour.add(r.time_step_minutes, 'minutes')) {
                if (current_hour.unix() < moment().add(1, 'hour').unix()) continue;
                let hour = current_hour.format('YYYY-MM-DD') + "/" + ('0' + current_hour.hour()).slice(-2);
                let minute = ('0' + current_hour.minute()).slice(-2);
                if (r.hours_array.indexOf(hour) == -1) r.hours_array.push(hour);
                if (r.minutes_array.indexOf(minute) == -1) r.minutes_array.push(minute);
            }
            r.minutes_array = r.minutes_array.sort();
            return r;
        },
        controller: async (ctx, next) => {
            if (ctx.updateType != 'callback_query') return next();
            let data = ctx.update.callback_query.data.split("-");
            if (data[0] == 'timekeyboard_show') {
                let to_offset = data[1];
                let date = data[2].replace(/\./g, '-');
                // console.log('to_offset',to_offset, 'date',date)
                let timetable = await kb.time_keyboard._create_timetable(ctx, date, to_offset);

                // console.log(timetable, ctx.update.callback_query.message.text);
                return ctx.editMessageText(ctx.update.callback_query.message.text, { reply_markup: { inline_keyboard: timetable } });
            }

            if (data[0] == 'timekeyboard_select') {
                //  console.log('data',data)
                let date = data[1].replace(/\./g, '-');
                let type = data[2];
                let value = data[3];
                let to_offset = data[4];
                if (type == 'hour') {
                    await db.setValue(ctx, 'BOOKING-selected_hour', value);
                    await db.setValue(ctx, 'BOOKING-selected_date', date);
                }
                if (type == 'minute') {
                    await db.setValue(ctx, 'BOOKING-selected_minute', value);
                }

                let timetable = await kb.time_keyboard._create_timetable(ctx, await db.getValue(ctx, "BOOKING-preselected_date"), to_offset);

                let selected_hour = await db.getValue(ctx, "BOOKING-selected_hour");
                let selected_minute = await db.getValue(ctx, "BOOKING-selected_minute");
                let selected_date = await db.getValue(ctx, "BOOKING-selected_date");

                let reply_text = ctx.update.callback_query.message.text;
                if (selected_hour != "" && selected_minute != "") reply_text = `Вы выбрали 🗓 ${moment(selected_date).locale('ru').format('DD MMMM')} в ${selected_hour}:${selected_minute}.\nЧтобы продолжить, пожалуйста, нажмите ✅ Дальше`;

                return ctx.editMessageText(reply_text, { reply_markup: { inline_keyboard: timetable } });
            }

            return next();
        },

        /**
         * Создает и возвращает таймтейбл исходя из всех параметров
         */
        _create_timetable: async (ctx, date, offset) => {
            if (!offset) offset = 0;
            if (offset < 0) offset = 0;
            offset = parseInt(offset);
            let data = await kb.time_keyboard._get_place_data(ctx, date);

            // console.log("_create_timetable",  date, offset);

            //формируем часы и минуты 
            let hours = data.hours_array;
            let minutes = data.minutes_array;

            //создаем чистый timetable 
            let timetable = await kb.time_keyboard._generate_timetable(ctx, hours.slice().splice(offset, kb.time_keyboard.pagination.step), minutes, date, offset);

            //добавляем кнопки вверх, вниз и доп. функции если есть
            let there_is_hours_after = false;
            let hours_left = hours.slice().splice(offset + kb.time_keyboard.pagination.step, kb.time_keyboard.pagination.step); //есть ли время которое может быть отображено ниже, в будущем
            if (hours_left.length > 0) there_is_hours_after = true;
            let there_is_hours_before = false;
            if (offset != 0) there_is_hours_before = true;
            timetable = kb.time_keyboard._modify_timetable({
                timetable,
                there_is_hours_after,
                there_is_hours_before,
                current_time_offset: offset,
                after_postfix: await kb.time_keyboard.generate_default_append(ctx),
                date,
                place_id: data.place_id
            });

            return timetable;
        },

        /**
         * Генерирует просто таймтейбл необходимого размера 
         */
        _generate_timetable: async (ctx, hours_array, minutes_array, date, offset) => {
            if (hours_array.length < kb.time_keyboard.pagination.step) hours_array.push(...Array.apply(null, Array(kb.time_keyboard.pagination.step - hours_array.length)).map(x => x = kb.time_keyboard.filler))
            let max_array_len = minutes_array.length > hours_array.length ? minutes_array.length : hours_array.length;
            let need_to_push_to_hours = max_array_len - hours_array.length;
            let need_to_push_to_minutes = max_array_len - minutes_array.length;

            //замена на выбранное время
            let selected_hour = await db.getValue(ctx, "BOOKING-selected_hour");
            let selected_minute = await db.getValue(ctx, "BOOKING-selected_minute");

            for (; ;) {
                if (need_to_push_to_hours > 0) { hours_array.push(kb.time_keyboard.filler); need_to_push_to_hours-- }
                if (need_to_push_to_hours > 0) { hours_array.unshift(kb.time_keyboard.filler); need_to_push_to_hours-- }
                if (need_to_push_to_minutes > 0) { minutes_array.push(kb.time_keyboard.filler); need_to_push_to_minutes-- }
                if (need_to_push_to_minutes > 0) { minutes_array.unshift(kb.time_keyboard.filler); need_to_push_to_minutes-- }
                if (need_to_push_to_hours == 0 && need_to_push_to_minutes == 0) { break; }
            }




            let times = [
                hours_array.map(function (x, i, array) {
                    if (x != kb.time_keyboard.filler) {
                        let cur_date = x.split('/')[0];
                        let cur_hour = x.split('/')[1];
                        return {
                            text: (cur_hour === selected_hour ? num_to_emoji(cur_hour) : cur_hour).toString(),
                            callback_data: kb.time_keyboard._callback_select_constructor(cur_date, 'hour', cur_hour, offset)
                        }
                    } else {
                        return x
                    }
                }),
                Array.apply(null, Array(hours_array.length)).map(x => x = kb.time_keyboard.filler),
                minutes_array.map(function (x) { if (x != kb.time_keyboard.filler) { return { text: (x === selected_minute ? num_to_emoji(x) : x).toString(), callback_data: kb.time_keyboard._callback_select_constructor(date, 'minute', x, offset) } } else { return x } }),
            ];
            let trans_times = times[0].map((col, i) => times.map(row => row[i]));

            return trans_times;
        },

        /**
         * Добавляет функциональность в таймтейбл - стрелочки и тд
         */
        _modify_timetable: (user_params) => {
            let default_params = {
                timetable: [],
                there_is_hours_after: false,
                there_is_hours_before: false,
                after_postfix: [],
                current_time_offset: 0,
                date: '01-02-2010'
            }
            let params = { ...default_params, ...user_params };
            // console.log("params", params)

            let prefix = [[{ text: 'Часы', callback_data: 'none' }, { text: ':', callback_data: 'none' }, { text: 'Минуты', callback_data: 'none' }]];
            let postfix = [];

            let down_callback = kb.time_keyboard._callback_constructor(parseInt(params.current_time_offset) - parseInt(kb.time_keyboard.pagination.step), params.date);
            if (params.there_is_hours_before) prefix.push([{ text: '⬆️', callback_data: down_callback }, ...Array.apply(null, Array(2)).map(x => x = kb.time_keyboard.filler)]);
            if (!params.there_is_hours_before) prefix.push([...Array.apply(null, Array(3)).map(x => x = kb.time_keyboard.filler)]);

            let up_callback = kb.time_keyboard._callback_constructor(parseInt(params.current_time_offset) + parseInt(kb.time_keyboard.pagination.step), params.date);
            if (params.there_is_hours_after) postfix.push([{ text: '⬇️', callback_data: up_callback }, ...Array.apply(null, Array(2)).map(x => x = kb.time_keyboard.filler)]);
            if (!params.there_is_hours_after) postfix.push([...Array.apply(null, Array(3)).map(x => x = kb.time_keyboard.filler)]);
            postfix.push(...params.after_postfix);

            params.timetable.unshift(...prefix);
            params.timetable.push(...postfix);

            return params.timetable;
        },
        _callback_constructor: (offset, date) => {
            return `timekeyboard_show-${offset}-${date.replace(/-/g, '.')}`;
        },
        _callback_select_constructor: (date, type, value, offset) => {
            return `timekeyboard_select-${date.replace(/-/g, '.')}-${type}-${value}-${offset}`;
        }
    }
}

function roundTime(date, duration, method) {
    duration = moment.duration(duration, "minutes");
    return moment(Math[method]((+date) / (+duration)) * (+duration));
}

function num_to_emoji(num) {
    let numbers = "0️⃣ 1️⃣ 2️⃣ 3️⃣ 4️⃣ 5️⃣ 6️⃣ 7️⃣ 8️⃣ 9️⃣".split(' ');
    return num.toString().split('').map(val => val = numbers[val]).join('')
}

async function replacements(ctx, text) {
    let u = (await db.getValue(ctx, 'user'));
    text = text.replace(/!имя!/g, u.first_name);
    text = text.replace(/!userid!/g, u.id);
    return text;
}

async function buttonReplacements(ctx, text, cell_object) {

    if (cell_object.button_replacements) {
        let replacement_keys = Object.keys(cell_object.button_replacements);
        let replacements = replacement_keys.map(x => { return { search: "!" + x + "!", id: x } });
        for (let replacement of replacements) {
            // console.log('cell_object.button_replacements[replacement.id]:',cell_object.button_replacements[replacement.id]);
            let f_page = page.find({ id: cell_object.button_replacements[replacement.id] });
            if (f_page.notification_status) {
                let page_notification_status = await f_page.notification_status(ctx);
                // console.log('page_notification_status', page_notification_status);

                text = text.replace(new RegExp(replacement.search, "g"), page_notification_status);
            }
        }
    }

    return text;
}

async function convertUrl(ctx, url, replace_secret_url_token) {

}

async function createUrlSecretToken(url) {

}

module.exports = kb;