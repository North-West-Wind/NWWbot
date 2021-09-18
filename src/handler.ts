import { createCanvas, loadImage, Image } from "canvas";
import { Guild, GuildMember, Interaction, Message, MessageAttachment, MessageEmbed, MessageReaction, PartialGuildMember, PartialMessage, PartialMessageReaction, PartialUser, TextChannel, User, VoiceState } from "discord.js";
import * as moment from "moment";
import formatSetup from "moment-duration-format";
formatSetup(moment);
import { RowDataPacket } from "mysql2";
import { endGiveaway } from "./commands/miscellaneous/giveaway";
import { endPoll } from "./commands/miscellaneous/poll";
import { getRandomNumber, jsDate2Mysql, replaceMsgContent, setTimeout_, profile, wait, nameToUuid, color, fixGuildRecord } from "./function";
import { setQueue, stop } from "./helpers/music";
import { NorthClient, LevelData, NorthMessage, RoleMessage, NorthInteraction, GuildTimer } from "./classes/NorthClient";
import { Connection, PoolConnection } from "mysql2/promise";
import fetch from "node-fetch";
import * as filter from "./helpers/filter";
import { sCategories } from "./commands/information/help";
import common from "./common";
import { init } from "./helpers/addTrack";

const error = "There was an error trying to execute that command!\nIf it still doesn't work after a few tries, please contact NorthWestWind or report it on the [support server](<https://discord.gg/n67DUfQ>) or [GitHub](<https://github.com/North-West-Wind/NWWbot/issues>).\nPlease **DO NOT just** sit there and ignore this error. If you are not reporting it, it is **NEVER getting fixed**.";

export class Handler {
    static async setup(client: NorthClient, token: string) {
        await common(client);
        new Handler(client);
        client.login(token);
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
        client.on("messageCreate", message => this.message(message));
        client.on("interactionCreate", interaction => this.interactionCreate(interaction));
    }

    async interactionCreate(interaction: Interaction) {
        if (!interaction.isCommand()) return;
        const command = NorthClient.storage.commands.get(interaction.commandName);
        if (!command) return;
        const int = <NorthInteraction>interaction;
        int.pool = int.client.pool;
        try {
            const catFilter = filter[sCategories.map(x => x.toLowerCase())[(command.category)]];
            if (await filter.all(command, int) && (catFilter ? await catFilter(command, int) : true)) await command.execute(int);
        } catch (err: any) {
            try {
                if (int.replied || int.deferred) await int.editReply(error);
                else await int.reply(error);
            } catch (err: any) { }
            console.error(command.name + ": " + err);
        }
    }

    async messageLevel(message: Message) {
        if (!message || !message.author || !message.author.id || !message.guild || message.author.bot) return;
        const exp = Math.round(getRandomNumber(5, 15) * (1 + message.content.length / 100));
        const sqlDate = jsDate2Mysql(new Date());
        NorthClient.storage.queries.push(new LevelData(message.author.id, message.guild.id, exp, sqlDate));
    }

    async preReady(client: NorthClient) {
        client.guilds.cache.forEach(g => g.invites.fetch().then(guildInvites => NorthClient.storage.guilds[g.id].invites = guildInvites).catch(() => { }));
    }

    async preRead(_client: NorthClient, _con: Connection) { }

    async setPresence(client: NorthClient) {
        client.user.setPresence({ activities: [{ name: "AFK", type: "PLAYING" }], status: "idle", afk: true });
    }

    async readCurrency(_client: NorthClient, con: Connection) {
        const [r] = <RowDataPacket[][]><unknown>await con.query("SELECT * FROM currency WHERE guild <> '622311594654695434'");
        for (const result of r) {
            try {
                if (result.bank <= 0) continue;
                const newBank = Math.round((Number(result.bank) * 1.02 + Number.EPSILON) * 100) / 100;
                await con.query(`UPDATE currency SET bank = ${newBank} WHERE id = ${result.id}`);
            } catch (err: any) {
                console.error(err);
            }
        }
    }

