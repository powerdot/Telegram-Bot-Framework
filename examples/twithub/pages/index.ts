import { PageExport } from "../../../lib/types"

let page: PageExport = ({ db, config, paginator }) => {
    return {
        id: "index",
        name: "Главная страница",
        actions: {
            main: {
                clearChat: true,
                async handler({ data }) {
                    let text = `Привет - Привет!`
                    if (data) {
                        text += ` data sum: ${data.reduce((a, b) => a + b, 0)}`
                    }
                    this.send({
                        text,
                        buttons: [
                            [{ text: "меню", action: "menu" }],
                            [{ text: "помощь", action: "help" }],
                            [{ text: "случайные числа", page: "random" }],
                            [
                                { text: "привет user", page: "name" },
                                { text: "привет петя", page: "name", data: "петя" }
                            ],
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
                            [
                                { text: "дай цифры", action: "numbers" },
                                { text: "большие данные", action: "testbigdata" },
                            ]
                        ]
                    })
                }
            },
            numbers: {
                async handler() {
                    this.update({
                        text: "Отправь мне цифорки)"
                    })
                },
                async messageHandler({ text }) {
                    if (text === undefined) {
                        this.update({
                            text: `ХОЧУ ЦИФОРКИ 😭`,
                            buttons: [
                                [
                                    { text: "... выйти", action: "main" }
                                ]
                            ]
                        })
                    } else {
                        let is_number = /^\d+$/.test(text)
                        this.update({
                            text: `Ты отправил ${text} - это ${is_number ? 'то шо нужно:))' : 'НЕ цифра('}\nМожешь отправить еще раз или...`,
                            buttons: [
                                [
                                    { text: "... выйти", action: "main" }
                                ]
                            ]
                        })
                    }
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
                await user.setValue("random", Math.random())
                await user.setValue("keked", { kek: true })
                let get = await user.getValue("random")
                console.log('1. user.getValue("random")', get)
                let get_keked = await user.getValue("keked")
                console.log('1.1. user.getValue("keked")', get_keked)
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
            },
            testbigdata() {
                this.clearChat()
                this.goToAction({ action: "main", data: [1, 2, 3, 4, 5, 6, 7, 8, 9, 1, 2, 3, 4, 5, 6, 7, 8, 1, 2, 3, 4, 5, 6, 7, 8, 9, 1, 2, 3, 4, 5, 6, 7, 8, 9, 1, 2, 3, 4, 5, 6, 7, 8, 9] })
            }
        }
    }
}

module.exports = page;