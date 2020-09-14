const Discord = require("discord.js");
var color = Math.floor(Math.random() * 16777214) + 1;
const ms = require("ms");
const math = require("mathjs");
const moment = require("moment");
const formatSetup = require("moment-duration-format");
formatSetup(moment);
module.exports = {
    name: "mathgame",
    description: "Math Game prototype.",
    usage: " ",
    async execute(message, args) {
        for (const arrs of Array.from(console.mathgames.values())) if (arrs.includes(message.author.id)) return message.channel.send("You are already in another game!");
        var msg = await message.channel.send("Who will be playing this game? (Please mention them)");
        let collected = await msg.channel.awaitMessages(x => x.author.id === message.author.id, { time: 30000, max: 1, errors: ["time"] });
        if (!collected || !collected.first() || !collected.first().content) return msg.edit("You didn't answer me within 30 seconds! Please try again.");
        await collected.first().delete();
        var players = [message.author];
        var scores = {};
        scores[message.author.id] = 0;
        for (const arrs of Array.from(console.mathgames.values()))
            for (const user of Array.from(collected.first().mentions.users.values()))
                if (arrs.includes(user.id)) return msg.edit(`**${user.tag}** is already in another game!`);
                else if (user.id !== message.author.id) { players.push(user); scores[user.id] = 0; }
        let mode = await this.selectMode(message, args);
        var questions = -1;
        var time = -1;
        collected = undefined;
        switch(mode) {
            case -1:
                return msg.edit("You didn't choose any mode in time!");
            case 0:
                msg = await msg.edit("Please enter the amount of questions.");
                collected = await msg.channel.awaitMessages(x => x.author.id === message.author.id, { time: 30000, max: 1, errors: ["time"] });
                if(!collected || !collected.first() || !collected.first().content) return msg.edit("Timed out. Please try again.");
                await collected.first().delete();
                questions = parseInt(collected.first().content);
                if(!questions || questions === 0 | isNaN(questions)) return msg.edit("That's not a valid number!");
                break;
            case 1:
                msg = await msg.edit("Please enter the time allowed.");
                collected = await msg.channel.awaitMessages(x => x.author.id === message.author.id, { time: 30000, max: 1, errors: ["time"] });
                if(!collected || !collected.first() || !collected.first().content) return msg.edit("Timed out. Please try again.");
                await collected.first().delete();
                time = ms(collected.first().content);
                if(!time || time === 0) return msg.edit("That's not a valid number!");
        }
        var em = new Discord.MessageEmbed()
            .setColor(color)
            .setTitle("Math Game Prototype")
            .setDescription(`Game Mode: **${questions > 0 ? `Limited Question Mode (${questions} Questions)` : time > 0 ? `Timer Mode (${moment.duration(Math.round(time / 1000), "seconds").format()})` : "Endless Mode"}**\n**${players.length < 2 ? "Singleplayer" : "Multiplayer"} Game**\nReact with "👌🏻" when you are ready!`)
            .setTimestamp()
            .setFooter("I will wait for 60 seconds.", message.client.user.displayAvatarURL());
        msg = await msg.edit({ content: "", embed: em });
        await msg.react("👌🏻");
        collected = undefined;
        collected = await msg.awaitReactions((reaction, user) => reaction.emoji.name === '👌🏻' && players.map(x => x.id).includes(user.id), { time: 60000, maxUsers: players.length, errors: ["time"] });
        if (!collected || !collected.first()) return msg.edit({ content: "Seriously? No one reacted?", embed: null });
        if (collected.first().count - 1 < players.length) return msg.edit({ content: "Someone is not active!", embed: null });
        await msg.reactions.removeAll();
        let now = Date.now();
        console.mathgames.set(now, players.map(x => x.id));
        var questionCount = 0;
        var running = true;
        if(time > 0) setTimeout(() => running = false, time);
        while(running) {
            const generated = await this.generateQuestion(questionCount);
            em.setTitle(`Question ${++questionCount}`).setDescription(`${generated.question}`).setTimestamp().setFooter("Send your answer here!");
            msg = await msg.edit(em);
            var correct = false;
            while(!correct) {
                collected = undefined;
                collected = await msg.channel.awaitMessages(x => players.map(u => u.id).includes(x.author.id), { time: questions < 0 && time < 0 ? 11000 : 60000 * 5, max: 1, errors: ["time"] });
                if(!collected || !collected.first() || !collected.first().content) {
                    running = false;
                    break;
                }
                await collected.first().delete();
                if(parseInt(collected.first().content) === generated.answer) {
                    scores[collected.first().author.id] += 1;
                    correct = true;
                }
            }
            if(questionCount >= questions && questions > 0) running = false;
        }
        let winner = {
            name: "",
            score: 0
        };
        for(const user of players) {
            if(scores[user.id] > winner.score) winner.name = user.tag;
            else if(scores[user.id] === winner.score) winner.name += ` ${user.tag}`;
        }
        em.setTitle("Game Over")
        .setDescription(`Here are the final scores after **${moment.duration(Math.round((Date.now() - now) / 1000), "seconds").format()}**!\n${players.map(x => `**${x.tag}** --- **${scores[x.id]}**\n`)}\nCongratulations to **${winner.name}** for winning this game with **${winner.score} points**!`)
        .setTimestamp()
        .setFooter("Have a nice day! :)", message.client.user.displayAvatarURL());
        msg.edit({ content: "", embed: em });
        console.mathgames.delete(now);
    },
    async selectMode(message) {
        var em1 = new Discord.MessageEmbed()
            .setColor(color)
            .setTitle("Limited Questions Mode")
            .setDescription("In this mode, you can set the **amount of questions**\nThe maximum time allowed for each question is **5 minutes**\nAnswers are all integers\nQuestions will get **harder** as the game goes")
            .setTimestamp()
            .setFooter("React with ✅ to choose this one.");
        var em2 = new Discord.MessageEmbed()
            .setColor(color)
            .setTitle("Timer Mode")
            .setDescription("In this mode, you can set the **amount of time allowed for the entire game**\nThe maximum time allowed for each question is **5 minutes**\nAnswers are all integers\nQuestions will get **harder** as the game goes")
            .setTimestamp()
            .setFooter("React with ✅ to choose this one.");
        var em3 = new Discord.MessageEmbed()
            .setColor(color)
            .setTitle("Endless Mode")
            .setDescription("In this mode, you can answer **endless amount of questions**\nThe maximum time allowed for each question is **10 seconds + 1 second Network Buffer**\nAnswers are all integers\nQuestions will get **harder** as the game goes")
            .setTimestamp()
            .setFooter("React with ✅ to choose this one.");
        const allEmbeds = [em1, em2, em3];
        const filter = (reaction, user) => {
            return (["✅", "◀", "▶", "⏮", "⏭", "⏹"].includes(reaction.emoji.name) && user.id === message.author.id);
        }; var s = 0;
        var msg = await message.channel.send(
            allEmbeds[0]
        );

        await msg.react("✅");
        await msg.react("⏮");
        await msg.react("◀");
        await msg.react("▶");
        await msg.react("⏭");
        await msg.react("⏹");
        var collector = await msg.createReactionCollector(
            filter,
            { idle: 60000, errors: ["time"] }
        );
        let chosen = -1;
        collector.on("collect", function (reaction, user) {
            reaction.users.remove(user.id);
            switch (reaction.emoji.name) {
                case "✅":
                    chosen = s;
                    collector.emit("end");
                    break;
                case "⏮":
                    s = 0;
                    msg.edit(allEmbeds[s]);
                    break;
                case "◀":
                    s -= 1;
                    if (s < 0) {
                        s = allEmbeds.length - 1;
                    }
                    msg.edit(allEmbeds[s]);
                    break;
                case "▶":
                    s += 1;
                    if (s > allEmbeds.length - 1) {
                        s = 0;
                    }
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
        return new Promise(resolve => {
            collector.on("end", function () {
                msg.reactions.removeAll().catch(console.error);
                msg.delete();
                resolve(chosen);
            });
        });
    },
    async generateQuestion(questionCount) {
        const operatorConst = [
            "+",
            "-",
            "*",
            "/"
        ];
        let numberCount = Math.floor(questionCount / 15 + 2);
        let numbers = [];
        for(let i = 0; i < numberCount; i++) {
            let num = Math.round(Math.random() * Math.floor(questionCount / 25 + 1) * 10);
            numbers.push(num);
        }
        let operators = [];
        for(let i = 0; i < numbers.length - 1; i++) {
            let oper = operatorConst[Math.floor(Math.random() * Math.min(questionCount / 10, operatorConst.length))];
            if(oper == "/") numbers[i+1] = math.gcd(numbers[i], numbers[i+1]);
            operators.push(oper);
        }
        let question = "";
        for(let i = 0; i < numbers.length * 2 - 1; i++) {
            if(i % 2 != 0) question += operators[(i - 1) / 2];
            else question += numbers[i / 2];
        }
        let answer = math.evaluate(question);
        return {
            question: question, answer: answer
        }
    }
}