export function validateColorName(name: string): boolean {
	return name.length > 0 && !/\s/.test(name);
}
