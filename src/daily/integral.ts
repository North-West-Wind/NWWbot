import { DailyModule } from "../classes/NorthClient.js";
import { getRandomNumber, toSubscript, toSuperscript } from "../function.js";

class DailyIntegral implements DailyModule {
	name = "integral";
	description = "Integral is a part of calculus.";
	value: string;

	get() {
		return this.value;
	}

	update() {
		const trigo = Math.random() < 0.5;
		var min = Math.round(getRandomNumber(-5, 5));
		var max = Math.round(getRandomNumber(min, 5));
		if (max == min) max++;
		const types = ["%u^%a", "ln(%u)", "e^%u", "e^(%u^%a)"];
		if (trigo) {
			delete types[3];
			types.push("sin%u^%a", "cos%u^%a", "tan%u^%a", "csc%u^%a", "sec%u^%a", "cot%u^%a");
		}
		const length = Math.round(getRandomNumber(1, 3));
		const components = [];
		for (let ii = 0; ii < length; ii++) {
			const component = types[Math.floor(Math.random() * types.length)];
			const exponents = !trigo ? Math.round(getRandomNumber(1, 2)) : 1;
			const variables = [];
			for (let jj = exponents; jj > 0; jj--) {
				var coefficient = Math.round(getRandomNumber(-20 / jj, 20 / jj));
				while (coefficient == 0) coefficient = Math.round(getRandomNumber(-20 / jj, 20 / jj));
				if (jj == exponents) variables.push(`${coefficient}x${jj > 1 ? toSuperscript(jj.toString()) : ""}`);
				else variables.push(`${coefficient > 0 ? "+" : ""}${coefficient}x${jj > 1 ? toSuperscript(jj.toString()) : ""}`);
			}
			const constant = !trigo ? Math.round(getRandomNumber(-100, 100)).toString() : `${Math.round(getRandomNumber(-5, 5))}π`;
			if (!constant.startsWith("0")) variables.push((!constant.startsWith("-") ? "+" : "") + constant);
			components.push(component.replace("%u", `${variables.length > 1 ? "(" : ""}${variables.join("")}${variables.length > 1 ? ")" : ""}`).replace("^%a", toSuperscript(Math.round(getRandomNumber(-3, 3)).toString())))
		}
		this.value = `[${min.toString() + (trigo ? "π" : "")}, ${max.toString() + (trigo ? "π" : "")}] ∫ ${components.join(" × ")} dx`;
	}
}

const module = new DailyIntegral();
export default module;