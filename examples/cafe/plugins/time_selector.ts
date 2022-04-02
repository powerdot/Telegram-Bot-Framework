import { ComponentExport } from "../../../src/types"
import backButton from "../components/backButton";

let page: ComponentExport = () => {
    return {
        id: "time_selector",
        actions: {
            async main({ data }) {
                // data -> { callback: { page: 'book', action: 'time_set' } }
                let available_times = [];
                for (let i = 12; i < 18; i += 1) {
                    let row = [];
                    for (let j = 0; j < 3; j++) {
                        row.push({
                            text: `${i}:${j * 2}0`,
                            action: 'time_selected',
                            data: { ...Object(data), time: `${i}:${j * 2}0` }
                        });
                    }
                    available_times.push(row)
                }

                this.update({
                    text: `What time do you want to book?`,
                    buttons: [...available_times, backButton]
                });
            },
            time_selected({ data }) {
                let _data = Object(data);
                // data -> { callback: { page: 'book', action: 'time_set' }, time: '?' }
                this.goToPage({
                    page: _data.callback.page,
                    action: _data.callback.action,
                    data: _data.time
                })
            }
        }
    };
}

module.exports = page;