import { ComponentExport } from "../../../../lib/types"
import backButton from '../../components/backButton';
import calcCrow from './calcCrow';
let { establishments, ourEstablishmentsText } = require('./establishments');

let page: ComponentExport = ({ db }) => {
    return {
        id: "contacts",
        actions: {
            async main({ data }) {
                // Send welcome message
                let action = 'update';
                if (data == 'send_message') {
                    this.clearChat();
                    action = 'send';
                }
                this[action]({
                    text: ourEstablishmentsText,
                    buttons: [
                        [{ text: '🌐 Our Site', url: 'https://github.com/powerdot/Telegram-Bot-Framework' }],
                        [
                            { text: '💙 Twitter', url: 'https://twitter.com/' },
                            { text: '💜 Discord', url: 'https://discord.com/' },
                        ],
                        [{ text: '📍 Find Nearest to You', action: 'nearest' }],
                        backButton
                    ]
                })
            },
            nearest: {
                async handler() {
                    await this.clearChat()
                    await this.send({
                        text: `Ok, now send your location to me.`,
                        keyboard: [
                            [{ text: '👆 Send location', request_location: true }],
                            [{ text: 'Back' }]
                        ]
                    })
                },
                async messageHandler({ text, location }) {
                    if (text === 'Back') {
                        return this.goToAction({ action: 'main', data: 'send_message' });
                    }
                    if (!location) return false;
                    let nearest = establishments.reduce((prev, curr) => {
                        let distance = calcCrow(location.latitude, location.longitude, curr.geo[0], curr.geo[1]);
                        if (!prev || distance < Object(prev)?.distance) {
                            return {
                                distance,
                                establishment: curr
                            }
                        }
                        return prev;
                    }, null);

                    await this.clearChat();
                    if (!nearest) {
                        return this.send({
                            text: `Sorry, no coffee shops near you.`
                        })
                    } else {
                        return this.send({
                            text: `🌐 <b>Coffee Brøs <i>in ${Object(nearest)?.establishment.location}</i></b>\n🕓 ${Object(nearest)?.establishment.days + ': ' + Object(nearest)?.establishment.hours}\n📞 <a href="tel:${Object(nearest)?.establishment.phone}">${Object(nearest)?.establishment.full_phone}</a>\n📍 <a href="${Object(nearest)?.establishment.address_link}">${Object(nearest)?.establishment.address}</a>`,
                            buttons: [
                                [{ text: '◀️ Back', action: 'main' }],
                            ]
                        })
                    }
                }
            }
        }
    }
}

module.exports = page;