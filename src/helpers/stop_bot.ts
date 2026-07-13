type StoppableBot = {
    stop(signal?: string): void;
};

function stopBot(bot: StoppableBot, signal?: string): void {
    try {
        bot.stop(signal);
    } catch (error) {
        if (error instanceof Error && error.message === "Bot is not running!") return;
        throw error;
    }
}

export { stopBot };
