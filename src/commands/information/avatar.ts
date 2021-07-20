import { Interaction } from "slashcord";
import { NorthClient, NorthMessage, SlashCommand } from "../../classes/NorthClient";
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
        type: 6
    }];

    async execute(obj: { interaction: Interaction, client: NorthClient, args: any[] }) {
        var user;
        if (obj.args[0]?.value) user = await obj.client.users.fetch(obj.args[0].value);
        else if (obj.interaction.guild) user = obj.interaction.member.user;
        else user = await obj.client.users.fetch(obj.interaction.channelID);
        if (!user) return await obj.interaction.reply("Failed to find the user.");
        const Embed = new Discord.MessageEmbed()
            .setColor(color())
            .setTitle(user.username + "'s avatar: ")
            .setImage(user.displayAvatarURL({ size: 4096 }))
            .setTimestamp()
            .setFooter("Have a nice day! :)", obj.client.user.displayAvatarURL());
        await obj.interaction.reply(Embed);
    }

    async run(message: NorthMessage, args: string[]) {
        var user;
        if (!args[0]) user = message.author;
        else user = await findUser(message, args[0]);
        if (!user) return;
        const Embed = new Discord.MessageEmbed()
            .setColor(color())
            .setTitle(user.username + "'s avatar: ")
            .setImage(user.displayAvatarURL({ size: 4096 }))
            .setTimestamp()
            .setFooter("Have a nice day! :)", message.client.user.displayAvatarURL());
        await message.channel.send(Embed);
    }
};
