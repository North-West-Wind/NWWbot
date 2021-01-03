module.exports = {
    name: "debug",
    description: "Developer debugging command.",
    category: 10,
    async execute(message, args) {
        console.log(await (Object.getPrototypeOf(async function () { }).constructor("message", "args", args.join(" ")))(message, args));
    }
}