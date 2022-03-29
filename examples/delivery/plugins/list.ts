import { ComponentExport, ButtonsRow } from "../../../lib/types"

let page: ComponentExport = ({ db, config, paginator }) => {
    return {
        actions: {
            async main({ data }) {
                let d = Object(data);
                let list = d.list;
                let page = d.page || 0;
                let page_size = d.page_size || 5;
                let page_count = Math.ceil(list.length / page_size);
                if (page >= page_count) page = page_count - 1;
                let footer_buttons = d.footer_buttons || [];
                let message_text = d.text;

                let user = this.user();
                await user.setValue("list_active", list);
                await user.setValue("list_page", page);
                await user.setValue("list_page_size", page_size);
                await user.setValue("list_page_count", page_count);
                await user.setValue("list_footer_buttons", footer_buttons);
                await user.setValue("list_message_text", message_text);

                this.goToAction({ action: "render_list", data: Number(page) });
            },
            no_action({ }) { },
            async render_list({ data }) {
                let user = this.user();
                let list = await user.getValue("list_active");
                let page = Number(data);
                let page_size = await user.getValue("list_page_size");
                let page_count = await user.getValue("list_page_count");
                let list_footer_buttons = await user.getValue("list_footer_buttons") || [];
                let list_message_text = await user.getValue("list_message_text");
                console.log(page, page_size, page_count, data)

                let pagination_buttons: ButtonsRow[] = [];
                let item_buttons: ButtonsRow[] = [];
                let footer_buttons: ButtonsRow[] = [];

                if (page_count > 1) {
                    let p = [];
                    p.push({ text: page == 0 ? "⏺" : "⬅️", action: page == 0 ? "no_action" : "render_list", data: page - 1 });
                    p.push({ text: `${page + 1} / ${page_count}`, action: "no_action" });
                    p.push({ text: page == page_count - 1 ? "⏺" : "➡️", action: page == page_count - 1 ? "no_action" : "render_list", data: page + 1 });
                    pagination_buttons.push(p);
                }

                let items = list.slice(page * page_size, (page + 1) * page_size);
                for (let item of items) {
                    item_buttons.push([
                        { text: item.text, page: item.page, action: item.action, data: [page, item.data] },
                    ]);
                }

                let buttons = [
                    ...pagination_buttons,
                    ...item_buttons,
                    ...footer_buttons,
                    ...list_footer_buttons
                ];

                this.update({
                    text: list_message_text,
                    buttons
                })
            }
        }
    }
}

module.exports = page;