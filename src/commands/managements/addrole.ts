import { Interaction } from "slashcord";
import { NorthClient, SlashCommand } from "../../classes/NorthClient";
import { genPermMsg, commonRoleEmbed } from "../../function";

class AddRoleCommand implements SlashCommand {
    name = "addrole"
    description = "Add a new role to the server. The “color” parameter is optional."
    args = 1
    usage = "<role name> [color]"
    category = 0
    permissions = 268435456
    options = [
        {
            name: "name",
            description: "The name of the role.",
            required: true,
            type: 3
        },
        {
            name: "color",
            description: "The color of the role.",
            required: false,
            type: 3
        }
    ];
    async execute(obj: { interaction: Interaction, client: NorthClient, args: any[] }) {
        if (!obj.interaction.guild) return await obj.interaction.reply("This command only works on server.");
        const author = obj.interaction.member;
        if (!author.permissions.has(this.permissions)) return await obj.interaction.reply(genPermMsg(this.permissions, 0));
        if (!obj.interaction.guild.me.permissions.has(this.permissions)) return await obj.interaction.reply(genPermMsg(this.permissions, 1));
        const embeds = commonRoleEmbed(obj.client, "create", "created", obj.args[0].value);
        try {
            if (!obj.args[1]?.value) await obj.interaction.guild.roles.create({ data: { name: obj.args[0].value } });
            else await obj.interaction.guild.roles.create({ data: { name: obj.args[0].value, color: obj.args[1].value } });
            await obj.interaction.reply(embeds[0]);
        } catch (err) {
            await obj.interaction.reply(embeds[1]);
        }
    }

    async run(message, args) {
        if (!message.member.permissions.has(this.permissions)) return await message.channel.send(genPermMsg(this.permissions, 0));
        if (!message.guild.me.permissions.has(this.permissions)) return await message.channel.send(genPermMsg(this.permissions, 1));
        if (!args[0]) return await message.channel.send("You didn't tell me the role name!" + ` Usage: \`${message.prefix}${this.name} ${this.usage}\``);
        const embeds = commonRoleEmbed(message.client, "create", "created", args[0]);
        try {
            if (!args[1]) await message.guild.roles.create({ data: { name: args[0] } });
            else await message.guild.roles.create({ data: { name: args[0], color: args[1] } });
            await message.channel.send(embeds[0]);
        } catch (err) {
            await message.channel.send(embeds[1]);
        }
    }
};

const cmd = new AddRoleCommand();
export default cmd;