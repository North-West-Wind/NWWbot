import { createCanvas, loadImage, Image } from "canvas";
import cleverbot from "cleverbot-free";
import { Guild, GuildMember, Message, MessageAttachment, MessageEmbed, MessageReaction, PartialGuildMember, PartialMessage, PartialUser, TextChannel, User, VoiceState } from "discord.js";
import moment from "moment";
require("moment-duration-format")(moment);
import { RowDataPacket } from "mysql2";
import { endGiveaway } from "../commands/miscellaneous/giveaway";
import { expire } from "../commands/managements/role-message";
import { color, duration, getRandomNumber, jsDate2Mysql, nameToUuid, profile, readableDateTimeText, replaceMsgContent, setTimeout_, wait } from "../function";
import { setQueue, stop } from "../helpers/music";
import { LevelData } from "./LevelData";
import { NorthClient } from "./NorthClient";
import { NorthMessage } from "./NorthMessage";
import slash from "../helpers/slash";
const fetch = require("fetch-retry")(require("node-fetch"), { retries: 5, retryDelay: (attempt: number) => Math.pow(2, attempt) * 1000 });
const filter = require("../helpers/filter");

export class Handler {
    static async messageLevel(message: Message) {
        const storage = NorthClient.storage;
        if (!message || !message.author || !message.author.id || !message.guild || message.author.bot) return;
        const exp = Math.round(getRandomNumber(5, 15) * (1 + message.content.length / 100));
        const sqlDate = jsDate2Mysql(new Date());
        storage.queries.push(new LevelData(message.author.id, message.guild.id, exp, sqlDate));
    }

    static setup(client: NorthClient) {
        client.once("ready", () => this.ready(client));
        client.on("guildMemberAdd", this.guildMemberAdd);
        client.on("guildMemberRemove", this.guildMemberRemove);
        client.on("guildCreate", this.guildCreate);
        client.on("guildDelete", this.guildDelete);
        client.on("voiceStateUpdate", this.voiceStateUpdate);
        client.on("guildMemberUpdate", this.guildMemberUpdate);
        client.on("messageReactionAdd", this.messageReactionAdd);
        client.on("messageReactionRemove", this.messageReactionRemove);
        client.on("messageDelete", this.messageDelete);
        client.on("message", this.message);
    }

    static async ready(client: NorthClient) {
        await slash(client);
        const storage = NorthClient.storage;
        const pool = client.pool;
        const id = client.id;
        storage.log(`[${id}] Ready!`);
        client.user.setPresence({ activity: { name: "AFK", type: "PLAYING" }, status: "idle", afk: true });
        const con = await pool.getConnection();
        try {
            client.guilds.cache.forEach(g => g.fetchInvites().then(guildInvites => storage.guilds[g.id].invites = guildInvites).catch(() => { }));
            const [r] = <[RowDataPacket[]]><unknown>await con.query("SELECT * FROM currency");
            for (const result of r) {
                try {
                    if (result.bank <= 0) continue;
                    const newBank = Math.round((Number(result.bank) * 1.02 + Number.EPSILON) * 100) / 100;
                    await con.query(`UPDATE currency SET bank = ${newBank} WHERE id = ${result.id}`);
                } catch (err) {
                    storage.error(err);
                }
            }
            var [results] = <[RowDataPacket[]]><unknown>await con.query("SELECT * FROM servers");
            results.forEach(async result => {
                storage.guilds[result.id] = {};
                try {
                    await client.guilds.fetch(result.id);
                } catch (err) {
                    if (result.id != '622311594654695434' && result.id != '819539026792808448') {
                        await con.query(`DELETE FROM servers WHERE id = '${result.id}'`);
                        return storage.log("Removed left servers");
                    }
                }
                if (result.queue || result.looping || result.repeating) {
                    var queue = [];
                    try { if (result.queue) queue = JSON.parse(unescape(result.queue)); }
                    catch (err) { storage.error(`Error parsing queue of ${result.id}`); }
                    setQueue(result.id, queue, !!result.looping, !!result.repeating, pool);
                }
                if (result.prefix) storage.guilds[result.id].prefix = result.prefix;
                storage.guilds[result.id].token = result.token;
                storage.guilds[result.id].giveaway = unescape(result.giveaway);
                storage.guilds[result.id].welcome = {
                    message: result.welcome,
                    channel: result.wel_channel,
                    image: result.wel_img,
                    autorole: result.autorole
                };
                storage.guilds[result.id].leave = {
                    message: result.leave_msg,
                    channel: result.leave_channel
                };
                storage.guilds[result.id].boost = {
                    message: result.boost_msg,
                    channel: result.boost_channel
                };
            });
            storage.log(`[${id}] Set ${results.length} configurations`);
            const [res] = <[RowDataPacket[]]><unknown>await con.query("SELECT * FROM rolemsg WHERE id <> '622311594654695434' AND id <> '819539026792808448' ORDER BY expiration");
            storage.log(`[${id}] ` + "Found " + res.length + " role messages.");
            storage.rm = res;
            res.forEach(async result => expire({ pool, client }, result.expiration - Date.now(), result.id));

            var [results] = <[RowDataPacket[]]><unknown>await con.query("SELECT * FROM giveaways WHERE id <> '622311594654695434' AND id <> '819539026792808448' ORDER BY endAt ASC");
            storage.log(`[${id}] ` + "Found " + results.length + " giveaways");
            results.forEach(async result => {
                var currentDate = Date.now();
                var millisec = result.endAt - currentDate;
                setTimeout_(async () => {
                    endGiveaway(pool, client, result);
                }, millisec);
            });
            var [results] = <[RowDataPacket[]]><unknown>await con.query("SELECT * FROM poll WHERE id <> '622311594654695434' AND id <> '819539026792808448' ORDER BY endAt ASC");
            storage.log(`[${id}] ` + "Found " + results.length + " polls.");
            results.forEach(result => {
                var currentDate = Date.now();
                var time = result.endAt - currentDate;
                setTimeout_(async () => {
                    try {
                        var channel = <TextChannel>await client.channels.fetch(result.channel);
                        var msg = await channel.messages.fetch(result.id);
                        if (msg.deleted) throw new Error("Deleted");
                    } catch (err) {
                        await pool.query("DELETE FROM poll WHERE id = " + result.id);
                        return storage.log("Deleted an ended poll.");
                    }
                    const author = await client.users.fetch(result.author);
                    const allOptions = await JSON.parse(result.options);
                    const pollResult = [];
                    const end = [];
                    for (const emoji of msg.reactions.cache.values()) {
                        pollResult.push(emoji.count);
                        var mesg = `**${((emoji.count ? emoji.count : 0) - 1)}** - \`${unescape(allOptions[pollResult.length - 1])}\``;
                        end.push(mesg);
                    }
                    const pollMsg = "⬆**Poll**⬇";
                    const Ended = new MessageEmbed()
                        .setColor(parseInt(result.color))
                        .setTitle(unescape(result.title))
                        .setDescription(`Poll ended. Here are the results:\n\n\n${end.join("\n\n").replace(/#quot;/g, "'").replace(/#dquot;/g, '"')}`)
                        .setTimestamp()
                        .setFooter("Hosted by " + author.tag, author.displayAvatarURL());
                    await msg.edit(pollMsg, Ended);
                    const link = `https://discord.com/channels/${msg.guild.id}/${msg.channel.id}/${msg.id}`;
                    await msg.channel.send("A poll has ended!\n" + link);
                    msg.reactions.removeAll().catch(() => { });
                    await pool.query("DELETE FROM poll WHERE id = " + result.id);
                    storage.log("Deleted an ended poll.");
                }, time);
            });
            var [results] = <[RowDataPacket[]]><unknown>await con.query("SELECT * FROM timer WHERE id <> '622311594654695434' AND id <> '819539026792808448'");
            storage.log(`[${id}] Found ${results.length} timers.`);
            results.forEach(async result => {
                let time = result.endAt - Date.now();
                let em = new MessageEmbed();
                try {
                    var channel = <TextChannel>await client.channels.fetch(result.channel);
                    var msg = await channel.messages.fetch(result.msg);
                    var author = await client.users.fetch(result.author);
                    var guild = client.guilds.resolve(result.guild);
                } catch (err) { return; }
                if (!channel) time = 0;
                if (!guild) time = 0;
                if (!msg) time = 0;
                else if (msg.author.id !== client.user?.id) time = 0;
                else if (msg.embeds.length !== 1) time = 0;
                else if (!msg.embeds[0].color || !msg.embeds[0].title || !msg.embeds[0].timestamp || !msg.embeds[0].footer || !msg.embeds[0].description || msg.embeds[0].author || msg.embeds[0].fields.length !== 0 || msg.embeds[0].files.length !== 0 || msg.embeds[0].image || msg.embeds[0].thumbnail || msg.embeds[0].type != "rich") time = 0;
                if (msg.embeds[0].color && msg.embeds[0].title && msg.embeds[0].footer && msg.embeds[0].timestamp) em.setTitle(msg.embeds[0].title).setColor(msg.embeds[0].color).setFooter(msg.embeds[0].footer.text, msg.embeds[0].footer.iconURL).setTimestamp(msg.embeds[0].timestamp);
                let count = 0;
                let timerid = setInterval(async () => {
                    time -= 1000;
                    if (time <= 0) {
                        clearInterval(timerid);
                        em.setDescription("The timer has ended.");
                        msg = await msg.edit(em);
                        author.send(`Your timer in **${guild.name}** has ended! https://discord.com/channels/${guild.id}/${channel.id}/${msg.id}`);
                        const conn = await pool.getConnection();
                        try {
                            var [res] = <[RowDataPacket[]]><unknown>await conn.query(`SELECT * FROM timer WHERE guild = '${guild.id}' AND channel = '${channel.id}' AND author = '${author.id}' AND msg = '${msg.id}'`);
                            if (res.length < 1) return;
                            await conn.query(`DELETE FROM timer WHERE guild = '${guild.id}' AND channel = '${channel.id}' AND author = '${author.id}' AND msg = '${msg.id}'`);
                            return storage.log("Deleted a timed out timer from the database.");
                        } catch (err) {
                            storage.error(err);
                        }
                        conn.release();
                    }
                    if (count < 4) return count++;
                    em.setDescription(`(The timer updates every **5 seconds**)\nThis is a timer and it will last for\n**${readableDateTimeText(time)}**`);
                    msg = await msg.edit(em);
                    count = 0;
                }, 1000);
                storage.timers.set(result.msg, timerid);
            });
            var [results] = <[RowDataPacket[]]><unknown>await con.query("SELECT * FROM nolog");
            storage.noLog = results.map(x => x.id);
        } catch (err) { storage.error(err); };
        con.release();
    }

