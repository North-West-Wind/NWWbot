import { Collection, TextChannel } from "discord.js";
import { NorthClient, NorthInteraction, SlashCommand } from "../../classes/NorthClient.js";
import { query } from "../../function.js";

class TranslationCommand implements SlashCommand {
	name = "translation";
	description = "Handles translations of messages.";
	options = [
		{
			name: "add",
			description: "Adds a new message to be translated.",
			type: "SUB_COMMAND",
			options: [{
				name: "message",
				description: "The message.",
				type: "STRING",
				required: true
			}]
		},
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
			type: "SUB_COMMAND",
			options: [{
				name: "id",
				description: "The message ID.",
				type: "STRING",
				required: true
			}]
		}
	]

	async execute(interaction: NorthInteraction) {
		switch (interaction.options.getSubcommand()) {
			case "add": return await this.add(interaction);
			case "end": return await this.end(interaction);
			case "get": return await this.get(interaction);
			default: interaction.reply("how tf did u get here?")
		}
	}

	async add(interaction: NorthInteraction) {
		const message = interaction.options.getString("message");
		const channel = <TextChannel> await interaction.guild.channels.fetch("978612824601395200");
		const msg = await channel.send(message);
		NorthClient.storage.guilds[interaction.guildId].translations.set(msg.id, { messageId: msg.id, channelId: channel.id, guildId: interaction.guildId, translations: new Collection() });
		await query(`INSERT INTO translations (id, guild, channel, translations) VALUES(${msg.id}, ${interaction.guildId}, ${channel.id}, "{}")`);
		await interaction.reply("Added message to translation submission.");
	}

	async end(interaction: NorthInteraction) {
		const id = interaction.options.getString("id");
		if (NorthClient.storage.guilds[interaction.guildId].translations.delete(id)) {
			await query(`UPDATE translations SET ended = 1 WHERE id = ${id}`);
			await interaction.reply(`Ended submission for message ID ${id}.`);
		} else await interaction.reply(`Message with ID ${id} doesn't exist!`);
	}

	async get(interaction: NorthInteraction) {

	}
}

const cmd = new TranslationCommand();
export default cmd;