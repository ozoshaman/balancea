# Script para crear estructura de carpetas del Frontend de Balancea
# Ruta base del frontend
$frontendPath = "C:\Users\alvar\Mis_Archivos\Repositorios\balancea\frontend"

# Navegar a la ruta del frontend
Set-Location $frontendPath

Write-Host "=== LIMPIANDO ESTRUCTURA ANTERIOR DEL FRONTEND ===" -ForegroundColor Yellow

# Eliminar carpetas src y public si existen (con confirmación de seguridad)
if (Test-Path "src") {
    Remove-Item -Path "src" -Recurse -Force
    Write-Host "✓ Carpeta 'src' eliminada" -ForegroundColor Green
}

if (Test-Path "public\icons") {
    Remove-Item -Path "public\icons" -Recurse -Force
    Write-Host "✓ Carpeta 'public\icons' eliminada" -ForegroundColor Green
}

Write-Host "`n=== CREANDO NUEVA ESTRUCTURA DEL FRONTEND ===" -ForegroundColor Cyan

# Crear estructura de public/
New-Item -ItemType Directory -Path "public\icons" -Force | Out-Null

# Crear estructura principal de src/
$srcFolders = @(
    "src\assets\images",
    "src\assets\fonts",
    
    "src\components\common\Button",
    "src\components\common\Input",
    "src\components\common\Modal",
    "src\components\common\Loader",
    "src\components\common\Alert",
    
    "src\components\layout\Header",
    "src\components\layout\Footer",
    "src\components\layout\Sidebar",
    "src\components\layout\Navigation",
    
    "src\components\features\TransactionCard",
    "src\components\features\BalanceDisplay",
    "src\components\features\CategoryBadge",
    "src\components\features\ChartWidget",
    
    "src\pages\Auth",
    "src\pages\Dashboard",
    "src\pages\Transactions",
    "src\pages\Categories",
    "src\pages\Budget",
    "src\pages\Reports",
    "src\pages\Settings",
    
    "src\services\api",
    "src\services\indexedDB",
    "src\services\notifications",
    
    "src\store\slices",
    "src\store\middleware",
    
    "src\hooks",
    "src\utils",
    "src\config",
    "src\styles",
    "src\sw"
)

foreach ($folder in $srcFolders) {
    New-Item -ItemType Directory -Path $folder -Force | Out-Null
}

Write-Host "✓ Estructura de carpetas creada" -ForegroundColor Green

Write-Host "`n=== CREANDO ARCHIVOS BASE ===" -ForegroundColor Cyan

# Crear archivos en components/common
$commonComponents = @("Button", "Input", "Modal", "Loader", "Alert")
foreach ($component in $commonComponents) {
    New-Item -ItemType File -Path "src\components\common\$component\$component.jsx" -Force | Out-Null
    New-Item -ItemType File -Path "src\components\common\$component\$component.test.js" -Force | Out-Null
}

# Crear archivos en components/layout
$layoutComponents = @("Header", "Footer", "Sidebar", "Navigation")
foreach ($component in $layoutComponents) {
    New-Item -ItemType File -Path "src\components\layout\$component\$component.jsx" -Force | Out-Null
}

# Crear archivos en components/features
$featureComponents = @("TransactionCard", "BalanceDisplay", "CategoryBadge", "ChartWidget")
foreach ($component in $featureComponents) {
    New-Item -ItemType File -Path "src\components\features\$component\$component.jsx" -Force | Out-Null
}

# Crear archivos en pages
$pageFiles = @(
    "src\pages\Auth\Login.jsx",
    "src\pages\Auth\Register.jsx",
    "src\pages\Dashboard\Dashboard.jsx",
    "src\pages\Transactions\TransactionList.jsx",
    "src\pages\Transactions\TransactionForm.jsx",
    "src\pages\Transactions\TransactionDetail.jsx",
    "src\pages\Categories\CategoryManager.jsx",
    "src\pages\Budget\BudgetPlanner.jsx",
    "src\pages\Reports\FinancialReports.jsx",
    "src\pages\Settings\UserSettings.jsx"
)