    static async guildMemberAdd(member: GuildMember) {
        const client = (member.client as NorthClient);
        const storage = NorthClient.storage;
        const guild = member.guild;
        const pool = client.pool;
        if (member.user.bot) return;
        guild.fetchInvites().then(async guildInvites => {
            const ei = storage.guilds[member.guild.id].invites;
            storage.guilds[member.guild.id].invites = guildInvites;
            const invite = await guildInvites.find(i => !ei.get(i.code) || ei.get(i.code).uses < i.uses);
            if (!invite) return;
            const inviter = await client.users.fetch(invite.inviter.id);
            if (!inviter) return;
            const allUserInvites = await guildInvites.filter(i => i.inviter.id === inviter.id && i.guild.id === guild.id);
            const reducer = (a, b) => a + b;
            const uses = await allUserInvites.map(i => i.uses ? i.uses : 0).reduce(reducer);
            if (storage.noLog.find(x => x === inviter.id)) return;
            try {
                await inviter.send(`You invited **${member.user.tag}** to the server **${guild.name}**! In total, you have now invited **${uses} users** to the server!\n(If you want to disable this message, use \`${client.prefix}invites toggle\` to turn it off)`);
            } catch (err) {
                storage.error("Failed to DM user.");
            }
        }).catch(() => { });
        try {
            const welcome = storage.guilds[guild.id]?.welcome;
            if (!welcome?.channel) {
                if (storage.guilds[guild.id]) return;
                await pool.query(`INSERT INTO servers (id, autorole, giveaway) VALUES ('${guild.id}', '[]', '${escape("🎉")}')`);
                storage.guilds[guild.id] = {};
                storage.log("Inserted record for " + guild.name);
            } else {
                if (!welcome.channel) return;
                const channel = <TextChannel>guild.channels.resolve(welcome.channel);
                if (!channel || !channel.permissionsFor(guild.me).has(18432)) return;
                if (welcome.message) try {
                    const welcomeMessage = replaceMsgContent(welcome.message, guild, client, member, "welcome");
                    await channel.send(welcomeMessage);
                } catch (err) {
                    storage.error(err);
                }
                if (welcome.image) {
                    var img = new Image();
                    img.onload = async () => {
                        var height = img.height;
                        var width = img.width;
                        const canvas = createCanvas(width, height);
                        const ctx = canvas.getContext("2d");
                        const applyText = (canvas, text) => {
                            const ctx = canvas.getContext("2d");
                            let fontSize = canvas.width / 12;
                            do {
                                ctx.font = `regular ${(fontSize -= 5)}px "NotoSans", "free-sans", Arial`;
                            } while (ctx.measureText(text).width > canvas.width * 9 / 10);
                            return ctx.font;
                        };
                        const welcomeText = (canvas, text) => {
                            const ctx = canvas.getContext("2d");
                            let fontSize = canvas.width / 24;
                            do {
                                ctx.font = `regular ${(fontSize -= 5)}px "NotoSans", "free-sans", Arial`;
                            } while (ctx.measureText(text).width > canvas.width * 3 / 4);
                            return ctx.font;
                        };
                        const avatar = await loadImage(member.user.displayAvatarURL({ format: "png" }));
                        ctx.drawImage(img, 0, 0, width, height);
                        const txt = member.user.tag;
                        ctx.font = applyText(canvas, txt);
                        ctx.strokeStyle = "black";
                        ctx.lineWidth = canvas.width / 102.4;
                        ctx.strokeText(txt, canvas.width / 2 - ctx.measureText(txt).width / 2, (canvas.height * 3) / 4);
                        ctx.fillStyle = "#ffffff";
                        ctx.fillText(txt, canvas.width / 2 - ctx.measureText(txt).width / 2, (canvas.height * 3) / 4);
                        const welcome = "Welcome to the server!";
                        ctx.font = welcomeText(canvas, welcome);
                        ctx.strokeStyle = "black";
                        ctx.lineWidth = canvas.width / 204.8;
                        ctx.strokeText(welcome, canvas.width / 2 - ctx.measureText(welcome).width / 2, (canvas.height * 6) / 7);
                        ctx.fillStyle = "#ffffff";
                        ctx.fillText(welcome, canvas.width / 2 - ctx.measureText(welcome).width / 2, (canvas.height * 6) / 7);
                        ctx.beginPath();
                        ctx.lineWidth = canvas.width / 51.2;
                        ctx.arc(canvas.width / 2, canvas.height / 3, canvas.height / 5, 0, Math.PI * 2, true);
                        ctx.closePath();
                        ctx.strokeStyle = "#dfdfdf";
                        ctx.stroke();
                        ctx.clip();
                        ctx.drawImage(avatar, canvas.width / 2 - canvas.height / 5, canvas.height / 3 - canvas.height / 5, canvas.height / 2.5, canvas.height / 2.5);
                        var attachment = new MessageAttachment(canvas.toBuffer(), "welcome-image.png");
                        try {
                            await channel.send(attachment);
                        } catch (err) {
                            storage.error(err);
                        }
                    };
                    var url = welcome.image;
                    try {
                        let urls = JSON.parse(welcome.image);
                        if (Array.isArray(urls)) url = urls[Math.floor(Math.random() * urls.length)];
                    } catch (err) { }
                    img.src = url;
                }
            }
            if (welcome && welcome.autorole !== "[]") {
                const roleArray = JSON.parse(welcome.autorole);
                for (var i = 0; i < roleArray.length; i++) {
                    const roleID = roleArray[i];
                    var role = undefined;
                    if (isNaN(parseInt(roleID))) role = await guild.roles.cache.find(x => x.name === roleID);
                    else role = await guild.roles.fetch(roleID);
                    if (!role) continue;
                    try {
                        await member.roles.add(roleID);
                    } catch (err) {
                        storage.error(err);
                    }
                }
            }
        } catch (err) { storage.error(err) };
    }

