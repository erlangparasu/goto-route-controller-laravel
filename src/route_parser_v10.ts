"use strict";

/// Created by: Erlang Parasu 2023.
export function fnTryParseRouteVer10(text: string) {
    // throw new Error('Function not implemented.');

    let actionOriList = text.match(new RegExp(/['][a-zA-Z0-9_]{1,}[']/g)) ?? [];
    let klassOriCssList = text.match(new RegExp(/[\\a-zA-Z0-9_]{1,}::class/g)) ?? [];
    let klassOriStrList = text.match(new RegExp(/['][\\a-zA-Z0-9_]{1,}[']/g)) ?? [];

    console.log(actionOriList);
    console.log(klassOriCssList);
    console.log(klassOriStrList);

    let actionFilteredList: string[] = [];
    let indexOfTmpAction: undefined | number = undefined;
    for (let index = 0; index < actionOriList.length; index++) {
        const element = actionOriList[index];
        if (text.indexOf('return ') != -1) {
            continue;
        }

        if (text.indexOf('middleware(') != -1) {
            let left = text.indexOf('middleware(');
            let right = text.indexOf(element, left);
            if (right != -1) {
                continue;
            }
        }

        if (text.indexOf('name(') != -1) {
            let left = text.indexOf('name(');
            let right = text.indexOf(element, left);
            if (right != -1) {
                continue;
            }
        }

        if (text.indexOf('::class') != -1) {
            let left = text.indexOf(element, indexOfTmpAction);
            let right = text.indexOf('::class');
            if (left != -1) {
                if (left <= right) {
                    indexOfTmpAction = right;
                    continue;
                }
            }
        }
        // Done "Route::put('move', [PositionController::class, 'move']);"
        // Done "Route::get('position', [PositionUnitController::class, 'getTreePosition']);"

        if (element == "'middleware'") {
            continue;
        }

        if (element == "'prefix'") {
            continue;
        }

        let _indexPosTmp: undefined | number = undefined;
        if (text.indexOf('Route::', _indexPosTmp) != -1) {
            _indexPosTmp = text.indexOf('Route::');
            if ((_indexPosTmp = text.indexOf('group(', _indexPosTmp)) != -1) {
                if ((_indexPosTmp = text.indexOf('[', _indexPosTmp)) != -1) {
                    if ((_indexPosTmp = text.indexOf("'prefix'", _indexPosTmp)) != -1) {
                        if ((_indexPosTmp = text.indexOf('=>', _indexPosTmp)) != -1) {
                            if ((_indexPosTmp = text.indexOf(element, _indexPosTmp)) != -1) {
                                if ((_indexPosTmp = text.indexOf(']', _indexPosTmp)) != -1) {
                                    if ((_indexPosTmp = text.indexOf(',', _indexPosTmp)) != -1) {
                                        continue;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        // Done "Route::group(['prefix' => 'sync'], function () {"
        // Done "Route::group(  [  'prefix'  =>  'import'  ]  ,  function  ()  {"

        actionFilteredList.push(element);
    }

    let klassFilteredList: string[] = [];
    for (let index = 0; index < klassOriCssList.length; index++) {
        const element = klassOriCssList[index];
        if (element.indexOf('::class') != -1) {
            klassFilteredList.push(element);
        }
    }

    for (let index = 0; index < klassOriStrList.length; index++) {
        const element = klassOriStrList[index];
        if (element.indexOf('\\') != -1) {
            klassFilteredList.push(element);
        }
    }

    let hasKlass = klassFilteredList.length > 0;

    let hasAction = false;

    if (null != actionFilteredList) {
        if (actionFilteredList.length > 0) {
            hasAction = true;
        }
    }

    let data = {
        d0_text: text,
        d1_has_action: hasAction,
        d2_has_klass: hasKlass,
        d3_action_list: actionFilteredList,
        d4_klass_list: klassFilteredList,
    };
    // console.log({ data });

    return [
        data,
        null,
    ];
}
