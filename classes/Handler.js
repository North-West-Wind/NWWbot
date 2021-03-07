"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CanaryHandler = exports.AliceHandler = exports.Handler = void 0;
const canvas_1 = require("canvas");
const cleverbot_free_1 = __importDefault(require("cleverbot-free"));
const discord_js_1 = require("discord.js");
const moment_1 = __importDefault(require("moment"));
require("moment-duration-format")(moment_1.default);
const giveaway_1 = require("../commands/giveaway");
const role_message_1 = require("../commands/role-message");
const function_1 = require("../function");
const main_1 = require("../musics/main");
const LevelData_1 = require("./LevelData");
const NorthClient_1 = require("./NorthClient");
const main_2 = require("../musics/main");
var timeout;
class Handler {
    static messageLevel(message) {
        return __awaiter(this, void 0, void 0, function* () {
            const storage = NorthClient_1.NorthClient.storage;
            if (!message || !message.author || !message.author.id || !message.guild || message.author.bot)
                return;
            const exp = Math.round(function_1.getRandomNumber(5, 15) * (1 + message.content.length / 100));
            const sqlDate = function_1.jsDate2Mysql(new Date());
            storage.queries.push(new LevelData_1.LevelData(message.author.id, message.guild.id, exp, sqlDate));
        });
    }
    static setup(client) {
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
    static ready(client) {
        return __awaiter(this, void 0, void 0, function* () {
            const storage = NorthClient_1.NorthClient.storage;
            const pool = client.pool;
            const id = client.id;
            storage.log(`[${id}] Ready!`);
            client.user.setPresence({ activity: { name: "AFK", type: "PLAYING" }, status: "idle", afk: true });
            const con = yield pool.getConnection();
            try {
                client.guilds.cache.forEach(g => g.fetchInvites().then(guildInvites => storage.guilds[g.id].invites = guildInvites).catch(() => { }));
                const [r] = yield con.query("SELECT * FROM currency");
                for (const result of r) {
                    try {
                        if (result.bank <= 0)
                            continue;
                        const newBank = Math.round((Number(result.bank) * 1.02 + Number.EPSILON) * 100) / 100;
                        yield con.query(`UPDATE currency SET bank = ${newBank} WHERE id = ${result.id}`);
                    }
                    catch (err) {
                        storage.error(err);
                    }
                }
                var [results] = yield con.query("SELECT * FROM servers WHERE id <> '622311594654695434'");
                results.forEach((result) => __awaiter(this, void 0, void 0, function* () {
                    storage.guilds[result.id] = {};
                    try {
                        yield client.guilds.fetch(result.id);
                    }
                    catch (err) {
                        yield con.query(`DELETE FROM servers WHERE id = '${result.id}'`);
                        return storage.log("Removed left servers");
                    }
                    if (result.queue || result.looping || result.repeating) {
                        var queue = [];
                        try {
                            if (result.queue)
                                queue = JSON.parse(unescape(result.queue));
                        }
                        catch (err) {
                            storage.error(`Error parsing queue of ${result.id}`);
                        }
                        main_1.setQueue(result.id, queue, !!result.looping, !!result.repeating, pool);
                    }
                    if (result.prefix)
                        storage.guilds[result.id].prefix = result.prefix;
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
                }));
                storage.log(`[${id}] Set ${results.length} configurations`);
                const [res] = yield con.query("SELECT * FROM rolemsg WHERE id <> '622311594654695434' ORDER BY expiration");
                storage.log(`[${id}] ` + "Found " + res.length + " role messages.");
                storage.rm = res;
                res.forEach((result) => __awaiter(this, void 0, void 0, function* () { return role_message_1.expire({ pool, client }, result.expiration - Date.now(), result.id); }));
                var [results] = yield con.query("SELECT * FROM giveaways WHERE id <> '622311594654695434' ORDER BY endAt ASC");
                storage.log(`[${id}] ` + "Found " + results.length + " giveaways");
                results.forEach((result) => __awaiter(this, void 0, void 0, function* () {
                    var currentDate = Date.now();
                    var millisec = result.endAt - currentDate;
                    function_1.setTimeout_(() => __awaiter(this, void 0, void 0, function* () {
                        giveaway_1.endGiveaway(pool, client, result);
                    }), millisec);
                }));
                var [results] = yield con.query("SELECT * FROM poll WHERE id <> '622311594654695434' ORDER BY endAt ASC");
                storage.log(`[${id}] ` + "Found " + results.length + " polls.");
                results.forEach(result => {
                    var currentDate = Date.now();
                    var time = result.endAt - currentDate;
                    function_1.setTimeout_(() => __awaiter(this, void 0, void 0, function* () {
                        try {
                            var channel = yield client.channels.fetch(result.channel);
                            var msg = yield channel.messages.fetch(result.id);
                            if (msg.deleted)
                                throw new Error("Deleted");
                        }
                        catch (err) {
                            if (channel || (msg && msg.deleted)) {
                                yield pool.query("DELETE FROM poll WHERE id = " + result.id);
                                return storage.log("Deleted an ended poll.");
                            }
                        }
                        const author = yield client.users.fetch(result.author);
                        const allOptions = yield JSON.parse(result.options);
                        const pollResult = [];
                        const end = [];
                        for (const emoji of msg.reactions.cache.values()) {
                            pollResult.push(emoji.count);
                            var mesg = `**${(emoji.count - 1)}** - \`${unescape(allOptions[pollResult.length - 1])}\``;
                            end.push(mesg);
                        }
                        const pollMsg = "⬆**Poll**⬇";
                        const Ended = new discord_js_1.MessageEmbed()
                            .setColor(parseInt(result.color))
                            .setTitle(unescape(result.title))
                            .setDescription(`Poll ended. Here are the results:\n\n\n${end.join("\n\n").replace(/#quot;/g, "'").replace(/#dquot;/g, '"')}`)
                            .setTimestamp()
                            .setFooter("Hosted by " + author.tag, author.displayAvatarURL());
                        yield msg.edit(pollMsg, Ended);
                        const link = `https://discord.com/channels/${msg.guild.id}/${msg.channel.id}/${msg.id}`;
                        yield msg.channel.send("A poll has ended!\n" + link);
                        msg.reactions.removeAll().catch(() => { });
                        yield pool.query("DELETE FROM poll WHERE id = " + result.id);
                        storage.log("Deleted an ended poll.");
                    }), time);
                });
                var [results] = yield con.query("SELECT * FROM timer WHERE id <> '622311594654695434'");
                storage.log(`[${id}] Found ${results.length} timers.`);
                results.forEach((result) => __awaiter(this, void 0, void 0, function* () {
                    let time = result.endAt - Date.now();
                    let em = new discord_js_1.MessageEmbed();
                    try {
                        var channel = yield client.channels.fetch(result.channel);
                        var msg = yield channel.messages.fetch(result.msg);
                        var author = yield client.users.fetch(result.author);
                        var guild = client.guilds.resolve(result.guild);
                    }
                    catch (err) {
                        return;
                    }
                    if (!channel)
                        time = 0;
                    if (!guild)
                        time = 0;
                    if (!msg)
                        time = 0;
                    else if (msg.author.id !== client.user.id)
                        time = 0;
                    else if (msg.embeds.length !== 1)
                        time = 0;
                    else if (!msg.embeds[0].color || !msg.embeds[0].title || !msg.embeds[0].timestamp || !msg.embeds[0].footer || !msg.embeds[0].description || msg.embeds[0].author || msg.embeds[0].fields.length !== 0 || msg.embeds[0].files.length !== 0 || msg.embeds[0].image || msg.embeds[0].thumbnail || msg.embeds[0].type != "rich")
                        time = 0;
                    if (msg.embeds[0].color && msg.embeds[0].title && msg.embeds[0].footer && msg.embeds[0].timestamp)
                        em.setTitle(msg.embeds[0].title).setColor(msg.embeds[0].color).setFooter(msg.embeds[0].footer.text, msg.embeds[0].footer.iconURL).setTimestamp(msg.embeds[0].timestamp);
                    let count = 0;
                    let timerid = setInterval(() => __awaiter(this, void 0, void 0, function* () {
                        time -= 1000;
                        if (time <= 0) {
                            clearInterval(timerid);
                            em.setDescription("The timer has ended.");
                            msg = yield msg.edit(em);
                            author.send(`Your timer in **${guild.name}** has ended! https://discord.com/channels/${guild.id}/${channel.id}/${msg.id}`);
                            const conn = yield pool.getConnection();
                            try {
                                var [res] = yield conn.query(`SELECT * FROM timer WHERE guild = '${guild.id}' AND channel = '${channel.id}' AND author = '${author.id}' AND msg = '${msg.id}'`);
                                if (res.length < 1)
                                    return;
                                yield conn.query(`DELETE FROM timer WHERE guild = '${guild.id}' AND channel = '${channel.id}' AND author = '${author.id}' AND msg = '${msg.id}'`);
                                return storage.log("Deleted a timed out timer from the database.");
                            }
                            catch (err) {
                                storage.error(err);
                            }
                            conn.release();
                        }
                        if (count < 4)
                            return count++;
                        em.setDescription(`(The timer updates every **5 seconds**)\nThis is a timer and it will last for\n**${function_1.readableDateTimeText(time)}**`);
                        msg = yield msg.edit(em);
                        count = 0;
                    }), 1000);
                    storage.timers.set(result.msg, timerid);
                }));
                var [results] = yield con.query("SELECT * FROM nolog");
                storage.noLog = results.map(x => x.id);
            }
            catch (err) {
                storage.error(err);
            }
            ;
            con.release();
        });
    }
    static guildMemberAdd(member) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const client = member.client;
            const storage = NorthClient_1.NorthClient.storage;
            const guild = member.guild;
            const pool = client.pool;
            if (member.user.bot)
                return;
            guild.fetchInvites().then((guildInvites) => __awaiter(this, void 0, void 0, function* () {
                const ei = storage.guilds[member.guild.id].invites;
                storage.guilds[member.guild.id].invites = guildInvites;
                const invite = yield guildInvites.find(i => !ei.get(i.code) || ei.get(i.code).uses < i.uses);
                if (!invite)
                    return;
                const inviter = yield client.users.fetch(invite.inviter.id);
                if (!inviter)
                    return;
                const allUserInvites = yield guildInvites.filter(i => i.inviter.id === inviter.id && i.guild.id === guild.id);
                const reducer = (a, b) => a + b;
                const uses = yield allUserInvites.map(i => i.uses ? i.uses : 0).reduce(reducer);
                if (storage.noLog.find(x => x === inviter.id))
                    return;
                try {
                    storage.log(`${inviter.tag} invited ${member.user.tag} to ${guild.name}. ${uses} in total.`);
                    yield inviter.send(`You invited **${member.user.tag}** to the server **${guild.name}**! In total, you have now invited **${uses} users** to the server!\n(If you want to disable this message, use \`${client.prefix}invites toggle\` to turn it off)`);
                }
                catch (err) {
                    storage.error("Failed to DM user.");
                }
            })).catch(() => { });
            try {
                const welcome = (_a = storage.guilds[guild.id]) === null || _a === void 0 ? void 0 : _a.welcome;
                if (!(welcome === null || welcome === void 0 ? void 0 : welcome.channel)) {
                    if (storage.guilds[guild.id])
                        return;
                    yield pool.query(`INSERT INTO servers (id, autorole, giveaway) VALUES ('${guild.id}', '[]', '${escape("🎉")}')`);
                    storage.guilds[guild.id] = {};
                    storage.log("Inserted record for " + guild.name);
                }
                else {
                    if (!welcome.channel)
                        return;
                    const channel = guild.channels.resolve(welcome.channel);
                    if (!channel || !channel.permissionsFor(guild.me).has(18432))
                        return;
                    if (welcome.message)
                        try {
                            const welcomeMessage = function_1.replaceMsgContent(welcome.message, guild, client, member, "welcome");
                            yield channel.send(welcomeMessage);
                        }
                        catch (err) {
                            storage.error(err);
                        }
                    if (welcome.image) {
                        var img = new canvas_1.Image();
                        img.onload = () => __awaiter(this, void 0, void 0, function* () {
                            var height = img.height;
                            var width = img.width;
                            const canvas = canvas_1.createCanvas(width, height);
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
                            const avatar = yield canvas_1.loadImage(member.user.displayAvatarURL({ format: "png" }));
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
                            var attachment = new discord_js_1.MessageAttachment(canvas.toBuffer(), "welcome-image.png");
                            try {
                                yield channel.send(attachment);
                            }
                            catch (err) {
                                storage.error(err);
                            }
                        });
                        var url = welcome.image;
                        try {
                            let urls = JSON.parse(welcome.image);
                            if (Array.isArray(urls))
                                url = urls[Math.floor(Math.random() * urls.length)];
                        }
                        catch (err) { }
                        img.src = url;
                    }
                }
                if (welcome && welcome.autorole !== "[]") {
                    const roleArray = JSON.parse(welcome.autorole);
                    for (var i = 0; i < roleArray.length; i++) {
                        const roleID = roleArray[i];
                        var role = undefined;
                        if (isNaN(parseInt(roleID)))
                            role = yield guild.roles.cache.find(x => x.name === roleID);
                        else
                            role = yield guild.roles.fetch(roleID);
                        if (!role)
                            continue;
                        try {
                            yield member.roles.add(roleID);
                            storage.log(`Added ${member.displayName} to ${role.name}`);
                        }
                        catch (err) {
                            storage.error(err);
                        }
                    }
                }
            }
            catch (err) {
                storage.error(err);
            }
            ;
        });
    }
    static guildMemberRemove(member) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const client = member.client;
            const guild = member.guild;
            const storage = NorthClient_1.NorthClient.storage;
            try {
                const leave = (_a = storage.guilds[guild.id]) === null || _a === void 0 ? void 0 : _a.leave;
                if (!(leave === null || leave === void 0 ? void 0 : leave.channel)) {
                    if (storage.guilds[guild.id])
                        return;
                    yield client.pool.query(`INSERT INTO servers (id, autorole, giveaway) VALUES ('${guild.id}', '[]', '${escape("🎉")}')`);
                    storage.guilds[guild.id] = {};
                    storage.log("Inserted record for " + guild.name);
                }
                else {
                    if (guild.me.hasPermission(128)) {
                        const fetchedLogs = yield guild.fetchAuditLogs({ limit: 1, type: 'MEMBER_KICK' });
                        const kickLog = fetchedLogs.entries.first();
                        if (kickLog && kickLog.target.id === member.user.id && kickLog.executor.id !== kickLog.target.id)
                            return;
                    }
                    else
                        storage.log("Can't view audit logs of " + guild.name);
                    const channel = guild.channels.resolve(leave.channel);
                    if (!channel || !channel.permissionsFor(guild.me).has(18432))
                        return;
                    if (!leave.message)
                        return;
                    try {
                        const leaveMessage = function_1.replaceMsgContent(leave.message, guild, client, member, "leave");
                        yield channel.send(leaveMessage);
                    }
                    catch (err) {
                        storage.error(err);
                    }
                }
            }
            catch (err) {
                storage.error(err);
            }
            ;
        });
    }
    static guildCreate(guild) {
        return __awaiter(this, void 0, void 0, function* () {
            const client = guild.client;
            const storage = NorthClient_1.NorthClient.storage;
            storage.log("Joined a new guild: " + guild.name);
            try {
                storage.guilds[guild.id].invites = yield guild.fetchInvites();
            }
            catch (err) { }
            try {
                const con = yield client.pool.getConnection();
                const [result] = yield con.query("SELECT * FROM servers WHERE id = " + guild.id);
                if (result.length > 0)
                    storage.log("Found row inserted for this server before. Cancelling row insert...");
                else {
                    yield con.query(`INSERT INTO servers (id, autorole, giveaway) VALUES ('${guild.id}', '[]', '${escape("🎉")}')`);
                    storage.guilds[guild.id] = {};
                    storage.log("Inserted record for " + guild.name);
                }
                con.release();
            }
            catch (err) {
                storage.error(err);
            }
        });
    }
    static guildDelete(guild) {
        return __awaiter(this, void 0, void 0, function* () {
            const client = guild.client;
            const storage = NorthClient_1.NorthClient.storage;
            storage.log("Left a guild: " + guild.name);
            delete storage.guilds[guild.id];
            try {
                yield client.pool.query("DELETE FROM servers WHERE id=" + guild.id);
                storage.log("Deleted record for " + guild.name);
            }
            catch (err) {
                storage.error(err);
            }
        });
    }
    static voiceStateUpdate(oldState, newState) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            const guild = oldState.guild || newState.guild;
            const client = guild.client;
            const storage = NorthClient_1.NorthClient.storage;
            const exit = (_a = storage.guilds[guild.id]) === null || _a === void 0 ? void 0 : _a.exit;
            if ((oldState.id == guild.me.id || newState.id == guild.me.id) && (!guild.me.voice || !guild.me.voice.channel))
                return yield main_2.stop(guild);
            if (!((_b = guild.me.voice) === null || _b === void 0 ? void 0 : _b.channel) || (newState.channelID !== guild.me.voice.channelID && oldState.channelID !== guild.me.voice.channelID))
                return;
            if (!storage.guilds[guild.id]) {
                yield client.pool.query(`INSERT INTO servers (id, autorole, giveaway) VALUES ('${guild.id}', '[]', '${escape("🎉")}')`);
                storage.guilds[guild.id] = {};
                storage.log("Inserted record for " + guild.name);
            }
            if (guild.me.voice.channel.members.size <= 1) {
                if (exit)
                    return;
                storage.guilds[guild.id].exit = true;
                setTimeout(() => __awaiter(this, void 0, void 0, function* () { return exit ? main_2.stop(guild) : 0; }), 30000);
            }
            else
                storage.guilds[guild.id].exit = false;
        });
    }
    static guildMemberUpdate(oldMember, newMember) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const client = (oldMember.client || newMember.client);
            const storage = NorthClient_1.NorthClient.storage;
            if (client.id == 1 && oldMember.displayName !== newMember.displayName) {
                const [results] = yield client.pool.query(`SELECT uuid FROM dcmc WHERE dcid = '${newMember.id}'`);
                if (results.length == 1) {
                    const { name } = yield function_1.profile(results[0].uuid);
                    const mcLen = name.length + 3;
                    var nickname = newMember.displayName;
                    const matches = nickname.match(/ \[\w+\]$/);
                    if (matches)
                        nickname = nickname.replace(matches[0], "");
                    if (nickname.length + mcLen > 32)
                        yield newMember.setNickname(`${nickname.slice(0, 29 - mcLen)}... [${name}]`);
                    else
                        yield newMember.setNickname(`${nickname} [${name}]`);
                }
            }
            if (oldMember.premiumSinceTimestamp || !newMember.premiumSinceTimestamp)
                return;
            const boost = (_a = storage.guilds[newMember.guild.id]) === null || _a === void 0 ? void 0 : _a.boost;
            if (!(boost === null || boost === void 0 ? void 0 : boost.channel) || !boost.message)
                return;
            try {
                const channel = yield client.channels.fetch(boost.channel);
                channel.send(boost.message.replace(/\{user\}/gi, `<@${newMember.id}>`));
            }
            catch (err) { }
        });
    }
    static messageReactionAdd(r, user) {
        return __awaiter(this, void 0, void 0, function* () {
            const storage = NorthClient_1.NorthClient.storage;
            var roleMessage = storage.rm.find(x => x.id == r.message.id);
            if (!roleMessage)
                return;
            const emojis = JSON.parse(roleMessage.emojis);
            var index = -1;
            if (emojis.includes(r.emoji.id))
                index = emojis.indexOf(r.emoji.id);
            else if (emojis.includes(r.emoji.name))
                index = emojis.indexOf(r.emoji.name);
            else
                return;
            try {
                const guild = yield user.client.guilds.fetch(roleMessage.guild);
                const member = yield guild.members.fetch(user.id);
                if (index > -1)
                    yield member.roles.add(JSON.parse(roleMessage.roles)[index]);
            }
            catch (err) {
                storage.error(err);
            }
        });
    }
    static messageReactionRemove(r, user) {
        return __awaiter(this, void 0, void 0, function* () {
            const storage = NorthClient_1.NorthClient.storage;
            var roleMessage = storage.rm.find(x => x.id == r.message.id);
            if (!roleMessage)
                return;
            const emojis = JSON.parse(roleMessage.emojis);
            var index = -1;
            if (emojis.includes(r.emoji.id))
                index = emojis.indexOf(r.emoji.id);
            else if (emojis.includes(r.emoji.name))
                index = emojis.indexOf(r.emoji.name);
            else
                return;
            try {
                const guild = yield r.client.guilds.fetch(roleMessage.guild);
                const member = yield guild.members.fetch(user.id);
                if (index > -1)
                    yield member.roles.remove(JSON.parse(roleMessage.roles)[index]);
            }
            catch (err) {
                storage.error(err);
            }
        });
    }
    static messageDelete(message) {
        return __awaiter(this, void 0, void 0, function* () {
            const client = message.client;
            const storage = NorthClient_1.NorthClient.storage;
            var roleMessage = storage.rm.find(x => x.id === message.id);
            if (!roleMessage)
                return;
            storage.rm.splice(storage.rm.indexOf(roleMessage), 1);
            yield client.pool.query(`DELETE FROM rolemsg WHERE id = '${message.id}'`);
        });
    }
    static message(message) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const client = message.client;
            const storage = NorthClient_1.NorthClient.storage;
            const msg = message;
            msg.prefix = client.prefix;
            if (msg.guild && ((_a = storage.guilds[msg.guild.id]) === null || _a === void 0 ? void 0 : _a.prefix))
                msg.prefix = storage.guilds[msg.guild.id].prefix;
            Handler.messageLevel(msg);
            const args = msg.content.slice(msg.prefix.length).split(/ +/);
            if (!msg.content.startsWith(msg.prefix) || msg.author.bot) {
                if (!msg.author.bot && Math.floor(Math.random() * 1000) === 69)
                    cleverbot_free_1.default(msg.content).then(response => msg.channel.send(response));
                return;
            }
            ;
            const commandName = args.shift().toLowerCase();
            if (commandName === "guild")
                return;
            const command = storage.commands.get(commandName) || storage.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
            if (!command)
                return;
            if (command.args && args.length < command.args)
                return msg.channel.send(`The command \`${msg.prefix}${commandName}\` requires ${command.args} arguments.\nHere's how you are supposed to use it: \`${msg.prefix}${command.name}${command.usage ? ` ${command.usage}` : ""}\``);
            if (command.category === 10 && msg.author.id != process.env.DC)
                return yield msg.channel.send("Please don't use Dev Commands.");
            if (timeout) {
                clearTimeout(timeout);
                timeout = undefined;
            }
            else
                msg.client.user.setPresence({ activity: { name: `${msg.author.username}'s Commands`, type: "WATCHING" }, status: "online", afk: false });
            timeout = setTimeout(() => {
                msg.client.user.setPresence({ activity: { name: "AFK", type: "PLAYING" }, status: "idle", afk: true });
                timeout = undefined;
            }, 10000);
            if (msg.guild && !msg.channel.permissionsFor(msg.guild.me).has(84992))
                return yield msg.author.send(`I need at least the permissions to \`${new discord_js_1.Permissions(84992).toArray().join("`, `")}\` in order to run any command! Please tell your server administrator about that.`);
            msg.pool = client.pool;
            try {
                if (command.category === 8)
                    yield main_1.music(msg, commandName);
                else
                    yield command.execute(msg, args);
            }
            catch (error) {
                storage.error(`Error running command ${command.name}`);
                if (command.name === "musescore")
                    storage.error(`Arguments: ${args.join(" ")}`);
                storage.error(error);
                msg.reply("there was an error trying to execute that command!\nIf it still doesn't work after a few tries, please contact NorthWestWind or report it on the support server.");
            }
        });
    }
}
exports.Handler = Handler;
class AliceHandler extends Handler {
    static ready(client) {
        return __awaiter(this, void 0, void 0, function* () {
            const id = client.id;
            const storage = NorthClient_1.NorthClient.storage;
            const pool = client.pool;
            storage.log(`[${id}] Ready!`);
            client.user.setActivity("Sword Art Online Alicization", { type: "LISTENING" });
            const con = yield client.pool.getConnection();
            try {
                client.guilds.cache.forEach(g => g.fetchInvites().then(guildInvites => storage.guilds[g.id].invites = guildInvites).catch(() => { }));
                const [res] = yield con.query(`SELECT * FROM gtimer ORDER BY endAt ASC`);
                storage.log(`[${id}] Found ${res.length} guild timers`);
                res.forEach((result) => __awaiter(this, void 0, void 0, function* () {
                    let endAfter = result.endAt.getTime() - Date.now();
                    let mc = yield function_1.profile(result.mc);
                    let username = "undefined";
                    if (mc)
                        username = mc.name;
                    let dc = `<@${result.user}>`;
                    let rank = unescape(result.dc_rank);
                    let title = `${dc} - ${rank} [${username}]`;
                    function_1.setTimeout_(() => __awaiter(this, void 0, void 0, function* () {
                        let asuna = yield client.users.fetch("461516729047318529");
                        const conn = yield pool.getConnection();
                        try {
                            const [results] = yield conn.query(`SELECT id FROM gtimer WHERE user = '${result.user}' AND mc = '${result.mc}' AND dc_rank = '${result.dc_rank}'`);
                            if (results.length == 0)
                                return;
                            try {
                                asuna.send(title + " expired");
                                var user = yield client.users.fetch(result.user);
                                user.send(`Your rank **${rank}** in War of Underworld has expired.`);
                            }
                            catch (err) {
                                storage.error("Failed to DM user");
                            }
                            yield conn.query(`DELETE FROM gtimer WHERE user = '${result.user}' AND mc = '${result.mc}' AND dc_rank = '${result.dc_rank}'`);
                            storage.log("A guild timer expired.");
                        }
                        catch (err) {
                            storage.error(err);
                        }
                        conn.release();
                    }), endAfter);
                }));
                const [gtimers] = yield pool.query(`SELECT * FROM gtimer ORDER BY endAt ASC`);
                storage.gtimers = gtimers;
                setInterval(() => __awaiter(this, void 0, void 0, function* () {
                    try {
                        var timerChannel = yield client.channels.fetch(process.env.TIME_LIST_CHANNEL);
                        var timerMsg = yield timerChannel.messages.fetch(process.env.TIME_LIST_ID);
                    }
                    catch (err) {
                        storage.error("Failed to fetch timer list message");
                        return;
                    }
                    try {
                        let now = Date.now();
                        let tmp = [];
                        for (const result of storage.gtimers) {
                            let mc = yield function_1.profile(result.mc);
                            let username = "undefined";
                            if (mc)
                                username = mc.name;
                            const str = result.user;
                            let dc = "0";
                            try {
                                var user = yield client.users.fetch(str);
                                dc = user.id;
                            }
                            catch (err) { }
                            let rank = unescape(result.dc_rank);
                            let title = `<@${dc}> - ${rank} [${username}]`;
                            let seconds = Math.round((result.endAt.getTime() - now) / 1000);
                            tmp.push({ title: title, time: moment_1.default.duration(seconds, "seconds").format() });
                        }
                        if (tmp.length <= 10) {
                            timerMsg.reactions.removeAll().catch(storage.error);
                            let description = "";
                            let num = 0;
                            for (const result of tmp)
                                description += `${++num}. ${result.title} : ${result.time}\n`;
                            const em = new discord_js_1.MessageEmbed()
                                .setColor(function_1.color())
                                .setTitle("Rank Expiration Timers")
                                .setDescription(description)
                                .setTimestamp()
                                .setFooter("This list updates every 30 seconds", client.user.displayAvatarURL());
                            timerMsg.edit({ content: "", embed: em });
                        }
                        else {
                            const allEmbeds = [];
                            for (let i = 0; i < Math.ceil(tmp.length / 10); i++) {
                                let desc = "";
                                for (let num = 0; num < 10; num++) {
                                    if (!tmp[i + num])
                                        break;
                                    desc += `${num + 1}. ${tmp[i + num].title} : ${tmp[i + num].time}\n`;
                                }
                                const em = new discord_js_1.MessageEmbed()
                                    .setColor(function_1.color())
                                    .setTitle(`Rank Expiration Timers [${i + 1}/${Math.ceil(tmp.length / 10)}]`)
                                    .setDescription(desc)
                                    .setTimestamp()
                                    .setFooter("This list updates every 30 seconds", client.user.displayAvatarURL());
                                allEmbeds.push(em);
                            }
                            const filter = (reaction) => ["◀", "▶", "⏮", "⏭", "⏹"].includes(reaction.emoji.name);
                            var msg = yield timerMsg.edit({ content: "", embed: allEmbeds[0] });
                            var s = 0;
                            yield msg.react("⏮");
                            yield msg.react("◀");
                            yield msg.react("▶");
                            yield msg.react("⏭");
                            yield msg.react("⏹");
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
                                        if (s < 0)
                                            s = allEmbeds.length - 1;
                                        msg.edit(allEmbeds[s]);
                                        break;
                                    case "▶":
                                        s += 1;
                                        if (s > allEmbeds.length - 1)
                                            s = 0;
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
                    }
                    catch (err) {
                        storage.error(err);
                    }
                }), 30000);
                var [results] = yield con.query("SELECT * FROM giveaways WHERE guild <> '622311594654695434' AND guild <> '664716701991960577' ORDER BY endAt ASC");
                storage.log(`[${id}] ` + "Found " + results.length + " giveaways");
                results.forEach((result) => __awaiter(this, void 0, void 0, function* () {
                    var currentDate = Date.now();
                    var millisec = result.endAt - currentDate;
                    function_1.setTimeout_(() => __awaiter(this, void 0, void 0, function* () {
                        giveaway_1.endGiveaway(pool, client, result);
                    }), millisec);
                }));
                var [results] = yield con.query("SELECT * FROM poll WHERE guild <> '622311594654695434' AND guild <> '664716701991960577' ORDER BY endAt ASC");
                storage.log(`[${id}] ` + "Found " + results.length + " polls.");
                results.forEach(result => {
                    var currentDate = Date.now();
                    var time = result.endAt - currentDate;
                    function_1.setTimeout_(() => __awaiter(this, void 0, void 0, function* () {
                        try {
                            var channel = yield client.channels.fetch(result.channel);
                            var msg = yield channel.messages.fetch(result.id);
                            if (msg.deleted)
                                throw new Error("Deleted");
                        }
                        catch (err) {
                            if (channel || (msg && msg.deleted)) {
                                yield pool.query("DELETE FROM poll WHERE id = " + result.id);
                                return storage.log("Deleted an ended poll.");
                            }
                        }
                        const author = yield client.users.fetch(result.author);
                        const allOptions = yield JSON.parse(result.options);
                        const pollResult = [];
                        const end = [];
                        for (const emoji of msg.reactions.cache.values()) {
                            pollResult.push(emoji.count);
                            var mesg = `**${(emoji.count - 1)}** - \`${unescape(allOptions[pollResult.length - 1])}\``;
                            end.push(mesg);
                        }
                        const pollMsg = "⬆**Poll**⬇";
                        const Ended = new discord_js_1.MessageEmbed()
                            .setColor(parseInt(result.color))
                            .setTitle(unescape(result.title))
                            .setDescription(`Poll ended. Here are the results:\n\n\n${end.join("\n\n").replace(/#quot;/g, "'").replace(/#dquot;/g, '"')}`)
                            .setTimestamp()
                            .setFooter("Hosted by " + author.tag, author.displayAvatarURL());
                        yield msg.edit(pollMsg, Ended);
                        const link = `https://discord.com/channels/${msg.guild.id}/${msg.channel.id}/${msg.id}`;
                        yield msg.channel.send("A poll has ended!\n" + link);
                        msg.reactions.removeAll().catch(() => { });
                        yield pool.query("DELETE FROM poll WHERE id = " + result.id);
                        storage.log("Deleted an ended poll.");
                    }), time);
                });
                var [results] = yield con.query("SELECT * FROM timer WHERE guild <> '622311594654695434' AND guild <> '664716701991960577'");
                storage.log(`[${id}] Found ${results.length} timers.`);
                results.forEach((result) => __awaiter(this, void 0, void 0, function* () {
                    let time = result.endAt - Date.now();
                    let em = new discord_js_1.MessageEmbed();
                    try {
                        var channel = yield client.channels.fetch(result.channel);
                        var msg = yield channel.messages.fetch(result.msg);
                        var author = yield client.users.fetch(result.author);
                        var guild = yield client.guilds.resolve(result.guild);
                    }
                    catch (err) {
                        return;
                    }
                    if (!channel)
                        time = 0;
                    if (!guild)
                        time = 0;
                    if (!msg)
                        time = 0;
                    else if (msg.author.id !== client.user.id)
                        time = 0;
                    else if (msg.embeds.length !== 1)
                        time = 0;
                    else if (!msg.embeds[0].color || !msg.embeds[0].title || !msg.embeds[0].timestamp || !msg.embeds[0].footer || !msg.embeds[0].description || msg.embeds[0].author || msg.embeds[0].fields.length !== 0 || msg.embeds[0].files.length !== 0 || msg.embeds[0].image || msg.embeds[0].thumbnail || msg.embeds[0].type != "rich")
                        time = 0;
                    if (msg.embeds[0].color && msg.embeds[0].title && msg.embeds[0].footer && msg.embeds[0].timestamp)
                        em.setTitle(msg.embeds[0].title).setColor(msg.embeds[0].color).setFooter(msg.embeds[0].footer.text, msg.embeds[0].footer.iconURL).setTimestamp(msg.embeds[0].timestamp);
                    let count = 0;
                    let timerid = setInterval(() => __awaiter(this, void 0, void 0, function* () {
                        time -= 1000;
                        if (time <= 0) {
                            clearInterval(timerid);
                            em.setDescription("The timer has ended.");
                            msg = yield msg.edit(em);
                            author.send(`Your timer in **${guild.name}** has ended! https://discord.com/channels/${guild.id}/${channel.id}/${msg.id}`);
                            const conn = yield pool.getConnection();
                            try {
                                var [res] = yield conn.query(`SELECT * FROM timer WHERE guild = '${guild.id}' AND channel = '${channel.id}' AND author = '${author.id}' AND msg = '${msg.id}'`);
                                if (res.length < 1)
                                    return;
                                yield conn.query(`DELETE FROM timer WHERE guild = '${guild.id}' AND channel = '${channel.id}' AND author = '${author.id}' AND msg = '${msg.id}'`);
                                return storage.log("Deleted a timed out timer from the database.");
                            }
                            catch (err) {
                                storage.error(err);
                            }
                            conn.release();
                        }
                        if (count < 4)
                            return count++;
                        em.setDescription(`(The timer updates every **5 seconds**)\nThis is a timer and it will last for\n**${function_1.readableDateTimeText(time)}**`);
                        msg = yield msg.edit(em);
                        count = 0;
                    }), 1000);
                    storage.timers.set(result.msg, timerid);
                }));
                var [results] = yield con.query("SELECT * FROM nolog");
                storage.noLog = results.map(x => x.id);
            }
            catch (err) {
                storage.error(err);
            }
            ;
            con.release();
        });
    }
    static guildMemberAdd(member) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const client = member.client;
            const id = client.id;
            const guild = member.guild;
            const storage = NorthClient_1.NorthClient.storage;
            if (member.user.bot)
                return;
            guild.fetchInvites().then((guildInvites) => __awaiter(this, void 0, void 0, function* () {
                const ei = storage.guilds[member.guild.id].invites;
                storage.guilds[member.guild.id].invites = guildInvites;
                const invite = yield guildInvites.find(i => !ei.get(i.code) || ei.get(i.code).uses < i.uses);
                if (!invite)
                    return;
                const inviter = yield client.users.fetch(invite.inviter.id);
                if (!inviter)
                    return;
                const allUserInvites = yield guildInvites.filter(i => i.inviter.id === inviter.id && i.guild.id === guild.id);
                const reducer = (a, b) => a + b;
                const uses = yield allUserInvites.map(i => i.uses ? i.uses : 0).reduce(reducer);
                if (storage.noLog.find(x => x === inviter.id))
                    return;
                try {
                    storage.log(`${inviter.tag} invited ${member.user.tag} to ${guild.name}. ${uses} in total.`);
                    yield inviter.send(`You invited **${member.user.tag}** to the server **${guild.name}**! In total, you have now invited **${uses} users** to the server!\n(If you want to disable this message, use \`${client.prefix}invites toggle\` to turn it off)`);
                }
                catch (err) {
                    storage.error("Failed to DM user.");
                }
            })).catch(() => { });
            try {
                const welcome = (_a = storage.guilds[guild.id]) === null || _a === void 0 ? void 0 : _a.welcome;
                if (!(welcome === null || welcome === void 0 ? void 0 : welcome.channel)) {
                    if (storage.guilds[guild.id])
                        return;
                    yield client.pool.query(`INSERT INTO servers (id, autorole, giveaway) VALUES ('${guild.id}', '[]', '${escape("🎉")}')`);
                    storage.guilds[guild.id] = {};
                    storage.log("Inserted record for " + guild.name);
                }
                else {
                    if (!welcome.channel)
                        return;
                    const channel = guild.channels.resolve(welcome.channel);
                    if (!channel || !channel.permissionsFor(guild.me).has(18432))
                        return;
                    if (welcome.message)
                        try {
                            const welcomeMessage = function_1.replaceMsgContent(welcome.message, guild, client, member, "welcome");
                            yield channel.send(welcomeMessage);
                        }
                        catch (err) {
                            storage.error(err);
                        }
                    if (welcome.image) {
                        var img = new canvas_1.Image();
                        img.onload = () => __awaiter(this, void 0, void 0, function* () {
                            var height = img.height;
                            var width = img.width;
                            const canvas = canvas_1.createCanvas(width, height);
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
                            const avatar = yield canvas_1.loadImage(member.user.displayAvatarURL({ format: "png" }));
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
                            var attachment = new discord_js_1.MessageAttachment(canvas.toBuffer(), "welcome-image.png");
                            try {
                                yield channel.send(new discord_js_1.MessageAttachment("https://cdn.discordapp.com/attachments/707639765607907358/737859171269214208/welcome.png"));
                                yield channel.send(attachment);
                            }
                            catch (err) {
                                storage.error(err);
                            }
                        });
                        var url = welcome.image;
                        try {
                            let urls = JSON.parse(welcome.image);
                            if (Array.isArray(urls))
                                url = urls[Math.floor(Math.random() * urls.length)];
                        }
                        catch (err) { }
                        img.src = url;
                    }
                }
                if (welcome && welcome.autorole !== "[]") {
                    const roleArray = JSON.parse(welcome.autorole);
                    for (var i = 0; i < roleArray.length; i++) {
                        const roleID = roleArray[i];
                        var role = undefined;
                        if (isNaN(parseInt(roleID)))
                            role = guild.roles.cache.find(x => x.name === roleID);
                        else
                            role = yield guild.roles.fetch(roleID);
                        if (!role)
                            continue;
                        try {
                            yield member.roles.add(roleID);
                            storage.log(`Added ${member.displayName} to ${role.name}`);
                        }
                        catch (err) {
                            storage.error(err);
                        }
                    }
                }
            }
            catch (err) {
                storage.error(err);
            }
            ;
        });
    }
    static message(message) {
        const _super = Object.create(null, {
            message: { get: () => super.message }
        });
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const client = message.client;
            if (message.channel.id == "647630951169523762") {
                if (!message.content.match(/^\w{3,16}$/))
                    return;
                const mcName = message.content;
                NorthClient_1.NorthClient.storage.log("Received name: " + mcName);
                const dcUserID = message.author.id;
                const msg = yield message.channel.send("Processing...");
                const con = yield client.pool.getConnection();
                try {
                    const mcUuid = yield function_1.nameToUuid(mcName);
                    if (!mcUuid)
                        return yield msg.edit("Error finding that user!").then(msg => msg.delete({ timeout: 10000 }));
                    NorthClient_1.NorthClient.storage.log("Found UUID: " + mcUuid);
                    var res;
                    try {
                        res = yield fetch(`https://api.slothpixel.me/api/players/${mcUuid}?key=${process.env.API}`).then(res => res.json());
                    }
                    catch (err) {
                        return yield msg.edit("The Hypixel API is down.").then(msg => msg.delete({ timeout: 10000 }));
                    }
                    const hyDc = (_a = res.links) === null || _a === void 0 ? void 0 : _a.DISCORD;
                    if (!hyDc || hyDc !== message.author.tag)
                        return yield msg.edit("This Hypixel account is not linked to your Discord account!").then(msg => msg.delete({ timeout: 10000 }));
                    yield message.member.roles.remove("811824361215623188");
                    var [results] = yield con.query(`SELECT * FROM dcmc WHERE dcid = '${dcUserID}'`);
                    if (results.length == 0) {
                        yield con.query(`INSERT INTO dcmc VALUES(NULL, '${dcUserID}', '${mcUuid}')`);
                        yield msg.edit("Added record! This message will be auto-deleted in 10 seconds.").then(msg => msg.delete({ timeout: 10000 }));
                        NorthClient_1.NorthClient.storage.log("Inserted record for mc-name.");
                    }
                    else {
                        yield con.query(`UPDATE dcmc SET uuid = '${mcUuid}' WHERE dcid = '${dcUserID}'`);
                        yield msg.edit("Updated record! This message will be auto-deleted in 10 seconds.").then(msg => msg.delete({ timeout: 10000 }));
                        NorthClient_1.NorthClient.storage.log("Updated record for mc-name.");
                    }
                    const mcLen = res.username.length + 3;
                    var nickname = message.member.displayName;
                    const matches = nickname.match(/ \[\w+\]$/);
                    if (matches)
                        nickname = nickname.replace(matches[0], "");
                    if (nickname.length + mcLen > 32)
                        yield message.member.setNickname(`${nickname.slice(0, 29 - mcLen)}... [${res.username}]`);
                    else
                        yield message.member.setNickname(`${nickname} [${res.username}]`);
                    const gInfo = yield fetch(`https://api.slothpixel.me/api/guilds/${mcUuid}?key=${process.env.API}`).then(res => res.json());
                    if (gInfo.id === "5b25306a0cf212fe4c98d739") {
                        yield message.member.roles.remove("676754719120556042");
                        yield message.member.roles.add("622319008758104064");
                    }
                    else {
                        yield message.member.roles.remove("622319008758104064");
                        yield message.member.roles.add("676754719120556042");
                    }
                    yield message.member.roles.remove("649556742434324491");
                    yield message.member.roles.remove("649556742832783369");
                    yield message.member.roles.remove("649556743294156810");
                    yield message.member.roles.remove("662895829815787530");
                    yield message.member.roles.remove("649556745110159370");
                    yield message.member.roles.remove("649556744732803102");
                    yield message.member.roles.remove("649556744078491649");
                    yield message.member.roles.remove("649556743982022657");
                    yield message.member.roles.remove("649556743646347284");
                    if (res.rank === "ADMIN")
                        yield message.member.roles.add("649556742434324491");
                    else if (res.rank === "MOD")
                        yield message.member.roles.add("649556742832783369");
                    else if (res.rank === "HELPER")
                        yield message.member.roles.add("649556743294156810");
                    else if (res.rank === "YOUTUBER")
                        yield message.member.roles.add("662895829815787530");
                    else if (res.rank === "VIP")
                        yield message.member.roles.add("649556745110159370");
                    else if (res.rank === "VIP_PLUS")
                        yield message.member.roles.add("649556744732803102");
                    else if (res.rank === "MVP")
                        yield message.member.roles.add("649556744078491649");
                    else if (res.rank === "MVP_PLUS")
                        yield message.member.roles.add("649556743982022657");
                    else if (res.rank === "MVP_PLUS_PLUS")
                        yield message.member.roles.add("649556743646347284");
                }
                catch (err) {
                    NorthClient_1.NorthClient.storage.error(err);
                    yield msg.edit("Error updating record! Please contact NorthWestWind#1885 to fix this.").then(msg => msg.delete({ timeout: 10000 }));
                }
                con.release();
                return;
            }
            _super.message.call(this, message);
        });
    }
}
exports.AliceHandler = AliceHandler;
class CanaryHandler extends Handler {
    static ready(client) {
        return __awaiter(this, void 0, void 0, function* () {
            const storage = NorthClient_1.NorthClient.storage;
            const pool = client.pool;
            const id = client.id;
            storage.log(`[${id}] Ready!`);
            client.user.setPresence({ activity: { name: "AFK", type: "PLAYING" }, status: "idle", afk: true });
            const con = yield pool.getConnection();
            try {
                client.guilds.cache.forEach(g => g.fetchInvites().then(guildInvites => storage.guilds[g.id].invites = guildInvites).catch(() => { }));
                const [r] = yield con.query("SELECT * FROM currency");
                for (const result of r) {
                    try {
                        if (result.bank <= 0)
                            continue;
                        const newBank = Math.round((Number(result.bank) * 1.02 + Number.EPSILON) * 100) / 100;
                        yield con.query(`UPDATE currency SET bank = ${newBank} WHERE id = ${result.id}`);
                    }
                    catch (err) {
                        storage.error(err);
                    }
                }
                var [results] = yield con.query("SELECT * FROM servers WHERE id <> '622311594654695434'");
                results.forEach((result) => __awaiter(this, void 0, void 0, function* () {
                    storage.guilds[result.id] = {};
                    if (result.queue || result.looping || result.repeating) {
                        var queue = [];
                        try {
                            if (result.queue)
                                queue = JSON.parse(unescape(result.queue));
                        }
                        catch (err) {
                            storage.error(`Error parsing queue of ${result.id}`);
                        }
                        main_1.setQueue(result.id, queue, !!result.looping, !!result.repeating, pool);
                    }
                    if (result.prefix)
                        storage.guilds[result.id].prefix = result.prefix;
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
                }));
                storage.log(`[${id}] Set ${results.length} configurations`);
                const [res] = yield con.query("SELECT * FROM rolemsg WHERE id <> '622311594654695434' ORDER BY expiration");
                storage.log(`[${id}] ` + "Found " + res.length + " role messages.");
                storage.rm = res;
                res.forEach((result) => __awaiter(this, void 0, void 0, function* () { return role_message_1.expire({ pool, client }, result.expiration - Date.now(), result.id); }));
                var [results] = yield con.query("SELECT * FROM giveaways WHERE id <> '622311594654695434' ORDER BY endAt ASC");
                storage.log(`[${id}] ` + "Found " + results.length + " giveaways");
                results.forEach((result) => __awaiter(this, void 0, void 0, function* () {
                    var currentDate = Date.now();
                    var millisec = result.endAt - currentDate;
                    function_1.setTimeout_(() => __awaiter(this, void 0, void 0, function* () {
                        giveaway_1.endGiveaway(pool, client, result);
                    }), millisec);
                }));
                var [results] = yield con.query("SELECT * FROM poll WHERE id <> '622311594654695434' ORDER BY endAt ASC");
                storage.log(`[${id}] ` + "Found " + results.length + " polls.");
                results.forEach(result => {
                    var currentDate = Date.now();
                    var time = result.endAt - currentDate;
                    function_1.setTimeout_(() => __awaiter(this, void 0, void 0, function* () {
                        try {
                            var channel = yield client.channels.fetch(result.channel);
                            var msg = yield channel.messages.fetch(result.id);
                            if (msg.deleted)
                                throw new Error("Deleted");
                        }
                        catch (err) {
                            if (channel || (msg && msg.deleted)) {
                                yield pool.query("DELETE FROM poll WHERE id = " + result.id);
                                return storage.log("Deleted an ended poll.");
                            }
                        }
                        const author = yield client.users.fetch(result.author);
                        const allOptions = yield JSON.parse(result.options);
                        const pollResult = [];
                        const end = [];
                        for (const emoji of msg.reactions.cache.values()) {
                            pollResult.push(emoji.count);
                            var mesg = `**${(emoji.count - 1)}** - \`${unescape(allOptions[pollResult.length - 1])}\``;
                            end.push(mesg);
                        }
                        const pollMsg = "⬆**Poll**⬇";
                        const Ended = new discord_js_1.MessageEmbed()
                            .setColor(parseInt(result.color))
                            .setTitle(unescape(result.title))
                            .setDescription(`Poll ended. Here are the results:\n\n\n${end.join("\n\n").replace(/#quot;/g, "'").replace(/#dquot;/g, '"')}`)
                            .setTimestamp()
                            .setFooter("Hosted by " + author.tag, author.displayAvatarURL());
                        yield msg.edit(pollMsg, Ended);
                        const link = `https://discord.com/channels/${msg.guild.id}/${msg.channel.id}/${msg.id}`;
                        yield msg.channel.send("A poll has ended!\n" + link);
                        msg.reactions.removeAll().catch(() => { });
                        yield pool.query("DELETE FROM poll WHERE id = " + result.id);
                        storage.log("Deleted an ended poll.");
                    }), time);
                });
                var [results] = yield con.query("SELECT * FROM timer WHERE id <> '622311594654695434'");
                storage.log(`[${id}] Found ${results.length} timers.`);
                results.forEach((result) => __awaiter(this, void 0, void 0, function* () {
                    let time = result.endAt - Date.now();
                    let em = new discord_js_1.MessageEmbed();
                    try {
                        var channel = yield client.channels.fetch(result.channel);
                        var msg = yield channel.messages.fetch(result.msg);
                        var author = yield client.users.fetch(result.author);
                        var guild = client.guilds.resolve(result.guild);
                    }
                    catch (err) {
                        return;
                    }
                    if (!channel)
                        time = 0;
                    if (!guild)
                        time = 0;
                    if (!msg)
                        time = 0;
                    else if (msg.author.id !== client.user.id)
                        time = 0;
                    else if (msg.embeds.length !== 1)
                        time = 0;
                    else if (!msg.embeds[0].color || !msg.embeds[0].title || !msg.embeds[0].timestamp || !msg.embeds[0].footer || !msg.embeds[0].description || msg.embeds[0].author || msg.embeds[0].fields.length !== 0 || msg.embeds[0].files.length !== 0 || msg.embeds[0].image || msg.embeds[0].thumbnail || msg.embeds[0].type != "rich")
                        time = 0;
                    if (msg.embeds[0].color && msg.embeds[0].title && msg.embeds[0].footer && msg.embeds[0].timestamp)
                        em.setTitle(msg.embeds[0].title).setColor(msg.embeds[0].color).setFooter(msg.embeds[0].footer.text, msg.embeds[0].footer.iconURL).setTimestamp(msg.embeds[0].timestamp);
                    let count = 0;
                    let timerid = setInterval(() => __awaiter(this, void 0, void 0, function* () {
                        time -= 1000;
                        if (time <= 0) {
                            clearInterval(timerid);
                            em.setDescription("The timer has ended.");
                            msg = yield msg.edit(em);
                            author.send(`Your timer in **${guild.name}** has ended! https://discord.com/channels/${guild.id}/${channel.id}/${msg.id}`);
                            const conn = yield pool.getConnection();
                            try {
                                var [res] = yield conn.query(`SELECT * FROM timer WHERE guild = '${guild.id}' AND channel = '${channel.id}' AND author = '${author.id}' AND msg = '${msg.id}'`);
                                if (res.length < 1)
                                    return;
                                yield conn.query(`DELETE FROM timer WHERE guild = '${guild.id}' AND channel = '${channel.id}' AND author = '${author.id}' AND msg = '${msg.id}'`);
                                return storage.log("Deleted a timed out timer from the database.");
                            }
                            catch (err) {
                                storage.error(err);
                            }
                            conn.release();
                        }
                        if (count < 4)
                            return count++;
                        em.setDescription(`(The timer updates every **5 seconds**)\nThis is a timer and it will last for\n**${function_1.readableDateTimeText(time)}**`);
                        msg = yield msg.edit(em);
                        count = 0;
                    }), 1000);
                    storage.timers.set(result.msg, timerid);
                }));
                var [results] = yield con.query("SELECT * FROM nolog");
                storage.noLog = results.map(x => x.id);
            }
            catch (err) {
                storage.error(err);
            }
            ;
            con.release();
        });
    }
}
exports.CanaryHandler = CanaryHandler;
