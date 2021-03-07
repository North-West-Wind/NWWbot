const { NorthClient } = require("../classes/NorthClient.js");
const functions = require("../function");

module.exports = {
    name: "debug",
    description: "Developer debugging command.",
    category: 10,
    async execute(message, args) {
        NorthClient.storage.log(await (Object.getPrototypeOf(async function () { }).constructor("message", "args", "functions", args.join(" ")))(message, args, functions));
    }
}