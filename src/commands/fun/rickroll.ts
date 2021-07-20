import { Interaction } from "slashcord";
import { NorthClient, SlashCommand } from "../../classes/NorthClient";
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
        required: true,
        type: 6
    }];
    
    async execute(obj: { interaction: Interaction, args: any[], client: NorthClient }) {
        if (!obj.args[0]?.value) return await obj.interaction.reply("http://inviterick.com/rick.gif");
        var user = await obj.client.users.fetch(obj.args[0].value);
        if (user.id === obj.client.user.id || user.id == process.env.DC) user = obj.interaction.member?.user ?? await obj.client.users.fetch(obj.interaction.channelID);
        await obj.interaction.reply(`Hey! <@${user.id}>`);
        await wait(5000);
        await obj.interaction.followUp.send("http://inviterick.com/rick.gif");
    }

    async run(message, args) {
        const attachment = new Discord.MessageAttachment("http://inviterick.com/rick.gif", "rick.gif");
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