import { validateColorName } from "../../src/utils/validateColorName";

it('returns `true` when the color name contain valid characters; otherwise, it returns `false`', () => {
	expect(validateColorName('')).toBe(false);
	expect(validateColorName(' ')).toBe(false);
	expect(validateColorName('a')).toBe(true);
	expect(validateColorName('9')).toBe(true);
	expect(validateColorName('b1')).toBe(true);
	expect(validateColorName('b1_dD_8')).toBe(true);
	expect(validateColorName('b1/dD/8')).toBe(true);
});
