import { NorthInteraction, SlashCommand } from "../../classes/NorthClient.js";
import { getChatMultiplier, getTokensAndMultiplier, updateChatMultiplier, updateMultiplier, updateTokens } from "../../function.js";

class TokensCommand implements SlashCommand {
	name = "tokens";
	description = "Retrieves and modifies users' tokens.";
	category = -1;
    permissions = { guild: { user: 8 } };
	options = [
		{
			name: "get",
			description: "Gets the tokens and multiplier of a user.",
			type: "SUB_COMMAND",
			options: [{
				name: "user",
				description: "The user's tokens and multiplier to get.",
				type: "USER",
				required: false
			}]
		},
		{
			name: "tokens",
			description: "Sub-commands for tokens retrieval and modification.",
			type: "SUB_COMMAND_GROUP",
			options: [
				{
					name: "set",
					description: "Sets the tokens of a user.",
					type: "SUB_COMMAND",
					options: [
						{
							name: "value",
							description: "The new value of tokens.",
							type: "INTEGER",
							required: true
						},
						{
							name: "user",
							description: "The user's tokens to set.",
							type: "USER",
							required: false
						}
					]
				},
				{
					name: "add",
					description: "Adds or subtracts tokens to or from a user.",
					type: "SUB_COMMAND",
					options: [
						{
							name: "change",
							description: "The change in tokens, can be negative.",
							type: "INTEGER",
							required: true
						},
						{
							name: "user",
							description: "The user's tokens to change.",
							type: "USER",
							required: false
						}
					]
				},
				{
					name: "scale",
					description: "Scales the user's multiplier.",
					type: "SUB_COMMAND",
					options: [
						{
							name: "ratio",
							description: "The ratio to be multiplied into the tokens.",
							type: "NUMBER",
							required: true
						},
						{
							name: "user",
							description: "The user's tokens to scale.",
							type: "USER",
							required: false
						}
					]
				}
			]
		},
		{
			name: "multiplier",
			description: "Sub-commands for multiplier retrieval and modification.",
			type: "SUB_COMMAND_GROUP",
			options: [
				{
					name: "set",
					description: "Sets the multiplier of a user.",
					type: "SUB_COMMAND",
					options: [
						{
							name: "value",
							description: "The new value of multiplier.",
							type: "NUMBER",
							required: true
						},
						{
							name: "user",
							description: "The user's multiplier to set.",
							type: "USER",
							required: false
						}
					]
				},
				{
					name: "add",
					description: "Adds or subtracts multiplier to or from a user.",
					type: "SUB_COMMAND",
					options: [
						{
							name: "change",
							description: "The change in multiplier, can be negative.",
							type: "NUMBER",
							required: true
						},
						{
							name: "user",
							description: "The user's multiplier to change.",
							type: "USER",
							required: false
						}
					]
				},
				{
					name: "scale",
					description: "Scales the user's multiplier.",
					type: "SUB_COMMAND",
					options: [
						{
							name: "ratio",
							description: "The ratio to be multiplied into the multiplier.",
							type: "NUMBER",
							required: true
						},
						{
							name: "user",
							description: "The user's multiplier to scale.",
							type: "USER",
							required: false
						}
					]
				}
			]
		},
		{
			name: "chat",
			description: "Sub-commands for chat multiplier modification.",
			type: "SUB_COMMAND_GROUP",
			options: [
				{
					name: "set",
					description: "Sets the multiplier of a user.",
					type: "SUB_COMMAND",
					options: [
						{
							name: "value",
							description: "The new value of multiplier.",
							type: "NUMBER",
							required: true
						},
						{
							name: "user",
							description: "The user's multiplier to set.",
							type: "USER",
							required: false
						}
					]
				},
				{
					name: "add",
					description: "Adds or subtracts multiplier to or from a user.",
					type: "SUB_COMMAND",
					options: [
						{
							name: "change",
							description: "The change in multiplier, can be negative.",
							type: "NUMBER",
							required: true
						},
						{
							name: "user",
							description: "The user's multiplier to change.",
							type: "USER",
							required: false
						}
					]
				},
				{
					name: "scale",
					description: "Scales the user's multiplier.",
					type: "SUB_COMMAND",
					options: [
						{
							name: "ratio",
							description: "The ratio to be multiplied into the multiplier.",
							type: "NUMBER",
							required: true
						},
						{
							name: "user",
							description: "The user's multiplier to scale.",
							type: "USER",
							required: false
						}
					]
				}
			]
		}
	]

	async execute(interaction: NorthInteraction) {
		await interaction.deferReply();
		const group = interaction.options.getSubcommandGroup(false);
		const subcommand = interaction.options.getSubcommand();
		if (!group && subcommand === "get") return await this.get(interaction);
		return await this[group][subcommand](interaction);
	}

