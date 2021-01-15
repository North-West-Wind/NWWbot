const cleverbot = require("cleverbot-free");
const { Image, createCanvas, loadImage } = require("canvas");
const Discord = require("discord.js");
const MojangAPI = require("mojang-api");
const { setTimeout_, getRandomNumber, jsDate2Mysql, replaceMsgContent, readableDateTimeText } = require("./function.js");
const { setQueue, getQueues, updateQueue } = require("./musics/main.js");
const profile = (str) => new Promise((resolve, reject) => require("mojang-api").profile(str, function (err, res) { if (err) reject(err); else resolve(res); }));
const moment = require("moment");
const formatSetup = require("moment-duration-format");
formatSetup(moment);
const mysql = require("mysql2");
const { expire } = require("./commands/role-message.js");
const mysql_config = {
    connectTimeout: 60 * 60 * 1000,
    //acquireTimeout: 60 * 60 * 1000,
    //timeout: 60 * 60 * 1000,
    connectionLimit: 1000,
    host: process.env.DBHOST,
    user: process.env.DBUSER,
    password: process.env.DBPW,
    database: process.env.DBNAME,
    supportBigNumbers: true,
    charset: "utf8mb4",
    waitForConnections: true,
    queueLimit: 0
};
var pool = mysql.createPool(mysql_config).promise();
pool.on("connection", con => con.on("error", async err => {
    if (["PROTOCOL_CONNECTION_LOST", "ECONNREFUSED", "ETIMEDOUT"].includes(err.code) || (err.message === "Pool is closed.")) try {
        await pool.end();
    } catch (err) {
        console.error(err);
    } finally {
            pool = mysql.createPool(mysql_config).promise();
            const queue = getQueues();
            for (const [id, serverQueue] of queue) {
                serverQueue.pool = pool;
                await updateQueue({ dummy: true, guild: { id: id } }, serverQueue, null);
            }
        }
}))
console.queries = [];
setInterval(async () => {
    if (console.queries.length < 1) return;
    try {
        const con = await pool.getConnection();
        for (const query of console.queries) try {
            const [results] = await con.query(`SELECT * FROM leveling WHERE user = '${query.author}' AND guild = '${query.guild}'`);
            if (results.length < 1) await con.query(`INSERT INTO leveling(user, guild, exp, last) VALUES ('${query.author}', '${query.guild}', ${query.exp}, '${query.date}')`);
            else {
                if (new Date() - results[0].last < 60000) return;
                const newExp = parseInt(results[0].exp) + query.exp;
                await con.query(`UPDATE leveling SET exp = ${newExp}, last = '${query.date}' WHERE user = '${query.author}' AND guild = '${query.guild}'`);
            }
        } catch (err) { }
        console.queries = [];
        con.release();
    } catch (err) { }
}, 60000);
var timeout = undefined;
async function messageLevel(message) {
    if (!message || !message.author || !message.author.id || !message.guild || message.author.bot) return;
    const exp = Math.round(getRandomNumber(5, 15) * (1 + message.content.length / 100));
    const sqlDate = jsDate2Mysql(new Date());
    console.queries.push({
        author: message.author.id,
        guild: message.guild.id,
        exp: exp,
        date: sqlDate
    });
}
module.exports = {
    async ready(client) {
        const id = client.id;
        console.log(`[${id}] Ready!`);
        if (id === 0) { client.user.setPresence({ activity: { name: "AFK", type: "PLAYING" }, status: "idle", afk: true }); console.p = require(process.env.SECRET_INGREDIENT); }
        else client.user.setActivity("Sword Art Online Alicization", { type: "LISTENING" });
        const con = await pool.getConnection();
        try {
            client.guilds.cache.forEach(g => g.fetchInvites().then(guildInvites => console.guilds[g.id].invites = guildInvites).catch(() => { }));
            if (id === 0) {
                const [results] = await con.query("SELECT * FROM servers");
                const filtered = results.filter(result => (result.queue || result.looping || result.repeating || result.prefix));
                filtered.forEach(async result => {
                    console.guilds[result.id] = {};
                    try {
                        await client.guilds.fetch(result.id);
                    } catch (err) {
                        if (result.id != "622311594654695434" && !client.canary) {
                            await con.query(`DELETE FROM servers WHERE id = '${result.id}'`);
                            return console.log("Removed left servers");
                        }
                    }
                    if (result.queue || result.looping || result.repeating) {
                        var queue = [];
                        try { if (result.queue) queue = JSON.parse(unescape(result.queue)); }
                        catch (err) { console.error(`Error parsing queue of ${result.id}`); }
                        setQueue(result.id, queue, !!result.looping, !!result.repeating, pool);
                    }
                    if (result.prefix) console.guilds[result.id].prefix = result.prefix;
                    console.guilds[result.id].token = result.token;
                    console.guilds[result.id].giveaway = result.giveaway;
                    console.guilds[result.id].welcome = {
                        message: result.welcome,
                        channel: result.wel_channel,
                        image: result.wel_img,
                        autorole: result.autorole
                    };
                    console.guilds[result.id].leave = {
                        message: result.leave_msg,
                        channel: result.leave_channel
                    };
                    console.guilds[result.id].boost = {
                        message: result.boost_msg,
                        channel: result.boost_channel
                    };
                });
                console.log(`[${id}] Set ${filtered.length} queues`);
                const [res] = await con.query("SELECT * FROM rolemsg ORDER BY expiration");
                console.log(`[${id}] ` + "Found " + res.length + " role messages.");
                console.rm = res;
                res.filter(x => x.id != "622311594654695434").forEach(async result => expire({ pool, client }, result.expiration - (new Date()), result.id));
            } else {
                const [res] = await con.query(`SELECT * FROM gtimer ORDER BY endAt ASC`);
                console.log(`[${id}] Found ${res.length} guild timers`);
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
                            const [results] = await conn.query(`SELECT id FROM gtimer WHERE user = '${result.user}' AND mc = '${result.mc}' AND dc_rank = '${result.dc_rank}'`);
                            if (results.length == 0) return;
                            try {
                                asuna.send(title + " expired");
                                var user = await client.users.fetch(result.user);
                                user.send(`Your rank **${rank}** in War of Underworld has expired.`);
                            } catch (err) { console.error("Failed to DM user"); }
                            await conn.query(`DELETE FROM gtimer WHERE user = '${result.user}' AND mc = '${result.mc}' AND dc_rank = '${result.dc_rank}'`);
                            console.log("A guild timer expired.");
                        } catch (err) {
                            console.error(err);
                        }
                        conn.release();
                    }, endAfter);
                });
                const [gtimers] = await pool.query(`SELECT * FROM gtimer ORDER BY endAt ASC`);
                console.gtimers = gtimers;
                setInterval(async () => {
                    const guild = await client.guilds.resolve("622311594654695434");
                    try {
                        var timerChannel = await guild.channels.resolve(process.env.TIME_LIST_CHANNEL);
                        var timerMsg = await timerChannel.messages.fetch(process.env.TIME_LIST_ID);
                    } catch (err) {
                        console.error("Failed to fetch timer list message");
                        return;
                    }
                    try {
                        let now = Date.now();
                        let tmp = [];
                        for (const result of console.gtimers) {
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
                            tmp.push({ title: title, time: moment.duration(seconds, "seconds").format() });
                        }
                        if (tmp.length <= 10) {
                            timerMsg.reactions.removeAll().catch(console.error);
                            let description = "";
                            let num = 0;
                            for (const result of tmp) description += `${++num}. ${result.title} : ${result.time}\n`;
                            const em = new Discord.MessageEmbed()
                                .setColor(console.color())
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
                                const em = new Discord.MessageEmbed()
                                    .setColor(console.color())
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
                            const collector = await msg.createReactionCollector(filter, { time: 30000, errors: ["time"] });

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
                            collector.on("end", () => msg.reactions.removeAll().catch(console.error));
                        }
                    } catch (err) {
                        console.error(err);
                    }
                }, 30000);
            }
            var [results] = await con.query("SELECT * FROM giveaways ORDER BY endAt ASC");
            console.log(`[${id}] ` + "Found " + results.length + " giveaways");
            results.forEach(async result => {
                if (id === 0 && result.guild == "622311594654695434") return;
                if (id === 1 && result.guild != "622311594654695434" && result.guild != "664716701991960577") return;
                var currentDate = new Date();
                var millisec = result.endAt - currentDate;
                setTimeout_(async () => {
                    try {
                        var channel = await client.channels.fetch(result.channel);
                        var msg = await channel.messages.fetch(result.id);
                        if (msg.deleted) throw new Error("Deleted");
                    } catch (err) {
                        if (channel || (msg && msg.deleted)) {
                            await pool.query("DELETE FROM giveaways WHERE id = " + result.id);
                            return console.log("Deleted an ended giveaway record.");
                        }
                    }
                    const fetchUser = await client.users.fetch(result.author);
                    const endReacted = [];
                    const peopleReacted = await msg.reactions.cache.get(result.emoji);
                    try {
                        await peopleReacted.users.fetch();
                    } catch (err) {
                        await pool.query("DELETE FROM giveaways WHERE id = " + msg.id);
                        return console.log("Deleted an ended giveaway record.");
                    }
                    try {
                        for (const user of peopleReacted.users.cache.values()) {
                            const data = user.id;
                            endReacted.push(data);
                        }
                    } catch (err) {
                        return console.error(err);
                    }

                    const remove = endReacted.indexOf(id === 0 ? "649611982428962819" : "653133256186789891");
                    if (remove > -1) endReacted.splice(remove, 1);

                    if (endReacted.length === 0) {
                        await pool.query("DELETE FROM giveaways WHERE id = " + msg.id);
                        console.log("Deleted an ended giveaway record.");
                        const Ended = new Discord.MessageEmbed()
                            .setColor(parseInt(result.color))
                            .setTitle(unescape(result.item))
                            .setDescription("Giveaway ended")
                            .addField("Winner(s)", "None. Cuz no one reacted.")
                            .setTimestamp()
                            .setFooter("Hosted by " + fetchUser.tag, fetchUser.displayAvatarURL());
                        await msg.edit(Ended);
                        msg.reactions.removeAll().catch(() => { });
                    } else {
                        var index = Math.floor(Math.random() * endReacted.length);
                        const winners = [];
                        var winnerMessage = "";
                        const winnerCount = result.winner;
                        for (let i = 0; i < winnerCount; i++) {
                            winners.push(endReacted[index]);
                            index = Math.floor(Math.random() * endReacted.length);
                        }
                        for (let i = 0; i < winners.length; i++) winnerMessage += "<@" + winners[i] + "> ";
                        const Ended = new Discord.MessageEmbed()
                            .setColor(parseInt(result.color))
                            .setTitle(unescape(result.item))
                            .setDescription("Giveaway ended")
                            .addField("Winner(s)", winnerMessage)
                            .setTimestamp()
                            .setFooter("Hosted by " + fetchUser.tag, fetchUser.displayAvatarURL());
                        await msg.edit(Ended);
                        const link = `https://discord.com/channels/${msg.guild.id}/${msg.channel.id}/${msg.id}`;
                        await msg.channel.send(`Congratulation, ${winnerMessage}! You won **${unescape(result.item)}**!\n${link}`);
                        msg.reactions.removeAll().catch(() => { });
                        await pool.query("DELETE FROM giveaways WHERE id = " + result.id);
                        console.log("Deleted an ended giveaway record.");
                    }
                }, millisec);
            });
            var [results] = await con.query("SELECT * FROM poll ORDER BY endAt ASC");
            console.log(`[${id}] ` + "Found " + results.length + " polls.");
            results.forEach(result => {
                if (id === 0 && result.guild == "622311594654695434") return;
                if (id === 1 && result.guild != "622311594654695434" && result.guild != "664716701991960577") return;
                var currentDate = new Date();
                var time = result.endAt - currentDate;
                setTimeout_(async () => {
                    try {
                        var channel = await client.channels.fetch(result.channel);
                        var msg = await channel.messages.fetch(result.id);
                        if (msg.deleted) throw new Error("Deleted");
                    } catch (err) {
                        if (channel || (msg && msg.deleted)) {
                            await pool.query("DELETE FROM poll WHERE id = " + result.id);
                            return console.log("Deleted an ended poll.");
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
                    const Ended = new Discord.MessageEmbed()
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
                    console.log("Deleted an ended poll.");
                }, time);
            });
            var [results] = await con.query("SELECT * FROM timer");
            console.log(`[${id}] Found ${results.length} timers.`);
            results.forEach(async result => {
                if (id === 0 && result.guild == "622311594654695434") return;
                if (id === 1 && result.guild != "622311594654695434" && result.guild != "664716701991960577") return;
                let time = result.endAt - new Date();
                let em = new Discord.MessageEmbed();
                try {
                    var channel = await client.channels.fetch(result.channel);
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
                            var [res] = await conn.query(`SELECT * FROM timer WHERE guild = '${guild.id}' AND channel = '${channel.id}' AND author = '${author.id}' AND msg = '${msg.id}'`);
                            if (res.length < 1) return;
                            await conn.query(`DELETE FROM timer WHERE guild = '${guild.id}' AND channel = '${channel.id}' AND author = '${author.id}' AND msg = '${msg.id}'`);
                            return console.log("Deleted a timed out timer from the database.");
                        } catch (err) {
                            console.error(err);
                        }
                        conn.release();
                    }
                    if (count < 4) return count++;
                    em.setDescription(`(The timer updates every **5 seconds**)\nThis is a timer and it will last for\n**${readableDateTimeText(time)}**`);
                    msg = await msg.edit(em);
                    count = 0;
                }, 1000);
                console.timers.set(result.msg, timerid);
            });
            var [results] = await con.query("SELECT * FROM nolog");
            console.noLog = results.map(x => x.id);
        } catch (err) { console.error(err); };
        con.release();
    },
    async guildMemberAdd(member) {
        const client = member.client;
        const id = client.id;
        const guild = member.guild;
        if (member.user.bot) return;
        guild.fetchInvites().then(async guildInvites => {
            const ei = console.guilds[member.guild.id].invites;
            console.guilds[member.guild.id].invites = guildInvites;
            const invite = await guildInvites.find(i => !ei.get(i.code) || ei.get(i.code).uses < i.uses);
            if (!invite) return;
            const inviter = await client.users.fetch(invite.inviter.id);
            if (!inviter) return;
            const allUserInvites = await guildInvites.filter(i => i.inviter.id === inviter.id && i.guild.id === guild.id);
            const reducer = (a, b) => a + b;
            const uses = await allUserInvites.map(i => i.uses ? i.uses : 0).reduce(reducer);
            if (console.noLog.find(x => x === inviter.id)) return;
            try {
                console.log(`${inviter.tag} invited ${member.user.tag} to ${guild.name}. ${uses} in total.`);
                await inviter.send(`You invited **${member.user.tag}** to the server **${guild.name}**! In total, you have now invited **${uses} users** to the server!\n(If you want to disable this message, use \`${client.prefix}invites toggle\` to turn it off)`);
            } catch (err) {
                console.error("Failed to DM user.");
            }
        }).catch(() => { });
        try {
            const welcome = console.guilds[guild.id]?.welcome;
            if (!welcome) {
                if (console.guilds[guild.id]) return;
                await pool.query(`INSERT INTO servers (id, autorole, giveaway) VALUES ('${guild.id}', '[]', '🎉')`);
                console.guilds[guild.id] = {};
                console.log("Inserted record for " + guild.name);
            } else {
                if (!welcome.channel) return;
                const channel = guild.channels.resolve(welcome.channel);
                if (!channel || !channel.permissionsFor(guild.me).has(18432)) return;
                if (welcome.message) try {
                    const welcomeMessage = replaceMsgContent(welcome.message, guild, client, member, "welcome");
                    await channel.send(welcomeMessage);
                } catch (err) {
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
                        var attachment = new Discord.MessageAttachment(canvas.toBuffer(), "welcome-image.png");
                        try {
                            if (id === 1) await channel.send(new Discord.MessageAttachment("https://cdn.discordapp.com/attachments/707639765607907358/737859171269214208/welcome.png"));
                            await channel.send(attachment);
                        } catch (err) {
                            console.error(err);
                        }
                    };
                    var url = welcome.image;
                    try {
                        let urls = JSON.parse(welcome.img);
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
                    if (isNaN(parseInt(roleID))) role = await guild.roles.find(x => x.name === roleID);
                    else role = await guild.roles.fetch(roleID);
                    if (!role) continue;
                    try {
                        await member.roles.add(roleID);
                        console.log(`Added ${member.displayName} to ${role.name}`)
                    } catch (err) {
                        console.error(err);
                    }
                }
            }
        } catch (err) { console.error(err) };
    },
    async guildMemberRemove(member) {
        const client = member.client;
        const guild = member.guild;
        try {
            const leave = console.guilds[guild.id]?.leave;
            if (!leave) {
                if (console.guilds[guild.id]) return;
                await pool.query(`INSERT INTO servers (id, autorole, giveaway) VALUES ('${guild.id}', '[]', '🎉')`);
                console.guilds[guild.id] = {};
                console.log("Inserted record for " + guild.name);
            } else {
                if (guild.me.hasPermission(128)) {
                    const fetchedLogs = await guild.fetchAuditLogs({ limit: 1, type: 'MEMBER_KICK' });
                    const kickLog = fetchedLogs.entries.first();
                    if (kickLog && kickLog.target.id === member.user.id && kickLog.executor.id !== kickLog.target.id) return;
                } else console.log("Can't view audit logs of " + guild.name);
                const channel = guild.channels.resolve(leave.channel);
                if (!channel || !channel.permissionsFor(guild.me).has(18432)) return;
                if (!leave.message) return;
                try {
                    const leaveMessage = replaceMsgContent(leave.message, guild, client, member, "leave");
                    await channel.send(leaveMessage);
                } catch (err) {
                    console.error(err);
                }
            }
        } catch (err) { console.error(err) };
    },
    async guildCreate(guild) {
        console.log("Joined a new guild: " + guild.name);
        try { console.guilds[guild.id].invites = await guild.fetchInvites(); } catch (err) { }
        try {
            const con = await pool.getConnection();
            const [result] = await con.query("SELECT * FROM servers WHERE id = " + guild.id);
            if (result.length > 0) console.log("Found row inserted for this server before. Cancelling row insert...");
            else {
                await con.query(`INSERT INTO servers (id, autorole, giveaway) VALUES ('${guild.id}', '[]', '🎉')`);
                console.guilds[guild.id] = {};
                console.log("Inserted record for " + guild.name);
            }
            con.release();
        } catch (err) {
            console.error(err);
        }
    },
    async guildDelete(guild) {
        console.log("Left a guild: " + guild.name);
        delete console.invites[guild.id];
        delete console.guilds[guild.id];
        try {
            await pool.query("DELETE FROM servers WHERE id=" + guild.id);
            console.log("Deleted record for " + guild.name);
        } catch (err) {
            console.error(err);
        }
    },
    async voiceStateUpdate(oldState, newState) {
        const guild = oldState.guild || newState.guild;
        const exit = console.guilds[guild.id]?.exit;
        const mainMusic = require("./musics/main.js");
        if ((oldState.id == guild.me.id || newState.id == guild.me.id) && (!guild.me.voice || !guild.me.voice.channel)) return await mainMusic.stop(guild);
        if (!guild.me.voice || !guild.me.voice.channel || (newState.channelID !== guild.me.voice.channelID && oldState.channelID !== guild.me.voice.channelID)) return;
        if (guild.me.voice.channel.members.size <= 1) {
            if (exit) return;
            console.guilds[guild.id].exit = true;
            setTimeout(async () => exit ? mainMusic.stop(guild) : 0, 30000);
        } else console.guilds[guild.id].exit = false;
    },
    async guildMemberUpdate(oldMember, newMember) {
        const client = oldMember.client || newMember.client;
        if (oldMember.premiumSinceTimestamp || !newMember.premiumSinceTimestamp) return;
        const boost = console.guilds[newMember.guild.id]?.boost;
        if (!boost?.channel || !boost.message) return;
        try {
            const channel = await client.channels.fetch(boost.channel);
            channel.send(boost.message.replace(/\{user\}/gi, `<@${newMember.id}>`));
        } catch (err) { }
    },
    async messageReactionAdd(r, user) {
        var roleMessage = console.rm.find(x => x.id == r.message.id);
        if (!roleMessage) return;
        const emojis = JSON.parse(roleMessage.emojis);
        var index = -1;
        if (emojis.includes(r.emoji.id)) index = emojis.indexOf(r.emoji.id);
        else if (emojis.includes(r.emoji.name)) index = emojis.indexOf(r.emoji.name);
        else return;
        try {
            const guild = await r.client.guilds.cache.get(roleMessage.guild);
            const member = await guild.members.fetch(user);
            if (index > -1) await member.roles.add(JSON.parse(roleMessage.roles)[index]);
        } catch (err) {
            console.error(err);
        }
    },
    async messageReactionRemove(r, user) {
        var roleMessage = console.rm.find(x => x.id == r.message.id);
        if (!roleMessage) return;
        const emojis = JSON.parse(roleMessage.emojis);
        var index = -1;
        if (emojis.includes(r.emoji.id)) index = emojis.indexOf(r.emoji.id);
        else if (emojis.includes(r.emoji.name)) index = emojis.indexOf(r.emoji.name);
        else return;
        try {
            const guild = await r.client.guilds.cache.get(roleMessage.guild);
            const member = await guild.members.fetch(user);
            if (index > -1) await member.roles.remove(JSON.parse(roleMessage.roles)[index]);
        } catch (err) {
            console.error(err);
        }
    },
    async messageDelete(message) {
        var roleMessage = console.rm.find(x => x.id === message.id);
        if (!roleMessage) return;
        console.rm.splice(console.rm.indexOf(roleMessage), 1);
        await pool.query(`DELETE FROM rolemsg WHERE id = '${message.id}'`);
    },
    async message(message) {
        message.prefix = message.client.prefix;
        if (message.guild && console.guilds[message.guild.id]?.prefix && message.client.id === 0) message.prefix = console.guilds[message.guild.id].prefix;
        messageLevel(message);
        const args = message.content.slice(message.prefix.length).split(/ +/);
        if (message.client.id == 1 && message.channel.id == "647630951169523762") {
            if (args.length > 1 || !message.content) return;
            const mcName = message.content;
            console.log("Received name: " + mcName);
            const dcUserID = message.author.id;
            MojangAPI.nameToUuid(message.content, async function (err, res) {
                if (err) return message.channel.send("Error updating record! Please contact NorthWestWind#1885 to fix this.").then(msg => msg.delete({ timeout: 10000 }));
                if (!res[0]) return message.channel.send("Error finding that user!");
                const mcUuid = res[0].id;
                const con = await pool.getConnection();
                try {
                    var [results] = await con.query(`SELECT * FROM dcmc WHERE dcid = '${dcUserID}'`);
                    if (results.length == 0) {
                        await con.query(`INSERT INTO dcmc VALUES(NULL, '${dcUserID}', '${mcUuid}')`);
                        message.channel.send("Added record! This message will be auto-deleted in 10 seconds.").then(msg => msg.delete({ timeout: 10000 }));
                        console.log("Inserted record for mc-name.");
                    } else {
                        await con.query(`UPDATE dcmc SET uuid = '${mcUuid}' WHERE dcid = '${dcUserID}'`);
                        message.channel.send("Updated record! This message will be auto-deleted in 10 seconds.").then(msg => msg.delete({ timeout: 10000 }));
                        console.log("Updated record for mc-name.");
                    }
                } catch (err) {
                    await message.channel.send("Error updating record! Please contact NorthWestWind#1885 to fix this.").then(msg => msg.delete({ timeout: 10000 }));
                }
                con.release();
            });
            return;
        }
        if (!message.content.startsWith(message.prefix) || message.author.bot) {
            if (!message.author.bot && Math.floor(Math.random() * 1000) === 69) cleverbot(message.content).then(response => message.channel.send(response));
            return;
        };
        const commandName = args.shift().toLowerCase();
        if (commandName === "guild" && message.client.id === 0) return;
        const command = console.commands.get(commandName) || console.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
        if (!command) return;
        if (command.args && args.length < command.args) return message.channel.send(`The command \`${message.prefix}${commandName}\` requires ${command.args} arguments.\nHere's how you are supposed to use it: \`${message.prefix}${command.name}${command.usage ? ` ${command.usage}` : ""}\``);
        if (message.client.id === 0) {
            if (timeout) {
                clearTimeout(timeout);
                timeout = undefined;
            } else message.client.user.setPresence({ activity: { name: `${message.author.username}'s Commands`, type: "WATCHING" }, status: "online", afk: false });
            timeout = setTimeout(() => {
                message.client.user.setPresence({ activity: { name: "AFK", type: "PLAYING" }, status: "idle", afk: true });
                timeout = undefined;
            }, 10000);
        }
        if (message.guild && !message.channel.permissionsFor(message.guild.me).has(84992)) return await message.author.send(`I need at least the permissions to \`${new Discord.Permissions(84992).toArray().join("`, `")}\` in order to run any command! Please tell your server administrator about that.`);
        message.pool = pool;
        try {
            if (command.category === 8) await require("./musics/main.js").music(message, commandName);
            else await command.execute(message, args);
        } catch (error) {
            console.error(`Error running command ${command.name}`);
            if (command.name === "musescore") console.error(`Arguments: ${args.join(" ")}`);
            console.error(error);
            message.reply("there was an error trying to execute that command!\nIf it still doesn't work after a few tries, please contact NorthWestWind or report it on the support server.");
        }
    }
}
