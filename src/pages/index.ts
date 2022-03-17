import { PageExport } from "../../lib/types"

let page: PageExport = ({ db, config, paginator }) => {
    return {
        id: "index",
        name: "Главная страница",
        requirements: [],
        actions: {
            main: {
                clearChat: true,
                async handler() {
                    this.send({
                        text: "Привет - привет!",
                        buttons: [
                            [{ text: "меню", action: "menu" }],
                            [{ text: "помощь", action: "help" }],
                            [{ text: "случайные числа", page: "random" }],
                            [{ text: "привет username", page: "name" }],
                            [{ text: "да или нет", page: "yesornot" }],
                            [{ text: "storage test", action: "storage" }],
                        ]
                    })
                }
            },
            async storage() {
                await this.user().setValue("random", Math.random().toString())
                let get = await this.user().getValue("random")
                console.log('1. this.user().getValue("random")', get)
                let data = await this.user().get()
                console.log('2. this.user().get()', data)
                let users = await this.user().list()
                console.log('3. this.user().list()', users)
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