
import { GuildMember } from "discord.js";
import { NorthInteraction, NorthMessage, SlashCommand } from "../../classes/NorthClient";
import { genPermMsg, commonModerationEmbed, findMember } from "../../function";

class UnMuteCommand implements SlashCommand {
    name = "unmute"
    description = "Unmute a member while the member is in a voice channel."
    args = 1
    usage = "<user | user ID> [reason]"
    category = 1
    permissions = { guild: { user: 4194304, me: 4194304 } }
    options = [
        {
            name: "user",
            description: "The user to unmute.",
            required: true,
            type: "USER"
        },
        {
            name: "reason",
            description: "The reason of unmuting.",
            required: false,
            type: "STRING"
        }
    ]

    async execute(interaction: NorthInteraction) {
        const author = interaction.member;
        const guild = interaction.guild;
        const member = <GuildMember> interaction.options.getMember("user");
        const reason = interaction.options.getString("reason");
        const embeds = commonModerationEmbed(guild, author.user, member, "unmute", "unmuted", reason);
        try {
            if (reason) await member.voice.setMute(false, reason);
            else await member.voice.setMute(false);
            member.user.send({embeds: [embeds[0]]}).catch(() => { });
            return await interaction.reply({embeds: [embeds[1]]});
          } catch (error) {
            return await interaction.reply({embeds: [embeds[2]]});
        }
    }

    async run(message: NorthMessage, args: string[]) {
        const member = await findMember(message, args[0]);
        if (!member) return;
        var reason;
        if (args[1]) reason = args.slice(1).join(" ");
        const embeds = commonModerationEmbed(message.guild, message.author, member, "unmute", "unmuted", reason);
        try {
            if (reason) await member.voice.setMute(false, reason);
            else await member.voice.setMute(false);
            member.user.send({embeds: [embeds[0]]}).catch(() => { });
            await message.channel.send({embeds: [embeds[1]]});
        } catch (error) {
            await message.channel.send({embeds: [embeds[2]]});
        }
    }
}

const cmd = new UnMuteCommand();
export default cmd;