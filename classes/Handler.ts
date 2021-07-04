import { createCanvas, loadImage, Image } from "canvas";
import cleverbot from "cleverbot-free";
import { Guild, GuildMember, Message, MessageAttachment, MessageReaction, PartialGuildMember, PartialMessage, PartialUser, TextChannel, User, VoiceState } from "discord.js";
import moment from "moment";
require("moment-duration-format")(moment);
import { RowDataPacket } from "mysql2";
import { endGiveaway } from "../commands/miscellaneous/giveaway";
import { endPoll } from "../commands/miscellaneous/poll";
import { expire } from "../commands/managements/role-message";
import { getRandomNumber, jsDate2Mysql, replaceMsgContent, setTimeout_ } from "../function";
import { setQueue, stop } from "../helpers/music";
import { NorthClient, LevelData, NorthMessage } from "./NorthClient";
import slash from "../helpers/slash";
import { Connection } from "mysql2/promise";
const fetch = require("fetch-retry")(require("node-fetch"), { retries: 5, retryDelay: (attempt: number) => Math.pow(2, attempt) * 1000 });
const filter = require("../helpers/filter");

export class Handler {
    static setup(client: NorthClient) {
        new Handler(client);
    }

    constructor(client: NorthClient) {
        client.once("ready", () => this.ready(client));
        client.on("guildMemberAdd", member => this.guildMemberAdd(member));
        client.on("guildMemberRemove", member => this.guildMemberRemove(member));
        client.on("guildCreate", guild => this.guildCreate(guild));
        client.on("guildDelete", guild => this.guildDelete(guild));
        client.on("voiceStateUpdate", (oldState, newState) => this.voiceStateUpdate(oldState, newState));
        client.on("guildMemberUpdate", (oldMember, newMember) => this.guildMemberUpdate(oldMember, newMember));
        client.on("messageReactionAdd", (reaction, user) => this.messageReactionAdd(reaction, user));
        client.on("messageReactionRemove", (reaction, user) => this.messageReactionRemove(reaction, user));
        client.on("messageDelete", message => this.messageDelete(message));
        client.on("message", message => this.message(message));
    }

    async messageLevel(message: Message) {
        const storage = NorthClient.storage;
        if (!message || !message.author || !message.author.id || !message.guild || message.author.bot) return;
        const exp = Math.round(getRandomNumber(5, 15) * (1 + message.content.length / 100));
        const sqlDate = jsDate2Mysql(new Date());
        storage.queries.push(new LevelData(message.author.id, message.guild.id, exp, sqlDate));
    }

    async preReady(client: NorthClient) {
        await slash(client);
        client.guilds.cache.forEach(g => g.fetchInvites().then(guildInvites => NorthClient.storage.guilds[g.id].invites = guildInvites).catch(() => { }));
    }

    async preRead(_client: NorthClient, _con: Connection) { }

    async setPresence(client: NorthClient) {
        client.user.setPresence({ activity: { name: "AFK", type: "PLAYING" }, status: "idle", afk: true });
    }

    async readCurrency(_client: NorthClient, con: Connection) {
        const [r] = <[RowDataPacket[]]><unknown>await con.query("SELECT * FROM currency");
        for (const result of r) {
            try {
                if (result.bank <= 0) continue;
                const newBank = Math.round((Number(result.bank) * 1.02 + Number.EPSILON) * 100) / 100;
                await con.query(`UPDATE currency SET bank = ${newBank} WHERE id = ${result.id}`);
            } catch (err) {
                NorthClient.storage.error(err);
            }
        }
    }

    async readServers(client: NorthClient, con: Connection) {
        const storage = NorthClient.storage;
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
                setQueue(result.id, queue, !!result.looping, !!result.repeating, client.pool);
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
        storage.log(`[${client.id}] Set ${results.length} configurations`);
    }

    async readRoleMsg(client: NorthClient, con: Connection) {
        const storage = NorthClient.storage
        const [res] = <[RowDataPacket[]]><unknown>await con.query("SELECT * FROM rolemsg WHERE guild <> '622311594654695434' AND guild <> '819539026792808448' ORDER BY expiration");
        storage.log(`[${client.id}] ` + "Found " + res.length + " role messages.");
        storage.rm = res;
        res.forEach(async result => expire({ pool: client.pool, client }, result.expiration - Date.now(), result.id));
    }

