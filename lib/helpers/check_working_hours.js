let moment = require("moment");

/**
 * Отдает: сколько осталось времени до открытия или закрытия и статус заведения сейчас
 * @param {Number} place_offset - отклонение времени работы от utc
 * @param {Object} place_work_time_local - Объект распияния работы
 */

function checkForOpen(place_offset, place_work_time_local) {
    place_work_time_local[-1] = place_work_time_local[6];


    let now = moment().utc().add(place_offset, 'hours');
    let working_table = [];
    let working_table_out = {};
    for (let working_day of Object.keys(place_work_time_local)) {
        let wd = now.weekday();
        let open_time = now.clone().add(parseInt(working_day) - wd, 'days').hours(place_work_time_local[working_day][0].split(":")[0]).minutes(place_work_time_local[working_day][0].split(":")[1]);
        let close_time = now.clone().add(parseInt(working_day) - wd, 'days').hours(place_work_time_local[working_day][1].split(":")[0]).minutes(place_work_time_local[working_day][1].split(":")[1]);
        if (close_time < open_time) { close_time.add(1, 'days') }
        working_table.push({ open_time, close_time });
        working_table_out[working_day] = [open_time.format('YYYY-MM-DD HH:mm'), close_time.format('YYYY-MM-DD HH:mm')]
    }

    let res = working_table.filter(x => now >= x.open_time && now < x.close_time)
    // console.log(res)
    let time_left = 0;
    let status;
    if (res.length > 0) { time_left = res[0].close_time.diff(now, 'minutes'); status = 'open' } else { time_left = working_table[now.weekday()].open_time.diff(now, 'minutes'); status = 'closed' }

    return { time_left: { hours: parseInt(time_left / 60), minutes: parseInt(time_left % 60) }, current_status: status };
}

/**
 * Отдает информацию по рабочим часам в человеко-читаемом виде
 * @param {Object} place_work_time_local 
 */

function humanizeWorkingHours(place_work_time_local) {
    let work_time = place_work_time_local;

    let time_groups = [];
    for (let day_i of Object.keys(work_time)) {
        let day = work_time[day_i];
        let found = time_groups.filter(x => x.work_time == day[0] + '-' + day[1]);
        if (found.length == 0) {
            time_groups.push({ work_time: day[0] + '-' + day[1], weekdays: [day_i], human_wd })
        } else {
            found[0].weekdays.push(day_i)
        };
    }

    let stick_to;
    for (let time_group_i in time_groups) {
        let time_group = time_groups[time_group_i];
        if (time_group.weekdays.indexOf('0') > -1 && time_group.weekdays.indexOf('1') > -1) {
            stick_to = time_group_i;
        }
        if (time_group.weekdays.indexOf('0') > -1 && time_group.weekdays.indexOf('6') > -1) {
            stick_to = time_group_i;
            time_group.weekdays[time_group.weekdays.indexOf('0')] = "7";
        }
    }


    time_groups.map(x => x.weekdays.sort((a, b) => a > b ? 1 : -1))

    for (time_group of time_groups) {
        let last_wd = time_group.weekdays[0];
        let human_wd = [moment().weekday(last_wd == "7" ? 0 : last_wd).locale('ru').format('dd')];

        for (let cur_wd of time_group.weekdays) {
            if (Math.abs(parseInt(cur_wd) - parseInt(last_wd)) == 1) {
                last_wd = cur_wd;
            }
        }
        human_wd.push(moment().weekday(cur_wd == "7" ? 0 : cur_wd).locale('ru').format('dd'));
        time_group.human_wd = human_wd;
    }

    return time_groups;
}

module.exports = { checkForOpen, humanizeWorkingHours };