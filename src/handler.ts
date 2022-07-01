import cv from "canvas";
import { Collection, CommandInteraction, Guild, GuildMember, GuildMemberRoleManager, Interaction, Invite, Message, MessageActionRow, MessageAttachment, MessageButton, MessageComponentInteraction, MessageEmbed, MessageReaction, MessageSelectMenu, Modal, ModalSubmitInteraction, PartialGuildMember, PartialMessage, PartialMessageReaction, PartialUser, Role, Snowflake, TextChannel, TextInputComponent, User, VoiceState } from "discord.js";
import { endGiveaway } from "./commands/miscellaneous/giveaway.js";
import { endPoll, updatePoll } from "./commands/miscellaneous/poll.js";
import { getRandomNumber, jsDate2Mysql, setTimeout_, profile, updateGuildMemberMC, nameToUuid, color, fixGuildRecord, query, duration, checkTradeW1nd, roundTo, getFont, replaceWithObj, mysqlEscape, wait, updateTokens, getTokensAndMultiplier } from "./function.js";
import { NorthClient, LevelData, NorthMessage, RoleMessage, NorthInteraction, GuildTimer, GuildConfig, FullCommand, SlashCommand, PrefixCommand, IPrefix, ISlash } from "./classes/NorthClient.js";
import fetch from "node-fetch";
import * as filter from "./helpers/filter.js";
import { sCategories } from "./commands/information/help.js";
import common from "./common.js";
import cfg from "../config.json" assert { type: "json" };
import { endApplication } from "./commands/managements/apply.js";
import { MutedKickSetting } from "./classes/Config.js";
import { calculateLevel } from "./commands/fun/rank.js";
const { createCanvas, loadImage, Image } = cv;
const emojis = cfg.poll;
const error = "There was an error trying to execute that command!\nIf it still doesn't work after a few tries, please contact NorthWestWind or report it on the [support server](<https://discord.gg/n67DUfQ>) or [GitHub](<https://github.com/North-West-Wind/NWWbot/issues>).\nPlease **DO NOT just** sit there and ignore this error. If you are not reporting it, it is **NEVER getting fixed**.";

export class Handler {
    protected readonly client: NorthClient;

    static async setup(client: NorthClient, token: string) {
        await common(client);
        new Handler(client);
        client.login(token);
    }

    constructor(client: NorthClient) {
        this.client = client;
        client.once("ready", () => this.ready());
        client.on("guildMemberAdd", member => this.guildMemberAdd(member));
        client.on("guildMemberRemove", member => this.guildMemberRemove(member));
        client.on("guildCreate", guild => this.guildCreate(guild));
        client.on("guildDelete", guild => this.guildDelete(guild));
        client.on("guildMemberUpdate", (oldMember, newMember) => this.guildMemberUpdate(<GuildMember>oldMember, <GuildMember>newMember));
        client.on("messageReactionAdd", (reaction, user) => this.messageReactionAdd(<MessageReaction>reaction, <User>user));
        client.on("messageReactionRemove", (reaction, user) => this.messageReactionRemove(<MessageReaction>reaction, <User>user));
        client.on("messageDelete", message => this.messageDelete(message));
        client.on("messageCreate", message => this.message(message));
        client.on("interactionCreate", interaction => this.interactionCreate(interaction));
        client.on("voiceStateUpdate", (oldState, newState) => this.voiceStateUpdate(<VoiceState>oldState, <VoiceState>newState));

        setInterval(async () => {
            if (!client.user.presence.activities?.length) {
                console.log("Found no presence of self. Resetting presence...");
                await this.setPresence().catch(() => { });
            }
        }, 60000);
    }

    async interactionCreate(interaction: Interaction) {
        if (interaction.isCommand()) return await this.commandInteraction(interaction);
        if (interaction.isMessageComponent()) return await this.messageComponentInteraction(interaction);
    }

