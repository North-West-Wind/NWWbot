import { NorthInteraction, NorthMessage, FullCommand } from "../../classes/NorthClient.js";
import { findMember, color, readableDateTime } from "../../function.js";
import * as Discord from "discord.js";

class ProfileCommand implements FullCommand {
    name = "profile"
    description = "Displays profile of yourself or the mentioned user on the server."
    usage = "[user]"
    category = 6
    options = [{
        name: "user",
        description: "The user's information to find.",
        required: false,
        type: "USER"
    }];

    async execute(interaction: NorthInteraction) {
        if (!interaction.guild) return await interaction.reply("This command only works on server.");
        const member = <Discord.GuildMember>interaction.options.getMember("user") || await (<Discord.GuildMember>interaction.member).fetch();
        await interaction.reply({ embeds: [this.createProfileEmbed(member)] });
    }

    async run(message: NorthMessage, args: string[]) {
        if (!message.guild) return await message.channel.send("This command only works on server.");
        let member = message.member;
        if (args[0]) member = await findMember(message, args[0]);
        else await member.fetch();
        if (!member) return;
        await message.channel.send({ embeds: [this.createProfileEmbed(member)] });
    }

    createProfileEmbed(member: Discord.GuildMember) {
        const guild = member.guild;
        const user = member.user;
        const username = user.username;
        const tag = user.tag;
        const id = user.id;
        const createdAt = user.createdAt;
        const joinedAt = member.joinedAt;
        const nick = member.displayName;
        const premium = member.premiumSince;
        const createdTime = readableDateTime(createdAt);
        const joinedTime = readableDateTime(joinedAt);
        const Embed = new Discord.EmbedBuilder()
            .setTitle("Profile of " + username)
            .setDescription("In server **" + guild.name + "**")
            .setThumbnail(user.displayAvatarURL())
            .addFields([
                { name: "ID", value: id, inline: true },
                { name: "Username", value: tag, inline: true },
                { name: "Premium", value: premium ? readableDateTime(premium) : "False", inline: true },
                { name: "Nickname", value: nick, inline: true },
                { name: "Created", value: createdTime, inline: true },
                { name: "Joined", value: joinedTime, inline: true }
            ])
            .setColor(color())
            .setTimestamp()
            .setFooter({ text: "Have a nice day! :)", iconURL: guild.client.user.displayAvatarURL() });
        return Embed;
    }
}

const cmd = new ProfileCommand();
export default cmd;