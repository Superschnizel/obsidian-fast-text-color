import { App, Modal, Setting } from "obsidian";

class KeyBindModal extends Modal {
	result: string;

	finished: boolean;
	handler: any;

	constructor(app: App) {
		super(app);

		this.finished = false;
	}

	onOpen() {
		const { contentEl } = this;

		contentEl.createEl("h1", { text: "Press any key" });
		// let center = contentEl.createDiv();
		// center.addClass("fth-keypress-modal")
		// center.createDiv().addClass("fth-keypress-modal-center")

		this.handler = this.handleKeypress.bind(this);

		window.addEventListener("keypress", this.handler);

		new Setting(contentEl).addButton((btn) => {
			btn.setButtonText("Cancel").onClick((evt) => {
				this.close();
			});
		});
	}

	onClose() {
		let { contentEl } = this;
		contentEl.empty();
	}

	handleKeypress(evt: KeyboardEvent) {
		this.result = evt.key.toUpperCase();

		// console.debug("Keypressed");

		this.modalEl.removeEventListener("keypress", this.handler, true);

		// console.debug("removed");

		this.finished = true;
	}
}

export async function getKeyBindWithModal(app: App): Promise<string> {
	let modal = new KeyBindModal(app);
	modal.open();

	while (!modal.finished) {
		await sleep(16);
	}

	let result = modal.result;
	modal.close();

	return result;
}
