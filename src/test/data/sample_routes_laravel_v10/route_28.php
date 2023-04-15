<?php

use App\Http\Controllers\UserController;

Route::put('/user/{id}', [UserController::class, 'update']);
