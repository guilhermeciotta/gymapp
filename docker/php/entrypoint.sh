#!/bin/sh
set -e

cd /var/www

# Instalar dependências caso vendor esteja desatualizado
if [ ! -f "vendor/autoload.php" ]; then
    composer install --no-interaction --optimize-autoloader
fi

# Gerar APP_KEY se não existe
if grep -q "^APP_KEY=$" .env 2>/dev/null; then
    php artisan key:generate --force
fi

# Rodar migrations
php artisan migrate --force --no-interaction 2>/dev/null || true

# Publicar assets do Sanctum
php artisan vendor:publish --tag=sanctum-config --force 2>/dev/null || true

exec php-fpm
