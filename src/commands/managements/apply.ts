import { Message, MessageActionRow, MessageButton, MessageComponentInteraction, MessageEmbed, TextChannel } from "discord.js";
import { NorthClient, NorthInteraction, NorthMessage, SlashCommand } from "../../classes/NorthClient.js";
import { query } from "../../function.js";

class ApplyCommand implements SlashCommand {
    name = "apply";
    description = "Apply for a role on the server.";
    category = 0;
    permissions = { guild: { me: 268435456 } };

    async execute(interaction: NorthInteraction) {
        const applications = NorthClient.storage.guilds[interaction.guildId]?.applications;
        if (!applications || !applications.roles || !applications.admins || !applications.channel) return await interaction.reply("The server did not have the application system set up!");
        try { await interaction.guild.channels.fetch(applications.channel); } catch (err) {
            return await interaction.reply("Cannot find the application channel. Maybe it is deleted. Tell an admin and try again later.");
        }
        const { embed, components } = await this.getEmbedsAndComponents(interaction);
        const msg = <Message> await interaction.reply({ embeds: [embed], components, ephemeral: true, fetchReply: true });
        try {
            const compoInter = await msg.awaitMessageComponent({ filter: m => m.user.id === interaction.user.id, time: 60000 });
            await this.handle(interaction, compoInter, embed);
        } catch (err) {
            embed.setTitle("Application Cancelled").setDescription("You did not choose in time.").setFooter({ text: "Have a nice day! :)", iconURL: interaction.client.user.displayAvatarURL() });
            await interaction.editReply({ embeds: [embed], components: [] });
        }
    }

    async run(message: NorthMessage) {
        const applications = NorthClient.storage.guilds[message.guildId]?.applications;
        if (!applications || !applications.roles || !applications.admins || !applications.channel) return await message.channel.send("The server did not have the application system set up!");
        try { await message.guild.channels.fetch(applications.channel); } catch (err) {
            return await message.channel.send("Cannot find the application channel. Maybe it is deleted. Tell an admin and try again later.");
        }
        await message.author.send("Let's continue in your DM.");
        const { embed, components } = await this.getEmbedsAndComponents(message);
        const msg = await message.author.send({ embeds: [embed], components });
        try {
            const compoInter = await msg.awaitMessageComponent({ filter: m => m.user.id === message.author.id, time: 60000 });
            await this.handle(message, compoInter, embed);
        } catch (err) {
            embed.setTitle("Application Cancelled").setDescription("You did not choose in time.").setFooter({ text: "Have a nice day! :)", iconURL: message.client.user.displayAvatarURL() });
            await msg.edit({ embeds: [embed], components: [] });
        }
    }

    async getEmbedsAndComponents(message: NorthMessage | NorthInteraction) {
        const applications = NorthClient.storage.guilds[message.guildId]?.applications;
        const components = [];
        const mapped = applications.roles.map(role => `<@&${role}>`);
        const rowNum = Math.ceil(applications.roles.length / 5);
        const lines: string[][] = Array(rowNum).fill([]);
        for (let j = 0; j < rowNum; j++)
            for (let k = 0; k < mapped.length; k++)
                lines[j].push(mapped[k + (j + 1) * 5]);
        const embed = new MessageEmbed()
            .setTitle(`Roles you can apply`)
            .setDescription(`${lines.map(roles => roles.join(", ")).join("\n")}\n\n**Click on a button below to choose which role to apply**`)
            .setTimestamp()
            .setFooter({ text: "You may also view other pages if applicable", iconURL: message.client.user.displayAvatarURL() });
        for (const roles of lines) {
            const row = new MessageActionRow();
            for (const role of roles) try {
                const r = await message.guild.roles.fetch(role);
                row.addComponents(new MessageButton({ label: r.name, customId: role, style: "SECONDARY" }));
            } catch (err) {
                row.addComponents(new MessageButton({ label: "(Broken)", customId: "broken", style: "SECONDARY", disabled: true }));
            }
            components.push(row);
        }
        components.push(new MessageActionRow().addComponents(new MessageButton({ label: "Cancel", customId: "cancel", style: "DANGER", emoji: "⏹️" })));
        return { embed, components };
    }

    async handle(message: NorthMessage | NorthInteraction, interaction: MessageComponentInteraction, embed: MessageEmbed) {
        if (interaction.customId === "cancel") {
            embed.setTitle("Application Cancelled").setDescription("You cancelled the application.").setFooter({ text: "Have a nice day! :)", iconURL: message.client.user.displayAvatarURL() });
            return await interaction.update({ embeds: [embed], components: [] });
        }
        const role = await message.guild.roles.fetch(interaction.customId);
        embed.setTitle(`Applying for role ${role.name}`).setDescription("Please enter description about why you should get this role.\nThe description you entered will be viewed by administrators or moderators").setFooter({ text: "You have 10 minutes.", iconURL: message.client.user.displayAvatarURL() });
        await interaction.update({ embeds: [embed], components: [] });
        try {
            const author = message instanceof Message ? message.author : message.user;
            const collected = await interaction.channel.awaitMessages({ filter: m => m.author.id === author.id, max: 1, time: 600000 });
            if (!collected.first()?.content) throw new Error();
            const em = new MessageEmbed()
                .setTitle("Role Application")
                .setDescription(`**Applicant:** <@${author.id}> | ${author.tag}\n**Applying:** <@&${role.id}> | ${role.name}\n**Reason:**\n${collected.first().content}\n\nPlease make your vote by clicking the buttons.\nApproved: 0\nDenied: 0`)
                .setTimestamp()
                .setFooter({ text: "Have a nice day! :)", iconURL: message.client.user.displayAvatarURL() });
            const row = new MessageActionRow()
                .addComponents(new MessageButton({ label: "Approve", customId: "approve", style: "SUCCESS", emoji: "⭕" }))
                .addComponents(new MessageButton({ label: "Deny", customId: "deny", style: "DANGER", emoji: "❌" }));
            const { id } = await (<TextChannel> await message.guild.channels.fetch(NorthClient.storage.guilds[message.guildId].applications.channel)).send({ embeds: [em], components: [row] });
            NorthClient.storage.guilds[message.guildId].applications.applications.add({ id, approve: new Set(), deny: new Set() });
            // We don't care if it syncs to DB or not. It is gonna get batch processed anyway.
            query(`UPDATE servers SET applications = '${escape(JSON.stringify([...NorthClient.storage.guilds[message.guildId].applications.applications]))}' WHERE id = '${message.guildId}'`).catch(() => { });
            embed.setTitle("Application Complete").setDescription("Your application has been submitted and will be viewed by administrators or moderators. You will be notify when it is approved or denied.").setFooter({ text: "Have a nice day! :)", iconURL: message.client.user.displayAvatarURL() });
        } catch (err) {
            embed.setTitle("Application Error").setDescription("We failed to receive your description! Try again later.").setFooter({ text: "Have a nice day! :)", iconURL: message.client.user.displayAvatarURL() });
        }
        await interaction.update({ embeds: [embed], components: [] });
    }
}

const cmd = new ApplyCommand();
export default cmd;