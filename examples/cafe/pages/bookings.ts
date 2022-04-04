import backButton from '../components/backButton';
let moment = require("moment");

import { Component } from "../../../src"
module.exports = Component(({ db }) => {
    return {
        id: "bookings",
        actions: {
            async main({ data }) {
                await this.clearChat();
                // Get user's booking
                let user_booking = await db.user.collection(this.ctx, 'booking').findAll({});

                // Create buttons for last 5 bookings
                let buttons = [];
                let last5 = user_booking.slice(-5);
                for (let booking of last5) {
                    buttons.push([{
                        text: `${moment(booking.date).format("DD.MM")} at ${booking.time}`,
                        action: "info",
                        data: booking._id.toString()
                    }]);
                }
                buttons.push(backButton);

                let text = `${data == 'deleted' ? '♻️ Booking canceled!\n' : ''}🛎 You have ${user_booking.length} ${user_booking.length == 1 ? 'booking' : 'bookings'}.`;
                if (user_booking.length > 5) text += `\nBelow you can see last 5 👇`

                // Send welcome message
                this.send({
                    text,
                    buttons
                })
            },
            async info({ data }) {
                let booking = await db.user.collection(this.ctx, 'booking').find({ _id: data });
                console.log('booking', booking);
                this.update({
                    text: `📅 Booking date: ${moment(booking.date).format("DD.MM")}\n🕒 Time: ${booking.time}\n👋 For: ${booking.name}, ${booking.phone}`,
                    buttons: [
                        [{ text: "❌ Cancel booking", action: "cancel", data: booking._id }],
                        [{ text: "◀️ Back to my bookings", action: "main" }],
                    ]
                })
            },
            async cancel({ data }) {
                let booking = await db.user.collection(this.ctx, 'booking').find({ _id: data });
                this.update({
                    text: `🗑 Are you sure you want to cancel your booking for ${moment(booking.date).format("DD.MM")} at ${booking.time}?`,
                    buttons: [
                        [{ text: "❌ No", action: "info", data: booking._id }, { text: "✅ Yes", action: "cancel_yes", data: booking._id }],
                    ]
                })
            },
            async cancel_yes({ data }) {
                await db.user.collection(this.ctx, 'booking').delete({ _id: data });
                await this.goToAction({ action: "main", data: 'deleted' });
            }
        }
    }
});