    async readServers(client: NorthClient, con: Connection) {
        var [results] = <[RowDataPacket[]]><unknown>await con.query("SELECT * FROM servers WHERE id <> '622311594654695434'");
        results.forEach(async result => {
            NorthClient.storage.guilds[result.id] = {};
            try {
                await client.guilds.fetch(result.id);
            } catch (err: any) {
                await con.query(`DELETE FROM servers WHERE id = '${result.id}'`);
                return console.log("Removed left servers");
            }
            if (result.queue || result.looping || result.repeating) {
                var queue = [];
                try { if (result.queue) queue = JSON.parse(unescape(result.queue)); }
                catch (err: any) { console.error(`Error parsing queue of ${result.id}`); }
                setQueue(result.id, queue, !!result.looping, !!result.repeating);
            }
            if (result.prefix) NorthClient.storage.guilds[result.id].prefix = result.prefix;
            NorthClient.storage.guilds[result.id].token = result.token;
            NorthClient.storage.guilds[result.id].giveaway = unescape(result.giveaway);
            NorthClient.storage.guilds[result.id].welcome = {
                message: result.welcome,
                channel: result.wel_channel,
                image: result.wel_img,
                autorole: result.autorole
            };
            NorthClient.storage.guilds[result.id].leave = {
                message: result.leave_msg,
                channel: result.leave_channel
            };
            NorthClient.storage.guilds[result.id].boost = {
                message: result.boost_msg,
                channel: result.boost_channel
            };
            NorthClient.storage.guilds[result.id].autoReply = result.auto_reply;
        });
        console.log(`[${client.id}] Set ${results.length} configurations`);
    }

    async readRoleMsg(client: NorthClient, con: PoolConnection) {
        const [res] = <RowDataPacket[][]><unknown>await con.query("SELECT * FROM rolemsg WHERE guild <> '622311594654695434'");
        console.log(`[${client.id}] ` + "Found " + res.length + " role messages.");
        const rm = res.map(r => {
            r.roles = JSON.parse(unescape(r.roles));
            r.emojis = JSON.parse(unescape(r.emojis));
            return r;
        });
        NorthClient.storage.rm = <RoleMessage[]>rm;
    }

    async readGiveaways(client: NorthClient, con: PoolConnection) {
        var [results] = <[RowDataPacket[]]><unknown>await con.query("SELECT * FROM giveaways WHERE guild <> '622311594654695434' ORDER BY endAt ASC");
        console.log(`[${client.id}] ` + "Found " + results.length + " giveaways");
        results.forEach(async result => {
            var currentDate = Date.now();
            var millisec = result.endAt - currentDate;
            setTimeout_(async () => await endGiveaway(client.pool, result), millisec);
        });
    }

