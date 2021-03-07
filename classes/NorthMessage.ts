import { Message } from "discord.js";
import { Pool } from "mysql2/promise";

export class NorthMessage extends Message {
    prefix: string;
    pool: Pool;
}