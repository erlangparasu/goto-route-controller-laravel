<?php

Route::get('profile', [UserController::class, 'show'])->middleware('auth');
