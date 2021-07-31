import { Interaction } from "slashcord";
import { NorthClient, NorthMessage, SlashCommand } from "../../classes/NorthClient";
import { genPermMsg, commonModerationEmbed, findMember } from "../../function";

class BanCommand implements SlashCommand {
    name = "ban"
    description = "Ban a member from the server."
    args = 1
    usage = "<user | user ID> [days] [reason]"
    category = 1
    permissions = 4
    options = [
        {
            name: "user",
            description: "The user to ban.",
            required: true,
            type: 6
        },
        {
            name: "days",
            description: "The duration (in days) of getting banned.",
            required: false,
            type: 4
        },
        {
            name: "reason",
            description: "The reason of banning.",
            required: false,
            type: 3
        }
    ]

    async execute(obj: { interaction: Interaction, client: NorthClient, args: any[] }) {
        if (!obj.interaction.guild) return await obj.interaction.reply("This command only works on server.");
        const member = await obj.interaction.guild.members.fetch(obj.args[0].value);
        if (!obj.interaction.member.permissions.has(4)) return await obj.interaction.reply(genPermMsg(this.permissions, 0));
        if (!obj.interaction.guild.me.permissions.has(4)) return await obj.interaction.reply(genPermMsg(this.permissions, 1));
        if (!member) return await obj.interaction.reply("Cannot find the member.");
        var options: any = {};
        if (obj.args[1]?.value) {
            const days = obj.args[1].value;
            if (days > 7 || days < 0) return await obj.interaction.reply("The number of days of messages to delete provided is not valid. Please provide a number between 0 and 7.");
            options.days = days;
        }
        if (obj.args[2]?.value) options.reason = obj.args[2].value;
        const embeds = commonModerationEmbed(obj.interaction.guild, obj.interaction.member.user, member, "ban", "banned", options.reason);
        try {
            await member.ban(options);
        } catch (err) {
            return await obj.interaction.reply(embeds[2]);
        }
        member.user.send(embeds[0]).catch(() => { });
        return await obj.interaction.reply(embeds[1]);
    }

    async run(message: NorthMessage, args: string[]) {
        if (!message.member.permissions.has(4)) return message.channel.send(genPermMsg(this.permissions, 0));
        if (!message.guild.me.permissions.has(4)) return message.channel.send(genPermMsg(this.permissions, 1));
        const member = await findMember(message, args[0])
        if (!member) return;
        let reason = "";
        var options = {};
        if (args[1]) {
            const days = parseInt(args[1]);
            if (isNaN(days) || days > 7 || days < 0) return message.channel.send("The number of days of messages to delete provided is not valid. Please provide a number between 0 and 7.")
            if (args[2]) reason = args.slice(2).join(" ");
            options = { reason: reason, days: parseInt(args[1]) };
        }
        const embeds = commonModerationEmbed(message.guild, message.author, member, "ban", "banned", reason);
        try {
            await member.ban(options);
        } catch (err) {
            return await message.channel.send(embeds[2]);
        }
        member.user.send(embeds[0]).catch(() => NorthClient.storage.log("Failed to send DM to " + member.user.username));
        await message.channel.send(embeds[1]);
    }
}

const cmd = new BanCommand();
export default cmd;