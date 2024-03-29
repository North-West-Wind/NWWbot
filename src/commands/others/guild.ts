
import { NorthMessage, NorthClient, NorthInteraction, SlashCommand } from "../../classes/NorthClient.js";
import * as Discord from "discord.js";
import { color, createEmbedScrolling, findChannel, findRole, findUser, getFetch, getRandomNumber, getWithWeight, jsDate2Mysql, ms, msgOrRes, mysqlEscape, nameExists, nameToUuid, profile, query, readableDateTimeText, roundTo, setTimeout_, updateGuildMemberMC } from "../../function.js";
import { ButtonStyle, MessageActionRowComponentBuilder } from "discord.js";

const fetch = getFetch();
const catabombLevels = [
	50,
	125,
	235,
	395,
	625,
	955,
	1425,
	2095,
	3045,
	4385,
	6275,
	8940,
	12700,
	17960,
	25340,
	35640,
	50040,
	70040,
	97640,
	135640,
	188140,
	259640,
	356640,
	488640,
	668640,
	911640,
	1239640,
	1684640,
	2284640,
	3084640,
	4149640,
	5559640,
	7459640,
	9959640,
	13259640,
	17559640,
	23157640,
	30359640,
	39559640,
	51559640,
	66559640,
	85559640,
	109559640,
	139559640,
	177559640,
	225559640,
	285559640,
	360559640,
	453559640,
	569809640
]

class GuildCommand implements SlashCommand {
	name = "guild"
	description = "Made specificly for the Hypixel guild War of Underworld."
	usage = "<subcommand>"
	aliases = ["gu"]
	subcommands = ["splash", "invite", "lottery", "timer", "calculate"]
	subaliases = ["sp", "in", "lot", "tim", "calc"]
	subdesc = ["Creates a splash notification.", "Manages invites.", "Starts a lottery.", "Manages timers.", "Calculates user points."]
	subusage = [null, "<subcommand> <user>", null, "<subsubcommand> <user> <username> <time> <ranks>", "<subcommand> <username>"]
	args = 1
	category = -1;

	options = [
		{
			name: "splash",
			description: "Creates a splash notification.",
			type: "SUB_COMMAND"
		},
		{
			name: "invite",
			description: "Manages invites.",
			type: "SUB_COMMAND",
			options: [{
				name: "user",
				description: "The user's information to display.",
				required: true,
				type: "USER"
			}]
		},
		{
			name: "lottery",
			description: "Starts a lottery.",
			type: "SUB_COMMAND"
		},
		{
			name: "timer",
			description: "Manages timers.",
			type: "SUB_COMMAND",
			options: [
				{
					name: "user",
					description: "The user's timers to display.",
					required: true,
					type: "USER"
				},
				{
					name: "username",
					description: "The Minecraft username of the user.",
					required: true,
					type: "STRING"
				},
				{
					name: "time",
					description: "The time limit.",
					required: true,
					type: "STRING"
				},
				{
					name: "ranks",
					description: "The ranks to timeout.",
					required: true,
					type: "STRING"
				}
			]
		},
		{
			name: "calculate",
			description: "Calculates user points.",
			type: "SUB_COMMAND",
			options: [{
				name: "username",
				description: "The Minecraft username to calculate.",
				required: true,
				type: "STRING"
			}]
		},
		{
			name: "verify",
			description: "Force-verifies the user and add it into database.",
			type: "SUB_COMMAND",
			options: [
				{
					name: "user",
					description: "The Discord user to verify.",
					type: "USER",
					required: true
				},
				{
					name: "minecraft",
					description: "The Minecraft username to link to.",
					type: "STRING",
					required: true
				}
			]
		},
		{
			name: "update",
			description: "Force-updates all guild members.",
			type: "SUB_COMMAND"
		}
	]

	async execute(interaction: NorthInteraction) {
		switch (interaction.options.getSubcommand()) {
			case "splash":
				return await this.splash(interaction);
			case "invite":
				return await this.invite(interaction, interaction.options.getUser("user"));
			case "lottery":
				return await this.lottery(interaction);
			case "timer":
				return await this.timer(interaction, [interaction.options.getUser("user").id, interaction.options.getString("username"), interaction.options.getString("time"), interaction.options.getString("ranks")]);
			case "calculate":
				return await this.calculate(interaction, interaction.options.getString("username"));
			case "verify":
				return await this.verify(interaction, <Discord.GuildMember>interaction.options.getMember("user"), interaction.options.getString("minecraft"));
			case "update":
				return await this.update(interaction);
			default:
				return await interaction.reply("Please use a subcommand: " + `**${this.subcommands.join("**, **")}**\n` + `Usage: ${interaction.prefix}${this.name} ${this.usage}`);
		}
	}

