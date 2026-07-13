type StoppableBot = {
    stop(signal?: string): void;
};
declare function stopBot(bot: StoppableBot, signal?: string): void;
export { stopBot };
