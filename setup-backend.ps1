# Script para crear estructura de carpetas del Backend de Balancea
# Ruta base del backend
$backendPath = "C:\Users\alvar\Mis_Archivos\Repositorios\balancea\backend"

# Navegar a la ruta del backend
Set-Location $backendPath

Write-Host "=== LIMPIANDO ESTRUCTURA ANTERIOR DEL BACKEND ===" -ForegroundColor Yellow

# Eliminar carpeta src si existe (con confirmación de seguridad)
if (Test-Path "src") {
    Remove-Item -Path "src" -Recurse -Force
    Write-Host "✓ Carpeta 'src' eliminada" -ForegroundColor Green
}

Write-Host "`n=== CREANDO NUEVA ESTRUCTURA DEL BACKEND ===" -ForegroundColor Cyan

# Crear estructura principal de src/
$srcFolders = @(
    "src\config",
    "src\controllers",
    "src\models",
    "src\routes",
    "src\middlewares",
    "src\services",
    "src\validators",
    "src\utils",
    "src\prisma\migrations",
    "src\tests\unit\controllers",
    "src\tests\unit\services",
    "src\tests\integration\routes",
    "src\jobs"
)

foreach ($folder in $srcFolders) {
    New-Item -ItemType Directory -Path $folder -Force | Out-Null
}

Write-Host "✓ Estructura de carpetas creada" -ForegroundColor Green

Write-Host "`n=== CREANDO ARCHIVOS BASE ===" -ForegroundColor Cyan

# Crear archivos en config
$configFiles = @(
    "src\config\database.js",
    "src\config\jwt.js",
    "src\config\cors.js",
    "src\config\environment.js"
)

foreach ($file in $configFiles) {
    New-Item -ItemType File -Path $file -Force | Out-Null
}

# Crear archivos en controllers
$controllerFiles = @(
    "src\controllers\authController.js",
    "src\controllers\userController.js",
    "src\controllers\transactionController.js",
    "src\controllers\categoryController.js",
    "src\controllers\budgetController.js",
    "src\controllers\notificationController.js"
)

foreach ($file in $controllerFiles) {
    New-Item -ItemType File -Path $file -Force | Out-Null
}

# Crear archivos en models
$modelFiles = @(
    "src\models\User.js",
    "src\models\Transaction.js",
    "src\models\Category.js",
    "src\models\Budget.js",
    "src\models\RecurringTransaction.js"
)

foreach ($file in $modelFiles) {
    New-Item -ItemType File -Path $file -Force | Out-Null
}

# Crear archivos en routes
$routeFiles = @(
    "src\routes\index.js",
    "src\routes\authRoutes.js",
    "src\routes\userRoutes.js",
    "src\routes\transactionRoutes.js",
    "src\routes\categoryRoutes.js",
    "src\routes\budgetRoutes.js",
    "src\routes\adminRoutes.js"
)

foreach ($file in $routeFiles) {
    New-Item -ItemType File -Path $file -Force | Out-Null
}

# Crear archivos en middlewares
$middlewareFiles = @(
    "src\middlewares\authMiddleware.js",
    "src\middlewares\roleMiddleware.js",
    "src\middlewares\validationMiddleware.js",
    "src\middlewares\errorHandler.js",
    "src\middlewares\rateLimiter.js",
    "src\middlewares\logger.js"
)

foreach ($file in $middlewareFiles) {
    New-Item -ItemType File -Path $file -Force | Out-Null
}

# Crear archivos en services
$serviceFiles = @(
    "src\services\authService.js",
    "src\services\transactionService.js",
    "src\services\syncService.js",
    "src\services\notificationService.js",
    "src\services\budgetService.js",
    "src\services\emailService.js"
)

foreach ($file in $serviceFiles) {
    New-Item -ItemType File -Path $file -Force | Out-Null
}

# Crear archivos en validators
$validatorFiles = @(
    "src\validators\authValidator.js",
    "src\validators\transactionValidator.js",
    "src\validators\categoryValidator.js",
    "src\validators\budgetValidator.js"
)

foreach ($file in $validatorFiles) {
    New-Item -ItemType File -Path $file -Force | Out-Null
}

# Crear archivos en utils
$utilFiles = @(
    "src\utils\bcryptUtils.js",
    "src\utils\jwtUtils.js",
    "src\utils\dateUtils.js",
    "src\utils\responseHandler.js"
)

foreach ($file in $utilFiles) {
    New-Item -ItemType File -Path $file -Force | Out-Null
}

# Crear archivo schema.prisma
New-Item -ItemType File -Path "src\prisma\schema.prisma" -Force | Out-Null

# Crear archivos en jobs
$jobFiles = @(
    "src\jobs\budgetAlerts.js",
    "src\jobs\recurringTransactions.js"
)

foreach ($file in $jobFiles) {
    New-Item -ItemType File -Path $file -Force | Out-Null
}

# Crear archivo principal de la app
New-Item -ItemType File -Path "src\app.js" -Force | Out-Null

# Crear archivo server.js en la raíz
New-Item -ItemType File -Path "server.js" -Force | Out-Null

# Crear archivos .env si no existen
if (-not (Test-Path ".env.development")) {
    New-Item -ItemType File -Path ".env.development" -Force | Out-Null
}
if (-not (Test-Path ".env.production")) {
    New-Item -ItemType File -Path ".env.production" -Force | Out-Null
}
if (-not (Test-Path ".env.test")) {
    New-Item -ItemType File -Path ".env.test" -Force | Out-Null
}

# Crear .gitignore si no existe
if (-not (Test-Path ".gitignore")) {
    New-Item -ItemType File -Path ".gitignore" -Force | Out-Null
}

Write-Host "✓ Archivos base creados" -ForegroundColor Green

Write-Host "`n=== ESTRUCTURA DEL BACKEND COMPLETADA ===" -ForegroundColor Green
Write-Host "Ubicación: $backendPath" -ForegroundColor Cyan

# Mostrar árbol de directorios (opcional)
Write-Host "`n¿Deseas ver el árbol de directorios? (S/N)" -ForegroundColor Yellow
$response = Read-Host
if ($response -eq "S" -or $response -eq "s") {
    tree /F src
}