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
import * as appRouteParser from './route_parser_ver8';
import * as appUseImportParser from './use_import_parser_ver8';

const TAG = 'EP:';

let mThenableProgress;
let mIntervalId: NodeJS.Timeout;
let mResolve: (value: string | PromiseLike<string>) => void;
let mReject: (reason?: any) => void;
let mStatusBarItem: vscode.StatusBarItem;

interface MyResult {
    uri: vscode.Uri;
    positionStart: vscode.Position;
    positionEnd: vscode.Position;
}

// This method is called when your extension is activated
// your extension is activated the very first time the command is executed
/// Created by: Erlang Parasu 2023.
export function activate(context: vscode.ExtensionContext) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log(TAG, 'Extension "goto-route-controller-laravel" activate');

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with registerCommand
    // The commandId parameter must match the command field in package.json
    // let disposable0 = vscode.commands.registerCommand('enableLaravelRouteClassOpener', () => {
    // 	// The code you place here will be executed every time your command is executed
    // 	// Display a message box to the user
    // 	vscode.window.showInformationMessage('goto-route-controller-laravel activate');
    // });

    let disposableRouteToController = vscode.commands.registerTextEditorCommand('extension.openControllerClassFile', (textEditor: vscode.TextEditor, edit: vscode.TextEditorEdit, args: any[]) => {
        // Test
        // let rrr = fnRouteFilterStr("Route::post('sekolah', 'Sekolah\SekolahController@mendaftar')->name('sekolah.mendaftar');");
        // console.log('rrr', rrr);

        try {
            mReject(new Error('CancelProgress'));
        } catch (e) {
            // Do nothing.
        }

        mThenableProgress = vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'EP: Finding controller declaration'
        }, (progress: vscode.Progress<{ message?: string; increment?: number }>, token: vscode.CancellationToken) => {
            return new Promise<string>((resolve: (value: string | PromiseLike<string>) => void, reject: (reason?: any) => void) => {
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
                    vscode.window.showInformationMessage(TAG + ' Oops... This file is not inside routes directory');
                    reject(new Error('NotInsideRoutesDirectory'));
                    return;
                }
                if ((strUri.indexOf('web.php') !== -1) || (strUri.indexOf('api.php') !== -1)) {
                    // OK
                } else {
                    // This file is not web.php or api.php
                    vscode.window.showInformationMessage(TAG + ' Oops... This file is not web.php or api.php');
                    reject(new Error('NotWebPhpOrApiPhp'));
                    return;
                }
                if (textEditor.document.getText().indexOf('Route::') === -1) {
                    // No route declaration found in this file
                    vscode.window.showInformationMessage(TAG + ' Oops... No route declaration found in this file');
                    reject(new Error('NoRouteDeclarationFound'));
                    return;
                }

                let activeEditor: vscode.TextEditor = textEditor;
                // const text = activeEditor.document.getText();
                const text: string = textLine.text;
                // const smallNumbers: vscode.DecorationOptions[] = [];
                // const largeNumbers: vscode.DecorationOptions[] = [];

                let isFound = false;
                let _str_match: string = "";
                let match;
                const regEx: RegExp = /'([a-zA-Z\\]+)\w+(@\w+)?'/g;
                while (match = regEx.exec(fnRouteFilterStr(text))) {
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

                    // progress.report({ increment: 1, message: '...' });

                    _str_match = strResultMatch;
                    isFound = true;

                    break;
                }

                /// BEGIN Parse.
                let temp_location_summ = {
                    found: false,
                    summ_klass_parts: [""],
                    summ_klass_name: "",
                    summ_action: "",
                    use: {},
                    route: {},
                };
                try {
                    let [parsed_route, error] = appRouteParser.fnTryParseRouteVer8(text);
                    console.log('route_parser=',);
                    if (null != parsed_route) {
                        let [results, err2] = appUseImportParser.fnTryParseUseImportVer8(
                            textEditor.document.getText()
                        );
                        console.log('use_import_parser=',);
                        if (null != results) {
                            for (let index = 0; index < results.length; index++) {
                                const parsed_use = results[index];

                                if (parsed_route instanceof Error) {
                                    continue;
                                }
                                if (parsed_use instanceof Error) {
                                    continue;
                                }

                                if (null == parsed_route.use_class_name) {
                                    continue;
                                }
                                if (null == parsed_use.useable_class_name) {
                                    continue;
                                }

                                if (parsed_route.use_class_name == parsed_use.useable_class_name) {
                                    temp_location_summ.found = true;
                                    temp_location_summ.use = parsed_use;
                                    temp_location_summ.route = parsed_route;
                                    temp_location_summ.summ_klass_parts = parsed_use.class_parts;
                                    temp_location_summ.summ_klass_name = parsed_use.useable_class_name;
                                    temp_location_summ.summ_action = parsed_route.action;
                                    break;
                                }
                            }
                        }
                    }
                } catch (error) {
                    console.error('parsing_error=', { error });
                }

                console.log({ temp_location_summ: temp_location_summ });
                /// END Parse.

                /// BEGIN Find controller file based on temp_location_summ.
                try {
                    fnFindAndOpenControllerFile(
                        temp_location_summ,
                        progress,
                        token,
                    ).then((arrResult) => {
                        // console.log('fnFindAndOpenControllerFile:', arrResult);
                        // let arrResult: MyResult[] = [];
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
                        }
                        else if (arrResult.length > 1) {
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
                                console.log('fnFindAndOpenControllerFile:', 'onRejected:', reason);
                            });
                        }

                        progress.report({ increment: 100 });
                        if (arrResult.length > 0) {
                            console.log('fnFindAndOpenControllerFile:', "erlangp: Hore! Found using Method3");

                            resolve('ResolveFindingDone');
                            Promise.resolve(arrResult);
                        }
                        else {
                            progress.report({ message: 'Declaration not found. [1]' });
                            setTimeout(function () {
                                progress.report({ increment: 100 });
                                resolve('ResolveFindingDone');
                            }, 3000);
                        }

                        console.log('fnFindAndOpenControllerFile:', 'done');
                    }).catch((reason: any) => {
                        console.error('fnFindAndOpenControllerFile:', { reason });
                        fnOtherWay();
                    }).finally(() => {
                        //
                    });
                } catch (error) {
                    console.error('fnFindAndOpenControllerFile:', { error });
                    fnOtherWay();
                }
                /// END Find.

                function fnOtherWay() {
                    let _pos: number = text.lastIndexOf("@");
                    let _action: string = text.substring(_pos); // "@getUser'..."
                    let _pos_action_end = _action.indexOf("'");
                    _action = _action.substring(0, _pos_action_end);
                    _action = _action.replace("@", "").replace("'", ""); // "getUser"
                    console.log('erlangp: hore', ">>>" + _action + "<<<");

                    let _class: string = text.substring(0, _pos);
                    let _pos_class_end: number = _pos;
                    let _pos_class_start: number = _class.lastIndexOf("'");
                    _class = _class.substring(_pos_class_start, _pos_class_end);
                    _class = _class.replace("@", "").replace("'", "");
                    console.log('erlangp: hore', ">>>" + _class + "<<<");

                    if (isFound) {
                        fnHandleRouteToController(_str_match, resolve, reject, progress, token).then((myCode: string) => {
                            console.log('erlangp: myCode: ', myCode);

                            if (myCode === "OK") {
                                console.log("erlangp: Hore! Found using Method1");

                                progress.report({ increment: 100 });
                                resolve('ResolveFindingDone');
                            } else {
                                // progressParent.report({ message: 'Declaration not found.' });
                                // setTimeout(function () {
                                //     progressParent.report({ increment: 100 });
                                //     resolveParent('ResolveFindingDone');
                                // }, 3000);

                                progress.report({ message: 'Please wait...' });

                                fnRunMethod2(_class, _action, progress, token, resolve);
                            }
                        }).catch((reason: any) => {
                            try {
                                mReject(reason);
                            } catch (e) {
                                // Do nothing.
                            }
                        }).finally(() => {
                            //
                        });
                    } else {
                        // vscode.window.showInformationMessage(TAG + ' Oops... Current line does not contains controller class name');
                        // reject(new Error('NoMatch'));

                        // let progressParent = progress;
                        // progressParent.report({ increment: 100 });
                        // progressParent.report({ message: 'Oops...' });

                        console.log('erlangp: regex not match', '');

                        fnRunMethod2(_class, _action, progress, token, resolve);
                    }
                };
            });
        });

        mThenableProgress.then((value: string) => {
            console.log(TAG, 'progress onFulfilled', value);
        }, (reason: any) => {
            console.log(TAG, 'progress onRejected', reason);
        });
    });

    let disposableControllerToRoute = vscode.commands.registerTextEditorCommand('extension.openRoutesDeclarationFile', (textEditor: vscode.TextEditor, edit: vscode.TextEditorEdit, args: any[]) => {
        try {
            mReject(new Error('CancelProgress'));
        } catch (e) {
            // Do nothing.
        }

        let progressOptions = {
            location: vscode.ProgressLocation.Notification,
            title: 'EP: Finding route declaration'
        };

        mThenableProgress = vscode.window.withProgress(
            progressOptions,
            (progress: vscode.Progress<{ message?: string; increment?: number }>, token: vscode.CancellationToken) => {
                return new Promise<string>((resolve: (value: string | PromiseLike<string>) => void, reject: (reason?: any) => void) => {
                    try {
                        mReject(new Error('CancelProgress'));
                    } catch (e) {
                        // Do nothing.
                    }

                    mResolve = resolve;
                    mReject = reject;

                    // progress.report({ increment: 1, message: '...' });
                    fnHandleControllerToRouteVer1(textEditor, edit, args, resolve, reject, progress, token)
                        .then(() => {
                            //
                        })
                        .catch((reason: any) => {
                            fnHandleControllerToRouteVer8(textEditor, edit, args, resolve, reject, progress, token)
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
                        })
                        .finally(() => {
                            //
                        });
                });
            }
        );

        mThenableProgress.then((value: string) => {
            console.log(TAG, 'progress onFulfilled', value);
        }, (reason: any) => {
            console.log(TAG, 'progress onRejected', reason);
        });
    });

    // From blade file, open controller file
    let disposableFindBladeUsage = vscode.commands.registerTextEditorCommand('extension.findBladeUsage', (textEditor: vscode.TextEditor, edit: vscode.TextEditorEdit, args: any[]) => {
        try {
            mReject(new Error('CancelProgress'));
        } catch (e) {
            // Do nothing.
        }

        mThenableProgress = vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'EP: Finding blade usage'
        }, (progress: vscode.Progress<{ message?: string; increment?: number }>, token: vscode.CancellationToken) => {
            return new Promise<string>((resolve: (value: string | PromiseLike<string>) => void, reject: (reason?: any) => void) => {
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
                    // This file is not inside 'views' directory
                    vscode.window.showInformationMessage(TAG + ' Oops... This file is not inside "views" directory');
                    reject(new Error('NotInsideViewsDirectory'));
                    return;
                }
                if ((strUri.indexOf('.blade.php') !== -1)) {
                    // OK
                } else {
                    // Unsuported file
                    vscode.window.showInformationMessage(TAG + ' Oops... This file is not a blade file');
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
                let strr = strFiltered.substring(indexStrResources);
                // console.log(strr);
                if (strr.indexOf('resources') === -1 || strr.indexOf('views') === -1) {
                    vscode.window.showInformationMessage(TAG + ' Oops... This file is not inside "views" directory (2)');
                    reject(new Error('NotInsideViewsDirectory2'));
                    return;
                }
                let indexStrViews = strr.indexOf('views');
                strr = strr.substring(indexStrViews + 'views'.length + 1); // 1 = directory separator char
                // console.log(strr);
                strr = strr.trim();
                if (strr) {
                    // OK
                } else {
                    vscode.window.showInformationMessage(TAG + ' Oops... No usage found');
                    reject(new Error('NoUsageFound'));
                    return;
                }

                // console.log('Horray! File is valid.');
                strr = strr.replace(/[\\]/g, '.')
                    .replace(/[/]/g, '.')
                    .trim();
                // console.log(strr); // Example: front.single
                let strToFind: string = "view('" + strr + "'"; // TODO: support double quotes

                fnHandleFindBladeUsage(strToFind, textEditor, edit, args, resolve, reject, progress, token)
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
            console.log(TAG, 'progress onFulfilled', value);
        }, (reason: any) => {
            console.log(TAG, 'progress onRejected', reason);
        });
    });

    // ------------------------------------------------------------------------

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

    function fnUpdateDecorations() {
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

    function fnTriggerUpdateDecorations() {
        if (timeout) {
            clearTimeout(timeout);
            timeout = undefined;
        }
        timeout = setTimeout(fnUpdateDecorations, 500);
    }

    if (activeEditor) {
        // fnTriggerUpdateDecorations();
    }

    vscode.window.onDidChangeActiveTextEditor(editor => {
        activeEditor = editor;
        if (editor) {
            // fnTriggerUpdateDecorations();
        }
    }, null, context.subscriptions);

    vscode.workspace.onDidChangeTextDocument(event => {
        if (activeEditor && event.document === activeEditor.document) {
            // fnTriggerUpdateDecorations();
        }
    }, null, context.subscriptions);

    // ------------------------------------------------------------------------

    // Create a new status bar item that we can now manage
    mStatusBarItem = vscode.window.createStatusBarItem(
        vscode.StatusBarAlignment.Right, 100
    );
    context.subscriptions.push(mStatusBarItem);
    mStatusBarItem.hide(); // Default

    context.subscriptions.push(disposableRouteToController);
    context.subscriptions.push(disposableControllerToRoute);
    context.subscriptions.push(disposableFindBladeUsage);

    context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(function () {
        fnUpdateUiStatusBar();
    }));
    context.subscriptions.push(vscode.window.onDidChangeTextEditorSelection(function () {
        fnUpdateUiStatusBar();
    }));

    fnUpdateUiStatusBar();
}