    static async guildMemberRemove(member: GuildMember | PartialGuildMember) {
        const client = (member.client as NorthClient);
        const guild = member.guild;
        const storage = NorthClient.storage;
        try {
            const leave = storage.guilds[guild.id]?.leave;
            if (!leave?.channel) {
                if (storage.guilds[guild.id]) return;
                await client.pool.query(`INSERT INTO servers (id, autorole, giveaway) VALUES ('${guild.id}', '[]', '${escape("🎉")}')`);
                storage.guilds[guild.id] = {};
                storage.log("Inserted record for " + guild.name);
            } else {
                if (guild.me.hasPermission(128)) {
                    const fetchedLogs = await guild.fetchAuditLogs({ limit: 1, type: 'MEMBER_KICK' });
                    const kickLog = fetchedLogs.entries.first();
                    if (kickLog && (kickLog.target as any).id === member.user.id && kickLog.executor.id !== (kickLog.target as any).id) return;
                } else storage.log("Can't view audit logs of " + guild.name);
                const channel = <TextChannel>guild.channels.resolve(leave.channel);
                if (!channel || !channel.permissionsFor(guild.me).has(18432)) return;
                if (!leave.message) return;
                try {
                    const leaveMessage = replaceMsgContent(leave.message, guild, client, member, "leave");
                    await channel.send(leaveMessage);
                } catch (err) {
                    storage.error(err);
                }
            }
        } catch (err) { storage.error(err) };
    }

    static async guildCreate(guild: Guild) {
        const client = <NorthClient>guild.client;
        const storage = NorthClient.storage;
        storage.log("Joined a new guild: " + guild.name);
        try { storage.guilds[guild.id].invites = await guild.fetchInvites(); } catch (err) { }
        try {
            const con = await client.pool.getConnection();
            const [result] = <[RowDataPacket[]]><unknown>await con.query("SELECT * FROM servers WHERE id = " + guild.id);
            if (result.length > 0) storage.log("Found row inserted for this server before. Cancelling row insert...");
            else {
                await con.query(`INSERT INTO servers (id, autorole, giveaway) VALUES ('${guild.id}', '[]', '${escape("🎉")}')`);
                storage.guilds[guild.id] = {};
                storage.log("Inserted record for " + guild.name);
            }
            con.release();
        } catch (err) {
            storage.error(err);
        }
    }

    static async guildDelete(guild: Guild) {
        const client = <NorthClient>guild.client;
        const storage = NorthClient.storage;
        storage.log("Left a guild: " + guild.name);
        delete storage.guilds[guild.id];
        try {
            await client.pool.query("DELETE FROM servers WHERE id=" + guild.id);
            storage.log("Deleted record for " + guild.name);
        } catch (err) {
            storage.error(err);
        }
    }

    static async voiceStateUpdate(oldState: VoiceState, newState: VoiceState) {
        const guild = oldState.guild || newState.guild;
        const client = <NorthClient>guild.client;
        const storage = NorthClient.storage;
        const exit = storage.guilds[guild.id]?.exit;
        if ((oldState.id == guild.me.id || newState.id == guild.me.id) && (!guild.me.voice || !guild.me.voice.channel)) return await stop(guild);
        if (!guild.me.voice?.channel || (newState.channelID !== guild.me.voice.channelID && oldState.channelID !== guild.me.voice.channelID)) return;
        if (!storage.guilds[guild.id]) {
            await client.pool.query(`INSERT INTO servers (id, autorole, giveaway) VALUES ('${guild.id}', '[]', '${escape("🎉")}')`);
            storage.guilds[guild.id] = {};
            storage.log("Inserted record for " + guild.name);
        }
        if (guild.me.voice.channel.members.size <= 1) {
            if (exit) return;
            storage.guilds[guild.id].exit = true;
            setTimeout(async () => exit ? stop(guild) : 0, 30000);
        } else storage.guilds[guild.id].exit = false;
    }

