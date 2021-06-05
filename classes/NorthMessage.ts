import { Message } from "discord.js";
import { Pool } from "mysql2/promise";
import { NorthClient } from "./NorthClient";

export class NorthMessage extends Message {
    prefix: string;
    pool: Pool;
    client: NorthClient;
}