    async commandInteraction(interaction: CommandInteraction) {
        const command = NorthClient.storage.commands.get(interaction.commandName);
        if (!command || !(typeof command["execute"] === "function")) return;
        const int = <NorthInteraction>interaction;
        try {
            const catFilter = filter[sCategories.map(x => x.toLowerCase())[(command.category)]];
            if (await filter.all(command, int) && (catFilter ? await catFilter(command, int) : true)) await (<ISlash><unknown>command).execute(int);
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
        if (!application || !(<GuildMemberRoleManager>interaction.member.roles).cache.some(r => settings.admins.includes(r.id))) return;
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
        await query(`UPDATE configs SET applications = ${mysqlEscape(JSON.stringify([...NorthClient.storage.guilds[interaction.guildId].applications.applications.values()]))} WHERE id = '${interaction.guildId}'`);
        if (allMembers.size >= application.approve.size + application.decline.size) await endApplication(interaction.client, interaction.message.id, interaction.guildId);
    }

    async messageLevel(message: Message): Promise<any> {
        if (!message.guild || message.author.bot) return;
        const date = new Date();
        if (!NorthClient.storage.guilds[message.guildId]) NorthClient.storage.guilds[message.guildId] = await fixGuildRecord(message.guildId);
        var data = NorthClient.storage.guilds[message.guildId].levelData.get(message.author.id);
        if (!data) data = new LevelData(null, message.author.id, message.guildId, 0, date);
        else if (date.getTime() - data.date.getTime() < 60000) return;
        else data.date = date;
        const { level } = calculateLevel(data.exp);
        const increment = Math.round(getRandomNumber(5, 15) * (1 + message.content.length / 100) * data.multiplier);
        data.exp += increment;
        data.changed = true;
        NorthClient.storage.guilds[message.guildId].levelData.set(message.author.id, data);
        return { oldLevel: level, level: calculateLevel(data.exp) };
    }

    async preReady() {
        this.client.guilds.cache.forEach(g => g.invites.fetch().then(guildInvites => NorthClient.storage.guilds[g.id].invites = guildInvites).catch(() => { }));
    }

    async preRead() { }

    async setPresence() {
        this.client.user.setPresence({ activities: [{ name: `Important! Click!`, type: "PLAYING" }], status: "dnd", afk: true });
    }

    async readCurrency() {
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

    async readServers() {
        var results = await query("SELECT * FROM configs WHERE id <> '622311594654695434'");
        results.forEach(async result => {
            try {
                const guild = await this.client.guilds.fetch(result.id);
                NorthClient.storage.guilds[result.id] = new GuildConfig(result);
                MutedKickSetting.check(guild);
            } catch (err: any) {
                return await query(`DELETE FROM configs WHERE id = '${result.id}'`);
            }
        });
        console.log(`[${this.client.id}] Set ${results.length} configurations`);
    }

    async readRoleMsg() {
        const res = await query("SELECT * FROM rolemsg WHERE guild <> '622311594654695434'");
        console.log(`[${this.client.id}] ` + "Found " + res.length + " role messages.");
        const rm = res.map(r => {
            r.roles = JSON.parse(r.roles);
            r.emojis = JSON.parse(r.emojis);
            return r;
        });
        NorthClient.storage.rm = <RoleMessage[]>rm;
    }

    async readGiveaways() {
        var results = await query("SELECT * FROM giveaways WHERE guild <> '622311594654695434' ORDER BY endAt ASC");
        console.log(`[${this.client.id}] ` + "Found " + results.length + " giveaways");
        results.forEach(async (result: any) => {
            var currentDate = Date.now();
            var millisec = result.endAt - currentDate;
            try {
                const channel = <TextChannel>await this.client.channels.fetch(result.channel);
                await channel.messages.fetch(result.id);
                setTimeout_(async () => await endGiveaway(await channel.messages.fetch(result.id)), millisec);
            } catch (err) {
                await query("DELETE FROM giveaways WHERE id = " + result.id);
                return console.log("Deleted an ended giveaway.");
            }
        });
    }

    async readPoll() {
        var results = await query("SELECT * FROM polls WHERE guild <> '622311594654695434' ORDER BY endAt ASC");
        console.log(`[${this.client.id}] ` + "Found " + results.length + " polls.");
        results.forEach(async (result: any) => {
            var currentDate = Date.now();
            var time = new Date(result.endAt).getTime() - currentDate;
            try {
                const channel = <TextChannel>await this.client.channels.fetch(result.channel);
                const msg = await channel.messages.fetch(result.id);
                for (const reaction of msg.reactions.cache.values()) {
                    if (!emojis.includes(reaction.emoji.name) || reaction.count == 1) continue;
                    for (const user of (await reaction.users.fetch()).values()) {
                        if (user.id === this.client.user.id) continue;
                        await updatePoll(msg.id, reaction, user);
                    }
                }
                NorthClient.storage.polls.set(msg.id, { options: JSON.parse(result.options), votes: JSON.parse(result.votes).map((array: Snowflake[]) => new Set(array)) });
                if (time <= 0) return await endPoll(msg);
                msg.createReactionCollector({ time, filter: (reaction, user) => emojis.includes(reaction.emoji.name) && !user.bot })
                    .on("collect", async (reaction, user) => await updatePoll(msg.id, reaction, user))
                    .on("end", async () => await endPoll(await channel.messages.fetch(msg.id)));
            } catch (err) {
                if (!this.client.id) await query("DELETE FROM polls WHERE id = " + result.id);
                return console.log("Deleted an ended poll.");
            }
        });
    }

    async readNoLog() {
        var results = await query("SELECT id FROM users WHERE no_log = 1");
        NorthClient.storage.noLog = results.map(x => x.id);
    }

    async readTranslations() {
        const results = await query("SELECT * FROM translations");
        for (const result of results) {
            const collection = new Collection<string, { messageId: Snowflake, channelId: Snowflake }>();
            const parsed = JSON.parse(result.translations);
            for (const lang in parsed) {
                collection.set(lang, { messageId: parsed[lang].messageId, channelId: parsed[lang].channelId });
            }
            NorthClient.storage.guilds[result.guild]?.translations.set(result.id, { messageId: result.id, channelId: result.channel, guildId: result.guild, translations: collection, existingId: result.existing });
        }
    }

    async readLevel() {
        const results = await query("SELECT * FROM leveling");
        for (const result of results) {
            const existing = NorthClient.storage.guilds[result.guild]?.levelData.find(data => data.author == result.user && data.guild == result.guild);
            if (existing) {
                if (existing.exp > result.exp) await query(`DELETE FROM leveling WHERE id = ${result.id}`);
                else {
                    await query(`DELETE FROM leveling WHERE id = ${existing.id}`);
                    NorthClient.storage.guilds[result.guild]?.levelData.set(result.user, new LevelData(result.id, result.user, result.guild, result.exp, new Date(result.last), result.multiplier));
                }
            } else NorthClient.storage.guilds[result.guild]?.levelData.set(result.user, new LevelData(result.id, result.user, result.guild, result.exp, new Date(result.last), result.multiplier));
        }
    }

    async ready() {
        this.preReady();
        console.log(`[${this.client.id}] Ready!`);
        this.setPresence();
        try {
            await this.preRead();
            await this.readCurrency();
            await this.readServers();
            await this.readRoleMsg();
            await this.readGiveaways();
            await this.readPoll();
            await this.readNoLog();
            await this.readTranslations();
            await this.readLevel();
        } catch (err: any) { console.error(err); };
    }

    async preWelcomeImage(_channel: TextChannel) { }

    async guildMemberAdd(member: GuildMember) {
        const client = (member.client as NorthClient);
        const guild = member.guild;
        const simMems = NorthClient.storage.guilds[guild.id].checkMember(member);
        if (simMems.length >= 2) console.debug(`Potential nuke happening on ${guild.name}. Members: ${simMems.map(mem => mem.user.tag).join(" ")} ${member}`);
        if (member.user.bot) return;
        guild.invites.fetch().then(async invites => {
            const ei = NorthClient.storage.guilds[member.guild.id].invites;
            NorthClient.storage.guilds[member.guild.id].invites = invites;
            const invite = invites.find(i => ei.get(i.code)?.uses < i.uses);
            if (!invite) return;
            const inviter = await client.users.fetch(invite.inviter.id);
            if (!inviter || NorthClient.storage.noLog.find(x => x === inviter.id)) return;
            const allUserInvites = invites.filter(i => i.inviter.id === inviter.id && i.guild.id === guild.id);
            const uses = allUserInvites.map(i => i.uses ? i.uses : 0).reduce((a, b) => a + b);
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
                const welcomeMessage = replaceWithObj(welcome.message, member, channel);
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
                    const avatar = await loadImage(member.user.displayAvatarURL({ format: "png" }));
                    ctx.drawImage(img, 0, 0, width, height);
                    var txt = member.user.tag;
                    var wel = "Welcome to the server!";
                    if (welcome.image.format) {
                        const split = welcome.image.format.split("\n");
                        txt = replaceWithObj(split.shift(), member, channel);
                        if (split.length > 0) wel = replaceWithObj(split.join("\n"), member, channel);
                    }
                    ctx.font = getFont(canvas, txt, 9 / 10);
                    ctx.strokeStyle = "black";
                    ctx.lineWidth = canvas.width / 102.4;
                    ctx.strokeText(txt, canvas.width / 2 - ctx.measureText(txt).width / 2, (canvas.height * 3) / 4);
                    ctx.fillStyle = "#ffffff";
                    ctx.fillText(txt, canvas.width / 2 - ctx.measureText(txt).width / 2, (canvas.height * 3) / 4);
                    ctx.font = getFont(canvas, wel, 4 / 5);
                    ctx.strokeStyle = "black";
                    ctx.lineWidth = canvas.width / 204.8;
                    ctx.strokeText(wel, canvas.width / 2 - ctx.measureText(wel).width / 2, (canvas.height * 6) / 7);
                    ctx.fillStyle = "#ffffff";
                    ctx.fillText(wel, canvas.width / 2 - ctx.measureText(wel).width / 2, (canvas.height * 6) / 7);
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
                img.onerror = (err) => {
                    console.log("Error loading ", img.src);
                    console.error(err);
                }
                img.src = welcome.image.images[Math.floor(Math.random() * welcome.image.images.length)];
            }
            if (welcome?.autorole.length > 0) {
                const roleArray = welcome.autorole;
                for (var i = 0; i < roleArray.length; i++) {
                    const roleID = roleArray[i];
                    var role: Role;
                    try {
                        role = await guild.roles.fetch(roleID);
                        await member.roles.add(roleID);
                    } catch (err: any) {
                        if (role) console.error(err);
                    }
                }
            }
        } catch (err: any) { console.error(err) };
    }

    async guildMemberRemove(member: GuildMember | PartialGuildMember) {
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
                const leaveMessage = replaceWithObj(leave.message, <GuildMember>member, channel);
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
        /*if (!guild?.id || !guild.name || await checkTradeW1nd(guild.id)) return;
        console.log(`Left a guild: ${guild.name} | ID: ${guild.id}`);*/
        delete NorthClient.storage.guilds[guild.id];
        /*try {
            await query("DELETE FROM servers WHERE id = " + guild.id);
            await query("DELETE FROM configs WHERE id = " + guild.id);
        } catch (err: any) {
            console.error(err);
        }*/
    }

    async guildMemberUpdate(oldMember: GuildMember | PartialGuildMember, newMember: GuildMember): Promise<any> {
        const client = <NorthClient>(oldMember.client || newMember.client);
        if (oldMember.premiumSinceTimestamp || !newMember.premiumSinceTimestamp) return;
        const boost = NorthClient.storage.guilds[newMember.guild.id]?.boost;
        if (boost?.channel && boost.message) {
            try {
                const channel = <TextChannel>await client.channels.fetch(boost.channel);
                await channel.send(boost.message.replace(/\{user\}/gi, `<@${newMember.id}>`));
            } catch (err: any) { }
        }
        return true;
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
        } catch (err: any) { }
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
        } catch (err: any) { }
    }