	async invite(interaction: NorthInteraction, user: Discord.User) {
		const divine = await interaction.guild.roles.fetch("640148120579211265");
		if ((<Discord.GuildMember>interaction.member).roles.highest.position < divine.position) return await interaction.reply("You don't have the role to use this command!");
		await interaction.deferReply();
		try {
			const result = await query(`SELECT * FROM dcmc WHERE dcid = "${user.id}"`);
			const channel = <Discord.TextChannel>await interaction.client.channels.fetch("723479832452661269");
			let noname = false;
			if (result.length < 1) noname = true;
			const em = new Discord.EmbedBuilder()
				.setColor(color())
				.setTitle("Please choose an operation:")
				.setDescription("1️⃣: Accept\n2️⃣: Decline (Already in another guild)\n3️⃣: Decline (Already in guild)\n4️⃣: Decline (Banned)")
				.setTimestamp()
				.setFooter({ text: "Please choose within 2 minutes.", iconURL: interaction.client.user.displayAvatarURL() });

			const msg = <Discord.Message>await interaction.editReply({
				embeds: [em], components: [
					new Discord.ActionRowBuilder<MessageActionRowComponentBuilder>()
						.addComponents(new Discord.ButtonBuilder({ customId: "1", emoji: "1️⃣", style: ButtonStyle.Secondary }))
						.addComponents(new Discord.ButtonBuilder({ customId: "2", emoji: "2️⃣", style: ButtonStyle.Secondary }))
						.addComponents(new Discord.ButtonBuilder({ customId: "3", emoji: "3️⃣", style: ButtonStyle.Secondary }))
						.addComponents(new Discord.ButtonBuilder({ customId: "4", emoji: "4️⃣", style: ButtonStyle.Secondary }))
				]
			});

			const collected = await msg.awaitMessageComponent({ filter: (int) => int.user.id == interaction.user.id, time: 120000 }).catch(() => null);
			if (!collected || !(collected instanceof Discord.ButtonInteraction)) return await interaction.editReply("No operation chosen in 2 minutes. Please try again.");
			switch (collected.customId) {
				case "1":
					await collected.update({ content: "Request Accpected", embeds: [] });
					channel.send(`✅ | <@${user.id}> Congratulations ! You have been invited to the guild. Please accept the invite in Hypixel in 5 minutes ! If you can't join our guild right now, you will need to find guild officers to invite you again later.` + (noname ? "Don't forget to enter your Minecraft username in <#647630951169523762>!" : ""));
					break;
				case "2":
					await collected.update({ content: "Request Declined (Already in another guild)", embeds: [] });
					channel.send(`❌ | <@${user.id}> Sorry, you are not allow to join our guild because you are already in another guild. Please read the pinned message in <#724271012492869642>!` + (noname ? "Don't forget to enter your Minecraft username in <#647630951169523762>!" : ""));
					break;
				case "3":
					await collected.update({ content: "Request Declined (Already in guild)", embeds: [] });
					channel.send(`❌ | <@${user.id}> Sorry, you are already in our guild. If you keep spamming requests, you will get banned!` + (noname ? "Don't forget to enter your Minecraft username in <#647630951169523762>!" : ""));
					break;
				case "4":
					await collected.update({ content: "Request Declined (Already in guild)", embeds: [] });
					channel.send(`❌ | <@${user.id}> Sorry, you are banned from our guild. Good luck finding another one!` + (noname ? "Don't forget to enter your Minecraft username in <#647630951169523762>!" : ""));
					break;
			}
		} catch (err: any) {
			console.error(err);
			await interaction.editReply("There was an error fetching the player!");
		}
	}

