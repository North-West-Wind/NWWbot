import { Collection, Snowflake, TextChannel } from "discord.js";
import { RowDataPacket } from "mysql2";
import { Card } from "./Card";
import { Command } from "./Command";
import { LevelData } from "./LevelData";
import { NorthClient } from "./NorthClient";

export class ClientStorage {
    private client: NorthClient;
    constructor(c: NorthClient) {
        this.client = c;
    }

    guilds: Object = {};
    rm: RowDataPacket[] = [];
    timers: Collection<Snowflake, NodeJS.Timeout> = new Collection();
    noLog: Snowflake[] = [];
    commands: Collection<String, Command> = new Collection();
    items: Collection<String, any> = new Collection();
    card: Collection<String, Card> = new Collection();
    uno: Collection<any, any> = new Collection();
    mathgames: Collection<any, any> = new Collection();
    migrating: any[] = [];
    gtimers: any[] = [];
    queries: LevelData[] = [];

    log(str: any) {
        console.log(str);
        this.client.channels.fetch("678847137391312917").then(async logChannel => logChannel ? await(logChannel as TextChannel).send(`\`${str}\``) : "").catch(console.error);
    }

    error(err: any) {
        console.error(err);
        this.client.channels.fetch("678847137391312917").then(async logChannel => logChannel ? await(logChannel as TextChannel).send(`\`ERROR!\`\n\`${(err.message ? err.message : err)}\``) : "").catch(console.error);
    }
}