foreach ($file in $pageFiles) {
    New-Item -ItemType File -Path $file -Force | Out-Null
}

# Crear archivos en services
$serviceFiles = @(
    "src\services\api\axiosConfig.js",
    "src\services\api\authService.js",
    "src\services\api\transactionService.js",
    "src\services\api\categoryService.js",
    "src\services\api\budgetService.js",
    "src\services\indexedDB\db.js",
    "src\services\indexedDB\transactionDB.js",
    "src\services\indexedDB\syncQueue.js",
    "src\services\notifications\fcmService.js"
)

foreach ($file in $serviceFiles) {
    New-Item -ItemType File -Path $file -Force | Out-Null
}

# Crear archivos en store
$storeFiles = @(
    "src\store\index.js",
    "src\store\slices\authSlice.js",
    "src\store\slices\transactionSlice.js",
    "src\store\slices\categorySlice.js",
    "src\store\slices\budgetSlice.js",
    "src\store\slices\uiSlice.js",
    "src\store\middleware\syncMiddleware.js"
)

foreach ($file in $storeFiles) {
    New-Item -ItemType File -Path $file -Force | Out-Null
}

# Crear archivos en hooks
$hookFiles = @(
    "src\hooks\useAuth.js",
    "src\hooks\useTransactions.js",
    "src\hooks\useOfflineSync.js",
    "src\hooks\useNetworkStatus.js",
    "src\hooks\useLocalStorage.js"
)

foreach ($file in $hookFiles) {
    New-Item -ItemType File -Path $file -Force | Out-Null
}

# Crear archivos en utils
$utilFiles = @(
    "src\utils\dateUtils.js",
    "src\utils\formatters.js",
    "src\utils\validators.js",
    "src\utils\constants.js",
    "src\utils\helpers.js"
)

foreach ($file in $utilFiles) {
    New-Item -ItemType File -Path $file -Force | Out-Null
}

# Crear archivos en config
$configFiles = @(
    "src\config\routes.js",
    "src\config\theme.js"
)

foreach ($file in $configFiles) {
    New-Item -ItemType File -Path $file -Force | Out-Null
}

# Crear archivos en styles
$styleFiles = @(
    "src\styles\global.css",
    "src\styles\variables.css"
)

foreach ($file in $styleFiles) {
    New-Item -ItemType File -Path $file -Force | Out-Null
}

# Crear archivos en sw
$swFiles = @(
    "src\sw\serviceWorker.js",
    "src\sw\sw-config.js"
)

foreach ($file in $swFiles) {
    New-Item -ItemType File -Path $file -Force | Out-Null
}

# Crear archivos principales
New-Item -ItemType File -Path "src\App.jsx" -Force | Out-Null
New-Item -ItemType File -Path "src\index.jsx" -Force | Out-Null
New-Item -ItemType File -Path "src\setupTests.js" -Force | Out-Null

# Crear archivos .env si no existen
if (-not (Test-Path ".env.development")) {
    New-Item -ItemType File -Path ".env.development" -Force | Out-Null
}
if (-not (Test-Path ".env.production")) {
    New-Item -ItemType File -Path ".env.production" -Force | Out-Null
}

Write-Host "✓ Archivos base creados" -ForegroundColor Green

Write-Host "`n=== ESTRUCTURA DEL FRONTEND COMPLETADA ===" -ForegroundColor Green
Write-Host "Ubicación: $frontendPath" -ForegroundColor Cyan

# Mostrar árbol de directorios (opcional)
Write-Host "`n¿Deseas ver el árbol de directorios? (S/N)" -ForegroundColor Yellow
$response = Read-Host
if ($response -eq "S" -or $response -eq "s") {
    tree /F src
}