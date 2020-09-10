const math = require("mathjs");
const Discord = require("discord.js");
var color = Math.floor(Math.random() * 16777214) + 1;

module.exports = {
    name: "math",
    description: "Solve your Mathematical problems!",
    usage: "<subcommand> <expression>",
    subcommands: ["evaluate", "derivative", "solvelinear", "rationalize", "simplify", "help"],
    subaliases: ["eval", "deri", "lsol", "rat", "sim", "help"],
    async execute(message, args) {
        let done = "Error!";
        switch(args[0]) {
            case "evaluate":
            case "eval":
                try { done = await math.evaluate(args.slice(1).join(" ")); } catch(err) {done = "Evaluation Error";}
                break;
            case "derivative":
            case "deri":
                try { done = await math.derivative(args.slice(1).join(" ")); } catch(err) {done = "Differentiation Error";}
                break;
            case "solvelinear":
            case "lsol":
                try { done = await math.lsolve(args.slice(1).join(" ")); } catch(err) {done = "Solving Error";}
                break;
            case "rationalize":
            case "rat":
                try { done = await math.rationalize(args.slice(1).join(" ")); } catch(err) {done = "Rationalization Error";}
                break;
            case "simplify":
            case "sim":
                try { done = await math.simplify(args.slice(1).join(" ")); } catch(err) {done = "Simplification Error";}
                break;
            case "help":
                return await this.help(message);
            default:
                return message.channel.send(`No such subcommand! (**${args[0]}**)`);
        }
        message.channel.send(done);
    },
    async help(message) {
        var operators = {
            "Add": "x + y // add(x, y)",
            "Subtract": "x - y // subtract(x, y)",
            "Multiply": "x * y // multiply(x, y)",
            "Divide": "x / y // divide(x, y)",
            "Modulus": "x % y // mod(x, y)",
            "Power": "x ^ y // pow(x, y)",
            "Factorial": "x! // factorial(x)",
            "Bitwise AND": "x & y // bitAnd(x, y)",
            "Bitwise NOT": "x ~ y // bitNot(x)",
            "Bitwise OR": "x | y // bitOr(x, y)",
            "Bitwise XOR": "x ^| y // bitXor(x, y)",
            "Left Shift": "x << y // leftShift(x, y)",
            "Right Shift": "x >> y // rightArithShift(x, y)",
            "Right Logical Shift": "x >>> y // rightLogShift(x, y)",
            "Logical AND": "x and y // and(x, y)",
            "Logical NOT": "x not y // not(x)",
            "Logical OR": "x or y // or(x, y)",
            "Logical XOR": "x xor y // xor(x, y)",
            "Assignment": "x = y",
            "Conditional Expression": "x ? y : z",
            "Range": "x : y",
            "Unit Conversion": "x to y // x in y",
            "Equal": "x == y // deepEqual(x, y) // equal(x, y) // equalText(x, y)",
            "Unequal": "x != y // unequal(x, y)",
            "Smaller": "x < y // smaller(x, y)",
            "Larger": "x > y // larger(x, y)",
            "Smaller or Equal": "x <= y // smallerEq(x, y)",
            "Larger or Equal": "x >= y // largerEq(x, y)",
            "Absolute": "abs(x)",
            "Cubic Root": "cbrt(x)",
            "Round Up": "ceil(x)",
            "Cube": "cube(x)",
            "Exponent": "exp(x)",
            "Exponent - 1": "expm1(x)",
            "Round Towards 0": "fix(x)",
            "Round Down": "floor(x)",
            "H.C.F,": "gcd(a, b, ...)",
            "Hypotenusa": "hypot(a, b, ...)",
            "L.C.M.": "lcm(a, b, ...)",
            "Natural Logarithm": "log(x)",
            "Logarithm": "log(x, base)",
            "10-base Logarithm": "log10(x)",
            "Natural Logarithm x+1": "log1p(x)",
            "Logarithm x+1": "log1p(x, base)",
            "2-base Logarithm": "log2(x)",
            "Norm": "norm(x)",
            "yth Roots": "nthRoot(x, y)",
            "Square": "square(x)",
            "Bell Number nth-term": "bellNumber(n)",
            "Catalan Number nth-term": "catalan(n)",
            "Composition": "composition(n, k)",
            "Stirling Second Kind": "stirlingS2(n, k)",
            "Get Imaginary Part": "im(x)",
            "Get Real Part": "re(x)",
            "Combinations (nCk)": "combinations(n, k)",
            "Combinations with Repeat (nPk)": "combinationsWithRep(n, k)",
            "Gamma of n": "gamma(n)",
            "Permutations": "permutations(n [, k])",
            "Random Number": "random([min, max])",
            "Random Integer": "random([min, max])",
            "Comparison": "compare(x, y)",
            "Natural Comparison": "compareNatural(x, y)",
            "Text Comparison": "compareText(x, y)",
            "Median Absolute Deviation": "mad(a, b, ...)",
            "Maximum": "max(a, b, ...)",
            "Mean": "mean(a, b, ...)",
            "Median": "median(a, b, ...)",
            "Minimum": "min(a, b, ...)",
            "Mode": "mode(a, b, ...)",
            "Product": "prod(a, b, ...)",
            "Standard Deviation": "std(a, b, ...)",
            "Sum": "sum(a, b, ...)",
            "Arc Cosine": "acos(x)",
            "Arc Hyperbolic Cosine": "acosh(x)",
            "Arc Cotangent": "acot(x)",
            "Arc Hyperbolic Cotangent": "acoth(x)",
            "Arc Cosecant": "acsc(x)",
            "Arc Hyperbolic Cosecant": "acsch(x)",
            "Arc Secant": "asec(x)",
            "Arc Hyperbolic Secant": "asech(x)",
            "Arc Sine": "asin(x)",
            "Arc Hyperbolic Sine": "asinh(x)",
            "Arc Tangent": "atan(x)",
            "Arc Hyperbolic Tangent": "atanh(x)",
            "Four-quadrant Arc Tangent": "atan2(x, y)",
            "Cosine": "cos(x)",
            "Hyperbolic Cosine": "cosh(x)",
            "Cotangent": "cot(x)",
            "Hyperbolic Cotangent": "coth(x)",
            "Cosecant": "csc(x)",
            "Hyperbolic Cosecant": "csch(x)",
            "Secant": "sec(x)",
            "Hyperbolic Secant": "sech(x)",
            "Sine": "sin(x)",
            "Hyperbolic Sine": "sinh(x)",
            "Tangent": "tan(x)",
            "Hyperbolic Tangent": "tanh(x)"
        }
        let keys = Object.keys(operators);
        keys.map(x => `**${x}**`);
        let values = Object.values(operators);
        values.map(x => `**${x}**`);
        let strings = [];
        let strings2 = [];
        for(let i = 0; i < 63; i++) {
            let str = `${keys[i]} : ${values[i]}`;
            strings.push(str);
        }
        for(let i = 63; i < keys.length; i++) {
            let str = `${keys[i]} : ${values[i]}`;
            strings2.push(str);
        }
        var em = new Discord.MessageEmbed()
        .setColor(color)
        .setTitle("Math Operators/Functions List [Page 1/2]")
        .setDescription(strings.join("\n"))
        .setTimestamp()
        .setFooter("Have a nice day! :D", message.client.user.displayAvatarURL());
        var em2 = new Discord.MessageEmbed()
        .setColor(color)
        .setTitle("Math Operators/Functions List [Page 2/2]")
        .setDescription(strings.join("\n"))
        .setTimestamp()
        .setFooter("Have a nice day! :D", message.client.user.displayAvatarURL());
        const allEmbeds = [em, em2];
        var s = 0;
        var msg = await message.channel.send(allEmbeds[0]);
  
        await msg.react("⏮");
        await msg.react("◀");
        await msg.react("▶");
        await msg.react("⏭");
        await msg.react("⏹");
        var collector = await msg.createReactionCollector((r, u) => ["◀", "▶", "⏮", "⏭", "⏹"].includes(r.emoji.name) && user.id === message.author.id, {
          idle: 60000,
          errors: ["time"]
        });
  
        collector.on("collect", function(reaction, user) {
          reaction.users.remove(user.id);
          switch (reaction.emoji.name) {
            case "⏮":
              s = 0;
              msg.edit(allEmbeds[s]);
              break;
            case "◀":
              s -= 1;
              if (s < 0) {
                s = allEmbeds.length - 1;
              }
              msg.edit(allEmbeds[s]);
              break;
            case "▶":
              s += 1;
              if (s > allEmbeds.length - 1) {
                s = 0;
              }
              msg.edit(allEmbeds[s]);
              break;
            case "⏭":
              s = allEmbeds.length - 1;
              msg.edit(allEmbeds[s]);
              break;
            case "⏹":
              collector.emit("end");
              break;
          }
        });
        collector.on("end", function() {
          msg.reactions.removeAll().catch(console.error);
        });
    }
}