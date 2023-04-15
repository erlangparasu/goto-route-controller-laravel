<?php

use App\Http\Controller\PhotoController;

// Route::get('/photos/popular', [PhotoController::class, 'popular']);
Route::resource('photos', PhotoController::class);
