import { GuildConfig, NorthClient, NorthInteraction } from "./classes/NorthClient.js";
import crypto from "crypto";
import { globalClient, localIp } from "./common.js";
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
import cvs, { Canvas } from "canvas";
import { escape } from "mysql2";
const { Image } = cvs;
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
export const __dirname = path.dirname(__filename);

// Helper functions
export function twoDigits(d: number) {
    if (0 <= d && d < 10) return "0" + d.toString();
    if (-10 < d && d < 0) return "-0" + (-1 * d).toString();
    return d.toString();
}
export function applyText(canvas: Canvas, text: string) {
    const ctx = canvas.getContext("2d");
    var fontSize = canvas.width / 12;
    do ctx.font = `${(fontSize -= 5)}px sans-serif`;
    while (ctx.measureText(text).width > canvas.width - 100);
    return ctx.font;
}
export function getFont(canvas: Canvas, text: string, fraction: number) {
    const ctx = canvas.getContext("2d");
    const width = canvas.width * fraction;
    let fontSize = canvas.width / 12;
    do {
        ctx.font = `regular ${(fontSize -= 5)}px "NotoSans", "free-sans", Arial`;
    } while (ctx.measureText(text).width > width);
    return ctx.font;
}
export function roundTo(num: number, decimal: number) {
    const powed = Math.pow(10, decimal);
    return Math.round((num + Number.EPSILON) * powed) / powed;
}
export function deepReaddir(dir: string): string[] {
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

// String operations
export function capitalize(s: string) { return s.charAt(0).toUpperCase() + s.slice(1); }
export function wait(ms: number) { return new Promise(resolve => setTimeout(resolve, ms)); }
export function decodeHtmlEntity(str: string) { return str?.replace(/&#(\d+);/g, (_match, dec) => String.fromCharCode(dec)).replace(/&quot;/g, `"`).replace(/&amp;/g, `&`); }
export async function xmlToJson(xml: string) {
    return new Promise((resolve, reject) => parseString(xml, (err, result) => {
        if (err) reject(err);
        else resolve(result);
    }));
}
export function strDist(str1: string, str2: string) {
    const track = Array(str2.length + 1).fill(null).map(() =>
        Array(str1.length + 1).fill(null));
    for (let i = 0; i <= str1.length; i += 1) {
        track[0][i] = i;
    }
    for (let j = 0; j <= str2.length; j += 1) {
        track[j][0] = j;
    }
    for (let j = 1; j <= str2.length; j += 1) {
        for (let i = 1; i <= str1.length; i += 1) {
            const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
            track[j][i] = Math.min(
                track[j][i - 1] + 1, // deletion
                track[j - 1][i] + 1, // insertion
                track[j - 1][i - 1] + indicator, // substitution
            );
        }
    }
    return track[str2.length][str1.length];
}
export function replaceWithObj(str: string, member: Discord.GuildMember, channel: Discord.TextChannel) {
    const user = member.user;
    const guild = channel.guild;
    const split = str.split(/ +/);
    const replaced: string[] = [];
    for (const s of split) {
        var re: string;
        const matches = s.match(/\{(?<thing>(user|channel|member|guild)(\.\w+)?)\}/);
        if (matches?.groups?.thing) {
            const split = matches.groups.thing.split(".");
            var obj: any;
            if (split[0] === "user") obj = user;
            else if (split[0] === "channel") obj = channel;
            else if (split[0] === "member") obj = member;
            else obj = guild;
            for (let ii = 1; ii < split.length; ii++) obj = obj[split[ii]];
            re = obj.toString();
        } else re = s;
        replaced.push(re);
    }
    return replaced.join(" ");
}
const SYM = '        ⁽⁾ ⁺ ⁻  ⁰¹²³⁴⁵⁶⁷⁸⁹   ⁼   ᴬᴮ ᴰᴱ ᴳᴴᴵᴶᴷᴸᴹᴺᴼᴾ ᴿ ᵀᵁ ᵂ         ᵃᵇᶜᵈᵉᶠᵍʰⁱʲᵏˡᵐⁿᵒᵖ ʳˢᵗᵘᵛʷˣʸᶻ     ';
export function toSuperscript(str: string) {
    var z = '';
    for (var c of str) {
        var d = SYM[c.charCodeAt(0) - 32] || ' ';
        z += d === ' ' ? c : d;
    }
    return z;
};
const SUB_SYM = '        ₍₎ ₊ ₋  ₀₁₂₃₄₅₆₇₈₉   ₌                                   ₐ   ₑ  ₕᵢⱼₖₗₘₙₒₚ ᵣₛₜᵤᵥ ₓ       ';
export function toSubscript(str: string) {
    var z = '';
    for (var c of str) {
        var d = SUB_SYM[c.charCodeAt(0) - 32] || ' ';
        z += d === ' ' ? c : d;
    }
    return z;
}

// Stream/Buffer operations
export function streamToString(stream: NodeJS.ReadableStream, enc = undefined) {
    var str = ''
    return new Promise((resolve, reject) => {
        stream.on('data', (data) => str += (typeof enc === 'string') ? data.toString(enc) : data.toString());
        stream.on('end', () => resolve(str));
        stream.on('error', (err) => reject(err));
    })
}
export function bufferToStream(buf: any, chunkSize: number = 0) {
    if (typeof buf === 'string') buf = Buffer.from(buf, 'utf8');
    if (!Buffer.isBuffer(buf)) throw new TypeError(`"buf" argument must be a string or an instance of Buffer`);
    const reader = new Readable();
    const hwm = reader.readableHighWaterMark;
    if (!chunkSize || chunkSize < 1 || chunkSize > hwm) chunkSize = hwm;
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
export function requestYTDLStream(url: string, opts: downloadOptions & { timeout?: number }) {
    const timeoutMS = opts.timeout || 120000;
    const getStream = new Promise(async (resolve, reject) => {
        const options = <any>opts;
        if (process.env.COOKIE) {
            options.requestOptions = {};
            options.requestOptions.headers = { cookie: process.env.COOKIE };
            if (process.env.YT_TOKEN) options.requestOptions.headers["x-youtube-identity-token"] = process.env.YT_TOKEN;
        }
        const stream = ytdl(url, options);
        stream.on("finish", () => resolve(stream)).on("error", err => reject(err));
    });
    return Promise.race([wait(timeoutMS), getStream]);
}

// Array operations
export function shuffleArray(array: any[], start: number = 0) {
    const temp = array.splice(0, start);
    for (let i = array.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return temp.concat(array);
}
export function mergeObjArr(obj: any, keys: string[]) {
    const arr = [];
    for (const key of keys) if (obj[key]) arr.push(obj[key]);
    return [].concat.apply([], arr);
}
export function flatDeep(arr: any[], d = 1) {
    return d > 0 ? arr.reduce((acc, val) => acc.concat(Array.isArray(val) ? flatDeep(val, d - 1) : val), [])
        : arr.slice();
}

// Object operations
export function getWithWeight(input: any) {
    const array = [];
    for (const item in input) if (input.hasOwnProperty(item)) for (var i = 0; i < input[item]; i++) array.push(item);
    return array[Math.floor(Math.random() * array.length)];
}
export function findValueByPrefix(object: any, prefix: string) {
    for (const property in object) if (object[property] && property.toString().startsWith(prefix)) return object[property];
    return undefined;
}
export function getKeyByValue(object: any, value: any) {
    return Object.keys(object).find(key => object[key] === value);
}

// Checks
export function validMSURL(str: string) { return !!str.match(/^(https?:\/\/)?musescore\.com\/(user\/\d+\/scores\/\d+|[\w-]+\/(scores\/\d+|[\w-]+))[#\?]?$/); }
export function validImgurURL(str: string) { return !!str.match(/^https?:\/\/(\w+\.)?imgur.com\/(\w*\w*)+(\.[a-zA-Z]{3})?$/); }
export function validImgurVideoURL(str: string) { return !!str.match(/^https?:\/\/(\w+\.)?imgur.com\/(\w*\w*)+(\.[a-zA-Z0-9]{3})?$/); }
export function validImgur4wordsURL(str: string) { return !!str.match(/^https?:\/\/(\w+\.)?imgur.com\/(\w\/)?(\w*\w*)+(\.[a-zA-Z0-9]*)?$/); }
export function validImgurAURL(str: string) { return !!str.match(/^https?:\/\/(\w+\.)?imgur.com\/(\w\/)?(\w*\w*)$/); }
export function validNotImgurURL(str: string) { return !!str.match(/^https?:\/\/imgur.com\/(\w*\w*)+(\.[a-zA-Z]{3})?$/); }
export function validRedditURL(str: string) { return !!str.match(/^https?:\/\/(\w+\.)?redd.it\/(\w*\w*)+(\.[a-zA-Z]{3})?$/); }
export function validRedditVideoURL(str: string) { return !!str.match(/^https?:\/\/(\w+\.)?redd.it\/(\w*\w*)+(\.[a-zA-Z0-9]{3})?$/); }
export function validGfyURL(str: string) { return !!str.match(/^(http(s)?:\/\/)?((w){3}.)?gfycat(.com)?\/\w*/); }
export function validRedGifURL(str: string) { return !!str.match(/^https?:\/\/(\w+\.)?redgifs.com\/(\w*\/)?(\w*\w*)$/); }
export function isImageUrl(url: string, timeoutT: number = 0) {
    return new Promise(function (resolve, reject) {
        var timeout = timeoutT || 5000;
        var timer: NodeJS.Timeout, img = new Image();
        img.onerror = function () {
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

// Allows longer timeout
export function setTimeout_(fn: Function, delay: number) {
    var maxDelay = Math.pow(2, 31) - 1;
    if (delay > maxDelay) {
        delay -= maxDelay;
        return setTimeout(() => setTimeout_(fn, delay), maxDelay);
    }
    return setTimeout(fn, delay);
}

// D.js object fetchers
export async function findUser(str: string): Promise<Discord.User> {
    if (isNaN(parseInt(str))) if (!str.startsWith("<@")) throw new Error("**" + str + "** is neither a mention or ID.");
    const userID = str.replace(/<@/g, "").replace(/!/g, "").replace(/>/g, "");
    try {
        return await globalClient.users.fetch(userID);
    } catch (err: any) {
        throw new Error("No user was found!");
    }
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
    var channelID = str.replace(/<#/g, "").replace(/>/g, "");
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
            if (str instanceof Discord.MessageEmbed) return <Discord.Message>await message.editReply({ embeds: [str] });
            else if (str instanceof Discord.MessageAttachment) return <Discord.Message>await message.editReply({ files: [str] });
            else return <Discord.Message>await message.editReply(str);
        } else if (useFollowUp) {
            if (typeof str === "string") return <Discord.Message>await message.followUp({ content: str, fetchReply: true });
            else if (str instanceof Discord.MessageEmbed) return <Discord.Message>await message.followUp({ embeds: [str], fetchReply: true });
            else if (str instanceof Discord.MessageAttachment) return <Discord.Message>await message.followUp({ files: [str], fetchReply: true });
            else return <Discord.Message>await message.followUp({ fetchReply: true, ...str });
        } else {
            if (typeof str === "string") return <Discord.Message>await message.reply({ content: str, fetchReply: true });
            else if (str instanceof Discord.MessageEmbed) return <Discord.Message>await message.reply({ embeds: [str], fetchReply: true });
            else if (str instanceof Discord.MessageAttachment) return <Discord.Message>await message.reply({ files: [str], fetchReply: true });
            else return <Discord.Message>await message.reply({ fetchReply: true, ...str });
        }
    }
}

// Color code changers
export function hexToRgb(hex: string) {
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

// Date & time formatting
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
export function duration(seconds: number, type: moment.unitOfTime.DurationConstructor = "seconds") {
    const duration = moment.duration(seconds, type);
    const str = [];
    if (duration.hours()) str.push(twoDigits(duration.hours()) + ":");
    str.push(twoDigits(duration.minutes()) + ":");
    str.push(twoDigits(duration.seconds()));
    return str.join("");
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
export function milliToHumanDuration(milli: number) {
    var x = Math.floor(milli / 1000);
    const seconds = x % 60;
    x = Math.floor(x / 60);
    const minutes = x % 60;
    x = Math.floor(x / 60);
    const hours = x % 24;
    x = Math.floor(x / 24);
    const days = x;
    return `${days}D, ${hours}H, ${minutes}M, ${seconds}S`
}
export function getWeek(date: Date, dowOffset: number = 0) {
    /*getWeek() was developed by Nick Baicoianu at MeanFreePath: http://www.meanfreepath.com */
    // https://stackoverflow.com/questions/9045868/javascript-date-getweek
    var newYear = new Date(date.getFullYear(), 0, 1);
    var day = newYear.getDay() - dowOffset; //the day of week the year begins on
    day = (day >= 0 ? day : day + 7);
    var daynum = Math.floor((date.getTime() - newYear.getTime() -
        (date.getTimezoneOffset() - newYear.getTimezoneOffset()) * 60000) / 86400000) + 1;
    var weeknum: number;
    //if the year starts before the middle of a week
    if (day < 4) {
        weeknum = Math.floor((daynum + day - 1) / 7) + 1;
        if (weeknum > 52) {
            const nYear = new Date(date.getFullYear() + 1, 0, 1);
            var nday = nYear.getDay() - dowOffset;
            nday = nday >= 0 ? nday : nday + 7;
            /*if the next year starts before the middle of
              the week, it is week #1 of that year*/
            weeknum = nday < 4 ? 1 : 53;
        }
    } else weeknum = Math.floor((daynum + day - 1) / 7);
    return weeknum;
};

// Extended functionality of ms
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
        const mses = [];
        const split = val.match(/[\d\.]+[dhms]/g);
        for (const str of split) {
            const msed = superms(str);
            if (!msed) return undefined;
            mses.push(msed);
        }
        return mses.reduce((acc, c) => acc + c);
    } else return superms(val);
}

// Embed presentations
export async function createEmbedScrolling(message: Discord.Message | NorthInteraction | { interaction: NorthInteraction, useEdit: boolean }, allEmbeds: Discord.MessageEmbed[], post?: Function) {
    var author: Discord.Snowflake;
    if (message instanceof Discord.Message) author = message.author.id;
    else if (message instanceof Discord.Interaction) author = message.user.id;
    else author = message.interaction.user.id;
    const row = new Discord.MessageActionRow()
        .addComponents(new Discord.MessageButton({ customId: "first", emoji: "⏮", style: "SECONDARY" }))
        .addComponents(new Discord.MessageButton({ customId: "previous", emoji: "◀", style: "PRIMARY" }))
        .addComponents(new Discord.MessageButton({ customId: "next", emoji: "▶", style: "PRIMARY" }))
        .addComponents(new Discord.MessageButton({ customId: "last", emoji: "⏭", style: "SECONDARY" }))
        .addComponents(new Discord.MessageButton({ customId: "quit", emoji: "⏹", style: "DANGER" }));
    const filter = (interaction: Discord.MessageComponentInteraction) => interaction.user.id === author;
    var s = 0;
    var msg: Discord.Message;
    if (message instanceof Discord.Message) msg = await message.channel.send({ embeds: [allEmbeds[0]], components: [row] });
    else if (message instanceof Discord.Interaction) msg = <Discord.Message>await message.reply({ embeds: [allEmbeds[0]], components: [row], fetchReply: true });
    else {
        if (message.useEdit) msg = <Discord.Message>await message.interaction.editReply({ embeds: [allEmbeds[0]], components: [row] });
        else msg = <Discord.Message>await message.interaction.reply({ embeds: [allEmbeds[0]], components: [row], fetchReply: true });
    }
    const collector = msg.createMessageComponentCollector({ filter, idle: 60000 });
    collector.on("collect", async (interaction: Discord.MessageComponentInteraction) => {
        switch (interaction.customId) {
            case "first":
                s = 0;
                await interaction.update({ embeds: [allEmbeds[s]] });
                break;
            case "previous":
                s -= 1;
                if (s < 0) s = allEmbeds.length - 1;
                await interaction.update({ embeds: [allEmbeds[s]] });
                break;
            case "next":
                s += 1;
                if (s > allEmbeds.length - 1) s = 0;
                await interaction.update({ embeds: [allEmbeds[s]] });
                break;
            case "last":
                s = allEmbeds.length - 1;
                await interaction.update({ embeds: [allEmbeds[s]] });
                break;
            case "quit":
                await interaction.update({});
                collector.emit("end");
                break;
        }
    });
    collector.on("end", async () => {
        await msg.edit({ components: [] });
        if (post) await post(msg);
    });
    return { msg, collector };
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
export function commonRoleEmbed(client: Discord.Client, word: string, past: string, name: string) {
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

// Generators
export function getRandomNumber(min: number, max: number) { return Math.random() * (max - min) + min; }
export async function ID() {
    const buffer: Buffer = await new Promise((resolve, reject) => crypto.randomBytes(24, async (err, buffer) => err ? reject(err) : resolve(buffer)));
    return buffer.toString("hex");
}
export function genPermMsg(permissions: number, id: number) {
    if (id == 0) return `You need the permissions \`${new Discord.Permissions(BigInt(permissions)).toArray().join("`, `")}\` to use this command.`;
    else return `I need the permissions \`${new Discord.Permissions(BigInt(permissions)).toArray().join("`, `")}\` to run this command.`;
}
export function color() { return Math.floor(Math.random() * 16777214) + 1; }
export async function requestStream(url) {
    const fetched = await fetch(url);
    return { data: fetched.body, status: fetched.status };
}

// Minecraft
export async function profile(str: string) {
    if (str.match(/^\w{3,16}$/)) return await mcapi.mojang.getUUID(str);
    const history = (<{ name: string, changedToAt: number }[]><unknown>(await nameHistory(str))).sort((a, b) => (b.changedToAt || 0) - (a.changedToAt || 0));
    return await mcapi.mojang.getUUID(history[0].name);
}
export async function nameToUuid(str: string) {
    return (await profile(str)).id;
}
export async function nameHistory(str: string) {
    if (str.match(/^\w{3,16}$/)) return await (await profile(str)).getNameHistory();
    return await mcapi.mojang.getNameHistory(str);
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
export async function nameExists(str: string) {
    try {
        await mcapi.mojang.getUUID(str);
        return true;
    } catch (err) { return false; }
}

// Getters
export function getFetch() {
    return fetch;
}
export async function getOwner() {
    if (!globalClient.application?.owner) await globalClient.application?.fetch();
    return globalClient.application?.owner.id;
}

// TradeW1nd communication
export async function checkTradeW1nd(guild: Discord.Snowflake) {
    const res = await fetch(`http://${localIp}:3000/checkGuild/${guild}`);
    return res.ok && (<any>await res.json()).isIn;
}
export async function getTradeW1ndStats() {
    const res = await fetch(`http://${localIp}:3000`);
    if (!res.ok) return null;
    return <{ version: string, size: number, lastReady: number, uptime: number }>await res.json();
}
export async function syncTradeW1nd(guild: Discord.Snowflake) {
    const config = NorthClient.storage.guilds[guild];
    if (!config) return;
    await fetch(`http://${localIp}:3000/update/${guild}`, { method: "post", body: JSON.stringify(config), headers: { "Content-Type": "application/json" } });
}

// SQL Database
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
export async function query(query: string) {
    const res = await fetch(`http:/${localIp}:4269/api/query`, { method: "post", body: JSON.stringify({ token: process.env.DB_TOKEN, query }), headers: { 'Content-Type': 'application/json' } });
    if (!res.ok) return null;
    else return <any>await res.json();
}
export function mysqlEscape(str: string) {
    return escape(str);
}
export async function fixGuildRecord(id: Discord.Snowflake) {
    if (NorthClient.storage.guilds[id]) return NorthClient.storage.guilds[id];
    const results = await query("SELECT id FROM configs WHERE id = " + id);
    if (results.length > 0) NorthClient.storage.guilds[results[0].id] = new GuildConfig(results[0]);
    else {
        try {
            await query(`INSERT INTO configs (id, token, safe) VALUES ('${id}', ${await ID()}, 1)`);
            NorthClient.storage.guilds[id] = new GuildConfig();
        } catch (err: any) { }
    }
    return NorthClient.storage.guilds[id];
}

// Sub-bot things
//const bwStarRoles = ["851471525802803220", "851469005168181320", "851469138647842896", "851469218310389770", "851469264664789022", "851469323444944907", "851469358076788766", "851469389806829596", "851469422971584573", "851469455791489034", "851469501115793408", "851469537030307870", "851469565287858197", "851469604840013905", "851469652940161084", "851469683764887572", "851469718955229214", "851469754677985280", "851469812050690068", "851469858675097660", "851469898547068938"/*, "851469933606862848", "851469969685479424", "851470006520905748", "851470041031245854", "851470070022406204", "851470099558039622", "851470140410822677", "851470173503881218", "851470230370910248", "851471153188569098"*/];
const rankRoles = {
    YOUTUBER: "662895829815787530",
    VIP: "837271174827212850",
    VIP_PLUS: "837271174073155594",
    MVP: "837271173027856404",
    MVP_PLUS: "837271172319674378",
    MVP_PLUS_PLUS: "837271171619356692"
};
export async function updateGuildMemberMC(member: Discord.GuildMember, mcUuid: string) {
    const { name } = await profile(mcUuid);
    const res = await fetch(`https://api.slothpixel.me/api/players/${name}?key=${process.env.API}`).then(res => <any>res.json());
    /*const mcLen = res.username.length + 1;
    const bw = res.stats.BedWars;
    const firstHalf = `[${bw.level}⭐|${bw.final_k_d}]`;
    if (firstHalf.length + mcLen > 32) await member.setNickname(`${firstHalf} ${res.username.slice(0, 28 - firstHalf.length)}...`);
    else await member.setNickname(`${firstHalf} ${res.username}`);*/
    await member.setNickname(res.username);
    const gInfo = <any>await fetch(`https://api.slothpixel.me/api/guilds/${mcUuid}?key=${process.env.API}`).then(res => res.json());
    const roles = member.roles;
    if (gInfo.id === "5b5548e70cf21fddabf8c6c1") await roles.add("622319008758104064");
    else await roles.remove("622319008758104064");
    await roles.add("676754719120556042");
    await roles.add("837345908697989171");
    await roles.remove("837345919010603048");

    /*const bwIndex = Math.min(Math.floor(bw.level / 100), bwStarRoles.length - 1);
    if (!(await member.guild.roles.fetch(bwStarRoles[bwIndex])).members.has(member.id)) {
        await roles.add(bwStarRoles[bwIndex]);
        for (let ii = 0; ii < bwStarRoles.length; ii++)
            if (ii !== bwIndex && (await member.guild.roles.fetch(bwStarRoles[ii])).members.has(member.id))
                await roles.remove(bwStarRoles[ii]);
    }*/

    if (res.rank) {
        if (!(await member.guild.roles.fetch(rankRoles[res.rank])).members.has(member.id)) {
            await roles.add(rankRoles[res.rank]);
            for (const rank in rankRoles)
                if (rank !== res.rank && (await member.guild.roles.fetch(rankRoles[rank])).members.has(member.id))
                    await roles.remove(rankRoles[rank]);
        }
    }
}
export async function getTokensAndMultiplier(author: Discord.Snowflake, uuid: string) {
    var conditions: string[] = [], condition = " WHERE ";
    if (author) conditions.push(`dcid = "${author}"`);
    if (uuid) conditions.push(`uuid = "${uuid}"`);
    const [result] = await query(`SELECT tokens, multiplier FROM dcmc${conditions.length > 0 ? condition + conditions.join(" AND ") : ""}`);
    if (!result) return null;
    result.multiplier = Number(result.multiplier);
    return <{ tokens: number, multiplier: number }>result;
}
export async function updateTokens(author: Discord.Snowflake, uuid: string, value: number) {
    console.debug(`Updating tokens of ${author} / ${uuid}`);
    var conditions: string[] = [], condition = " WHERE ";
    if (author) conditions.push(`dcid = "${author}"`);
    if (uuid) conditions.push(`uuid = "${uuid}"`);
    await query(`UPDATE dcmc SET tokens = ${roundTo(value, 2)}${conditions.length > 0 ? condition + conditions.join(" AND ") : ""}`);
}
export async function changeTokens(author: Discord.Snowflake, uuid: string, change: number, data?: { tokens: number, multiplier: number }) {
    if (!data) data = await getTokensAndMultiplier(author, uuid);
    if (!data) return;
    await updateTokens(author, uuid, data.tokens + change * data.multiplier);
}
export async function updateMultiplier(author: Discord.Snowflake, uuid: string, value: number) {
    var conditions: string[] = [], condition = " WHERE ";
    if (author) conditions.push(`dcid = "${author}"`);
    if (uuid) conditions.push(`uuid = "${uuid}"`);
    await query(`UPDATE dcmc SET multiplier = ${Math.max(0, roundTo(value, 2))}${conditions.length > 0 ? condition + conditions.join(" AND ") : ""}`);
}
export async function getChatMultiplier(user: Discord.Snowflake, guild: Discord.Snowflake) {
    const [result] = await query(`SELECT multiplier FROM leveling WHERE user = ${user} AND guild = ${guild}`);
    return Number(result.multiplier);
}
export async function updateChatMultiplier(user: Discord.Snowflake, guild: Discord.Snowflake, value: number) {
    const data = NorthClient.storage.guilds[guild]?.levelData.get(user);
    if (!data) return;
    data.multiplier = roundTo(value, 2);
    NorthClient.storage.guilds[guild].levelData.set(user, data);
    await query(`UPDATE leveling SET multiplier = ${data.multiplier} WHERE user = ${user} AND guild = ${guild}`);
}

// Prototyping
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