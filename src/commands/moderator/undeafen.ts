
import { GuildMember } from "discord.js";
import { NorthInteraction, NorthMessage, SlashCommand } from "../../classes/NorthClient";
import { commonModerationEmbed, findMember } from "../../function";

class UnDeafenCommand implements SlashCommand {
    name = "undeafen"
    description = "Undeafen a member while the member is in a voice channel."
    args = 1
    aliases = ["undeaf"]
    usage = "<user | user ID> [reason]"
    category = 1
    permissions = { guild: { user: 8388608, me: 8388608 } }
    options = [
        {
            name: "user",
            description: "The user to undeafen.",
            required: true,
            type: "USER"
        },
        {
            name: "reason",
            description: "The reason of undeafening.",
            required: false,
            type: "STRING"
        }
    ]

    async execute(interaction: NorthInteraction) {
        const guild = interaction.guild;
        const member = <GuildMember> interaction.options.getMember("user");
        const reason = interaction.options.getString("reason");
        const embeds = commonModerationEmbed(guild, interaction.user, member, "undeafen", "undeafened", reason);
        try {
            if (reason) await member.voice.setDeaf(false, reason)
            else await member.voice.setDeaf(false);
            member.user.send({embeds: [embeds[0]]}).catch(() => { });
            return await interaction.reply({embeds: [embeds[1]]});
          } catch (error: any) {
            return await interaction.reply({embeds: [embeds[2]]});
        }
    }

    async run(message: NorthMessage, args: string[]) {
        const member = await findMember(message, args[0]);
        if (!member) return;
        var reason;
        if (args[1]) reason = args.slice(1).join(" ");
        const embeds = commonModerationEmbed(message.guild, message.author, member, "undeafen", "undeafened", reason);
        try {
            if (reason) await member.voice.setDeaf(false, reason)
            else await member.voice.setDeaf(false);
            member.user.send({embeds: [embeds[0]]}).catch(() => { });
            await message.channel.send({embeds: [embeds[1]]});
        } catch (error: any) {
            await message.channel.send({embeds: [embeds[2]]});
        }
    }
}

const cmd = new UnDeafenCommand();
export default cmd;