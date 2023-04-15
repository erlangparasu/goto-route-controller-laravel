<?php

Route::get(
    '/user/profile',
    [UserProfileController::class, 'show']
)->name('profile');