    async readPoll(client: NorthClient, con: PoolConnection) {
        var [results] = <[RowDataPacket[]]><unknown>await con.query("SELECT * FROM poll WHERE guild <> '622311594654695434' ORDER BY endAt ASC");
        console.log(`[${client.id}] ` + "Found " + results.length + " polls.");
        results.forEach(result => {
            var currentDate = Date.now();
            var time = result.endAt - currentDate;
            setTimeout_(async () => {
                try {
                    var channel = <TextChannel>await client.channels.fetch(result.channel);
                    var msg = await channel.messages.fetch(result.id);
                    if (msg.deleted) throw new Error("Deleted");
                } catch (err: any) {
                    await client.pool.query("DELETE FROM poll WHERE id = " + result.id);
                    return console.log("Deleted an ended poll.");
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
        const pool = client.pool;
        const id = client.id;
        console.log(`[${id}] Ready!`);
        this.setPresence(client);
        const con = await pool.getConnection();
        try {
            init();
            await this.preRead(client, con);
            await this.readCurrency(client, con);
            await this.readServers(client, con);
            await this.readRoleMsg(client, con);
            await this.readGiveaways(client, con);
            await this.readPoll(client, con);
            await this.readNoLog(client, con);
        } catch (err: any) { console.error(err); };
        con.release();
    }

    async preWelcomeImage(_channel: TextChannel) { }

    async guildMemberAdd(member: GuildMember) {
        const client = (member.client as NorthClient);
        const guild = member.guild;
        if (member.user.bot) return;
        guild.invites.fetch().then(async guildInvites => {
            const ei = NorthClient.storage.guilds[member.guild.id].invites;
            NorthClient.storage.guilds[member.guild.id].invites = guildInvites;
            const invite = guildInvites.find(i => !ei.get(i.code) || ei.get(i.code).uses < i.uses);
            if (!invite) return;
            const inviter = await client.users.fetch(invite.inviter.id);
            if (!inviter) return;
            const allUserInvites = guildInvites.filter(i => i.inviter.id === inviter.id && i.guild.id === guild.id);
            const reducer = (a: number, b: number) => a + b;
            const uses = allUserInvites.map(i => i.uses ? i.uses : 0).reduce(reducer);
            if (NorthClient.storage.noLog.find(x => x === inviter.id)) return;
            try {
                await inviter.send(`You invited **${member.user.tag}** to the server **${guild.name}**! In total, you have now invited **${uses} users** to the server!\n(If you want to disable this message, use \`${client.prefix}invites toggle\` to turn it off)`);
            } catch (err: any) { }
        }).catch(() => { });
        try {
            if (!NorthClient.storage.guilds[guild.id]) {
                await fixGuildRecord(guild.id);
                return;
            }
            const welcome = NorthClient.storage.guilds[guild.id]?.welcome;
            if (!welcome?.channel) return;
            const channel = <TextChannel>guild.channels.resolve(welcome.channel);
            if (!channel || !channel.permissionsFor(guild.me).has(BigInt(18432))) return;
            if (welcome.message) try {
                const welcomeMessage = replaceMsgContent(welcome.message, guild, client, member, "welcome");
                await channel.send(welcomeMessage);
            } catch (err: any) {
                console.error(err);
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
                        await channel.send({ files: [attachment] });
                    } catch (err: any) {
                        console.error(err);
                    }
                };
                var url = welcome.image;
                try {
                    let urls = JSON.parse(welcome.image);
                    if (Array.isArray(urls)) url = urls[Math.floor(Math.random() * urls.length)];
                } catch (err: any) { }
                img.src = url;
            }
            if (welcome?.autorole !== "[]") {
                const roleArray = JSON.parse(welcome.autorole);
                for (var i = 0; i < roleArray.length; i++) {
                    const roleID = roleArray[i];
                    var role = undefined;
                    if (isNaN(parseInt(roleID))) role = await guild.roles.cache.find(x => x.name === roleID);
                    else role = await guild.roles.fetch(roleID);
                    if (!role) continue;
                    try {
                        await member.roles.add(roleID);
                    } catch (err: any) {
                        console.error(err);
                    }
                }
            }
        } catch (err: any) { console.error(err) };
    }

    async guildMemberRemove(member: GuildMember | PartialGuildMember) {
        const client = (member.client as NorthClient);
        const guild = member.guild;
        try {
            if (!NorthClient.storage.guilds[guild.id]) {
                await fixGuildRecord(guild.id);
                return;
            }
            const leave = NorthClient.storage.guilds[guild.id]?.leave;
            if (!leave?.channel) return;
            if (guild.me.permissions.has(BigInt(128))) {
                const fetchedLogs = await guild.fetchAuditLogs({ limit: 1, type: 'MEMBER_KICK' });
                const kickLog = fetchedLogs.entries.first();
                if (kickLog && (kickLog.target as any).id === member.user.id && kickLog.executor.id !== (kickLog.target as any).id) return;
            } else console.log("Can't view audit logs of " + guild.name);
            const channel = <TextChannel>guild.channels.resolve(leave.channel);
            if (!channel || !channel.permissionsFor(guild.me).has(BigInt(18432))) return;
            if (!leave.message) return;
            try {
                const leaveMessage = replaceMsgContent(leave.message, guild, client, member, "leave");
                await channel.send(leaveMessage);
            } catch (err: any) {
                console.error(err);
            }

        } catch (err: any) { console.error(err) };
    }

    async guildCreate(guild: Guild) {
        try {
            await fixGuildRecord(guild.id);
        } catch (err: any) {
            console.error(err);
        }
        try { NorthClient.storage.guilds[guild.id].invites = await guild.invites.fetch(); } catch (err: any) { }
    }

    async guildDelete(guild: Guild) {
        const client = <NorthClient>guild.client;
        console.log("Left a guild: " + guild.name);
        delete NorthClient.storage.guilds[guild.id];
        try {
            await client.pool.query("DELETE FROM servers WHERE id=" + guild.id);
            console.log("Deleted record for " + guild.name);
        } catch (err: any) {
            console.error(err);
        }
    }

    async voiceStateUpdate(oldState: VoiceState, newState: VoiceState) {
        const guild = oldState.guild || newState.guild;
        const exit = NorthClient.storage.guilds[guild.id]?.exit;
        if ((oldState.id == guild.me.id || newState.id == guild.me.id) && (!guild.me.voice?.channel)) return stop(guild);
        if (!guild.me.voice?.channel || (newState.channelId !== guild.me.voice.channelId && oldState.channelId !== guild.me.voice.channelId)) return;
        if (!NorthClient.storage.guilds[guild.id]) await fixGuildRecord(guild.id);
        if (guild.me.voice.channel?.members.size <= 1) {
            if (exit) return;
            NorthClient.storage.guilds[guild.id].exit = true;
            setTimeout(() => NorthClient.storage.guilds[guild.id]?.exit ? stop(guild) : 0, 30000);
        } else NorthClient.storage.guilds[guild.id].exit = false;
    }

    async guildMemberUpdate(oldMember: GuildMember | PartialGuildMember, newMember: GuildMember) {
        const client = <NorthClient>(oldMember.client || newMember.client);
        if (oldMember.premiumSinceTimestamp || !newMember.premiumSinceTimestamp) return;
        const boost = NorthClient.storage.guilds[newMember.guild.id]?.boost;
        if (!boost?.channel || !boost.message) return;
        try {
            const channel = <TextChannel>await client.channels.fetch(boost.channel);
            channel.send(boost.message.replace(/\{user\}/gi, `<@${newMember.id}>`));
        } catch (err: any) { }
    }

    async messageReactionAdd(r: MessageReaction | PartialMessageReaction, user: User | PartialUser) {
        var roleMessage = NorthClient.storage.rm.find(x => x.id == r.message.id);
        if (!roleMessage) return;
        const emojis = roleMessage.emojis;
        var index = -1;
        if (emojis.includes(r.emoji.id)) index = emojis.indexOf(r.emoji.id);
        else if (emojis.includes(r.emoji.name)) index = emojis.indexOf(r.emoji.name);
        else return;
        try {
            const guild = await user.client.guilds.fetch(roleMessage.guild);
            const member = await guild.members.fetch(user.id);
            if (index > -1) await member.roles.add(roleMessage.roles[index]);
        } catch (err: any) {}
    }

    async messageReactionRemove(r: MessageReaction | PartialMessageReaction, user: User | PartialUser) {
        var roleMessage = NorthClient.storage.rm.find(x => x.id == r.message.id);
        if (!roleMessage) return;
        const emojis = roleMessage.emojis;
        var index = -1;
        if (emojis.includes(r.emoji.id)) index = emojis.indexOf(r.emoji.id);
        else if (emojis.includes(r.emoji.name)) index = emojis.indexOf(r.emoji.name);
        else return;
        try {
            const guild = await r.message.client.guilds.fetch(roleMessage.guild);
            const member = await guild.members.fetch(user.id);
            if (index > -1) await member.roles.remove(roleMessage.roles[index]);
        } catch (err: any) {}
    }

    async messageDelete(message: Message | PartialMessage) {
        const client = <NorthClient>message.client;
        var roleMessage = NorthClient.storage.rm.find(x => x.id === message.id);
        if (!roleMessage) return;
        NorthClient.storage.rm.splice(NorthClient.storage.rm.indexOf(roleMessage), 1);
        await client.pool.query(`DELETE FROM rolemsg WHERE id = '${message.id}'`);
    }

    async preMessage(_message: Message): Promise<any> {

    }

    messagePrefix(message: Message, client: NorthClient): string {
        return NorthClient.storage.guilds[message.guildId]?.prefix || client.prefix;
    }

    async message(message: Message) {
        await this.preMessage(message);
        const client = <NorthClient>message.client;
        const msg = (<NorthMessage>message);
        msg.prefix = this.messagePrefix(msg, client);
        this.messageLevel(msg);
        if (!msg.content.startsWith(msg.prefix)) return;
        const args = msg.content.slice(msg.prefix.length).split(/ +/);
        const commandName = args.shift().toLowerCase();
        const command = NorthClient.storage.commands.get(commandName) || NorthClient.storage.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
        if (!command) return;
        msg.pool = client.pool;
        try {
            const catFilter = filter[sCategories.map(x => x.toLowerCase())[(command.category)]];
            if (await filter.all(command, msg, args) && (catFilter ? await catFilter(command, msg) : true)) await command.run(msg, args);
        } catch (err: any) {
            console.error(command.name + ": " + err);
            try {
                await msg.reply(error);
            } catch (err: any) { }
        }
    }
}

export class AliceHandler extends Handler {
    static async setup(client: NorthClient, token: string) {
        await common(client);
        new AliceHandler(client);
        client.login(token);
    }

    constructor(client: NorthClient) {
        super(client);
    }

    async readServers(client: NorthClient, con: Connection) {
        var [results] = <[RowDataPacket[]]><unknown>await con.query("SELECT * FROM servers WHERE id = '622311594654695434'");
        const result = results[0];
        NorthClient.storage.guilds[result.id] = {};
        if (result.queue || result.looping || result.repeating) {
            var queue = [];
            try { if (result.queue) queue = JSON.parse(unescape(result.queue)); }
            catch (err: any) { console.error(`Error parsing queue of ${result.id}`); }
            setQueue(result.id, queue, !!result.looping, !!result.repeating);
        }
        if (result.prefix) NorthClient.storage.guilds[result.id].prefix = result.prefix;
        NorthClient.storage.guilds[result.id].token = result.token;
        NorthClient.storage.guilds[result.id].giveaway = unescape(result.giveaway);
        NorthClient.storage.guilds[result.id].welcome = {
            message: result.welcome,
            channel: result.wel_channel,
            image: result.wel_img,
            autorole: result.autorole
        };
        NorthClient.storage.guilds[result.id].leave = {
            message: result.leave_msg,
            channel: result.leave_channel
        };
        NorthClient.storage.guilds[result.id].boost = {
            message: result.boost_msg,
            channel: result.boost_channel
        };
        console.log(`[${client.id}] Set ${results.length} configurations`);
    }

    async setPresence(client: NorthClient) {
        client.user.setActivity("Sword Art Online Alicization", { type: "LISTENING" });
    }

    async preRead(client: NorthClient, con: Connection) {
        client.guilds.cache.forEach(g => g.invites.fetch().then(guildInvites => NorthClient.storage.guilds[g.id].invites = guildInvites).catch(() => { }));
        const [res] = <[RowDataPacket[]]><unknown>await con.query(`SELECT * FROM gtimer ORDER BY endAt ASC`);
        console.log(`[${client.id}] Found ${res.length} guild timers`);
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
                const conn = await client.pool.getConnection();
                try {
                    const [results] = <[RowDataPacket[]]><unknown>await conn.query(`SELECT id FROM gtimer WHERE user = '${result.user}' AND mc = '${result.mc}' AND dc_rank = '${result.dc_rank}'`);
                    if (results.length == 0) return;
                    try {
                        asuna.send(title + " expired");
                        var user = await client.users.fetch(result.user);
                        user.send(`Your rank **${rank}** in War of Underworld has expired.`);
                    } catch (err: any) { }
                    await conn.query(`DELETE FROM gtimer WHERE user = '${result.user}' AND mc = '${result.mc}' AND dc_rank = '${result.dc_rank}'`);
                    console.log("A guild timer expired.");
                } catch (err: any) {
                    console.error(err);
                }
                conn.release();
            }, endAfter);
        });
        const [gtimers] = <RowDataPacket[][]><unknown>await con.query(`SELECT * FROM gtimer ORDER BY endAt ASC`);
        NorthClient.storage.gtimers = <GuildTimer[]> gtimers;
        setInterval(async () => {
            try {
                const timerChannel = <TextChannel>await client.channels.fetch(process.env.TIME_LIST_CHANNEL);
                const timerMsg = await timerChannel.messages.fetch(process.env.TIME_LIST_ID);
                const now = Date.now();
                const tmp = [];
                for (const result of NorthClient.storage.gtimers) {
                    const mc = await profile(result.mc);
                    let username = "undefined";
                    if (mc) username = mc.name;
                    const str = result.user;
                    let dc = "0";
                    try {
                        var user = await client.users.fetch(str);
                        dc = user.id;
                    } catch (err: any) { }
                    let rank = unescape(result.dc_rank);
                    let title = `<@${dc}> - ${rank} [${username}]`;
                    let seconds = Math.round((result.endAt.getTime() - now) / 1000);
                    tmp.push({ title: title, time: moment.duration(seconds).format() });
                }
                if (tmp.length <= 10) {
                    timerMsg.reactions.removeAll().catch(() => {});
                    let description = "";
                    let num = 0;
                    for (const result of tmp) description += `${++num}. ${result.title} : ${result.time}\n`;
                    const em = new MessageEmbed()
                        .setColor(color())
                        .setTitle("Rank Expiration Timers")
                        .setDescription(description)
                        .setTimestamp()
                        .setFooter("This list updates every 30 seconds", client.user.displayAvatarURL());
                    await timerMsg.edit({ content: null, embeds: [em] });
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
                    const filter = (reaction: MessageReaction) => ["◀", "▶", "⏮", "⏭", "⏹"].includes(reaction.emoji.name);
                    var msg = await timerMsg.edit({ content: null, embeds: [allEmbeds[0]] });
                    var s = 0;
                    await msg.react("⏮");
                    await msg.react("◀");
                    await msg.react("▶");
                    await msg.react("⏭");
                    await msg.react("⏹");
                    const collector = msg.createReactionCollector({ filter, time: 30000 });
                    collector.on("collect", function (reaction, user) {
                        try {
                            reaction.users.remove(user.id);
                            switch (reaction.emoji.name) {
                                case "⏮":
                                    s = 0;
                                    msg.edit({ embeds: [allEmbeds[s]] });
                                    break;
                                case "◀":
                                    s -= 1;
                                    if (s < 0) s = allEmbeds.length - 1;
                                    msg.edit({ embeds: [allEmbeds[s]] });
                                    break;
                                case "▶":
                                    s += 1;
                                    if (s > allEmbeds.length - 1) s = 0;
                                    msg.edit({ embeds: [allEmbeds[s]] });
                                    break;
                                case "⏭":
                                    s = allEmbeds.length - 1;
                                    msg.edit({ embeds: [allEmbeds[s]] });
                                    break;
                                case "⏹":
                                    collector.emit("end");
                                    break;
                            }
                        } catch (err: any) {
                            console.error(err);
                        }
                    });
                    collector.on("end", () => msg.reactions.removeAll().catch(() => {}));
                }
            } catch (err: any) {}
        }, 60000);
    }

    async readGiveaways(client: NorthClient, con: Connection) {
        var [results] = <RowDataPacket[][]><unknown>await con.query("SELECT * FROM giveaways WHERE guild = '622311594654695434' ORDER BY endAt ASC");
        console.log(`[${client.id}] ` + "Found " + results.length + " giveaways");
        results.forEach(async result => {
            var currentDate = Date.now();
            var millisec = result.endAt - currentDate;
            setTimeout_(async () => await endGiveaway(client.pool, result), millisec);
        });
    }

    async readPoll(client: NorthClient, con: PoolConnection) {
        const [results] = <RowDataPacket[][]><unknown>await con.query("SELECT * FROM poll WHERE guild = '622311594654695434' ORDER BY endAt ASC");
        console.log(`[${client.id}] ` + "Found " + results.length + " polls.");
        results.forEach(result => {
            var currentDate = Date.now();
            var time = result.endAt - currentDate;
            setTimeout_(async () => {
                try {
                    var channel = <TextChannel>await client.channels.fetch(result.channel);
                    var msg = await channel.messages.fetch(result.id);
                    if (msg.deleted) throw new Error("Deleted");
                } catch (err: any) {
                    await client.pool.query("DELETE FROM poll WHERE id = " + result.id);
                }
                await endPoll(client, con, result.id, msg, null, result.title, result.author, result.options, result.color);
            }, time);
        });
    }

    async preWelcomeImage(channel: TextChannel) {
        await channel.send({ files: [new MessageAttachment("https://cdn.discordapp.com/attachments/707639765607907358/737859171269214208/welcome.png")] });
    }

    async preMessage(message: Message) {
        const client = <NorthClient>message.client;
        if (message.channel.id == "647630951169523762") {
            if (!message.content.match(/^\w{3,16}$/)) return;
            const mcName = message.content;
            console.log("Received name: " + mcName);
            const dcUserID = message.author.id;
            const msg = await message.channel.send("Processing...");
            const con = await client.pool.getConnection();
            try {
                const mcUuid = await nameToUuid(mcName);
                if (!mcUuid) return await msg.edit("Error finding that user!").then(msg => setTimeout(() => msg.delete().catch(() => {}), 10000));
                console.log("Found UUID: " + mcUuid);
                var res;
                try {
                    const f = await fetch(`https://api.slothpixel.me/api/players/${mcUuid}?key=${process.env.API}`);
                    if (f.status == 404) return await msg.edit("This player doesn't exist!").then(msg => setTimeout(() => msg.delete().catch(() => {}), 10000));
                    res = await f.json();
                } catch (err: any) {
                    return await msg.edit("The Hypixel API is down.").then(msg => setTimeout(() => msg.delete().catch(() => {}), 10000));
                }
                const hyDc = res.links.DISCORD;
                if (hyDc !== message.author.tag) return await msg.edit("This Hypixel account is not linked to your Discord account!").then(msg => setTimeout(() => msg.delete().catch(() => {}), 10000));
                var [results] = <[RowDataPacket[]]><unknown>await con.query(`SELECT * FROM dcmc WHERE dcid = '${dcUserID}'`);
                if (results.length == 0) {
                    await con.query(`INSERT INTO dcmc VALUES(NULL, '${dcUserID}', '${mcUuid}')`);
                    msg.edit("Added record! This message will be auto-deleted in 10 seconds.").then(msg => setTimeout(() => msg.delete().catch(() => {}), 10000));
                    console.log("Inserted record for mc-name.");
                } else {
                    await con.query(`UPDATE dcmc SET uuid = '${mcUuid}' WHERE dcid = '${dcUserID}'`);
                    msg.edit("Updated record! This message will be auto-deleted in 10 seconds.").then(msg => setTimeout(() => msg.delete().catch(() => {}), 10000));
                    console.log("Updated record for mc-name.");
                }
                const mcLen = res.username.length + 1;
                const bw = res.stats.BedWars;
                const firstHalf = `[${bw.level}⭐|${bw.final_k_d}]`;
                console.log(`Attempting to change nickname of ${message.author.tag} to ${firstHalf} ${res.username}`);
                if (firstHalf.length + mcLen > 32) await message.member.setNickname(`${firstHalf} ${res.username.slice(0, 28 - firstHalf.length)}...`);
                else await message.member.setNickname(`${firstHalf} ${res.username}`);
                const gInfo = <any> await fetch(`https://api.slothpixel.me/api/guilds/${mcUuid}?key=${process.env.API}`).then(res => res.json());
                const roles = message.member.roles;
                if (gInfo.id === "5b25306a0cf212fe4c98d739") await roles.add("622319008758104064");
                await roles.add("676754719120556042");
                await roles.add("837345908697989171");
                await roles.remove("837345919010603048");

                if (bw.level < 100) await roles.add("851471525802803220");
                else if (bw.level < 200) await roles.add("851469005168181320");
                else if (bw.level < 300) await roles.add("851469138647842896");
                else if (bw.level < 400) await roles.add("851469218310389770");
                else if (bw.level < 500) await roles.add("851469264664789022");
                else if (bw.level < 600) await roles.add("851469323444944907");
                else if (bw.level < 700) await roles.add("851469358076788766");
                else if (bw.level < 800) await roles.add("851469389806829596");
                else if (bw.level < 900) await roles.add("851469422971584573");
                else if (bw.level < 1000) await roles.add("851469455791489034");
                else if (bw.level < 1100) await roles.add("851469501115793408");
                else if (bw.level < 1200) await roles.add("851469537030307870");
                else if (bw.level < 1300) await roles.add("851469565287858197");
                else if (bw.level < 1400) await roles.add("851469604840013905");
                else if (bw.level < 1500) await roles.add("851469652940161084");
                else if (bw.level < 1600) await roles.add("851469683764887572");
                else if (bw.level < 1700) await roles.add("851469718955229214");
                else if (bw.level < 1800) await roles.add("851469754677985280");
                else if (bw.level < 1900) await roles.add("851469812050690068");
                else if (bw.level < 2000) await roles.add("851469858675097660");
                else if (bw.level < 2100) await roles.add("851469898547068938");
                else if (bw.level < 2200) await roles.add("851469933606862848");
                else if (bw.level < 2300) await roles.add("851469969685479424");
                else if (bw.level < 2400) await roles.add("851470006520905748");
                else if (bw.level < 2500) await roles.add("851470041031245854");
                else if (bw.level < 2600) await roles.add("851470070022406204");
                else if (bw.level < 2700) await roles.add("851470099558039622");
                else if (bw.level < 2800) await roles.add("851470140410822677");
                else if (bw.level < 2900) await roles.add("851470173503881218");
                else if (bw.level < 3000) await roles.add("851470230370910248");
                else await roles.add("851471153188569098");

                await roles.remove(["662895829815787530", "837271174827212850", "837271174073155594", "837271173027856404", "837271172319674378", "837271171619356692"]);
                if (res.rank === "YOUTUBER") await roles.add("662895829815787530");
                else if (res.rank === "VIP") await roles.add("837271174827212850");
                else if (res.rank === "VIP_PLUS") await roles.add("837271174073155594");
                else if (res.rank === "MVP") await roles.add("837271173027856404");
                else if (res.rank === "MVP_PLUS") await roles.add("837271172319674378");
                else if (res.rank === "MVP_PLUS_PLUS") await roles.add("837271171619356692");
            } catch (err: any) {
                console.error(err);
                await msg.edit("Error updating record! Please contact NorthWestWind#1885 to fix this.").then(msg => setTimeout(() => msg.delete().catch(() => {}), 10000));
            }
            con.release();
            return;
        }
    }
}

