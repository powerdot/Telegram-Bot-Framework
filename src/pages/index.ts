import { PageExport } from "../../lib/types"

let page: PageExport = ({ db, config, paginator }) => {
    return {
        id: "index",
        name: "Главная страница",
        requirements: [],
        actions: {
            main: {
                clearChat: true,
                async handler({ data }) {
                    let text = `Привет - Привет!`
                    if (data) {
                        text += ` data sum: ${data[0] + data[1]}`
                    }
                    this.send({
                        text,
                        buttons: [
                            [{ text: "меню", action: "menu" }],
                            [{ text: "помощь", action: "help" }],
                            [{ text: "случайные числа", page: "random" }],
                            [{ text: "привет username", page: "name" }],
                            [{ text: "да или нет", page: "yesornot" }],
                            [
                                { text: "storage test", action: "storage" },
                                { text: "+1", action: "plusone" }
                            ],
                            [
                                { text: "str", action: "datatest", data: "asdasdasd" },
                                { text: "num", action: "datatest", data: 23 },
                                { text: "obj", action: "datatest", data: { name: 'sdsdffsdf-sdffsd', id: '33343434' } },
                                { text: "arr", action: "datatest", data: [{ name: 'sdsdfffsd', id: '333434' }] },
                                { text: "bool", action: "datatest", data: true }
                            ],
                        ]
                    })
                }
            },
            async datatest({ data }) {
                this.update({
                    text: "Данные: " + data + ", тип: " + typeof data,
                    buttons: [
                        [{ text: "обратно", action: "main", data: [1, 2] }],
                    ]
                })
            },
            async storage() {
                let user = await this.user();
                await user.setValue("random", Math.random().toString())
                let get = await user.getValue("random")
                console.log('1. user.getValue("random")', get)
                let data = await user.get()
                console.log('2. user.get()', data)
                let users = await user.list()
                console.log('3. user.list()', users)
                this.update({
                    text: "Тест пройден, смотри консоль",
                    buttons: [
                        [{ text: "обратно", action: "main" }],
                    ]
                })
            },
            async plusone() {
                let userData = await this.user();
                let value = (Number(await userData.getValue("plusone")) || 0) + 1
                await userData.setValue("plusone", value)
                this.update({
                    text: "Результат: " + value,
                    buttons: [
                        [
                            { text: "обратно", action: "main" },
                            { text: "+1", action: "plusone" }
                        ],
                    ]
                })
            },
            menu() {
                this.update({
                    text: "Выбери покушать: салат или сыр.",
                    buttons: [
                        [{ text: "назад!", action: "main" }],
                    ]
                })
            },
            help() {
                this.update({
                    text: "Бог тебе в помощь.",
                    buttons: [
                        [{ text: "спасибо!", action: "main" }],
                        [{ text: "в меню", action: "menu" }],
                    ]
                })
            }
        }
    }
}

module.exports = page;