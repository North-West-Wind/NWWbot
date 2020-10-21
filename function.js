const request = require("request");
const superms = require("ms");
module.exports = {
  twoDigits(d) {
    if (0 <= d && d < 10) return "0" + d.toString();
    if (-10 < d && d < 0) return "-0" + (-1 * d).toString();
    return d.toString();
  },
  SumArray(arr) {
    return arr.reduce((a, b) => a + b);
  },

  setTimeout_(fn, delay) {
    var maxDelay = Math.pow(2, 31) - 1;

    if (delay > maxDelay) {
      var args = arguments;
      args[1] -= maxDelay;

      return setTimeout(function () {
        this.setTimeout_.apply(fn, args);
      }, maxDelay);
    }

    return setTimeout.apply(fn, arguments);
  },
  validURL(str) {
    var pattern = new RegExp(
      "^(https?:\\/\\/)?" + // protocol
      "((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|" + // domain name
      "((\\d{1,3}\\.){3}\\d{1,3}))" + // OR ip (v4) address
      "(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*" + // port and path
      "(\\?.*)?" + // query string
      "(\\#[-a-z\\d_]*)?$",
      "i"
    ); // fragment locator
    if (str.slice(8).search("open.spotify.com") === 0 || pattern.test(str))
      return true;
    else return false;
  },
  validYTURL(str) {
    var pattern = new RegExp(
      /^(http(s)?:\/\/)?((w){3}.)?youtu(be|.be)?(.com)?\/.+/
    ); // fragment locator
    return pattern.test(str);
  },
  validYTPlaylistURL(str) {
    var pattern = new RegExp(
      /^(http(s)?:\/\/)?((w){3}.)?youtu(be|.be)?(.com)?\/playlist\?list=\w+/
    );
    return !!pattern.test(str);
  },
  validSPURL(str) {
    var pattern = new RegExp(/^(spotify:|https:\/\/[a-z]+\.spotify\.com\/)/);
    return pattern.test(str);
  },
  validGDURL(str) {
    var pattern1 = new RegExp(/https:\/\/drive\.google\.com\/file\/d\/(?<id>.*?)\/(?:edit|view)\?usp=sharing/);
    var pattern2 = new RegExp(/https:\/\/drive\.google\.com\/open\?id=(?<id>.*?)$/);
    if (pattern1.test(str)) return true;
    else if (pattern2.test(str)) return true;
    else return false;
  },
  validImgurURL(str) {
    var pattern = /^https?:\/\/(\w+\.)?imgur.com\/(\w*\w*)+(\.[a-zA-Z]{3})?$/;
    return pattern.test(str);
  },
  validImgurVideoURL(str) {
    var pattern = /^https?:\/\/(\w+\.)?imgur.com\/(\w*\w*)+(\.[a-zA-Z0-9]{3})?$/;
    return pattern.test(str);
  },
  validImgur4wordsURL(str) {
    var pattern = /^https?:\/\/(\w+\.)?imgur.com\/(\w\/)?(\w*\w*)+(\.[a-zA-Z0-9]*)?$/;
    return pattern.test(str);
  },
  validImgurAURL(str) {
    var pattern = /^https?:\/\/(\w+\.)?imgur.com\/(\w\/)?(\w*\w*)$/;
    return pattern.test(str);
  },
  validNotImgurURL(str) {
    var pattern = /^https?:\/\/imgur.com\/(\w*\w*)+(\.[a-zA-Z]{3})?$/;
    return pattern.test(str);
  },
  validRedditURL(str) {
    var pattern = /^https?:\/\/(\w+\.)?redd.it\/(\w*\w*)+(\.[a-zA-Z]{3})?$/;
    return pattern.test(str);
  },
  validRedditVideoURL(str) {
    var pattern = /^https?:\/\/(\w+\.)?redd.it\/(\w*\w*)+(\.[a-zA-Z0-9]{3})?$/;
    return pattern.test(str);
  },
  validGfyURL(str) {
    var pattern = /^(http(s)?:\/\/)?((w){3}.)?gfycat(.com)?\/\w*/;
    return pattern.test(str);
  },
  validRedGifURL(str) {
    var pattern = /^https?:\/\/(\w+\.)?redgifs.com\/(\w*\/)?(\w*\w*)$/;
    return pattern.test(str);
  },
  validSCURL(str) {
    var pattern = /^http(s)?:\/\/(soundcloud\.com|snd\.sc)\/(.+)?/;
    return pattern.test(str);
  },
  validMSURL(str) {
    var pattern = /^(https?:\/\/)?musescore\.com\/(user|[\w%\-_.!~*'()]+)\/([0-9]{1,}\/scores\/[0-9]{1,}\/?|[\w%\-_.!~*'()]+\/?)$/;
    return pattern.test(str);
  },
  decodeHtmlEntity(str) {
    return str
      .replace(/&#(\d+);/g, function (match, dec) {
        return String.fromCharCode(dec);
      })
      .replace(/&quot;/g, `"`)
      .replace(/&amp;/g, `&`);
  },

  encodeHtmlEntity(str) {
    var buf = [];
    for (var i = str.length - 1; i >= 0; i--) {
      buf.unshift(["&#", str[i].charCodeAt(), ";"].join(""));
    }
    return buf.join("");
  },

  search(options, callback) {
    var url =
      "http://api.serpstack.com/search?access_key=" +
      options.key +
      "&query=" +
      options.qs.q;
    request(
      {
        url: url,
        json: true
      },
      function (error, response, body) {
        callback(error, body);
      }
    );
  },
  shuffleArray(array, start) {
    let temp = array.splice(0, start);
    var i;
    var j;
    var x;
    for (i = array.length - 1; i > 0; i--) {
      j = Math.floor(Math.random() * (i + 1));
      x = array[i];
      array[i] = array[j];
      array[j] = x;
    }
    array = temp.concat(array);
    temp = [];
    return array;
  },
  async findUser(message, str) {
    if (isNaN(parseInt(str))) {
      if (!str.startsWith("<@")) {
        message.channel.send("**" + str + "** is neither a mention or ID.");
        return;
      }
    }

    const userID = str
      .replace(/<@/g, "")
      .replace(/!/g, "")
      .replace(/>/g, "");

    // Assuming we mention someone in the message, this will return the user
    // Read more about mentions over at https://discord.js.org/#/docs/main/master/class/MessageMentions

    try {
      var user = await message.client.users.fetch(userID);
    } catch (err) {
      message.channel.send("No user was found!");
      return;
    }

    return user;
  },
  async findMember(message, str) {
    if (isNaN(parseInt(str))) {
      if (!str.startsWith("<@")) {
        message.channel.send("**" + str + "** is neither a mention or ID.");
        return;
      }
    }

    const userID = str
      .replace(/<@/g, "")
      .replace(/!/g, "")
      .replace(/>/g, "");

    // Assuming we mention someone in the message, this will return the user
    // Read more about mentions over at https://discord.js.org/#/docs/main/master/class/MessageMentions

    try {
      var member = await message.guild.members.fetch(userID);
    } catch (err) {
      message.channel.send("No user was found!");
      return;
    }

    return member;
  },
  async findRole(message, str) {
    var roleID = str.replace(/<@&/g, "").replace(/>/g, "");
    if (isNaN(parseInt(roleID))) {
      var role = await message.guild.roles.cache.find(
        x => x.name.toLowerCase() === `${message.content.split(/ +/).slice(1).join(" ").toLowerCase()}`
      );
      if (role === null) {
        message.channel.send(
          "No role was found with the name " + message.content.split(/ +/).slice(1).join(" ")
        );
        return null;
      }
    } else {
      var role = await message.guild.roles.cache.get(roleID);
      if (role === null) {
        message.channel.send("No role was found!");
        return null;
      }
    }
    return role;
  },
  getRandomNumber(min, max) {
    return Math.random() * (max - min) + min;
  },
  applyText(canvas, text) {
    const ctx = canvas.getContext("2d");

    //calculate largest font size
    let fontSize = canvas.width / 12;

    //reduce font size loop
    do {
      //reduce font size
      ctx.font = `${(fontSize -= 5)}px sans-serif`;
      // Compare pixel width of the text to the canvas minus the approximate avatar size
    } while (ctx.measureText(text).width > canvas.width - 100);

    // Return the result to use in the actual canvas
    return ctx.font;
  },
  numberWithCommas(x) {
    x = x.toString();
    var pattern = /(-?\d+)(\d{3})/;
    while (pattern.test(x)) x = x.replace(pattern, "$1,$2");
    return x;
  },
  isGoodMusicVideoContent(videoSearchResultItem) {
    const contains = (string, content) => {
      return !!~(string || "").indexOf(content);
    };
    return (
      contains(
        videoSearchResultItem.author
          ? videoSearchResultItem.author.name
          : undefined,
        "VEVO"
      ) ||
      contains(
        videoSearchResultItem.author
          ? videoSearchResultItem.author.name.toLowerCase()
          : undefined,
        "official"
      ) ||
      contains(videoSearchResultItem.title.toLowerCase(), "official") ||
      !contains(videoSearchResultItem.title.toLowerCase(), "extended")
    );
  },
  elegantPair(x, y) {
    return x >= y ? x * x + x + y : y * y + x;
  },
  elegantUnpair(z) {
    var sqrtz = Math.floor(Math.sqrt(z)),
      sqz = sqrtz * sqrtz;
    return z - sqz >= sqrtz ? [sqrtz, z - sqz - sqrtz] : [z - sqz, sqrtz];
  },
  jsDate2Mysql(newDate) {
    function twoDigits(d) {
      if (0 <= d && d < 10) return "0" + d.toString();
      if (-10 < d && d < 0) return "-0" + (-1 * d).toString();
      return d.toString();
    }
    var date = newDate.getDate();
    var month = newDate.getMonth();
    var year = newDate.getFullYear();
    var hour = newDate.getHours();
    var minute = newDate.getMinutes();
    var second = newDate.getSeconds();
    var newDateSql =
      year +
      "-" +
      twoDigits(month + 1) +
      "-" +
      twoDigits(date) +
      " " +
      twoDigits(hour) +
      ":" +
      twoDigits(minute) +
      ":" +
      twoDigits(second);
    return newDateSql;
  },
  getWithWeight(input) {
    var array = [];
    for (var item in input) {
      if (input.hasOwnProperty(item)) {
        for (var i = 0; i < input[item]; i++) {
          array.push(item);
        }
      }
    }
    return array[Math.floor(Math.random() * array.length)];
  },
  hexToRgb(hex) {
    // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
    var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, function (m, r, g, b) {
      return r + r + g + g + b + b;
    });

    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  },
  decimalToRgb(decimal) {
    return {
      r: (decimal >> 16) & 0xff,
      g: (decimal >> 8) & 0xff,
      b: decimal & 0xff,
    };
  },
  readableDate(date) {
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear}`;
  },
  readableDateTime(date) {
    function twoDigits(d) {
      if (0 <= d && d < 10) return "0" + d.toString();
      if (-10 < d && d < 0) return "-0" + (-1 * d).toString();
      return d.toString();
    }
    const day = date.getDate();
    const month = date.getMonth();
    const year = date.getFullYear();
    const hour = date.getHours();
    const minute = date.getMinutes();
    const second = date.getSeconds();

    var dateTime =
      twoDigits(day) +
      "/" +
      twoDigits(month + 1) +
      "/" +
      twoDigits(year) +
      " " +
      twoDigits(hour) +
      ":" +
      twoDigits(minute) +
      ":" +
      twoDigits(second) +
      " UTC";
    return dateTime;
  },
  ms(val, options) {
    if (typeof val === "string" && superms(val) === undefined) {
      if(val.split(":").length > 1) {
        const nums = val.split(":").reverse();
        const units = ["s", "m", "h", "d"];
        const mses = [];
        for(const num of nums) {
          const str = `${parseInt(num)}${units[nums.indexOf(num)]}`;
          const parsed = superms(str);
          if(parsed === undefined) return undefined;
          mses.push(parsed);
        }
        return mses.reduce((acc, c) => acc + c);
      }
      var mses = [];
      let temp = "";
      let last = "";
      for (let i = 0; i < val.length; i++) {
        let char = val.substr(i, 1);
        if (!/\d/.test(last) && /\d/.test(char) && i != 0) {
          if (superms(temp) === undefined) return undefined;
          mses.push(superms(temp));
          temp = "";
        }
        temp += char;
        if (val[i + 1] === undefined) mses.push(superms(temp));
      }
      return mses.reduce((acc, c) => acc + c);
    } else return superms(val, options);
  }
};
