import * as Discord from "discord.js";
import { NorthClient, NorthInteraction, NorthMessage, SlashCommand } from "../../classes/NorthClient.js";
import { color, query, setTimeout_ } from "../../function.js";

export async function endApplication(client: Discord.Client, id: Discord.Snowflake, guildId: Discord.Snowflake) {
    try {
        const guild = await client.guilds.fetch(guildId);
        const settings = NorthClient.storage.guilds[guild.id].applications;
        const application = settings.applications.get(id);
        if (!application) return;
        const member = await guild.members.fetch(application.author);
        const role = await guild.roles.fetch(application.role);
        if (application.approve.size > application.decline.size) {
            await member.user.send(`Congratulations! Your application of role **${role.name}** on server **${guild.name}** was **APPROVED**!`);
            try {
                await member.roles.add(role);
            } catch (err) {
                await member.user.send(`However, I am having problem trying to add you to the role. Capture this message and send it to admins! (${id})`);
            }
        } else await member.user.send(`Sorry! Your application of role **${role.name}** on server **${guild.name}** was **DECLINED**! You may apply again and try to give a better reason.`);
        NorthClient.storage.guilds[guild.id].applications.applications.delete(id);
        try {
            const channel = <Discord.TextChannel>await guild.channels.fetch(settings.channel);
            const msg = await channel.messages.fetch(id);
            await msg?.edit({ components: [] });
        } catch (err) { }
    } catch (err) {
        console.error(err);
    }
}

class ApplyCommand implements SlashCommand {
    name = "apply";
    description = "Apply for a role on the server.";
    category = 0;
    permissions = { guild: { me: 268435456 } };

    async execute(interaction: NorthInteraction) {
        const applications = NorthClient.storage.guilds[interaction.guildId]?.applications;
        if (!applications || !applications.roles?.length || !applications.admins?.length || !applications.channel) return await interaction.reply("The server does not have the application system set up!");
        try { await interaction.guild.channels.fetch(applications.channel); } catch (err) {
            return await interaction.reply("Cannot find the application channel. Maybe it is deleted. Tell an admin and try again later.");
        }
        const { embed, components } = await this.getEmbedsAndComponents(interaction);
        const msg = <Discord.Message>await interaction.reply({ embeds: [embed], components, ephemeral: true, fetchReply: true });
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
        if (!applications || !applications.roles?.length || !applications.admins?.length || !applications.channel) return await message.channel.send("The server does not have the application system set up!");
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
        const components: Discord.MessageActionRow[] = [];
        const rs: Discord.Collection<Discord.Snowflake, Discord.Role> = new Discord.Collection();
        for (const role of applications.roles) rs.set(role, await message.guild.roles.fetch(role));
        var mapped = [];
        if (message instanceof Discord.Message) for (let i = 0; i < applications.roles.length; i++) mapped = applications.roles.map(role => `**${rs.get(role).name}**`);
        else mapped = applications.roles.map(role => `<@&${role}>`);
        const rowNum = Math.ceil(applications.roles.length / 5);
        const lines: string[][] = Array(rowNum).fill([]);
        for (let j = 0; j < rowNum; j++)
            for (let k = 0; k < Math.min(rowNum, applications.roles.length - j * 5); k++)
                lines[j].push(mapped[k + j * 5]);
        const embed = new Discord.MessageEmbed()
            .setColor(color())
            .setTitle(`Roles you can apply`)
            .setDescription(`${lines.map(roles => roles.join(", ")).join("\n")}\n\nClick on a button below to choose which role to apply`)
            .setTimestamp()
            .setFooter({ text: "Make your choice within 60 seconds", iconURL: message.client.user.displayAvatarURL() });
        for (let i = 0; i < rowNum; i++) {
            const row = new Discord.MessageActionRow();
            for (let j = 0; j < Math.min(rowNum, applications.roles.length - i * 5); j++) {
                const role = applications.roles[j + i * 5];
                if (rs.has(role)) row.addComponents(new Discord.MessageButton({ label: rs.get(role).name, customId: role, style: "SECONDARY" }));
                else row.addComponents(new Discord.MessageButton({ label: "(Broken)", customId: "broken", style: "SECONDARY", disabled: true }));
            }
            components.push(row);
        }
        components.push(new Discord.MessageActionRow().addComponents(new Discord.MessageButton({ label: "Cancel", customId: "cancel", style: "DANGER", emoji: "⏹️" })));
        return { embed, components };
    }

