import { Collection, Message, MessageActionRow, MessageButton, MessageComponentInteraction, MessageEmbed, MessageSelectMenu, Modal, TextChannel, TextInputComponent } from "discord.js";
import { NorthClient, NorthInteraction, SlashCommand } from "../../classes/NorthClient.js";
import { color, query } from "../../function.js";

class TranslationCommand implements SlashCommand {
	name = "translation";
	description = "Handles translations of messages.";
	options = [
		{
			name: "end",
			description: "Ends a translation's submission.",
			type: "SUB_COMMAND",
			options: [{
				name: "id",
				description: "The message ID.",
				type: "STRING",
				required: true
			}]
		},
		{
			name: "get",
			description: "Retrieves a translated message.",
			type: "SUB_COMMAND"
		}
	]

	async execute(interaction: NorthInteraction) {
		await interaction.deferReply({ ephemeral: true });
		switch (interaction.options.getSubcommand()) {
			case "end": return await this.end(interaction);
			case "get": return await this.get(interaction);
			default: await interaction.editReply("how tf did u get here?")
		}
	}

	async end(interaction: NorthInteraction) {
		const id = interaction.options.getString("id");
		if (NorthClient.storage.guilds[interaction.guildId].translations.delete(id)) {
			await query(`UPDATE translations SET ended = 1 WHERE id = ${id}`);
			await interaction.editReply(`Ended submission for message ID ${id}.`);
		} else await interaction.editReply(`Message with ID ${id} doesn't exist!`);
	}

	async get(interaction: NorthInteraction) {
		const translations = NorthClient.storage.guilds[interaction.guildId].translations.filter(trans => !trans.ended);
		const allEmbeds: MessageEmbed[] = [];
		const allRows: MessageActionRow[][] = [];
		const pages = Math.ceil(translations.size / 5);
		for (let ii = 0; ii < pages; ii++) {
			const em = new MessageEmbed()
				.setColor(color())
				.setTitle(`Choose a message to receive its translation [${ii + 1}/${pages}]`)
				.setTimestamp()
				.setFooter({ text: "Use the buttons to navigate pages and choose an option in the select menu." });
			const menu = new MessageSelectMenu()
				.setCustomId("message")
				.setPlaceholder("Select message...");
			var description = "";
			for (let jj = 0; jj < Math.min(3, translations.size % 5 + 1); jj++) {
				const translation = translations.at(ii * 5 + jj);
				const msg = await (<TextChannel>await interaction.guild.channels.fetch(translation.channelId)).messages.fetch(translation.messageId);
				description += `**${translation.messageId}**\n${msg.content.slice(0, 100)}...\n\n`;
				menu.addOptions({ label: translation.messageId, value: translation.messageId });
			}
			em.setDescription(description);
			allEmbeds.push(em);
			allRows.push([new MessageActionRow().addComponents(menu), new MessageActionRow().addComponents(new MessageButton({ customId: "previous", emoji: "◀️", style: "PRIMARY" }), new MessageButton({ customId: "search", label: "Search by ID", emoji: "🔍", style: "SECONDARY" }), new MessageButton({ customId: "next", emoji: "▶️", style: "PRIMARY" }))]);
		}
		var s = 0;
		const msg = <Message>await interaction.editReply({ embeds: [allEmbeds[s]], components: allRows[s] });
		const collector = msg.createMessageComponentCollector({ filter: (interaction) => interaction.user.id === interaction.user.id, idle: 60000 });
		collector.on("collect", async (interaction: MessageComponentInteraction) => {
			if (interaction.isButton()) {
				switch (interaction.customId) {
					case "previous":
						s -= 1;
						if (s < 0) s = allEmbeds.length - 1;
						interaction.update({ embeds: [allEmbeds[s]], components: allRows[s] });
						break;
					case "next":
						s += 1;
						if (s > allEmbeds.length - 1) s = 0;
						interaction.update({ embeds: [allEmbeds[s]], components: allRows[s] });
						break;
					case "search":
						const modal = new Modal()
							.setCustomId("modal")
							.setTitle("Search by ID")
							.addComponents(new MessageActionRow<TextInputComponent>().addComponents(new TextInputComponent().setCustomId("id").setLabel("What is the message ID you are searching for?").setStyle("SHORT")));
						await interaction.showModal(modal);
				}
			} else if (interaction.isSelectMenu()) {
				if (interaction.customId === "message") {
					const id = interaction.values[0];
					const trans = NorthClient.storage.guilds[interaction.guildId].translations.get(id);
					const menu = new MessageSelectMenu().setCustomId("language").setPlaceholder("Language...").addOptions(Object.keys(trans.translations).map(key => ({ label: key, value: `${id}_${key}` })));
					await interaction.update({ embeds: [], components: [new MessageActionRow().addComponents(menu)], content: "Please choose a language." });
				} else if (interaction.customId === "language") {
					const [id, lang] = interaction.values[0].split("_");
					const translation = NorthClient.storage.guilds[interaction.guildId].translations.get(id).translations.get(lang);
					await interaction.update({ embeds: [], components: [], content: await (await (<TextChannel> await interaction.guild.channels.fetch(translation.channelId)).messages.fetch(translation.messageId)).content });
				}
			} else if (interaction.isModalSubmit()) {
				const id = interaction.fields.getTextInputValue("id");
				const trans = NorthClient.storage.guilds[interaction.guildId].translations.get(id);
				if (!trans) return await interaction.update({ embeds: [], components: [], content: `The message with ID ${id} doesn't exist!` });
				const menu = new MessageSelectMenu().setCustomId("language").setPlaceholder("Language...").addOptions(Object.keys(trans.translations).map(key => ({ label: key, value: `${id}_${key}` })));
				await interaction.update({ embeds: [], components: [new MessageActionRow().addComponents(menu)], content: "Please choose a language." });
			}
		});
	}
}

const cmd = new TranslationCommand();
export default cmd;