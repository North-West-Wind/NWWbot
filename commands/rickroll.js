const Discord = require("discord.js");
const { findUser, wait } = require("../function");
module.exports = {
    name: "rickroll",
    description: "It's rickroll. What's your question?",
    usage: "[user | user ID]",
    aliases: ["rr"],
    async execute(message, args) {
        const attachment = new Discord.MessageAttachment("https://inviterick.com/rick.gif", "rick.gif");
        if (!args[0]) return await message.channel.send(attachment);
        const user = await findUser(message, args[0]);
        if (!user) return;
        await message.channel.send(`Hey! ${user}`);
        await wait(5000);
        await message.channel.send(attachment);
    }
}