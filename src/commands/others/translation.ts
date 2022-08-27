import { Guild, Message, ActionRowBuilder, ButtonBuilder, MessageComponentInteraction, EmbedBuilder, SelectMenuBuilder, ModalBuilder, ModalSubmitInteraction, PermissionsBitField, SelectMenuInteraction, Snowflake, TextChannel, TextInputBuilder, ButtonStyle, MessageActionRowComponentBuilder, TextInputStyle } from "discord.js";
import { NorthClient, NorthInteraction, SlashCommand } from "../../classes/NorthClient.js";
import { changeTokens, color, query } from "../../function.js";

class TranslationCommand implements SlashCommand {
	name = "translation";
	description = "Handles translations of messages.";
	category = -1;
	options = [
		{
			name: "announce",
			description: "Announces the message.",
			type: "SUB_COMMAND",
			options: [
				{
					name: "channel",
					description: "The channel to announce in.",
					required: true,
					type: "CHANNEL"
				},
				{
					name: "id",
					description: "The ID of the message.",
					required: false,
					type: "STRING"
				}
			]
		},
		{
			name: "get",
			description: "Retrieves a translated message.",
			type: "SUB_COMMAND",
			options: [{
				name: "id",
				description: "The ID of the message.",
				required: false,
				type: "STRING"
			}]
		},
		{
			name: "link",
			description: "Links an announcement to the translation.",
			type: "SUB_COMMAND",
			options: [
				{
					name: "announced_id",
					description: "The ID of the announcement message.",
					required: true,
					type: "STRING"
				},
				{
					name: "translate_id",
					description: "The ID of the translation message.",
					required: false,
					type: "STRING"
				}
			]
		}
	]

	async execute(interaction: NorthInteraction) {
		await interaction.deferReply({ ephemeral: true });
		switch (interaction.options.getSubcommand()) {
			case "announce": return await this.announce(interaction);
			case "get": return await this.get(interaction);
			case "link": return await this.link(interaction);
			default: await interaction.editReply("how tf did u get here?")
		}
	}

	// Also reward guild points
	async updateExisting(guild: Guild, transId: Snowflake, existId: Snowflake) {
		const trans = NorthClient.storage.guilds[guild.id].translations.get(transId);
		trans.existingId = existId;
		for (const translation of trans.translations.values()) {
			const channel = await guild.channels.fetch(translation.channelId);
			if (channel instanceof TextChannel) {
				const mesg = await channel.messages.fetch(translation.messageId);
				if (mesg?.author?.id) await changeTokens(mesg.author.id, null, 7);
			}
		}
		NorthClient.storage.guilds[guild.id].translations.set(transId, trans);
		await query(`UPDATE translations SET existing = ${existId} WHERE id = ${transId}`);
	}