function fnRunMethod2(_class: string, _action: string, progress: vscode.Progress<{ message?: string | undefined; increment?: number | undefined; }>, token: vscode.CancellationToken, resolve: (value: string | PromiseLike<string>) => void) {
    fnHandleRouteToControllerV2(_class, _action, progress, token).then((arrResult) => {
        // console.log(arrResult);
        // let arrResult: MyResult[] = [];
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
        }
        else if (arrResult.length > 1) {
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
                console.log(TAG, 'onRejected:', reason);
            });
        }

        progress.report({ increment: 100 });
        if (arrResult.length > 0) {
            console.log("erlangp: Hore! Found using Method2");

            resolve('ResolveFindingDone');
            Promise.resolve(arrResult);
        }
        else {
            progress.report({ message: 'Declaration not found. [1]' });
            setTimeout(function () {
                progress.report({ increment: 100 });
                resolve('ResolveFindingDone');
            }, 3000);
        }

        console.log(TAG, 'fnHandleRouteToController: done');
    }).catch((reason: any) => {
        try {
            mReject(reason);
        }
        catch (e) {
            // Do nothing.
        }
    }).finally(() => {
        //
    });
}

// This method is called when your extension is deactivated
export function deactivate() {
    console.log(TAG, 'Extension "goto-route-controller-laravel" deactivate');
}

function fnSleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function fnUpdateUiStatusBar() {
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

    if (fnIsBladeFile(textEditor)) {
        // From: .blade.php ---> Controller.php
        mStatusBarItem.command = 'extension.findBladeUsage';
        mStatusBarItem.text = 'EP-findBladeUsage';
        mStatusBarItem.tooltip = 'Find blade usage';
        mStatusBarItem.show();
    } else if (fnIsControllerFile(textEditor)) {
        // From: Controller.php ---> web.php | api.php
        mStatusBarItem.command = 'extension.openRoutesDeclarationFile';
        mStatusBarItem.text = 'EP-findRoute';
        mStatusBarItem.tooltip = 'Find route';
        mStatusBarItem.show();
    } else if (fnIsRouteFile(textEditor)) {
        // From: web.php | api.php ---> Controller.php
        mStatusBarItem.command = 'extension.openControllerClassFile';
        mStatusBarItem.text = 'EP-findController';
        mStatusBarItem.tooltip = 'Find controller';
        mStatusBarItem.show();
    }
}

function fnIsControllerFile(textEditor: vscode.TextEditor): Boolean {
    let docText = textEditor.document.getText();
    let namespacePosition: number = docText.indexOf('namespace App\\Http\\Controllers');

    if (namespacePosition === -1) {
        return false;
    }

    return true;
}

