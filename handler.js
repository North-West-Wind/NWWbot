const cleverbot = require("cleverbot-free");
const { Image, createCanvas, loadImage } = require("canvas");
const Discord = require("discord.js");
const mysql = require("mysql");
const mysql_config = {
    connectTimeout: 60 * 60 * 1000,
    acquireTimeout: 60 * 60 * 1000,
    timeout: 60 * 60 * 1000,
    connectionLimit: 1000,
    host: process.env.DBHOST,
    user: process.env.DBUSER,
    password: process.env.DBPW,
    database: process.env.DBNAME,
    supportBigNumbers: true,
    bigNumberStrings: true,
    charset: "utf8mb4"
};
var pool = mysql.createPool(mysql_config);
const { setTimeout_ } = require("./function.js");
const wait = require("util").promisify(setTimeout);
module.exports = {
    async ready(client, id) {
        console.log(`[${id}] Ready!`);
        if (id === 1) {
            setInterval(async () => {
                const guild = await client.guilds.resolve("622311594654695434");
                const memberCount = guild.memberCount;
                const userMember = guild.members.cache;
                var onlineMemberCount = 0;
                var botMemberCount = 0;
                for (const user of userMember.values()) {
                    if (user.user.bot) botMemberCount += 1;
                    if (user.presence !== undefined && user.presence.status === "online") onlineMemberCount += 1;
                    if (user.presence !== undefined && user.presence.status === "idle") onlineMemberCount += 1;
                    if (user.presence !== undefined && user.presence.status === "dnd") onlineMemberCount += 1;
                }
                var memberCountChannel = await guild.channels.resolve("722379389102194718");
                var botCountChannel = await guild.channels.resolve("722379396652072970");
                var onlineCountChannel = await guild.channels.resolve("722379393263075338");

                memberCountChannel.edit({ name: "All Members: " + memberCount }).catch(console.realError);
                botCountChannel.edit({ name: "Bots: " + botMemberCount }).catch(console.realError);
                onlineCountChannel.edit({ name: "Online: " + onlineMemberCount }).catch(console.realError);
            }, 30000);
        }

        if (id === 0)
            client.user.setActivity("You", { type: "WATCHING" });
        else
            client.user.setActivity("Sword Art Online Alicization", { type: "LISTENING" });
        pool.getConnection(function (err, con) {
            if (err) return console.error(err);
            const { setQueue } = require("./musics/main.js");
            if (id === 0) {
                con.query("SELECT id, queue, looping, repeating FROM servers", function (err, results) {
                    if (err) return console.error(err);
                    var count = 0;
                    results.forEach(result => {
                        if (result.queue !== null || result.looping !== null || result.repeating !== null) {
                            var queue = result.queue !== null ? JSON.parse(unescape(result.queue)) : [];
                            setQueue(result.id, queue, result.looping === 1 ? true : false, result.repeating === 1 ? true : false);
                            count += 1;
                        }
                    });
                    console.log("Set " + count + " queues");
                });
            }
            con.query("SELECT * FROM rolemsg ORDER BY expiration", (err, res) => {
                console.log("Found " + res.length + " role messages.");
                res.forEach(async result => {
                    if (id === 0 && result.guild.id == "622311594654695434") return;
                    if (id === 1 && result.guild.id != "622311594654695434" && result.guild.id != "664716701991960577") return;
                    console.rm.push(result);
                    var channel = await client.channels.fetch(result.channel);
                    var msg = await channel.messages.fetch(result.id);

                    var currentDate = new Date();
                    var millisec = result.expiration - currentDate;
                    async function expire(length) {
                        setTimeout_(() => {
                            con.query(`SELECT id, expiration FROM rolemsg WHERE id = '${result.id}'`, async (err, results) => {
                                if (err) return console.error(err);
                                if (results.length == 0) return;
                                var date = new Date();
                                var deleted = false;
                                try {
                                    var channel = await client.channels.fetch(results[0].channel);
                                    var msg = await channel.messages.fetch(results[0].id);
                                } catch (err) {
                                    var deleted = true;
                                }
                                if (results[0].expiration - date <= 0) {
                                    con.query(`DELETE FROM rolemsg WHERE id = '${results[0].id}'`, async (err) => {
                                        if (err) return console.error(err);
                                        console.log("Deleted an expired role-message.");
                                        if (!deleted)
                                            msg.reactions.removeAll().catch(err => console.error("Failed to remove reactions but nevermind."));
                                    });
                                } else {
                                    expire(results[0].expiration - date);
                                }
                            });
                        }, length);
                    }
                    expire(millisec);
                });
            });
            con.query("SELECT * FROM giveaways ORDER BY endAt ASC", function (
                err,
                results
            ) {
                console.log("Found " + results.length + " giveaways");
                results.forEach(async result => {
                    if (id === 0 && result.guild.id == "622311594654695434") return;
                    if (id === 1 && result.guild.id != "622311594654695434" && result.guild.id != "664716701991960577") return;
                    var currentDate = new Date();
                    var millisec = result.endAt - currentDate;
                    if (err) return console.error(err);
                    setTimeout_(async function () {
                        try {
                            var channel = await client.channels.fetch(result.channel);
                        } catch (err) {
                            console.log("Failed fetching guild/channel of giveaway.");
                            return console.error(err);
                        }
                        try {
                            var msg = await channel.messages.fetch(result.id);
                        } catch (err) {
                            con.query("DELETE FROM giveaways WHERE id = " + result.id, function (
                                err,
                                con
                            ) {
                                if (err) return console.error(err);
                                console.log("Deleted an ended giveaway record.");
                            });
                            return;
                        }
                        if (msg.deleted) {
                            con.query("DELETE FROM giveaways WHERE id = " + msg.id, function (
                                err,
                                con
                            ) {
                                if (err) return console.error(err);
                                console.log("Deleted an ended giveaway record.");
                            });
                            return;
                        } else {
                            var fetchUser = await client.users.fetch(result.author);
                            var endReacted = [];
                            var peopleReacted = await msg.reactions.cache.get(result.emoji);
                            try {
                                await peopleReacted.users.fetch();
                            } catch (err) {
                                con.query("DELETE FROM giveaways WHERE id = " + msg.id, function (
                                    err
                                ) {
                                    if (err) return console.error(err);
                                    console.log("Deleted an ended giveaway record.");
                                });
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
                            if (remove > -1) {
                                endReacted.splice(remove, 1);
                            }

                            if (endReacted.length === 0) {
                                con.query("DELETE FROM giveaways WHERE id = " + msg.id, function (
                                    err
                                ) {
                                    if (err) return console.error(err);
                                    console.log("Deleted an ended giveaway record.");
                                });
                                const Ended = new Discord.MessageEmbed()
                                    .setColor(parseInt(result.color))
                                    .setTitle(unescape(result.item))
                                    .setDescription("Giveaway ended")
                                    .addField("Winner(s)", "None. Cuz no one reacted.")
                                    .setTimestamp()
                                    .setFooter(
                                        "Hosted by " +
                                        fetchUser.username +
                                        "#" +
                                        fetchUser.discriminator,
                                        fetchUser.displayAvatarURL()
                                    );
                                msg.edit(Ended);
                                msg.reactions.removeAll().catch(err => console.error(err));
                                return;
                            } else {
                                var index = Math.floor(Math.random() * endReacted.length);
                                var winners = [];
                                var winnerMessage = "";
                                var winnerCount = result.winner;

                                for (var i = 0; i < winnerCount; i++) {
                                    winners.push(endReacted[index]);
                                    index = Math.floor(Math.random() * endReacted.length);
                                }

                                for (var i = 0; i < winners.length; i++) {
                                    winnerMessage += "<@" + winners[i] + "> ";
                                }

                                const Ended = new Discord.MessageEmbed()
                                    .setColor(parseInt(result.color))
                                    .setTitle(unescape(result.item))
                                    .setDescription("Giveaway ended")
                                    .addField("Winner(s)", winnerMessage)
                                    .setTimestamp()
                                    .setFooter(
                                        "Hosted by " +
                                        fetchUser.username +
                                        "#" +
                                        fetchUser.discriminator,
                                        fetchUser.displayAvatarURL()
                                    );
                                msg.edit(Ended);
                                var link = `https://discordapp.com/channels/${msg.guild.id}/${msg.channel.id}/${msg.id}`;
                                msg.channel.send(
                                    "Congratulation, " +
                                    winnerMessage +
                                    "! You won **" +
                                    unescape(result.item) +
                                    "**!\n" +
                                    link
                                );
                                msg.reactions
                                    .removeAll()
                                    .catch(error =>
                                        console.error("Failed to clear reactions: ", error)
                                    );

                                con.query("DELETE FROM giveaways WHERE id = " + msg.id, function (
                                    err,
                                    con
                                ) {
                                    if (err) return console.error(err);
                                    console.log("Deleted an ended giveaway record.");
                                });
                            }
                        }
                    }, millisec);
                });
            });
            con.query("SELECT * FROM poll ORDER BY endAt ASC", function (
                err,
                results,
                fields
            ) {
                if (err) return console.error(err);
                console.log("Found " + results.length + " polls.");
                results.forEach(result => {
                    if (id === 0 && result.guild.id == "622311594654695434") return;
                    if (id === 1 && result.guild.id != "622311594654695434" && result.guild.id != "664716701991960577") return;
                    var currentDate = new Date();
                    var time = result.endAt - currentDate;
                    setTimeout_(async function () {
                        try {
                            var channel = await client.channels.fetch(result.channel);
                        } catch (err) {
                            console.log("Failed fetching guild/channel of giveaway.");
                            return console.error(err);
                        }
                        try {
                            var msg = await channel.messages.fetch(result.id);
                        } catch (err) {
                            con.query("DELETE FROM poll WHERE id = " + result.id, function (
                                err,
                                con
                            ) {
                                if (err) return console.error(err);
                                console.log("Deleted an ended poll.");
                            });
                            return;
                        }

                        if (msg.deleted) {
                            con.query("DELETE FROM poll WHERE id = " + msg.id, function (
                                err,
                                result
                            ) {
                                if (err) return console.error(err);
                                console.log("Deleted an ended poll.");
                            });
                            return;
                        } else {
                            var author = await client.users.fetch(result.author);
                            var allOptions = await JSON.parse(result.options);

                            var pollResult = [];
                            var end = [];
                            for (const emoji of msg.reactions.cache.values()) {
                                await pollResult.push(emoji.count);
                                var mesg =
                                    "**" +
                                    (emoji.count - 1) +
                                    "** - `" +
                                    unescape(allOptions[pollResult.length - 1]) +
                                    "`";
                                await end.push(mesg);
                            }
                            var pollMsg = "⬆**Poll**⬇";
                            const Ended = new Discord.MessageEmbed()
                                .setColor(parseInt(result.color))
                                .setTitle(unescape(result.title))
                                .setDescription(
                                    "Poll ended. Here are the results:\n\n\n" +
                                    end
                                        .join("\n\n")
                                        .replace(/#quot;/g, "'")
                                        .replace(/#dquot;/g, '"')
                                )
                                .setTimestamp()
                                .setFooter(
                                    "Hosted by " + author.username + "#" + author.discriminator,
                                    author.displayAvatarURL()
                                );
                            msg.edit(pollMsg, Ended);
                            var link = `https://discordapp.com/channels/${msg.guild.id}/${msg.channel.id}/${msg.id}`;

                            msg.channel.send("A poll has ended!\n" + link);
                            msg.reactions.removeAll().catch(err => {
                                console.error(err);
                            });
                            con.query("DELETE FROM poll WHERE id = " + msg.id, function (
                                err,
                                result
                            ) {
                                if (err) return console.error(err);
                                console.log("Deleted an ended poll.");
                            });
                        }
                    }, time);
                });
            });
            con.query("SELECT * FROM timer", (err, results) => {
                console.log(`Found ${results.length} timers.`);
                results.forEach(async result => {
                    if (id === 0 && result.guild.id == "622311594654695434") return;
                    if (id === 1 && result.guild.id != "622311594654695434" && result.guild.id != "664716701991960577") return;
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
                    if (msg.embeds[0].color && msg.embeds[0].title && msg.embeds[0].footer && msg.embeds[0].timestamp) {
                        em.setTitle(msg.embeds[0].title).setColor(msg.embeds[0].color).setFooter(msg.embeds[0].footer.text, msg.embeds[0].footer.iconURL).setTimestamp(msg.embeds[0].timestamp);
                    }
                    let count = 0;
                    let id = setInterval(async () => {
                        time -= 1000;
                        if (time <= 0) {
                            clearInterval(id);
                            em.setDescription("The timer has ended.");
                            msg = await msg.edit(em);
                            author.send(`Your timer in **${guild.name}** has ended! https://discordapp.com/channels/${guild.id}/${channel.id}/${msg.id}`);
                            con.query(`SELECT * FROM timer WHERE guild = '${guild.id}' AND channel = '${channel.id}' AND author = '${author.id}' AND msg = '${msg.id}'`, (err, results) => {
                                if (err) return console.error(err);
                                if (results.length < 1) return;
                                con.query(`DELETE FROM timer WHERE guild = '${guild.id}' AND channel = '${channel.id}' AND author = '${author.id}' AND msg = '${msg.id}'`, (err) => {
                                    if (err) return console.error(err);
                                    console.log("Deleted a timed out timer from the database.");
                                });
                            });

                            return;
                        }
                        if (count < 4) {
                            count++;
                            return;
                        }
                        let sec = Math.floor(time / 1000);
                        var dd = Math.floor(sec / 86400);
                        var dh = Math.floor((sec % 86400) / 3600);
                        var dm = Math.floor(((sec % 86400) % 3600) / 60);
                        var ds = Math.floor(((sec % 86400) % 3600) % 60);
                        var d = "";
                        var h = "";
                        var m = "";
                        var s = "";
                        if (dd !== 0) {
                            d = " " + dd + " days";
                        }
                        if (dh !== 0) {
                            h = " " + dh + " hours";
                        }
                        if (dm !== 0) {
                            m = " " + dm + " minutes";
                        }
                        if (ds !== 0) {
                            s = " " + ds + " seconds";
                        }
                        em.setDescription(`(The timer updates every **5 seconds**)\nThis is a timer and it will last for\n**${d + h + m + s}**`);
                        msg = await msg.edit(em);
                        count = 0;
                    }, 1000);
                    console.timers.set(result.msg, id);
                });
            });
            con.query("SELECT * FROM nolog", (err, results) => {
                if (err) return console.error(err);
                results.forEach(result => {
                    console.noLog.push(result.id);
                });
            });
            con.release();
        });
        wait(1000);
        client.guilds.cache.forEach(g => {
            g.fetchInvites().then(guildInvites => {
                console.invites[g.id] = guildInvites;
            }).catch(err => { });
        });
    },
    async guildMemberAdd(member, client, id) {
        const guild = member.guild;
        guild.fetchInvites().then(async guildInvites => {
            const ei = console.invites[member.guild.id];
            console.invites[member.guild.id] = guildInvites;
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
                inviter.send(`You invited **${member.user.tag}** to the server **${guild.name}**! In total, you have now invited **${uses} users** to the server!\n(If you want to disable this message, use \`${prefix}invites toggle\` to turn it off)`);
            } catch (err) {
                console.error("Failed to DM user.");
            }
        }).catch(err => { });
        if (guild.id == "677780367188557824")
            setTimeout(async () => {
                var role = await guild.roles.fetch("677785442099396608");
                member.roles.add(role);
            }, 60000);
        if (member.user.bot) return;
        pool.getConnection(function (err, con) {
            if (err) return console.error(err);
            con.query(
                "SELECT welcome, wel_channel, wel_img, autorole FROM servers WHERE id=" +
                guild.id,
                async function (err, result) {
                    if (!result[0]|| !result[0].wel_channel || !result[0].welcome) {
                        if (!result[0]) {
                            pool.getConnection(function (err, con) {
                                if (err) return console.error(err);
                                con.query(
                                    "SELECT * FROM servers WHERE id = " + guild.id,
                                    function (err, result) {
                                        if (err) return console.error(err);
                                        if (result.length > 0) {
                                            console.log(
                                                "Found row inserted for this server before. Cancelling row insert..."
                                            );
                                        } else {
                                            con.query(
                                                "INSERT INTO servers (id, autorole, giveaway) VALUES (" +
                                                guild.id +
                                                ", '[]', '🎉')",
                                                function (err) {
                                                    if (err) return console.error(err);
                                                    console.log("Inserted record for " + guild.name);
                                                }
                                            );
                                        }
                                    }
                                );

                                if (err) return console.error(err);
                                con.release();
                            });
                        }
                    } else {
                        //get channel
                        const channel = guild.channels.resolve(result[0].wel_channel);


                        //convert message into array
                        const splitMessage = result[0].welcome.split(" ");
                        const messageArray = [];

                        splitMessage.forEach(word => {
                            //check channel
                            if (word.startsWith("{#")) {
                                const first = word.replace("{#", "");
                                const second = first.replace("}", "");
                                if (isNaN(parseInt(second))) {
                                    const mentionedChannel = guild.channels.find(
                                        x => x.name === second
                                    );
                                    if (!mentionedChannel) {
                                        messageArray.push("#" + second);
                                    } else {
                                        messageArray.push(mentionedChannel);
                                    }
                                } else {
                                    const mentionedChannel = guild.channels.resolve(second);
                                    if (!mentionedChannel) {
                                        messageArray.push("<#" + second + ">");
                                    } else {
                                        messageArray.push(mentionedChannel);
                                    }
                                }
                            }

                            //check role
                            else if (word.startsWith("{&")) {
                                const first = word.replace("{&", "");
                                const second = first.replace("}", "");
                                if (isNaN(parseInt(second))) {
                                    const mentionedRole = guild.roles.find(x => x.name === second);
                                    if (!mentionedRole) {
                                        messageArray.push("@" + second);
                                    } else {
                                        messageArray.push(mentionedRole);
                                    }
                                } else {
                                    const mentionedRole = guild.roles.get(second);
                                    if (!mentionedRole) {
                                        messageArray.push("<@&" + second + ">");
                                    } else {
                                        messageArray.push(mentionedRole);
                                    }
                                }
                            }

                            //check mentioned users
                            else if (word.startsWith("{@")) {
                                const first = word.replace("{@", "");
                                const second = first.replace("}", "");
                                if (isNaN(parseInt(second))) {
                                    const mentionedUser = client.users.find(x => x.name === second);
                                    if (!mentionedUser) {
                                        messageArray.push("@" + second);
                                    } else {
                                        messageArray.push(mentionedUser);
                                    }
                                } else {
                                    const mentionedUser = client.users.get(second);
                                    if (!mentionedUser) {
                                        messageArray.push("<@" + second + ">");
                                    } else {
                                        messageArray.push(mentionedUser);
                                    }
                                }
                            } else {
                                messageArray.push(word);
                            }
                        });

                        //construct message
                        const welcomeMessage = messageArray
                            .join(" ")
                            .replace(/{user}/g, member);

                        if (result[0].welcome) {
                            try {
                                //send message only
                                channel.send(welcomeMessage);
                            } catch (err) {
                                console.error(err);
                            }
                        }
                        //check image link
                        if (result[0].wel_img) {
                            //canvas
                            var img = new Image();

                            img.onload = async function () {
                                var height = img.height;
                                var width = img.width;

                                const canvas = createCanvas(width, height);
                                const ctx = canvas.getContext("2d");

                                const applyText = (canvas, text) => {
                                    const ctx = canvas.getContext("2d");

                                    let fontSize = canvas.width / 12;

                                    do {
                                        ctx.font = `${(fontSize -= 5)}px "free-sans", Arial`;
                                    } while (
                                        ctx.measureText(text).width >
                                        canvas.width - canvas.width / 10
                                    );
                                    return ctx.font;
                                };
                                const welcomeText = (canvas, text) => {
                                    const ctx = canvas.getContext("2d");
                                    let fontSize = canvas.width / 24;
                                    do {
                                        ctx.font = `${(fontSize -= 5)}px "free-sans", Arial`;
                                    } while (
                                        ctx.measureText(text).width >
                                        canvas.width - canvas.width / 4
                                    );
                                    return ctx.font;
                                };
                                const image = await loadImage(url);
                                const avatar = await loadImage(
                                    member.user.displayAvatarURL({ format: "png" })
                                );
                                ctx.drawImage(image, 0, 0, width, height);
                                var txt = member.user.username + " #" + member.user.discriminator;
                                ctx.font = applyText(canvas, txt);
                                ctx.strokeStyle = "black";
                                ctx.lineWidth = canvas.width / 102.4;
                                ctx.strokeText(
                                    txt,
                                    canvas.width / 2 - ctx.measureText(txt).width / 2,
                                    (canvas.height * 3) / 4
                                );
                                ctx.fillStyle = "#ffffff";
                                ctx.fillText(
                                    txt,
                                    canvas.width / 2 - ctx.measureText(txt).width / 2,
                                    (canvas.height * 3) / 4
                                );
                                var welcome = "Welcome to the server!";
                                ctx.font = welcomeText(canvas, welcome);
                                ctx.strokeStyle = "black";
                                ctx.lineWidth = canvas.width / 204.8;
                                ctx.strokeText(
                                    welcome,
                                    canvas.width / 2 - ctx.measureText(welcome).width / 2,
                                    (canvas.height * 6) / 7
                                );
                                ctx.fillStyle = "#ffffff";
                                ctx.fillText(
                                    welcome,
                                    canvas.width / 2 - ctx.measureText(welcome).width / 2,
                                    (canvas.height * 6) / 7
                                );
                                ctx.beginPath();
                                ctx.lineWidth = canvas.width / 51.2;
                                ctx.arc(
                                    canvas.width / 2,
                                    canvas.height / 3,
                                    canvas.height / 5,
                                    0,
                                    Math.PI * 2,
                                    true
                                );
                                ctx.closePath();
                                ctx.strokeStyle = "#dfdfdf";
                                ctx.stroke();
                                ctx.clip();
                                ctx.drawImage(
                                    avatar,
                                    canvas.width / 2 - canvas.height / 5,
                                    canvas.height / 3 - canvas.height / 5,
                                    canvas.height / 2.5,
                                    canvas.height / 2.5
                                );
                                var attachment = new Discord.MessageAttachment(
                                    canvas.toBuffer(),
                                    "welcome-image.png"
                                );

                                try {
                                    channel.send("", attachment);
                                } catch (err) {
                                    console.error(err);
                                }
                            };

                            var url = result[0].wel_img;
                            try {
                                var urls = JSON.parse(result[0].wel_img);
                                url = urls[Math.floor(Math.random() * urls.length)];
                            } catch(err) {
                                url = result[0].wel_img;
                            }
                            img.src = url;
                        }
                    }
                    if (!result[0] || result[0].autorole === "[]") {
                    } else {
                        var roleArray = JSON.parse(result[0].autorole);

                        for (var i = 0; i < roleArray.length; i++) {
                            var roleID = roleArray[i];
                            if (isNaN(parseInt(roleID))) {
                                var role = await guild.roles.find(x => x.name === roleID);
                            } else {
                                var role = await guild.roles.fetch(roleID);
                            }
                            try {
                                member.roles.add(role);
                                console.log(`Added ${member.displayName} to ${role.name}`)
                            } catch (err) {
                                console.error(err);
                            }
                        }
                    }
                    con.release();

                    if (err) return console.error(err);
                }
            );
        });
    },
    async guildMemberRemove(member, client, id) {
        const guild = member.guild;
        pool.getConnection(function (err, con) {
            if (err) return console.error(err);
            con.query(
                "SELECT leave_msg, leave_channel FROM servers WHERE id='" + guild.id + "'",
                async function (err, result) {
                    if (
                        !result[0] ||
                        !result[0].leave_msg ||
                        !result[0].leave_channel
                    ) {
                        if (!result[0]) {
                            con.query(
                                "SELECT * FROM servers WHERE id = " + guild.id,
                                function (err, result) {
                                    if (err) return console.error(err);
                                    if (result.length > 0) {
                                        console.log(
                                            "Found row inserted for this server before. Cancelling row insert..."
                                        );
                                    } else {
                                        con.query(
                                            "INSERT INTO servers (id, autorole, giveaway) VALUES (" +
                                            guild.id +
                                            ", '[]', '🎉')",
                                            function (err) {
                                                if (err) return console.error(err);
                                                console.log("Inserted record for " + guild.name);
                                            }
                                        );
                                    }
                                }
                            );

                            if (err) return console.error(err);
                        }
                    } else {
                        if (guild.me.hasPermission("VIEW_AUDIT_LOGS")) {
                            const fetchedLogs = await guild.fetchAuditLogs({
                                limit: 1,
                                type: 'MEMBER_KICK',
                            });
                            const kickLog = fetchedLogs.entries.first();
                            if (kickLog && kickLog.target.id === member.user.id && kickLog.executor.id !== kickLog.target.id) return;
                        } else {
                            console.log("Can't view audit logs of " + guild.name);
                        }
                        const channel = guild.channels.resolve(result[0].leave_channel);
                        const splitMessage = result[0].leave_msg.split(" ");
                        const messageArray = [];

                        splitMessage.forEach(word => {
                            //check channel
                            if (word.startsWith("{#")) {
                                const first = word.replace("{#", "");
                                const second = first.replace("}", "");
                                if (isNaN(parseInt(second))) {
                                    const mentionedChannel = guild.channels.find(
                                        x => x.name === second
                                    );
                                    if (!mentionedChannel) {
                                        messageArray.push("#" + second);
                                    } else {
                                        messageArray.push(mentionedChannel);
                                    }
                                } else {
                                    const mentionedChannel = guild.channels.resolve(second);
                                    if (!mentionedChannel) {
                                        messageArray.push("<#" + second + ">");
                                    } else {
                                        messageArray.push(mentionedChannel);
                                    }
                                }
                            }

                            //check role
                            else if (word.startsWith("{&")) {
                                const first = word.replace("{&", "");
                                const second = first.replace("}", "");
                                if (isNaN(parseInt(second))) {
                                    const mentionedRole = guild.roles.find(x => x.name === second);
                                    if (!mentionedRole) {
                                        messageArray.push("@" + second);
                                    } else {
                                        messageArray.push(mentionedRole);
                                    }
                                } else {
                                    const mentionedRole = guild.roles.get(second);
                                    if (!mentionedRole) {
                                        messageArray.push("<@&" + second + ">");
                                    } else {
                                        messageArray.push(mentionedRole);
                                    }
                                }
                            }

                            //check mentioned users
                            else if (word.startsWith("{@")) {
                                const first = word.replace("{@", "");
                                const second = first.replace("}", "");
                                if (isNaN(parseInt(second))) {
                                    const mentionedUser = client.users.find(x => x.name === second);
                                    if (!mentionedUser) {
                                        messageArray.push("@" + second);
                                    } else {
                                        messageArray.push(mentionedUser);
                                    }
                                } else {
                                    const mentionedUser = client.users.get(second);
                                    if (!mentionedUser) {
                                        messageArray.push("<@" + second + ">");
                                    } else {
                                        messageArray.push(mentionedUser);
                                    }
                                }
                            } else {
                                messageArray.push(word);
                            }
                        });

                        const leaveMessage = messageArray
                            .join(" ")
                            .replace(/{user}/g, `**${member.user.tag}**`);

                        try {
                            channel.send(leaveMessage);
                        } catch (err) {
                            console.error(err);
                        }
                    }

                    if (err) return console.error(err);
                }
            );
            con.release();
        });
    },
    async guildCreate(guild) {
        console.log("Joined a new guild: " + guild.name);
        console.invites[guild.id] = await guild.fetchInvites();

        pool.getConnection(function (err, con) {
            if (err) return console.error(err);
            con.query("SELECT * FROM servers WHERE id = " + guild.id, function (
                err,
                result
            ) {
                if (err) return console.error(err);
                if (result.length > 0) {
                    console.log(
                        "Found row inserted for this server before. Cancelling row insert..."
                    );
                } else {
                    con.query(
                        "INSERT INTO servers (id, autorole, giveaway) VALUES (" +
                        guild.id +
                        ", '[]', '🎉')",
                        function (err) {
                            if (err) return console.error(err);
                            console.log("Inserted record for " + guild.name);
                        }
                    );
                }
            });

            if (err) return console.error(err);
            con.release();
        });
    },
    async guildDelete(guild) {
        console.log("Left a guild: " + guild.name);
        delete console.invites[guild.id];
        pool.getConnection(function (err, con) {
            if (err) return console.error(err);
            con.query("DELETE FROM servers WHERE id=" + guild.id, function (
                err
            ) {
                if (err) return console.error(err);
                console.log("Deleted record for " + guild.name);
            });
            if (err) return console.error(err);
            con.release();
        });
    },
    async voiceStateUpdate(oldState, newState, client, exit) {
        const guild = oldState.guild || newState.guild;
        if (!guild.me.voice || !guild.me.voice.channel || (newState.channelID !== guild.me.voice.channelID && oldState.channelID !== guild.me.voice.channelID)) return;
        if (guild.me.voice.channel.members.size <= 1) {
            var pendingExit = await exit.find(x => x === guild.id);
            if (pendingExit) return;
            exit.push(guild.id);
            setTimeout(async function () {
                var shouldExit = exit.find(x => x === guild.id);
                if (!shouldExit) return;
                const mainMusic = require("./musics/main.js");
                return await mainMusic.stop(guild);
            }, 30000);
        } else {
            var index = exit.indexOf(guild.id);
            if (index !== -1) {
                exit.splice(index, 1);
            }
        }
    },
    async guildMemberUpdate(oldMember, newMember, client) {
        if (oldMember.premiumSinceTimestamp !== null || newMember.premiumSinceTimestamp === null) return;
        pool.getConnection(function (err, con) {
            if (err) return console.error(err);
            con.query("SELECT boost_msg, boost_channel FROM servers WHERE id = '" + newMember.guild.id + "'", async function (err, result) {
                if (err) return console.error(err);
                if (result[0] === undefined || result[0].boost_msg === null || result[0].boost_channel === null) return;
                try {
                    var channel = await client.channels.fetch(result[0].boost_channel);
                } catch (err) {
                    return console.error(err);
                }
                channel.send(result[0].boost_msg.replace(/{user}/g, `<@${newMember.id}>`));
            });
            con.release();
        });
    },
    async messageReactionAdd(r, user) {
        var roleMessage = console.rm.find(x => x.id === r.message.id);
        if (!roleMessage) return;
        var emojis = JSON.parse(roleMessage.emojis);
        if (!emojis.includes(r.emoji.name)) return;
        var index = emojis.indexOf(r.emoji.name);
        var guild = await client.guilds.cache.get(roleMessage.guild);
        var member = await guild.members.fetch(user);
        member.roles.add([JSON.parse(roleMessage.roles)[index]]).catch(console.error);
    },
    async messageReactionRemove(r, user) {
        var roleMessage = console.rm.find(x => x.id === r.message.id);
        if (!roleMessage) return;
        var emojis = JSON.parse(roleMessage.emojis);
        if (!emojis.includes(r.emoji.name)) return;
        var index = emojis.indexOf(r.emoji.name);
        var guild = await client.guilds.cache.get(roleMessage.guild);
        var member = await guild.members.fetch(user);
        member.roles.remove([JSON.parse(roleMessage.roles)[index]]).catch(console.error);
    },
    async messageDelete(message) {
        var roleMessage = console.rm.find(x => x.id === message.id);
        if (!roleMessage) return;
        console.rm.splice(console.rm.indexOf(roleMessage), 1);
        pool.getConnection((err, con) => {
            con.query(`DELETE FROM rolemsg WHERE id = '${message.id}'`, (err) => {
                if (err) return console.error(err);
            });
            con.release();
        });
    },
    async message(message, musicCommandsArray, hypixelQueries, exit, client, id) {
        if (!message.content.startsWith(client.prefix) || message.author.bot) {
            if (!message.author.bot) {
                if (Math.floor(Math.random() * 1000) === 69)
                    cleverbot(message.content).then(response => message.channel.send(response));
            }
            return;
        };

        const args = message.content.slice(client.prefix.length).split(/ +/);
        const commandName = args.shift().toLowerCase();
        if (commandName === "guild" && id === 0) return;

        if (commandName.args && !args.length) {
            let reply = `You didn't provide any arguments, <@${message.author}>!`;

            if (command.usage) {
                reply += `\nThe proper usage would be: \`${client.prefix}${command.name} ${command.usage}\``;
            }

            return message.channel.send(reply);
        }

        const command =
            console.commands.get(commandName) ||
            console.commands.find(
                cmd => cmd.aliases && cmd.aliases.includes(commandName)
            );

        if (!command) {
            return;
        } else {
            if (message.guild !== null) {
                if (!message.channel.permissionsFor(message.guild.me).has(["SEND_MESSAGES", "VIEW_CHANNEL", "EMBED_LINKS", "READ_MESSAGE_HISTORY"])) return message.author.send("I don't have the required permissions! Please tell your server admin that I at least need `" + ["SEND_MESSAGES", "VIEW_CHANNEL", "EMBED_LINKS", "READ_MESSAGE_HISTORY"].join("`, `") + "`!")
            }
            if (musicCommandsArray.includes(command.name) == true) {
                const mainMusic = require("./musics/main.js");
                try {
                    return await mainMusic.music(message, commandName, pool, exit);
                } catch (error) {
                    console.error(error);
                    return await message.reply(
                        "there was an error trying to execute that command!\nIf it still doesn't work after a few tries, please contact NorthWestWind or report it on the support server."
                    );
                }
            }
            try {
                command.execute(message, args, pool, musicCommandsArray, hypixelQueries, console.rm);
            } catch (error) {
                console.error(error);
                message.reply("there was an error trying to execute that command!\nIf it still doesn't work after a few tries, please contact NorthWestWind or report it on the support server.");
            }
        }
    }
}