    async messageDelete(message: Message | PartialMessage): Promise<any> {
        var roleMessage = NorthClient.storage.rm.find(x => x.id === message.id);
        if (!roleMessage) return;
        NorthClient.storage.rm.splice(NorthClient.storage.rm.indexOf(roleMessage), 1);
        await query(`DELETE FROM rolemsg WHERE id = '${message.id}'`);
    }

    async voiceStateUpdate(oldState: VoiceState, newState: VoiceState) {
        const guild = newState.guild;
        if (!NorthClient.storage.guilds[guild.id]) {
            await fixGuildRecord(guild.id);
            return;
        }
        const timeout = NorthClient.storage.guilds[guild.id].voice.kick.timeout || -1;
        if (!NorthClient.storage.guilds[guild.id].voice.kick.channels.includes(newState.channelId) || timeout < 0) return;
        if ((!oldState.channel || !oldState?.mute) && newState?.mute) {
            NorthClient.storage.guilds[guild.id].pendingKick.add(newState.member.id);
            setTimeout(async () => {
                if (NorthClient.storage.guilds[guild.id].pendingKick.delete(newState.member.id))
                    newState.disconnect().catch(() => { });
            }, timeout);
        } else if (oldState?.mute && (!newState?.channel || !newState?.mute))
            NorthClient.storage.guilds[guild.id].pendingKick.delete(newState.member.id);
    }

