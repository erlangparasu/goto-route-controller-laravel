export function fnTryParseRouteVer8(text: string) {
    // throw new Error('Function not implemented.');

    let r_route = '(Route[:]{2})';
    let r_method = '([a-zA-Z]{1,})';
    let r_bracket_open = '([\(]{1})';
    let r_bracket_close = '([\)]{1})';
    let r_route_path = '([\']{1}(.*)[\']{1})';

    let r_all_basic = '' +
        r_route +
        r_method +
        r_bracket_open +
        '(.*)?' + // spaces
        r_route_path +
        '(.*)?' + // spaces
        // '([,]{1})' +
        '(.*)?' + // spaces
        // '([\[]{1})' + // array start
        '(.*)?' + // spaces
        // '(.*)' + // CCC ::class
        '(.*)?' + // spaces
        // '([,]{1})' + // CCC comma
        '(.*)?' + // spaces
        // '([\'](.*)[\'])' + // actionName
        '(.*)?' + // spaces
        // '([\]]{1})' + // array end
        '(.*)?' + // spaces
        r_bracket_close;
    let regex_basic = new RegExp(r_all_basic);

    // console.log(text.match(regex_basic));
    let kotak_beg_pos: number = text.indexOf('[', 0);
    if (-1 == kotak_beg_pos) {
        return [
            null,
            new Error('char_not_found_1'),
        ];
    }

    let sub_text: string = text.substring(kotak_beg_pos);
    // console.log({ sub_text });
    if (0 == sub_text.length) {
        return [
            null,
            new Error('substring_not_found_1'),
        ];
    }

    let kotak_end_pos: number = text.indexOf(']', kotak_beg_pos);
    if (-1 == kotak_end_pos) {
        return [
            null,
            new Error('char_not_found_2'),
        ];
    }

    sub_text = text.substring(kotak_beg_pos, kotak_end_pos + 1);
    // console.log({ sub_text }); // "[App\Http\Controllers\OrderController::class,'index']"
    if (0 == sub_text.length) {
        return [
            null,
            new Error('substring_not_found_1'),
        ];
    }

    ///

    sub_text = sub_text.replace('[', '');
    sub_text = sub_text.replace(']', '');
    // console.log({ sub_text });
    if (0 == sub_text.length) {
        return [
            null,
            new Error('substring_not_found_2'),
        ];
    }

    // "Route::get('/user', [UserController::class, 'index']);"
    // "[UserController::class, 'index']"
    let words: string[] = sub_text.split(',');
    // console.log({ words });

    let class_text: string = words[0];
    // console.log({ class_text });
    let action_text: string = words[1];
    console.log({ action_text });

    // Trim
    class_text = class_text.trim();
    action_text = action_text.trim();

    /// ACTION

    let action_regex = new RegExp('^[\']([_a-zA-Z0-9]{1,})[\']$');
    let action_matches = action_text.match(action_regex);
    // console.log({ action_matches });
    if (null == action_matches) {
        return [
            null,
            new Error('action_not_match'),
        ];
    }

    action_text = action_text.replace("'", '');
    action_text = action_text.replace("'", '');
    // console.log({ action_text });
    if (0 == action_text.length) {
        return [
            null,
            new Error('action_is_empty'),
        ];
    }

    /// CLASS

    let is_absolute_path = false;
    if (0 == class_text.indexOf('\\')) {
        is_absolute_path = true;
    }

    let class_pos = class_text.indexOf('::class');
    if (-1 == class_pos) {
        return [
            null,
            new Error('class_not_found'),
        ];
    }

    class_text = class_text.replace('::class', '');
    if (0 == class_text.length) {
        return [
            null,
            new Error('class_is_empty'),
        ];
    }

    if (is_absolute_path) {
        class_text = class_text.replace('\\', '');
    }

    let class_dot = class_text.replace(new RegExp(/[\\]{1}/gi), '.');
    // console.log('start.');
    // console.log({ class_dot });
    // console.log('end.');
    if (0 == class_dot.length) {
        return [
            null,
            new Error('class_is_empty'),
        ];
    }

    let klass_parts = class_dot.split('.');
    if (0 == klass_parts.length) {
        return [
            null,
            new Error('namespace_is_empty'),
        ];
    }

    ///

    let data = {
        is_class_path_absolute: is_absolute_path,
        class: class_text,
        class_dot: class_dot,
        class_parts: klass_parts,
        action: action_text,
    };
    // console.log({ data });

    return [
        data,
        null,
    ];
}

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

test1();
test2();
test3();
test4();
