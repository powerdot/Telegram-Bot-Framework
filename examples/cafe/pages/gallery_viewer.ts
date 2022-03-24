import { ComponentExport, ButtonsRowButton } from "../../../lib/types"
import photos from "../components/photos";
let backToCategoriesButton: ButtonsRowButton = { text: "◀️ Back to Categories", page: "gallery", data: 'clearall' };

let page: ComponentExport = ({ db, parseButtons }) => {

    function buildGalleryButtons(place) {
        return [
            [
                { text: "⬅️", action: 'main', data: [place, 'prev'] },
                { text: "➡️", action: 'main', data: [place, 'next'] }
            ],
            [{ text: "Look for all 👀", action: "all", data: place }],
            [backToCategoriesButton]
        ];
    }

    function galleryButtons(id, place) {
        return {
            reply_markup: {
                inline_keyboard: parseButtons(id, buildGalleryButtons(place))
            }
        }
    }

    return {
        id: "gallery_viewer",
        actions: {
            async main({ data }) {
                let place = data[0];
                let move = data[1];
                let user = await this.user();
                let user_current_photo = await user.getValue("current_photo_" + place) || 0;
                let show_photo_index = user_current_photo;

                if (!move) {
                    // send (first time)
                    await this.clearChat();
                    await this.send({ images: [photos[place][show_photo_index].url] });
                    await this.send({
                        text: `${photos[place][show_photo_index].description}`,
                        buttons: buildGalleryButtons(place),
                    })
                } else {
                    // update (next/prev)

                    // set new photo index to show
                    if (move == "next") {
                        show_photo_index =
                            user_current_photo < photos[place].length - 1
                                ? user_current_photo + 1
                                : 0;
                    } else if (move == "prev") {
                        show_photo_index =
                            user_current_photo > 0
                                ? user_current_photo - 1
                                : photos[place].length - 1;
                    }
                    await user.setValue("current_photo_" + place, show_photo_index);

                    // get bot messages on screen (to update content)
                    let lastBotMessages = await db.messages.bot.getMessages(this.ctx, 2);
                    let lastPhotoMessage = lastBotMessages.find(m => m.message.photo);
                    let lastTextMessage = lastBotMessages.find(m => m.message.text);

                    // update photo message
                    let ctx = this.ctx;
                    await ctx.telegram.editMessageMedia(
                        ctx.chatId,
                        lastPhotoMessage.messageId,
                        undefined,
                        { type: "photo", media: photos[place][show_photo_index].url },
                    );

                    // update text message
                    await ctx.telegram.editMessageText(
                        ctx.chatId,
                        lastTextMessage.messageId,
                        undefined,
                        photos[place][show_photo_index].description,
                        galleryButtons(this.id, place),
                    );
                }
            },
            async all({ data }) {
                let place = data.toString();
                await this.clearChat();
                await this.send({ images: photos[place].map(photo => photo.url) });
                await this.send({
                    text: `All ${place} photos!`,
                    buttons: [[backToCategoriesButton]]
                });
            }
        }
    };
}

module.exports = page;