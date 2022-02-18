import { GuildConfig, NorthClient, NorthInteraction } from "./classes/NorthClient.js";
import crypto from "crypto";
import { globalClient } from "./common.js";
import * as Discord from "discord.js";
import fetch from "node-fetch";
import { parseString } from "xml2js";
import superms from "ms";
import mcapi from "aio-mc-api";
import * as fs from "fs";
import * as path from "path";
import moment from "moment";
import { Readable } from "stream";
import ytdl, { downloadOptions } from "ytdl-core";
import { setQueue } from "./helpers/music.js";

export function twoDigits(d) {
    if (0 <= d && d < 10) return "0" + d.toString();
    if (-10 < d && d < 0) return "-0" + (-1 * d).toString();
    return d.toString();
}

export function SumArray(arr) { return arr.reduce((a, b) => a + b); }
export function setTimeout_(fn: Function, delay: number) {
    var maxDelay = Math.pow(2, 31) - 1;
    if (delay > maxDelay) {
        delay -= maxDelay;
        return setTimeout(() => setTimeout_(fn, delay), maxDelay);
    }
    return setTimeout(fn, delay);
}

export function validURL(str) { return !!str.match(/^(https?:\/\/)?((([a-z\d]([a-z\d-]*[a-z\d])*)\.)+[a-z]{2,}|((\d{1,3}\.){3}\d{1,3}))(\:\d+)?(\/[-a-z\d%_.~+]*)*(\?.*)?(\#[-a-z\d_]*)?$/i); }
export function validYTURL(str) { return !!str.match(/^(https?:\/\/)?((w){3}.)?youtu(be|.be)?(.com)?\/.+/); }
export function validYTPlaylistURL(str) { return !!str.match(/^(http(s)?:\/\/)?((w){3}.)?youtu(be|.be)?(.com)?\/playlist\?list=\w+/); }
export function validSPURL(str) { return !!str.match(/^(spotify:|https:\/\/[a-z]+\.spotify\.com\/)/); }
export function validGDURL(str) { return !!str.match(/^(https?)?:\/\/drive\.google\.com\/(file\/d\/(?<id>.*?)\/(?:edit|view)\?usp=sharing|open\?id=(?<id1>.*?)$)/); }
export function validGDFolderURL(str) { return !!str.match(/^(https?)?:\/\/drive\.google\.com\/drive\/folders\/[\w\-]+(\?usp=sharing)?$/); }
export function validGDDLURL(str) { return !!str.match(/^(https?)?:\/\/drive\.google\.com\/uc\?export=download&id=[\w-]+/); }
export function validImgurURL(str) { return !!str.match(/^https?:\/\/(\w+\.)?imgur.com\/(\w*\w*)+(\.[a-zA-Z]{3})?$/); }
export function validImgurVideoURL(str) { return !!str.match(/^https?:\/\/(\w+\.)?imgur.com\/(\w*\w*)+(\.[a-zA-Z0-9]{3})?$/); }
export function validImgur4wordsURL(str) { return !!str.match(/^https?:\/\/(\w+\.)?imgur.com\/(\w\/)?(\w*\w*)+(\.[a-zA-Z0-9]*)?$/); }
export function validImgurAURL(str) { return !!str.match(/^https?:\/\/(\w+\.)?imgur.com\/(\w\/)?(\w*\w*)$/); }
export function validNotImgurURL(str) { return !!str.match(/^https?:\/\/imgur.com\/(\w*\w*)+(\.[a-zA-Z]{3})?$/); }
export function validRedditURL(str) { return !!str.match(/^https?:\/\/(\w+\.)?redd.it\/(\w*\w*)+(\.[a-zA-Z]{3})?$/); }
export function validRedditVideoURL(str) { return !!str.match(/^https?:\/\/(\w+\.)?redd.it\/(\w*\w*)+(\.[a-zA-Z0-9]{3})?$/); }
export function validGfyURL(str) { return !!str.match(/^(http(s)?:\/\/)?((w){3}.)?gfycat(.com)?\/\w*/); }
export function validRedGifURL(str) { return !!str.match(/^https?:\/\/(\w+\.)?redgifs.com\/(\w*\/)?(\w*\w*)$/); }
export function validSCURL(str) { return !!str.match(/^https?:\/\/(soundcloud\.com|snd\.sc)\/(.+)?/); }
export function validMSURL(str) { return !!str.match(/^(https?:\/\/)?musescore\.com\/(user\/\d+\/scores\/\d+|[\w-]+\/(scores\/\d+|[\w-]+))[#\?]?$/); }
export function validPHURL(str) { return !!str.match(/^(https?:\/\/)(\w+\.)?pornhub\.com\/view_video\.php\?viewkey=\w+\/?$/); }
export function decodeHtmlEntity(str: string) { return str?.replace(/&#(\d+);/g, (_match, dec) => String.fromCharCode(dec)).replace(/&quot;/g, `"`).replace(/&amp;/g, `&`); }
export function encodeHtmlEntity(str) {
    const buf = [];
    for (var i = str.length - 1; i >= 0; i--) buf.unshift(["&#", str[i].charCodeAt(), ";"].join(""));
    return buf.join("");
}

export function shuffleArray(array: any[], start: number = 0) {
    const temp = array.splice(0, start);
    for (let i = array.length - 1; i > 0; i--) {
      let j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return temp.concat(array);
}
export function moveArray(array, index) {
    const a1 = array.splice(0, index);
    return array.concat(a1);
}
export async function findUser(message: Discord.Message, str: string) {
    if (isNaN(parseInt(str))) if (!str.startsWith("<@")) {
        await message.channel.send("**" + str + "** is neither a mention or ID.");
        return;
    }
    const userID = str.replace(/<@/g, "").replace(/!/g, "").replace(/>/g, "");
    try {
        return await message.client.users.fetch(userID);
    } catch (err: any) {
        await message.channel.send("No user was found!");
    }
    return;
}
export async function findMemberWithGuild(guild: Discord.Guild, str: string): Promise<Discord.GuildMember> {
    if (isNaN(parseInt(str))) if (!str.startsWith("<@")) throw "**" + str + "** is neither a mention or ID.";
    const userID = str.replace(/<@/g, "").replace(/!/g, "").replace(/>/g, "");
    try {
        return await guild.members.fetch(userID);
    } catch (err: any) {
        throw "No user was found!";
    }
}
export async function findMember(message: Discord.Message, str: string): Promise<Discord.GuildMember> {
    try {
        return await findMemberWithGuild(message.guild, str);
    } catch (err: any) {
        await message.channel.send(err);
    }
}
export async function findRole(guild: Discord.Guild, str: string) {
    var roleID = str.replace(/<@&/g, "").replace(/>/g, "");
    try {
        var role: Discord.Role;
        if (isNaN(parseInt(roleID))) role = guild.roles.cache.find(x => x.name.toLowerCase() === str.toLowerCase());
        else role = await guild.roles.fetch(roleID);
        if (!role) throw new Error();
        return role;
    } catch (err) {
        return null;
    }
}
export async function findChannel(parent: Discord.Guild, str: string) {
    var channelID = str.replace(/<@&/g, "").replace(/>/g, "");
    try {
        var channel: Discord.Channel;
        if (isNaN(parseInt(channelID))) channel = parent.channels.cache.find(x => x.name.toLowerCase() === str.toLowerCase());
        else channel = await parent.channels.fetch(channelID);
        if (!channel) throw new Error();
        else return channel;
    } catch (err) {
        return null;
    }
}
export function getRandomNumber(min, max) { return Math.random() * (max - min) + min; }
export function applyText(canvas, text) {
    const ctx = canvas.getContext("2d");
    var fontSize = canvas.width / 12;
    do ctx.font = `${(fontSize -= 5)}px sans-serif`;
    while (ctx.measureText(text).width > canvas.width - 100);
    return ctx.font;
}
export function numberWithCommas(x) {
    x = x.toString();
    const pattern = /(-?\d+)(\d{3})/;
    while (pattern.test(x)) x = x.replace(pattern, "$1,$2");
    return x;
}
export function isGoodMusicVideoContent(videoSearchResultItem) {
    const contains = (string, content) => !!~(string || "").indexOf(content);
    return (contains(videoSearchResultItem.author ? videoSearchResultItem.author.name : undefined, "VEVO") || contains(videoSearchResultItem.author ? videoSearchResultItem.author.name.toLowerCase() : undefined, "official") || contains(videoSearchResultItem.title.toLowerCase(), "official") || !contains(videoSearchResultItem.title.toLowerCase(), "extended"));
}
export function elegantPair(x, y) { return x >= y ? x * x + x + y : y * y + x; }
export function elegantUnpair(z) {
    const sqrtz = Math.floor(Math.sqrt(z)), sqz = sqrtz * sqrtz;
    return z - sqz >= sqrtz ? [sqrtz, z - sqz - sqrtz] : [z - sqz, sqrtz];
}
export function jsDate2Mysql(newDate: Date | number) {
    if (typeof newDate === "number") newDate = new Date(newDate);
    function twoDigits(d) {
        if (0 <= d && d < 10) return "0" + d.toString();
        if (-10 < d && d < 0) return "-0" + (-1 * d).toString();
        return d.toString();
    }
    var date = newDate.getDate();
    var month = newDate.getMonth();
    var year = newDate.getFullYear();
    var hour = newDate.getHours();
    var minute = newDate.getMinutes();
    var second = newDate.getSeconds();
    var newDateSql =
        year +
        "-" +
        twoDigits(month + 1) +
        "-" +
        twoDigits(date) +
        " " +
        twoDigits(hour) +
        ":" +
        twoDigits(minute) +
        ":" +
        twoDigits(second);
    return newDateSql;
}
export function getWithWeight(input) {
    const array = [];
    for (const item in input) if (input.hasOwnProperty(item)) for (var i = 0; i < input[item]; i++) array.push(item);
    return array[Math.floor(Math.random() * array.length)];
}
export function hexToRgb(hex) {
    hex = hex.replace(/^#?([a-f\d])([a-f\d])([a-f\d])$/i, (_m, r, g, b) => (r + r + g + g + b + b));

    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}
export function decimalToRgb(decimal) {
    return {
        r: (decimal >> 16) & 0xff,
        g: (decimal >> 8) & 0xff,
        b: decimal & 0xff,
    };
}
export function readableDate(date: Date) { return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear}`; }
export function readableDateTime(date: Date) {
    const day = date.getDate();
    const month = date.getMonth();
    const year = date.getFullYear();
    const hour = date.getHours();
    const minute = date.getMinutes();
    const second = date.getSeconds();

    var dateTime =
        twoDigits(day) +
        "/" +
        twoDigits(month + 1) +
        "/" +
        twoDigits(year) +
        " " +
        twoDigits(hour) +
        ":" +
        twoDigits(minute) +
        ":" +
        twoDigits(second) +
        " UTC";
    return dateTime;
}
export function readableDateTimeText(time: number) {
    var sec = time / 1000;
    var dd = Math.floor(sec / 86400);
    var dh = Math.floor((sec % 86400) / 3600);
    var dm = Math.floor(((sec % 86400) % 3600) / 60);
    var ds = Math.floor(((sec % 86400) % 3600) % 60);
    var dmi = Math.floor(time - dd * 86400000 - dh * 3600000 - dm * 60000 - ds * 1000);
    var d = "";
    var h = "";
    var m = "";
    var s = "";
    var mi = "";
    if (dd !== 0) d = " " + dd + " days";
    if (dh !== 0) h = " " + dh + " hours";
    if (dm !== 0) m = " " + dm + " minutes";
    if (ds !== 0) s = " " + ds + " seconds";
    if (dmi !== 0) mi = " " + dmi + " milliseconds";
    return d + h + m + s + mi;
}
export function ms(val: string) {
    if (typeof val === "string" && superms(val) === undefined) {
        if (val.split(":").length > 1) {
            const nums = val.split(":").reverse();
            const units = ["s", "m", "h", "d"];
            const mses = [];
            for (const num of nums) {
                const str = `${parseInt(num)}${units[nums.indexOf(num)]}`;
                const parsed = superms(str);
                if (parsed === undefined) return undefined;
                mses.push(parsed);
            }
            return mses.reduce((acc, c) => acc + c);
        }
        var mses = [];
        let temp = "";
        let last = "";
        for (let i = 0; i < val.length; i++) {
            let char = val.substr(i, 1);
            if (!/\d/.test(last) && /\d/.test(char) && i != 0) {
                if (superms(temp) === undefined) return undefined;
                mses.push(superms(temp));
                temp = "";
            }
            temp += char;
            if (val[i + 1] === undefined) mses.push(superms(temp));
        }
        return mses.reduce((acc, c) => acc + c);
    } else return superms(val);
}
export function findValueByPrefix(object, prefix) {
    for (const property in object) if (object[property] && property.toString().startsWith(prefix)) return object[property];
    return undefined;
}
export function isEquivalent(a, b) {
    var aProps = Object.getOwnPropertyNames(a);
    var bProps = Object.getOwnPropertyNames(b);
    if (aProps.length != bProps.length) return false;
    for (var i = 0; i < aProps.length; i++) {
        var propName = aProps[i];
        if (a[propName] !== b[propName]) return false;
    }
    return true;
}
export async function ID() {
    const buffer: Buffer = await new Promise((resolve, reject) => crypto.randomBytes(24, async (err, buffer) => err ? reject(err) : resolve(buffer)));
    return buffer.toString("hex");
}
export async function createEmbedScrolling(message: Discord.Message | NorthInteraction | { interaction: NorthInteraction, useEdit: boolean }, allEmbeds: Discord.MessageEmbed[], id: number = 0, additionalData: any = undefined) {
    var author: Discord.Snowflake;
    if (message instanceof Discord.Message) author = message.author.id;
    else if (message instanceof Discord.Interaction) author = message.user.id;
    else author = message.interaction.user.id;
    const filter = (reaction: Discord.MessageReaction, user: Discord.User) => (["◀", "▶", "⏮", "⏭", "⏹"].includes(reaction.emoji.name) && user.id === author);
    var s = 0;
    var msg: Discord.Message;
    if (message instanceof Discord.Message) msg = await message.channel.send({ embeds: [allEmbeds[0]]});
    else if (message instanceof Discord.Interaction) msg = <Discord.Message> await message.reply({ embeds: [allEmbeds[0]], fetchReply: true });
    else {
        if (message.useEdit) msg = <Discord.Message> await message.interaction.editReply({ embeds: [allEmbeds[0]] });
        else msg = <Discord.Message> await message.interaction.reply({ embeds: [allEmbeds[0]], fetchReply: true });
    }
    await msg.react("⏮");
    await msg.react("◀");
    await msg.react("▶");
    await msg.react("⏭");
    await msg.react("⏹");
    const collector = msg.createReactionCollector({ filter, idle: 60000 });
    collector.on("collect", function (reaction, user) {
        reaction.users.remove(user.id).catch(() => {});
        switch (reaction.emoji.name) {
            case "⏮":
                s = 0;
                msg.edit({ embeds: [allEmbeds[s]] });
                break;
            case "◀":
                s -= 1;
                if (s < 0) {
                    s = allEmbeds.length - 1;
                }
                msg.edit({ embeds: [allEmbeds[s]] });
                break;
            case "▶":
                s += 1;
                if (s > allEmbeds.length - 1) {
                    s = 0;
                }
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
    });
    collector.on("end", async () => {
        msg.reactions.removeAll().catch(() => {});
        if (id == 1) {
            await msg.edit({ content: "Loading simplier version...", embeds: [] });
            await msg.edit("https://sky.shiiyu.moe/stats/" + additionalData.res[0].name);
        } else if (id == 2) setTimeout(() => msg.edit({ embeds: [], content: `**[Lyrics of ${additionalData.title}**]` }).catch(() => {}), 10000);
        else if (id == 3) setTimeout(() => msg.edit({ embeds: [], content: `**[Queue: ${additionalData.songArray.length} tracks in total]**` }).catch(() => {}), 60000);
    });
    return { msg, collector };
}
export async function commonCollectorListener(reaction, user, s, allEmbeds, msg, collector) {
    reaction.users.remove(user.id).catch(() => {});
    switch (reaction.emoji.name) {
        case "⏮":
            s = 0;
            await msg.edit({ embeds: [allEmbeds[s]] });
            break;
        case "◀":
            s -= 1;
            if (s < 0) s = allEmbeds.length - 1;
            await msg.edit({ embeds: [allEmbeds[s]] });
            break;
        case "▶":
            s += 1;
            if (s > allEmbeds.length - 1) s = 0;
            await msg.edit({ embeds: [allEmbeds[s]] });
            break;
        case "⏭":
            s = allEmbeds.length - 1;
            await msg.edit({ embeds: [allEmbeds[s]] });
            break;
        case "⏹":
            collector.emit("end");
            break;
    }
    return { s, msg };
}
export function streamToString(stream, enc = undefined) {
    var str = ''
    return new Promise((resolve, reject) => {
        stream.on('data', (data) => str += (typeof enc === 'string') ? data.toString(enc) : data.toString());
        stream.on('end', () => resolve(str));
        stream.on('error', (err) => reject(err));
    })
}
export function genPermMsg(permissions: number, id) {
    if (id == 0) return `You need the permissions \`${new Discord.Permissions(BigInt(permissions)).toArray().join("`, `")}\` to use this command.`;
    else return `I need the permissions \`${new Discord.Permissions(BigInt(permissions)).toArray().join("`, `")}\` to run this command.`;
}
export function color() { return Math.floor(Math.random() * 16777214) + 1; }
export function replaceMsgContent(msg, guild, client, member, flag) {
    const splitMessage = msg.split(" ");
    const messageArray = [];
    for (const word of splitMessage) {
        if (word.match(/^\{\#\w+\}$/)) {
            const str = word.replace(/[\{\#\}]/g, "");
            if (isNaN(parseInt(str))) {
                const mentionedChannel = guild.channels.find(x => x.name === str);
                if (!mentionedChannel) messageArray.push("#" + str);
                else messageArray.push(mentionedChannel);
            } else {
                const mentionedChannel = guild.channels.resolve(str);
                if (!mentionedChannel) messageArray.push("<#" + str + ">");
                else messageArray.push(mentionedChannel);
            }
        } else if (word.match(/^\{\@\&\w+\}$/)) {
            const str = word.replace(/[\{\@\&\}]/g, "");
            if (isNaN(parseInt(str))) {
                const mentionedRole = guild.roles.find(x => x.name === str);
                if (!mentionedRole) messageArray.push("@" + str);
                else messageArray.push(mentionedRole);
            } else {
                const mentionedRole = guild.roles.get(str);
                if (!mentionedRole) messageArray.push("<@&" + str + ">");
                else messageArray.push(mentionedRole);
            }
        } else if (word.match(/^\{\@\w+\}$/)) {
            const str = word.replace(/[\{\@\}]/g, "");
            if (isNaN(parseInt(str))) {
                const mentionedUser = client.users.find(x => x.name === str);
                if (!mentionedUser) messageArray.push("@" + str);
                else messageArray.push(mentionedUser);
            } else {
                const mentionedUser = client.users.get(str);
                if (!mentionedUser) messageArray.push("<@" + str + ">");
                else messageArray.push(mentionedUser);
            }
        } else messageArray.push(word);
    }
    if (flag === "welcome") return messageArray.join(" ").replace(/\{user\}/ig, member);
    else if (flag === "leave") return messageArray.join(" ").replace(/\{user\}/ig, member.user.tag);
}
export async function requestStream(url) {
    const fetched = await fetch(url);
    return { data: fetched.body, status: fetched.status };
}
export function capitalize(s) { return (typeof s !== 'string') ? '' : s.charAt(0).toUpperCase() + s.slice(1); }
export function wait(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
export function bufferToStream(buf, chunkSize = undefined) {
    if (typeof buf === 'string') buf = Buffer.from(buf, 'utf8');
    if (!Buffer.isBuffer(buf)) throw new TypeError(`"buf" argument must be a string or an instance of Buffer`);
    const reader = new Readable();
    const hwm = reader.readableHighWaterMark;
    if (!chunkSize || typeof chunkSize !== 'number' || chunkSize < 1 || chunkSize > hwm) chunkSize = hwm;
    const len = buf.length;
    let start = 0;
    reader._read = () => {
        while (reader.push(buf.slice(start, (start += chunkSize)))) if (start >= len) {
            reader.push(null);
            break;
        }
    }
    return reader;
}
export function mergeObjArr(obj, keys) {
    const arr = [];
    for (const key of keys) if (obj[key]) arr.push(obj[key]);
    return [].concat.apply([], arr);
}
export async function profile(str: string) {
    if (str.match(/^\w{3,16}$/)) return await mcapi.mojang.getUUID(str);
    const history = (<{name: string, changedToAt: number}[]> <unknown> (await nameHistory(str))).sort((a, b) => (b.changedToAt || 0) - (a.changedToAt || 0));
    return await mcapi.mojang.getUUID(history[0].name);
}
export async function nameToUuid(str) {
    return (await profile(str)).id;
}
export async function nameHistory(str: string) {
    if (str.match(/^\w{3,16}$/)) return await (await profile(str)).getNameHistory();
    return await mcapi.mojang.getNameHistory(str);
}
export function duration(seconds: number, type: moment.unitOfTime.DurationConstructor = "seconds") {
    const duration = moment.duration(seconds, type);
    const str = [];
    if (duration.hours()) str.push(twoDigits(duration.hours()) + ":");
    str.push(twoDigits(duration.minutes()) + ":");
    str.push(twoDigits(duration.seconds()));
    return str.join("");
}
export function getKeyByValue(object, value) {
    return Object.keys(object).find(key => object[key] === value);
}
export function commonModerationEmbed(guild: Discord.Guild, author: Discord.User, member: Discord.GuildMember, word: string, past: string, reason: string = undefined) {
    const color = () => Math.floor(Math.random() * 16777214) + 1;
    const capitalize = (s) => (typeof s !== 'string') ? '' : s.charAt(0).toUpperCase() + s.slice(1);
    const notiEmbed = new Discord.MessageEmbed()
        .setColor(color())
        .setTitle(`You've been ${past}`)
        .setDescription(`In **${guild.name}**`)
        .setTimestamp()
        .setFooter({ text: `${capitalize(past)} by ${author.tag}`, iconURL: author.displayAvatarURL() });
    if (reason) notiEmbed.addField("Reason", reason);
    const successfulEmbed = new Discord.MessageEmbed()
        .setColor(color())
        .setTitle(`User ${capitalize(past)}!`)
        .setDescription(`${capitalize(past)} **${member.user?.tag || member.displayName}** in server **${guild.name}**.`);
    const failureEmbed = new Discord.MessageEmbed()
        .setColor(color())
        .setTitle(`Failed to ${word} the user!`)
        .setDescription(`Couldn't ${word} **${member.user?.tag || member.displayName}** in server **${guild.name}**.`);
    return [notiEmbed, successfulEmbed, failureEmbed];
}
export function commonRoleEmbed(client, word, past, name) {
    const color = () => Math.floor(Math.random() * 16777214) + 1;
    const capitalize = (s) => (typeof s !== 'string') ? '' : s.charAt(0).toUpperCase() + s.slice(1);
    const failEmbed = new Discord.MessageEmbed()
        .setColor(color())
        .setTitle(`Failed to ${word} role`)
        .setDescription(`Failed to ${word} the role **${name}**`)
        .setTimestamp()
        .setFooter({ text: "Have a nice day! :)", iconURL: client.user.displayAvatarURL() });
    const successEmbed = new Discord.MessageEmbed()
        .setColor(color())
        .setTitle(`Role ${past} Successfully`)
        .setDescription(`${capitalize(past)} a new role **${name}**`)
        .setTimestamp()
        .setFooter({ text: "Have a nice day! :)", iconURL: client.user.displayAvatarURL() });
    return [successEmbed, failEmbed];
}
export async function msgOrRes(message: Discord.Message | Discord.CommandInteraction, str: string | Discord.MessageEmbed | Discord.MessageAttachment | { content?: string, embeds?: Discord.MessageEmbed[], files?: Discord.MessageAttachment[], components?: Discord.MessageActionRow[] }, reply: boolean = false): Promise<Discord.Message> {
    if (message instanceof Discord.Message) {
        if (reply) {
            if (str instanceof Discord.MessageEmbed) return await message.reply({ embeds: [str] });
            else if (str instanceof Discord.MessageAttachment) return await message.reply({ files: [str] });
            else return await message.reply(str);
        } else {
            if (str instanceof Discord.MessageEmbed) return await message.channel.send({ embeds: [str] });
            else if (str instanceof Discord.MessageAttachment) return await message.channel.send({ files: [str] });
            else return await message.channel.send(str);
        }
    } else {
        const useEdit = message.deferred, useFollowUp = message.replied;
        if (useEdit) {
            if (str instanceof Discord.MessageEmbed) return <Discord.Message> await message.editReply({ embeds: [str] });
            else if (str instanceof Discord.MessageAttachment) return <Discord.Message> await message.editReply({ files: [str] });
            else return <Discord.Message> await message.editReply(str);
        } else if (useFollowUp) {
            if (typeof str === "string") return <Discord.Message> await message.followUp({ content: str, fetchReply: true });
            else if (str instanceof Discord.MessageEmbed) return <Discord.Message> await message.followUp({ embeds: [str], fetchReply: true });
            else if (str instanceof Discord.MessageAttachment) return <Discord.Message> await message.followUp({ files: [str], fetchReply: true });
            else return <Discord.Message> await message.followUp({ fetchReply: true, ...str });
        } else {
            if (typeof str === "string") return <Discord.Message> await message.reply({ content: str, fetchReply: true });
            else if (str instanceof Discord.MessageEmbed) return <Discord.Message> await message.reply({ embeds: [str], fetchReply: true });
            else if (str instanceof Discord.MessageAttachment) return <Discord.Message> await message.reply({ files: [str], fetchReply: true });
            else return <Discord.Message> await message.reply({ fetchReply: true, ...str });
        }
    }
}
export function deepReaddir(dir: string) {
    var results = [];
    const list = fs.readdirSync(dir);
    var i = 0;
    function next() {
        var file = list[i++];
        if (!file) return results;
        file = path.resolve(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            const res = deepReaddir(file);
            results = results.concat(res);
            return next();
        } else {
            results.push(file);
            return next();
        }
    };
    return next();
}
export async function  xmlToJson(xml) {
    return new Promise((resolve, reject) => parseString(xml, (err, result) => {
        if (err) reject(err);
        else resolve(result);
    }));
}
export function flatDeep(arr, d = 1) {
    return d > 0 ? arr.reduce((acc, val) => acc.concat(Array.isArray(val) ? flatDeep(val, d - 1) : val), [])
        : arr.slice();
}

export function getFetch() {
    return fetch;
}

export function isImageUrl(url, timeoutT = 0) {
    return new Promise(function (resolve, reject) {
        var timeout = timeoutT || 5000;
        var timer, img = new Image();
        img.onerror = img.onabort = function () {
            clearTimeout(timer);
            reject(false);
        };
        img.onload = function () {
            clearTimeout(timer);
            resolve(true);
        };
        timer = setTimeout(function () {
            img.src = "//!!!!/test.jpg";
            reject(true);
        }, timeout);
        img.src = url;
    });
}

export async function getOwner() {
	if (!globalClient.application?.owner) await globalClient.application?.fetch();
    return globalClient.application?.owner.id;
}

export function isValidMCVer(version: string) {
    if (!version) return false;
    const splitted = version.split(".");
    if (splitted.length > 3) return false;
    for (let ii = 0; ii < splitted.length; ii++) {
        const subVer = splitted[ii];
        if (!parseInt(subVer)) return false;
        if (ii == 0 && parseInt(subVer) > 1) return false;
    }
    return true;
}

export function mutate(array: any[], fromIndex: number, toIndex: number) {
	const startIndex = fromIndex < 0 ? array.length + fromIndex : fromIndex;

	if (startIndex >= 0 && startIndex < array.length) {
		const endIndex = toIndex < 0 ? array.length + toIndex : toIndex;

		const [item] = array.splice(fromIndex, 1);
		array.splice(endIndex, 0, item);
	}
}

export function requestYTDLStream(url: string, opts: downloadOptions & { timeout?: number }) {
    const timeoutMS = opts.timeout || 120000;
    const getStream = new Promise(async (resolve, reject) => {
        const options = <any> opts;
        if (process.env.COOKIE) {
          options.requestOptions = {};
          options.requestOptions.headers = { cookie: process.env.COOKIE };
          if (process.env.YT_TOKEN) options.requestOptions.headers["x-youtube-identity-token"] = process.env.YT_TOKEN;
        }
        const stream = await ytdl(url, options);
        stream.on("finish", () => resolve(stream)).on("error", err => reject(err));
    });
    return Promise.race([wait(timeoutMS), getStream]);
}

export async function fixGuildRecord(id: Discord.Snowflake) {
    if (NorthClient.storage.guilds[id]) return NorthClient.storage.guilds[id];
    const results = await query("SELECT id FROM servers WHERE id = " + id);
    if (results.length > 0) {
        if (results[0].queue || results[0].looping || results[0].repeating) {
            var queue = [];
            try { if (results[0].queue) queue = JSON.parse(unescape(results[0].queue)); }
            catch (err: any) { console.error(`Error parsing queue of ${results[0].id}`); }
            setQueue(results[0].id, queue, !!results[0].looping, !!results[0].repeating);
        }
        NorthClient.storage.guilds[results[0].id] = new GuildConfig(results[0]);
    } else {
        try {
            await query(`INSERT INTO servers (id, autorole, giveaway, safe) VALUES ('${id}', '[]', '${escape("🎉")}', 1)`);
            NorthClient.storage.guilds[id] = new GuildConfig();
        } catch (err: any) { }
    }
    return NorthClient.storage.guilds[id];
}

export function humanDurationToNum(duration: string) {
    const splitted = duration.split(".");
    const rest = splitted[0];
    const splitted1 = rest.split(":").reverse();
    var sec = 0;
    for (let i = 0; i < splitted1.length; i++) {
        let parsed;
        if (isNaN(parsed = parseInt(splitted1[i]))) continue;
        sec += parsed * Math.pow(60, i);
    }
    return sec;
}

export function getText(key: string, lang: string = "en") {
    if (!key) return "";
    const languageJson = require(`../lang/${lang}.json`);
    var str, inited = false;
    for (const kk of key.split(".")) {
        if (!inited) {
            str = languageJson[kk];
            inited = true;
            if (!str) return "";
            continue;
        }
        str = str[kk];
        if (!str) return "";
    }
    if (!(typeof str === "string")) return "";
    return str;
}

export async function query(query: string) {
    const res = await fetch("http://localhost:4269/api/" + encodeURIComponent(query) + "?token=" + process.env.DB_TOKEN);
    if (!res.ok) return null;
    else return <any> await res.json();
}

export async function checkTradeW1nd(guild: Discord.Snowflake) {
    const res = await fetch("http://localhost:3000/checkGuild/" + guild);
    return res.ok && (<any> await res.json()).isIn;
}

export async function getTradeW1ndStats() {
    const res = await fetch("http://localhost:3000");
    if (!res.ok) return null;
    return <{ version: string, size: number, lastReady: number, uptime: number }> await res.json();
}

export async function syncTradeW1nd(guild: Discord.Snowflake) {
    const config = NorthClient.storage.guilds[guild];
    if (!config) return;
    await fetch(`http://localhost:3000/update/${guild}`, { method: "post", body: JSON.stringify(config), headers: { "Content-Type": "application/json" } });
}

export async function tradeW1ndAct(interaction: Discord.CommandInteraction, author: Discord.Snowflake, command: string) {
    const channel = interaction.channel;
    await interaction.deferReply();
    var res = await fetch("http://localhost:3000/checkChannel/" + channel.id);
    if (!res.ok) return await interaction.editReply("I've found TradeW1nd on this server, but I cannot talk to him! Try again later.");
    if (!(<any> await res.json()).canUse) return await interaction.editReply("I've found TradeW1nd on this server, but he cannot talk in this channel! Find an admin to help him!");
    // Best act of the century
    res = await fetch("http://localhost:3000/act", { method: "post", body: JSON.stringify({ channel: channel.id, botId: interaction.client.user.id }), headers: { "Content-Type": "application/json" } });
    if (!res.ok) return await interaction.editReply("TradeW1nd seems to be having some trouble. Try again later.");
    const { id } = await interaction.editReply("hey <@895321877109690419>");
    await channel.awaitMessages({ filter: m => m.author.id == "895321877109690419", max: 1 });
    await interaction.followUp(`pls help run this command from <@${author}>`);
    await fetch("http://localhost:3000/run", { method: "post", body: JSON.stringify({ channel: channel.id, command, author, msgId: id }), headers: { "Content-Type": "application/json" } });
}

export async function updateGuildMemberMC(member: Discord.GuildMember, mcUuid: string) {
    const { name } = await profile(mcUuid);
    const res = await fetch(`https://api.slothpixel.me/api/players/${name}?key=${process.env.API}`).then(res => <any> res.json());
    const mcLen = res.username.length + 1;
    const bw = res.stats.BedWars;
    const firstHalf = `[${bw.level}⭐|${bw.final_k_d}]`;
    if (firstHalf.length + mcLen > 32) await member.setNickname(`${firstHalf} ${res.username.slice(0, 28 - firstHalf.length)}...`);
    else await member.setNickname(`${firstHalf} ${res.username}`);
    const gInfo = <any> await fetch(`https://api.slothpixel.me/api/guilds/${mcUuid}?key=${process.env.API}`).then(res => res.json());
    const roles = member.roles;
    if (gInfo.id === "5b25306a0cf212fe4c98d739") await roles.add("622319008758104064");
    await roles.add("676754719120556042");
    await roles.add("837345908697989171");
    await roles.remove("837345919010603048");
  
    await roles.remove(["851471525802803220", "851469005168181320", "851469138647842896", "851469218310389770", "851469264664789022", "851469323444944907", "851469358076788766", "851469389806829596", "851469422971584573", "851469455791489034", "851469501115793408", "851469537030307870", "851469565287858197", "851469604840013905", "851469652940161084", "851469683764887572", "851469718955229214", "851469754677985280", "851469812050690068", "851469858675097660", "851469898547068938", "851469933606862848", "851469969685479424", "851470006520905748", "851470041031245854", "851470070022406204", "851470099558039622", "851470140410822677", "851470173503881218", "851470230370910248", "851471153188569098"]);
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
  }