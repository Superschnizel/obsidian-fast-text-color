import {
	CSS_COLOR_PREFIX,
	VAR_COLOR_PREFIX,
	FastTextColorPluginSettings,
} from "../FastTextColorSettings";

export class TextColor {
	color: string;
	id: string;

	// text style
	italic: boolean;
	bold: boolean;
	cap_mode: CycleState;
	line_mode: CycleState;

	keybind: string;

	className: string;

	// enables the use of theme colors.
	useCssColorVariable: boolean;
	colorVariable: string;

	// new: text color for highlighted text
	textColor: string;
	useDefaultTextColor: boolean;

	// highlight styling
	highlightStyle: CycleState;
	borderRadius: CycleState;

	/**
	 * Create a basic Text Color
	 *
	 * @param {string} color - the color of the text
	 * @param {string} id - the id or name of the color
	 * @param {string} themeName - the associated theme that this color belongs to
	 * @param {boolean} [italic] - italic text
	 * @param {boolean} [bold] - bold text
	 * @param {number} [cap_mode_index] - the index for the cap mode
	 * @param {number} [line_mode_index] - the index for the line mode
	 * @param {string} [keybind] - the associated keybind
	 * @param {string} colorVariable - the builtin Css color variable that this color uses.
	 * @param {string} [textColor] - the foreground text color
	 * @param {number} [highlight_style_index] - the index for highlight style (0=full, 1=underline)
	 * @param {number} [border_radius_index] - the index for border radius (0=none, 1=small, 2=medium, 3=large)
	 * @param {boolean} [useDefaultTextColor] - use Obsidian's default text color instead of custom color
	 */
	constructor(
		color: string,
		id: string,
		themeName: string,
		italic: boolean = false,
		bold: boolean = false,
		cap_mode_index: number = 0,
		line_mode_index: number = 0,
		keybind: string = "",
		useCssColorVariable: boolean = false,
		colorVariable: string = "--color-base-00",
		textColor: string = "#000000",
		highlight_style_index: number = 0,
		border_radius_index: number = 0,
		useDefaultTextColor: boolean = false,
	) {
		this.color = color;
		this.id = id;
		this.keybind = keybind;

		// text style
		this.italic = italic;
		this.bold = bold;
		this.cap_mode = new CycleState(
			["normal", "all_caps", "small_caps"],
			cap_mode_index,
		);
		this.line_mode = new CycleState(
			["none", "underline", "overline", "line-through"],
			line_mode_index,
		);

		// highlight styling
		this.highlightStyle = new CycleState(
			["full", "underline"],
			highlight_style_index,
		);
		this.borderRadius = new CycleState(
			["none", "small", "medium", "large"],
			border_radius_index,
		);

		this.useCssColorVariable = useCssColorVariable;
		this.colorVariable = colorVariable;

		this.className = `${CSS_COLOR_PREFIX}${themeName}-${this.id}`;
		this.textColor = textColor;
		this.useDefaultTextColor = useDefaultTextColor;
	}

	getColorValue(): string {
		return this.useCssColorVariable
			? `var(${this.colorVariable})`
			: this.color;
	}

	getCssDeclarations(settings?: FastTextColorPluginSettings): string[] {
		// Determine border radius value
		const getBorderRadius = () => {
			switch (this.borderRadius.state) {
				case "small": return "3px";
				case "medium": return "6px";
				case "large": return "10px";
				default: return "0";
			}
		};

		// Base declarations for full highlight style
		const baseDeclarations = [
			`--fth-color: ${this.getColorValue()};`,
			// Use inherit if useDefaultTextColor is true, otherwise use custom color
			this.useDefaultTextColor ? "" : `color: ${this.textColor};`,
			this.italic ? "font-style: italic;" : "",
			this.bold ? "font-weight: bold;" : "",
			this.line_mode.state != "none"
				? `text-decoration: ${this.line_mode.state};`
				: "",
			this.cap_mode.state == "all_caps"
				? "text-transform: uppercase;"
				: this.cap_mode.state == "small_caps"
					? "font-variant: small-caps;"
					: "",
			settings?.colorCodeSection
				? "--code-normal: var(--fth-color);"
				: "",
		];

		// Add highlight style specific CSS
		if (this.highlightStyle.state === "underline") {
			// Thick underline style
			return [
				...baseDeclarations,
				`border-bottom: 0.25em solid var(--fth-color);`,
				`padding-bottom: 0.1em;`,
			].filter(Boolean);
		} else {
			// Full background highlight style (default)
			return [
				...baseDeclarations,
				`background-color: var(--fth-color);`,
				`padding: 0.1em 0.3em;`,
				this.borderRadius.state !== "none" ? `border-radius: ${getBorderRadius()};` : "",
			].filter(Boolean);
		}
	}

	getCssClass(settings?: FastTextColorPluginSettings): string {
		return (
			`.${CSS_COLOR_PREFIX}${this.id} {\n  ` +
			this.getCssDeclarations(settings).join("\n  ") +
			"\n  " +
			`${VAR_COLOR_PREFIX}${this.id}: ${this.color};\n}`
		);
	}

	/**
	 * get the inner css of the class for the color.
	 *
	 * @returns {string} the inner css.
	 */
	getInnerCss(settings?: FastTextColorPluginSettings): string {
		return this.getCssDeclarations(settings).join("\n  ");
	}

	getCssInlineStyle(settings?: FastTextColorPluginSettings): string {
		return this.getCssDeclarations(settings).join(" ");
	}
}

export class CycleState {
	state: string;
	private states: string[];
	index: number;

	constructor(states: string[], index: number = 0) {
		this.states = states;

		if (states.length <= 0) {
			this.state = "error";
			return;
		}

		this.state = this.states[index];
		this.index = index;
	}

	public cycle() {
		this.index = (this.index + 1) % this.states.length;
		this.state = this.states[this.index];
	}
}

// Singleton class to store latest color
export class LatestColor {
	private static static_instance: LatestColor;
	private color: TextColor = new TextColor("", "", "");

	private constructor() {}

	public static getInstance() {
		return this.static_instance || (this.static_instance = new this());
	}

	public getColor(): TextColor {
		return this.color;
	}

	public setColor(tColor: TextColor): void {
		this.color = tColor;
	}
}
