"use strict";

/// Created by: Erlang Parasu 2023.

import { fnTryParseRouteVer8 } from "../route_parser_v8";
import { kInputTexts } from "./data/sample_input_texts_for_test";

function test1() {
    let input_line = "Route::get('orders/index', [App\\Http\\Controllers\\OrderController::class,'index'])->name('orders.index');"
    let [data, error] = fnTryParseRouteVer8(input_line);
    console.log('test1=', { data }, { error });
}

function test2() {
    let input_line = "Route::get('/user', [UserController::class, 'index']);"
    let [data, error] = fnTryParseRouteVer8(input_line);
    console.log('test2=', { data }, { error });
}

function test3() {
    let input_line = "Route::get(  '/user'  ,  [  UserController::class  ,  'index'  ]   )  ;  "
    let [data, error] = fnTryParseRouteVer8(input_line);
    console.log('test3=', { data }, { error });
}

function test4() {
    let input_line = "Route::get('orders/index', [\\App\\Http\\Controllers\\OrderController::class,'index'])->name('orders.index');"
    let [data, error] = fnTryParseRouteVer8(input_line);
    console.log('test4=', { data }, { error });
}

function run_bulk_tests() {
    for (let index = 0; index < kInputTexts.length; index++) {
        console.log('runTest' + index + '');
        const input_line = kInputTexts[index];
        let [data, error] = fnTryParseRouteVer8(input_line);
        if (null != error) {
            console.error('test' + index + 'Failed=', { input_line }, { data }, { error });
        } else {
            console.log('test' + index + 'Success=', { input_line }, { data }, { error });
        }
    }
}

// Run
test1();
test2();
test3();
test4();
run_bulk_tests();
