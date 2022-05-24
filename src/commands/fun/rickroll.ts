
import { NorthInteraction, NorthMessage, FullCommand } from "../../classes/NorthClient.js";
import * as Discord from "discord.js";
import { findUser, getOwner, wait } from "../../function.js";

class RickrollCommand implements FullCommand {
    name = "rickroll"
    description = "It's rickroll. What's your question?"
    usage = "[user]"
    aliases = ["rr"]
    category = 3
    options = [{
        name: "user",
        description: "The user to rickroll.",
        required: false,
        type: "USER"
    }];
    
    async execute(interaction: NorthInteraction) {
        const attachment = new Discord.MessageAttachment("https://drive.google.com/uc?export=download&id=1kiVMwDCNN5kRN9BtMPfSYoU1QM0yRdS2", "rick.gif");
        var user = interaction.options.getUser("user");
        if (!user) return await interaction.reply({files: [attachment]});
        if (user.id === interaction.client.user.id || user.id == await getOwner()) user = interaction.user;
        await interaction.reply(`Hey! <@${user.id}>`);
        await wait(5000);
        await interaction.followUp({files: [attachment]});
    }

    async run(message: NorthMessage, args: string[]) {
        const attachment = new Discord.MessageAttachment("https://drive.google.com/uc?export=download&id=1kiVMwDCNN5kRN9BtMPfSYoU1QM0yRdS2", "rick.gif");
        if (!args[0]) return await message.channel.send({files: [attachment]});
        var user: Discord.User;
        try {
            user = await findUser(message, args[0]);
        } catch (err: any) {
            return await message.channel.send(err.message);
        }
        if (user.id === message.client.user.id || user.id == await getOwner()) user = message.author;
        await message.channel.send(`Hey! <@${user.id}>`);
        await wait(5000);
        await message.channel.send({files: [attachment]});
    }
}

const cmd = new RickrollCommand();
export default cmd;