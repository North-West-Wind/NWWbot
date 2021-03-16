import { Client, ClientOptions, Snowflake } from "discord.js";
import { Pool } from "mysql2/promise";
import { ClientStorage } from "./ClientStorage";

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