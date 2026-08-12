<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class WorkoutDay extends Model
{
    protected $fillable = ['workout_id', 'name', 'order', 'dia_semana'];

    private const DIA_SEMANA_KEYWORDS = [
        'domingo' => 'domingo',
        'segunda' => 'segunda',
        'terca' => 'terca',
        'quarta' => 'quarta',
        'quinta' => 'quinta',
        'sexta' => 'sexta',
        'sabado' => 'sabado',
    ];

    public function workout(): BelongsTo
    {
        return $this->belongsTo(Workout::class);
    }

    public function exercises(): HasMany
    {
        return $this->hasMany(Exercise::class)->orderBy('order');
    }

    public static function parseDiaSemanaFromName(string $name): ?string
    {
        $normalized = Str::of($name)->lower()->ascii();

        foreach (self::DIA_SEMANA_KEYWORDS as $keyword => $value) {
            if ($normalized->contains($keyword)) {
                return $value;
            }
        }

        return null;
    }
}
