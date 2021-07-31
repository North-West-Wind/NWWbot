import moment from "moment";
import { Interaction } from "slashcord";
import { NorthClient, NorthMessage, SlashCommand } from "../../classes/NorthClient";
import { findMember, color, createEmbedScrolling, readableDateTime } from "../../function";
import * as Discord from "discord.js";

class ProfileCommand implements SlashCommand {
    name = "profile"
    description =
        "Display profile of yourself or the mentioned user on the server."
    usage = "[user | user ID]"
    category = 6
    options = [{
        name: "user",
        description: "The user's information to find.",
        required: false,
        type: 6
    }];

    async execute(obj: { interaction: Interaction, client: NorthClient, args: any[] }) {
        if (!obj.interaction.guild) return await obj.interaction.reply("This command only works on server.");
        const member = obj.args[0]?.value ? await obj.interaction.guild.members.fetch(obj.args[0].value) : obj.interaction.member;
        await obj.interaction.reply(this.createProfileEmbed(member));
    }

    async run(message: NorthMessage, args: string[]) {
        if (!message.guild) return await message.channel.send("This command only works on server.");
        var member = message.member;
        if (args[0]) member = await findMember(message, args[0]);
        if (!member) return;
        const Embed = this.createProfileEmbed(member);
        if (!Embed) return await message.channel.send("Something went wrong while creating the embed!");
        const allEmbeds = [Embed];
        if (member.presence.activities.length > 0) {
            const activityEm = new Discord.MessageEmbed()
                .setTitle("Presence of " + member.displayName)
                .setTimestamp()
                .setColor(color())
                .setFooter("Have a nice day! :)", message.client.user.displayAvatarURL());
            for (const activity of member.presence.activities) {
                const time = Date.now() - activity.createdTimestamp;
                const sec = time / 1000;
                activityEm.addField(activity.type.replace(/_/g, " "), `Name: **${activity.name}**\nDuration: ${moment.duration(sec, "seconds").format()}`);
            }
            allEmbeds.push(activityEm);
        }
        if (allEmbeds.length == 1) await message.channel.send(Embed);
        else await createEmbedScrolling(message, allEmbeds);
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
        const status = member.presence.status;
        const createdTime = readableDateTime(createdAt);
        const joinedTime = readableDateTime(joinedAt);
        const Embed = new Discord.MessageEmbed()
            .setTitle("Profile of " + username)
            .setDescription("In server **" + guild.name + "**")
            .setThumbnail(user.displayAvatarURL())
            .addField("ID", id, true)
            .addField("Username", tag, true)
            .addField("Status", status, true)
            .addField("Nickname", nick, true)
            .addField("Created", createdTime, true)
            .addField("Joined", joinedTime, true)
            .setColor(color())
            .setTimestamp()
            .setFooter("Have a nice day! :)", guild.client.user.displayAvatarURL());
        return Embed;
    }
}

const cmd = new ProfileCommand();
export default cmd;