function fnIsBladeFile(textEditor: vscode.TextEditor): Boolean {
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
    let strr = strFiltered.substring(indexStrResources);
    // console.log(strr);
    if (strr.indexOf('resources') === -1 || strr.indexOf('views') === -1) {
        return false;
    }
    let indexStrViews = strr.indexOf('views');
    strr = strr.substring(indexStrViews + 'views'.length + 1); // 1 = directory separator char
    // console.log(strr);

    strr = strr.trim();
    if (strr) {
        return true;
    }

    return false;
}

function fnIsRouteFile(textEditor: vscode.TextEditor): Boolean {
    let strUri = textEditor.document.uri.path;

    if ((strUri.indexOf('web.php') !== -1) || (strUri.indexOf('api.php') !== -1)) {
        return true;
    }

    return false;
}

async function fnHandleFindBladeUsage(
    strToFind: string,
    textEditor: vscode.TextEditor,
    edit: vscode.TextEditorEdit,
    args: any[],
    resolveParent: (value: string | PromiseLike<string>) => void,
    rejectParent: (reason?: any) => void,
    progressParent: vscode.Progress<{ message?: string; increment?: number }>,
    tokenParent: vscode.CancellationToken
) {
    let urisAll: vscode.Uri[] = [];
    let uris1 = await vscode.workspace.findFiles('**/*.php', '{bootstrap,config,database,node_modules,storage,vendor}/**');
    urisAll.push(...uris1);
    await fnHandleUrisFindBladeUsage(urisAll, strToFind, resolveParent, rejectParent, progressParent, tokenParent);
}

