
import { GuildMember } from "discord.js";
import { NorthInteraction, NorthMessage, FullCommand } from "../../classes/NorthClient.js";
import { commonModerationEmbed, findMember } from "../../function.js";

class BanCommand implements FullCommand {
    name = "ban"
    description = "Bans a member from the server."
    args = 1
    usage = "<user> [days] [reason]"
    category = 1
    permissions = { guild: { user: 4, me: 4 } }
    options = [
        {
            name: "user",
            description: "The user to ban.",
            required: true,
            type: "USER"
        },
        {
            name: "days",
            description: "The duration (in days) of getting banned.",
            required: false,
            type: "INTEGER"
        },
        {
            name: "reason",
            description: "The reason of banning.",
            required: false,
            type: "STRING"
        }
    ]

    async execute(interaction: NorthInteraction) {
        const member = <GuildMember> interaction.options.getMember("user");
        if (!member) return await interaction.reply("Cannot find the member.");
        const options: { reason?: string, days?: number } = {};
        const days = interaction.options.getInteger("days");
        if (days) {
            if (days > 7 || days < 0) return await interaction.reply("The number of days of messages to delete provided is not valid. Please provide a number between 0 and 7.");
            options.days = days;
        }
        const reason = interaction.options.getString("reason");
        if (reason) options.reason = reason;
        const embeds = commonModerationEmbed(interaction.guild, interaction.user, member, "ban", "banned", options.reason);
        try {
            await member.ban(options);
        } catch (err: any) {
            return await interaction.reply({embeds: [embeds[2]]});
        }
        member.user.send({embeds: [embeds[0]]}).catch(() => {});
        return await interaction.reply({embeds: [embeds[1]]});
    }

    async run(message: NorthMessage, args: string[]) {
        const member = await findMember(message, args[0])
        if (!member) return;
        let reason = "";
        let options = {};
        if (args[1]) {
            const days = parseInt(args[1]);
            if (isNaN(days) || days > 7 || days < 0) return message.channel.send("The number of days of messages to delete provided is not valid. Please provide a number between 0 and 7.")
            if (args[2]) reason = args.slice(2).join(" ");
            options = { reason: reason, days: parseInt(args[1]) };
        }
        const embeds = commonModerationEmbed(message.guild, message.author, member, "ban", "banned", reason);
        try {
            await member.ban(options);
        } catch (err: any) {
            return await message.channel.send({embeds: [embeds[2]]});
        }
        member.user.send({embeds: [embeds[0]]}).catch(() => {});
        await message.channel.send({embeds: [embeds[1]]});
    }
}

const cmd = new BanCommand();
export default cmd;