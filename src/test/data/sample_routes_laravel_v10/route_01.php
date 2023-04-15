<?php

use App\Http\Controllers\UserController;

Route::get('/user/{id}', [UserController::class, 'show']);
