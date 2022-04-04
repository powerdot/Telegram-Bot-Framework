import { Component } from "../../../src"

module.exports = Component(({ db }) => {
    return {
        id: "index",
        actions: {
            async main() {
                await this.clearChat();

                // Check for user's booking
                let user_booking = await db.user.collection(this.ctx, 'booking').findAll({});
                let bookings_button = [];
                if (user_booking.length > 0) bookings_button.push([{ text: "📋 My Bookings", page: "bookings" }]);

                // Send welcome message
                this.send({
                    text: `☕️ Hey!\nWelcome to CoffeeBrøs.`,
                    buttons: [
                        [{ text: "🥐 Our Menu", page: "menu" }],
                        [{ text: "✍️ Book a Table", page: "book" }],
                        ...bookings_button,
                        [{ text: "🖼 Gallery", page: "gallery" }],
                        [{ text: "📍 Contacts", page: "contacts" }],
                    ]
                })
            },
        }
    }
});