async function fnHandleUrisFindBladeUsage(
    uris: vscode.Uri[],
    strToFind: string,
    resolveParent: (value: string | PromiseLike<string>) => void,
    rejectParent: (reason?: any) => void,
    progressParent: vscode.Progress<{ message?: string; increment?: number }>,
    tokenParent: vscode.CancellationToken
) {
    // Note: uris length is exactly 2 (web.php and api.php)
    let arrResult: MyResult[] = [];
    for (let i = 0; i < uris.length; i++) {
        fnUpdateProgressMessage(i, uris, progressParent);

        const uri = uris[i];
        let filePath: string = uri.toString();
        console.log(TAG, 'Scanning file:', filePath);
        // vscode.window.showInformationMessage(JSON.stringify(filePath));

        // TODO: replace with async and await...
        let textDocument: vscode.TextDocument = await vscode.workspace.openTextDocument(uri);
        // let selection = null;
        let docText: string = textDocument.getText();

        // 1. Is PHP File?
        if (docText.indexOf('<?') !== -1) {
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

        // vscode.window.showInformationMessage('Blade usage found: Choose one ^');

        vscode.window.showQuickPick(
            arrStrPath,
            {
                placeHolder: 'Multiple Blade usage found: ' + strToFind + ' ...',
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
            console.log(TAG, 'onRejected:', reason);
        });
    }

    progressParent.report({ increment: 100 });
    if (arrResult.length > 0) {
        resolveParent('ResolveFindingDone');
    } else {
        progressParent.report({ message: 'Declaration not found. [2]' });

        setTimeout(function () {
            progressParent.report({ increment: 100 });
            resolveParent('ResolveFindingDone');
        }, 3000);
    }

    console.log(TAG, 'fnHandleUrisFindBladeUsage: done');
}

async function fnHandleControllerToRouteVer1(
    textEditor: vscode.TextEditor,
    edit: vscode.TextEditorEdit,
    args: any[],
    resolveParent: (value: string | PromiseLike<string>) => void,
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
    if (docText.indexOf('<?') !== -1) {
        // OK
    } else {
        // Not PHP File
        rejectParent(new Error('NotPhpFile'));
        return Promise.reject(new Error(''));
    }

    // 2. Find Namespace
    let strNamespacePrefix: string = '';
    let namespacePosition: number = docText.indexOf('namespace App\\Http\\Controllers' + strNamespacePrefix + '');
    // console.log("TCL: activate -> namespacePosition", namespacePosition)
    if (namespacePosition === -1) {
        // Not Found
        rejectParent(new Error('NamespaceNotFound'));
        return Promise.reject(new Error(''));
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
    // console.log("TCL: activate -> strNameSpaceShort ###>", strNameSpaceShort, '<###')

    // Note: get string like: "Api\Home"
    if (strNameSpaceShort.indexOf('\\') === 0) {
        strNameSpaceShort = strNameSpaceShort.substring(1);
    }
    // vscode.window.showInformationMessage(strNameSpaceShort);
    let strClassName = fnParseClassName(textDocument); // Note: "BookController"

    // Note: "Api\Home\BookController"
    let strNamespaceWithClass = strNameSpaceShort + '\\' + strClassName;
    // Remove backslash (for empty namespace)
    if (strNamespaceWithClass.indexOf('\\') === 0) {
        strNamespaceWithClass = strNamespaceWithClass.substring(1);
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
            parsedMethodName = fnParseMethodName(textLine).trim();
            if (parsedMethodName.length === 0) {
                tempPositionCursor = tempPositionCursor.translate(-1);
                textLine = textEditor.document.lineAt(tempPositionCursor);
            } else {
                dooLoop = false;
                break;
            }
        }
    }

    let strFullNamespaceWithClassWithMethod = strNamespaceWithClass + '@' + parsedMethodName;
    // vscode.window.showInformationMessage(strFullNamespaceWithClassWithMethod);
    console.log(1, { strFullNamespaceWithClassWithMethod });

    let urisAll: vscode.Uri[] = [];
    let uris1 = await vscode.workspace.findFiles('routes/web.php', '{bootstrap,config,database,node_modules,storage,vendor}/**');
    let uris2 = await vscode.workspace.findFiles('routes/api.php', '{bootstrap,config,database,node_modules,storage,vendor}/**');
    urisAll.push(...uris1);
    urisAll.push(...uris2);
    let result = await fnHandleUrisControllerToRoute(urisAll, strFullNamespaceWithClassWithMethod, resolveParent, rejectParent, progressParent, tokenParent);
    // TODO: ? 1.
}

async function fnHandleControllerToRouteVer8(
    textEditor: vscode.TextEditor,
    edit: vscode.TextEditorEdit,
    args: any[],
    resolveParent: (value: string | PromiseLike<string>) => void,
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
    if (docText.indexOf('<?') !== -1) {
        // OK
    } else {
        // Not PHP File
        rejectParent(new Error('NotPhpFile'));
        return Promise.reject(new Error('local.NotPhpFile'));
    }

    // 2. Find Namespace
    let strNamespacePrefix: string = '';
    let namespacePosition: number = docText.indexOf('namespace App\\Http\\Controllers' + strNamespacePrefix + '');
    // console.log("TCL: activate -> namespacePosition", namespacePosition)
    if (namespacePosition === -1) {
        // Not Found
        rejectParent(new Error('NamespaceNotFound'));
        return Promise.reject(new Error('local.NamespaceNotFound'));
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
    // console.log("TCL: activate -> strNameSpaceShort ###>", strNameSpaceShort, '<###')

    // Note: get string like: "Api\Home"
    if (strNameSpaceShort.indexOf('\\') === 0) {
        strNameSpaceShort = strNameSpaceShort.substring(1);
    }
    // vscode.window.showInformationMessage(strNameSpaceShort);
    let strClassName = fnParseClassName(textDocument); // Note: "BookController"

    // Note: "Api\Home\BookController"
    let strNamespaceWithClass = strNameSpaceShort + '\\' + strClassName;
    // Remove backslash (for empty namespace)
    if (strNamespaceWithClass.indexOf('\\') === 0) {
        strNamespaceWithClass = strNamespaceWithClass.substring(1);
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
            parsedMethodName = fnParseMethodName(textLine).trim();
            if (parsedMethodName.length === 0) {
                tempPositionCursor = tempPositionCursor.translate(-1);
                textLine = textEditor.document.lineAt(tempPositionCursor);
            } else {
                dooLoop = false;
                break;
            }
        }
    }

    let strFullNamespaceWithClassWithMethod = strNamespaceWithClass + '@' + parsedMethodName;
    // vscode.window.showInformationMessage(strFullNamespaceWithClassWithMethod);

    console.log(8, { strFullNamespaceWithClassWithMethod });

    let urisAll: vscode.Uri[] = [];
    let uris1 = await vscode.workspace.findFiles('routes/web.php', '{bootstrap,config,database,node_modules,storage,vendor}/**');
    let uris2 = await vscode.workspace.findFiles('routes/api.php', '{bootstrap,config,database,node_modules,storage,vendor}/**');
    urisAll.push(...uris1);
    urisAll.push(...uris2);
    let result = await fnHandleUrisControllerToRoute(urisAll, strFullNamespaceWithClassWithMethod, resolveParent, rejectParent, progressParent, tokenParent);
    // TODO: ? 8.
}

async function fnHandleUrisControllerToRoute(
    uris: vscode.Uri[],
    strFullNamespaceWithClassWithMethod: string,
    resolveParent: (value: string | PromiseLike<string>) => void,
    rejectParent: (reason?: any) => void,
    progressParent: vscode.Progress<{ message?: string; increment?: number }>,
    tokenParent: vscode.CancellationToken
) {
    // Note: uris length is exactly 2 (web.php and api.php)
    let arrResult: MyResult[] = [];
    for (let i = 0; i < uris.length; i++) {
        fnUpdateProgressMessage(i, uris, progressParent);

        const uri = uris[i];
        let filePath: string = uri.toString();
        console.log(TAG, 'Scanning file:', filePath);
        // vscode.window.showInformationMessage(JSON.stringify(filePath));

        // TODO: replace with async and await...
        let textDocument: vscode.TextDocument = await vscode.workspace.openTextDocument(uri);
        // let selection = null;
        let docText: string = textDocument.getText();

        // 1. Is PHP File?
        if (docText.indexOf('<?') !== -1) {
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
                placeHolder: '' + strFullNamespaceWithClassWithMethod + '',
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
            console.log(TAG, 'onRejected:', reason);
        });
    } else {
        // Search for Route::resource

        strFullNamespaceWithClassWithMethod = strFullNamespaceWithClassWithMethod
            .substring(
                0,
                strFullNamespaceWithClassWithMethod.indexOf('@')
            );

        for (let i = 0; i < uris.length; i++) {
            const uri = uris[i];
            let filePath: string = uri.toString();
            console.log(TAG, 'Scanning file (2):', filePath);
            // vscode.window.showInformationMessage(JSON.stringify(filePath));

            // TODO: replace with async and await...
            let textDocument: vscode.TextDocument = await vscode.workspace.openTextDocument(uri);
            // let selection = null;
            let docText: string = textDocument.getText();

            // 1. Is PHP File?
            if (docText.indexOf('<?') !== -1) {
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
                    'Route::resource',
                    tempOffset
                );
                if (_otherOffset === -1) {
                    tempOffset += 'Route::resource'.length;

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
                    placeHolder: '' + strFullNamespaceWithClassWithMethod + '',
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
                console.log(TAG, 'onRejected:', reason);
            });
        }
    }

    progressParent.report({ increment: 100 });
    if (arrResult.length > 0) {
        resolveParent('ResolveFindingDone');
        return Promise.resolve('local.ResolveFindingDone');
    } else {
        progressParent.report({ message: 'Declaration not found. [3]' });

        setTimeout(function () {
            progressParent.report({ increment: 100 });
            resolveParent('ResolveFindingDone');
        }, 3000);

        return Promise.reject(new Error('local.DeclarationNotFound. [3]'));
    }

    console.log(TAG, 'fnHandleUrisControllerToRoute: done');
}

