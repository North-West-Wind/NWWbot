
import { NorthClient, NorthInteraction, SlashCommand } from "../../classes/NorthClient";
import * as Discord from "discord.js";
import { findUser, wait } from "../../function";

class RickrollCommand implements SlashCommand {
    name = "rickroll"
    description = "It's rickroll. What's your question?"
    usage = "[user | user ID]"
    aliases = ["rr"]
    category = 3
    options = [{
        name: "user",
        description: "The user to rickroll.",
        required: false,
        type: "USER"
    }];
    
    async execute(interaction: NorthInteraction) {
        var user = interaction.options.getUser("user");
        if (!user) return await interaction.reply("https://inviterick.com/rick.gif");
        if (user.id === interaction.client.user.id || user.id == process.env.DC) user = interaction.user;
        await interaction.reply(`Hey! <@${user.id}>`);
        await wait(5000);
        await interaction.followUp("https://inviterick.com/rick.gif");
    }

    async run(message, args) {
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

const cmd = new RickrollCommand();
export default cmd;