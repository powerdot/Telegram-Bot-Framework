import { ButtonsRowButton } from "../../../../src/types"
import photos from "./photos";

type localActionData = {
    place: string,
    callback: { page: string, action: string },
    params: { backButton: string }
    move?: string
}

import { Component } from "../../../../src";
module.exports = Component(({ db, parseButtons }) => {

    function buildExitButton({ callback, params }): ButtonsRowButton {
        return { text: params.backButton || "◀️ Back", action: 'exit', data: { callback, params } };
    }

    function buildGalleryButtons({ place, callback, params }) {
        return [
            [
                { text: "⬅️", action: 'update', data: { place, callback, params, move: 'prev' } as localActionData },
                { text: "➡️", action: 'update', data: { place, callback, params, move: 'next' } as localActionData }
            ],
            [{ text: "Look for all 👀", action: "all", data: { place, callback, params } as localActionData }],
            [buildExitButton({ callback, params })]
        ];
    }

    async function galleryButtons({ ctx, id, place, callback, params }) {
        return {
            reply_markup: {
                inline_keyboard: await parseButtons({ ctx, id, buttons: buildGalleryButtons({ place, callback, params }) })
            }
        }
    }

    return {
        id: "gallery_viewer",
        actions: {
            async main({ data }) { // on plugin load
                let _data = data as localActionData;
                let place = _data.place;
                let user = await this.user();
                let user_current_photo = await user.getValue("current_photo_" + place) || 0;
                let show_photo_index = user_current_photo;

                await this.clearChat();
                await this.sendMediaGroup({ media: [{ type: 'photo', media: photos[place][show_photo_index].url }] });
                await this.send({
                    text: `${photos[place][show_photo_index].description}`,
                    buttons: buildGalleryButtons(_data),
                })
            },
            async update({ data }) { // on next/prev
                let _data = data as localActionData;
                console.log("____data", _data);
                let move = _data.move;
                let place = _data.place;

                let user = await this.user();
                let user_current_photo = await user.getValue("current_photo_" + place) || 0;
                let show_photo_index = user_current_photo;

                // set new index for photo to show:
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
                let lastPhotoMessage = lastBotMessages.find(m => 'photo' in m.message);
                let lastTextMessage = lastBotMessages.find(m => 'text' in m.message);

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
                    await galleryButtons({ ctx: this.ctx, id: this.id, ..._data }),
                );
            },
            async all({ data }) {
                let _data = data as localActionData;
                let place = _data.place;
                await this.clearChat();
                await this.sendMediaGroup({ media: photos[place].map(photo => ({ type: 'photo', media: photo.url })) });
                await this.send({
                    text: `All ${place} photos!`,
                    buttons: [[buildExitButton(_data)]]
                });
            },
            async exit({ data }) {
                let _data = data as localActionData;
                let callback = _data.callback;
                await this.clearChat()
                this.goToPage({
                    page: callback.page,
                    action: callback.action || 'main',
                });
            }
        }
    };
})