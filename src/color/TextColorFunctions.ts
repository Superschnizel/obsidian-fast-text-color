import { TextColor, LatestColor } from "./TextColor";
import { Editor } from "obsidian";
import { EditorView } from "@codemirror/view";
import { textColorParserField } from "../rendering/TextColorStateField";
import { SyntaxNodeRef } from "@lezer/common"

/**
 * Applies color to the selected text
 *
 * @param {TextColor} tColor - [TODO:description]
 * @param {Editor} editor - [TODO:description]
 */
export function applyColor(tColor: TextColor, editor: Editor) {

	let prefix = `~={${tColor.id}}`;
	let suffix = `=~`;

	// Update latest color
	LatestColor.getInstance().setColor(tColor);

	// nothing is selected, just insert coloring
	if (!editor.somethingSelected()) {
		editor.replaceSelection(prefix);

		let pos = editor.getCursor();
		// console.log(`line: ${pos.line}, ch: ${pos.ch}`);
		editor.replaceSelection(suffix);

		editor.setCursor(pos);

		// push a scope onto the stack to be able to jump out with tab
		// this made more Problems than it was worth... maybe readd later.

		// let scope = CreateCaptureScope(editor, this.app, pos, suffix);

		// this.app.keymap.pushScope(scope);
		return;
	}

	// let selected = editor.getSelection();

	let selections = editor.listSelections();
	selections.forEach(element => {
		// Compute start and end of selection from anchor and head
		const anchorOffset = editor.posToOffset(element.anchor);
		const headOffset = editor.posToOffset(element.head);
		let start = anchorOffset < headOffset ? element.anchor : element.head;
		let end = anchorOffset < headOffset ? element.head : element.anchor;

		// Add fences to all nonempty lines of the selection
		const selected = editor.getRange(start, end);
		let selectedLines = selected.split('\n');
		for (let i = 0; i < selectedLines.length; i++) {
			if (selectedLines[i]) selectedLines[i] = prefix + selectedLines[i] + suffix;
		}
		editor.replaceRange(selectedLines.join('\n'), start, end);

		// Set selection to be the text within the exterior fences
		// Ignore empty lines at the beginning and end
		// If all lines are empty, put cursor at the end of selection
		// @ts-ignore
		const nonEmpty = (element) => element.length > 0;
		if (!selectedLines.some(nonEmpty))
			editor.setCursor(end);
		else {
			const firstNonEmptyLine = selectedLines.findIndex(nonEmpty);
			const lastNonEmptyLine = selectedLines.findLastIndex(nonEmpty);
			const beginSelection = { line: start.line + firstNonEmptyLine, ch: (firstNonEmptyLine == 0) ? start.ch + prefix.length : prefix.length };
			const endSelection = { line: start.line + lastNonEmptyLine, ch: (lastNonEmptyLine == selectedLines.length - 1) ? end.ch + prefix.length : selectedLines[lastNonEmptyLine].length - suffix.length };
			editor.setSelection(beginSelection, endSelection);
		}
	});

	// TODO check if there already is some coloring applied somewhere near.
	// for now just check if what is marked is already a colored section and trim tags:
	// if (selected.match(IS_COLORED)) {
	// 	selected = selected.replace(LEADING_SPAN, '');
	// 	selected = selected.replace(TRAILING_SPAN, '');
	// }

}

/**
 * Removes the color for the text that the cursor in if nothing is selected or from all the colored areas in the selection.
 *
 * @param {Editor} editor 
 * @param {EditorView} view
 */
export function removeColor(editor: Editor, view: EditorView) {
	// for now only works if span is leading and trailing
	const tree = view.state.field(textColorParserField).tree;

	let from = Math.min(view.state.selection.main.head, view.state.selection.main.anchor);
	let to = Math.max(view.state.selection.main.head, view.state.selection.main.anchor);

	// if there is no selection, delete surrounding coloring.
	if (to - from == 0) {
		let node = tree.resolveInner(view.state.selection.main.head);
		while (node.parent != null) {
			if (node.type.name != "Expression") {
				node = node.parent;
				continue;
			}

			const TcLeft = node.getChild("TcLeft");
			const Rmarker = node.getChild("TcRight")?.getChild("REnd")?.getChild("RMarker");

			view.dispatch({
				changes: [{
					from: TcLeft ? TcLeft.from : 0,
					to: TcLeft ? TcLeft.to : 0,
					insert: ''
				}, {
					from: Rmarker ? Rmarker.from : 0,
					to: Rmarker ? Rmarker.to : 0,
					insert: ''
				}
				]
			})

			return;
		}
		return;
	}

	// if selection is bigger delete everything inside.

	//@ts-expect-error
	let changes = [];

	tree.iterate({
		from: from,
		to: to,
		enter(n: SyntaxNodeRef) {
			if (n.type.name != "Expression") {
				return true;
			}

			const TcLeft = n.node.getChild("TcLeft");
			const Rmarker = n.node.getChild("TcRight")?.getChild("REnd")?.getChild("RMarker");

			changes.push({
				from: TcLeft ? TcLeft.from : 0,
				to: TcLeft ? TcLeft.to : 0,
				insert: ''
			});
			changes.push({
				from: Rmarker ? Rmarker.from : 0,
				to: Rmarker ? Rmarker.to : 0,
				insert: ''
			});
			return true;
		}
	});

	//@ts-expect-error
	view.dispatch({ changes: changes });
	return;
}
