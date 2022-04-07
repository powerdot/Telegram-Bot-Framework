import { Component } from "../../../../src"
import backButton from "../../components/backButton";
let moment = require("moment");

module.exports = Component(() => {
    return {
        id: "date_selector",
        actions: {
            async main({ data }) {
                // data -> { callback: { page: 'book', action: 'date_set' } }
                let three_days_after_tomorrow = [];
                for (let i = 2; i < 5; i++) {
                    three_days_after_tomorrow.push([{
                        text: moment().add(i, "day").format("DD MMM - ddd"),
                        action: 'date_selected',
                        data: { ...Object(data), date: moment().add(i, "day").format("YYYY-MM-DD") }
                    }]);
                }
                this.update({
                    text: `What date do you want to book?\n\nToday is ${moment().format("DD.MM.YYYY")}`,
                    buttons: [
                        [{ text: "Today", action: 'date_selected', data: { ...Object(data), date: moment().format("YYYY-MM-DD") } }],
                        [{ text: "Tomorrow", action: 'date_selected', data: { ...Object(data), date: moment().add(1, "day").format("YYYY-MM-DD") } }],
                        ...three_days_after_tomorrow,
                        backButton
                    ]
                });
            },
            date_selected({ data }) {
                let _data = Object(data);
                // data -> { callback: { page: 'book', action: 'date_set' }, date: '?' }
                this.goToPage({
                    page: _data.callback.page,
                    action: _data.callback.action,
                    data: _data.date
                })
            }
        }
    };
});