import { Message, MessageEmbed } from "discord.js";
import { Interaction } from "slashcord/dist/Index";
import { Item, NorthClient, NorthMessage } from "../classes/NorthClient";
import { elegantPair } from "../function";
import { globalClient as client } from "../common";
import { RowDataPacket } from "mysql2";

export default class MarkSevenItem implements Item {
    id = "3f4442c06b90c39340394ab33bab928b7a290593a54ea1d4"
    name = "MarkSeven"

    async run(message: NorthMessage | Interaction, msg: Message, em: MessageEmbed, itemObject: any) {
        const con = await client.pool.getConnection();
        const author = message instanceof Message ? message.author.id : (message.member?.id ?? message.channelID);
        try {
            var [results] = <RowDataPacket[][]>await con.query("SELECT * FROM lottery WHERE id = '" + author + "'");
            if (results.length > 0) em.setTitle("ERROR!").setDescription("You have already participate this one.\nPlease wait until the next one come out to participate.").setFooter("Cancelled.", message.client.user.displayAvatarURL());
            else {
                em.setDescription("Type 7 numbers between 1-39!\nIntegers only!").setFooter("I will only wait for 60 seconds.", client.user.displayAvatarURL());
                msg.edit(em);
                const collected = await msg.channel.awaitMessages(x => x.author.id === author, { max: 1, time: 60000 });
                if (!collected.first()) em.setTitle("ERROR!").setDescription("You didn't type the numbers in time!").setFooter("Cancelled.", client.user.displayAvatarURL());
                else {
                    await collected.first().delete();
                    const cArgs = collected.first().content.split(" ");
                    if (cArgs.length < 7) em.setTitle("ERROR!").setDescription("You only typed " + cArgs.length + (cArgs.length === 1 ? " word" : " words") + "!").setFooter("Cancelled.", message.client.user.displayAvatarURL());
                    else {
                        const numbers = [];
                        var error = false;
                        for (const cArg of cArgs) {
                            var integer = parseInt(cArg);
                            if (isNaN(integer)) em.setTitle("ERROR!").setDescription("One of the words is not a number!").setFooter("Cancelled.", client.user.displayAvatarURL());
                            else if (integer < 1 || integer > 39) em.setTitle("ERROR!").setDescription("One of the numbers is not in range!").setFooter("Cancelled.", client.user.displayAvatarURL());
                            else if (cArgs.filter(x => x === cArg).length > 1) em.setTitle("ERROR!").setDescription("Do not repeat the numbers!").setFooter("Cancelled.", client.user.displayAvatarURL());
                            if (em.title === "ERROR!") {
                                error = true;
                                await msg.edit(em);
                                break;
                            }
                            numbers.push(integer);
                        }
                        if (!error) {
                            numbers.sort();
                            var first = elegantPair(numbers[0], numbers[1]);
                            var second = elegantPair(numbers[2], numbers[3]);
                            var third = elegantPair(numbers[4], numbers[5]);
                            var fourth = elegantPair(first, second);
                            var fifth = elegantPair(third, numbers[6]);
                            var final = elegantPair(fourth, fifth);
                            await con.query("INSERT INTO lottery VALUES('" + author + "', " + final + ")");
                            itemObject[this.id] -= 1;
                            var str = JSON.stringify(itemObject);
                            await con.query(`UPDATE inventory SET items = '${escape(str)}' WHERE id = '${author}'`)
                            em.setTitle("Success!").setDescription("Your have participated in the lottery!").setFooter("Have a nice day! :)", message.client.user.displayAvatarURL());
                        }
                    }
                }
            }
        } catch (err) {
            em.setTitle("ERROR!").setDescription("SQL Error! Contact NorthWestWind#1885 for help.").setFooter("Cancelled.", message.client.user.displayAvatarURL());
            NorthClient.storage.error(err);
        }
        await msg.edit(em);
        con.release();
    }
}