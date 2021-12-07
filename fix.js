const fs = require('fs');
const ytdlFix = `const ytdl = async (link, options) => {
  const stream = createStream(options);
  return new Promise(async (r, j) => {
    let rejected = false;
    let error;
    let info = await ytdl.getInfo(link, options).catch((err) => { rejected = true; error = err; });
    if (rejected) return void j(error);
    downloadFromInfoCallback(stream, info, options);
    r(stream);
  });
}
module.exports = ytdl;`;

fs.readFile("./node_modules/discord.js/typings/index.d.ts", { encoding: 'utf8' }, function (err, data) {
    var formatted = data.replace(/private constructor\(client: Client, data: RawMessageData\);/g, 'public constructor(client: Client, data: RawMessageData);');
    fs.writeFile("./node_modules/discord.js/typings/index.d.ts", formatted, 'utf8', function (err) {
        if (err) return console.log(err);
    });
});

fs.readFile("./node_modules/ytdl-core/lib/index.js", { encoding: "utf8" }, function (_err, data) {
  var formatted = data.replace(/const ytdl = \((.|\n)*ytdl;/gm, ytdlFix);
    fs.writeFile("./node_modules/ytdl-core/lib/index.js", formatted, 'utf8', function (err) {
        if (err) return console.log(err);
    });
});