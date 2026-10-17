#Requires -Version 5.1
<#
.SYNOPSIS
    Instalador completo do ecossistema GROKBOT + IA CLIs no Windows PowerShell:
    - Google Gemini CLI (@google/gemini-cli)
    - Anthropic Claude Code (@anthropic-ai/claude-code)
    - OpenAI Codex / GPT CLI (@openai/codex)
    - GROKBOT CLI (grokbot-gemini -> Agente Gemini 3 Flash + n8n)
    - Cursor CLI & configuracoes MCP (AnythingMCP: claude + anythingmcp)
#>

$ErrorActionPreference = "Continue"

Write-Host "`n============================================================" -ForegroundColor Cyan
Write-Host "  GROKBOT - Setup Windows PowerShell (Gemini, Claude, Codex/GPT, Cursor & MCP)" -ForegroundColor Cyan
Write-Host "============================================================`n" -ForegroundColor Cyan

# 1. Verificar Node.js / npm (ou instalar via winget se nao existir)
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host "[1/5] Node.js nao encontrado. Instalando Node.js LTS via winget..." -ForegroundColor Yellow
    winget install -e --id OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
} else {
    Write-Host "[1/5] Node.js e npm detectados: $(node -v) / npm $(npm -v)" -ForegroundColor Green
}

# 2. Instalar as CLIs globais: Gemini CLI, Claude Code e OpenAI Codex (GPT)
Write-Host "`n[2/5] Instalando Gemini CLI, Claude Code e OpenAI Codex (GPT) globalmente via npm..." -ForegroundColor Yellow
npm install -g @google/gemini-cli @anthropic-ai/claude-code @openai/codex

# Garantir que a pasta global do npm esteja no PATH da sessao atual e do Usuario
$npmPrefix = (npm config get prefix).Trim()
if ($env:Path -notlike "*$npmPrefix*") {
    $env:Path = "$npmPrefix;$env:Path"
}
$userPath = [Environment]::GetEnvironmentVariable("Path", "User")
if ($userPath -notlike "*$npmPrefix*") {
    [Environment]::SetEnvironmentVariable("Path", "$npmPrefix;$userPath", "User")
    Write-Host "  -> Adicionado '$npmPrefix' ao PATH do Windows." -ForegroundColor Green
}

# 3. Verificar / instalar Cursor e ChatGPT Desktop (opcional via winget)
Write-Host "`n[3/5] Verificando Cursor no Windows..." -ForegroundColor Yellow
if (-not (Get-Command cursor -ErrorAction SilentlyContinue)) {
    $cursorLocal = "$env:LOCALAPPDATA\Programs\cursor\resources\app\bin"
    if (Test-Path $cursorLocal) {
        $env:Path = "$cursorLocal;$env:Path"
        Write-Host "  -> Cursor CLI detectado em $cursorLocal" -ForegroundColor Green
    } else {
        Write-Host "  -> Dica: Para instalar o Cursor via winget, use: winget install -e --id Anysphere.Cursor" -ForegroundColor DarkGray
    }
} else {
    Write-Host "  -> Cursor CLI ja disponivel no PATH." -ForegroundColor Green
}

# 4. Registrar comandos 'grokbot-gemini' e alias 'gpt' no PowerShell Profile ($PROFILE) + npm link
Write-Host "`n[4/5] Configurando comando 'grokbot-gemini' e 'gpt' no Windows PowerShell..." -ForegroundColor Yellow
$repoRoot = Split-Path -Parent $PSScriptRoot
if (Test-Path (Join-Path $repoRoot "package.json")) {
    Push-Location $repoRoot
    npm link
    Pop-Location
}

$profileDir = Split-Path -Parent $PROFILE
if (-not (Test-Path $profileDir)) {
    New-Item -ItemType Directory -Path $profileDir -Force | Out-Null
}
if (-not (Test-Path $PROFILE)) {
    New-Item -ItemType File -Path $PROFILE -Force | Out-Null
}

$profileBlock = @'
# >>> GROKBOT AI CLI SUITE >>>
function grokbot-gemini {
    param([Parameter(ValueFromRemainingArguments=$true)][string[]]$promptArgs)
    $prompt = if ($promptArgs) { $promptArgs -join " " } else { "Apresente um resumo executivo do Ledger de Emails e da Inbox GTD." }
    if ($prompt -eq "triage" -or $prompt -eq "triage --test-suite") {
        $isTest = $prompt -like "*--test-suite*"
        $body = if ($isTest) { '{"test_suite":true}' } else { '{}' }
        $res = Invoke-RestMethod -Uri "https://gavi22.app.n8n.cloud/webhook/grokbot-email-command-center-run" -Method Post -ContentType "application/json; charset=utf-8" -Body $body
        Write-Host "`n[GROKBOT Triage] $($res | ConvertTo-Json -Compress)`n" -ForegroundColor Green
        return
    }
    $body = @{ prompt = $prompt; sessionId = "powershell-$env:USERNAME" } | ConvertTo-Json -Compress
    $res = Invoke-RestMethod -Uri "https://gavi22.app.n8n.cloud/webhook/grokbot-gemini-agent" -Method Post -ContentType "application/json; charset=utf-8" -Body ([System.Text.Encoding]::UTF8.GetBytes($body))
    Write-Host "`n$($res.response)`n" -ForegroundColor Cyan
}
Set-Alias -Name gpt -Value codex -Scope Global -ErrorAction SilentlyContinue
# <<< GROKBOT AI CLI SUITE <<<
'@

