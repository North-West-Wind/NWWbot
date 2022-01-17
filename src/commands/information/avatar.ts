
import { NorthInteraction, NorthMessage, SlashCommand } from "../../classes/NorthClient";
import { color, findUser } from "../../function";
import * as Discord from "discord.js";

class AvatarCommand implements SlashCommand {
    name = "avatar"
    description = "Display the message author's avatar or the mentioned user's avatar."
    aliases = ["icon", "pfp"]
    usage = "[user | user ID]"
    category = 6
    options = [{
        name: "user",
        description: "Displays the avatar of this user.",
        required: false,
        type: "USER"
    }];

    async execute(interaction: NorthInteraction) {
        var user = interaction.options.getUser("user") || interaction.user;
        const Embed = new Discord.MessageEmbed()
            .setColor(color())
            .setTitle(user.username + "'s avatar: ")
            .setImage(user.displayAvatarURL({ size: 4096, dynamic: true }))
            .setTimestamp()
            .setFooter({ text: "Have a nice day! :)", iconURL: interaction.client.user.displayAvatarURL() });
        await interaction.reply({embeds: [Embed]});
    }

    async run(message: NorthMessage, args: string[]) {
        var user;
        if (!args[0]) user = message.author;
        else user = await findUser(message, args[0]);
        if (!user) return;
        const Embed = new Discord.MessageEmbed()
            .setColor(color())
            .setTitle(user.username + "'s avatar: ")
            .setImage(user.displayAvatarURL({ size: 4096, dynamic: true }))
            .setTimestamp()
            .setFooter({ text: "Have a nice day! :)", iconURL: message.client.user.displayAvatarURL() });
        await message.channel.send({embeds: [Embed]});
    }
}

const cmd = new AvatarCommand();
export default cmd;