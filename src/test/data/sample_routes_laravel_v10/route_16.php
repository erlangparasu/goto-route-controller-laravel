<?php

use App\Http\Controllers\CommentController;

Route::resource('photos.comments', CommentController::class)->shallow();