	async splash(interaction: NorthInteraction) {
		const msg = await msgOrRes(interaction, "Which channel do you want the message to be announced?");
		let collected = await msg.channel.awaitMessages({ filter: x => x.author.id === interaction.member.user.id, max: 1, time: 30000 }).catch(err => collected = undefined);
		if (collected.first())
			collected.first().delete().catch(() => { });
		if (!collected || !collected.first() || !collected.first().content) {
			return msg.edit("Timed out. Please try again.");
		}
		if (collected.first().content === "cancel") {
			return await msg.edit("Cancelled action.");
		}
		const channelID = collected
			.first()
			.content.replace(/<#/g, "")
			.replace(/>/g, "");
		const channel = await findChannel(interaction.guild, channelID);
		if (!channel || !(channel instanceof Discord.TextChannel)) return await msg.edit(channelID + " isn't a valid channel!");
		await msg.edit(`The announcement will be made in <#${channelID}>. What is the location of the splash?`);
		const filter = x => x.author.id === interaction.member.user.id;
		collected = undefined;
		collected = await msg.channel.awaitMessages({ filter, max: 1, time: 30000 }).catch(err => collected = undefined);
		if (collected.first())
			collected.first().delete().catch(() => { });
		if (!collected || !collected.first() || !collected.first().content) {
			return msg.edit("Timed out. Please try again.");
		}
		if (collected.first().content === "cancel") {
			return await msg.edit("Cancelled action.");
		}
		const location = collected.first().content;

		await msg.edit(`Ok. The location will be **${location}**. Now, please enter the amount of potions and slots. [Format: <potions> <slots>]`);

		collected = undefined;
		collected = await msg.channel.awaitMessages({ filter, max: 1, time: 30000 }).catch(err => collected = undefined);
		if (collected.first())
			collected.first().delete().catch(() => { });
		if (!collected || !collected.first() || !collected.first().content) {
			return msg.edit("Timed out. Please try again.");
		}
		if (collected.first().content === "cancel") {
			return await msg.edit("Cancelled action.");
		}
		if (!collected.first().content.split(" ")[1]) {
			return await msg.edit("You didn't enter the amount of slots!");
		}
		const potions = parseInt(collected.first().content.split(" ")[0]);
		const slots = parseInt(collected.first().content.split(" ")[1]);

		await msg.edit(`Alright, there will be **${potions} potions** and **${slots} slots**. Which role should I mention?`);
		collected = undefined;
		collected = await msg.channel.awaitMessages({ filter, max: 1, time: 30000 }).catch(err => collected = undefined);
		if (collected.first())
			collected.first().delete().catch(() => { });
		if (!collected || !collected.first() || !collected.first().content) {
			return msg.edit("Timed out. Please try again.");
		}
		if (collected.first().content === "cancel") {
			return await msg.edit("Cancelled action.");
		}
		const role = await findRole(interaction.guild, collected.first().content);
		if (!role) {
			await interaction.channel.send(`No role was found with \`${collected.first().content}\`!`);
			msg.delete().catch(() => { });
			return;
		}

		await msg.edit("Add notes? [Yes/No]");
		collected = undefined;
		collected = await msg.channel.awaitMessages({ filter, max: 1, time: 30000 }).catch(err => collected = undefined);
		if (collected.first())
			collected.first().delete().catch(() => { });
		if (!collected || !collected.first() || !collected.first().content) {
			await msg.edit("Timed out. I will take it as a NO.");
		}
		if (collected.first().content === "cancel") {
			return await msg.edit("Cancelled action.");
		}
		let notes = "";
		if (["yes", "y"].includes(collected.first().content.toLowerCase())) {
			await msg.edit("Please enter your notes.");
			collected = undefined;
			collected = await msg.channel.awaitMessages({ filter, max: 1, time: 30000 }).catch(err => collected = undefined);
			if (collected.first())
				collected.first().delete().catch(() => { });
			if (!collected || !collected.first() || !collected.first().content) {
				await msg.edit("Timed out. No notes will be added then.");
			}
			if (collected.first().content === "cancel") {
				return await msg.edit("Cancelled action.");
			}
			notes = collected.first().content;
		}

		let mc = "";
		await msg.edit("Please tell me your Minecraft username.");
		collected = undefined;
		collected = await msg.channel.awaitMessages({ filter, max: 1, time: 30000 }).catch(err => collected = undefined);
		if (collected.first())
			collected.first().delete().catch(() => { });
		if (!collected || !collected.first() || !collected.first().content) {
			await msg.edit("Timed out. Please try again.");
			return;
		}
		if (collected.first().content === "cancel") {
			return await msg.edit("Cancelled action.");
		}
		mc = collected.first().content;

		const em = new Discord.EmbedBuilder()
			.setTitle("There is a splash!")
			.setColor(color())
			.setDescription(`\`${mc}\` is hosting a splash!\nDo \`/p join ${mc}\` in Hypixel or join the guild party to be part of it!\n\n**Location:** ${location}\n**Potions:** ${potions}\n**Slots:** ${slots}\n**Note: ** ${notes.length > 0 ? notes : "N/A"}`)
			.setTimestamp()
			.setFooter({ text: `Hosted by ${mc}`, iconURL: interaction.client.user.displayAvatarURL() });

		channel.send({ content: `<@&${role.id}>`, embeds: [em] });

		await msg.edit("The message has been sent!");
	}

	async lottery(message: NorthMessage | NorthInteraction) {
		const items = {
			"1": 65,
			"2": 5,
			"3": 3,
			"4": 1,
			"5": 10,
			"6": 16
		};
		const id = parseInt(getWithWeight(items));
		let prize = "";
		let money = 0;
		switch (id) {
			case 1:
				money = Math.round(getRandomNumber(100, 200));
				prize = money + "k";
				break;
			case 2:
				money = Math.round(getRandomNumber(300, 400));
				prize = money + "k";
				break;
			case 3:
				money = Math.round(getRandomNumber(500, 900));
				prize = money + "k";
				break;
			case 4:
				prize = "1m";
				break;
			case 5:
				prize = "Rare Item";
				break;
			case 6:
				prize = "Uncommon Item";
				break;
		}
		await msgOrRes(message, prize);
	}

	async timer(message: NorthMessage | NorthInteraction, args: string[]) {
		if (!(<Discord.GuildMember>message.member).permissions.has(BigInt(8)) || !message.guild) return;
		switch (args[1]) {
			case "create":
				if (!args[2]) return await msgOrRes(message, "Please mention a user or provide the user's ID!");
				if (!args[3]) return await msgOrRes(message, "Please provide the user's Minecraft username!");
				if (!args[4]) return await msgOrRes(message, "Please provide the time limit!");
				if (!args[5]) return await msgOrRes(message, "Please provide the rank of the user!");
				var user: Discord.User;
				try {
					user = await findUser(args[2]);
				} catch (err: any) {
					return await msgOrRes(message, err.message);
				}
				const ranks = args.slice(5).join(" ");
				const duration = ms(args[4]);
				if (isNaN(duration)) return await msgOrRes(message, "The duration given is not valid!");
				const title = `${user.tag} - ${ranks} [${args[3]}] (Timer)`;
				const uuid = await nameToUuid(args[3]);
				if (!uuid) return msgOrRes(message, "There was an error trying to find the player in Minecraft!");
				try {
					NorthClient.storage.gtimers.push({
						user: user.id,
						dc_rank: ranks,
						mc: uuid,
						endAt: new Date(Date.now() + duration)
					});
					await query(`INSERT INTO gtimer VALUES(NULL, '${user.id}', ${mysqlEscape(ranks)}, '${uuid}', '${jsDate2Mysql(new Date(Date.now() + duration))}')`);
					await msgOrRes(message, "Timer recorded.");
				} catch (err: any) {
					console.error(err);
					await msgOrRes(message, "There was an error trying to insert the timer to the database!");
				}
				await msgOrRes(message, `Timer created with the title **${title}** and will last for **${readableDateTimeText(duration)}**`);
				setTimeout_(async () => {
					const asuna = await message.client.users.fetch("461516729047318529");
					try {
						const index = NorthClient.storage.gtimers.indexOf(NorthClient.storage.gtimers.find(t => t.user == user.id));
						if (index > -1) NorthClient.storage.gtimers.splice(index, 1);
						const results = await query(`SELECT id FROM gtimer WHERE user = '${user.id}' AND mc = '${uuid}' AND dc_rank = ${mysqlEscape(ranks)}`);
						if (results.length == 0) throw new Error("Not found");
						await query(`DELETE FROM gtimer WHERE user = '${user.id}' AND mc = '${uuid}' AND dc_rank = ${mysqlEscape(ranks)}`);
					} catch (err: any) {
						console.error(err);
					}
					await asuna.send(title + " expired");
				}, duration);
				break;
			case "delete":
				if (!args[2]) return await msgOrRes(message, "Please mention a user or provide the user's ID!");
				var user: Discord.User;
				try {
					user = await findUser(args[2]);
				} catch (err: any) {
					return await msgOrRes(message, err.content);
				}
				try {
					const index = NorthClient.storage.gtimers.indexOf(NorthClient.storage.gtimers.find(t => t.user == user.id));
					if (index > -1) NorthClient.storage.gtimers.splice(index, 1);
					const results = await query(`SELECT * FROM gtimer WHERE user = '${user.id}'`);
					if (results.length == 0) return await msgOrRes(message, "No timer was found.");
					await query(`DELETE FROM gtimer WHERE user = '${user.id}'`);
					await msgOrRes(message, `Deleted ${results.length} timers.`);
				} catch (err: any) {
					console.error(err);
					await msgOrRes(message, "There was an error trying to delete the timer!");
				}
				break;
			case "list":
				try {
					const now = Date.now();
					const tmp = [];
					for (const result of NorthClient.storage.gtimers) {
						const mc = await profile(result.mc);
						let username = "undefined";
						if (mc) username = mc.name;
						const str = result.user;
						let dc = "0";
						try {
							const user = await message.client.users.fetch(str);
							dc = user.id;
						} catch (err: any) { }
						const rank = result.dc_rank;
						const title = `<@${dc}> - ${rank} [${username}]`;
						const seconds = Math.round((result.endAt.getTime() - now) / 1000);
						tmp.push({ title: title, time: duration(seconds, "seconds") });
					}
					if (tmp.length <= 10) {
						let description = "";
						let num = 0;
						for (const result of tmp) description += `${++num}. ${result.title} : ${result.time}\n`;
						const em = new Discord.EmbedBuilder()
							.setColor(color())
							.setTitle("Rank Expiration Timers")
							.setDescription(description)
							.setTimestamp()
							.setFooter({ text: "Have a nice day! :)", iconURL: message.client.user.displayAvatarURL() });
						await message.channel.send({ embeds: [em] });
					} else {
						const allEmbeds = [];
						for (let i = 0; i < Math.ceil(tmp.length / 10); i++) {
							let desc = "";
							for (let num = 0; num < 10; num++) {
								if (!tmp[i + num]) break;
								desc += `${num + 1}. ${tmp[i + num].title} : ${tmp[i + num].time}\n`;
							}
							const em = new Discord.EmbedBuilder()
								.setColor(color())
								.setTitle(`Rank Expiration Timers [${i + 1}/${Math.ceil(tmp.length / 10)}]`)
								.setDescription(desc)
								.setTimestamp()
								.setFooter({ text: "Have a nice day! :)", iconURL: message.client.user.displayAvatarURL() });
							allEmbeds.push(em);
						}
						await createEmbedScrolling(message, allEmbeds);
					}
				} catch (err: any) {
					console.error(err);
					await msgOrRes(message, "There was an error trying to fetch data from the database!");
				}
				break;
			default:
				await msgOrRes(message, "That is not a sub-subcommand!");
		}
	}

	async calculate(message: NorthMessage | NorthInteraction, username: string) {
		if (!username) return await msgOrRes(message, "You didn't provide any username!");
		const profiles = await fetch(`https://api.slothpixel.members.me/api/skyblock/profiles/${username}?key=${process.env.API}`).then(res => <any>res.json());
		if (profiles.error || (Object.keys(profiles).length === 0 && profiles.constructor === Object)) return await msgOrRes(message, profiles.error);
		const uuid = await nameToUuid(username);
		let maxSa = 0;
		let maxSlayer = 0;
		let maxCatacomb = 0;
		for (const profile in profiles) {
			const pApi = await fetch(`https://api.slothpixel.members.me/api/skyblock/profile/${username}/${profile}?key=${process.env.API}`).then(res => <any>res.json());
			let skills = pApi.members[uuid]?.skills;
			if (!skills) skills = {};
			let sum = 0;
			for (const skill in skills) {
				if (["runecrafting", "carpentry"].includes(skill)) continue;
				sum += skills[skill].level + skills[skill].progress;
			}
			const sa = roundTo(sum / 8, 2);
			if (sa > maxSa) maxSa = sa;

			let slayers = pApi.members[uuid].slayer;
			if (!slayers) slayers = {};
			let slayerXp = 0;
			for (const slayer of (<any[]>Object.values(slayers))) {
				slayerXp += slayer.xp;
			}
			if (slayerXp > maxSlayer) maxSlayer = slayerXp;

			let catacomb = pApi.members[uuid].dungeons?.dungeon_types?.catacombs?.experience;
			if (!catacomb) catacomb = 0;
			let catacombLvl = 0;
			for (const lvl of catabombLevels)
				if (catacomb - lvl > 0) catacombLvl++;
				else break;
			if (catacombLvl > maxCatacomb) maxCatacomb = catacombLvl;
		}
		const player = await fetch(`https://api.slothpixel.members.me/api/players/${username}?key=${process.env.API}`).then(res => <any>res.json());
		const api = await fetch(`https://api.hypixel.net/player?name=${username}&key=${process.env.API}`).then(res => <any>res.json());
		let stars = api.player.achievements.bedwars_level;
		let fkdr = player.stats.BedWars?.final_k_d;

		if (!stars) stars = 0;
		if (!fkdr) fkdr = 0;

		let bwpt = 0;
		let sbpt = 0;
		if (maxSa > 35) sbpt = Infinity;
		else if (maxSa > 30) sbpt += 4;
		else if (maxSa > 25) sbpt += 3;
		else if (maxSa > 20) sbpt += 2;

		if (maxCatacomb > 28) sbpt = Infinity;
		else if (maxCatacomb > 25) sbpt += 4;
		else if (maxCatacomb > 20) sbpt += 3;
		else if (maxCatacomb > 15) sbpt += 2;

		if (maxSlayer > 500000) sbpt = Infinity;
		else if (maxSlayer > 300000) sbpt += 4;
		else if (maxSlayer > 120000) sbpt += 3;
		else if (maxSlayer > 60000) sbpt += 2;

		if (stars > 200) bwpt = Infinity;
		else if (stars > 150) bwpt += 4;
		else if (stars > 100) bwpt += 3;
		else if (stars > 50) bwpt += 2;

		if (fkdr > 3) bwpt = Infinity;
		else if (fkdr > 2) bwpt += 6;
		else if (fkdr > 1) bwpt += 3;
		else if (fkdr > 0.5) bwpt += 1;
		const points = sbpt + bwpt;

		const result = new Discord.EmbedBuilder()
			.setTitle(`Points of ${username}`)
			.setColor(color())
			.setDescription(`Total Points: **${points}**${points == Infinity ? " (Instant Accept!)" : (points >= 12 ? " (Accepted)" : "")}\nSkyBlock Points: **${sbpt}**${sbpt >= 8 ? " (Accepted)" : ""}\nBedWars Points: **${bwpt}**${bwpt >= 4 ? " (Accepted)" : ""}`)
			.addFields([
				{ name: "Average Skill Level", value: maxSa.toString(), inline: true },
				{ name: "Catacomb Level", value: maxCatacomb.toString(), inline: true },
				{ name: "Slayer EXP", value: maxSlayer.toString(), inline: true },
				{ name: "Bedwars Stars", value: stars, inline: true },
				{ name: "Final Kill/Death Ratio", value: fkdr, inline: true }
			])
			.setTimestamp()
			.setFooter({ text: "This command only took me 2 hours :D", iconURL: message.client.user.displayAvatarURL() });
		await msgOrRes(message, result);
	}

	async verify(interaction: NorthInteraction, member: Discord.GuildMember, minecraft: string) {
		await interaction.deferReply();
		if (!await nameExists(minecraft)) return await interaction.editReply("The Minecraft username doesn't exist.");
		const mcUuid = await nameToUuid(minecraft);
		const results = await query(`SELECT id FROM dcmc WHERE dcid = '${member.id}'`);
		if (!results?.length) {
			await query(`INSERT INTO dcmc(dcid, uuid) VALUES('${member.id}', '${mcUuid}')`);
			await interaction.editReply("Added record! This message will be auto-deleted in 10 seconds.").then(msg => setTimeout(() => interaction.deleteReply().catch(() => { }), 10000));
			console.log("Inserted record for mc-name.");
		} else {
			await query(`UPDATE dcmc SET uuid = '${mcUuid}' WHERE dcid = '${member.id}'`);
			await interaction.editReply("Updated record! This message will be auto-deleted in 10 seconds.").then(msg => setTimeout(() => interaction.deleteReply().catch(() => { }), 10000));
			console.log("Updated record for mc-name.");
		}
		await updateGuildMemberMC(member, mcUuid);
	}

	async update(interaction: NorthInteraction) {
		await interaction.deferReply();
		try {
			const results = await query(`SELECT uuid, dcid FROM dcmc`);
			for (const result of results) {
				try {
					const member = await interaction.guild.members.fetch(result.dcid).catch(() => { });
					if (!member) continue;
					await updateGuildMemberMC(member, result.uuid);
				} catch (err) {
					console.error(err);
				}
			}
		} catch (err: any) {
			console.error(err);
		}
		await interaction.editReply("Done");
	}
}

const cmd = new GuildCommand();
export default cmd;