async function fnHandleRouteToControllerV2(
    _class: string,
    _action: string,
    progressParent: vscode.Progress<{ message?: string; increment?: number }>,
    tokenParent: vscode.CancellationToken
): Promise<MyResult[]> {
    let strPhpNamespace: string = _class;
    let strPhpMethodName: string = _action;

    let arrStrPhpNamespace: string[] = strPhpNamespace.split('\\'); // [Api,Some,Other,OneController] or [OneController]
    let strFilenamePrefix: string = arrStrPhpNamespace[arrStrPhpNamespace.length - 1]; // OneController
    // vscode.window.showInformationMessage(strFilenamePrefix);

    let errorList: string[] = [];
    let arrResult: MyResult[] = [];
    let uris: vscode.Uri[] = await vscode.workspace.findFiles('**/' + strFilenamePrefix + '.php', '{bootstrap,config,database,node_modules,storage,vendor}/**');
    for (let i = 0; i < uris.length; i++) {
        fnUpdateProgressMessage(i, uris, progressParent);

        const uri = uris[i];
        let filePath: string = uri.toString();
        console.log(TAG, 'Scanning file:', filePath);
        // vscode.window.showInformationMessage(JSON.stringify(filePath));

        let textDocument: vscode.TextDocument = await vscode.workspace.openTextDocument(uri);
        // let selection = null;
        let docText: string = textDocument.getText();

        // 1. Is PHP File?
        if (docText.indexOf('<?') !== -1) {
            // OK
        } else {
            // Not PHP File
            // rejectParent(new Error('NotPhpFile'));
            errorList.push('NotPhpFile');
            continue;
        }

        // 2. Find Namespace
        let strNamespacePrefix: string = '';
        let namespacePosition: number = docText.indexOf('namespace App\\Http\\Controllers' + strNamespacePrefix + '');
        if (namespacePosition === -1) {
            // Not Found
            // rejectParent(new Error('NamespaceNotFound'));
            errorList.push('NamespaceNotFound');
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
        let exactNamespacePosition: number = docText.indexOf('' + strFullNamespace + '');
        if (exactNamespacePosition === -1) {
            // Not Found
            // rejectParent(new Error('ExactNamespaceNotFound'));
            errorList.push('ExactNamespaceNotFound');
            continue;
        }

        // 4. Find Class Name
        let classNamePosition: number = docText.indexOf('class ' + strFilenamePrefix + '');
        if (classNamePosition === -1) {
            // Not Found
            // rejectParent(new Error('ClassNameNotFound'));
            errorList.push('ClassNameNotFound');
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
                errorList.push('MethodNameNotFound');
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

    // if (errorList.length > 0) {
    //     return Promise.reject(errorList[0]);
    // }

    return Promise.resolve(arrResult);
}

async function fnHandleRouteToController(
    str: string,
    resolveParent: (value: string | PromiseLike<string>) => void, // To stop progress indicator later
    rejectParent: (reason?: any) => void, // To stop progress indicator later
    progressParent: vscode.Progress<{ message?: string; increment?: number }>,
    tokenParent: vscode.CancellationToken
): Promise<string> {
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
    let uris: vscode.Uri[] = await vscode.workspace.findFiles('**/' + strFilenamePrefix + '.php', '{bootstrap,config,database,node_modules,storage,vendor}/**');
    for (let i = 0; i < uris.length; i++) {
        fnUpdateProgressMessage(i, uris, progressParent);

        const uri = uris[i];
        let filePath: string = uri.toString();
        console.log(TAG, 'Scanning file:', filePath);
        // vscode.window.showInformationMessage(JSON.stringify(filePath));

        let textDocument: vscode.TextDocument = await vscode.workspace.openTextDocument(uri);
        // let selection = null;
        let docText: string = textDocument.getText();

        // 1. Is PHP File?
        if (docText.indexOf('<?') !== -1) {
            // OK
        } else {
            // Not PHP File
            // rejectParent(new Error('NotPhpFile'));
            continue;
        }

        // 2. Find Namespace
        let strNamespacePrefix: string = '';
        let namespacePosition: number = docText.indexOf('namespace App\\Http\\Controllers' + strNamespacePrefix + '');
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
        let exactNamespacePosition: number = docText.indexOf('' + strFullNamespace + '');
        if (exactNamespacePosition === -1) {
            // Not Found
            // rejectParent(new Error('ExactNamespaceNotFound'));
            continue;
        }

        // 4. Find Class Name
        let classNamePosition: number = docText.indexOf('class ' + strFilenamePrefix + '');
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
            console.log(TAG, 'onRejected:', reason);
        });
    }

    if (arrResult.length > 0) {
        return Promise.resolve("OK");
    }

    return Promise.resolve("RunMethod2");
}

function fnUpdateProgressMessage(i: number, uris: vscode.Uri[], progressParent: vscode.Progress<{ message?: string | undefined; increment?: number | undefined; }>) {
    let ttt = uris.length / 100;
    if ((i + 1) % 5 === 0) {
        progressParent.report({ message: '' + (i + 1) + '/' + uris.length + ' files scanned' });
    }
}

function fnParseClassName(textDocument: vscode.TextDocument): string {
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

function fnParseMethodName(textLine: vscode.TextLine): string {
    let strDocument = textLine.text;
    const regEx: RegExp = / function \w+\(/g;
    let match;
    while (match = regEx.exec(strDocument)) {
        let strMatch = match[0]; // Note: " function index("
        strMatch = strMatch.replace('function', '')
            .replace('(', '')
            .trim();

        // Note: "index"
        // vscode.window.showInformationMessage(strMatch);
        return strMatch;
    }

    return '';
}


// TODO: ? Parse routes format:

// 1
// Route::get('/user', [UserController::class, 'index']);

// 2
// Route::get(
//     '/user/profile',
//     [UserProfileController::class, 'show']
// )->name('profile');

// 3
// Route::controller(OrderController::class)->group(function () {
//     Route::get('/orders/{id}', 'show');
//     Route::post('/orders', 'store');
// });

// 4
// Route::get('/users/{user}', [UserController::class, 'show']);

// 5
// Route::get('/locations/{location:slug}', [LocationsController::class, 'show'])
//         ->name('locations.view')
//         ->missing(function (Request $request) {
//             return Redirect::route('locations.index');
//         });


function fnRouteFilterStr(strInput: string): string {
    let offset = strInput.indexOf('Route::', 0);
    if (offset === -1) {
        return '';
    }

    offset = strInput.indexOf('(', offset);
    if (offset === -1) {
        return '';
    }

    offset = strInput.indexOf("'", offset);
    if (offset === -1) {
        return '';
    }

    offset = strInput.indexOf("'", offset);
    if (offset === -1) {
        return '';
    }

    offset = strInput.indexOf(',', offset);
    if (offset === -1) {
        return '';
    }

    return strInput.substring(offset);
}

function fnRgbToHex(rgb: number): string {
    let hex = Number(rgb).toString(16);
    if (hex.length < 2) {
        hex = "0" + hex;
    }
    return hex;
};

function fnFullColorHex(r: number, g: number, b: number) {
    let red = fnRgbToHex(r);
    let green = fnRgbToHex(g);
    let blue = fnRgbToHex(b);
    return red + green + blue;
};

function fnFullColorHexWithHash(r: number, g: number, b: number) {
    return "#" + fnFullColorHex(r, g, b);
};

async function fnFindAndOpenControllerFile(
    summ: any,
    progressParent: vscode.Progress<{ message?: string; increment?: number }>,
    tokenParent: vscode.CancellationToken
): Promise<MyResult[]> {
    // vscode.window.showInformationMessage(strFilenamePrefix);

    /// Structure
    // let summ = {
    //     found: false,
    //     summ_klass_parts: [""],
    //     summ_klass_name: "",
    //     summ_action: "",
    //     use: {},
    //     route: {},
    // };

    let strPhpMethodName = summ.summ_action;

    let errorList: string[] = [];
    let arrResult: MyResult[] = [];
    let uris: vscode.Uri[] = await vscode.workspace.findFiles('**/' + summ.summ_klass_name + '.php', '{bootstrap,config,database,node_modules,storage,vendor}/**');
    for (let i = 0; i < uris.length; i++) {
        fnUpdateProgressMessage(i, uris, progressParent);

        const uri = uris[i];
        let filePath: string = uri.toString();
        console.log(TAG, 'Scanning file:', filePath);
        // vscode.window.showInformationMessage(JSON.stringify(filePath));

        let textDocument: vscode.TextDocument = await vscode.workspace.openTextDocument(uri);
        // let selection = null;
        let docText: string = textDocument.getText();

        // 1. Is PHP File?
        if (docText.indexOf('<?') !== -1) {
            // OK
        } else {
            // Not PHP File
            // rejectParent(new Error('NotPhpFile'));
            errorList.push('NotPhpFile');
            continue;
        }

        // 2. Find Namespace
        let strNamespacePrefix: string = '';
        let namespacePosition: number = docText.indexOf('namespace App\\Http\\Controllers' + strNamespacePrefix + '');
        if (namespacePosition === -1) {
            // Not Found
            // rejectParent(new Error('NamespaceNotFound'));
            errorList.push('NamespaceNotFound');
            continue;
        }

        // 3. Find Exact Namespace;
        // Note: In php file will look like: "namespace App\Http\Controllers\Api\Some\Other;"
        let arrNamespaceWithoutClassName = summ.summ_klass_parts.slice(0, -1); // [App,Api,Some,Other]
        let strExtraSeparator: string = '\\';
        if (summ.summ_klass_parts.length === 1) {
            strExtraSeparator = ''; // If only classname available
        }
        if (summ.summ_klass_parts[0] == 'App') {
            strExtraSeparator = ''; // If fully path
        }
        let strFullNamespace = 'namespace ' + strExtraSeparator + arrNamespaceWithoutClassName.join('\\') + ';';
        // vscode.window.showInformationMessage(strFullNamespace);
        let exactNamespacePosition: number = docText.indexOf('' + strFullNamespace + '');
        if (exactNamespacePosition === -1) {
            // Not Found
            // rejectParent(new Error('ExactNamespaceNotFound'));
            errorList.push('ExactNamespaceNotFound');
            continue;
        }

        // 4. Find Class Name
        let classNamePosition: number = docText.indexOf('class ' + summ.summ_klass_name + '');
        if (classNamePosition === -1) {
            // Not Found
            // rejectParent(new Error('ClassNameNotFound'));
            errorList.push('ClassNameNotFound');
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
                errorList.push('MethodNameNotFound');
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

    // if (errorList.length > 0) {
    //     return Promise.reject(errorList[0]);
    // }

    return Promise.resolve(arrResult);
}
