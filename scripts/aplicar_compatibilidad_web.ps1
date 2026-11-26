param(
  [Parameter(Mandatory = $true)]
  [string] $Proyecto
)

$ErrorActionPreference = 'Stop'
$paquete = Split-Path -Parent $PSScriptRoot
$raiz = (Resolve-Path -LiteralPath $Proyecto).Path
$server = Join-Path $raiz 'backend/server.js'
$archivos = @(
  'web/js/config.js',
  'web/js/datos.js',
  'web/README.md',
  'backend/webCompatRoutes.js'
)

if (-not (Test-Path -LiteralPath $server)) {
  throw "No se encontró backend/server.js en $raiz. Abre el repositorio correcto."
}
foreach ($archivo in $archivos) {
  $origen = Join-Path $paquete ($archivo -replace '/', [IO.Path]::DirectorySeparatorChar)
  if (-not (Test-Path -LiteralPath $origen)) { throw "Falta el archivo del paquete: $origen" }
}

# Verificar que la integración en server.js puede hacerse ANTES de copiar algo.
$codigo = [IO.File]::ReadAllText($server)
$ancla = "app.use('/api/mobile', require('./mobileRoutes')(db));"
$nuevaLinea = "app.use('/api/web', require('./webCompatRoutes')(db));"
if (-not $codigo.Contains($nuevaLinea) -and -not $codigo.Contains($ancla)) {
  throw 'No encuentro el punto de inserción en backend/server.js. No hice ningún cambio; revisa este archivo antes de continuar.'
}

# No sobrescribir silenciosamente cambios de código sin confirmar.
# Ignorar archivos de datos no rastreados (.env/fotos) que no toca este instalador.
$protegidos = @('web/js/config.js', 'web/js/datos.js', 'web/README.md', 'backend/server.js', 'backend/webCompatRoutes.js')
$modificados = & git -C $raiz status --porcelain -- $protegidos 2>$null
if ($LASTEXITCODE -eq 0 -and $modificados) {
  throw "Hay cambios pendientes en archivos que serían reemplazados:`n$($modificados -join [Environment]::NewLine)`nHaz respaldo o commit primero. No cambié nada."
}

# Respaldos SIEMPRE fuera del repositorio, para que no aparezcan en Source Control.
$padre = Split-Path -Parent $raiz
$sello = Get-Date -Format 'yyyyMMdd_HHmmss'
$respaldo = Join-Path $padre ("respaldo_web_compat_$sello")
New-Item -ItemType Directory -Path $respaldo -Force | Out-Null
foreach ($archivo in @('backend/server.js') + $archivos) {
  $destino = Join-Path $raiz ($archivo -replace '/', [IO.Path]::DirectorySeparatorChar)
  if (Test-Path -LiteralPath $destino) {
    $copia = Join-Path $respaldo ($archivo -replace '/', [IO.Path]::DirectorySeparatorChar)
    New-Item -ItemType Directory -Path (Split-Path -Parent $copia) -Force | Out-Null
    Copy-Item -LiteralPath $destino -Destination $copia -Force
  }
}

foreach ($archivo in $archivos) {
  $origen = Join-Path $paquete ($archivo -replace '/', [IO.Path]::DirectorySeparatorChar)
  $destino = Join-Path $raiz ($archivo -replace '/', [IO.Path]::DirectorySeparatorChar)
  New-Item -ItemType Directory -Path (Split-Path -Parent $destino) -Force | Out-Null
  Copy-Item -LiteralPath $origen -Destination $destino -Force
}
if (-not $codigo.Contains($nuevaLinea)) {
  $codigo = $codigo.Replace($ancla, "$ancla`r`n$nuevaLinea")
  [IO.File]::WriteAllText($server, $codigo, [System.Text.UTF8Encoding]::new($false))
}
Write-Host 'Compatibilidad web incorporada a la carpeta de trabajo.' -ForegroundColor Green
Write-Host "Respaldo: $respaldo"
Write-Host 'Archivos de diseño preservados: web/index.html, web/js/app.js, web/css/styles.css'
Write-Host 'Reinicia Node.js y recarga el navegador. No se hizo commit ni push.'
