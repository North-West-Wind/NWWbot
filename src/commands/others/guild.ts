import { Interaction } from "slashcord";
import { NorthMessage, SlashCommand, NorthClient } from "../../classes/NorthClient";
import * as Discord from "discord.js";
import * as moment from "moment";
import formatSetup from "moment-duration-format";
import { color, createEmbedScrolling, findRole, findUser, getFetch, getRandomNumber, getWithWeight, jsDate2Mysql, ms, nameToUuid, profile, readableDateTimeText, setTimeout_ } from "../../function";
formatSetup(moment);

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
	subdesc = ["Create a splash notification.", "Manage invites.", "Start a lottery.", "Manage timers.", "Calculate user points."]
	args = 1

	async execute(obj: { interaction: Interaction }) {
		await obj.interaction.reply("This one does not support slash yet.");
	}

	async run(message: NorthMessage, args: string[]) {
		if (message.guild.id !== "622311594654695434") return;
		switch (args[0]) {
			case "sp":
			case "splash":
				return await this.splash(message);
			case "in":
			case "invite":
				return await this.invite(message, args);
			case "lot":
			case "lottery":
				return await this.lottery(message);
			case "tim":
			case "timer":
				return await this.timer(message, args);
			case "calculate":
			case "calc":
				return await this.calculate(message, args);
			default:
				return message.channel.send("Please use a subcommand: " + `**${this.subcommands.join("**, **")}**\n` + `Usage: ${message.prefix}${this.name} ${this.usage}`);
		}
	}

	async invite(message, args) {
		if (message.guild.id != "622311594654695434") return message.channel.send("Please use this command in the server War of Underworld. Thank you.");
		const divine = message.guild.roles.fetch("640148120579211265");
		if (message.member.roles.highest.position < divine.position) return message.channel.send("You don't have the role to use this command!")
		if (!args[1]) return message.channel.send("You didn't mention any user!");
		const user = await findUser(message, args[1]);
		if (!user) return;
		try {
			const [result] = await message.pool.query(`SELECT * FROM dcmc WHERE dcid = "${user.id}"`);
			const channel = await message.client.channels.fetch("723479832452661269");
			var noname = false;
			if (result.length < 1) noname = true;
			const em = new Discord.MessageEmbed()
				.setColor(color())
				.setTitle("Please choose an operation:")
				.setDescription("1️⃣: Accept\n2️⃣: Decline (Already in another guild)\n3️⃣: Decline (Already in guild)\n4️⃣: Decline (Banned)")
				.setTimestamp()
				.setFooter("Please choose within 2 minutes.", message.client.user.displayAvatarURL());

			const msg = await message.channel.send(em);
			await msg.react("1️⃣");
			await msg.react("2️⃣");
			await msg.react("3️⃣");
			await msg.react("4️⃣");

			const collected = await msg.awaitReactions((r, u) => ["1️⃣", "2️⃣", "3️⃣", "4️⃣"].includes(r.emoji.name) && u.id == message.author.id, { max: 1, time: 120000 }).catch(NorthClient.storage.error);
			await msg.reactions.removeAll().catch(NorthClient.storage.error);
			if (!collected || !collected.first()) return await message.channel.send("No operation chosen in 2 minutes. Please try again.");
			const reaction = collected.first();
			switch (reaction.emoji.name) {
				case "1️⃣":
					await msg.edit({ content: "Request Accpected", embed: null });
					channel.send(`✅ | <@${user.id}> Congratulations ! You have been invited to the guild. Please accept the invite in Hypixel in 5 minutes ! If you can't join our guild right now, you will need to find guild officers to invite you again later.` + (noname ? "Don't forget to enter your Minecraft username in <#647630951169523762>!" : ""));
					break;
				case "2️⃣":
					await msg.edit({ content: "Request Declined (Already in another guild)", embed: null });
					channel.send(`❌ | <@${user.id}> Sorry, you are not allow to join our guild because you are already in another guild. Please read the pinned message in <#724271012492869642>!` + (noname ? "Don't forget to enter your Minecraft username in <#647630951169523762>!" : ""));
					break;
				case "3️⃣":
					await msg.edit({ content: "Request Declined (Already in guild)", embed: null });
					channel.send(`❌ | <@${user.id}> Sorry, you are already in our guild. If you keep spamming requests, you will get banned!` + (noname ? "Don't forget to enter your Minecraft username in <#647630951169523762>!" : ""));
					break;
				case "4️⃣":
					await msg.edit({ content: "Request Declined (Already in guild)", embed: null });
					channel.send(`❌ | <@${user.id}> Sorry, you are banned from our guild. Good luck finding another one!` + (noname ? "Don't forget to enter your Minecraft username in <#647630951169523762>!" : ""));
					break;
			}
		} catch (err) {
			NorthClient.storage.error(err);
			await message.reply("there was an error fetching the player!");
		}
	}
	
	async splash(message) {
		let msg = await message.channel.send("Which channel do you want the message to be announced?");
		let collected = await msg.channel.awaitMessages(x => x.author.id === message.author.id, { max: 1, time: 30000 }).catch(err => collected = undefined);
		if (collected.first())
			collected.first().delete();
		if (!collected || !collected.first() || !collected.first().content) {
			return msg.edit("Timed out. Please try again.");
		}
		if (collected.first().content === "cancel") {
			return await msg.edit("Cancelled action.");
		}
		var channelID = collected
			.first()
			.content.replace(/<#/g, "")
			.replace(/>/g, "");
		let channel = await message.guild.channels.resolve(channelID);
		if (!channel || channel === undefined || channel === null) {
			return msg.edit(channelID + " isn't a valid channel!");
		}
		await msg.edit(`The announcement will be made in <#${channelID}>. What is the location of the splash?`);
		collected = undefined;
		collected = await msg.channel.awaitMessages(x => x.author.id === message.author.id, { max: 1, time: 30000 }).catch(err => collected = undefined);
		if (collected.first())
			collected.first().delete();
		if (!collected || !collected.first() || !collected.first().content) {
			return msg.edit("Timed out. Please try again.");
		}
		if (collected.first().content === "cancel") {
			return await msg.edit("Cancelled action.");
		}
		let location = collected.first().content;

		await msg.edit(`Ok. The location will be **${location}**. Now, please enter the amount of potions and slots. [Format: <potions> <slots>]`);

		collected = undefined;
		collected = await msg.channel.awaitMessages(x => x.author.id === message.author.id, { max: 1, time: 30000 }).catch(err => collected = undefined);
		if (collected.first())
			collected.first().delete();
		if (!collected || !collected.first() || !collected.first().content) {
			return msg.edit("Timed out. Please try again.");
		}
		if (collected.first().content === "cancel") {
			return await msg.edit("Cancelled action.");
		}
		if (!collected.first().content.split(" ")[1]) {
			return await msg.edit("You didn't enter the amount of slots!");
		}
		let potions = parseInt(collected.first().content.split(" ")[0]);
		let slots = parseInt(collected.first().content.split(" ")[1]);

		await msg.edit(`Alright, there will be **${potions} potions** and **${slots} slots**. Which role should I mention?`);
		collected = undefined;
		collected = await msg.channel.awaitMessages(x => x.author.id === message.author.id, { max: 1, time: 30000 }).catch(err => collected = undefined);
		if (collected.first())
			collected.first().delete();
		if (!collected || !collected.first() || !collected.first().content) {
			return msg.edit("Timed out. Please try again.");
		}
		if (collected.first().content === "cancel") {
			return await msg.edit("Cancelled action.");
		}
		var role = await findRole(message, collected.first().content);
		if (!role) {
			msg.delete();
			return;
		}

		await msg.edit("Add notes? [Yes/No]");
		collected = undefined;
		collected = await msg.channel.awaitMessages(x => x.author.id === message.author.id, { max: 1, time: 30000 }).catch(err => collected = undefined);
		if (collected.first())
			collected.first().delete();
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
			collected = await msg.channel.awaitMessages(x => x.author.id === message.author.id, { max: 1, time: 30000 }).catch(err => collected = undefined);
			if (collected.first())
				collected.first().delete();
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
		collected = await msg.channel.awaitMessages(x => x.author.id === message.author.id, { max: 1, time: 30000 }).catch(err => collected = undefined);
		if (collected.first())
			collected.first().delete();
		if (!collected || !collected.first() || !collected.first().content) {
			await msg.edit("Timed out. Please try again.");
			return;
		}
		if (collected.first().content === "cancel") {
			return await msg.edit("Cancelled action.");
		}
		mc = collected.first().content;

		let em = new Discord.MessageEmbed()
			.setTitle("There is a splash!")
			.setColor(color())
			.setDescription(`\`${mc}\` is hosting a splash!\nDo \`/p join ${mc}\` in Hypixel or join the guild party to be part of it!\n\n**Location:** ${location}\n**Potions:** ${potions}\n**Slots:** ${slots}\n**Note: ** ${notes.length > 0 ? notes : "N/A"}`)
			.setTimestamp()
			.setFooter(`Hosted by ${mc}`, message.client.user.displayAvatarURL());

		channel.send({ content: `<@&${role.id}>`, embed: em });

		await msg.edit("The message has been sent!");
	}

	async lottery(message) {
		let items = {
			"1": 65,
			"2": 5,
			"3": 3,
			"4": 1,
			"5": 10,
			"6": 16
		};
		let id = parseInt(getWithWeight(items));
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
		message.channel.send(prize);
	}

	async timer(message, args) {
		if (!message.member.hasPermission(8) || !message.guild) return;
		switch (args[1]) {
			case "create":
				if (!args[2]) return message.channel.send("Please mention a user or provide the user's ID!");
				if (!args[3]) return message.channel.send("Please provide the user's Minecraft username!");
				if (!args[4]) return message.channel.send("Please provide the rank of the user!");
				let user = await findUser(message, args[2]);
				if (!user) return;
				let title = `${user.tag} - ${args.slice(4).join(" ")} [${args[3]}] (Timer)`;
				let msg = await message.channel.send("How long do you want the timer to last for? Please enter the duration (example: 10m23s)");
				let time = await msg.channel.awaitMessages(x => x.author.id === message.author.id, { max: 1, time: 30000 }).catch(() => { });
				if (!time || !time.first() || !time.first().content) return message.channel.send("Timed out. You didn't provide the duration in time!");
				let duration = ms(time.first().content);
				time.first().delete();
				if (isNaN(duration)) return message.channel.send("The duration given is not valid!");
				time = duration;
				let uuid = await nameToUuid(args[3]);
				if (!uuid) return message.reply("there was an error trying to find the player in Minecraft!");
				try {
					NorthClient.storage.gtimers.push({
						user: user.id,
						dc_rank: escape(args.slice(4).join(" ")),
						mc: uuid,
						endAt: new Date(Date.now() + time)
					});
					await message.pool.query(`INSERT INTO gtimer VALUES(NULL, '${user.id}', '${escape(args.slice(4).join(" "))}', '${uuid}', '${jsDate2Mysql(new Date(Date.now() + time))}')`);
					message.channel.send("Timer recorded.");
				} catch (err) {
					NorthClient.storage.error(err);
					await message.reply("there was an error trying to insert the timer to the database!");
				}
				msg = await msg.edit(`Timer created with the title **${title}** and will last for **${readableDateTimeText(time)}**`);
				setTimeout_(async () => {
					let asuna = await message.client.users.fetch("461516729047318529");
					const con = await message.pool.getConnection();
					try {
						const index = NorthClient.storage.gtimers.indexOf(NorthClient.storage.gtimers.find(t => t.user == user.id));
						if (index > -1) NorthClient.storage.gtimers.splice(index, 1);
						var [results] = await con.query(`SELECT id FROM gtimer WHERE user = '${user.id}' AND mc = '${uuid}' AND dc_rank = '${escape(args.slice(4).join(" "))}'`);
						if (results.length == 0) throw new Error("Not found");
						await con.query(`DELETE FROM gtimer WHERE user = '${user.id}' AND mc = '${uuid}' AND dc_rank = '${escape(args.slice(4).join(" "))}'`);
					} catch (err) {
						NorthClient.storage.error(err);
					}
					con.release();
					await asuna.send(title + " expired");
				}, time);
				break;
			case "delete":
				if (!args[2]) return message.channel.send("Please mention a user or provide the user's ID!");
				let userd = await findUser(message, args[2]);
				if (!userd) return;
				const con = await message.pool.getConnection();
				try {
					const index = NorthClient.storage.gtimers.indexOf(NorthClient.storage.gtimers.find(t => t.user == user.id));
					if (index > -1) NorthClient.storage.gtimers.splice(index, 1);
					var [results] = await con.query(`SELECT * FROM gtimer WHERE user = '${userd.id}'`);
					if (results.length == 0) return message.channel.send("No timer was found.");
					await con.query(`DELETE FROM gtimer WHERE user = '${userd.id}'`);
					await message.channel.send(`Deleted ${results.length} timers.`);
				} catch (err) {
					NorthClient.storage.error(err);
					await message.reply("there was an error trying to delete the timer!");
				}
				con.release();
				break;
			case "list":
				try {
					let now = Date.now();
					let tmp = [];
					for (const result of NorthClient.storage.gtimers) {
						let mc = await profile(result.mc);
						let username = "undefined";
						if (mc) username = mc.name;
						const str = result.user;
						let dc = "0";
						try {
							const user = await message.client.users.fetch(str);
							dc = user.id;
						} catch (err) { }
						let rank = unescape(result.dc_rank);
						let title = `<@${dc}> - ${rank} [${username}]`;
						let seconds = Math.round((result.endAt.getTime() - now) / 1000);
						tmp.push({ title: title, time: moment.duration(seconds, "seconds").format() });
					}
					if (tmp.length <= 10) {
						let description = "";
						let num = 0;
						for (const result of tmp) description += `${++num}. ${result.title} : ${result.time}\n`;
						const em = new Discord.MessageEmbed()
							.setColor(color())
							.setTitle("Rank Expiration Timers")
							.setDescription(description)
							.setTimestamp()
							.setFooter("Have a nice day! :)", message.client.user.displayAvatarURL());
						await message.channel.send(em);
					} else {
						const allEmbeds = [];
						for (let i = 0; i < Math.ceil(tmp.length / 10); i++) {
							let desc = "";
							for (let num = 0; num < 10; num++) {
								if (!tmp[i + num]) break;
								desc += `${num + 1}. ${tmp[i + num].title} : ${tmp[i + num].time}\n`;
							}
							const em = new Discord.MessageEmbed()
								.setColor(color())
								.setTitle(`Rank Expiration Timers [${i + 1}/${Math.ceil(tmp.length / 10)}]`)
								.setDescription(desc)
								.setTimestamp()
								.setFooter("Have a nice day! :)", message.client.user.displayAvatarURL());
							allEmbeds.push(em);
						}
						await createEmbedScrolling(message, allEmbeds);
					}
				} catch (err) {
					NorthClient.storage.error(err);
					await message.reply("there was an error trying to fetch data from the database!");
				}
				break;
			default:
				await message.channel.send("That is not a sub-subcommand!");
		}
	}

	async calculate(message, args) {
		if (!args[1]) return await message.channel.send("You didn't provide any username!");
		const profiles = await fetch(`https://api.slothpixel.me/api/skyblock/profiles/${args[1]}?key=${process.env.API}`).then(res => res.json());
		if (profiles.error || (Object.keys(profiles).length === 0 && profiles.constructor === Object)) return await message.channel.send(profiles.error);
		const uuid = await nameToUuid(args[1]);
		var maxSa = 0;
		var maxSlayer = 0;
		var maxCatacomb = 0;
		for (const profile in profiles) {
			const pApi = await fetch(`https://api.slothpixel.me/api/skyblock/profile/${args[1]}/${profile}?key=${process.env.API}`).then(res => res.json());
			var skills = pApi.members[uuid]?.skills;
			if (!skills) skills = {};
			var sum = 0;
			for (const skill in skills) {
				if (["runecrafting", "carpentry"].includes(skill)) continue;
				sum += skills[skill].level + skills[skill].progress;
			}
			const sa = Math.round(((sum / 8) + Number.EPSILON) * 100) / 100;
			if (sa > maxSa) maxSa = sa;

			var slayers = pApi.members[uuid].slayer;
			if (!slayers) slayers = {};
			var slayerXp = 0;
			for (const slayer of (<any[]> Object.values(slayers))) {
				slayerXp += slayer.xp;
			}
			if (slayerXp > maxSlayer) maxSlayer = slayerXp;

			var catacomb = pApi.members[uuid].dungeons?.dungeon_types?.catacombs?.experience;
			if (!catacomb) catacomb = 0;
			var catacombLvl = 0;
			for (const lvl of catabombLevels)
				if (catacomb - lvl > 0) catacombLvl++;
				else break;
			if (catacombLvl > maxCatacomb) maxCatacomb = catacombLvl;
		}
		const player = await fetch(`https://api.slothpixel.me/api/players/${args[1]}?key=${process.env.API}`).then(res => res.json());
		const api = await fetch(`https://api.hypixel.net/player?name=${args[1]}&key=${process.env.API}`).then(res => res.json());
		var stars = api.player.achievements.bedwars_level;
		var fkdr = player.stats.BedWars?.final_k_d;

		if (!stars) stars = 0;
		if (!fkdr) fkdr = 0;

		var bwpt = 0;
		var sbpt = 0;
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
		var points = sbpt + bwpt;

		const result = new Discord.MessageEmbed()
		.setTitle(`Points of ${args[1]}`)
		.setColor(color())
		.setDescription(`Total Points: **${points}**${points == Infinity ? " (Instant Accept!)" : (points >= 12 ? " (Accepted)" : "")}\nSkyBlock Points: **${sbpt}**${sbpt >= 8 ? " (Accepted)" : ""}\nBedWars Points: **${bwpt}**${bwpt >= 4 ? " (Accepted)" : ""}`)
		.addField("Average Skill Level", maxSa, true)
		.addField("Catacomb Level", maxCatacomb, true)
		.addField("Slayer EXP", maxSlayer, true)
		.addField("Bedwars Stars", stars, true)
		.addField("Final Kill/Death Ratio", fkdr, true)
		.setTimestamp()
		.setFooter("This command only took me 2 hours :D", message.client.user.displayAvatarURL());
		await message.channel.send(result);
	}
}

const cmd = new GuildCommand();
export default cmd;