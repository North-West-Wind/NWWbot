const Discord = require("discord.js");
const { ApplicationCommand, ApplicationCommandOption, ApplicationCommandOptionType, InteractionResponse } = require("../../classes/Slash");
const { findUser, wait } = require("../../function");
module.exports = {
    name: "rickroll",
    description: "It's rickroll. What's your question?",
    usage: "[user | user ID]",
    aliases: ["rr"],
    category: 3,
    slashInit: true,
    register: () => ApplicationCommand.createBasic(module.exports).setOptions([
        new ApplicationCommandOption(ApplicationCommandOptionType.USER.valueOf(), "user", "The user to rickroll.")
    ]),
    async slash(client, _interaction, args) {
        if (!args[0]?.value) return InteractionResponse.sendMessage("https://inviterick.com/rick.gif");
        var user = await client.users.fetch(args[0].value);
        if (user.id === client.user.id || user.id == process.env.DC) user = await client.users.fetch(interaction.member ? interaction.member.user.id : interaction.user.id);
        return InteractionResponse.sendMessage(`Hey! <@${user.id}>`)
    },
    async postSlash(client, interaction, args) {
        if (!args[0]?.value) return;
        InteractionResponse.deleteMessage(client, interaction).catch(() => { });
        await wait(3500);
        var channel;
        if (interaction.channel_id) channel = await client.channels.fetch(interaction.channel_id);
        else channel = await client.user.fetch(interaction.user.id);
        await message.channel.send(new Discord.MessageAttachment("https://inviterick.com/rick.gif", "rick.gif"));
    },
    async execute(message, args) {
        const attachment = new Discord.MessageAttachment("https://inviterick.com/rick.gif", "rick.gif");
        if (!args[0]) return await message.channel.send(attachment);
        var user = await findUser(message, args[0]);
        if (!user) return;
        if (user.id === message.client.user.id || user.id == process.env.DC) user = message.author;
        await message.channel.send(`Hey! <@${user.id}>`);
        await wait(5000);
        await message.channel.send(attachment);
    }
}