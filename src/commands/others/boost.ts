import { MessageEmbed } from "discord.js";
import { NorthInteraction, NorthMessage, FullCommand } from "../../classes/NorthClient.js";
import { color, getFetch } from "../../function.js";

const fetch = getFetch();

class BoostCommand implements FullCommand {
    name = "boost";
    description = "Displays boost information.";
    category = -1;

    async execute(interaction: NorthInteraction) {
        const stats = await this.getStats();
        if (stats.error) return await interaction.reply(stats.message);
        const embed = new MessageEmbed()
            .setColor(color())
            .setTitle("Boosters")
            .setTimestamp()
            .setFooter({ text: "discord canary dev tool ftw", iconURL: interaction.client.user.displayAvatarURL() });
        const descs = [];
        for (const id in stats.data) descs.push(`<@${id}> - ${stats.data[id]}`);
        embed.setDescription(descs.join("\n"));
        await interaction.reply({ embeds: [embed] });
    }

    async run(message: NorthMessage) {
        const stats = await this.getStats();
        if (stats.error) return await message.channel.send(stats.message);
        const embed = new MessageEmbed()
            .setColor(color())
            .setTitle("Boosters")
            .setTimestamp()
            .setFooter({ text: "discord canary dev tool ftw", iconURL: message.client.user.displayAvatarURL() });
        const descs = [];
        for (const id in stats.data) descs.push(`<@${id}> - ${stats.data[id]}`);
        embed.setDescription(descs.join("\n"));
        await message.channel.send({ embeds: [embed] });
    }

    // You're entering dangerous territory
    async getStats() {
        const res = await fetch("https://canary.discord.com/api/v9/guilds/622311594654695434/premium/subscriptions", { headers: { authorization: process.env.TOKEN_N } });
        if (!res.ok) return { error: true, message: `Received HTTP status: ${res.status}`, data: null };
        const json = <any> await res.json();
        if (json.message) return { error: true, message: json.message, data: null };
        const obj = {};
        for (const entry of json) {
            if (entry.ended) continue;
            if (!obj[entry.user_id]) obj[entry.user_id] = 1;
            else obj[entry.user_id]++;
        }
        return { error: false, message: null, data: obj };
    }
}

const cmd = new BoostCommand();
export default cmd;