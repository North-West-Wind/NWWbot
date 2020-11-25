const { genPermMsg } = require("../function");

module.exports = {
    name: "prefix",
    description: "Change the prefix of the server.",
    usage: "[prefix]",
    category: 1,
    aliases: ["pre"],
    permission: 32,
    execute(message, args) {
        if (!args[0]) return await message.channel.send(`The prefix of this server is \`${message.prefix}\`. Use \`${message.prefix}prefix [prefix]\` to change the prefix.`);
        if (!message.guild) return await message.channel.send("You are not in a server!");
        if (!message.member.hasPermission(this.permission)) return await message.channel.send(genPermMsg(this.permission, 0));
        console.prefixes[message.guild.id] = args.join(" ");
        await message.channel.send(`The prefix of this server has been changed to \`${console.prefixes[message.guild.id]}\`.`);
        try {
            await message.pool.query(`UPDATE servers SET prefix = ${console.prefixes[message.guild.id] === message.client.prefix ? "NULL" : `'${console.prefixes[message.guild.id]}'`} WHERE id = '${message.guild.id}'`);
            await message.channel.send("Changes have been saved properly!");
            console.log(`Changed prefix of ${message.guild.name} to ${console.prefixes[message.guild.id]}`);
        } catch(err) {
            console.error(err);
            await message.reply("there was an error trying to save the changes! The change of the prefix will be temporary!");
        }
    }
}