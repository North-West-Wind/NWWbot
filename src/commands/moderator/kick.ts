
import { GuildMember } from "discord.js";
import { NorthInteraction, NorthMessage, SlashCommand } from "../../classes/NorthClient.js";
import { commonModerationEmbed, findMember } from "../../function.js";

class KickCommand implements SlashCommand {
    name = "kick"
    description = "Kick a member from the server."
    args = 1
    usage = "<user> [reason]"
    category = 1
    permissions = { guild: { user: 2, me: 2 } }
    options = [
        {
            name: "user",
            description: "The user to kick.",
            required: true,
            type: "USER"
        },
        {
            name: "reason",
            description: "The reason of kicking.",
            required: false,
            type: "STRING"
        }
    ]

    async execute(interaction: NorthInteraction) {
        const guild = interaction.guild;
        const member = <GuildMember> interaction.options.getMember("user");
        const reason = interaction.options.getString("reason");
        const embeds = commonModerationEmbed(guild, interaction.user, member, "kick", "kicked", reason);
        try {
            if (reason) await member.kick(reason);
            else await member.kick();
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
        const embeds = commonModerationEmbed(message.guild, message.author, member, "kick", "kicked", reason);
        try {
            if (reason) await member.kick(reason);
            else await member.kick();
            member.user.send({embeds: [embeds[0]]}).catch(() => { });
            await message.channel.send({embeds: [embeds[1]]});
        } catch (error: any) {
            await message.channel.send({embeds: [embeds[2]]});
        }
    }
}

const cmd = new KickCommand();
export default cmd;