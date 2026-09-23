$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path

$Scripts = Join-Path $Root "scripts"
$Projects = Join-Path $Root "projects"

$Raw = Join-Path $Root "raw"
$SbomDir = Join-Path $Raw "sbom"
$OsvDir = Join-Path $Raw "osv"

$Analysis = Join-Path $Root "analysis"
$Tools = Join-Path $Root "tools"

$GradleVersion = "8.14.3"
$GradleFolder = Join-Path $Tools "gradle-$GradleVersion"
$GradleExe = Join-Path $GradleFolder "bin\gradle.bat"

Write-Host ""
Write-Host "====================================="
Write-Host " T10 SBOM Supply Chain Security Test"
Write-Host "====================================="
Write-Host ""

# --------------------------------------------------
# Check Python
# --------------------------------------------------

$PythonCommand = Get-Command python -ErrorAction SilentlyContinue

if (-not $PythonCommand) {
    throw "Python was not found. Run: python --version"
}

# --------------------------------------------------
# Check Java
# --------------------------------------------------

$JavaCommand = Get-Command java -ErrorAction SilentlyContinue

if (-not $JavaCommand) {
    throw "Java was not found. JDK 17 or later is required."
}

Write-Host "[Environment]"
python --version
java -version

# --------------------------------------------------
# Create required directories
# --------------------------------------------------

Write-Host ""
Write-Host "[Prepare directories]"

[System.IO.Directory]::CreateDirectory($Projects) | Out-Null
[System.IO.Directory]::CreateDirectory($Raw) | Out-Null
[System.IO.Directory]::CreateDirectory($SbomDir) | Out-Null
[System.IO.Directory]::CreateDirectory($OsvDir) | Out-Null
[System.IO.Directory]::CreateDirectory($Analysis) | Out-Null
[System.IO.Directory]::CreateDirectory($Tools) | Out-Null

Write-Host "Projects : $Projects"
Write-Host "Raw      : $Raw"
Write-Host "SBOM     : $SbomDir"
Write-Host "OSV      : $OsvDir"
Write-Host "Analysis : $Analysis"

# --------------------------------------------------
# Step 1 - Create experimental projects
# --------------------------------------------------

Write-Host ""
Write-Host "[1/4] Creating experimental projects..." -ForegroundColor Cyan

$CreateProjectsScript = Join-Path $Scripts "create_projects.py"

if (-not (Test-Path $CreateProjectsScript)) {
    throw "Missing file: $CreateProjectsScript"
}

python $CreateProjectsScript

if ($LASTEXITCODE -ne 0) {
    throw "create_projects.py failed."
}

# Re-create output directories just in case
[System.IO.Directory]::CreateDirectory($SbomDir) | Out-Null
[System.IO.Directory]::CreateDirectory($OsvDir) | Out-Null
[System.IO.Directory]::CreateDirectory($Analysis) | Out-Null

# --------------------------------------------------
# Download Gradle if needed
# --------------------------------------------------

