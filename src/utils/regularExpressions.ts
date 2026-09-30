export const IS_COLORED = /^\+\+\{.*\}.*\+\+$/;
export const LEADING_SPAN = /^\<span.*\>(?!$)/;
export const TRAILING_SPAN = /\<\/span\>$/;
// the color name must not contain whitespace or '}' (same rule as in textColorLanguage.grammar).
// A greedy \S+ would match across the closing '}' and swallow everything up to the last '}' in a
// line, which drops the text between two colored sections when rendering in reading mode.
export const PREFIX = /\~\=\{[^\s}]+\}/g
export const SUFFIX = /\=\~/g

export interface RegExMatch {
	index: number;
	value: string;
	end: number;
}
