
import { NorthInteraction, NorthMessage, FullCommand } from "../../classes/NorthClient.js";
import * as math from "mathjs";
import * as Discord from "discord.js";
import { color, createEmbedScrolling } from "../../function.js";

class MathCommand implements FullCommand {
    name = "math"
    description = "Solve your Mathematical problems."
    usage = "<subcommand> <expression>"
    subcommands = ["evaluate", "derivative", "rationalize", "simplify", "help"]
    subaliases = ["eval", "ddx", "rat", "sim", "help"]
    subdesc = ["Evaluates a Mathematical expression.", "Performs derivative with respect to x.", "Rationalizes a Mathematical expression.", "Simplifies a Mathematical expression.", "Displays all available constants and operators for this command."]
    category = 4
    args = 2
    options = [
        { name: "evaluate", description: "Evaluates a Mathematical expression.", type: "SUB_COMMAND", options: [{ name: "expression", description: "The Mathematical expression to be processed.", required: true, type: "STRING" }] },
        { name: "derivative", description: "Performs derivative with respect to x.", type: "SUB_COMMAND", options: [{ name: "expression", description: "The Mathematical expression to be processed.", required: true, type: "STRING" }] },
        { name: "rationalize", description: "Rationalizes a Mathematical expression.", type: "SUB_COMMAND", options: [{ name: "expression", description: "The Mathematical expression to be processed.", required: true, type: "STRING" }] },
        { name: "simplify", description: "Simplifies a Mathematical expression.", type: "SUB_COMMAND", options: [{ name: "expression", description: "The Mathematical expression to be processed.", required: true, type: "STRING" }] },
        { name: "help", description: "Displays all available constants and operators for this command.", type: "SUB_COMMAND" }
    ];

    async execute(interaction: NorthInteraction) {
        const sub = interaction.options.getSubcommand();
        if (sub === "help") return await this.help(interaction);
        let done = "Error!";
        switch(sub) {
            case "evaluate":
                try { done = await math.evaluate(interaction.options.getString("expression")); } catch(err) {done = "Evaluation Error"; console.error(err);}
                break;
            case "derivative":
                try { done = await math.derivative(interaction.options.getString("expression"), "x").compile().evaluate(); } catch(err) {done = "Differentiation Error"; console.error(err);}
                break;
            case "rationalize":
                try { done = math.rationalize(interaction.options.getString("expression")).toString(); } catch(err) {done = "Rationalization Error"; console.error(err);}
                break;
            case "simplify":
                try { done = math.simplify(interaction.options.getString("expression")).toString(); } catch(err) {done = "Simplification Error"; console.error(err);}
                break;
        }
        return await interaction.reply(done);
    }

    async run(message: NorthMessage, args: string[]) {
        let done = "Error!";
        switch(args[0]) {
            case "evaluate":
            case "eval":
                try { done = await math.evaluate(args.slice(1).join(" ")); } catch(err) {done = "Evaluation Error"; console.error(err);}
                break;
            case "derivative":
            case "ddx":
                try { done = await math.derivative(args.slice(1).join(" "), "x").compile().evaluate(); } catch(err) {done = "Differentiation Error"; console.error(err);}
                break;
            case "rationalize":
            case "rat":
                try { done = math.rationalize(args.slice(1).join(" ")).toString(); } catch(err) {done = "Rationalization Error"; console.error(err);}
                break;
            case "simplify":
            case "sim":
                try { done = math.simplify(args.slice(1).join(" ")).toString(); } catch(err) {done = "Simplification Error"; console.error(err);}
                break;
            case "help":
                return await this.help(message);
            default:
                return message.channel.send(`No such subcommand! (**${args[0]}**)`);
        }
        await message.channel.send(done);
    }
    async help(message: NorthMessage | NorthInteraction) {
        const operators = {
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
        };
        const constants = {
          "Euler's Number": "e // E",
          "Imaginary Unit": "i",
          "Infinity": "Infinity",
          "Natural Logarithm of 2": "LN2",
          "Natural Logarithm of 10": "LN10",
          "Base-2 Logarithm of E": "LOG2E",
          "Base-10 Logarithm of E": "LOG10E",
          "Not a Number": "NaN",
          "Null": "null",
          "Golden Ratio": "phi",
          "Pi": "pi // PI",
          "Square Root of 1/2": "SQRT1_2",
          "Square Root of 2": "SQRT2",
          "Twice Pi": "tau",
          "Undefined": "undefined"
        }
        const keys = Object.keys(operators);
        const values = Object.values(operators);
        const morekeys = Object.keys(constants);
        const morevalues = Object.values(constants);
        const strings = [];
        const strings2 = [];
        const strings3 = [];
        for(let i = 0; i < 63; i++) {
            const str = `${keys[i]} : ${values[i]}`;
            strings.push(str);
        }
        for(let i = 63; i < keys.length; i++) {
            const str = `${keys[i]} : ${values[i]}`;
            strings2.push(str);
        }
        for(let i = 0; i < morekeys.length; i++) {
            const str = `${morekeys[i]} : ${morevalues[i]}`;
            strings3.push(str);
        }
        const em = new Discord.EmbedBuilder()
        .setColor(color())
        .setTitle("Math Operators/Functions/Constants List [Page 1/3]")
        .setDescription(strings.join("\n"))
        .setTimestamp()
        .setFooter({ text: "Have a nice day! :D", iconURL: message.client.user.displayAvatarURL() });
        const em2 = new Discord.EmbedBuilder()
        .setColor(color())
        .setTitle("Math Operators/Functions/Constants List [Page 2/3]")
        .setDescription(strings2.join("\n"))
        .setTimestamp()
        .setFooter({ text: "Have a nice day! :D", iconURL: message.client.user.displayAvatarURL() });
        const em3 = new Discord.EmbedBuilder()
        .setColor(color())
        .setTitle("Math Operators/Functions/Constants List [Page 3/3]")
        .setDescription(strings3.join("\n"))
        .setTimestamp()
        .setFooter({ text: "Have a nice day! :D", iconURL: message.client.user.displayAvatarURL() });
        const allEmbeds = [em, em2, em3];
        await createEmbedScrolling(message, allEmbeds);
    }
}

const cmd = new MathCommand();
export default cmd;