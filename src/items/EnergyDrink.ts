import { Message, MessageEmbed } from "discord.js";

import { Item, NorthClient, NorthInteraction, NorthMessage } from "../classes/NorthClient";
import { globalClient as client } from "../common";
import { jsDate2Mysql } from "../function";

export default class EnergyDrinkItem implements Item {
    id = "481b8f8aec3b604db23f205b4ce2f52b447ffe5ab911e3f1"
    name = "EnergyDrink"
    async run(message: NorthMessage | NorthInteraction, msg: Message, em: MessageEmbed, itemObject: any) {
        var newDateSql = jsDate2Mysql(new Date(Date.now() + 86400000));
        const author = message instanceof Message ? message.author.id : message.user.id;
        const con = await client.pool.getConnection();
        try {
            var [results] = await con.query(`SELECT doubling FROM currency WHERE user_id = '${author}' AND guild = '${message.guild.id}'`);
            if (results[0].doubling) newDateSql = jsDate2Mysql(new Date(results[0].doubling.getTime() + 86400000));
            await con.query(`UPDATE currency SET doubling = '${newDateSql}' WHERE user_id = '${author}' AND guild = '${message.guild.id}'`);
            itemObject[this.id] -= 1;
            await con.query(`UPDATE inventory SET items = '${escape(JSON.stringify(itemObject))}' WHERE id = '${author}'`);
            em.setTitle("You drank the Energy Drink!").setDescription("Now you work more efficiently for 24 hours!\nThe amount of money you gain will be doubled during this period!").setFooter("Have a nice day! :)", message.client.user.displayAvatarURL());
        } catch (err: any) {
            em.setTitle("ERROR!").setDescription("SQL Error! Contact NorthWestWind#1885 for help.").setFooter("Cancelled.", message.client.user.displayAvatarURL());
            console.error(err);
        }
        con.release();
        await msg.edit({embeds: [em]});
    }
}