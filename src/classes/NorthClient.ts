import { AudioPlayer, AudioResource, VoiceConnection } from "@discordjs/voice";
import { Client, ClientOptions, Collection, CommandInteraction, Message, MessageEmbed, Snowflake, StageChannel, TextChannel, User, VoiceChannel } from "discord.js";
import { Pool } from "mysql2/promise";
import { getOwner } from "../function";

export class NorthClient extends Client {
    constructor(options: ClientOptions) {
        super(options);
    }

    id: number;
    prefix: string;
    pool: Pool;
    log: Snowflake;
    version: string;
    static storage: ClientStorage;

    setPool(pool: Pool) { this.pool = pool; }
    setVersion(version: string) { this.version = version; }
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
    subdesc?: string[];
    subusage?: (string | number)[];
    permissions?: { guild?: { user?: number, me?: number }, channel?: { user?: number, me?: number } };

    run(message: NorthMessage, args: string[]): Promise<any> | any;
    init?(): Promise<any> | any;
}

export interface SlashCommand extends Command {
    options?: any[];

    execute(interaction: NorthInteraction): Promise<any> | any;
}

export class Card {
    constructor(c: number, n: number) {
        this.color = c;
        this.number = n;
    }

    color: number;
    number: number;
}

export class Player {
    constructor(u: User, c: Card[]) {
        this.user = u;
        this.card = c;
    }

    user: User;
    card: Card[];
}

export class UnoGame {
    constructor(p: Collection<Snowflake, Player>, c: Card, cs: number) {
        this.players = p;
        this.card = c;
        this.cards = cs;
    }

    players: Collection<Snowflake, Player>;
    card: Card;
    cards: number;
}

export interface RoleMessage {
    id: Snowflake;
    guild: Snowflake;
    channel: Snowflake;
    author: Snowflake;
    expiration: number;
    roles: string;
    emojis: string;
}

export class ClientStorage {
    private client: NorthClient;
    constructor(c: NorthClient) {
        this.client = c;
    }

    guilds: any = {};
    rm: RoleMessage[] = [];
    timers: Collection<Snowflake, NodeJS.Timeout> = new Collection();
    noLog: Snowflake[] = [];
    commands: Collection<string, SlashCommand> = new Collection();
    items: Collection<string, Item> = new Collection();
    card: Collection<string, Card> = new Collection();
    uno: Collection<number, UnoGame> = new Collection();
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
        getOwner().then(id => this.client.users.fetch(id).then(async user => user ? await user.send(`\`ERROR!\`\n\`${(err.message ? err.message : err)}\``) : "")).catch(console.error);
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
    client: NorthClient;
}

export class NorthInteraction extends CommandInteraction {
    readonly prefix: string = "/";
    pool: Pool;
    client: NorthClient;
}

export class ServerQueue {
    constructor(songs: SoundTrack[], loopStatus: boolean, repeatStatus: boolean) {
        this.textChannel = null;
        this.voiceChannel = null;
        this.connection = null;
        this.player = null;
        this.songs = songs;
        this.volume = 1;
        this.playing = false;
        this.paused = false;
        this.looping = loopStatus;
        this.repeating = repeatStatus;
        this.random = false;
    }

    textChannel: TextChannel;
    voiceChannel: VoiceChannel | StageChannel;
    connection: VoiceConnection;
    player: AudioPlayer;
    resource?: AudioResource;
    songs: SoundTrack[];
    volume: number;
    playing: boolean;
    paused: boolean;
    looping: boolean;
    repeating: boolean;
    random: boolean;
    startTime?: number;
    streamTime?: number;

    destroy() {
        this.player?.stop();
        this.connection?.destroy();
        this.player = null;
        this.connection = null;
    }

    stop() {
        this.player?.stop();
        this.player = null;
    }
}

export class SoundTrack {
    title: string;
    url: string;
    type: number;
    time: string;
    volume: number;
    thumbnail: string;
    isLive: boolean;
    isPastLive?: boolean;
    spot?: string;
}

export interface Item {
    name: string;
    id: string;
    run(message: NorthMessage | CommandInteraction, msg: Message, em: MessageEmbed, itemObject: any): Promise<any> | any;
}