$currentProfile = Get-Content $PROFILE -Raw -ErrorAction SilentlyContinue
if ($currentProfile -notlike "*GROKBOT AI CLI SUITE*") {
    Add-Content -Path $PROFILE -Value "`n$profileBlock"
    Write-Host "  -> Funcoes 'grokbot-gemini' e alias 'gpt' (-> codex) gravados no seu `$PROFILE ($PROFILE)." -ForegroundColor Green
}

# 5. Configurar os servidores AnythingMCP no Claude Code, Gemini CLI, Codex/GPT e Cursor
Write-Host "`n[5/5] Registrando servidores MCP (AnythingMCP) no Claude Code, Gemini CLI, Codex e Cursor..." -ForegroundColor Yellow

# Claude Code
if (Get-Command claude -ErrorAction SilentlyContinue) {
    claude mcp add --transport http claude https://cloud.anythingmcp.com/mcp/cmvby39vb3n5s01l4ftnfk7gt
    claude mcp add --transport http anythingmcp https://cloud.anythingmcp.com/mcp/cmvbdpb9l2tbi01l45vejqj1k
}

# Gemini CLI
if (Get-Command gemini -ErrorAction SilentlyContinue) {
    gemini mcp add --transport http claude https://cloud.anythingmcp.com/mcp/cmvby39vb3n5s01l4ftnfk7gt
    gemini mcp add --transport http anythingmcp https://cloud.anythingmcp.com/mcp/cmvbdpb9l2tbi01l45vejqj1k
}

# OpenAI Codex / GPT (~/.codex/config.toml)
$codexDir = Join-Path $HOME ".codex"
if (-not (Test-Path $codexDir)) { New-Item -ItemType Directory -Path $codexDir -Force | Out-Null }
$codexConfig = Join-Path $codexDir "config.toml"
$codexToml = @"
[mcp_servers.claude]
url = "https://cloud.anythingmcp.com/mcp/cmvby39vb3n5s01l4ftnfk7gt"

[mcp_servers.anythingmcp]
url = "https://cloud.anythingmcp.com/mcp/cmvbdpb9l2tbi01l45vejqj1k"
"@
Set-Content -Path $codexConfig -Value $codexToml -Encoding UTF8
Write-Host "  -> Configurado OpenAI Codex/GPT MCP em $codexConfig" -ForegroundColor Green

# Cursor Global (~/.cursor/mcp.json)
$cursorDir = Join-Path $HOME ".cursor"
if (-not (Test-Path $cursorDir)) { New-Item -ItemType Directory -Path $cursorDir -Force | Out-Null }
$cursorMcpPath = Join-Path $cursorDir "mcp.json"
$cursorMcpJson = @'
{
  "mcpServers": {
    "claude": {
      "type": "http",
      "url": "https://cloud.anythingmcp.com/mcp/cmvby39vb3n5s01l4ftnfk7gt"
    },
    "anythingmcp": {
      "type": "http",
      "url": "https://cloud.anythingmcp.com/mcp/cmvbdpb9l2tbi01l45vejqj1k"
    }
  }
}
'@
if (-not (Test-Path $cursorMcpPath)) {
    Set-Content -Path $cursorMcpPath -Value $cursorMcpJson -Encoding UTF8
    Write-Host "  -> Configurado Cursor MCP em $cursorMcpPath" -ForegroundColor Green
}

Write-Host "`n============================================================" -ForegroundColor Green
Write-Host "  INSTALACAO CONCLUIDA!" -ForegroundColor Green
Write-Host "  Comandos prontos no seu PowerShell:" -ForegroundColor White
Write-Host "    • gemini          -> Google Gemini CLI oficial" -ForegroundColor Cyan
Write-Host "    • claude          -> Anthropic Claude Code CLI" -ForegroundColor Cyan
Write-Host "    • codex (ou gpt)  -> OpenAI Codex / GPT CLI" -ForegroundColor Cyan
Write-Host "    • cursor          -> Cursor Editor / CLI" -ForegroundColor Cyan
Write-Host "    • grokbot-gemini  -> Agente Executivo GROKBOT (Gemini 3 Flash + n8n)" -ForegroundColor Cyan
Write-Host "============================================================`n" -ForegroundColor Green