	async get(interaction: NorthInteraction) {
		const user = interaction.options.getUser("user") || interaction.user;
		const data = await getTokensAndMultiplier(user.id, null);
		if (!data) return await interaction.editReply("This user didn't have their Minecraft username verified!");
		await interaction.editReply(`**${user.tag}**\nTokens: **${data.tokens}**\nMultiplier: **${data.multiplier}**`);
	}

	tokens = {
		set: async (interaction: NorthInteraction) => {
			const user = interaction.options.getUser("user") || interaction.user;
			const data = await getTokensAndMultiplier(user.id, null);
			if (!data) return await interaction.editReply("This user didn't have their Minecraft username verified!");
			const value = Math.max(interaction.options.getInteger("value"), 0);
			await updateTokens(user.id, null, value);
			await interaction.editReply(`Set **${user.tag}**'s tokens to **${value}**`);
		},
		add: async (interaction: NorthInteraction) => {
			const user = interaction.options.getUser("user") || interaction.user;
			const data = await getTokensAndMultiplier(user.id, null);
			if (!data) return await interaction.editReply("This user didn't have their Minecraft username verified!");
			const change = interaction.options.getInteger("value");
			const value = Math.max(data.tokens + change, 0);
			await updateTokens(user.id, null, value);
			await interaction.editReply(`Changed **${user.tag}**'s tokens by **${change}** to **${value}**`);
		},
		scale: async (interaction: NorthInteraction) => {
			const user = interaction.options.getUser("user") || interaction.user;
			const data = await getTokensAndMultiplier(user.id, null);
			if (!data) return await interaction.editReply("This user didn't have their Minecraft username verified!");
			const scale = Math.max(interaction.options.getNumber("ratio"), 0);
			const value = Math.round(data.tokens * scale);
			await updateTokens(user.id, null, value);
			await interaction.editReply(`Scaled **${user.tag}**'s tokens by **${scale}** to **${value}**`);
		}
	}

	multiplier = {
		set: async (interaction: NorthInteraction) => {
			const user = interaction.options.getUser("user") || interaction.user;
			const data = await getTokensAndMultiplier(user.id, null);
			if (!data) return await interaction.editReply("This user didn't have their Minecraft username verified!");
			const value = Math.max(interaction.options.getNumber("value"), 0);
			await updateMultiplier(user.id, null, value);
			await interaction.editReply(`Set **${user.tag}**'s multiplier to **${value}**`);
		},
		add: async (interaction: NorthInteraction) => {
			const user = interaction.options.getUser("user") || interaction.user;
			const data = await getTokensAndMultiplier(user.id, null);
			if (!data) return await interaction.editReply("This user didn't have their Minecraft username verified!");
			const change = interaction.options.getNumber("change");
			const value = Math.max(data.multiplier + change, 0);
			await updateMultiplier(user.id, null, value);
			await interaction.editReply(`Changed **${user.tag}**'s multiplier by **${change}** to **${value}**`);
		},
		scale: async (interaction: NorthInteraction) => {
			const user = interaction.options.getUser("user") || interaction.user;
			const data = await getTokensAndMultiplier(user.id, null);
			if (!data) return await interaction.editReply("This user didn't have their Minecraft username verified!");
			const scale = Math.max(interaction.options.getNumber("ratio"), 0);
			const value = data.multiplier * scale;
			await updateMultiplier(user.id, null, value);
			await interaction.editReply(`Scaled **${user.tag}**'s multiplier by **${scale}** to **${value}**`);
		}
	}

	chat = {
		set: async (interaction: NorthInteraction) => {
			const user = interaction.options.getUser("user") || interaction.user;
			const multiplier = await getChatMultiplier(user.id, interaction.guildId);
			const value = Math.max(0, interaction.options.getNumber("value"));
			await updateChatMultiplier(user.id, interaction.guildId, value);
			await interaction.editReply(`Set **${user.tag}**'s multiplier to **${value}**`);
		},
		add: async (interaction: NorthInteraction) => {
			const user = interaction.options.getUser("user") || interaction.user;
			const multiplier = await getChatMultiplier(user.id, interaction.guildId);
			const change = Math.max(interaction.options.getNumber("change"), -multiplier);
			await updateChatMultiplier(user.id, interaction.guildId, multiplier + change);
			await interaction.editReply(`Changed **${user.tag}**'s multiplier by **${change}** to **${multiplier + change}**`);
		},
		scale: async (interaction: NorthInteraction) => {
			const user = interaction.options.getUser("user") || interaction.user;
			const multiplier = await getChatMultiplier(user.id, interaction.guildId);
			const scale = Math.max(interaction.options.getNumber("ratio"), 0);
			await updateChatMultiplier(user.id, interaction.guildId, multiplier * scale);
			await interaction.editReply(`Scaled **${user.tag}**'s multiplier by **${scale}** to **${multiplier * scale}**`);
		}
	}
}

const cmd = new TokensCommand();
export default cmd;