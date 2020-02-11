const request = require("request");

module.exports = {
  twoDigits(d) {
    if (0 <= d && d < 10) return "0" + d.toString();
    if (-10 < d && d < 0) return "-0" + (-1 * d).toString();
    return d.toString();
  },

  setTimeout_(fn, delay) {
    var maxDelay = Math.pow(2, 31) - 1;

    if (delay > maxDelay) {
      var args = arguments;
      args[1] -= maxDelay;

      return setTimeout(function() {
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
      "(\\?[;&a-z\\d%_.~+=-]*)?" + // query string
        "(\\#[-a-z\\d_]*)?$",
      "i"
    ); // fragment locator
    return !!pattern.test(str);
  },
  validYTURL(str) {
    var pattern = new RegExp(
      "^(http(s)?://)?((w){3}.)?youtu(be|.be)?(.com)?/.+"
    ); // fragment locator
    return !!pattern.test(str);
  },
  decodeHtmlEntity(str) {
    return str
      .replace(/&#(\d+);/g, function(match, dec) {
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
      function(error, response, body) {
        callback(error, body);
      }
    );
  },
  shuffleArray(array) {
    let temp = array[0];
    array.splice(0, 1);
    var i;
    var j;
    var x;
    for (i = array.length - 1; i > 0; i--) {
      j = Math.floor(Math.random() * (i + 1));
      x = array[i];
      array[i] = array[j];
      array[j] = x;
    }
    array.unshift(temp);
    temp = [];
    return array;
  }
};
