module.exports = ({ db }) => {
    return async (oldfunction, ctx, args) => {
        let first_arg = args[0];
        let specialFunctions = ['delete'];
        let specialFunction = specialFunctions.filter(x => x == first_arg)[0];
        args = Array.from(args);
        if (specialFunction) args = args.slice(1);
        let a = await oldfunction.apply(null, args);
        switch (specialFunction) {
            case "delete":
                db.messages.addToRemoveMessages(ctx, a, true);
                break;
            default:
                break;
        }
        if (!specialFunction) db.messages.addToRemoveMessages(ctx, a, false);
        return a;
    }
}