    async handle(message: NorthMessage | NorthInteraction, interaction: Discord.MessageComponentInteraction, embed: Discord.MessageEmbed) {
        if (interaction.customId === "cancel") {
            embed.setTitle("Application Cancelled").setDescription("You cancelled the application.").setFooter({ text: "Have a nice day! :)", iconURL: message.client.user.displayAvatarURL() });
            return await interaction.update({ embeds: [embed], components: [] });
        }
        const role = await message.guild.roles.fetch(interaction.customId);
        if ((<Discord.GuildMember>message.member).roles.cache.has(role.id)) {
            embed.setTitle("Application Cancelled").setDescription("You already have that role.").setFooter({ text: "Have a nice day! :)", iconURL: message.client.user.displayAvatarURL() });
            return await interaction.update({ embeds: [embed], components: [] });
        }
        embed.setTitle(`Applying for role ${role.name}`).setDescription("Please enter the reason of why you should get this role.\nThe reason you entered will be viewed by administrators or moderators").setFooter({ text: "You have 10 minutes.", iconURL: message.client.user.displayAvatarURL() });
        await interaction.update({ embeds: [embed], components: [] });
        try {
            const author = message instanceof Discord.Message ? message.author : message.user;
            const collected = await interaction.channel.awaitMessages({ filter: m => m.author.id === author.id, max: 1, time: 600000 });
            if (!collected.first()?.content) throw new Error();
            collected.first().delete().catch(() => {});
            const em = new Discord.MessageEmbed()
                .setColor(color())
                .setTitle("Role Application")
                .setDescription(`**Applicant:** <@${author.id}> | ${author.tag}\n**Applying:** <@&${role.id}> | ${role.name}\n**Reason:**\n${collected.first().content}\n\nPlease make your vote by clicking the buttons.\nApproved: 0\nDeclined: 0`)
                .setTimestamp()
                .setFooter({ text: "Have a nice day! :)", iconURL: message.client.user.displayAvatarURL() });
            const row = new Discord.MessageActionRow()
                .addComponents(new Discord.MessageButton({ label: "Approve", customId: "approve", style: "SUCCESS", emoji: "⭕" }))
                .addComponents(new Discord.MessageButton({ label: "Decline", customId: "decline", style: "DANGER", emoji: "❌" }));
            const settings = NorthClient.storage.guilds[message.guildId].applications;
            const { id } = await (<Discord.TextChannel>await message.guild.channels.fetch(settings.channel)).send({ embeds: [em], components: [row] });
            NorthClient.storage.guilds[message.guildId].applications.applications.set(id, { id, role: role.id, author: author.id, approve: new Set(), decline: new Set() });
            if (settings.duration) setTimeout_(() => endApplication(message.client, id, message.guildId), settings.duration);
            await query(`UPDATE servers SET applications = '${escape(JSON.stringify([...NorthClient.storage.guilds[message.guildId].applications.applications.values()]))}' WHERE id = '${message.guildId}'`);
            embed.setTitle("Application Complete").setDescription("Your application has been submitted and will be viewed by administrators or moderators. You will be notify when it is approved or denied.").setFooter({ text: "Have a nice day! :)", iconURL: message.client.user.displayAvatarURL() });
        } catch (err) {
            embed.setTitle("Application Error").setDescription("We failed to receive your description! Try again later.").setFooter({ text: "Have a nice day! :)", iconURL: message.client.user.displayAvatarURL() });
        }
        await (<Discord.Message> interaction.message).edit({ embeds: [embed], components: [] });
    }
}

const cmd = new ApplyCommand();
export default cmd;