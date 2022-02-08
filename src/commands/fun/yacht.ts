import { TextChannel } from "discord.js";

import { NorthInteraction, NorthMessage, SlashCommand } from "../../classes/NorthClient.js";
import * as Discord from "discord.js";
import { color, msgOrRes } from "../../function.js";

class YachtCommand implements SlashCommand {
    name = "yacht"
    description = "Play the Yacht Dice Game on Discord."
    category = 3
    permissions = { channel: { me: 8192 } };
    
    async execute(interaction: NorthInteraction) {
        await this.logic(interaction);
    }
    
    async run(message: NorthMessage) {
        await this.logic(message);
    }

    async logic(message: Discord.Message | NorthInteraction) {
        const author = message instanceof Discord.Message ? message.author : message.user;
        var dice: { locked: boolean, number: number }[] = [];
        var scores = {
            "1s": { score: 0, used: false },
            "2s": { score: 0, used: false },
            "3s": { score: 0, used: false },
            "4s": { score: 0, used: false },
            "5s": { score: 0, used: false },
            "6s": { score: 0, used: false },
            bonus: { score: 0, used: false },
            triple: { score: 0, used: false },
            quadruple: { score: 0, used: false },
            doubtri: { score: 0, used: false },
            "4str": { score: 0, used: false },
            "5str": { score: 0, used: false },
            quintuple: { score: 0, used: false },
            choice: { score: 0, used: false }
        };
        for (let i = 0; i < 5; i++) dice.push({ locked: false, number: Math.ceil(Math.random() * 6) });
        var round = 1;
        var rolled = 0;
        const st = `${dice.map(x => `Dice ${dice.indexOf(x) + 1}: **${x.number}${x.locked ? " (Locked)" : ""}**`).join("\n")}\n\nScores:\n1s: **${scores["1s"].score}**\n2s: **${scores["2s"].score}**\n3s: **${scores["3s"].score}**\n4s: **${scores["4s"].score}**\n5s: **${scores["5s"].score}**\n6s: **${scores["6s"].score}**\nBonus: **${scores.bonus.score}**\n3 of a kind: **${scores.triple.score}**\n4 of a kind: **${scores.quadruple.score}**\nFull House: **${scores.doubtri.score}**\n4 Straight: **${scores["4str"].score}**\n5 Straight: **${scores["5str"].score}**\nYacht: **${scores.quintuple.score}**\nChoice: **${scores.choice.score}**`;
        const em = new Discord.MessageEmbed()
            .setTitle(`Yacht Dice Game (Round 1)`)
            .setColor(color())
            .setDescription(st + `\nCommands:\n**Roll** - Roll the dices (${3 - rolled} times left)\n**Lock <index>** - Lock the dices with indexes 1 to 6\n**Score <category>** Choose a category to place your score and move to the next turn\n**End** - End the game immediately`)
            .setTimestamp()
            .setFooter({ text: "Please type in commands within 2 minutes.", iconURL: message.client.user.displayAvatarURL() });
        var msg = <Discord.Message> await msgOrRes(message, em);
        const collector = (<TextChannel>message.channel).createMessageCollector({ filter: m => m.author.id === author.id, max: Infinity, idle: 120000 });
        collector.on("collect", async mesg => {
            if (round > 12) {
                collector.emit("end");
                return;
            }
            let success = false;
            const sequceIsConsecutive = (obj) =>
                Boolean(obj.reduce((output, lastest) => (output ?
                    (Number(output) + 1 === Number(lastest) ? lastest : false)
                    : false)));
            const args = mesg.content.split(/ +/);
            const command = args.shift().toLowerCase();
            switch (command) {
                case "roll":
                    await mesg.delete();
                    if (rolled < 3) {
                        for (const die of dice) if (!die.locked) die.number = Math.ceil(Math.random() * 6);
                        rolled++;
                    } else return;
                    break;
                case "lock":
                    await mesg.delete();
                    for (let o = 0; o < args.length; o++) {
                        const index = parseInt(args[o]) - 1;
                        if (isNaN(index) || !(0 <= index && index <= 4)) continue;
                        dice[index].locked = !dice[index].locked;
                    }
                    break;
                case "score":
                    await mesg.delete();
                    if (!args[0]) break;
                    switch (args.join(" ").toLowerCase()) {
                        case "1s":
                        case "1":
                        case "one":
                        case "ones":
                            if (scores["1s"].used) break;
                            const a = dice.filter(x => x.number === 1);
                            const aa = a.length < 1 ? 0 : a.map(x => x.number).reduce((a, c) => a + c);
                            scores["1s"].used = true;
                            scores["1s"].score = aa;
                            success = true;
                            break;
                        case "2s":
                        case "2":
                        case "two":
                        case "twos":
                            if (scores["2s"].used) break;
                            const b = dice.filter(x => x.number === 2);
                            const bb = b.length < 1 ? 0 : b.map(x => x.number).reduce((a, c) => a + c);
                            scores["2s"].used = true;
                            scores["2s"].score = bb;
                            success = true;
                            break;
                        case "3s":
                        case "3":
                        case "three":
                        case "threes":
                            if (scores["3s"].used) break;
                            const c = dice.filter(x => x.number === 3);
                            const cc = c.length < 1 ? 0 : c.map(x => x.number).reduce((a, c) => a + c);
                            scores["3s"].used = true;
                            scores["3s"].score = cc;
                            success = true;
                            break;
                        case "4s":
                        case "4":
                        case "four":
                        case "fours":
                            if (scores["4s"].used) break;
                            const d = dice.filter(x => x.number === 4);
                            const dd = d.length < 1 ? 0 : d.map(x => x.number).reduce((a, c) => a + c);
                            scores["4s"].used = true;
                            scores["4s"].score = dd;
                            success = true;
                            break;
                        case "5s":
                        case "5":
                        case "five":
                        case "fives":
                            if (scores["5s"].used) break;
                            const e = dice.filter(x => x.number === 5);
                            const ee = e.length < 1 ? 0 : e.map(x => x.number).reduce((a, c) => a + c);
                            scores["5s"].used = true;
                            scores["5s"].score = ee;
                            success = true;
                            break;
                        case "6s":
                        case "6":
                        case "six":
                        case "sixs":
                            if (scores["6s"].used) break;
                            const f = dice.filter(x => x.number === 6);
                            const ff = f.length < 1 ? 0 : f.map(x => x.number).reduce((a, c) => a + c);
                            scores["6s"].used = true;
                            scores["6s"].score = ff;
                            success = true;
                            break;
                        case "bonus":
                            if (scores.bonus.used) break;
                            const g = Object.values(scores).slice(0, 6).map(x => x.score).reduce((a, c) => a + c);
                            scores.bonus.used = true;
                            scores.bonus.score = g > 63 ? 35 : 0;
                            success = true;
                            break;
                        case "triple":
                        case "3 of a kind":
                            if (scores.triple.used) break;
                            for (let o = 0; o < 6; o++) {
                                const filtered = dice.filter(x => x.number === o + 1);
                                if (filtered.length >= 3) {
                                    scores.triple.score = filtered.map(x => x.number).reduce((a, c) => a + c);
                                    break;
                                }
                            }
                            scores.triple.used = true;
                            success = true;
                            break;
                        case "quadruple":
                        case "4 of a kind":
                            if (scores.quadruple.used) break;
                            for (let o = 0; o < 6; o++) {
                                const filtered = dice.filter(x => x.number === o + 1);
                                if (filtered.length >= 4) {
                                    scores.quadruple.score = filtered.map(x => x.number).reduce((a, c) => a + c);
                                    break;
                                }
                            }
                            scores.quadruple.used = true;
                            success = true;
                            break;
                        case "double-triple":
                        case "full house":
                        case "fullhouse":
                            if (scores.doubtri.used) break;
                            let got = { three: false, two: false };
                            for (let o = 0; o < 6; o++) {
                                const filtered = dice.filter(x => x.number === o + 1);
                                if (filtered.length >= 3) got.three = true;
                                else if (filtered.length >= 2) got.two = true;
                            }
                            scores.doubtri.used = true;
                            if (got.three && got.two) scores.doubtri.score = 25;
                            success = true;
                            break;
                        case "4 straight":
                        case "4str":
                            if (scores["4str"].used) break;
                            const sorted = Array.from(new Set(dice.map(x => x.number).sort()));
                            for (let o = 0; o < sorted.length; o++) if (o + 3 < sorted.length && sequceIsConsecutive(sorted.slice(o, o + 4))) {
                                scores["4str"].score = 30;
                                break;
                            }
                            scores["4str"].used = true;
                            success = true;
                            break;
                        case "5 straight":
                        case "5str":
                            if (scores["5str"].used) break;
                            const h = Array.from(new Set(dice.map(x => x.number).sort()));
                            if (sequceIsConsecutive(h)) scores["5str"].score = 40;
                            scores["5str"].used = true;
                            success = true;
                            break;
                        case "yacht":
                        case "quintuple":
                            if (scores.quintuple.used) break;
                            if (dice.map(x => x.number).every(v => v === dice.map(x => x.number)[0])) scores.quintuple.score = 50;
                            scores.quintuple.used = true;
                            success = true;
                            break;
                        case "choice":
                            if (scores.choice.used) break;
                            scores.choice.used = true;
                            scores.choice.score = dice.map(x => x.number).reduce((a, c) => a + c);
                            success = true;
                            break;
                    }
                    break;
                case "end":
                    await mesg.delete();
                    round = 12;
                    collector.emit("end");
                    return;
            }
            if (success) {
                round++;
                for (const die of dice) {
                    die.locked = false;
                    die.number = Math.ceil(Math.random() * 6);
                }
                rolled = 0;
            }
            const str = `${dice.map(x => `Dice ${dice.indexOf(x) + 1}: **${x.number}${x.locked ? " (Locked)" : ""}**`).join("\n")}\n\nScores:\n1s: **${scores["1s"].score}**\n2s: **${scores["2s"].score}**\n3s: **${scores["3s"].score}**\n4s: **${scores["4s"].score}**\n5s: **${scores["5s"].score}**\n6s: **${scores["6s"].score}**\nBonus: **${scores.bonus.score}**\n3 of a kind: **${scores.triple.score}**\n4 of a kind: **${scores.quadruple.score}**\nFull House: **${scores.doubtri.score}**\n4 Straight: **${scores["4str"].score}**\n5 Straight: **${scores["5str"].score}**\nYacht: **${scores.quintuple.score}**\nChoice: **${scores.choice.score}**`;
            em.setTitle(`Yacht Dice Game (Round ${round})`).setDescription(str + `\nCommands:\n**Roll** - Roll the dices (${3 - rolled} times left)\n**Lock <index>** - Lock the dices with indexes 1 to 6\n**Score <category>** Choose a category to place your score and move to the next turn\n**End** - End the game immediately`);
            msg = await msg.edit({embeds: [em]});
            if (round > 12) collector.emit("end");
        });
        collector.on("end", async () => {
            await end();
        });
        async function end() {
            em.setTitle(`Yacht Dice Game (Ended)`).setDescription(`You scored **${Object.values(scores).map(x => x.score).reduce((a, c) => a + c)} points**\nThanks for playing!`).setFooter({ text: "Have a nice day! :)", iconURL: message.client.user.displayAvatarURL() });
            msg.edit({embeds: [em]}).catch(() => message.channel.send({embeds: [em]}));
        }
    }
}

const cmd = new YachtCommand();
export default cmd;