    async inviteCreate(invite: Invite) {
        var invites = NorthClient.storage.guilds[invite.guild.id]?.invites;
        if (!invites) invites = new Collection();
        invites.set(invite.code, invite);
    }

    messagePrefix(message: Message): string {
        return NorthClient.storage.guilds[message.guildId]?.prefix || this.client.prefix;
    }

    async message(message: Message): Promise<any> {
        const msg = (<NorthMessage>message);
        msg.prefix = this.messagePrefix(msg);
        if (!msg.content.startsWith(msg.prefix)) return this.messageLevel(msg);
        const args = msg.content.slice(msg.prefix.length).split(/ +/);
        const commandName = args.shift().toLowerCase();
        const command = NorthClient.storage.commands.get(commandName) || NorthClient.storage.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
        if (!command || !(typeof command["run"] === "function")) return;
        try {
            const catFilter = filter[sCategories.map(x => x.toLowerCase())[(command.category)]];
            if (await filter.all(command, msg, args) && (catFilter ? await catFilter(command, msg) : true)) await (<IPrefix><unknown>command).run(msg, args);
        } catch (err: any) {
            console.error(`Error in command ${command.name}!`);
            console.error(err);
            try {
                await msg.reply(error);
            } catch (err: any) { }
        }
    }
}

export class AliceHandler extends Handler {
    readonly langMap = {
        english: "978612824601395200",
        española: "977878110492037130",
        polskie: "977881035943604234",
        भारतीय: "977880381250478120",
        日本: "977879407127584848",
        한국어: "977880603577966632",
        中文: "977880932000350238",
        русский: "991616810577317968"
    }

    static async setup(client: NorthClient, token: string) {
        await common(client);
        new AliceHandler(client);
        client.login(token);
    }

