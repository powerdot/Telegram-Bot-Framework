let config = require('../../config');
let db = require('./db');
let keyboard_builder = require('./keyboard_builder');

let exp = {
    bot: undefined,


    getAllAdmins: async function (home_place) {
        // let db_admins = (await db.users.group.getAllByGroup('admin')).map(x=>x.user_id);
        // let db_super_admins = (await db.users.group.getAllByGroup('super_admin')).map(x=>x.user_id);
        // let config_admins = Object.keys(config.users);
        // let admins = [];
        // for(let config_admin of config_admins){
        //     let perm_type = config.users[config_admin];
        //     if(perm_type=='admin' || perm_type == 'super_admin') admins.push(config_admin);
        // }
        // admins = [...admins,...db_admins,...db_super_admins];
        // // console.log('users.GetAllAdmin:',admins)

        // let selected_admins = [];
        // for(let admin of admins){
        //     let r = await db.getValue(admin, 'home_place');
        //     if(home_place){
        //         if(r == home_place) selected_admins.push(admin);
        //     }else{
        //         selected_admins.push(admin);
        //     }
        // }
        // // console.log('http api booking/done|','selected_admins',selected_admins)

        // selected_admins = selected_admins.map(x=>x = parseInt(x));

        // return selected_admins;
    },
    updateMessages: async function (users_list) {
        for (let user of users_list) {
            let last_message = await db.messages.bot.getLastMessage(user);
            await exp.bot.telegram.editMessageText(user, last_message.message.message_id, last_message.message.message_id, last_message.message.text, { reply_markup: { inline_keyboard: await keyboard_builder.main_menu(user, { replace_secret_url_token: false }) } });
        }
    },
    sendMessages: async function (users_list, text, remove_old_messages) {
        for (let user of users_list) {
            if (remove_old_messages) {
                await db.messages.removeMessages(user);
            }
            //
            let sent = await exp.bot.telegram.sendMessage(user, text, { reply_markup: { inline_keyboard: await keyboard_builder.main_menu(user) } });//{replace_secret_url_token: false}
            // console.log("SENT MESSAGE:", sent)
            await db.messages.addToRemoveMessages(user, sent);
        }
    }
}

module.exports = exp;