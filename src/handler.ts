import cv from "canvas";
import { CommandInteraction, Guild, GuildMember, GuildMemberRoleManager, Interaction, Message, MessageAttachment, MessageComponentInteraction, MessageEmbed, MessageReaction, PartialGuildMember, PartialMessage, PartialMessageReaction, PartialUser, Snowflake, TextChannel, User, VoiceState } from "discord.js";
import { endGiveaway } from "./commands/miscellaneous/giveaway.js";
import { endPoll, updatePoll } from "./commands/miscellaneous/poll.js";
import { getRandomNumber, jsDate2Mysql, replaceMsgContent, setTimeout_, profile, updateGuildMemberMC, nameToUuid, color, fixGuildRecord, query, duration, checkTradeW1nd, roundTo } from "./function.js";
import { NorthClient, LevelData, NorthMessage, RoleMessage, NorthInteraction, GuildTimer, GuildConfig } from "./classes/NorthClient.js";
import fetch from "node-fetch";
import * as filter from "./helpers/filter.js";
import { sCategories } from "./commands/information/help.js";
import common from "./common.js";
import cfg from "../config.json";
import { endApplication } from "./commands/managements/apply.js";
const { createCanvas, loadImage, Image } = cv;
const emojis = cfg.poll;
const error = "There was an error trying to execute that command!\nIf it still doesn't work after a few tries, please contact NorthWestWind or report it on the [support server](<https://discord.gg/n67DUfQ>) or [GitHub](<https://github.com/North-West-Wind/NWWbot/issues>).\nPlease **DO NOT just** sit there and ignore this error. If you are not reporting it, it is **NEVER getting fixed**.";

