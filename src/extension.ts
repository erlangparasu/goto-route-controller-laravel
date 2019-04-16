'use strict';

// Created by Erlang Parasu 2019

// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// This method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "LaravelRouteClassOpener" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('enableLaravelRouteClassOpener', () => {
		// The code you place here will be executed every time your command is executed

		// Display a message box to the user
		vscode.window.showInformationMessage('Laravel Route Class Opener enabled!');
	});

	let diss = vscode.commands.registerTextEditorCommand('extension.openPhpClassFile', (textEditor: vscode.TextEditor, edit: vscode.TextEditorEdit, args: any[]) => {
		let textLine = textEditor.document.lineAt(textEditor.selection.start);
		let str = textEditor.document.getText(textEditor.selection);
		// vscode.window.showInformationMessage(textLine.text);

		let activeEditor = textEditor;
		// const regEx = /([,])(.?)(['])(.+)([a-zA-Z]{1,})([@])([a-zA-Z]{1,})(['])/g;
		const regEx = /'([a-zA-Z\\]+)\w+@\w+'/g;
		// const text = activeEditor.document.getText();
		const text = textLine.text;
		const smallNumbers: vscode.DecorationOptions[] = [];
		const largeNumbers: vscode.DecorationOptions[] = [];
		let match;
		while (match = regEx.exec(text)) {
			const startPos = activeEditor.document.positionAt(match.index);
			const endPos = activeEditor.document.positionAt(match.index + match[0].length);

			const decoration = { range: new vscode.Range(startPos, endPos), hoverMessage: 'File **' + match[0] + '**' };
			// if (match[0].length < 3) {
			// smallNumbers.push(decoration);
			// } else {
			// largeNumbers.push(decoration);
			// }

			let strResultMatch = match[0];
			// vscode.window.showInformationMessage(strResultMatch);

			parsePhpClassAndMethod(strResultMatch);
		}
	});

	function parsePhpClassAndMethod(str: string) {
		let strFiltered = str.replace(',', '');
		strFiltered = strFiltered.trim();
		strFiltered = strFiltered.replace(/[\']/g, '');
		strFiltered = strFiltered.replace(/["]/g, '');

		// vscode.window.showInformationMessage(strFiltered);

		let arrStr = strFiltered.split('@');
		let strPhpNamespace = arrStr[0];
		let strPhpMethodName = arrStr[1];

		// vscode.window.showInformationMessage(strPhpNamespace);
		// vscode.window.showInformationMessage('Going to method: ' + strPhpMethodName + '()');

		let arrStrPhpNamespace = strPhpNamespace.split('\\');
		let strFilenamePrefix = arrStrPhpNamespace[arrStrPhpNamespace.length - 1];
		// vscode.window.showInformationMessage(strFilenamePrefix);

		let files = vscode.workspace.findFiles('**/' + strFilenamePrefix + '.php');
		files.then((uris: vscode.Uri[]) => {
			let filePath = uris[0].toString();
			// vscode.window.showInformationMessage(JSON.stringify(filePath));

			vscode.workspace.openTextDocument(uris[0]).then((textDocument: vscode.TextDocument) => {
				// let selection = null;

				let docText = textDocument.getText();
				let methodPosition: number = docText.indexOf('function ' + strPhpMethodName + '(');
				// vscode.window.showInformationMessage(JSON.stringify(methodPosition));

				let posStart = textDocument.positionAt('function '.length + methodPosition + '('.length);
				let posEnd = textDocument.positionAt('function '.length + methodPosition + '('.length);
				let range = new vscode.Range(
					posStart,
					posEnd
				);

				let options: vscode.TextDocumentShowOptions = {
					viewColumn: undefined,
					preserveFocus: false,
					preview: false,
					selection: range,
				};
				vscode.window.showTextDocument(textDocument.uri, options);
			});
		})
	}

	// ------------------------------------------------------------------------

	console.log('Decorator sample is activated');

	let timeout: NodeJS.Timer | undefined = undefined;

	// Create a decorator type that we use to decorate small numbers
	const smallNumberDecorationType = vscode.window.createTextEditorDecorationType({
		borderWidth: '1px',
		borderStyle: 'solid',
		overviewRulerColor: 'blue',
		overviewRulerLane: vscode.OverviewRulerLane.Right,
		light: {
			// This color will be used in light color themes
			borderColor: 'darkblue',
			borderRadius: '2px'
			// cursor: 'pointer'
		},
		dark: {
			// This color will be used in dark color themes
			borderColor: 'lightblue',
			borderRadius: '2px'
			// cursor: 'pointer'
		}
	});

	// Create a decorator type that we use to decorate large numbers
	const largeNumberDecorationType = vscode.window.createTextEditorDecorationType({
		cursor: 'crosshair',
		// Use a themable color. See package.json for the declaration and default values.
		backgroundColor: { id: 'myextension.largeNumberBackground' }
	});

	let activeEditor = vscode.window.activeTextEditor;

	function updateDecorations() {
		if (!activeEditor) {
			return;
		}
		// const regEx = /([,])(.?)(['])(.+)([a-zA-Z]{1,})([@])([a-zA-Z]{1,})(['])/g;
		const regEx = /'([a-zA-Z\\]+)\w+@\w+'/g;
		const text = activeEditor.document.getText();
		const smallNumbers: vscode.DecorationOptions[] = [];
		const largeNumbers: vscode.DecorationOptions[] = [];
		let match;
		while (match = regEx.exec(text)) {
			const startPos = activeEditor.document.positionAt(match.index);
			const endPos = activeEditor.document.positionAt(match.index + match[0].length);
			const decoration = { range: new vscode.Range(startPos, endPos), hoverMessage: 'File **' + match[0] + '**' };

			// if (match[0].length < 3) {
			smallNumbers.push(decoration);
			// } else {
			// largeNumbers.push(decoration);
			// }
		}
		activeEditor.setDecorations(smallNumberDecorationType, smallNumbers);
		activeEditor.setDecorations(largeNumberDecorationType, largeNumbers);
	}

	function triggerUpdateDecorations() {
		if (timeout) {
			clearTimeout(timeout);
			timeout = undefined;
		}
		timeout = setTimeout(updateDecorations, 500);
	}

	if (activeEditor) {
		// triggerUpdateDecorations();
	}

	vscode.window.onDidChangeActiveTextEditor(editor => {
		activeEditor = editor;
		if (editor) {
			// triggerUpdateDecorations();
		}
	}, null, context.subscriptions);

	vscode.workspace.onDidChangeTextDocument(event => {
		if (activeEditor && event.document === activeEditor.document) {
			// triggerUpdateDecorations();
		}
	}, null, context.subscriptions);

	context.subscriptions.push(diss);
	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {
	//
}