if (-not (Test-Path $GradleExe)) {

    Write-Host ""
    Write-Host "[Downloading Gradle $GradleVersion]" -ForegroundColor Yellow

    $GradleZip = Join-Path $Tools "gradle-$GradleVersion-bin.zip"
    $GradleUrl = "https://services.gradle.org/distributions/gradle-$GradleVersion-bin.zip"

    Invoke-WebRequest -Uri $GradleUrl -OutFile $GradleZip

    Write-Host "Extracting Gradle..."

    Expand-Archive `
        -Path $GradleZip `
        -DestinationPath $Tools `
        -Force
}

if (-not (Test-Path $GradleExe)) {
    throw "Gradle executable not found: $GradleExe"
}

Write-Host ""
Write-Host "Gradle executable:"
Write-Host $GradleExe

# --------------------------------------------------
# Step 2 - Generate CycloneDX SBOM files
# --------------------------------------------------

Write-Host ""
Write-Host "[2/4] Generating CycloneDX SBOM files..." -ForegroundColor Cyan

$ProjectFolders = Get-ChildItem $Projects -Directory | Sort-Object Name

if ($ProjectFolders.Count -ne 10) {
    throw "Expected 10 projects but found $($ProjectFolders.Count)."
}

foreach ($Project in $ProjectFolders) {

    Write-Host ""
    Write-Host "Generating SBOM: $($Project.Name)" -ForegroundColor Green

    Push-Location $Project.FullName

    try {

        & $GradleExe cyclonedxBom --no-daemon

        if ($LASTEXITCODE -ne 0) {
            throw "Gradle failed for project: $($Project.Name)"
        }

        $GeneratedSbom = Join-Path `
            $Project.FullName `
            "build\reports\cyclonedx\bom.json"

        if (-not (Test-Path $GeneratedSbom)) {

            Write-Host ""
            Write-Host "Searching for generated bom.json..."

            $FoundBom = Get-ChildItem `
                -Path $Project.FullName `
                -Filter "bom.json" `
                -Recurse `
                -ErrorAction SilentlyContinue |
                Select-Object -First 1

            if ($FoundBom) {
                $GeneratedSbom = $FoundBom.FullName
            }
            else {
                throw "Could not find bom.json for $($Project.Name)"
            }
        }

        # Make absolutely sure destination directory exists
        [System.IO.Directory]::CreateDirectory($SbomDir) | Out-Null

        $Destination = Join-Path `
            $SbomDir `
            "$($Project.Name).json"

        Copy-Item `
            -LiteralPath $GeneratedSbom `
            -Destination $Destination `
            -Force

        if (-not (Test-Path $Destination)) {
            throw "SBOM copy failed: $Destination"
        }

        Write-Host "Saved:"
        Write-Host $Destination
    }
    finally {
        Pop-Location
    }
}

# --------------------------------------------------
# Verify 10 SBOM files exist
# --------------------------------------------------

$SbomFiles = Get-ChildItem `
    $SbomDir `
    -Filter "*.json" `
    -File

Write-Host ""
Write-Host "Generated SBOM count: $($SbomFiles.Count)"

if ($SbomFiles.Count -ne 10) {
    throw "Expected 10 SBOM files but found $($SbomFiles.Count)."
}

# --------------------------------------------------
# Step 3 - Query OSV
# --------------------------------------------------

Write-Host ""
Write-Host "[3/4] Querying OSV vulnerability database..." -ForegroundColor Cyan

$CollectScript = Join-Path $Scripts "collect_osv.py"

if (-not (Test-Path $CollectScript)) {
    throw "Missing file: $CollectScript"
}

python $CollectScript

if ($LASTEXITCODE -ne 0) {
    throw "collect_osv.py failed."
}

# --------------------------------------------------
# Step 4 - Analyze results
# --------------------------------------------------

Write-Host ""
Write-Host "[4/4] Analyzing results..." -ForegroundColor Cyan

$AnalyzeScript = Join-Path $Scripts "analyze_results.py"

if (-not (Test-Path $AnalyzeScript)) {
    throw "Missing file: $AnalyzeScript"
}

python $AnalyzeScript

if ($LASTEXITCODE -ne 0) {
    throw "analyze_results.py failed."
}

# --------------------------------------------------
# Final
# --------------------------------------------------

Write-Host ""
Write-Host "====================================="
Write-Host " T10 experiment completed"
Write-Host "====================================="
Write-Host ""

Write-Host "Measurements:"
Write-Host (Join-Path $Raw "measurements.csv")

Write-Host ""
Write-Host "Summary:"
Write-Host (Join-Path $Analysis "results_summary.md")

Write-Host ""
Write-Host "Raw SBOM:"
Write-Host $SbomDir

Write-Host ""
Write-Host "Raw OSV:"
Write-Host $OsvDir

Write-Host ""
Write-Host "Run verification with:"
Write-Host "python .\scripts\verify_package.py"
Write-Host ""