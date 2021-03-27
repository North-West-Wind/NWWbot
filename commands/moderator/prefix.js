const { genPermMsg } = require("../../function");
const { NorthClient } = require("../../classes/NorthClient.js");
const { ApplicationCommand, ApplicationCommandOption, ApplicationCommandOptionType, InteractionResponse } = require("../../classes/Slash");

module.exports = {
    name: "prefix",
    description: "Change the prefix of the server.",
    usage: "[prefix]",
    category: 1,
    aliases: ["pre"],
    permission: 32,
    slashInit: true,
    register: () => ApplicationCommand.createBasic(module.exports).setOptions([
        new ApplicationCommandOption(ApplicationCommandOptionType.STRING.valueOf(), "prefix", "A new prefix.")
    ]),
    async slash(client, interaction, args) {
        if (!interaction.guild_id) return InteractionResponse.sendMessage("This command only works on server.");
        const guild = await client.guilds.fetch(interaction.guild_id);
        const member = await guild.members.fetch(interaction.member.user.id);
        if (!args[0]?.value) return InteractionResponse.sendMessage(`The prefix of this server is \`${NorthClient.storage.guilds[guild.id].prefix || client.prefix}\`. Use \`/prefix [prefix]\` to change the prefix.`);
        if (!member.hasPermission(this.permission)) return InteractionResponse.sendMessage(genPermMsg(this.permission, 0));
        NorthClient.storage.guilds[guild.id].prefix = args.join(" ");
        try {
            await client.pool.query(`UPDATE servers SET prefix = ${NorthClient.storage.guilds[guild.id].prefix === client.prefix ? "NULL" : `'${NorthClient.storage.guilds[guild.id].prefix}'`} WHERE id = '${guild.id}'`);
            return InteractionResponse.sendMessage(`The prefix of this server has been changed to \`${NorthClient.storage.guilds[guild.id].prefix}\`.`);
        } catch (err) {
            NorthClient.storage.error(err);
            return InteractionResponse.reply("there was an error trying to save the changes! The change of the prefix will be temporary!");
        }
    },
    async execute(message, args) {
        if (!args[0]) return await message.channel.send(`The prefix of this server is \`${message.prefix}\`. Use \`${message.prefix}prefix [prefix]\` to change the prefix.`);
        if (!message.member.hasPermission(this.permission)) return await message.channel.send(genPermMsg(this.permission, 0));
        NorthClient.storage.guilds[message.guild.id].prefix = args.join(" ");
        await message.channel.send(`The prefix of this server has been changed to \`${NorthClient.storage.guilds[message.guild.id].prefix}\`.`);
        try {
            await message.pool.query(`UPDATE servers SET prefix = ${NorthClient.storage.guilds[message.guild.id].prefix === message.client.prefix ? "NULL" : `'${NorthClient.storage.guilds[message.guild.id].prefix}'`} WHERE id = '${message.guild.id}'`);
            await message.channel.send("Changes have been saved properly!");
        } catch (err) {
            NorthClient.storage.error(err);
            await message.reply("there was an error trying to save the changes! The change of the prefix will be temporary!");
        }
    }
}