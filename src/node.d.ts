import { Client } from "discord.js";

declare module "discord.js.userbot" {
    export function allowUserBotting(client: Client, node_modules_path?: string): void;
}