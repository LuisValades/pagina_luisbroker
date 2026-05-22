# =============================================================
#  Lanzador de Claude Code vía OpenRouter (Gemini)
#  Uso:  click derecho > Ejecutar con PowerShell
#        o desde terminal:  .\start-claude-openrouter.ps1
# =============================================================

# --- Requiere que la variable OPENROUTER_API_KEY exista en el sistema ---
if ([string]::IsNullOrWhiteSpace($env:OPENROUTER_API_KEY)) {
    Write-Host ""
    Write-Host "[ERROR] No se encontró la variable de entorno OPENROUTER_API_KEY." -ForegroundColor Red
    Write-Host "Configúrala una sola vez con:" -ForegroundColor Yellow
    Write-Host '  [Environment]::SetEnvironmentVariable("OPENROUTER_API_KEY","sk-or-...","User")' -ForegroundColor Gray
    Write-Host "Luego reinicia la terminal y vuelve a correr este script." -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Presiona Enter para salir"
    exit 1
}

# --- Redirige Claude Code al endpoint de OpenRouter ---
$env:ANTHROPIC_AUTH_TOKEN           = $env:OPENROUTER_API_KEY
$env:ANTHROPIC_BASE_URL             = "https://openrouter.ai/api"
$env:ANTHROPIC_API_KEY              = ""

# --- Modelo a usar (cambia aquí si quieres probar otro Gemini) ---
$model = "google/gemini-3.1-flash-lite-preview"
$env:ANTHROPIC_DEFAULT_SONNET_MODEL = $model
$env:ANTHROPIC_DEFAULT_OPUS_MODEL   = $model
$env:ANTHROPIC_DEFAULT_HAIKU_MODEL  = $model

# --- Bash de Git (necesario en Windows) ---
$env:CLAUDE_CODE_GIT_BASH_PATH      = "C:\Program Files\Git\bin\bash.exe"

# --- Working directory del proyecto ---
Set-Location "I:\Mi unidad\ANTIGRAVITY PROYECTOS"

Write-Host ""
Write-Host "Claude Code -> OpenRouter" -ForegroundColor Cyan
Write-Host "Modelo: $model" -ForegroundColor Green
Write-Host "Directorio: $(Get-Location)" -ForegroundColor Gray
Write-Host ""

# --- Arranca Claude Code ---
claude
