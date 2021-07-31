import { Interaction } from "slashcord/dist/Index";
import { NorthClient, SlashCommand } from "../../classes/NorthClient";
import { genPermMsg, commonRoleEmbed } from "../../function";

class DelRoleCommand implements SlashCommand {
    name = "delrole"
    description = "Remove a role from the server."
    args = 1
    usage = "<role | role ID | role name>"
    category = 0
    permissions = 268435456
    options = [
        {
            name: "role",
            description: "The role to delete.",
            required: true,
            type: 8
        }
    ];

    async execute(obj: { interaction: Interaction, client: NorthClient, args: any[] }) {
        if (!obj.interaction.guild) return await obj.interaction.reply("This command only works on server.");
        if (!obj.interaction.member.permissions.has(this.permissions)) return await obj.interaction.reply(genPermMsg(this.permissions, 0));
        if (!obj.interaction.guild.me.permissions.has(this.permissions)) return await obj.interaction.reply(genPermMsg(this.permissions, 1));
        const role = await obj.interaction.guild.roles.fetch(obj.args[0].value);
        if (!role) return await obj.interaction.reply("No role was found!");
        const embeds = commonRoleEmbed(obj.client, "delete", "Deleted", role.name);
        try {
            await role.delete();
            return await obj.interaction.reply(embeds[0]);
        } catch (err) {
            return await obj.interaction.reply(embeds[1]);
        }
    }

    async run(message, args) {
        if (!message.guild) return await message.channel.send("This command only works on server.");
        if (!message.member.permissions.has(this.permissions)) return await message.channel.send(genPermMsg(this.permissions, 0));
        if (!message.guild.me.permissions.has(this.permissions)) return await message.channel.send(genPermMsg(this.permissions, 1));
        if (!args[0]) return await message.channel.send("You didn't tell me the role to delete!" + ` Usage: \`${message.prefix}${this.name} ${this.usage}\``);

        var roleID = args[0].replace(/<@&/g, "").replace(/>/g, "");
        if (isNaN(parseInt(roleID))) {
            var role = await message.guild.roles.cache.find(x => x.name.toLowerCase() === `${args[0].toLowerCase()}`);
            if (!role) return await message.channel.send("No role was found with the name " + args[0]);
        } else {
            var role = await message.guild.roles.cache.get(roleID);
            if (!role) return await message.channel.send("No role was found!");
        }
        const embeds = commonRoleEmbed(message.client, "delete", "Deleted", role.name);
        try {
            await role.delete();
            return await message.channel.send(embeds[1]);
        } catch (err) {
            return await message.channel.send(embeds[0]);
        }
    }
};

const cmd = new DelRoleCommand();
export default cmd;