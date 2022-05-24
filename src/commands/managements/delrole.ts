
import { Role } from "discord.js";
import { NorthInteraction, NorthMessage, FullCommand } from "../../classes/NorthClient.js";
import { commonRoleEmbed } from "../../function.js";

class DelRoleCommand implements FullCommand {
    name = "delrole"
    description = "Remove a role from the server."
    args = 1
    usage = "<role | role ID | role name>"
    category = 0
    permissions = { guild: { user: 268435456, me: 268435456 } }
    options = [
        {
            name: "role",
            description: "The role to delete.",
            required: true,
            type: "ROLE"
        }
    ];

    async execute(interaction: NorthInteraction) {
        const role = <Role> interaction.options.getRole("role");
        if (!role) return await interaction.reply("No role was found!");
        const embeds = commonRoleEmbed(interaction.client, "delete", "Deleted", role.name);
        try {
            await role.delete();
            return await interaction.reply({embeds: [embeds[0]]});
        } catch (err: any) {
            return await interaction.reply({embeds: [embeds[1]]});
        }
    }

    async run(message: NorthMessage, args: string[]) {
        if (!args[0]) return await message.channel.send("You didn't tell me the role to delete!" + ` Usage: \`${message.prefix}${this.name} ${this.usage}\``);
        var roleID = args[0].replace(/<@&/g, "").replace(/>/g, "");
        var role;
        if (isNaN(parseInt(roleID))) {
            role = message.guild.roles.cache.find(x => x.name.toLowerCase() === `${args[0].toLowerCase()}`);
            if (!role) return await message.channel.send("No role was found with the name " + args[0]);
        } else {
            role = message.guild.roles.fetch(roleID);
            if (!role) return await message.channel.send("No role was found!");
        }
        const embeds = commonRoleEmbed(message.client, "delete", "Deleted", role.name);
        try {
            await role.delete();
            return await message.channel.send({embeds: [embeds[0]]});
        } catch (err: any) {
            return await message.channel.send({embeds: [embeds[1]]});
        }
    }
};

const cmd = new DelRoleCommand();
export default cmd;