$ErrorActionPreference = "Stop"

Set-Location -LiteralPath $PSScriptRoot

if (-not (Test-Path -LiteralPath "node_modules")) {
  npm install --cache .\.npm-cache
}

npm run dev

