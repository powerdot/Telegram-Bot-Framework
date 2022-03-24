import { PageExport } from "../../../lib/types"
import backButton from "../components/backButton";
let moment = require("moment");

let page: PageExport = ({ db }) => {
    return {
        id: "book",
        actions: {
            main: {
                async handler({ data }) {
                    let user = this.user();
                    let name = await user.getValue("name");
                    let phone = await user.getValue("phone");
                    if (name && phone) {
                        this.update({
                            text: `👋 Glad to see you again, ${name}!\nCheck your name and phone number: ${name}, ${phone}.\n\nIs it correct?`,
                            buttons: [
                                [
                                    { text: "❌", action: "yesornot", data: 'no' },
                                    { text: "✅", action: "yesornot", data: 'yes' },
                                ],
                                backButton
                            ]
                        });
                    } else {
                        this.update({
                            text: `👋 Hey!\nLet's start booking a table${data ? " again" : ''}.\n\nWhat is your name?`,
                            buttons: [backButton]
                        });
                    }
                },
                messageHandler({ text }) {
                    if (!text) return;
                    if (text.length > 20) {
                        this.update({
                            text: `😦 Name is too large!\nTry again.`,
                            buttons: [backButton]
                        });
                        return;
                    }
                    let user = this.user();
                    user.setValue("name", text);
                    this.goToAction({ action: "phone", data: { name: text } });
                }
            },
            async yesornot({ data }) {
                if (data === 'no') {
                    let user = this.user();
                    await user.setValue("name", null);
                    await user.setValue("phone", null);
                    await this.goToAction({ action: "main" });
                } else {
                    await this.goToAction({ action: "date" });
                }
            },
            phone: {
                handler({ data }) {
                    let name = '';
                    if (Object(data).name) name = Object(data).name.toString().trim();
                    this.update({
                        text: `Glad to meet you, ${name}!\n\nWhat is your phone number?`,
                        buttons: [backButton]
                    });
                },
                messageHandler({ text }) {
                    if (!text) return;
                    if (text.length > 20) {
                        this.update({
                            text: `😦 Phone number is too large!\nTry again.`,
                            buttons: [backButton]
                        });
                        return;
                    }
                    if (!text.match(/^\+?\d+$/)) {
                        this.update({
                            text: `😦 Phone number is invalid!\nTry again.`,
                            buttons: [backButton]
                        });
                        return;
                    }
                    let user = this.user();
                    user.setValue("phone", text);
                    this.goToAction({ action: "date" });
                }
            },
            date() {
                let three_days_after_tomorrow = [];
                for (let i = 2; i < 5; i++) {
                    three_days_after_tomorrow.push([{
                        text: moment().add(i, "day").format("DD MMM - ddd"),
                        action: 'time',
                        data: moment().add(i, "day").format("YYYY-MM-DD")
                    }]);
                }
                this.update({
                    text: `What date do you want to book?\n\nToday is ${moment().format("DD.MM.YYYY")}`,
                    buttons: [
                        [{ text: "Today", action: 'time', data: moment().format("YYYY-MM-DD") }],
                        [{ text: "Tomorrow", action: 'time', data: moment().add(1, "day").format("YYYY-MM-DD") }],
                        ...three_days_after_tomorrow,
                        backButton
                    ]
                });
            },
            time({ data }) {
                let user = this.user();
                user.setValue("date", data);

                let available_times = [];
                for (let i = 12; i < 18; i += 1) {
                    let row = [];
                    for (let j = 0; j < 3; j++) {
                        row.push({
                            text: `${i}:${j * 2}0`,
                            action: 'result',
                            data: `${i}:${j * 2}0`
                        });
                    }
                    available_times.push(row)
                }

                this.update({
                    text: `What time do you want to book?`,
                    buttons: [...available_times, backButton]
                });
            },
            async result({ data }) {
                let user = this.user();
                await user.setValue("time", data);
                let name = await user.getValue("name");
                let phone = await user.getValue("phone");
                let date = await user.getValue("date");
                let time = await data;
                this.update({
                    text: `Alright, ${name}!\n\nYour phone number is ${phone}\nYour date is ${date} at ${time}\n\nIs this correct?`,
                    buttons: [
                        [
                            { text: "❌", action: 'main', data: 'again' },
                            { text: "✅", action: 'confirm' },
                        ],
                        backButton
                    ]
                });
            },
            async confirm() {
                let user = this.user();
                let name = await user.getValue("name");
                let phone = await user.getValue("phone");
                let date = await user.getValue("date");
                let time = await user.getValue("time");
                db.user.collection(this.ctx, 'booking').insert({
                    name, phone, date, time
                });
                this.update({
                    text: `We're waiting for you ${moment(date, 'YYYY-MM-DD').format("DD.MM.YYYY")} at ${time}!\n\nThank you!`,
                    buttons: [[
                        { text: "Cool ✨", page: "index" },
                    ]]
                });
            }
        }
    };
}

module.exports = page;