    static async guildMemberUpdate(oldMember: GuildMember | PartialGuildMember, newMember: GuildMember) {
        const client = <NorthClient>(oldMember.client || newMember.client);
        const storage = NorthClient.storage;
        if (client.id == 1 && oldMember.displayName !== newMember.displayName) {
            const [results] = <[RowDataPacket[]]><unknown>await client.pool.query(`SELECT uuid FROM dcmc WHERE dcid = '${newMember.id}'`);
            if (results.length == 1) {
                const { name } = await profile(results[0].uuid);
                const mcLen = name.length + 3;
                var nickname = newMember.displayName;
                const matches = nickname.match(/ \[\w+\]$/);
                if (matches) nickname = nickname.replace(matches[0], "");
                if (nickname.length + mcLen > 32) await newMember.setNickname(`${nickname.slice(0, 29 - mcLen)}... [${name}]`);
                else await newMember.setNickname(`${nickname} [${name}]`);
            }
        }
        if (oldMember.premiumSinceTimestamp || !newMember.premiumSinceTimestamp) return;
        const boost = storage.guilds[newMember.guild.id]?.boost;
        if (!boost?.channel || !boost.message) return;
        try {
            const channel = <TextChannel>await client.channels.fetch(boost.channel);
            channel.send(boost.message.replace(/\{user\}/gi, `<@${newMember.id}>`));
        } catch (err) { }
    }

    static async messageReactionAdd(r: MessageReaction, user: User | PartialUser) {
        const storage = NorthClient.storage;
        var roleMessage = storage.rm.find(x => x.id == r.message.id);
        if (!roleMessage) return;
        const emojis = JSON.parse(roleMessage.emojis);
        var index = -1;
        if (emojis.includes(r.emoji.id)) index = emojis.indexOf(r.emoji.id);
        else if (emojis.includes(r.emoji.name)) index = emojis.indexOf(r.emoji.name);
        else return;
        try {
            const guild = await user.client.guilds.fetch(roleMessage.guild);
            const member = await guild.members.fetch(user.id);
            if (index > -1) await member.roles.add(JSON.parse(roleMessage.roles)[index]);
        } catch (err) {
            storage.error(err);
        }
    }

    static async messageReactionRemove(r: MessageReaction, user: User | PartialUser) {
        const storage = NorthClient.storage;
        var roleMessage = storage.rm.find(x => x.id == r.message.id);
        if (!roleMessage) return;
        const emojis = JSON.parse(roleMessage.emojis);
        var index = -1;
        if (emojis.includes(r.emoji.id)) index = emojis.indexOf(r.emoji.id);
        else if (emojis.includes(r.emoji.name)) index = emojis.indexOf(r.emoji.name);
        else return;
        try {
            const guild = await r.client.guilds.fetch(roleMessage.guild);
            const member = await guild.members.fetch(user.id);
            if (index > -1) await member.roles.remove(JSON.parse(roleMessage.roles)[index]);
        } catch (err) {
            storage.error(err);
        }
    }

    static async messageDelete(message: Message | PartialMessage) {
        const client = <NorthClient>message.client;
        const storage = NorthClient.storage;
        var roleMessage = storage.rm.find(x => x.id === message.id);
        if (!roleMessage) return;
        storage.rm.splice(storage.rm.indexOf(roleMessage), 1);
        await client.pool.query(`DELETE FROM rolemsg WHERE id = '${message.id}'`);
    }

    static async message(message: Message): Promise<any> {
        const client = <NorthClient>message.client;
        const storage = NorthClient.storage;
        const msg = (<NorthMessage>message);
        msg.prefix = client.prefix;
        if (msg.guild && storage.guilds[msg.guild.id]?.prefix) msg.prefix = storage.guilds[msg.guild.id].prefix;
        Handler.messageLevel(msg);
        const args = msg.content.slice(msg.prefix.length).split(/ +/);
        if (!msg.content.startsWith(msg.prefix) || msg.author.bot) {
            if (!msg.author.bot && Math.floor(Math.random() * 1000) === 69) cleverbot(msg.content).then(response => msg.channel.send(response));
            return;
        };
        const commandName = args.shift().toLowerCase();
        const command = storage.commands.get(commandName) || storage.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
        if (!command) return;
        msg.pool = client.pool;
        try {
            const catFilter = filter[require("../commands/information/help").sCategories.map(x => x.toLowerCase())[(command.category)]];
            if(await filter.all(command, msg, args) && (catFilter ? await catFilter(command, msg) : true)) await command.execute(msg, args);
        } catch (error) {
            storage.error(command.name + ": " + error);
            await msg.reply("there was an error trying to execute that command!\nIf it still doesn't work after a few tries, please contact NorthWestWind or report it on the support server.");
        }
    }
}

