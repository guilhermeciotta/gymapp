<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Workout;

class WorkoutPolicy
{
    public function view(User $user, Workout $workout): bool
    {
        return $user->id === $workout->user_id;
    }

    public function update(User $user, Workout $workout): bool
    {
        return $user->id === $workout->user_id;
    }

    public function delete(User $user, Workout $workout): bool
    {
        return $user->id === $workout->user_id;
    }
}