    constructor(client: NorthClient) {
        super(client);
    }

    async messageLevel(message: Message<boolean>) {
        const data = await super.messageLevel(message);
        if (data && data.oldLevel != data.level && data.level % 5 == 0) {
            const { tokens, multiplier } = await getTokensAndMultiplier(message.author.id, null);
            await updateTokens(message.author.id, null, tokens + 7 * multiplier);
        }
    }

    async readServers() {
        var results = await query("SELECT * FROM configs WHERE id = '622311594654695434'");
        const result = results[0];
        const guild = await this.client.guilds.fetch(result.id);
        NorthClient.storage.guilds[result.id] = new GuildConfig(result);
        MutedKickSetting.check(guild);
        console.log(`[${this.client.id}] Set ${results.length} configurations`);
    }

    async setPresence() {
        this.client.user.setActivity("Sword Art Online Alicization", { type: "LISTENING" });
    }

    async preRead() {
        this.client.guilds.cache.forEach(g => g.invites.fetch().then(guildInvites => NorthClient.storage.guilds[g.id].invites = guildInvites).catch(() => { }));
        const res = await query(`SELECT * FROM gtimer ORDER BY endAt ASC`);
        console.log(`[${this.client.id}] Found ${res.length} guild timers`);
        res.forEach(async result => {
            let endAfter = result.endAt.getTime() - Date.now();
            let mc = await profile(result.mc);
            let username = "undefined";
            if (mc) username = mc.name;
            let dc = `<@${result.user}>`;
            let rank = result.dc_rank;
            let title = `${dc} - ${rank} [${username}]`;
            setTimeout_(async () => {
                let asuna = await this.client.users.fetch("461516729047318529");
                try {
                    const results = await query(`SELECT id FROM gtimer WHERE user = '${result.user}' AND mc = '${result.mc}' AND dc_rank = '${result.dc_rank}'`);
                    if (results.length == 0) return;
                    try {
                        asuna.send(title + " expired");
                        var user = await this.client.users.fetch(result.user);
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
        NorthClient.storage.gtimers = <GuildTimer[]>gtimers;
        setInterval(async () => {
            try {
                const timerChannel = <TextChannel>await this.client.channels.fetch(process.env.TIME_LIST_CHANNEL);
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
                        var user = await this.client.users.fetch(str);
                        dc = user.id;
                    } catch (err: any) { }
                    let rank = result.dc_rank;
                    let title = `<@${dc}> - ${rank} [${username}]`;
                    let seconds = Math.round((result.endAt.getTime() - now) / 1000);
                    tmp.push({ title: title, time: duration(seconds) });
                }
                if (tmp.length <= 10) {
                    timerMsg.reactions.removeAll().catch(() => { });
                    let description = "";
                    let num = 0;
                    for (const result of tmp) description += `${++num}. ${result.title} : ${result.time}\n`;
                    const em = new MessageEmbed()
                        .setColor(color())
                        .setTitle("Rank Expiration Timers")
                        .setDescription(description)
                        .setTimestamp()
                        .setFooter({ text: "This list updates every 30 seconds", iconURL: this.client.user.displayAvatarURL() });
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
                            .setFooter({ text: "This list updates every 30 seconds", iconURL: this.client.user.displayAvatarURL() });
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
                            reaction.users.remove(user.id).catch(() => { });
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
                    collector.on("end", () => msg.reactions.removeAll().catch(() => { }));
                }
            } catch (err: any) { }
        }, 60000);
    }

    async readGiveaways() {
        var results = await query("SELECT * FROM giveaways WHERE guild = '622311594654695434' ORDER BY endAt ASC");
        console.log(`[${this.client.id}] ` + "Found " + results.length + " giveaways");
        results.forEach(async (result: any) => {
            var currentDate = Date.now();
            var millisec = result.endAt - currentDate;
            try {
                const channel = <TextChannel>await this.client.channels.fetch(result.channel);
                await channel.messages.fetch(result.id);
                setTimeout_(async () => await endGiveaway(await channel.messages.fetch(result.id)), millisec);
            } catch (err) {
                await query("DELETE FROM giveaways WHERE id = " + result.id);
                return console.log("Deleted an ended giveaway.");
            }
        });
    }

    async readPoll() {
        const results = await query("SELECT * FROM polls WHERE guild = '622311594654695434' ORDER BY endAt ASC");
        console.log(`[${this.client.id}] ` + "Found " + results.length + " polls.");
        results.forEach(async (result: any) => {
            var currentDate = Date.now();
            var time = new Date(result.endAt).getTime() - currentDate;
            try {
                const channel = <TextChannel>await this.client.channels.fetch(result.channel);
                const msg = await channel.messages.fetch(result.id);
                for (const reaction of msg.reactions.cache.values()) {
                    if (!emojis.includes(reaction.emoji.name) || reaction.count == 1) continue;
                    for (const user of (await reaction.users.fetch()).values()) {
                        if (user.id === this.client.user.id) continue;
                        await updatePoll(msg.id, reaction, user);
                    }
                }
                NorthClient.storage.polls.set(msg.id, { options: JSON.parse(result.options), votes: JSON.parse(result.votes).map((array: Snowflake[]) => new Set(array)) });
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
        await channel.send({ files: [new MessageAttachment("https://cdn.discordapp.com/attachments/714804870078660630/978258723749367829/standard_7.gif")] });
    }

    async guildMemberUpdate(oldMember: GuildMember | PartialGuildMember, newMember: GuildMember) {
        if (super.guildMemberUpdate(oldMember, newMember)) {
        }
    }

    async guildDelete(guild: Guild) {
        if (!guild?.id || !guild.name || await checkTradeW1nd(guild.id)) return;
        console.log(`Left a guild: ${guild.name} | ID: ${guild.id}`);
        delete NorthClient.storage.guilds[guild.id];
    }

    async messageDelete(message: Message | PartialMessage) {
        if (NorthClient.storage.guilds[message.guildId]?.translations?.has(message.id)) {
            NorthClient.storage.guilds[message.guildId].translations.delete(message.id);
            await query(`DELETE FROM translations WHERE id = ${message.id}`);
        } else if (NorthClient.storage.guilds[message.guildId]?.translations?.find(trans => trans.translations.has(message.id))) {
            const key = NorthClient.storage.guilds[message.guildId]?.translations?.findKey(trans => trans.translations.has(message.id));
            const translation = NorthClient.storage.guilds[message.guildId].translations.get(key);
            const obj = {};
            for (const key of translation.translations.keys()) obj[key] = { messageId: translation.translations.get(key).messageId, channelId: translation.translations.get(key).channelId };
            translation.translations.delete(message.id);
            await query(`UPDATE translations SET translations = ${mysqlEscape(JSON.stringify(obj))} WHERE id = ${key}`);
            NorthClient.storage.guilds[message.guildId].translations.set(key, translation);
        }
        super.messageDelete(message);
    }

    static readonly replacements = [
        "Wait... This isn't what I typed!",
        "Anyone else really like Rick Astley?",
        "Hey helper, how play game?",
        "Sometimes I sing soppy, love songs in the car.",
        "I like long walks on the beach and playing Hypixel",
        "Please go easy on me, this is my first game!",
        "You're a great person! Do you want to play some Hypixel games with me?",
        "In my free time I like to watch cat videos on Youtube",
        "When I saw the witch with the potion, I knew there was trouble brewing.",
        "If the Minecraft world is infinite, how is the sun spinning around it?",
        "Hello everyone! I am an innocent player who loves everything Hypixel.",
        "Plz give me doggo memes!",
        "I heard you like Minecraft, so I built a computer in Minecraft in your Minecraft so you can Minecraft while you Minecraft",
        "Why can't the Ender Dragon read a book? Because he always starts at the End.",
        "Maybe we can have a rematch?",
        "I sometimes try to say bad things then this happens 😦",
        "Behold, the great and powerful, my magnificent and almighty nemisis!",
        "Doin a bamboozle fren.",
        "Your clicks per second are godly. :eek:",
        "What happens if I add chocolate milk to macaroni and cheese?",
        "Can you paint with all the colors of the wind",
        "Blue is greener than purple for sure",
        "I had something to say, then I forgot it.",
        "When nothing is right, go left.",
        "I need help, teach me how to play!",
        "Your personality shines brighter than the sun.",
        "You are very good at the game friend.",
        "I like pineapple on my pizza",
        "I like pasta, do you prefer nachos?",
        "I like Minecraft pvp but you are truly better than me!",
        "I have really enjoyed playing with you! ❤️",
        "ILY ❤️",
        "Pineapple doesn't go on pizza!",
        "Lets be friends instead of fighting okay?"
    ];

    async message(message: Message) {
        if (message.channel.id == "647630951169523762") {
            if (!message.content.match(/^\w{3,16}$/)) return;
            const mcName = message.content;
            console.log("Received name: " + mcName);
            const dcUserID = message.author.id;
            const msg = await message.channel.send("Processing...");
            try {
                const mcUuid = await nameToUuid(mcName);
                if (!mcUuid) return await msg.edit("Error finding that user!").then(msg => setTimeout(() => msg.delete().catch(() => { }), 10000));
                console.log("Found UUID: " + mcUuid);
                var res;
                try {
                    const f = await fetch(`https://api.slothpixel.me/api/players/${mcUuid}?key=${process.env.API}`);
                    if (f.status == 404) return await msg.edit("This player doesn't exist!").then(msg => setTimeout(() => msg.delete().catch(() => { }), 10000));
                    res = await f.json();
                } catch (err: any) {
                    return await msg.edit("Failed to request Hypixel API!").then(msg => setTimeout(() => msg.delete().catch(() => { }), 10000));
                }
                const hyDc = res.links.DISCORD;
                if (hyDc !== message.author.tag) return await msg.edit("⚠️This Hypixel account is not linked to your Discord account!\nIf you have just linked your account, you may need to wait for a few minutes.\nhttps://cdn.discordapp.com/attachments/647630951169523762/951420917588836372/verify.gif").then(msg => setTimeout(() => msg.delete().catch(() => { }), 60000));
                var results = await query(`SELECT * FROM dcmc WHERE dcid = '${dcUserID}'`);
                if (results.length == 0) {
                    await query(`INSERT INTO dcmc VALUES(NULL, '${dcUserID}', '${mcUuid}', 0)`);
                    msg.edit("Added record! This message will be auto-deleted in 10 seconds.").then(msg => setTimeout(() => msg.delete().catch(() => { }), 10000));
                    console.log("Inserted record for mc-name.");
                } else {
                    await query(`UPDATE dcmc SET uuid = '${mcUuid}' WHERE dcid = '${dcUserID}'`);
                    msg.edit("Updated record! This message will be auto-deleted in 10 seconds.").then(msg => setTimeout(() => msg.delete().catch(() => { }), 10000));
                    console.log("Updated record for mc-name.");
                }
                await updateGuildMemberMC(message.member, mcUuid);
            } catch (err: any) {
                console.error(err);
                await msg.edit("Error updating record! Please contact NorthWestWind#1885 to fix this.").then(msg => setTimeout(() => msg.delete().catch(() => { }), 10000));
            }
            return;
        } else if (!message.author.bot) {
            const translatorRole = await message.guild.roles.fetch("640150106028638229");
            if ((message.member.roles.highest?.position || 0) >= translatorRole.position) { /* do nothing */ }
            else if (message.content?.toLowerCase().split(/ +/).includes("ez")) {
                await message.delete();
                await message.channel.send(`<@${message.author.id}> said:\n> ${AliceHandler.replacements[Math.floor(Math.random() * AliceHandler.replacements.length)]}`);
                return;
            }
            for (const lang in this.langMap) {
                if (message.channelId == this.langMap[lang]) {
                    if (lang === "english" && message.member.permissions.has(BigInt(32))) {
                        const msg = await message.channel.send({ content: "Do you want to accept translation for this message?", components: [new MessageActionRow().addComponents(new MessageButton({ customId: "yes", label: "Yes", emoji: "✅", style: "SUCCESS" }), new MessageButton({ customId: "no", label: "No", emoji: "✖️", style: "DANGER" }))] });
                        const interaction = <MessageComponentInteraction>await msg.awaitMessageComponent({ filter: interaction => interaction.user.id === message.author.id, time: 30000 }).catch(() => null);
                        if (!interaction?.isButton() || interaction.customId === "no") return interaction.deleteReply();
                        NorthClient.storage.guilds[interaction.guildId].translations.set(message.id, { messageId: message.id, channelId: message.channel.id, guildId: interaction.guildId, translations: new Collection() });
                        await query(`INSERT INTO translations (id, guild, channel, translations) VALUES(${message.id}, ${message.guildId}, ${message.channel.id}, "{}")`);
                        await interaction.update({ content: "Added message to translation submission.", components: [] });
                        await message.react("✅");
                        await wait(10000);
                        return await interaction.deleteReply();
                    }
                    const translations = NorthClient.storage.guilds[message.guildId].translations.filter(trans => !trans.ended);
                    const allEmbeds: MessageEmbed[] = [];
                    const allRows: MessageActionRow[][] = [];
                    const pages = Math.ceil(translations.size / 5);
                    for (let ii = 0; ii < pages; ii++) {
                        const em = new MessageEmbed()
                            .setColor(color())
                            .setTitle(`Choose a message to link this translation [${ii + 1}/${pages}]`)
                            .setTimestamp()
                            .setFooter({ text: "Use the buttons to navigate pages and choose an option in the select menu." });
                        const menu = new MessageSelectMenu()
                            .setCustomId("select")
                            .setPlaceholder("Select message...");
                        var description = "";
                        for (let jj = 0; jj < 5; jj++) {
                            const translation = translations.at(ii * 5 + jj);
                            if (!translation) break;
                            const msg = await (<TextChannel>await message.guild.channels.fetch(translation.channelId)).messages.fetch(translation.messageId);
                            description += `**${translation.messageId}**\n${msg.content.slice(0, 100)}...\n\n`;
                            menu.addOptions({ label: translation.messageId, value: translation.messageId });
                        }
                        em.setDescription(description);
                        allEmbeds.push(em);
                        allRows.push([new MessageActionRow().addComponents(menu), new MessageActionRow().addComponents(new MessageButton({ customId: "previous", emoji: "◀️", style: "PRIMARY" }), new MessageButton({ customId: "search", label: "Search by ID", emoji: "🔍", style: "SECONDARY" }), new MessageButton({ customId: "next", emoji: "▶️", style: "PRIMARY" }))]);
                    }
                    var s = 0;
                    const msg = await message.channel.send({ embeds: [allEmbeds[s]], components: allRows[s] });
                    const collector = msg.createMessageComponentCollector({ filter: (interaction) => interaction.user.id === message.author.id, idle: 60000 });
                    collector.on("collect", async (interaction: MessageComponentInteraction) => {
                        if (interaction.isButton()) {
                            switch (interaction.customId) {
                                case "previous":
                                    s -= 1;
                                    if (s < 0) s = allEmbeds.length - 1;
                                    interaction.update({ embeds: [allEmbeds[s]], components: allRows[s] });
                                    break;
                                case "next":
                                    s += 1;
                                    if (s > allEmbeds.length - 1) s = 0;
                                    interaction.update({ embeds: [allEmbeds[s]], components: allRows[s] });
                                    break;
                                case "search":
                                    const modal = new Modal()
                                        .setCustomId("modal")
                                        .setTitle("Search by ID")
                                        .addComponents(new MessageActionRow<TextInputComponent>().addComponents(new TextInputComponent().setCustomId("id").setLabel("What is the message ID you are searching for?").setStyle("SHORT")));
                                    await interaction.showModal(modal);
                                    const received = <ModalSubmitInteraction>await interaction.awaitModalSubmit({ filter: int => int.user.id === interaction.user.id, time: 60000 }).catch(() => null);
                                    if (!received) break;
                                    const id = received.fields.getTextInputValue("id");
                                    const trans = NorthClient.storage.guilds[message.guildId].translations.get(id);
                                    if (!trans) {
                                        await received.update({ embeds: [], components: [], content: `The message with ID ${id} doesn't exist!` });
                                        collector.emit("end");
                                        return;
                                    }
                                    trans.translations.set(lang, { messageId: message.id, channelId: message.channelId });
                                    NorthClient.storage.guilds[message.guildId].translations.set(id, trans);
                                    const obj = {};
                                    for (const key of trans.translations.keys()) obj[key] = { messageId: trans.translations.get(key).messageId, channelId: trans.translations.get(key).channelId };
                                    await query(`UPDATE translations SET translations = ${mysqlEscape(JSON.stringify(obj))} WHERE id = ${id}`);
                                    await received.update({ embeds: [], components: [], content: `Linked translation to message ${id}.` });
                                    await message.react("✅");
                                    collector.emit("end");
                            }
                        } else if (interaction.isSelectMenu()) {
                            const id = interaction.values[0];
                            const trans = NorthClient.storage.guilds[message.guildId].translations.get(id);
                            trans.translations.set(lang, { messageId: message.id, channelId: message.channelId });
                            NorthClient.storage.guilds[message.guildId].translations.set(id, trans);
                            const obj = {};
                            for (const key of trans.translations.keys()) obj[key] = { messageId: trans.translations.get(key).messageId, channelId: trans.translations.get(key).channelId };
                            await query(`UPDATE translations SET translations = ${mysqlEscape(JSON.stringify(obj))} WHERE id = ${id}`);
                            await interaction.update({ embeds: [], components: [], content: `Linked translation to message ${id}.` });
                            await message.react("✅");
                            collector.emit("end");
                        }
                    });
                    collector.on("end", async () => {
                        await wait(10000);
                        msg.delete().catch(() => { });
                    })
                    break;
                }
            }
        }
        super.message(message);
    }
}

export class V2Handler extends Handler {
    static async setup(client: NorthClient, token: string) {
        await common(client);
        new V2Handler(client);
        client.login(token);
    }

    constructor(client: NorthClient) {
        super(client);
    }

    async setPresence() {
        this.client.user.setPresence({ activities: [{ name: `AFK | ${this.client.prefix}help`, type: "PLAYING" }], status: "idle", afk: true });
    }

    async readServers() {
        var results = await query("SELECT * FROM configs WHERE id <> '622311594654695434'");
        results.forEach(async result => {
            const guild = await this.client.guilds.fetch(result.id).catch(() => null);
            NorthClient.storage.guilds[result.id] = new GuildConfig(result);
            if (guild) MutedKickSetting.check(guild);
        });
        console.log(`[${this.client.id}] Set ${results.length} configurations`);
    }
}

export class CanaryHandler extends V2Handler {
    static async setup(client: NorthClient, token: string) {
        await common(client);
        new CanaryHandler(client);
        client.login(token);
    }

    constructor(client: NorthClient) {
        super(client);
    }

    messagePrefix(_message: Message): string {
        return "%";
    }
}