export class AliceHandler extends Handler {
    static async ready(client: NorthClient) {
        const id = client.id;
        const storage = NorthClient.storage;
        const pool = client.pool;
        storage.log(`[${id}] Ready!`);
        client.user.setActivity("Sword Art Online Alicization", { type: "LISTENING" });
        const con = await client.pool.getConnection();
        try {
            client.guilds.cache.forEach(g => g.fetchInvites().then(guildInvites => storage.guilds[g.id].invites = guildInvites).catch(() => { }));
            const [res] = <[RowDataPacket[]]><unknown>await con.query(`SELECT * FROM gtimer ORDER BY endAt ASC`);
            storage.log(`[${id}] Found ${res.length} guild timers`);
            res.forEach(async result => {
                let endAfter = result.endAt.getTime() - Date.now();
                let mc = await profile(result.mc);
                let username = "undefined";
                if (mc) username = mc.name;
                let dc = `<@${result.user}>`;
                let rank = unescape(result.dc_rank);
                let title = `${dc} - ${rank} [${username}]`;
                setTimeout_(async () => {
                    let asuna = await client.users.fetch("461516729047318529");
                    const conn = await pool.getConnection();
                    try {
                        const [results] = <[RowDataPacket[]]><unknown>await conn.query(`SELECT id FROM gtimer WHERE user = '${result.user}' AND mc = '${result.mc}' AND dc_rank = '${result.dc_rank}'`);
                        if (results.length == 0) return;
                        try {
                            asuna.send(title + " expired");
                            var user = await client.users.fetch(result.user);
                            user.send(`Your rank **${rank}** in War of Underworld has expired.`);
                        } catch (err) { storage.error("Failed to DM user"); }
                        await conn.query(`DELETE FROM gtimer WHERE user = '${result.user}' AND mc = '${result.mc}' AND dc_rank = '${result.dc_rank}'`);
                        storage.log("A guild timer expired.");
                    } catch (err) {
                        storage.error(err);
                    }
                    conn.release();
                }, endAfter);
            });
            const [gtimers] = <[RowDataPacket[]]><unknown>await pool.query(`SELECT * FROM gtimer ORDER BY endAt ASC`);
            storage.gtimers = gtimers;
            setInterval(async () => {
                try {
                    var timerChannel = <TextChannel>await client.channels.fetch(process.env.TIME_LIST_CHANNEL);
                    var timerMsg = await timerChannel.messages.fetch(process.env.TIME_LIST_ID);
                } catch (err) {
                    storage.error("Failed to fetch timer list message");
                    return;
                }
                try {
                    let now = Date.now();
                    let tmp = [];
                    for (const result of storage.gtimers) {
                        let mc = await profile(result.mc);
                        let username = "undefined";
                        if (mc) username = mc.name;
                        const str = result.user;
                        let dc = "0";
                        try {
                            var user = await client.users.fetch(str);
                            dc = user.id;
                        } catch (err) { }
                        let rank = unescape(result.dc_rank);
                        let title = `<@${dc}> - ${rank} [${username}]`;
                        let seconds = Math.round((result.endAt.getTime() - now) / 1000);
                        tmp.push({ title: title, time: duration(seconds) });
                    }
                    if (tmp.length <= 10) {
                        timerMsg.reactions.removeAll().catch(storage.error);
                        let description = "";
                        let num = 0;
                        for (const result of tmp) description += `${++num}. ${result.title} : ${result.time}\n`;
                        const em = new MessageEmbed()
                            .setColor(color())
                            .setTitle("Rank Expiration Timers")
                            .setDescription(description)
                            .setTimestamp()
                            .setFooter("This list updates every 30 seconds", client.user.displayAvatarURL());
                        timerMsg.edit({ content: "", embed: em });
                    } else {
                        const allEmbeds = [];
                        for (let i = 0; i < Math.ceil(tmp.length / 10); i++) {
                            let desc = "";
                            for (let num = 0; num < 10; num++) {
                                if (!tmp[i + num]) break;
                                desc += `${num + 1}. ${tmp[i + num].title} : ${tmp[i + num].time}\n`;
                            }
                            const em = new MessageEmbed()
                                .setColor(color())
                                .setTitle(`Rank Expiration Timers [${i + 1}/${Math.ceil(tmp.length / 10)}]`)
                                .setDescription(desc)
                                .setTimestamp()
                                .setFooter("This list updates every 30 seconds", client.user.displayAvatarURL());
                            allEmbeds.push(em);
                        }
                        const filter = (reaction) => ["◀", "▶", "⏮", "⏭", "⏹"].includes(reaction.emoji.name);
                        var msg = await timerMsg.edit({ content: "", embed: allEmbeds[0] });
                        var s = 0;
                        await msg.react("⏮");
                        await msg.react("◀");
                        await msg.react("▶");
                        await msg.react("⏭");
                        await msg.react("⏹");
                        const collector = msg.createReactionCollector(filter, { time: 30000 });
                        collector.on("collect", function (reaction, user) {
                            reaction.users.remove(user.id);
                            switch (reaction.emoji.name) {
                                case "⏮":
                                    s = 0;
                                    msg.edit(allEmbeds[s]);
                                    break;
                                case "◀":
                                    s -= 1;
                                    if (s < 0) s = allEmbeds.length - 1;
                                    msg.edit(allEmbeds[s]);
                                    break;
                                case "▶":
                                    s += 1;
                                    if (s > allEmbeds.length - 1) s = 0;
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
                        collector.on("end", () => msg.reactions.removeAll().catch(storage.error));
                    }
                } catch (err) {
                    storage.error(err);
                }
            }, 30000);
            var [results] = <[RowDataPacket[]]><unknown>await con.query("SELECT * FROM giveaways WHERE guild = '622311594654695434' OR id = '819539026792808448' ORDER BY endAt ASC");
            storage.log(`[${id}] ` + "Found " + results.length + " giveaways");
            results.forEach(async result => {
                var currentDate = Date.now();
                var millisec = result.endAt - currentDate;
                setTimeout_(async () => {
                    endGiveaway(pool, client, result);
                }, millisec);
            });
            var [results] = <[RowDataPacket[]]><unknown>await con.query("SELECT * FROM poll WHERE guild = '622311594654695434' OR id = '819539026792808448' ORDER BY endAt ASC");
            storage.log(`[${id}] ` + "Found " + results.length + " polls.");
            results.forEach(result => {
                var currentDate = Date.now();
                var time = result.endAt - currentDate;
                setTimeout_(async () => {
                    try {
                        var channel = <TextChannel>await client.channels.fetch(result.channel);
                        var msg = await channel.messages.fetch(result.id);
                        if (msg.deleted) throw new Error("Deleted");
                    } catch (err) {
                        if (channel || (msg && msg.deleted)) {
                            await pool.query("DELETE FROM poll WHERE id = " + result.id);
                            return storage.log("Deleted an ended poll.");
                        }
                    }
                    const author = await client.users.fetch(result.author);
                    const allOptions = await JSON.parse(result.options);
                    const pollResult = [];
                    const end = [];
                    for (const emoji of msg.reactions.cache.values()) {
                        pollResult.push(emoji.count);
                        var mesg = `**${(emoji.count - 1)}** - \`${unescape(allOptions[pollResult.length - 1])}\``;
                        end.push(mesg);
                    }
                    const pollMsg = "⬆**Poll**⬇";
                    const Ended = new MessageEmbed()
                        .setColor(parseInt(result.color))
                        .setTitle(unescape(result.title))
                        .setDescription(`Poll ended. Here are the results:\n\n\n${end.join("\n\n").replace(/#quot;/g, "'").replace(/#dquot;/g, '"')}`)
                        .setTimestamp()
                        .setFooter("Hosted by " + author.tag, author.displayAvatarURL());
                    await msg.edit(pollMsg, Ended);
                    const link = `https://discord.com/channels/${msg.guild.id}/${msg.channel.id}/${msg.id}`;
                    await msg.channel.send("A poll has ended!\n" + link);
                    msg.reactions.removeAll().catch(() => { });
                    await pool.query("DELETE FROM poll WHERE id = " + result.id);
                    storage.log("Deleted an ended poll.");
                }, time);
            });
            var [results] = <[RowDataPacket[]]><unknown>await con.query("SELECT * FROM timer WHERE guild = '622311594654695434' OR id = '819539026792808448'");
            storage.log(`[${id}] Found ${results.length} timers.`);
            results.forEach(async result => {
                let time = result.endAt - Date.now();
                let em = new MessageEmbed();
                try {
                    var channel = <TextChannel>await client.channels.fetch(result.channel);
                    var msg = await channel.messages.fetch(result.msg);
                    var author = await client.users.fetch(result.author);
                    var guild = await client.guilds.resolve(result.guild);
                } catch (err) { return; }
                if (!channel) time = 0;
                if (!guild) time = 0;
                if (!msg) time = 0;
                else if (msg.author.id !== client.user.id) time = 0;
                else if (msg.embeds.length !== 1) time = 0;
                else if (!msg.embeds[0].color || !msg.embeds[0].title || !msg.embeds[0].timestamp || !msg.embeds[0].footer || !msg.embeds[0].description || msg.embeds[0].author || msg.embeds[0].fields.length !== 0 || msg.embeds[0].files.length !== 0 || msg.embeds[0].image || msg.embeds[0].thumbnail || msg.embeds[0].type != "rich") time = 0;
                if (msg.embeds[0].color && msg.embeds[0].title && msg.embeds[0].footer && msg.embeds[0].timestamp) em.setTitle(msg.embeds[0].title).setColor(msg.embeds[0].color).setFooter(msg.embeds[0].footer.text, msg.embeds[0].footer.iconURL).setTimestamp(msg.embeds[0].timestamp);
                let count = 0;
                let timerid = setInterval(async () => {
                    time -= 1000;
                    if (time <= 0) {
                        clearInterval(timerid);
                        em.setDescription("The timer has ended.");
                        msg = await msg.edit(em);
                        author.send(`Your timer in **${guild.name}** has ended! https://discord.com/channels/${guild.id}/${channel.id}/${msg.id}`);
                        const conn = await pool.getConnection();
                        try {
                            var [res] = <[RowDataPacket[]]><unknown>await conn.query(`SELECT * FROM timer WHERE guild = '${guild.id}' AND channel = '${channel.id}' AND author = '${author.id}' AND msg = '${msg.id}'`);
                            if (res.length < 1) return;
                            await conn.query(`DELETE FROM timer WHERE guild = '${guild.id}' AND channel = '${channel.id}' AND author = '${author.id}' AND msg = '${msg.id}'`);
                            return storage.log("Deleted a timed out timer from the database.");
                        } catch (err) {
                            storage.error(err);
                        }
                        conn.release();
                    }
                    if (count < 4) return count++;
                    em.setDescription(`(The timer updates every **5 seconds**)\nThis is a timer and it will last for\n**${readableDateTimeText(time)}**`);
                    msg = await msg.edit(em);
                    count = 0;
                }, 1000);
                storage.timers.set(result.msg, timerid);
            });
            var [results] = <[RowDataPacket[]]><unknown>await con.query("SELECT * FROM nolog");
            storage.noLog = results.map(x => x.id);
        } catch (err) { storage.error(err); };
        con.release();
    }

    static async guildMemberAdd(member: GuildMember) {
        const client = <NorthClient>member.client;
        const id = client.id;
        const guild = member.guild;
        const storage = NorthClient.storage;
        if (member.user.bot) return;
        guild.fetchInvites().then(async guildInvites => {
            const ei = storage.guilds[member.guild.id].invites;
            storage.guilds[member.guild.id].invites = guildInvites;
            const invite = await guildInvites.find(i => !ei.get(i.code) || ei.get(i.code).uses < i.uses);
            if (!invite) return;
            const inviter = await client.users.fetch(invite.inviter.id);
            if (!inviter) return;
            const allUserInvites = await guildInvites.filter(i => i.inviter.id === inviter.id && i.guild.id === guild.id);
            const reducer = (a, b) => a + b;
            const uses = await allUserInvites.map(i => i.uses ? i.uses : 0).reduce(reducer);
            if (storage.noLog.find(x => x === inviter.id)) return;
            try {
                await inviter.send(`You invited **${member.user.tag}** to the server **${guild.name}**! In total, you have now invited **${uses} users** to the server!\n(If you want to disable this message, use \`${client.prefix}invites toggle\` to turn it off)`);
            } catch (err) {
                storage.error("Failed to DM user.");
            }
        }).catch(() => { });
        try {
            const welcome = storage.guilds[guild.id]?.welcome;
            if (!welcome?.channel) {
                if (storage.guilds[guild.id]) return;
                await client.pool.query(`INSERT INTO servers (id, autorole, giveaway) VALUES ('${guild.id}', '[]', '${escape("🎉")}')`);
                storage.guilds[guild.id] = {};
                storage.log("Inserted record for " + guild.name);
            } else {
                if (!welcome.channel) return;
                const channel = <TextChannel>guild.channels.resolve(welcome.channel);
                if (!channel || !channel.permissionsFor(guild.me).has(18432)) return;
                if (welcome.message) try {
                    const welcomeMessage = replaceMsgContent(welcome.message, guild, client, member, "welcome");
                    await channel.send(welcomeMessage);
                } catch (err) {
                    storage.error(err);
                }
                if (welcome.image) {
                    var img = new Image();
                    img.onload = async () => {
                        var height = img.height;
                        var width = img.width;
                        const canvas = createCanvas(width, height);
                        const ctx = canvas.getContext("2d");
                        const applyText = (canvas, text) => {
                            const ctx = canvas.getContext("2d");
                            let fontSize = canvas.width / 12;
                            do {
                                ctx.font = `regular ${(fontSize -= 5)}px "NotoSans", "free-sans", Arial`;
                            } while (ctx.measureText(text).width > canvas.width * 9 / 10);
                            return ctx.font;
                        };
                        const welcomeText = (canvas, text) => {
                            const ctx = canvas.getContext("2d");
                            let fontSize = canvas.width / 24;
                            do {
                                ctx.font = `regular ${(fontSize -= 5)}px "NotoSans", "free-sans", Arial`;
                            } while (ctx.measureText(text).width > canvas.width * 3 / 4);
                            return ctx.font;
                        };
                        const avatar = await loadImage(member.user.displayAvatarURL({ format: "png" }));
                        ctx.drawImage(img, 0, 0, width, height);
                        const txt = member.user.tag;
                        ctx.font = applyText(canvas, txt);
                        ctx.strokeStyle = "black";
                        ctx.lineWidth = canvas.width / 102.4;
                        ctx.strokeText(txt, canvas.width / 2 - ctx.measureText(txt).width / 2, (canvas.height * 3) / 4);
                        ctx.fillStyle = "#ffffff";
                        ctx.fillText(txt, canvas.width / 2 - ctx.measureText(txt).width / 2, (canvas.height * 3) / 4);
                        const welcome = "Welcome to the server!";
                        ctx.font = welcomeText(canvas, welcome);
                        ctx.strokeStyle = "black";
                        ctx.lineWidth = canvas.width / 204.8;
                        ctx.strokeText(welcome, canvas.width / 2 - ctx.measureText(welcome).width / 2, (canvas.height * 6) / 7);
                        ctx.fillStyle = "#ffffff";
                        ctx.fillText(welcome, canvas.width / 2 - ctx.measureText(welcome).width / 2, (canvas.height * 6) / 7);
                        ctx.beginPath();
                        ctx.lineWidth = canvas.width / 51.2;
                        ctx.arc(canvas.width / 2, canvas.height / 3, canvas.height / 5, 0, Math.PI * 2, true);
                        ctx.closePath();
                        ctx.strokeStyle = "#dfdfdf";
                        ctx.stroke();
                        ctx.clip();
                        ctx.drawImage(avatar, canvas.width / 2 - canvas.height / 5, canvas.height / 3 - canvas.height / 5, canvas.height / 2.5, canvas.height / 2.5);
                        var attachment = new MessageAttachment(canvas.toBuffer(), "welcome-image.png");
                        try {
                            await channel.send(new MessageAttachment("https://cdn.discordapp.com/attachments/707639765607907358/737859171269214208/welcome.png"));
                            await channel.send(attachment);
                        } catch (err) {
                            storage.error(err);
                        }
                    };
                    var url = welcome.image;
                    try {
                        let urls = JSON.parse(welcome.image);
                        if (Array.isArray(urls)) url = urls[Math.floor(Math.random() * urls.length)];
                    } catch (err) { }
                    img.src = url;
                }
            }
            if (welcome && welcome.autorole !== "[]") {
                const roleArray = JSON.parse(welcome.autorole);
                for (var i = 0; i < roleArray.length; i++) {
                    const roleID = roleArray[i];
                    var role = undefined;
                    if (isNaN(parseInt(roleID))) role = guild.roles.cache.find(x => x.name === roleID);
                    else role = await guild.roles.fetch(roleID);
                    if (!role) continue;
                    try {
                        await member.roles.add(roleID);
                    } catch (err) {
                        storage.error(err);
                    }
                }
            }
        } catch (err) { storage.error(err) };
    }

    static async message(message: Message) {
        const client = <NorthClient>message.client;

        if (message.mentions.users.size > 10) {
            await message.delete();
            const msg = await message.reply("do not spam ping.");
            await wait(3000);
            await msg.delete();
            await message.member.roles.set(["755263714940289125"]);
            return;
        }

        if (message.channel.id == "647630951169523762") {
            if (!message.content.match(/^\w{3,16}$/)) return;
            const mcName = message.content;
            NorthClient.storage.log("Received name: " + mcName);
            const dcUserID = message.author.id;
            const msg = await message.channel.send("Processing...");
            const con = await client.pool.getConnection();
            try {
                const mcUuid = await nameToUuid(mcName);
                if (!mcUuid) return await msg.edit("Error finding that user!").then(msg => msg.delete({ timeout: 10000 }));
                NorthClient.storage.log("Found UUID: " + mcUuid);
                var res;
                try {
                    res = await fetch(`https://api.slothpixel.me/api/players/${mcUuid}?key=${process.env.API}`).then(res => res.json());
                } catch (err) {
                    return await msg.edit("The Hypixel API is down.").then(msg => msg.delete({ timeout: 10000 }));
                }
                const hyDc = res.links?.DISCORD;
                if (!hyDc || hyDc !== message.author.tag) return await msg.edit("This Hypixel account is not linked to your Discord account!").then(msg => msg.delete({ timeout: 10000 }));
                await message.member.roles.remove("811824361215623188");
                var [results] = <[RowDataPacket[]]><unknown>await con.query(`SELECT * FROM dcmc WHERE dcid = '${dcUserID}'`);
                if (results.length == 0) {
                    await con.query(`INSERT INTO dcmc VALUES(NULL, '${dcUserID}', '${mcUuid}')`);
                    await msg.edit("Added record! This message will be auto-deleted in 10 seconds.").then(msg => msg.delete({ timeout: 10000 }));
                    NorthClient.storage.log("Inserted record for mc-name.");
                } else {
                    await con.query(`UPDATE dcmc SET uuid = '${mcUuid}' WHERE dcid = '${dcUserID}'`);
                    await msg.edit("Updated record! This message will be auto-deleted in 10 seconds.").then(msg => msg.delete({ timeout: 10000 }));
                    NorthClient.storage.log("Updated record for mc-name.");
                }
                const mcLen = res.username.length + 3;
                var nickname = message.member.displayName;
                const matches = nickname.match(/ \[\w+\]$/);
                if (matches) nickname = nickname.replace(matches[0], "");
                if (nickname.length + mcLen > 32) await message.member.setNickname(`${nickname.slice(0, 29 - mcLen)}... [${res.username}]`);
                else await message.member.setNickname(`${nickname} [${res.username}]`);
                const gInfo = await fetch(`https://api.slothpixel.me/api/guilds/${mcUuid}?key=${process.env.API}`).then(res => res.json());
                if (gInfo.id === "5b25306a0cf212fe4c98d739") await message.member.roles.add("622319008758104064");
                await message.member.roles.remove("837271157912633395");
                await message.member.roles.remove("837271158738255912");
                await message.member.roles.remove("837271163121041458");
                await message.member.roles.remove("837271170717057065");
                await message.member.roles.remove("837271174827212850");
                await message.member.roles.remove("837271174073155594");
                await message.member.roles.remove("837271173027856404");
                await message.member.roles.remove("837271172319674378");
                await message.member.roles.remove("837271171619356692");
                if (res.rank === "ADMIN") await message.member.roles.add("837271157912633395");
                else if (res.rank === "MOD") await message.member.roles.add("837271158738255912");
                else if (res.rank === "HELPER") await message.member.roles.add("837271163121041458");
                else if (res.rank === "YOUTUBER") await message.member.roles.add("837271170717057065");
                else if (res.rank === "VIP") await message.member.roles.add("837271174827212850");
                else if (res.rank === "VIP_PLUS") await message.member.roles.add("837271174073155594");
                else if (res.rank === "MVP") await message.member.roles.add("837271173027856404");
                else if (res.rank === "MVP_PLUS") await message.member.roles.add("837271172319674378");
                else if (res.rank === "MVP_PLUS_PLUS") await message.member.roles.add("837271171619356692");
            } catch (err) {
                NorthClient.storage.error(err);
                await msg.edit("Error updating record! Please contact NorthWestWind#1885 to fix this.").then(msg => msg.delete({ timeout: 10000 }));
            }
            con.release();
            return;
        }
        super.message(message);
    }
}

export class CanaryHandler extends Handler {
    static async ready(client: NorthClient) {
        const storage = NorthClient.storage;
        const pool = client.pool;
        const id = client.id;
        storage.log(`[${id}] Ready!`);
        client.user.setPresence({ activity: { name: "AFK", type: "PLAYING" }, status: "idle", afk: true });
        const con = await pool.getConnection();
        try {
            client.guilds.cache.forEach(g => g.fetchInvites().then(guildInvites => storage.guilds[g.id].invites = guildInvites).catch(() => { }));
            const [r] = <[RowDataPacket[]]><unknown>await con.query("SELECT * FROM currency");
            for (const result of r) {
                try {
                    if (result.bank <= 0) continue;
                    const newBank = Math.round((Number(result.bank) * 1.02 + Number.EPSILON) * 100) / 100;
                    await con.query(`UPDATE currency SET bank = ${newBank} WHERE id = ${result.id}`);
                } catch (err) {
                    storage.error(err);
                }
            }
            var [results] = <[RowDataPacket[]]><unknown>await con.query("SELECT * FROM servers WHERE id <> '622311594654695434' AND id <> '819539026792808448'");
            results.forEach(async result => {
                storage.guilds[result.id] = {};
                if (result.queue || result.looping || result.repeating) {
                    var queue = [];
                    try { if (result.queue) queue = JSON.parse(unescape(result.queue)); }
                    catch (err) { storage.error(`Error parsing queue of ${result.id}`); }
                    setQueue(result.id, queue, !!result.looping, !!result.repeating, pool);
                }
                if (result.prefix) storage.guilds[result.id].prefix = result.prefix;
                else storage.guilds[result.id].prefix = client.prefix;
                storage.guilds[result.id].token = result.token;
                storage.guilds[result.id].giveaway = unescape(result.giveaway);
                storage.guilds[result.id].welcome = {
                    message: result.welcome,
                    channel: result.wel_channel,
                    image: result.wel_img,
                    autorole: result.autorole
                };
                storage.guilds[result.id].leave = {
                    message: result.leave_msg,
                    channel: result.leave_channel
                };
                storage.guilds[result.id].boost = {
                    message: result.boost_msg,
                    channel: result.boost_channel
                };
            });
            storage.log(`[${id}] Set ${results.length} configurations`);
            const [res] = <[RowDataPacket[]]><unknown>await con.query("SELECT * FROM rolemsg WHERE id <> '622311594654695434' AND id <> '819539026792808448' ORDER BY expiration");
            storage.log(`[${id}] ` + "Found " + res.length + " role messages.");
            storage.rm = res;
            res.forEach(async result => expire({ pool, client }, result.expiration - Date.now(), result.id));

            var [results] = <[RowDataPacket[]]><unknown>await con.query("SELECT * FROM giveaways WHERE id <> '622311594654695434' AND id <> '819539026792808448' ORDER BY endAt ASC");
            storage.log(`[${id}] ` + "Found " + results.length + " giveaways");
            results.forEach(async result => {
                var currentDate = Date.now();
                var millisec = result.endAt - currentDate;
                setTimeout_(async () => {
                    endGiveaway(pool, client, result);
                }, millisec);
            });
            var [results] = <[RowDataPacket[]]><unknown>await con.query("SELECT * FROM poll WHERE id <> '622311594654695434' AND id <> '819539026792808448' ORDER BY endAt ASC");
            storage.log(`[${id}] ` + "Found " + results.length + " polls.");
            results.forEach(result => {
                var currentDate = Date.now();
                var time = result.endAt - currentDate;
                setTimeout_(async () => {
                    try {
                        var channel = <TextChannel>await client.channels.fetch(result.channel);
                        var msg = await channel.messages.fetch(result.id);
                        if (msg.deleted) throw new Error("Deleted");
                    } catch (err) {
                        if (channel || (msg && msg.deleted)) {
                            await pool.query("DELETE FROM poll WHERE id = " + result.id);
                            return storage.log("Deleted an ended poll.");
                        }
                    }
                    const author = await client.users.fetch(result.author);
                    const allOptions = await JSON.parse(result.options);
                    const pollResult = [];
                    const end = [];
                    for (const emoji of msg.reactions.cache.values()) {
                        pollResult.push(emoji.count);
                        var mesg = `**${(emoji.count - 1)}** - \`${unescape(allOptions[pollResult.length - 1])}\``;
                        end.push(mesg);
                    }
                    const pollMsg = "⬆**Poll**⬇";
                    const Ended = new MessageEmbed()
                        .setColor(parseInt(result.color))
                        .setTitle(unescape(result.title))
                        .setDescription(`Poll ended. Here are the results:\n\n\n${end.join("\n\n").replace(/#quot;/g, "'").replace(/#dquot;/g, '"')}`)
                        .setTimestamp()
                        .setFooter("Hosted by " + author.tag, author.displayAvatarURL());
                    await msg.edit(pollMsg, Ended);
                    const link = `https://discord.com/channels/${msg.guild.id}/${msg.channel.id}/${msg.id}`;
                    await msg.channel.send("A poll has ended!\n" + link);
                    msg.reactions.removeAll().catch(() => { });
                    await pool.query("DELETE FROM poll WHERE id = " + result.id);
                    storage.log("Deleted an ended poll.");
                }, time);
            });
            var [results] = <[RowDataPacket[]]><unknown>await con.query("SELECT * FROM timer WHERE id <> '622311594654695434' AND id <> '819539026792808448'");
            storage.log(`[${id}] Found ${results.length} timers.`);
            results.forEach(async result => {
                let time = result.endAt - Date.now();
                let em = new MessageEmbed();
                try {
                    var channel = <TextChannel>await client.channels.fetch(result.channel);
                    var msg = await channel.messages.fetch(result.msg);
                    var author = await client.users.fetch(result.author);
                    var guild = client.guilds.resolve(result.guild);
                } catch (err) { return; }
                if (!channel) time = 0;
                if (!guild) time = 0;
                if (!msg) time = 0;
                else if (msg.author.id !== client.user.id) time = 0;
                else if (msg.embeds.length !== 1) time = 0;
                else if (!msg.embeds[0].color || !msg.embeds[0].title || !msg.embeds[0].timestamp || !msg.embeds[0].footer || !msg.embeds[0].description || msg.embeds[0].author || msg.embeds[0].fields.length !== 0 || msg.embeds[0].files.length !== 0 || msg.embeds[0].image || msg.embeds[0].thumbnail || msg.embeds[0].type != "rich") time = 0;
                if (msg.embeds[0].color && msg.embeds[0].title && msg.embeds[0].footer && msg.embeds[0].timestamp) em.setTitle(msg.embeds[0].title).setColor(msg.embeds[0].color).setFooter(msg.embeds[0].footer.text, msg.embeds[0].footer.iconURL).setTimestamp(msg.embeds[0].timestamp);
                let count = 0;
                let timerid = setInterval(async () => {
                    time -= 1000;
                    if (time <= 0) {
                        clearInterval(timerid);
                        em.setDescription("The timer has ended.");
                        msg = await msg.edit(em);
                        author.send(`Your timer in **${guild.name}** has ended! https://discord.com/channels/${guild.id}/${channel.id}/${msg.id}`);
                        const conn = await pool.getConnection();
                        try {
                            var [res] = <[RowDataPacket[]]><unknown>await conn.query(`SELECT * FROM timer WHERE guild = '${guild.id}' AND channel = '${channel.id}' AND author = '${author.id}' AND msg = '${msg.id}'`);
                            if (res.length < 1) return;
                            await conn.query(`DELETE FROM timer WHERE guild = '${guild.id}' AND channel = '${channel.id}' AND author = '${author.id}' AND msg = '${msg.id}'`);
                            return storage.log("Deleted a timed out timer from the database.");
                        } catch (err) {
                            storage.error(err);
                        }
                        conn.release();
                    }
                    if (count < 4) return count++;
                    em.setDescription(`(The timer updates every **5 seconds**)\nThis is a timer and it will last for\n**${readableDateTimeText(time)}**`);
                    msg = await msg.edit(em);
                    count = 0;
                }, 1000);
                storage.timers.set(result.msg, timerid);
            });
            var [results] = <[RowDataPacket[]]><unknown>await con.query("SELECT * FROM nolog");
            storage.noLog = results.map(x => x.id);
        } catch (err) { storage.error(err); };
        con.release();
    }
}