const { genPermMsg } = require("../function");
const { NorthClient } = require("../classes/NorthClient.js");

module.exports = {
    name: "prefix",
    description: "Change the prefix of the server.",
    usage: "[prefix]",
    category: 1,
    aliases: ["pre"],
    permission: 32,
    async execute(message, args) {
        if (!args[0]) return await message.channel.send(`The prefix of this server is \`${message.prefix}\`. Use \`${message.prefix}prefix [prefix]\` to change the prefix.`);
        if (!message.guild) return await message.channel.send("You are not in a server!");
        if (!message.member.hasPermission(this.permission)) return await message.channel.send(genPermMsg(this.permission, 0));
        NorthClient.storage.guilds[message.guild.id].prefix = args.join(" ");
        await message.channel.send(`The prefix of this server has been changed to \`${NorthClient.storage.guilds[message.guild.id].prefix}\`.`);
        try {
            await message.pool.query(`UPDATE servers SET prefix = ${NorthClient.storage.guilds[message.guild.id].prefix === message.client.prefix ? "NULL" : `'${NorthClient.storage.guilds[message.guild.id].prefix}'`} WHERE id = '${message.guild.id}'`);
            await message.channel.send("Changes have been saved properly!");
            NorthClient.storage.log(`Changed prefix of ${message.guild.name} to ${NorthClient.storage.guilds[message.guild.id].prefix}`);
        } catch(err) {
            NorthClient.storage.error(err);
            await message.reply("there was an error trying to save the changes! The change of the prefix will be temporary!");
        }
    }
}