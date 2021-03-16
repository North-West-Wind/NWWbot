"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientStorage = void 0;
const discord_js_1 = require("discord.js");
class ClientStorage {
    constructor(c) {
        this.guilds = {};
        this.rm = [];
        this.timers = new discord_js_1.Collection();
        this.noLog = [];
        this.commands = new discord_js_1.Collection();
        this.items = new discord_js_1.Collection();
        this.card = new discord_js_1.Collection();
        this.uno = new discord_js_1.Collection();
        this.mathgames = new discord_js_1.Collection();
        this.migrating = [];
        this.gtimers = [];
        this.queries = [];
        this.client = c;
    }
    log(str) {
        console.log(str);
        this.client.channels.fetch(this.client.log).then((logChannel) => __awaiter(this, void 0, void 0, function* () { return logChannel ? yield logChannel.send(`\`${str}\``) : ""; })).catch(console.error);
    }
    error(err) {
        console.error(err);
        this.client.channels.fetch(this.client.log).then((logChannel) => __awaiter(this, void 0, void 0, function* () { return logChannel ? yield logChannel.send(`\`ERROR!\`\n\`${(err.message ? err.message : err)}\``) : ""; })).catch(console.error);
    }
}
exports.ClientStorage = ClientStorage;
