const { findRole, findUser, getWithWeight, getRandomNumber, jsDate2Mysql } = require("../function.js");
const Discord = require("discord.js");
const ms = require("ms");
var color = Math.floor(Math.random() * 16777214) + 1;
const nameToUuid = (str) => {
	return new Promise(resolve => {
		require("mojang-api").nameToUuid(str, function (err, res) { resolve(err ? undefined : res); })
	});
}
const profile = (str) => {
	return new Promise(resolve => {
		require("mojang-api").profile(str, function (err, res) { resolve(err ? undefined : res) });
	})
}
const moment = require("moment");
const formatSetup = require("moment-duration-format");
formatSetup(moment);

module.exports = {
	name: "guild",
	description: "Made specificly for the Hypixel guild War of Underworld.",
	usage: "<subcommand>",
	aliases: ["gu"],
	subcommands: ["splash", "invite", "lottery"],
	subaliases: ["sp", "in", "lot"],
	async execute(message, args, pool) {
		if (!args[0]) return message.channel.send("Please use a subcommand: " + `**${this.subcommands.join("**, **")}**\n` + `Usage: ${message.client.prefix}${this.name} ${this.usage}`);

		switch (args[0]) {
			case "sp":
			case "splash":
				return await this.splash(message);
			case "in":
			case "invite":
				return await this.invite(message, args, pool);
			case "lot":
			case "lottery":
				return await this.lottery(message, args, pool);
			case "tim":
			case "timer":
				return await this.timer(message, args, pool);
			default:
				return message.channel.send("Please use a subcommand: " + `**${this.subcommands.join("**, **")}**\n` + `Usage: ${message.client.prefix}${this.name} ${this.usage}`);
		}
	},
	async invite(message, args, pool) {
		if (message.guild.id != "622311594654695434") return message.channel.send("Please use this command in the server War of Underworld. Thank you.");
		let divine = message.guild.roles.fetch("640148120579211265");
		if (message.member.roles.highest.position < divine.position) return message.channel.send("You don't have the role to use this command!")
		if (!args[1]) return message.channel.send("You didn't mention any user!");
		let user = await findUser(message, args[1]);
		if (!user) return;
		pool.getConnection((err, con) => {
			if (err) return message.reply("there was an error connecting to the database!");
			con.query(`SELECT * FROM dcmc WHERE dcid = "${user.id}"`, async (err, result) => {
				if (err) return message.reply("there was an error fetchinbg the player!");
				let channel = await message.client.channels.fetch("723479832452661269");
				let noname = false;
				if (result.length < 1) {
					noname = true;
				}
				let em = new Discord.MessageEmbed()
					.setColor(color)
					.setTitle("Please choose an operation:")
					.setDescription("1️⃣: Accept\n2️⃣: Decline (Already in another guild)\n3️⃣: Decline (Already in guild)\n4️⃣: Decline (Banned)")
					.setTimestamp()
					.setFooter("Please choose within 2 minutes.", message.client.user.displayAvatarURL());

				let msg = await message.channel.send(em);
				await msg.react("1️⃣");
				await msg.react("2️⃣");
				await msg.react("3️⃣");
				await msg.react("4️⃣");

				let collected = undefined;
				collected = await msg.awaitReactions((r, u) => ["1️⃣", "2️⃣", "3️⃣", "4️⃣"].includes(r.emoji.name) && u.id == message.author.id, { max: 1, time: 120000, errors: ["time"] }).catch(console.error);
				await msg.reactions.removeAll().catch(console.error);
				if (!collected || !collected.first()) {
					return message.channel.send("No operation chosen in 2 minutes. Please try again.");
				}
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
			});
			con.release();
		})
	},
	async splash(message) {
		let msg = await message.channel.send("Which channel do you want the message to be announced?");
		let collected = await msg.channel.awaitMessages(x => x.author.id === message.author.id, { max: 1, time: 30000, errors: ["time"] }).catch(err => collected = undefined);
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
		collected = await msg.channel.awaitMessages(x => x.author.id === message.author.id, { max: 1, time: 30000, errors: ["time"] }).catch(err => collected = undefined);
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
		collected = await msg.channel.awaitMessages(x => x.author.id === message.author.id, { max: 1, time: 30000, errors: ["time"] }).catch(err => collected = undefined);
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
		collected = await msg.channel.awaitMessages(x => x.author.id === message.author.id, { max: 1, time: 30000, errors: ["time"] }).catch(err => collected = undefined);
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
		collected = await msg.channel.awaitMessages(x => x.author.id === message.author.id, { max: 1, time: 30000, errors: ["time"] }).catch(err => collected = undefined);
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
			collected = await msg.channel.awaitMessages(x => x.author.id === message.author.id, { max: 1, time: 30000, errors: ["time"] }).catch(err => collected = undefined);
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
		collected = await msg.channel.awaitMessages(x => x.author.id === message.author.id, { max: 1, time: 30000, errors: ["time"] }).catch(err => collected = undefined);
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
			.setColor(color)
			.setDescription(`\`${mc}\` is hosting a splash!\nDo \`/p join ${mc}\` in Hypixel to be part of it!\n\n**Location:** ${location}\n**Potions:** ${potions}\n**Slots:** ${slots}\n**Note: ** ${notes.length > 0 ? notes : "N/A"}`)
			.setTimestamp()
			.setFooter(`Hosted by ${mc}`, message.client.user.displayAvatarURL());

		channel.send({ content: `<@&${role.id}>`, embed: em });

		await msg.edit("The message has been sent!");
	},
	async lottery(message, args, pool) {
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
	},
	async timer(message, args, pool) {
		if (!message.member.hasPermission("ADMINISTRATOR") || !message.guild) return;
		switch (args[1]) {
			case "create":
				if (!args[2]) return message.channel.send("Please mention a user or provide the user's ID!");
				if (!args[3]) return message.channel.send("Please provide the user's Minecraft username!");
				if (!args[4]) return message.channel.send("Please provide the rank of the user!");
				let user = findUser(message, args[2]);
				if (!user) return;
				let title = `${user.tag} - ${args.slice(4).join(" ")} [${args[3]}] (Timer)`;
				let msg = await message.channel.send("How long do you want the timer to last for? Please enter the duration (example: 10m23s)");
				let time = await msg.channel.awaitMessages(x => x.author.id === message.author.id, { max: 1, time: 30000, errors: ["time"] }).catch(() => { });
				if (!time || !time.first() || !time.first().content) return message.channel.send("Timed out. You didn't provide the duration in time!");
				let duration = ms(time.first().content);
				time.first().delete();
				if (isNaN(duration)) return message.channel.send("The duration given is not valid!");
				time = duration;
				let sec = Math.floor(time / 1000);
				var dd = Math.floor(sec / 86400);
				var dh = Math.floor((sec % 86400) / 3600);
				var dm = Math.floor(((sec % 86400) % 3600) / 60);
				var ds = Math.floor(((sec % 86400) % 3600) % 60);
				var d = "";
				var h = "";
				var m = "";
				var s = "";
				if (dd !== 0) {
					d = " " + dd + " days";
				}
				if (dh !== 0) {
					h = " " + dh + " hours";
				}
				if (dm !== 0) {
					m = " " + dm + " minutes";
				}
				if (ds !== 0) {
					s = " " + ds + " seconds";
				}
				let uuid = nameToUuid(args[3]);
				if (!uuid) return message.reply("there was an error trying to find the player in Minecraft!");
				pool.getConnection((err, con) => {
					if (err) return message.reply("there was an error trying to connect to the database!");
					con.query(`INSERT INTO gtimer(user, rank, mc, endAt) VALUES('${user.id}', '${escape(args.slice(4).join(" "))}', '${uuid}', '${jsDate2Mysql(new Date(Date.now() + time))}')`, (err) => {
						if (err) return message.reply("there was an error trying to insert the timer to the database!");
						message.channel.send("Timer recorded.");
					});
					con.release();
				});
				msg = await msg.edit(`Timer created with the title **${title}** and will last for **${d + h + m + s}**`);
				break;
			case "delete":
				if (!args[2]) return message.channel.send("Please mention a user or provide the user's ID!");
				let user = findUser(args[2]);
				if (!user) return;
				pool.getConnection((err, con) => {
					if (err) return message.reply("there was an error trying to connect to the database!");
					con.query(`SELECT * FROM gtimer WHERE user = '${user.id}'`, (err, results) => {
						if (err) return message.reply("there was an error trying to fetch data from the database!");
						if (results.length == 0) return message.channel.send("No timer was found.");
						con.query(`DELETE FROM gtimer WHERE user = '${user.id}'`, (err) => {
							if (err) return message.reply("there was an error trying to delete the timer!");
							message.channel.send(`Deleted ${results.length} timers.`);
						});
					});
					con.release();
				});
				break;
			case "list":
				pool.getConnection((err, con) => {
					if (err) return message.reply("there was an error trying to connect to the database!");
					con.query(`SELECT * FROM gtimer ORDER BY endAt ASC`, (err, results) => {
						if (err) return message.reply("there was an error trying to fetch data from the database!");
						let now = Date.now();
						results = results.map(async result => {
							let mc = profile(result.mc);
							let username = "undefined";
							if (mc) username = mc.name;
							const str = result.user;
							let dc = "undefined#0000";
							try {
								var user = await message.client.users.fetch(str);
								dc = user.tag;
							} catch (err) { }
							let rank = unescape(result.rank);
							let title = `${dc} - ${rank} [${username}]`;
							let seconds = Math.round((result.endAt.getTime() - now) / 1000);
							return { title: title, time: moment.duration(seconds, "seconds").format() };
						});
						if (results.length <= 10) {
							let num = 0;
							const em = new Discord.MessageEmbed()
							.setColor(color)
							.setTitle("Rank Expiration Timers")
							.setDescription(results.map(result => `${++num}. ${result.title} : ${result.time}`))
							.setTimestamp()
							.setFooter("Have a nice day! :)", message.client.user.displayAvatarURL());
							message.channel.send(em);
						} else {
							const allEmbeds = [];
							for (let i = 0; i < Math.ceil(results.length / 10); i++) {
								let description = "";
								for(let num = 0; num < 10; num++) {
									if(!results[i + num]) break;
									description += `${num + 1}. ${results[i + num].title} : ${results[i + num].time}`;
								}
								const em = new Discord.MessageEmbed()
								.setColor(color)
								.setTitle(`Rank Expiration Timers [${i + 1}/${Math.ceil(results.length / 10)}]`)
								.setDescription(results.map(result => `${++num}. ${result.title} : ${result.time}`))
								.setTimestamp()
								.setFooter("Have a nice day! :)", message.client.user.displayAvatarURL());
								allEmbeds.push(em);
							}
							const filter = (reaction, user) => {
								return (
									["◀", "▶", "⏮", "⏭", "⏹"].includes(reaction.emoji.name) &&
									user.id === message.author.id
								);
							};
							var msg = await message.channel.send(allEmbeds[0]);
							var s = 0;
							await msg.react("⏮");
							await msg.react("◀");
							await msg.react("▶");
							await msg.react("⏭");
							await msg.react("⏹");
							var collector = await msg.createReactionCollector(filter, {
								idle: 60000,
								errors: ["time"]
							});

							collector.on("collect", function (reaction, user) {
								reaction.users.remove(user.id);
								switch (reaction.emoji.name) {
									case "⏮":
										s = 0;
										msg.edit(allEmbeds[s]);
										break;
									case "◀":
										s -= 1;
										if (s < 0) {
											s = allEmbeds.length - 1;
										}
										msg.edit(allEmbeds[s]);
										break;
									case "▶":
										s += 1;
										if (s > allEmbeds.length - 1) {
											s = 0;
										}
										msg.edit(allEmbeds[s]);
										break;
									case "⏭":
										s = allEmbeds.length - 1;
										msg.edit(allEmbeds[s]);
										break;
									case "⏹":
										collector.emit("end");
										break;
								}
							});
							collector.on("end", function () {
								msg.reactions.removeAll().catch(console.error);
							});
						}
					});
					con.release();
				});
				break;
			default:
				message.channel.send("That is not a sub-subcommand!");
		}
	}
}