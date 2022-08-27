
import { GuildMember } from "discord.js";
import { NorthInteraction, NorthMessage, FullCommand } from "../../classes/NorthClient.js";
import { commonModerationEmbed, findMember } from "../../function.js";

class UnBanCommand implements FullCommand {
    name = "unban"
    description = "Unban a member of the server."
    usage = "<user> [reason]"
    args = 1
    category = 1
    permissions = { guild: { user: 4, me: 4 } }
    options = [
        {
            name: "user",
            description: "The user to unban.",
            required: true,
            type: "USER"
        },
        {
            name: "reason",
            description: "The reason of unbanning.",
            required: false,
            type: "STRING"
        }
    ]

    async execute(interaction: NorthInteraction) {
        const guild = interaction.guild;
        const member = <GuildMember> interaction.options.getMember("user");
        const reason = interaction.options.getString("reason");
        const embeds = commonModerationEmbed(guild, interaction.user, member, "unban", "unbanned", reason);
        try {
            if (reason) await guild.members.unban(member, reason);
            else await guild.members.unban(member);
            member.user.send({embeds: [embeds[0]]}).catch(() => { });
            return await interaction.reply({embeds: [embeds[1]]});
        } catch (error: any) {
            return await interaction.reply({embeds: [embeds[2]]});
        }
    }

    async run(message: NorthMessage, args: string[]) {
        const member = await findMember(message, args[0])
        if (!member) return;
        let reason;
        if (args[1]) reason = args.slice(1).join(" ");
        const embeds = commonModerationEmbed(message.guild, message.author, member, "unban", "unbanned", reason);
        try {
            if (reason) await message.guild.members.unban(member.user, reason);
            else await message.guild.members.unban(member.user);
            member.user.send({embeds: [embeds[0]]}).catch(() => { });
            await message.channel.send({embeds: [embeds[1]]});
        } catch (error: any) {
            await message.channel.send({embeds: [embeds[2]]});
        }
    }
}

const cmd = new UnBanCommand();
export default cmd;