$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path

$FinalFolder = Join-Path $Root "T10_Final_Submission"
$FinalZip = Join-Path $Root "T10_Final_Submission.zip"

Write-Host ""
Write-Host "====================================="
Write-Host " T10 Final Submission Package"
Write-Host "====================================="
Write-Host ""

# --------------------------------------------------
# Remove previous output
# --------------------------------------------------

if (Test-Path $FinalFolder) {
    Remove-Item $FinalFolder -Recurse -Force
}

if (Test-Path $FinalZip) {
    Remove-Item $FinalZip -Force
}

# --------------------------------------------------
# Required files
# --------------------------------------------------

$RequiredFiles = @(
    "paper\T10_paper.md",
    "raw\measurements.csv",
    "raw\run_metadata.json",
    "analysis\results_summary.csv",
    "analysis\results_summary.md",
    "scripts\create_projects.py",
    "scripts\collect_osv.py",
    "scripts\analyze_results.py",
    "scripts\verify_package.py",
    "fixtures_manifest.csv",
    "01_experiment_design.md",
    "design_changes.md",
    "run_all.ps1",
    "README.md"
)

Write-Host "[1/5] Checking required files..."

foreach ($File in $RequiredFiles) {

    $FullPath = Join-Path $Root $File

    if (-not (Test-Path $FullPath)) {
        throw "Missing required file: $File"
    }

    Write-Host "OK: $File"
}

# --------------------------------------------------
# Check raw folders
# --------------------------------------------------

$SbomDir = Join-Path $Root "raw\sbom"
$OsvDir = Join-Path $Root "raw\osv"

if (-not (Test-Path $SbomDir)) {
    throw "Missing folder: raw\sbom"
}

if (-not (Test-Path $OsvDir)) {
    throw "Missing folder: raw\osv"
}

$SbomCount = (
    Get-ChildItem $SbomDir -Filter "*.json" -File
).Count

$OsvCount = (
    Get-ChildItem $OsvDir -Filter "*.json" -File
).Count

Write-Host ""
Write-Host "SBOM JSON count: $SbomCount"
Write-Host "OSV JSON count : $OsvCount"

if ($SbomCount -ne 10) {
    throw "Expected 10 SBOM JSON files but found $SbomCount."
}

if ($OsvCount -ne 20) {
    throw "Expected 20 OSV JSON files but found $OsvCount."
}

# --------------------------------------------------
# Create final folders
# --------------------------------------------------

Write-Host ""
Write-Host "[2/5] Creating final package folders..."

New-Item -ItemType Directory -Force $FinalFolder | Out-Null

$PaperOut = Join-Path $FinalFolder "paper"
$RawOut = Join-Path $FinalFolder "raw"
$SbomOut = Join-Path $RawOut "sbom"
$OsvOut = Join-Path $RawOut "osv"
$AnalysisOut = Join-Path $FinalFolder "analysis"
$ScriptsOut = Join-Path $FinalFolder "scripts"

New-Item -ItemType Directory -Force $PaperOut | Out-Null
New-Item -ItemType Directory -Force $RawOut | Out-Null
New-Item -ItemType Directory -Force $SbomOut | Out-Null
New-Item -ItemType Directory -Force $OsvOut | Out-Null
New-Item -ItemType Directory -Force $AnalysisOut | Out-Null
New-Item -ItemType Directory -Force $ScriptsOut | Out-Null

# --------------------------------------------------
# Copy files
# --------------------------------------------------

Write-Host ""
Write-Host "[3/5] Copying submission files..."

Copy-Item `
    (Join-Path $Root "paper\T10_paper.md") `
    $PaperOut `
    -Force

Copy-Item `
    (Join-Path $Root "raw\measurements.csv") `
    $RawOut `
    -Force

Copy-Item `
    (Join-Path $Root "raw\run_metadata.json") `
    $RawOut `
    -Force

Copy-Item `
    (Join-Path $Root "raw\sbom\*.json") `
    $SbomOut `
    -Force

Copy-Item `
    (Join-Path $Root "raw\osv\*.json") `
    $OsvOut `
    -Force

Copy-Item `
    (Join-Path $Root "analysis\results_summary.csv") `
    $AnalysisOut `
    -Force

Copy-Item `
    (Join-Path $Root "analysis\results_summary.md") `
    $AnalysisOut `
    -Force

Copy-Item `
    (Join-Path $Root "scripts\create_projects.py") `
    $ScriptsOut `
    -Force

Copy-Item `
    (Join-Path $Root "scripts\collect_osv.py") `
    $ScriptsOut `
    -Force

Copy-Item `
    (Join-Path $Root "scripts\analyze_results.py") `
    $ScriptsOut `
    -Force

Copy-Item `
    (Join-Path $Root "scripts\verify_package.py") `
    $ScriptsOut `
    -Force

Copy-Item `
    (Join-Path $Root "fixtures_manifest.csv") `
    $FinalFolder `
    -Force

Copy-Item `
    (Join-Path $Root "01_experiment_design.md") `
    $FinalFolder `
    -Force

Copy-Item `
    (Join-Path $Root "design_changes.md") `
    $FinalFolder `
    -Force

Copy-Item `
    (Join-Path $Root "run_all.ps1") `
    $FinalFolder `
    -Force

Copy-Item `
    (Join-Path $Root "README.md") `
    $FinalFolder `
    -Force

# --------------------------------------------------
# Check final package
# --------------------------------------------------

Write-Host ""
Write-Host "[4/5] Checking final package..."

$FinalSbomCount = (
    Get-ChildItem $SbomOut -Filter "*.json" -File
).Count

$FinalOsvCount = (
    Get-ChildItem $OsvOut -Filter "*.json" -File
).Count

if ($FinalSbomCount -ne 10) {
    throw "Final package SBOM count error."
}

if ($FinalOsvCount -ne 20) {
    throw "Final package OSV count error."
}

Write-Host "Paper     : OK"
Write-Host "SBOM      : $FinalSbomCount"
Write-Host "OSV       : $FinalOsvCount"
Write-Host "Raw CSV   : OK"
Write-Host "Scripts   : OK"
Write-Host "README    : OK"

# --------------------------------------------------
# Create ZIP
# --------------------------------------------------

Write-Host ""
Write-Host "[5/5] Creating ZIP..."

Compress-Archive `
    -Path "$FinalFolder\*" `
    -DestinationPath $FinalZip `
    -CompressionLevel Optimal `
    -Force

if (-not (Test-Path $FinalZip)) {
    throw "ZIP creation failed."
}

$ZipSize = (Get-Item $FinalZip).Length

Write-Host ""
Write-Host "====================================="
Write-Host " T10 FINAL PACKAGE COMPLETE"
Write-Host "====================================="
Write-Host ""

Write-Host "ZIP:"
Write-Host $FinalZip

Write-Host ""
Write-Host "ZIP size:"
Write-Host "$ZipSize bytes"

Write-Host ""
Write-Host "Included:"
Write-Host "- Final paper"
Write-Host "- Experiment design"
Write-Host "- Design change log"
Write-Host "- Raw measurements"
Write-Host "- 10 SBOM JSON files"
Write-Host "- 20 OSV JSON files"
Write-Host "- Analysis results"
Write-Host "- Reproduction scripts"
Write-Host "- README"

Write-Host ""
Write-Host "Excluded:"
Write-Host "- Gradle binaries"
Write-Host "- tools directory"
Write-Host "- build cache"
Write-Host "- temporary project build files"

Write-Host ""