    async readGiveaways(client: NorthClient, con: Connection) {
        var [results] = <[RowDataPacket[]]><unknown>await con.query("SELECT * FROM giveaways WHERE guild <> '622311594654695434' AND guild <> '819539026792808448' ORDER BY endAt ASC");
        NorthClient.storage.log(`[${client.id}] ` + "Found " + results.length + " giveaways");
        results.forEach(async result => {
            var currentDate = Date.now();
            var millisec = result.endAt - currentDate;
            setTimeout_(async () => {
                endGiveaway(client.pool, client, result);
            }, millisec);
        });
    }

    async readPoll(client: NorthClient, con: Connection) {
        var [results] = <[RowDataPacket[]]><unknown>await con.query("SELECT * FROM poll WHERE guild <> '622311594654695434' AND guild <> '819539026792808448' ORDER BY endAt ASC");
        NorthClient.storage.log(`[${client.id}] ` + "Found " + results.length + " polls.");
        results.forEach(result => {
            var currentDate = Date.now();
            var time = result.endAt - currentDate;
            setTimeout_(async () => {
                try {
                    var channel = <TextChannel>await client.channels.fetch(result.channel);
                    var msg = await channel.messages.fetch(result.id);
                    if (msg.deleted) throw new Error("Deleted");
                } catch (err) {
                    await client.pool.query("DELETE FROM poll WHERE id = " + result.id);
                    return NorthClient.storage.log("Deleted an ended poll.");
                }
                await endPoll(client, con, result.id, msg, null, result.title, result.author, result.options, result.color);
            }, time);
        });
    }

    async readNoLog(_client: NorthClient, con: Connection) {
        var [results] = <[RowDataPacket[]]><unknown>await con.query("SELECT * FROM nolog");
        NorthClient.storage.noLog = results.map(x => x.id);
    }

    async ready(client: NorthClient) {
        this.preReady(client);
        const storage = NorthClient.storage;
        const pool = client.pool;
        const id = client.id;
        storage.log(`[${id}] Ready!`);
        this.setPresence(client);
        const con = await pool.getConnection();
        try {
            await this.preRead(client, con);
            await this.readCurrency(client, con);
            await this.readServers(client, con);
            await this.readRoleMsg(client, con);
            await this.readGiveaways(client, con);
            await this.readPoll(client, con);
            await this.readNoLog(client, con);
        } catch (err) { storage.error(err); };
        con.release();
    }

    async preWelcomeImage(_channel: TextChannel) { }

