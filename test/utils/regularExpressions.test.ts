import { PREFIX, SUFFIX } from "../../src/utils/regularExpressions";

const stripDelimiters = (text: string) => text.replace(PREFIX, "").replace(SUFFIX, "");

describe("color delimiters", () => {
	it("matches a single colored section", () => {
		const line = "some ~={red}colored=~ text";

		expect(line.match(PREFIX)).toEqual(["~={red}"]);
		expect(stripDelimiters(line)).toBe("some colored text");
	});

	it("does not swallow the text between two colored sections on the same line", () => {
		const line = "表示~={red}恒常=~的依存关系或~={red}一般法则=~";

		expect(line.match(PREFIX)).toEqual(["~={red}", "~={red}"]);
		expect(stripDelimiters(line)).toBe("表示恒常的依存关系或一般法则");
	});

	it("keeps the text around two adjacent colored sections", () => {
		const line = "~={red}a=~~={blue}b=~";

		expect(line.match(PREFIX)).toEqual(["~={red}", "~={blue}"]);
		expect(stripDelimiters(line)).toBe("ab");
	});
});
