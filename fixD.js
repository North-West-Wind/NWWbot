var fs = require('fs')
fs.readFile("your file", {encoding: 'utf8'}, function (err,data) {
    var formatted = data.replace(/private constructor\(client: Client, data: RawMessageData\);/g, 'public constructor(client: Client, data: RawMessageData);');
fs.writeFile("your file", formatted, 'utf8', function (err) {
    if (err) return console.log(err);
 });
});