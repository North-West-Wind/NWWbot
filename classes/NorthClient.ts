import { Client, ClientOptions, Collection, Message, Snowflake, TextChannel } from "discord.js";
import { Pool, RowDataPacket } from "mysql2/promise";
import { Interaction } from "slashcord/dist/utilities/interaction";
import { CommandHandler } from "slashcord/dist/handlers/CommandHandler";

export class NorthClient extends Client {
    constructor(options: ClientOptions) {
        super(options);
    }

    id: number;
    prefix: string;
    pool: Pool;
    log: Snowflake;
    static storage: ClientStorage;
}

export interface Command {
    name: string;
    description: string;
    args?: number;
    usage?: string;
    category?: number;
    aliases?: string[];
    subcommands?: string[];
    subaliases?: string[];
    permission?: number;
    slashInit?: boolean;

    run(message: NorthMessage, args: string[]): Promise<any | void>;
}

export interface SlashCommand extends Command {
    options?: any[];
    testOnly?: boolean;
    devOnly?: boolean;

    execute(args: { client: NorthClient, interaction: Interaction, args: any, handler: CommandHandler }): Promise<any | void>;
}

export class Card {
    constructor(c: number, n: number) {
        this.color = c;
        this.number = n;
    }

    color: number;
    number: number;
}

export class ClientStorage {
    private client: NorthClient;
    constructor(c: NorthClient) {
        this.client = c;
    }

    guilds: any = {};
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
        this.client.channels.fetch(this.client.log).then(async logChannel => logChannel ? await (logChannel as TextChannel).send(`\`${str}\``) : "").catch(console.error);
    }

    error(err: any) {
        console.error(err);
        this.client.channels.fetch(this.client.log).then(async logChannel => logChannel ? await (logChannel as TextChannel).send(`\`ERROR!\`\n\`${(err.message ? err.message : err)}\``) : "").catch(console.error);
        this.client.users.fetch(process.env.DC).then(async user => user ? await user.send(`\`ERROR!\`\n\`${(err.message ? err.message : err)}\``) : "").catch(console.error);
    }
}

export class LevelData {
    constructor(a: Snowflake, g: Snowflake, e: number, d: string) {
        this.author = a;
        this.guild = g;
        this.exp = e;
        this.date = d;
    }

    author: Snowflake;
    guild: Snowflake;
    exp: number;
    date: string;
}

export class NorthMessage extends Message {
    prefix: string;
    pool: Pool;
}