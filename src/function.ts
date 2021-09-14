import { NorthClient, NorthInteraction } from "./classes/NorthClient";
import crypto from "crypto";
import { globalClient } from "./common";
import * as Discord from "discord.js";
import originalFetch from "node-fetch";
import fetchBuilder from "fetch-retry-ts";
import { parseString } from "xml2js";
import superms from "ms";
import { mojang } from "aio-mc-api";
import * as fs from "fs";
import * as path from "path";
import * as moment from "moment";
import formatSetup from "moment-duration-format";
formatSetup(moment);
import { Readable } from "stream";
import ytdl, { downloadOptions } from "ytdl-core";
import { RowDataPacket } from "mysql2/promise";
import { setQueue } from "./helpers/music";
const fetch = fetchBuilder(originalFetch, { retries: 5, retryDelay: attempt => Math.pow(2, attempt) * 1000 });

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
export async function findRole(message, str, suppress = false) {
    var roleID = str.replace(/<@&/g, "").replace(/>/g, "");
    if (isNaN(parseInt(roleID))) {
        var role = await message.guild.roles.cache.find(x => x.name.toLowerCase() === str);
        if (!role) {
            if (!suppress) await message.channel.send("No role was found with the name " + str);
            return null;
        }
    } else {
        var role = await message.guild.roles.cache.get(roleID);
        if (!role) {
            if (!suppress) await message.channel.send("No role was found!");
            return null;
        }
    }
    return role;
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
export function jsDate2Mysql(newDate) {
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
export function readableDate(date) { return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear}`; }
export function readableDateTime(date) {
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
        reaction.users.remove(user.id);
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
    return { msg: msg, collector: collector };
}
export async function commonCollectorListener(reaction, user, s, allEmbeds, msg, collector) {
    reaction.users.remove(user.id);
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
    if (str.match(/^\w{3,16}$/)) return await mojang.getUUID(str);
    const history = (<{name: string, changedToAt: number}[]> <unknown> (await nameHistory(str))).sort((a, b) => (b.changedToAt || 0) - (a.changedToAt || 0));
    return await mojang.getUUID(history[0].name);
}
export async function nameToUuid(str) {
    return (await profile(str)).id;
}
export async function nameHistory(str: string) {
    if (str.match(/^\w{3,16}$/)) return await (await profile(str)).getNameHistory();
    return await mojang.getNameHistory(str);
}
export function duration(seconds) {
    return moment.duration(seconds, "seconds").format();
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
        .setFooter(`${capitalize(past)} by ${author.tag}`, author.displayAvatarURL());
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
        .setFooter("Have a nice day! :)", client.user.displayAvatarURL());
    const successEmbed = new Discord.MessageEmbed()
        .setColor(color())
        .setTitle(`Role ${past} Successfully`)
        .setDescription(`${capitalize(past)} a new role **${name}**`)
        .setTimestamp()
        .setFooter("Have a nice day! :)", client.user.displayAvatarURL());
    return [successEmbed, failEmbed];
}
export async function msgOrRes(message: Discord.Message | NorthInteraction, str: any): Promise<Discord.Message> {
    if (message instanceof Discord.Message) {
        if (typeof str === "string") return await message.channel.send(str);
        else if (str instanceof Discord.MessageEmbed) return await message.channel.send({ embeds: [str] });
        else if (str instanceof Discord.MessageAttachment) return await message.channel.send({ files: [str] });
    } else {
        const useEdit = message.deferred, useFollowUp = message.replied;
        if (useFollowUp) {
            if (typeof str === "string") return <Discord.Message> await message.followUp({ content: str, fetchReply: true });
            else if (str instanceof Discord.MessageEmbed) return <Discord.Message> await message.followUp({ embeds: [str], fetchReply: true });
            else if (str instanceof Discord.MessageAttachment) return <Discord.Message> await message.followUp({ files: [str], fetchReply: true });
        } else if (useEdit) {
            if (typeof str === "string") return <Discord.Message> await message.editReply({ content: str });
            else if (str instanceof Discord.MessageEmbed) return <Discord.Message> await message.editReply({ embeds: [str] });
            else if (str instanceof Discord.MessageAttachment) return <Discord.Message> await message.editReply({ files: [str] });
        } else {
            if (typeof str === "string") return <Discord.Message> await message.reply({ content: str, fetchReply: true });
            else if (str instanceof Discord.MessageEmbed) return <Discord.Message> await message.reply({ embeds: [str], fetchReply: true });
            else if (str instanceof Discord.MessageAttachment) return <Discord.Message> await message.reply({ files: [str], fetchReply: true });
        }
    }
    return null;
}
export function deepReaddir(dir) {
    var results = [];
    const list = fs.readdirSync(dir);
    var i = 0;
    function next() {
        var file = list[i++];
        if (!file) return results;
        file = path.resolve(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            const res = module.exports.deepReaddir(file);
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
    const timeout = new Promise((resolve) => setTimeout(() => resolve(null), timeoutMS));
    const getStream = new Promise((resolve, reject) => {
        const options = <any> opts;
        if (process.env.COOKIE) {
          options.requestOptions = {};
          options.requestOptions.headers = { cookie: process.env.COOKIE };
          if (process.env.YT_TOKEN) options.requestOptions.headers["x-youtube-identity-token"] = process.env.YT_TOKEN;
        }
        const stream = ytdl(url, options);
        stream.on("finish", () => resolve(stream)).on("error", err => reject(err));
    });
    return Promise.race([timeout, getStream]);
}

export async function fixGuildRecord(id: Discord.Snowflake) {
    if (NorthClient.storage.guilds[id]) return NorthClient.storage.guilds[id];
    const [results] = <RowDataPacket[][]> await globalClient.pool.query("SELECT id FROM servers WHERE id = " + id);
    if (results.length > 0) {
        NorthClient.storage.guilds[results[0].id] = {};
        if (results[0].queue || results[0].looping || results[0].repeating) {
            var queue = [];
            try { if (results[0].queue) queue = JSON.parse(unescape(results[0].queue)); }
            catch (err: any) { console.error(`Error parsing queue of ${results[0].id}`); }
            setQueue(results[0].id, queue, !!results[0].looping, !!results[0].repeating);
        }
        if (results[0].prefix) NorthClient.storage.guilds[results[0].id].prefix = results[0].prefix;
        else NorthClient.storage.guilds[results[0].id].prefix = globalClient.prefix;
        NorthClient.storage.guilds[results[0].id].token = results[0].token;
        NorthClient.storage.guilds[results[0].id].giveaway = unescape(results[0].giveaway);
        NorthClient.storage.guilds[results[0].id].welcome = {
            message: results[0].welcome,
            channel: results[0].wel_channel,
            image: results[0].wel_img,
            autorole: results[0].autorole
        };
        NorthClient.storage.guilds[results[0].id].leave = {
            message: results[0].leave_msg,
            channel: results[0].leave_channel
        };
        NorthClient.storage.guilds[results[0].id].boost = {
            message: results[0].boost_msg,
            channel: results[0].boost_channel
        };
    } else {
        try {
            await globalClient.pool.query(`INSERT INTO servers (id, autorole, giveaway) VALUES ('${id}', '[]', '${escape("🎉")}')`);
            NorthClient.storage.guilds[id] = {};
        } catch (err: any) { }
    }
    return NorthClient.storage.guilds[id];
}