module.exports = ({ db, paginator }) => {
    return async (ctx) => {
        await db.messages.addToRemoveMessages(ctx, ctx.update.message);
        await db.messages.removeMessages(ctx);

        await db.setValue(ctx, "user", ctx.update.message.from);
        await db.setValue(ctx, "step", "main_menu");
        await paginator.clear_requirements_data(ctx); // home_place phone
        await db.setValue(ctx, "last_action", "");
        await db.setValue(ctx, "BOOKING-selected_date", "");
        await db.setValue(ctx, "BOOKING-selected_hour", "");
        await db.setValue(ctx, "BOOKING-selected_minute", "");
        await db.setValue(ctx, 'APIKEY', '');
        await db.setValue(ctx, 'franchise_domain', "");
        await db.setValue(ctx, 'franchise_name', "");
        await db.setValue(ctx, 'user_name', "");
        await db.setValue(ctx, 'shop_name', "");
        await db.setValue(ctx, "next_step", "");
        await db.setValue(ctx, "callback_step", "");
        await db.setValue(ctx, 'selected_shop_name', '');
        await db.setValue(ctx, 'selected_APIKEY', '');
        await db.setValue(ctx, 'selected_franchise_domain', '');
        await db.setValue(ctx, 'selected_franchise_name', '');
        await db.setValue(ctx, 'selected_user_name', '');
        await db.users.group.set(ctx.update.message.from.id, 'main');
    }
}
