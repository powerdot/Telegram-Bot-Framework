"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stopBot = stopBot;
function stopBot(bot, signal) {
    try {
        bot.stop(signal);
    }
    catch (error) {
        if (error instanceof Error && error.message === "Bot is not running!")
            return;
        throw error;
    }
}
//# sourceMappingURL=stop_bot.js.map