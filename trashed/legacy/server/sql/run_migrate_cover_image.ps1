# Находит базу из server/.env (DATABASE_URL) и выполняет миграцию cover_image -> LONGTEXT.
# Использование (из корня проекта):
#   .\server\sql\run_migrate_cover_image.ps1
# Или с явным пользователем:
#   $env:MYSQL_USER = "myuser"; .\server\sql\run_migrate_cover_image.ps1

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ServerDir = Resolve-Path (Join-Path $ScriptDir "..")
$EnvFile = Join-Path $ServerDir ".env"
$MigrationFile = Join-Path $ScriptDir "migrate_cover_image_longtext.sql"

if (-not (Test-Path $MigrationFile)) {
    Write-Error "Файл миграции не найден: $MigrationFile"
    exit 1
}

if (-not (Test-Path $EnvFile)) {
    Write-Host "Файл .env не найден: $EnvFile"
    Write-Host "Выполните вручную: mysql -u USER -p DATABASE < $MigrationFile"
    exit 1
}

$line = Get-Content $EnvFile | Select-String -Pattern "^DATABASE_URL=" | ForEach-Object { $_.Line }
$DATABASE_URL = ($line -replace '^DATABASE_URL=', '').Trim().Trim('"').Trim("'")
if (-not $DATABASE_URL -or $DATABASE_URL -notmatch "^mysql") {
    Write-Host "В .env не найден DATABASE_URL с mysql://"
    Write-Host "Выполните вручную: mysql -u USER -p DATABASE < $MigrationFile"
    exit 1
}

# Извлечь имя базы: последний сегмент пути (до ? если есть)
if ($DATABASE_URL -match "/([^/?]+)(\?|$)") { $DB_NAME = $Matches[1] } else { $DB_NAME = "" }
# Пользователь: между mysql:// и первым :
if ($DATABASE_URL -match "mysql://([^:]+):") { $MYSQL_USER = $Matches[1] } else { $MYSQL_USER = "" }
if ($env:MYSQL_USER) { $MYSQL_USER = $env:MYSQL_USER }
# Хост: между @ и / или :
if ($DATABASE_URL -match "@([^:/]+)[:/]") { $MYSQL_HOST = $Matches[1] } else { $MYSQL_HOST = "localhost" }
if ($env:MYSQL_HOST) { $MYSQL_HOST = $env:MYSQL_HOST }

if (-not $DB_NAME) {
    Write-Host "Не удалось извлечь имя базы из DATABASE_URL"
    exit 1
}

Write-Host "База: $DB_NAME, пользователь: $MYSQL_USER, хост: $MYSQL_HOST"
Write-Host "Выполняю миграцию..."

Get-Content $MigrationFile -Raw | & mysql -h $MYSQL_HOST -u $MYSQL_USER -p $DB_NAME
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
Write-Host "Готово."
