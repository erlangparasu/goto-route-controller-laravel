/**
 * Copyright 2019 ErlangParasu
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
"use strict";

// Created by Erlang Parasu 2019

// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

let mThenableProgress;
let mIntervalId: NodeJS.Timeout;
let mResolve: (value?: string) => void;
let mReject: (reason?: any) => void;
let mStatusBarItem: vscode.StatusBarItem;

function routeFilterStr(strInput: string): string {
    let offset = strInput.indexOf("Route::", 0);
    if (offset === -1) {
        return "";
    }

    offset = strInput.indexOf("(", offset);
    if (offset === -1) {
        return "";
    }

    offset = strInput.indexOf("'", offset);
    if (offset === -1) {
        return "";
    }

    offset = strInput.indexOf("'", offset);
    if (offset === -1) {
        return "";
    }

    offset = strInput.indexOf(",", offset);
    if (offset === -1) {
        return "";
    }

    return strInput.substr(offset);
}

// This method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Extension "goto-route-controller-laravel" activate');

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with registerCommand
    // The commandId parameter must match the command field in package.json
    // let disposable0 = vscode.commands.registerCommand('enableLaravelRouteClassOpener', () => {
    // 	// The code you place here will be executed every time your command is executed
    // 	// Display a message box to the user
    // 	vscode.window.showInformationMessage('goto-route-controller-laravel activate');
    // });

    // Find Controller
    let disposableA = vscode.commands.registerTextEditorCommand('extension.openControllerClassFile', (textEditor: vscode.TextEditor, edit: vscode.TextEditorEdit, args: any[]) => {
        // Test
        // var rrr = routeFilterStr("Route::post('sekolah', 'Sekolah\SekolahController@mendaftar')->name('sekolah.mendaftar');");
        // console.log('rrr', rrr);

        try {
            mReject(new Error('CancelProgress'));
        } catch (e) {
            // Do nothing.
        }

        mThenableProgress = vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "EP: Finding controller declaration"
        }, (progress: vscode.Progress<{ message?: string; increment?: number }>, token: vscode.CancellationToken) => {
            return new Promise<string>((resolve: (value?: string) => void, reject: (reason?: any) => void) => {
                try {
                    mReject(new Error('CancelProgress'));
                } catch (e) {
                    // Do nothing.
                }

                mResolve = resolve; // To stop progress indicator later
                mReject = reject; // To stop progress indicator later

                let textLine: vscode.TextLine = textEditor.document.lineAt(textEditor.selection.start);
                // let str: string = textEditor.document.getText(textEditor.selection);
                // vscode.window.showInformationMessage(textLine.text);

                let strUri = textEditor.document.uri.path;
                if (strUri.indexOf('routes') === -1) {
                    // This file is not inside routes directory
                    vscode.window.showInformationMessage('This file is not inside routes directory');
                    reject(new Error('NotInsideRoutesDirectory'));
                    return;
                }
                if ((strUri.indexOf('web.php') !== -1) || (strUri.indexOf('api.php') !== -1)) {
                    // OK
                } else {
                    // This file is not web.php or api.php
                    vscode.window.showInformationMessage('This file is not web.php or api.php');
                    reject(new Error('NotWebPhpOrApiPhp'));
                    return;
                }
                if (textEditor.document.getText().indexOf('Route::') === -1) {
                    // No route declaration found in this file
                    vscode.window.showInformationMessage('No route declaration found in this file');
                    reject(new Error('NoRouteDeclarationFound'));
                    return;
                }

                let activeEditor: vscode.TextEditor = textEditor;
                // const text = activeEditor.document.getText();
                const text: string = textLine.text;
                // const smallNumbers: vscode.DecorationOptions[] = [];
                // const largeNumbers: vscode.DecorationOptions[] = [];

                let isFound = false;
                let match;
                const regEx: RegExp = /'([a-zA-Z\\]+)\w+[a-zA-Z0-9](@\w+)?'/g;
                while (match = regEx.exec(routeFilterStr(text))) {
                    const startPos: vscode.Position = activeEditor.document.positionAt(match.index);
                    const endPos: vscode.Position = activeEditor.document.positionAt(match.index + match[0].length);

                    const decoration = { range: new vscode.Range(startPos, endPos), hoverMessage: 'File **' + match[0] + '**' };
                    // if (match[0].length < 3) {
                    // smallNumbers.push(decoration);
                    // } else {
                    // largeNumbers.push(decoration);
                    // }

                    let strResultMatch: string = match[0];
                    // vscode.window.showInformationMessage(strResultMatch);

                    // progress.report({ increment: 1, message: "..." });
                    parsePhpClassAndMethod(strResultMatch, resolve, reject, progress, token)
                        .then(() => {
                            //
                        })
                        .catch((reason: any) => {
                            try {
                                mReject(reason);
                            } catch (e) {
                                // Do nothing.
                            }
                        })
                        .finally(() => {
                            //
                        });

                    isFound = true;
                    break;
                }

                if (!isFound) {
                    reject(new Error('NoMatch'));
                }
            });
        });

        mThenableProgress.then((value: string) => {
            console.log('progress onFulfilled', value);
        }, (reason: any) => {
            console.log('progress onRejected', reason);
        });
    });

    // Find Route
    let disposableB = vscode.commands.registerTextEditorCommand('extension.openRoutesDeclarationFile', (textEditor: vscode.TextEditor, edit: vscode.TextEditorEdit, args: any[]) => {
        try {
            mReject(new Error('CancelProgress'));
        } catch (e) {
            // Do nothing.
        }

        let progressOptions = {
            location: vscode.ProgressLocation.Notification,
            title: "EP: Finding route declaration"
        };

        mThenableProgress = vscode.window.withProgress(
            progressOptions,
            (progress: vscode.Progress<{ message?: string; increment?: number }>, token: vscode.CancellationToken) => {
                return new Promise<string>((resolve: (value?: string) => void, reject: (reason?: any) => void) => {
                    try {
                        mReject(new Error('CancelProgress'));
                    } catch (e) {
                        // Do nothing.
                    }

                    mResolve = resolve;
                    mReject = reject;

                    // progress.report({ increment: 1, message: "..." });
                    handleTextEditorCommand(textEditor, edit, args, resolve, reject, progress, token)
                        .then(() => {
                            //
                        })
                        .catch((reason: any) => {
                            try {
                                mReject(reason);
                            } catch (e) {
                                // Do nothing.
                            }
                        })
                        .finally(() => {
                            //
                        });
                });
            }
        );

        mThenableProgress.then((value: string) => {
            console.log('progress onFulfilled', value);
        }, (reason: any) => {
            console.log('progress onRejected', reason);
        });
    });

    // Find blade usage (open controller file)
    let disposableC = vscode.commands.registerTextEditorCommand('extension.findBladeUsage', (textEditor: vscode.TextEditor, edit: vscode.TextEditorEdit, args: any[]) => {
        try {
            mReject(new Error('CancelProgress'));
        } catch (e) {
            // Do nothing.
        }

        mThenableProgress = vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "EP: Finding blade usage"
        }, (progress: vscode.Progress<{ message?: string; increment?: number }>, token: vscode.CancellationToken) => {
            return new Promise<string>((resolve: (value?: string) => void, reject: (reason?: any) => void) => {
                try {
                    mReject(new Error('CancelProgress'));
                } catch (e) {
                    // Do nothing.
                }

                mResolve = resolve; // To stop progress indicator later
                mReject = reject; // To stop progress indicator later

                let textLine: vscode.TextLine = textEditor.document.lineAt(textEditor.selection.start);
                // let str: string = textEditor.document.getText(textEditor.selection);
                // vscode.window.showInformationMessage(textLine.text);

                let strUri = textEditor.document.uri.path;
                if (strUri.indexOf('resources') === -1 || strUri.indexOf('views') === -1) {
                    // This file is not inside "views" directory
                    vscode.window.showInformationMessage('This file is not inside "views" directory');
                    reject(new Error('NotInsideViewsDirectory'));
                    return;
                }
                if ((strUri.indexOf('.blade.php') !== -1)) {
                    // OK
                } else {
                    // Unsuported file
                    vscode.window.showInformationMessage('This file is not a blade file');
                    reject(new Error('NotBladeFile'));
                    return;
                }

                let strFiltered: string = strUri.replace('.blade.php', '')
                    // .trim()
                    // .replace(/[\']/g, '')
                    // .replace(/["]/g, '')
                    .trim();
                // console.log(strFiltered);
                let indexStrResources = strFiltered.indexOf('resources');
                let strr = strFiltered.substr(indexStrResources);
                // console.log(strr);
                if (strr.indexOf('resources') === -1 || strr.indexOf('views') === -1) {
                    vscode.window.showInformationMessage('This file is not inside "views" directory (2)');
                    reject(new Error('NotInsideViewsDirectory2'));
                    return;
                }
                let indexStrViews = strr.indexOf('views');
                strr = strr.substr(indexStrViews + 'views'.length + 1); // 1 = directory separator char
                // console.log(strr);
                strr = strr.trim();
                if (strr) {
                    // OK
                } else {
                    vscode.window.showInformationMessage('No usage found');
                    reject(new Error('NoUsageFound'));
                    return;
                }

                // console.log('Horray! File is valid.');
                strr = strr.replace(/[\\]/g, '.')
                    .replace(/[/]/g, '.')
                    .trim();
                // console.log(strr); // Example: front.single
                let strToFind: string = "view('" + strr + "'";

                handleFindBladeUsage(strToFind, textEditor, edit, args, resolve, reject, progress, token)
                    .then(() => {
                        //
                    })
                    .catch((reason: any) => {
                        try {
                            mReject(reason);
                        } catch (e) {
                            // Do nothing.
                        }
                    })
                    .finally(() => {
                        // Do nothing.
                    });
            });
        });

        mThenableProgress.then((value: string) => {
            console.log('progress onFulfilled', value);
        }, (reason: any) => {
            console.log('progress onRejected', reason);
        });
    });

    async function handleFindBladeUsage(
        strToFind: string,
        textEditor: vscode.TextEditor,
        edit: vscode.TextEditorEdit,
        args: any[],
        resolveParent: (value?: string) => void,
        rejectParent: (reason?: any) => void,
        progressParent: vscode.Progress<{ message?: string; increment?: number }>,
        tokenParent: vscode.CancellationToken
    ) {
        let urisAll: vscode.Uri[] = [];
        let uris1 = await vscode.workspace.findFiles('**/*.php', '**/vendor/**');
        urisAll.push(...uris1);
        await handleBladeEe(urisAll, strToFind, resolveParent, rejectParent, progressParent, tokenParent);
    }

    async function handleBladeEe(
        uris: vscode.Uri[],
        strToFind: string,
        resolveParent: (value?: string) => void,
        rejectParent: (reason?: any) => void,
        progressParent: vscode.Progress<{ message?: string; increment?: number }>,
        tokenParent: vscode.CancellationToken
    ) {
        // Note: uris length is exactly 2 (web.php and api.php)
        let arrResult: MyResult[] = [];
        for (let i = 0; i < uris.length; i++) {
            const uri = uris[i];
            let filePath: string = uri.toString();
            console.log('Scanning file:', filePath);
            // vscode.window.showInformationMessage(JSON.stringify(filePath));

            // TODO: replace with async and await...
            let textDocument: vscode.TextDocument = await vscode.workspace.openTextDocument(uri);
            // let selection = null;
            let docText: string = textDocument.getText();

            // 1. Is PHP File?
            if (docText.indexOf('<?php') === 0) {
                // OK
            } else {
                // Not PHP File
                // rejectParent(new Error('NotPhpFile'));
                continue;
            }

            // TODO: Find text again using fullEndPosition as offset...
            let tempOffset = 0;
            while (true) {
                // 2. Try to find text: example: "'front.single'"
                let fullStartPosition: number = docText.indexOf(strToFind, tempOffset);
                if (fullStartPosition === -1) {
                    // Not found
                    // rejectParent(new Error('ViewCallNotFound'));
                    break;
                }

                let fullEndPosition: number = fullStartPosition + ((strToFind).length);
                tempOffset = fullEndPosition;

                let positionStart: vscode.Position = textDocument.positionAt(fullStartPosition + "view('".length);
                // let line: vscode.TextLine = textDocument.lineAt(positionStart.line);
                let positionEnd: vscode.Position = textDocument.positionAt(fullEndPosition - 1);

                // Note: "'front.single'"
                let ee = textDocument.getText(new vscode.Range(positionStart, positionEnd));
                // console.log("TCL: activate -> ee", ee);

                arrResult.push({
                    uri: textDocument.uri,
                    positionStart: positionStart,
                    positionEnd: positionEnd
                });
            }
        }
        // console.log(arrResult);

        if (arrResult.length === 1) {
            for (let i = 0; i < arrResult.length; i++) {
                const rec: MyResult = arrResult[i];

                let showOptions: vscode.TextDocumentShowOptions = {
                    viewColumn: undefined,
                    preserveFocus: false,
                    preview: true,
                    selection: new vscode.Range(rec.positionStart, rec.positionEnd),
                };
                vscode.window.showTextDocument(rec.uri, showOptions);

                break;
            }
        } else if (arrResult.length > 1) {
            let arrStrPath: string[] = [];
            for (let x = 0; x < arrResult.length; x++) {
                const rec = arrResult[x];

                let strOption = '';
                strOption += rec.uri.path;
                strOption += ' ';
                strOption += ' - Line: ';
                strOption += (rec.positionStart.line + 1).toString();

                arrStrPath.push(strOption);
            }

            // vscode.window.showInformationMessage("Blade usage found: Choose one ^");

            vscode.window.showQuickPick(
                arrStrPath,
                {
                    placeHolder: "Multiple Blade usage found: " + strToFind + " ...",
                    ignoreFocusOut: true,
                    canPickMany: false,
                }
            ).then((value: string | undefined) => {
                for (let i = 0; i < arrResult.length; i++) {
                    const rec: MyResult = arrResult[i];

                    let strOption = '';
                    strOption += rec.uri.path;
                    strOption += ' ';
                    strOption += ' - Line: ';
                    strOption += (rec.positionStart.line + 1).toString();

                    if (value === strOption) {
                        let showOptions: vscode.TextDocumentShowOptions = {
                            viewColumn: undefined,
                            preserveFocus: false,
                            preview: true,
                            selection: new vscode.Range(rec.positionStart, rec.positionEnd),
                        };
                        vscode.window.showTextDocument(rec.uri, showOptions);

                        break;
                    }
                }
            }, (reason: any) => {
                console.log('onrejected:', reason);
            });
        }

        progressParent.report({ increment: 99, message: "Done" });
        console.log('console Done');
        resolveParent('ResolveFindingDone');
    }

    async function handleTextEditorCommand(
        textEditor: vscode.TextEditor,
        edit: vscode.TextEditorEdit,
        args: any[],
        resolveParent: (value?: string) => void,
        rejectParent: (reason?: any) => void,
        progressParent: vscode.Progress<{ message?: string; increment?: number }>,
        tokenParent: vscode.CancellationToken
    ) {
        let textLine: vscode.TextLine = textEditor.document.lineAt(textEditor.selection.start);
        // let str: string = textEditor.document.getText(textEditor.selection);
        // vscode.window.showInformationMessage(textLine.text);

        let activeEditor: vscode.TextEditor = textEditor;
        // const text = activeEditor.document.getText();
        const text: string = textLine.text;
        const smallNumbers: vscode.DecorationOptions[] = [];
        const largeNumbers: vscode.DecorationOptions[] = [];

        // let selection = null;
        let textDocument = textEditor.document;
        let docText: string = textDocument.getText();

        // 1. Is PHP File?
        if (docText.indexOf('<?php') === 0) {
            // OK
        } else {
            // Not PHP File
            rejectParent(new Error('NotPhpFile'));
            return;
        }

        // 2. Find Namespace
        let strNamespacePrefix: string = '';
        let namespacePosition: number = docText.indexOf('namespace App\\Http\\Controllers' + strNamespacePrefix);
        // console.log("TCL: activate -> namespacePosition", namespacePosition)
        if (namespacePosition === -1) {
            // Not Found
            rejectParent(new Error('NamespaceNotFound'));
            return;
        }

        let positionNamespaceStart: vscode.Position = textDocument.positionAt(namespacePosition + 'namespace App\\Http\\Controllers'.length);
        let lineNamespace: vscode.TextLine = textDocument.lineAt(positionNamespaceStart);
        // console.log("TCL: activate -> lineNamespace", lineNamespace)

        let namespaceCommaPosition = lineNamespace.text.indexOf(';') + namespacePosition;
        // console.log("TCL: activate -> namespaceCommaPosition", namespaceCommaPosition)
        let positionNamespaceEnd: vscode.Position = textDocument.positionAt(namespaceCommaPosition);

        // Note: get string like: "\Api\Home"
        let strNameSpaceShort: string = textDocument.getText(new vscode.Range(positionNamespaceStart, positionNamespaceEnd));
        // vscode.window.showInformationMessage(strNameSpaceShort);

        // console.log("TCL: activate -> positionNamespaceStart", positionNamespaceStart)
        // console.log("TCL: activate -> positionNamespaceEnd", positionNamespaceEnd)
        // console.log("TCL: activate -> strNameSpaceShort ###>", strNameSpaceShort, "<###")

        // Note: get string like: "Api\Home"
        if (strNameSpaceShort.indexOf('\\') === 0) {
            strNameSpaceShort = strNameSpaceShort.substr(1);
        }
        // vscode.window.showInformationMessage(strNameSpaceShort);
        let strClassName = parseClassName(textDocument); // Note: "BookController"

        // Note: "Api\Home\BookController"
        let strNamespaceWithClass = strNameSpaceShort + '\\' + strClassName;
        // Remove backslash (for empty namespace)
        if (strNamespaceWithClass.indexOf('\\') === 0) {
            strNamespaceWithClass = strNamespaceWithClass.substr(1);
        }

        // Find method name recursively upward until we found the method name
        let parsedMethodName: string = '';
        let tempPositionCursor: vscode.Position = textEditor.selection.start;
        let dooLoop: boolean = true;
        while (dooLoop) {
            if (textLine.lineNumber === 1) {
                dooLoop = false;
                break;
            } else {
                parsedMethodName = parseMethodName(textLine).trim();
                if (parsedMethodName.length === 0) {
                    tempPositionCursor = tempPositionCursor.translate(-1);
                    textLine = textEditor.document.lineAt(tempPositionCursor);
                } else {
                    dooLoop = false;
                    break;
                }
            }
        }

        let strFullNamespaceWithClassWithMethod = strNamespaceWithClass + "@" + parsedMethodName;
        // vscode.window.showInformationMessage(strFullNamespaceWithClassWithMethod);

        let urisAll: vscode.Uri[] = [];
        let uris1 = await vscode.workspace.findFiles('routes/web.php', 'vendor,node_modules');
        let uris2 = await vscode.workspace.findFiles('routes/api.php', 'vendor,node_modules');
        urisAll.push(...uris1);
        urisAll.push(...uris2);
        await handleEe(urisAll, strFullNamespaceWithClassWithMethod, resolveParent, rejectParent, progressParent, tokenParent);
    }

    interface MyResult {
        uri: vscode.Uri;
        positionStart: vscode.Position;
        positionEnd: vscode.Position;
    }

    async function handleEe(
        uris: vscode.Uri[],
        strFullNamespaceWithClassWithMethod: string,
        resolveParent: (value?: string) => void,
        rejectParent: (reason?: any) => void,
        progressParent: vscode.Progress<{ message?: string; increment?: number }>,
        tokenParent: vscode.CancellationToken
    ) {
        // Note: uris length is exactly 2 (web.php and api.php)
        let arrResult: MyResult[] = [];
        for (let i = 0; i < uris.length; i++) {
            const uri = uris[i];
            let filePath: string = uri.toString();
            console.log('Scanning file:', filePath);
            // vscode.window.showInformationMessage(JSON.stringify(filePath));

            // TODO: replace with async and await...
            let textDocument: vscode.TextDocument = await vscode.workspace.openTextDocument(uri);
            // let selection = null;
            let docText: string = textDocument.getText();

            // 1. Is PHP File?
            if (docText.indexOf('<?php') === 0) {
                // OK
            } else {
                // Not PHP File
                // rejectParent(new Error('NotPhpFile'));
                continue;
            }

            // TODO: Find text again using fullEndPosition as offset...
            let tempOffset = 0;
            while (true) {
                // 2. Try to find text: example: "'Api\Home\BookController@index'"
                let fullStartPosition: number = docText.indexOf(
                    "'" + strFullNamespaceWithClassWithMethod + "'",
                    tempOffset
                );
                if (fullStartPosition === -1) {
                    // Not found
                    // rejectParent(new Error('ClassAndMethodTextNotFound'));
                    break;
                }

                let fullEndPosition: number = fullStartPosition + (("'" + strFullNamespaceWithClassWithMethod + "'").length);
                tempOffset = fullEndPosition;

                let positionStart: vscode.Position = textDocument.positionAt(fullStartPosition + 1);
                // let line: vscode.TextLine = textDocument.lineAt(positionStart.line);
                let positionEnd: vscode.Position = textDocument.positionAt(fullEndPosition - 1);

                // Note: "Api\Home\BookController@index"
                let ee = textDocument.getText(new vscode.Range(positionStart, positionEnd));
                // console.log("TCL: activate -> ee", ee);

                arrResult.push({
                    uri: textDocument.uri,
                    positionStart: positionStart,
                    positionEnd: positionEnd
                });
            }
        }
        // console.log(arrResult);

        if (arrResult.length === 1) {
            for (let i = 0; i < arrResult.length; i++) {
                const rec: MyResult = arrResult[i];

                let showOptions: vscode.TextDocumentShowOptions = {
                    viewColumn: undefined,
                    preserveFocus: false,
                    preview: true,
                    selection: new vscode.Range(rec.positionStart, rec.positionEnd),
                };
                vscode.window.showTextDocument(rec.uri, showOptions);

                break;
            }
        } else if (arrResult.length > 1) {
            let arrStrPath: string[] = [];
            for (let x = 0; x < arrResult.length; x++) {
                const rec = arrResult[x];

                let strOption = '';
                strOption += rec.uri.path;
                strOption += ' ';
                strOption += ' - Line: ';
                strOption += (rec.positionStart.line + 1).toString();

                arrStrPath.push(strOption);
            }

            vscode.window.showQuickPick(
                arrStrPath,
                {
                    placeHolder: "" + strFullNamespaceWithClassWithMethod + "",
                    ignoreFocusOut: true,
                    canPickMany: false,
                }
            ).then((value: string | undefined) => {
                for (let i = 0; i < arrResult.length; i++) {
                    const rec: MyResult = arrResult[i];

                    let strOption = '';
                    strOption += rec.uri.path;
                    strOption += ' ';
                    strOption += ' - Line: ';
                    strOption += (rec.positionStart.line + 1).toString();

                    if (value === strOption) {
                        let showOptions: vscode.TextDocumentShowOptions = {
                            viewColumn: undefined,
                            preserveFocus: false,
                            preview: true,
                            selection: new vscode.Range(rec.positionStart, rec.positionEnd),
                        };
                        vscode.window.showTextDocument(rec.uri, showOptions);

                        break;
                    }
                }
            }, (reason: any) => {
                console.log('onrejected:', reason);
            });
        } else {
            // Search for Route::resource

            strFullNamespaceWithClassWithMethod = strFullNamespaceWithClassWithMethod
                .substr(
                    0,
                    strFullNamespaceWithClassWithMethod.indexOf("@")
                );

            for (let i = 0; i < uris.length; i++) {
                const uri = uris[i];
                let filePath: string = uri.toString();
                console.log('Scanning file X:', filePath);
                // vscode.window.showInformationMessage(JSON.stringify(filePath));

                // TODO: replace with async and await...
                let textDocument: vscode.TextDocument = await vscode.workspace.openTextDocument(uri);
                // let selection = null;
                let docText: string = textDocument.getText();

                // 1. Is PHP File?
                if (docText.indexOf('<?php') === 0) {
                    // OK
                } else {
                    // Not PHP File
                    // rejectParent(new Error('NotPhpFile'));
                    continue;
                }

                // TODO: Find text again using fullEndPosition as offset...
                let tempOffset = 0;
                while (true) {
                    // 2. Try to find text: example: "'Api\Home\BookController@index'"
                    let _otherOffset: number = docText.indexOf(
                        "Route::resource",
                        tempOffset
                    );
                    if (_otherOffset === -1) {
                        tempOffset += "Route::resource".length;

                        if (tempOffset > docText.length) {
                            break;
                        }

                        continue;
                    }
                    let fullStartPosition = docText.indexOf(
                        "'" + strFullNamespaceWithClassWithMethod + "'",
                        tempOffset
                    );
                    if (fullStartPosition === -1) {
                        // Not found
                        // rejectParent(new Error('ClassAndMethodTextNotFound'));
                        break;
                    }

                    let fullEndPosition: number = fullStartPosition + (("'" + strFullNamespaceWithClassWithMethod + "'").length);
                    tempOffset = fullEndPosition;

                    let positionStart: vscode.Position = textDocument.positionAt(fullStartPosition + 1);
                    // let line: vscode.TextLine = textDocument.lineAt(positionStart.line);
                    let positionEnd: vscode.Position = textDocument.positionAt(fullEndPosition - 1);

                    // Note: "Api\Home\BookController@index"
                    let ee = textDocument.getText(new vscode.Range(positionStart, positionEnd));
                    // console.log("TCL: activate -> ee", ee);

                    let item_ = {
                        uri: textDocument.uri,
                        positionStart: positionStart,
                        positionEnd: positionEnd
                    };

                    // console.log('item_', item_);
                    arrResult.push(item_);
                }
            }
            // console.log('arrResult', arrResult);

            if (arrResult.length === 1) {
                for (let i = 0; i < arrResult.length; i++) {
                    const rec: MyResult = arrResult[i];

                    let showOptions: vscode.TextDocumentShowOptions = {
                        viewColumn: undefined,
                        preserveFocus: false,
                        preview: true,
                        selection: new vscode.Range(rec.positionStart, rec.positionEnd),
                    };
                    vscode.window.showTextDocument(rec.uri, showOptions);

                    break;
                }
            } else if (arrResult.length > 1) {
                let arrStrPath: string[] = [];
                for (let x = 0; x < arrResult.length; x++) {
                    const rec = arrResult[x];

                    let strOption = '';
                    strOption += rec.uri.path;
                    strOption += ' ';
                    strOption += ' - Line: ';
                    strOption += (rec.positionStart.line + 1).toString();

                    arrStrPath.push(strOption);
                }

                vscode.window.showQuickPick(
                    arrStrPath,
                    {
                        placeHolder: "" + strFullNamespaceWithClassWithMethod + "",
                        ignoreFocusOut: true,
                        canPickMany: false,
                    }
                ).then((value: string | undefined) => {
                    for (let i = 0; i < arrResult.length; i++) {
                        const rec: MyResult = arrResult[i];

                        let strOption = '';
                        strOption += rec.uri.path;
                        strOption += ' ';
                        strOption += ' - Line: ';
                        strOption += (rec.positionStart.line + 1).toString();

                        if (value === strOption) {
                            let showOptions: vscode.TextDocumentShowOptions = {
                                viewColumn: undefined,
                                preserveFocus: false,
                                preview: true,
                                selection: new vscode.Range(rec.positionStart, rec.positionEnd),
                            };
                            vscode.window.showTextDocument(rec.uri, showOptions);

                            break;
                        }
                    }
                }, (reason: any) => {
                    console.log('onrejected:', reason);
                });
            }
        }

        progressParent.report({ increment: 99, message: "Done" });
        console.log('console Done');
        resolveParent('ResolveFindingDone');
    }

    async function parsePhpClassAndMethod(
        str: string,
        resolveParent: (value?: string) => void, // To stop progress indicator later
        rejectParent: (reason?: any) => void, // To stop progress indicator later
        progressParent: vscode.Progress<{ message?: string; increment?: number }>,
        tokenParent: vscode.CancellationToken
    ) {
        let strFiltered: string = str.replace(/[,]/g, '')
            .trim()
            .replace(/[\']/g, '')
            .replace(/["]/g, '')
            .trim();

        // vscode.window.showInformationMessage(strFiltered);

        let strPhpNamespace: string = '';
        let strPhpMethodName: string = '';
        if (strFiltered.indexOf('@') === -1) {
            // Controller Only
            strPhpNamespace = strFiltered;
        } else {
            // Controller with Method Name
            let arrStr: string[] = strFiltered.split('@');
            strPhpNamespace = arrStr[0]; // Api\Some\Other\OneController
            strPhpMethodName = arrStr[1];
        }

        // vscode.window.showInformationMessage(strPhpNamespace);
        // vscode.window.showInformationMessage('Going to method: ' + strPhpMethodName + '()');

        let arrStrPhpNamespace: string[] = strPhpNamespace.split('\\'); // [Api,Some,Other,OneController] or [OneController]
        let strFilenamePrefix: string = arrStrPhpNamespace[arrStrPhpNamespace.length - 1]; // OneController
        // vscode.window.showInformationMessage(strFilenamePrefix);

        let arrResult: MyResult[] = [];
        let uris: vscode.Uri[] = await vscode.workspace.findFiles('app/**/' + strFilenamePrefix + '.php', 'vendor,node_modules');
        for (let i = 0; i < uris.length; i++) {
            const uri = uris[i];
            let filePath: string = uri.toString();
            console.log('Scanning file:', filePath);
            // vscode.window.showInformationMessage(JSON.stringify(filePath));

            let textDocument: vscode.TextDocument = await vscode.workspace.openTextDocument(uri);
            // let selection = null;
            let docText: string = textDocument.getText();

            // 1. Is PHP File?
            if (docText.indexOf('<?php') === 0) {
                // OK
            } else {
                // Not PHP File
                // rejectParent(new Error('NotPhpFile'));
                continue;
            }

            // 2. Find Namespace
            let strNamespacePrefix: string = '';
            let namespacePosition: number = docText.indexOf('namespace App\\Http\\Controllers' + strNamespacePrefix);
            if (namespacePosition === -1) {
                // Not Found
                // rejectParent(new Error('NamespaceNotFound'));
                continue;
            }

            // 3. Find Exact Namespace;
            // Note: In php file will look like: "namespace App\Http\Controllers\Api\Some\Other;"
            let arrNamespaceWithoutClassName = arrStrPhpNamespace.slice(0, -1); // [Api,Some,Other]
            let strExtraSeparator: string = '\\';
            if (arrStrPhpNamespace.length === 1) {
                strExtraSeparator = ''; // If only classname available
            }
            let strFullNamespace = 'namespace App\\Http\\Controllers' + strExtraSeparator + arrNamespaceWithoutClassName.join('\\') + ';';
            // vscode.window.showInformationMessage(strFullNamespace);
            let exactNamespacePosition: number = docText.indexOf(strFullNamespace);
            if (exactNamespacePosition === -1) {
                // Not Found
                // rejectParent(new Error('ExactNamespaceNotFound'));
                continue;
            }

            // 4. Find Class Name
            let classNamePosition: number = docText.indexOf('class ' + strFilenamePrefix + ' ');
            if (classNamePosition === -1) {
                // Not Found
                // rejectParent(new Error('ClassNameNotFound'));
                continue;
            }

            // 5. Find Method Name
            // To highlight the class name (Default)
            let posStart: vscode.Position = textDocument.positionAt(classNamePosition + 'class '.length);
            let posEnd: vscode.Position = textDocument.positionAt('class '.length + classNamePosition + strPhpMethodName.length);
            // To highlight the method name
            if (strPhpMethodName.length > 0) {
                let methodPosition: number = docText.indexOf(' function ' + strPhpMethodName + '(');
                // vscode.window.showInformationMessage(JSON.stringify(methodPosition));
                if (methodPosition === -1) {
                    // Method name Not Found
                    // rejectParent(new Error('MethodNameNotFound'));
                    continue;
                } else {
                    // Method name Found
                    posStart = textDocument.positionAt(methodPosition + ' function '.length);
                    posEnd = textDocument.positionAt(' function '.length + methodPosition + strPhpMethodName.length);
                }
            }

            // vscode.window.showInformationMessage(strPhpNamespace);

            arrResult.push({
                uri: textDocument.uri,
                positionStart: posStart,
                positionEnd: posStart
            });
        }

        // console.log(arrResult);
        if (arrResult.length === 1) {
            for (let i = 0; i < arrResult.length; i++) {
                const rec: MyResult = arrResult[i];

                let showOptions: vscode.TextDocumentShowOptions = {
                    viewColumn: undefined,
                    preserveFocus: false,
                    preview: true,
                    selection: new vscode.Range(rec.positionStart, rec.positionEnd),
                };
                vscode.window.showTextDocument(rec.uri, showOptions);

                break;
            }
        } else if (arrResult.length > 1) {
            let arrStrPath: string[] = [];
            for (let x = 0; x < arrResult.length; x++) {
                const rec = arrResult[x];
                arrStrPath.push(rec.uri.path);
            }

            vscode.window.showQuickPick(
                arrStrPath,
                {
                    ignoreFocusOut: true,
                    canPickMany: false,
                }
            ).then((value: string | undefined) => {
                for (let i = 0; i < arrResult.length; i++) {
                    const rec: MyResult = arrResult[i];

                    if (value === rec.uri.path) {
                        let showOptions: vscode.TextDocumentShowOptions = {
                            viewColumn: undefined,
                            preserveFocus: false,
                            preview: true,
                            selection: new vscode.Range(rec.positionStart, rec.positionEnd),
                        };
                        vscode.window.showTextDocument(rec.uri, showOptions);

                        break;
                    }
                }
            }, (reason: any) => {
                console.log('onrejected:', reason);
            });
        }

        progressParent.report({ increment: 99, message: "Done" });
        console.log('console Done');
        resolveParent('ResolveFindingDone');
    }

    function parseClassName(textDocument: vscode.TextDocument): string {
        let strDocument = textDocument.getText();
        const regEx: RegExp = /class \w+/g;
        let match;
        while (match = regEx.exec(strDocument)) {
            // Note: "class SomeThingController"
            const startPos: vscode.Position = textDocument.positionAt(match.index);
            const endPos: vscode.Position = textDocument.positionAt(match.index + match[0].length);
            // const decoration = { range: new vscode.Range(startPos, endPos), hoverMessage: 'File **' + match[0] + '**' };

            let strMatch = match[0];
            strMatch = strMatch.replace('class', '');
            strMatch = strMatch.trim();
            // vscode.window.showInformationMessage(strMatch);
            return strMatch;
        }

        return '';
    }

    function parseMethodName(textLine: vscode.TextLine): string {
        let strDocument = textLine.text;
        const regEx: RegExp = / public function \w+\(/g;
        let match;
        while (match = regEx.exec(strDocument)) {
            let strMatch = match[0]; // Note: " public function index("
            strMatch = strMatch.replace('public', '')
                .replace('function', '')
                .replace('(', '')
                .trim();

            // Note: "index"
            // vscode.window.showInformationMessage(strMatch);
            return strMatch;
        }

        return '';
    }

    // ------------------------------------------------------------------------

    console.log('Decorator sample is activated');

    let timeout: NodeJS.Timer | undefined = undefined;

    // Create a decorator type that we use to decorate small numbers
    const smallNumberDecorationType = vscode.window.createTextEditorDecorationType({
        borderWidth: '1px',
        borderStyle: 'solid',
        // overviewRulerColor: 'blue',
        overviewRulerLane: vscode.OverviewRulerLane.Right,
        light: {
            // This color will be used in light color themes
            borderColor: 'darkblue',
            borderRadius: '8px'
            // cursor: 'pointer'
        },
        dark: {
            // This color will be used in dark color themes
            borderColor: 'rgba(255, 255, 255, 0.5)',
            borderRadius: '8px'
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
        const text: string = activeEditor.document.getText();
        const smallNumbers: vscode.DecorationOptions[] = [];
        const largeNumbers: vscode.DecorationOptions[] = [];
        let match;
        const regEx: RegExp = /'([a-zA-Z\\]+)\w+Controller(@\w+)?'/g;
        while (match = regEx.exec(text)) {
            const startPos: vscode.Position = activeEditor.document.positionAt(match.index);
            const endPos: vscode.Position = activeEditor.document.positionAt(match.index + match[0].length);
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

    // Create a new status bar item that we can now manage
    mStatusBarItem = vscode.window.createStatusBarItem(
        vscode.StatusBarAlignment.Right, 100
    );
    context.subscriptions.push(mStatusBarItem);
    mStatusBarItem.hide(); // Default

    context.subscriptions.push(disposableA);
    context.subscriptions.push(disposableB);
    context.subscriptions.push(disposableC);

    context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(function () {
        updateUiStatusBar();
    }));
    context.subscriptions.push(vscode.window.onDidChangeTextEditorSelection(function () {
        updateUiStatusBar();
    }));

    updateUiStatusBar();
}

// This method is called when your extension is deactivated
export function deactivate() {
    console.log('Extension "goto-route-controller-laravel" deactivate');
}

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function updateUiStatusBar() {
    let textEditor = vscode.window.activeTextEditor;
    if (textEditor === undefined) {
        return;
    }

    let textLine: vscode.TextLine = textEditor.document.lineAt(textEditor.selection.start);
    // let str: string = textEditor.document.getText(textEditor.selection);
    // vscode.window.showInformationMessage(textLine.text);

    mStatusBarItem.hide();
    mStatusBarItem.command = '';
    mStatusBarItem.text = '';

    if (isBladeFile(textEditor)) {
        // From: .blade.php ---> Controller.php
        mStatusBarItem.command = 'extension.findBladeUsage';
        mStatusBarItem.text = 'EP-findBladeUsage';
        mStatusBarItem.tooltip = "Find blade usage";
        mStatusBarItem.show();
    } else if (isControllerFile(textEditor)) {
        // From: Controller.php ---> web.php | api.php
        mStatusBarItem.command = 'extension.openRoutesDeclarationFile';
        mStatusBarItem.text = 'EP-findRoute';
        mStatusBarItem.tooltip = "Find route";
        mStatusBarItem.show();
    } else if (isRouteFile(textEditor)) {
        // From: web.php | api.php ---> Controller.php
        mStatusBarItem.command = 'extension.openControllerClassFile';
        mStatusBarItem.text = 'EP-findController';
        mStatusBarItem.tooltip = "Find controller";
        mStatusBarItem.show();
    }
}

function isControllerFile(textEditor: vscode.TextEditor): Boolean {
    let docText = textEditor.document.getText();
    let namespacePosition: number = docText.indexOf('namespace App\\Http\\Controllers');

    if (namespacePosition === -1) {
        return false;
    }

    return true;
}

function isBladeFile(textEditor: vscode.TextEditor): Boolean {
    let strUri = textEditor.document.uri.path;
    if (strUri.indexOf('resources') === -1 || strUri.indexOf('views') === -1) {
        return false;
    }
    if ((strUri.indexOf('.blade.php') !== -1)) {
        // OK
    } else {
        return false;
    }

    let strFiltered: string = strUri.replace('.blade.php', '')
        // .trim()
        // .replace(/[\']/g, '')
        // .replace(/["]/g, '')
        .trim();
    // console.log(strFiltered);
    let indexStrResources = strFiltered.indexOf('resources');
    let strr = strFiltered.substr(indexStrResources);
    // console.log(strr);
    if (strr.indexOf('resources') === -1 || strr.indexOf('views') === -1) {
        return false;
    }
    let indexStrViews = strr.indexOf('views');
    strr = strr.substr(indexStrViews + 'views'.length + 1); // 1 = directory separator char
    // console.log(strr);

    strr = strr.trim();
    if (strr) {
        return true;
    }

    return false;
}

function isRouteFile(textEditor: vscode.TextEditor): Boolean {
    let strUri = textEditor.document.uri.path;

    if ((strUri.indexOf('web.php') !== -1) || (strUri.indexOf('api.php') !== -1)) {
        return true;
    }

    return false;
}
