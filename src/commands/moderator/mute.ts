
import { GuildMember } from "discord.js";
import { NorthInteraction, NorthMessage, SlashCommand } from "../../classes/NorthClient.js";
import { genPermMsg, commonModerationEmbed, findMember } from "../../function.js";

class MuteCommand implements SlashCommand {
    name = "mute"
    description = "Mute a member while the member is in a voice channel."
    args = 1
    usage = "<user> [reason]"
    category = 1
    permissions = { guild: { user: 4194304, me: 4194304 } }
    options = [
        {
            name: "user",
            description: "The user to mute.",
            required: true,
            type: "USER"
        },
        {
            name: "reason",
            description: "The reason of muting.",
            required: false,
            type: "STRING"
        }
    ]

    async execute(interaction: NorthInteraction) {
        const guild = interaction.guild;
        const member = <GuildMember> interaction.options.getMember("user");
        const reason = interaction.options.getString("reason");
        const embeds = commonModerationEmbed(guild, interaction.user, member, "mute", "muted", reason);
        try {
            if (reason) await member.voice.setMute(true, reason)
            else await member.voice.setMute(true);
            member.user.send({embeds: [embeds[0]]}).catch(() => { });
            return await interaction.reply({embeds: [embeds[1]]});
          } catch (error: any) {
            return await interaction.reply({embeds: [embeds[2]]});
        }
    }

    async run(message: NorthMessage, args: string[]) {
        const member = await findMember(message, args[0]);

        if (!member) return;
        if (!member.voice.channel) return message.channel.send("The member is not connected to any voice channel.")
        message.delete().catch(() => { });
        var reason;
        if (args[1]) reason = args.slice(1).join(" ");
        const embeds = commonModerationEmbed(message.guild, message.author, member, "mute", "muted", reason);
        try {
            if (reason) await member.voice.setMute(true, reason)
            else await member.voice.setMute(true);
            member.user.send({embeds: [embeds[0]]}).catch(() => { });
            await message.channel.send({embeds: [embeds[1]]});
          } catch (error: any) {
            await message.channel.send({embeds: [embeds[2]]});
        }
    }
}

const cmd = new MuteCommand();
export default cmd;