export class CanaryHandler extends Handler {
    static async setup(client: NorthClient, token: string) {
        await common(client);
        new CanaryHandler(client);
        client.login(token);
    }

    constructor(client: NorthClient) {
        super(client);
    }

    async readServers(client: NorthClient, con: Connection) {
        var [results] = <RowDataPacket[][]><unknown>await con.query("SELECT * FROM servers WHERE id <> '622311594654695434' AND id <> '819539026792808448'");
        results.forEach(async result => {
            NorthClient.storage.guilds[result.id] = {};
            if (result.queue || result.looping || result.repeating) {
                var queue = [];
                try { if (result.queue) queue = JSON.parse(unescape(result.queue)); }
                catch (err: any) { console.error(`Error parsing queue of ${result.id}`); }
                setQueue(result.id, queue, !!result.looping, !!result.repeating);
            }
            if (result.prefix) NorthClient.storage.guilds[result.id].prefix = result.prefix;
            else NorthClient.storage.guilds[result.id].prefix = client.prefix;
            NorthClient.storage.guilds[result.id].token = result.token;
            NorthClient.storage.guilds[result.id].giveaway = unescape(result.giveaway);
            NorthClient.storage.guilds[result.id].welcome = {
                message: result.welcome,
                channel: result.wel_channel,
                image: result.wel_img,
                autorole: result.autorole
            };
            NorthClient.storage.guilds[result.id].leave = {
                message: result.leave_msg,
                channel: result.leave_channel
            };
            NorthClient.storage.guilds[result.id].boost = {
                message: result.boost_msg,
                channel: result.boost_channel
            };
        });
        console.log(`[${client.id}] Set ${results.length} configurations`);
    }

    messagePrefix(_message: Message, _client: NorthClient): string {
        return "%";
    }
}