
import { ColorResolvable } from "discord.js";
import { NorthInteraction, NorthMessage, SlashCommand } from "../../classes/NorthClient";
import { commonRoleEmbed } from "../../function";

class AddRoleCommand implements SlashCommand {
    name = "addrole"
    description = "Adds a new role to the server. The “color” parameter is optional."
    args = 1
    usage = "<name> [color]"
    category = 0
    permissions = {
        guild: { user: 268435456, me: 268435456 }
    }
    options = [
        {
            name: "name",
            description: "The name of the role.",
            required: true,
            type: "STRING"
        },
        {
            name: "color",
            description: "The color of the role.",
            required: false,
            type: "STRING"
        }
    ];
    async execute(interaction: NorthInteraction) {
        const name = interaction.options.getString("name");
        const embeds = commonRoleEmbed(interaction.client, "create", "created", name);
        const color = interaction.options.getString("color");
        try {
            if (!color) await interaction.guild.roles.create({ name });
            else await interaction.guild.roles.create({ name, color: (<ColorResolvable> color) });
            await interaction.reply({embeds: [embeds[0]]});
        } catch (err: any) {
            await interaction.reply({embeds: [embeds[1]]});
        }
    }

    async run(message: NorthMessage, args: string[]) {
        if (!args[0]) return await message.channel.send("You didn't tell me the role name!" + ` Usage: \`${message.prefix}${this.name} ${this.usage}\``);
        const embeds = commonRoleEmbed(message.client, "create", "created", args[0]);
        try {
            if (!args[1]) await message.guild.roles.create({ name: args[0] });
            else await message.guild.roles.create({ name: args[0], color: <ColorResolvable> args[1] });
            await message.channel.send({embeds: [embeds[0]]});
        } catch (err: any) {
            await message.channel.send({embeds: [embeds[1]]});
        }
    }
};

const cmd = new AddRoleCommand();
export default cmd;