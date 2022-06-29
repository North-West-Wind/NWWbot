import { NorthInteraction, SlashCommand } from "../../classes/NorthClient.js";
import { getTokensAndMultiplier, updateMultiplier, updateTokens } from "../../function.js";

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
		}
	]

	async execute(interaction: NorthInteraction) {
		await interaction.deferReply();
		const group = interaction.options.getSubcommandGroup(false);
		const subcommand = interaction.options.getSubcommand();
		if (!group && subcommand === "get") return await this.get(interaction);
		if (group === "tokens") return this.tokens[subcommand](interaction);
		else if (group === "multiplier") return this.multiplier[subcommand](interaction);
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
			const change = Math.round(Math.max(interaction.options.getInteger("value") - data.tokens, -data.tokens));
			await updateTokens(user.id, null, change, data);
			await interaction.editReply(`Set **${user.tag}**'s tokens to **${data.tokens + change}**`);
		},
		add: async (interaction: NorthInteraction) => {
			const user = interaction.options.getUser("user") || interaction.user;
			const data = await getTokensAndMultiplier(user.id, null);
			if (!data) return await interaction.editReply("This user didn't have their Minecraft username verified!");
			const change = Math.round(Math.max(interaction.options.getInteger("change"), -data.tokens));
			await updateTokens(user.id, null, change, data);
			await interaction.editReply(`Changed **${user.tag}**'s tokens by **${change}** to **${data.tokens + change}**`);
		},
		scale: async (interaction: NorthInteraction) => {
			const user = interaction.options.getUser("user") || interaction.user;
			const data = await getTokensAndMultiplier(user.id, null);
			if (!data) return await interaction.editReply("This user didn't have their Minecraft username verified!");
			const scale = Math.max(interaction.options.getNumber("ratio"), 0);
			const value = Math.round(data.tokens * scale);
			await updateTokens(user.id, null, value - data.tokens, data);
			await interaction.editReply(`Scaled **${user.tag}**'s tokens by **${scale}** to **${value}**`);
		}
	}

	multiplier = {
		set: async (interaction: NorthInteraction) => {
			const user = interaction.options.getUser("user") || interaction.user;
			const data = await getTokensAndMultiplier(user.id, null);
			if (!data) return await interaction.editReply("This user didn't have their Minecraft username verified!");
			console.log(data.multiplier);
			const change = Math.max(interaction.options.getNumber("value") - data.multiplier, -data.multiplier);
			await updateMultiplier(user.id, null, change, data);
			await interaction.editReply(`Set **${user.tag}**'s multiplier to **${data.multiplier + change}**`);
		},
		add: async (interaction: NorthInteraction) => {
			const user = interaction.options.getUser("user") || interaction.user;
			const data = await getTokensAndMultiplier(user.id, null);
			if (!data) return await interaction.editReply("This user didn't have their Minecraft username verified!");
			const change = Math.max(interaction.options.getNumber("change"), -data.multiplier);
			await updateMultiplier(user.id, null, change, data);
			await interaction.editReply(`Changed **${user.tag}**'s multiplier by **${change}** to **${data.multiplier + change}**`);
		},
		scale: async (interaction: NorthInteraction) => {
			const user = interaction.options.getUser("user") || interaction.user;
			const data = await getTokensAndMultiplier(user.id, null);
			if (!data) return await interaction.editReply("This user didn't have their Minecraft username verified!");
			const scale = Math.max(interaction.options.getNumber("ratio"), 0);
			await updateMultiplier(user.id, null, data.multiplier * scale - data.multiplier, data);
			await interaction.editReply(`Scaled **${user.tag}**'s multiplier by **${scale}** to **${data.multiplier * scale}**`);
		}
	}
}

const cmd = new TokensCommand();
export default cmd;