import { Interaction } from "slashcord/dist/Index";
import { NorthClient, NorthMessage, SlashCommand } from "../../classes/NorthClient";
import { genPermMsg, commonModerationEmbed, findMember } from "../../function";

class UnBanCommand implements SlashCommand {
    name = "unban"
    description = "Unban a member of the server."
    usage = "<user | user ID> [reason]"
    args = 1
    category = 1
    permissions = 4
    options = [
        {
            name: "user",
            description: "The user to unban.",
            required: true,
            type: 6
        },
        {
            name: "reason",
            description: "The reason of unbanning.",
            required: false,
            type: 3
        }
    ]

    async execute(obj: { interaction: Interaction, args: any[], client: NorthClient }) {
        if (!obj.interaction.guild) return await obj.interaction.reply("This command only works on server.");
        const author = obj.interaction.member;
        const guild = obj.interaction.guild;
        if (!author.permissions.has(this.permissions)) return await obj.interaction.reply(genPermMsg(this.permissions, 0));
        if (!guild.me.permissions.has(this.permissions)) return await obj.interaction.reply(genPermMsg(this.permissions, 1));
        const member = await obj.client.users.fetch(obj.args[0].value);
        var reason;
        if (obj.args[1]?.value) reason = obj.args[1].value;
        const embeds = commonModerationEmbed(guild, author.user, member, "unban", "unbanned", reason);
        try {
            if (reason) await guild.members.unban(member, reason);
            else await guild.members.unban(member);
            member.send(embeds[0]).catch(() => { });
            await obj.interaction.reply(embeds[1]);
        } catch (err) {
            await obj.interaction.reply(embeds[2]);
        }
    }

    async run(message: NorthMessage, args: string[]) {
        if (!message.member.permissions.has(this.permissions)) return await message.channel.send(genPermMsg(this.permissions, 0));
        if (!message.guild.me.permissions.has(this.permissions)) return await message.channel.send(genPermMsg(this.permissions, 1));
        const member = await findMember(message, args[0])
        if (!member) return;
        var reason;
        if (args[1]) reason = args.slice(1).join(" ");
        const embeds = commonModerationEmbed(message.guild, message.author, member, "unban", "unbanned", reason);
        try {
            if (reason) await message.guild.members.unban(member.user, reason);
            else await message.guild.members.unban(member.user);
            member.user.send(embeds[0]).catch(() => { });
            await message.channel.send(embeds[1]);
        } catch (err) {
            await message.channel.send(embeds[2]);
        }
    }
}

const cmd = new UnBanCommand();
export default cmd;