import { TextColor } from "./TextColor";
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
		let anchorpos = element.anchor.line + element.anchor.ch;
		let headpos = element.head.line + element.head.ch;
		let start = anchorpos < headpos ? element.anchor : element.head;
		let end = anchorpos < headpos ? element.head : element.anchor;

		let selected = editor.getRange(start, end);
		let coloredText = `${prefix}${selected}${suffix}`;




		editor.replaceRange(coloredText, start, end);

		// move cursor one item to the right.
		// could not find a way to query for last possible position, so trycatch is needed.
		try {
			let pos = editor.getCursor();
			pos.ch = pos.ch + 1;
			editor.setCursor(pos);
		} catch {
			return;
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
			console.log("found a node");


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
