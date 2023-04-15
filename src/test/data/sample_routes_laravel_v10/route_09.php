<?php

Route::resource('photos', PhotoController::class)->withTrashed(['show']);