	async announce(interaction: NorthInteraction) {
		if (!(<PermissionsBitField>interaction.member.permissions).has(BigInt(32))) return await interaction.editReply("You don't have the permissions to use this subcommand!");
		const channel = interaction.options.getChannel("channel");
		if (!(channel instanceof TextChannel)) return await interaction.editReply(`The channel is not a text channel!`);
		let id: Snowflake;
		if (id = interaction.options.getString("id")) {
			const trans = NorthClient.storage.guilds[interaction.guildId].translations.get(id);
			if (trans) {
				const mm = await (<TextChannel>await interaction.guild.channels.fetch(trans.channelId)).messages.fetch(trans.messageId);
				const msg = await channel.send({ tts: mm.tts, nonce: mm.nonce, content: mm.content, embeds: mm.embeds, files: Array.from(mm.attachments.values()) });
				await this.updateExisting(interaction.guild, id, msg.id);
				await interaction.editReply(`Announced message with ID ${id}.`);
			} else await interaction.editReply(`Message with ID ${id} doesn't exist!`);
			return;
		}
		const translations = NorthClient.storage.guilds[interaction.guildId].translations.filter(trans => !trans.existingId);
		const allEmbeds: EmbedBuilder[] = [];
		const allRows: ActionRowBuilder<MessageActionRowComponentBuilder>[][] = [];
		const pages = Math.ceil(translations.size / 5);
		for (let ii = 0; ii < pages; ii++) {
			const em = new EmbedBuilder()
				.setColor(color())
				.setTitle(`Choose a message to announce [${ii + 1}/${pages}]`)
				.setTimestamp()
				.setFooter({ text: "Use the buttons to navigate pages and choose an option in the select menu." });
			const menu = new SelectMenuBuilder()
				.setCustomId("message")
				.setPlaceholder("Select message...");
			let description = "";
			for (let jj = 0; jj < 5; jj++) {
				const translation = translations.at(ii * 5 + jj);
				if (!translation) break;
				const msg = await (<TextChannel>await interaction.guild.channels.fetch(translation.channelId)).messages.fetch(translation.messageId);
				description += `**${translation.messageId}**\n${msg.content.slice(0, 100)}...\n\n`;
				menu.addOptions({ label: translation.messageId, value: translation.messageId });
			}
			if (description) em.setDescription(description);
			allEmbeds.push(em);
			allRows.push([new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(menu), new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(new ButtonBuilder({ customId: "previous", emoji: "◀️", style: ButtonStyle.Primary }), new ButtonBuilder({ customId: "search", label: "Search by ID", emoji: "🔍", style: ButtonStyle.Secondary }), new ButtonBuilder({ customId: "next", emoji: "▶️", style: ButtonStyle.Primary }))]);
		}
		let s = 0;
		const msg = <Message>await interaction.editReply({ embeds: [allEmbeds[s]], components: allRows[s] });
		const collector = msg.createMessageComponentCollector({ filter: (int) => int.user.id === interaction.user.id, idle: 60000 });
		collector.on("collect", async (interaction: MessageComponentInteraction): Promise<any> => {
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
						const modal = new ModalBuilder()
							.setCustomId("modal")
							.setTitle("Search by ID")
							.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder().setCustomId("id").setLabel("What is the message ID you are searching for?").setStyle(TextInputStyle.Short)));
						await interaction.showModal(modal);
						const received = <ModalSubmitInteraction>await interaction.awaitModalSubmit({ filter: int => int.user.id === interaction.user.id, time: 60000 }).catch(() => null);
						if (!received) break;
						id = received.fields.getTextInputValue("id");
						const trans = NorthClient.storage.guilds[interaction.guildId].translations.get(id);
						if (!trans) return await received.editReply({ embeds: [], components: [], content: `The message with ID ${id} doesn't exist!` });
						const mm = await (<TextChannel>await interaction.guild.channels.fetch(trans.channelId)).messages.fetch(trans.messageId);
						const msg = await channel.send({ tts: mm.tts, nonce: mm.nonce, content: mm.content, embeds: mm.embeds, files: Array.from(mm.attachments.values()) });
						await this.updateExisting(interaction.guild, id, msg.id);
						await received.editReply({ components: [], content: `Announced message with ID ${id}.` });
						collector.emit("end");
				}
			} else if (interaction.isSelectMenu()) {
				if (interaction.customId === "message") {
					id = interaction.values[0];
					const trans = NorthClient.storage.guilds[interaction.guildId].translations.get(id);
					const mm = await (<TextChannel>await interaction.guild.channels.fetch(trans.channelId)).messages.fetch(trans.messageId);
					const msg = await channel.send({ tts: mm.tts, nonce: mm.nonce || "", content: mm.content, embeds: mm.embeds, files: Array.from(mm.attachments.values()) });
					await this.updateExisting(interaction.guild, id, msg.id);
					await interaction.update({ components: [], embeds: [], content: `Announced message with ID ${id}.` });
					collector.emit("end");
				}
			}
		});
		collector.on("end", () => { interaction.editReply({ components: [] }); });
	}

	async get(interaction: NorthInteraction) {
		let id: Snowflake;
		if (id = interaction.options.getString("id")) {
			const trans = NorthClient.storage.guilds[interaction.guildId].translations.find(tr => tr.existingId == id);
			if (!trans) return await interaction.editReply(`Message with ID ${id} doesn't exist!`);
			const menu = new SelectMenuBuilder().setCustomId("language").setPlaceholder("Language...").addOptions(trans.translations.map((val, key) => ({ label: key, value: `${id}_${key}` })));
			const msg = <Message>await interaction.editReply({ embeds: [], components: [new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(menu)], content: "Please choose a language." });
			const int = <SelectMenuInteraction>await msg.awaitMessageComponent({ filter: int => int.user.id === interaction.user.id, time: 30000 }).catch(() => null);
			const lang = int.values[0].split("_")[1];
			const translation = trans.translations.get(lang);
			await int.update({ embeds: [], components: [], content: (await (<TextChannel>await interaction.guild.channels.fetch(translation.channelId)).messages.fetch(translation.messageId)).content });
			return;
		}
		const translations = NorthClient.storage.guilds[interaction.guildId].translations.filter(trans => !!trans.existingId);
		const allEmbeds: EmbedBuilder[] = [];
		const allRows: ActionRowBuilder<MessageActionRowComponentBuilder>[][] = [];
		const pages = Math.ceil(translations.size / 5);
		for (let ii = 0; ii < pages; ii++) {
			const em = new EmbedBuilder()
				.setColor(color())
				.setTitle(`Choose a message to receive its translation [${ii + 1}/${pages}]`)
				.setTimestamp()
				.setFooter({ text: "Use the buttons to navigate pages and choose an option in the select menu." });
			const menu = new SelectMenuBuilder()
				.setCustomId("message")
				.setPlaceholder("Select message...");
			let description = "";
			for (let jj = 0; jj < 5; jj++) {
				const translation = translations.at(ii * 5 + jj);
				if (!translation) break;
				const msg = await (<TextChannel>await interaction.guild.channels.fetch(translation.channelId)).messages.fetch(translation.messageId);
				description += `**${translation.messageId}**\n${msg.content.slice(0, 100)}...\n\n`;
				menu.addOptions({ label: translation.messageId, value: translation.messageId });
			}
			if (description) em.setDescription(description);
			allEmbeds.push(em);
			allRows.push([new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(menu), new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(new ButtonBuilder({ customId: "previous", emoji: "◀️", style: ButtonStyle.Primary }), new ButtonBuilder({ customId: "search", label: "Search by ID", emoji: "🔍", style: ButtonStyle.Secondary }), new ButtonBuilder({ customId: "next", emoji: "▶️", style: ButtonStyle.Primary }))]);
		}
		let s = 0;
		const msg = <Message>await interaction.editReply({ embeds: [allEmbeds[s]], components: allRows[s] });
		const collector = msg.createMessageComponentCollector({ filter: (int) => int.user.id === interaction.user.id, idle: 60000 });
		collector.on("collect", async (interaction: MessageComponentInteraction): Promise<any> => {
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
						const modal = new ModalBuilder()
							.setCustomId("modal")
							.setTitle("Search by ID")
							.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder().setCustomId("id").setLabel("What is the message ID you are searching for?").setStyle(TextInputStyle.Short)));
						await interaction.showModal(modal);
						const received = <ModalSubmitInteraction>await interaction.awaitModalSubmit({ filter: int => int.user.id === interaction.user.id, time: 60000 }).catch(() => null);
						if (!received) break;
						id = received.fields.getTextInputValue("id");
						const trans = NorthClient.storage.guilds[interaction.guildId].translations.get(id);
						if (!trans) return await interaction.update({ embeds: [], components: [], content: `The message with ID ${id} doesn't exist!` });
						const menu = new SelectMenuBuilder().setCustomId("language").setPlaceholder("Language...").addOptions(trans.translations.map((val, key) => ({ label: key, value: `${id}_${key}` })));
						await received.editReply({ embeds: [], components: [new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(menu)], content: "Please choose a language." });
				}
			} else if (interaction.isSelectMenu()) {
				if (interaction.customId === "message") {
					id = interaction.values[0];
					const trans = NorthClient.storage.guilds[interaction.guildId].translations.get(id);
					const menu = new SelectMenuBuilder().setCustomId("language").setPlaceholder("Language...").addOptions(trans.translations.map((val, key) => ({ label: key, value: `${id}_${key}` })));
					await interaction.update({ embeds: [], components: [new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(menu)], content: "Please choose a language." });
				} else if (interaction.customId === "language") {
					const [id, lang] = interaction.values[0].split("_");
					const translation = NorthClient.storage.guilds[interaction.guildId].translations.get(id).translations.get(lang);
					await interaction.update({ embeds: [], components: [], content: (await (<TextChannel>await interaction.guild.channels.fetch(translation.channelId)).messages.fetch(translation.messageId)).content });
					collector.emit("end");
				}
			}
		});
		collector.on("end", () => { interaction.editReply({ components: [] }); });
	}

	async link(interaction: NorthInteraction) {
		if (!(<PermissionsBitField>interaction.member.permissions).has(BigInt(32))) return await interaction.editReply("You don't have the permissions to use this subcommand!");
		const announced = interaction.options.getString("announced_id");
		if (NorthClient.storage.guilds[interaction.guildId].translations.find(trans => trans.existingId === announced)) return await interaction.editReply("This announcement is already linked!");
		let id: Snowflake;
		if (id = interaction.options.getString("id")) {
			const trans = NorthClient.storage.guilds[interaction.guildId].translations.get(id);
			if (trans) {
				await this.updateExisting(interaction.guild, id, announced);
				await interaction.editReply(`Linked message with ID ${id} to announcement ${announced}.`);
			} else await interaction.editReply(`Message with ID ${id} doesn't exist!`);
			return;
		}
		const translations = NorthClient.storage.guilds[interaction.guildId].translations.filter(trans => !trans.existingId);
		const allEmbeds: EmbedBuilder[] = [];
		const allRows: ActionRowBuilder<MessageActionRowComponentBuilder>[][] = [];
		const pages = Math.ceil(translations.size / 5);
		for (let ii = 0; ii < pages; ii++) {
			const em = new EmbedBuilder()
				.setColor(color())
				.setTitle(`Choose a message to link to [${ii + 1}/${pages}]`)
				.setTimestamp()
				.setFooter({ text: "Use the buttons to navigate pages and choose an option in the select menu." });
			const menu = new SelectMenuBuilder()
				.setCustomId("message")
				.setPlaceholder("Select message...");
			let description = "";
			for (let jj = 0; jj < 5; jj++) {
				const translation = translations.at(ii * 5 + jj);
				if (!translation) break;
				const msg = await (<TextChannel>await interaction.guild.channels.fetch(translation.channelId)).messages.fetch(translation.messageId);
				description += `**${translation.messageId}**\n${msg.content.slice(0, 100)}...\n\n`;
				menu.addOptions({ label: translation.messageId, value: translation.messageId });
			}
			if (description) em.setDescription(description);
			allEmbeds.push(em);
			allRows.push([new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(menu), new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(new ButtonBuilder({ customId: "previous", emoji: "◀️", style: ButtonStyle.Primary }), new ButtonBuilder({ customId: "search", label: "Search by ID", emoji: "🔍", style: ButtonStyle.Secondary }), new ButtonBuilder({ customId: "next", emoji: "▶️", style: ButtonStyle.Primary }))]);
		}
		let s = 0;
		const msg = <Message>await interaction.editReply({ embeds: [allEmbeds[s]], components: allRows[s] });
		const collector = msg.createMessageComponentCollector({ filter: (int) => int.user.id === interaction.user.id, idle: 60000 });
		collector.on("collect", async (interaction: MessageComponentInteraction): Promise<any> => {
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
						const modal = new ModalBuilder()
							.setCustomId("modal")
							.setTitle("Search by ID")
							.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder().setCustomId("id").setLabel("What is the message ID you are searching for?").setStyle(TextInputStyle.Short)));
						await interaction.showModal(modal);
						const received = <ModalSubmitInteraction>await interaction.awaitModalSubmit({ filter: int => int.user.id === interaction.user.id, time: 60000 }).catch(() => null);
						if (!received) break;
						id = received.fields.getTextInputValue("id");
						const trans = NorthClient.storage.guilds[interaction.guildId].translations.get(id);
						if (!trans) return await received.editReply({ embeds: [], components: [], content: `The message with ID ${id} doesn't exist!` });
						await this.updateExisting(interaction.guild, id, announced);
						await received.editReply({ components: [], content: `Linked message with ID ${id} to announcement ${announced}.` });
						collector.emit("end");
				}
			} else if (interaction.isSelectMenu()) {
				if (interaction.customId === "message") {
					id = interaction.values[0];
					const trans = NorthClient.storage.guilds[interaction.guildId].translations.get(id);
					await this.updateExisting(interaction.guild, id, announced);
					await interaction.update({ components: [], embeds: [], content: `Linked message with ID ${id} to announcement ${announced}.` });
					collector.emit("end");
				}
			}
		});
		collector.on("end", () => { interaction.editReply({ components: [] }); });
	}
}

const cmd = new TranslationCommand();
export default cmd;