    async guildMemberAdd(member: GuildMember) {
        const client = (member.client as NorthClient);
        const storage = NorthClient.storage;
        const guild = member.guild;
        const pool = client.pool;
        if (member.user.bot) return;
        guild.fetchInvites().then(async guildInvites => {
            const ei = storage.guilds[member.guild.id].invites;
            storage.guilds[member.guild.id].invites = guildInvites;
            const invite = guildInvites.find(i => !ei.get(i.code) || ei.get(i.code).uses < i.uses);
            if (!invite) return;
            const inviter = await client.users.fetch(invite.inviter.id);
            if (!inviter) return;
            const allUserInvites = guildInvites.filter(i => i.inviter.id === inviter.id && i.guild.id === guild.id);
            const reducer = (a: number, b: number) => a + b;
            const uses = allUserInvites.map(i => i.uses ? i.uses : 0).reduce(reducer);
            if (storage.noLog.find(x => x === inviter.id)) return;
            try {
                await inviter.send(`You invited **${member.user.tag}** to the server **${guild.name}**! In total, you have now invited **${uses} users** to the server!\n(If you want to disable this message, use \`${client.prefix}invites toggle\` to turn it off)`);
            } catch (err) { }
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
                            await this.preWelcomeImage(channel);
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

    async guildMemberRemove(member: GuildMember | PartialGuildMember) {
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

    async guildCreate(guild: Guild) {
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

    async guildDelete(guild: Guild) {
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

    async voiceStateUpdate(oldState: VoiceState, newState: VoiceState) {
        const guild = oldState.guild || newState.guild;
        const client = <NorthClient>guild.client;
        const storage = NorthClient.storage;
        const exit = storage.guilds[guild.id]?.exit;
        if ((oldState.id == guild.me.id || newState.id == guild.me.id) && (!guild.me.voice?.channel)) return await stop(guild);
        if (!guild.me.voice?.channel || (newState.channelID !== guild.me.voice.channelID && oldState.channelID !== guild.me.voice.channelID)) return;
        if (!storage.guilds[guild.id]) {
            await client.pool.query(`INSERT INTO servers (id, autorole, giveaway) VALUES ('${guild.id}', '[]', '${escape("🎉")}')`);
            storage.guilds[guild.id] = {};
            storage.log("Inserted record for " + guild.name);
        }
        if (guild.me.voice.channel.members.size <= 1) {
            if (exit) return;
            storage.guilds[guild.id].exit = true;
            setTimeout(() => storage.guilds[guild.id]?.exit ? stop(guild) : 0, 30000);
        } else storage.guilds[guild.id].exit = false;
    }

    async guildMemberUpdate(oldMember: GuildMember | PartialGuildMember, newMember: GuildMember) {
        const client = <NorthClient>(oldMember.client || newMember.client);
        const storage = NorthClient.storage;
        if (oldMember.premiumSinceTimestamp || !newMember.premiumSinceTimestamp) return;
        const boost = storage.guilds[newMember.guild.id]?.boost;
        if (!boost?.channel || !boost.message) return;
        try {
            const channel = <TextChannel>await client.channels.fetch(boost.channel);
            channel.send(boost.message.replace(/\{user\}/gi, `<@${newMember.id}>`));
        } catch (err) { }
    }

    async messageReactionAdd(r: MessageReaction, user: User | PartialUser) {
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

    async messageReactionRemove(r: MessageReaction, user: User | PartialUser) {
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

    async messageDelete(message: Message | PartialMessage) {
        const client = <NorthClient>message.client;
        const storage = NorthClient.storage;
        var roleMessage = storage.rm.find(x => x.id === message.id);
        if (!roleMessage) return;
        storage.rm.splice(storage.rm.indexOf(roleMessage), 1);
        await client.pool.query(`DELETE FROM rolemsg WHERE id = '${message.id}'`);
    }

    async preMessage(_message: Message): Promise<any> {

    }

    async message(message: Message) {
        await this.preMessage(message);
        const client = <NorthClient>message.client;
        const storage = NorthClient.storage;
        const msg = (<NorthMessage>message);
        msg.prefix = client.prefix;
        if (msg.guild && storage.guilds[msg.guild.id]?.prefix) msg.prefix = storage.guilds[msg.guild.id].prefix;
        this.messageLevel(msg);
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
            if (await filter.all(command, msg, args) && (catFilter ? await catFilter(command, msg) : true)) await command.execute(msg, args);
        } catch (error) {
            storage.error(command.name + ": " + error);
            await msg.reply("there was an error trying to execute that command!\nIf it still doesn't work after a few tries, please contact NorthWestWind or report it on the support server.");
        }
    }
}

export class CanaryHandler extends Handler {
    static setup(client: NorthClient) {
        new CanaryHandler(client);
    }

    constructor(client: NorthClient) {
        super(client);
    }

    async readServers(client: NorthClient, con: Connection) {
        const storage = NorthClient.storage;
        var [results] = <[RowDataPacket[]]><unknown>await con.query("SELECT * FROM servers WHERE id <> '622311594654695434' AND id <> '819539026792808448'");
        results.forEach(async result => {
            storage.guilds[result.id] = {};
            if (result.queue || result.looping || result.repeating) {
                var queue = [];
                try { if (result.queue) queue = JSON.parse(unescape(result.queue)); }
                catch (err) { storage.error(`Error parsing queue of ${result.id}`); }
                setQueue(result.id, queue, !!result.looping, !!result.repeating, client.pool);
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
        storage.log(`[${client.id}] Set ${results.length} configurations`);
    }
}