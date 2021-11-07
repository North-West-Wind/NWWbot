var fs = require('fs')
fs.readFile("./node_modules/discord.js/typings/index.d.ts", {encoding: 'utf8'}, function (err,data) {
    var formatted = data.replace(/private constructor\(client: Client, data: RawMessageData\);/g, 'public constructor(client: Client, data: RawMessageData);');
fs.writeFile("./node_modules/discord.js/typings/index.d.ts", formatted, 'utf8', function (err) {
    if (err) return console.log(err);
 });
});