export class Handler {
    static lastRunCommand: string;

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
        client.on("guildMemberUpdate", (oldMember, newMember) => this.guildMemberUpdate(oldMember, newMember));
        client.on("messageReactionAdd", (reaction, user) => this.messageReactionAdd(reaction, user));
        client.on("messageReactionRemove", (reaction, user) => this.messageReactionRemove(reaction, user));
        client.on("messageDelete", message => this.messageDelete(message));
        client.on("messageCreate", message => this.message(message));
        client.on("interactionCreate", interaction => this.interactionCreate(interaction));
    }

    async interactionCreate(interaction: Interaction) {
        if (interaction.isCommand()) return await this.commandInteraction(interaction);
        if (interaction.isMessageComponent()) return await this.messageComponentInteraction(interaction);
    }

    async commandInteraction(interaction: CommandInteraction) {
        const command = NorthClient.storage.commands.get(interaction.commandName);
        if (!command) return;
        const int = <NorthInteraction>interaction;
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

    async messageComponentInteraction(interaction: MessageComponentInteraction) {
        if (!interaction.guildId) return;
        const settings = NorthClient.storage.guilds[interaction.guildId]?.applications;
        if (!settings) return;
        const application = settings.applications.get(interaction.message.id);
        if (!application || !(<GuildMemberRoleManager> interaction.member.roles).cache.some(r => settings.admins.includes(r.id))) return;
        if (interaction.customId === "approve") {
            application.decline.delete(interaction.user.id);
            application.approve.add(interaction.user.id);
        } else if (interaction.customId === "decline") {
            application.approve.delete(interaction.user.id);
            application.decline.add(interaction.user.id);
        }
        const embed = interaction.message.embeds[0];
        const split = embed.description.split("\n");
        split[split.length - 2] = `Approved: ${application.approve.size}`;
        split[split.length - 1] = `Declined: ${application.decline.size}`;
        embed.description = split.join("\n");
        await interaction.update({ embeds: [embed] });
        const allMembers = new Set<Snowflake>();
        for (const roleId of settings.admins) {
            const role = await interaction.guild.roles.fetch(roleId);
            for (const member of role.members.keys()) allMembers.add(member);
        }
        settings.applications.set(interaction.message.id, application);
        NorthClient.storage.guilds[interaction.guildId].applications = settings;
        await query(`UPDATE servers SET applications = '${escape(JSON.stringify([...NorthClient.storage.guilds[interaction.guildId].applications.applications.values()]))}' WHERE id = '${interaction.guildId}'`);
        if (allMembers.size >= application.approve.size + application.decline.size) await endApplication(interaction.client, interaction.message.id, interaction.guildId);
    }

    async messageLevel(message: Message) {
        if (!message || !message.author || !message.author.id || !message.guild || message.author.bot) return;
        const exp = Math.round(getRandomNumber(5, 15) * (1 + message.content.length / 100));
        const date = new Date();
        const sqlDate = jsDate2Mysql(date.getTime() + date.getTimezoneOffset() * 60000);
        NorthClient.storage.pendingLvlData.push(new LevelData(message.author.id, message.guild.id, exp, sqlDate));
    }

    async preReady(client: NorthClient) {
        client.guilds.cache.forEach(g => g.invites.fetch().then(guildInvites => NorthClient.storage.guilds[g.id].invites = guildInvites).catch(() => { }));
    }

    async preRead(_client: NorthClient) { }

    async setPresence(client: NorthClient) {
        client.user.setPresence({ activities: [{ name: `AFK | ${client.prefix}help`, type: "PLAYING" }], status: "idle", afk: true });
    }

    async readCurrency(_client: NorthClient) {
        const r = await query("SELECT id, bank FROM users");
        for (const result of r) {
            try {
                if (result.bank <= 0) continue;
                const newBank = roundTo(result.bank * 1.02, 2);
                await query(`UPDATE users SET bank = ${newBank} WHERE id = ${result.id}`);
            } catch (err: any) {
                console.error(err);
            }
        }
    }

    async readServers(client: NorthClient) {
        var results = await query("SELECT * FROM servers WHERE id <> '622311594654695434'");
        results.forEach(async result => {
            try {
                await client.guilds.fetch(result.id);
            } catch (err: any) {
                await query(`DELETE FROM servers WHERE id = '${result.id}'`);
                return console.log("Removed left servers");
            }
            NorthClient.storage.guilds[result.id] = new GuildConfig(result);
        });
        console.log(`[${client.id}] Set ${results.length} configurations`);
    }

    async readRoleMsg(client: NorthClient) {
        const res = await query("SELECT * FROM rolemsg WHERE guild <> '622311594654695434'");
        console.log(`[${client.id}] ` + "Found " + res.length + " role messages.");
        const rm = res.map(r => {
            r.roles = JSON.parse(unescape(r.roles));
            r.emojis = JSON.parse(unescape(r.emojis));
            return r;
        });
        NorthClient.storage.rm = <RoleMessage[]>rm;
    }

    async readGiveaways(client: NorthClient) {
        var results = await query("SELECT * FROM giveaways WHERE guild <> '622311594654695434' ORDER BY endAt ASC");
        console.log(`[${client.id}] ` + "Found " + results.length + " giveaways");
        results.forEach(async (result: any) => {
            var currentDate = Date.now();
            var millisec = result.endAt - currentDate;
            try {
                const channel = <TextChannel>await client.channels.fetch(result.channel);
                await channel.messages.fetch(result.id);
                setTimeout_(async () => await endGiveaway(await channel.messages.fetch(result.id)), millisec);
            } catch (err) {
                await query("DELETE FROM giveaways WHERE id = " + result.id);
                return console.log("Deleted an ended giveaway.");
            }
        });
    }

    async readPoll(client: NorthClient) {
        var results = await query("SELECT * FROM polls WHERE guild <> '622311594654695434' ORDER BY endAt ASC");
        console.log(`[${client.id}] ` + "Found " + results.length + " polls.");
        results.forEach(async (result: any) => {
            var currentDate = Date.now();
            var time = new Date(result.endAt).getTime() - currentDate;
            try {
                const channel = <TextChannel>await client.channels.fetch(result.channel);
                const msg = await channel.messages.fetch(result.id);
                for (const reaction of msg.reactions.cache.values()) {
                    if (!emojis.includes(reaction.emoji.name) || reaction.count == 1) continue;
                    for (const user of (await reaction.users.fetch()).values()) {
                        if (user.id === client.user.id) continue;
                        await updatePoll(msg.id, reaction, user);
                    }
                }
                NorthClient.storage.polls.set(msg.id, { options: JSON.parse(unescape(result.options)), votes: JSON.parse(unescape(result.votes)).map((array: Snowflake[]) => new Set(array)) });
                if (time <= 0) return await endPoll(msg);
                msg.createReactionCollector({ time, filter: (reaction, user) => emojis.includes(reaction.emoji.name) && !user.bot })
                    .on("collect", async (reaction, user) => await updatePoll(msg.id, reaction, user))
                    .on("end", async () => await endPoll(await channel.messages.fetch(msg.id)));
            } catch (err) {
                if (!client.id) await query("DELETE FROM polls WHERE id = " + result.id);
                return console.log("Deleted an ended poll.");
            }
        });
    }

    async readNoLog(_client: NorthClient) {
        var results = await query("SELECT id FROM users WHERE no_log = 1");
        NorthClient.storage.noLog = results.map(x => x.id);
    }

    async ready(client: NorthClient) {
        this.preReady(client);
        const id = client.id;
        console.log(`[${id}] Ready!`);
        this.setPresence(client);
        try {
            await this.preRead(client);
            await this.readCurrency(client);
            await this.readServers(client);
            await this.readRoleMsg(client);
            await this.readGiveaways(client);
            await this.readPoll(client);
            await this.readNoLog(client);
        } catch (err: any) { console.error(err); };
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
                img.src = welcome.image[Math.floor(Math.random() * welcome.image.length)];
            }
            if (welcome?.autorole.length > 0) {
                const roleArray = welcome.autorole;
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
        if (!guild?.id || !guild.name || await checkTradeW1nd(guild.id)) return;
        console.log(`Left a guild: ${guild.name} | ID: ${guild.id}`);
        delete NorthClient.storage.guilds[guild.id];
        try {
            await query("DELETE FROM servers WHERE id=" + guild.id);
            console.log("Deleted record for " + guild.name);
        } catch (err: any) {
            console.error(err);
        }
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
        var roleMessage = NorthClient.storage.rm.find(x => x.id === message.id);
        if (!roleMessage) return;
        NorthClient.storage.rm.splice(NorthClient.storage.rm.indexOf(roleMessage), 1);
        await query(`DELETE FROM rolemsg WHERE id = '${message.id}'`);
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
        Handler.lastRunCommand = command.name;
        //const heapDiff = new memwatch.HeapDiff();
        try {
            const catFilter = filter[sCategories.map(x => x.toLowerCase())[(command.category)]];
            if (await filter.all(command, msg, args) && (catFilter ? await catFilter(command, msg) : true)) await command.run(msg, args);
        } catch (err: any) {
            console.error(`Error in command ${command.name}!`);
            console.error(err);
            try {
                await msg.reply(error);
            } catch (err: any) { }
        }
        //const diff = heapDiff.end();
        //fs.writeFileSync(`log/memDump/${Date.now()}.json`, JSON.stringify({ command: command.name, diff }, null, 2), { encoding: "utf8" });
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

    async readServers(client: NorthClient) {
        var results = await query("SELECT * FROM servers WHERE id = '622311594654695434'");
        const result = results[0];
        NorthClient.storage.guilds[result.id] = new GuildConfig(result);
        console.log(`[${client.id}] Set ${results.length} configurations`);
    }

    async setPresence(client: NorthClient) {
        client.user.setActivity("Sword Art Online Alicization", { type: "LISTENING" });
    }

    async preRead(client: NorthClient) {
        client.guilds.cache.forEach(g => g.invites.fetch().then(guildInvites => NorthClient.storage.guilds[g.id].invites = guildInvites).catch(() => { }));
        const res = await query(`SELECT * FROM gtimer ORDER BY endAt ASC`);
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
                try {
                    const results = await query(`SELECT id FROM gtimer WHERE user = '${result.user}' AND mc = '${result.mc}' AND dc_rank = '${result.dc_rank}'`);
                    if (results.length == 0) return;
                    try {
                        asuna.send(title + " expired");
                        var user = await client.users.fetch(result.user);
                        user.send(`Your rank **${rank}** in War of Underworld has expired.`);
                    } catch (err: any) { }
                    await query(`DELETE FROM gtimer WHERE user = '${result.user}' AND mc = '${result.mc}' AND dc_rank = '${result.dc_rank}'`);
                    console.log("A guild timer expired.");
                } catch (err: any) {
                    console.error(err);
                }
            }, endAfter);
        });
        const gtimers = await query(`SELECT * FROM gtimer ORDER BY endAt ASC`);
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
                    tmp.push({ title: title, time: duration(seconds) });
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
                        .setFooter({ text: "This list updates every 30 seconds", iconURL: client.user.displayAvatarURL() });
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
                            .setFooter({ text: "This list updates every 30 seconds", iconURL: client.user.displayAvatarURL() });
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
                            reaction.users.remove(user.id).catch(() => {});
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

    async readGiveaways(client: NorthClient) {
        var results = await query("SELECT * FROM giveaways WHERE guild = '622311594654695434' ORDER BY endAt ASC");
        console.log(`[${client.id}] ` + "Found " + results.length + " giveaways");
        results.forEach(async (result: any) => {
            var currentDate = Date.now();
            var millisec = result.endAt - currentDate;
            try {
                const channel = <TextChannel>await client.channels.fetch(result.channel);
                await channel.messages.fetch(result.id);
                setTimeout_(async () => await endGiveaway(await channel.messages.fetch(result.id)), millisec);
            } catch (err) {
                await query("DELETE FROM giveaways WHERE id = " + result.id);
                return console.log("Deleted an ended giveaway.");
            }
        });
    }

    async readPoll(client: NorthClient) {
        const results = await query("SELECT * FROM polls WHERE guild = '622311594654695434' ORDER BY endAt ASC");
        console.log(`[${client.id}] ` + "Found " + results.length + " polls.");
        results.forEach(async (result: any) => {
            var currentDate = Date.now();
            var time = new Date(result.endAt).getTime() - currentDate;
            try {
                const channel = <TextChannel>await client.channels.fetch(result.channel);
                const msg = await channel.messages.fetch(result.id);
                for (const reaction of msg.reactions.cache.values()) {
                    if (!emojis.includes(reaction.emoji.name) || reaction.count == 1) continue;
                    for (const user of (await reaction.users.fetch()).values()) {
                        if (user.id === client.user.id) continue;
                        await updatePoll(msg.id, reaction, user);
                    }
                }
                NorthClient.storage.polls.set(msg.id, { options: JSON.parse(unescape(result.options)), votes: JSON.parse(unescape(result.votes)).map((array: Snowflake[]) => new Set(array)) });
                if (time <= 0) return await endPoll(msg);
                msg.createReactionCollector({ time, filter: (reaction, user) => emojis.includes(reaction.emoji.name) && !user.bot })
                    .on("collect", async (reaction, user) => await updatePoll(msg.id, reaction, user))
                    .on("end", async () => await endPoll(await channel.messages.fetch(msg.id)));
            } catch (err) {
                await query("DELETE FROM polls WHERE id = " + result.id);
                return console.log("Deleted an ended poll.");
            }
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
                    return await msg.edit("Failed to request Hypixel API!").then(msg => setTimeout(() => msg.delete().catch(() => {}), 10000));
                }
                const hyDc = res.links.DISCORD;
                if (hyDc !== message.author.tag) return await msg.edit("⚠️This Hypixel account is not linked to your Discord account!\nIf you have just linked your account, you may need to wait for a few minutes.\nhttps://cdn.discordapp.com/attachments/647630951169523762/951420917588836372/verify.gif").then(msg => setTimeout(() => msg.delete().catch(() => {}), 60000));
                var results = await query(`SELECT * FROM dcmc WHERE dcid = '${dcUserID}'`);
                if (results.length == 0) {
                    await query(`INSERT INTO dcmc VALUES(NULL, '${dcUserID}', '${mcUuid}')`);
                    msg.edit("Added record! This message will be auto-deleted in 10 seconds.").then(msg => setTimeout(() => msg.delete().catch(() => {}), 10000));
                    console.log("Inserted record for mc-name.");
                } else {
                    await query(`UPDATE dcmc SET uuid = '${mcUuid}' WHERE dcid = '${dcUserID}'`);
                    msg.edit("Updated record! This message will be auto-deleted in 10 seconds.").then(msg => setTimeout(() => msg.delete().catch(() => {}), 10000));
                    console.log("Updated record for mc-name.");
                }
                await updateGuildMemberMC(message.member, mcUuid);
            } catch (err: any) {
                console.error(err);
                await msg.edit("Error updating record! Please contact NorthWestWind#1885 to fix this.").then(msg => setTimeout(() => msg.delete().catch(() => {}), 10000));
            }
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

    async readServers(client: NorthClient) {
        var results = await query("SELECT * FROM servers WHERE id <> '622311594654695434' AND id <> '819539026792808448'");
        results.forEach(async result => {
            NorthClient.storage.guilds[result.id] = new GuildConfig(result);
        });
        console.log(`[${client.id}] Set ${results.length} configurations`);
    }

    messagePrefix(_message: Message, _client: NorthClient): string {
        return "%";
    }
}
