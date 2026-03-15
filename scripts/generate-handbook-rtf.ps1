param(
    [string]$InputPath = "docs/Produkthandbuch-Ustafix.md",
    [string]$OutputPath = "docs/Produkthandbuch-Ustafix_FINAL.rtf",
    [string]$LogoPath = "D:\01 Antigrafity Projekte\ustafix.app\WMC_Logo_Schriftzug-IT (1).png"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Convert-ToRtfText {
    param([string]$Text)

    if ($null -eq $Text) {
        return ""
    }

    $escaped = $Text.Replace('\\', '\\\\').Replace('{', '\\{').Replace('}', '\\}')
    return $escaped
}

function Convert-PathToRtfLiteral {
    param([string]$Path)

    if ([string]::IsNullOrWhiteSpace($Path)) {
        return ""
    }

    return (Convert-ToRtfText $Path)
}

function Add-RtfTable {
    param(
        [System.Collections.Generic.List[string]]$Rtf,
        [string[]]$TableLines
    )

    $rows = [System.Collections.Generic.List[object]]::new()
    foreach ($line in $TableLines) {
        $trimmed = $line.Trim()
        if (-not $trimmed) { continue }
        if ($trimmed -match '^\|?\s*:?-{3,}') { continue }

        $cells = $trimmed.Trim('|').Split('|') | ForEach-Object { $_.Trim() }
        $null = $rows.Add($cells)
    }

    if ($rows.Count -eq 0) { return }

    $colCount = ($rows | ForEach-Object { $_.Count } | Measure-Object -Maximum).Maximum
    if ($colCount -lt 1) { return }

    $tableWidth = 9300
    $cellWidth = [Math]::Floor($tableWidth / $colCount)

    $null = $Rtf.Add('\\pard\\sa120')

    for ($r = 0; $r -lt $rows.Count; $r++) {
        $row = $rows[$r]
        $null = $Rtf.Add('\\trowd\\trgaph70\\trleft0')

        $cellRight = 0
        for ($c = 0; $c -lt $colCount; $c++) {
            $cellRight += $cellWidth
            if ($c -eq ($colCount - 1)) {
                $cellRight = $tableWidth
            }
            $null = $Rtf.Add("\\cellx$cellRight")
        }

        for ($c = 0; $c -lt $colCount; $c++) {
            $text = if ($c -lt $row.Count) { [string]$row[$c] } else { "" }
            $escaped = Convert-ToRtfText $text
            if ($r -eq 0) {
                $null = $Rtf.Add("\\intbl\\b\\fs24 $escaped\\b0\\cell")
            } else {
                $null = $Rtf.Add("\\intbl\\fs24 $escaped\\cell")
            }
        }

        $null = $Rtf.Add('\\row')
    }

    $null = $Rtf.Add('\\pard\\sa120\\par')
}

$inputFullPath = Join-Path (Get-Location) $InputPath
$outputFullPath = Join-Path (Get-Location) $OutputPath

if (-not (Test-Path $inputFullPath)) {
    throw "Input markdown not found: $inputFullPath"
}

$logoLiteral = Convert-PathToRtfLiteral $LogoPath
$lines = Get-Content -Path $inputFullPath -Encoding UTF8
$rtf = [System.Collections.Generic.List[string]]::new()

$null = $rtf.Add('{\\rtf1\\ansi\\ansicpg65001\\deff0')
$null = $rtf.Add('{\\fonttbl{\\f0 Arial Narrow;}{\\f1 Consolas;}}')
$null = $rtf.Add('{\\colortbl;\\red34\\green34\\blue34;\\red90\\green90\\blue90;}')
$null = $rtf.Add('{\\stylesheet')
$null = $rtf.Add('{\\s0\\ql\\f0\\fs24 Normal;}')
$null = $rtf.Add('{\\s1\\sb240\\sa120\\b\\f0\\fs32 Heading 1;}')
$null = $rtf.Add('{\\s2\\sb180\\sa90\\b\\f0\\fs28 Heading 2;}')
$null = $rtf.Add('{\\s3\\sb120\\sa60\\b\\f0\\fs24 Heading 3;}')
$null = $rtf.Add('}')
$null = $rtf.Add('\\paperw11907\\paperh16840\\margl1134\\margr1134\\margt1134\\margb1134')
$null = $rtf.Add('\\viewkind4\\uc1\\pard\\lang1031\\f0\\fs24')

if (Test-Path $LogoPath) {
    $headerWithLogo = '{\\header\\pard\\ql\\fs20 {\\field{\\*\\fldinst INCLUDEPICTURE "' + $logoLiteral + '" \\d}{\\fldrslt [WAMOCON-Logo]}}\\tab WAMOCON GmbH | Produkthandbuch Ustafix.app | Vertraulich\\par}'
    $null = $rtf.Add($headerWithLogo)
} else {
    $null = $rtf.Add('{\\header\\pard\\ql\\fs20 WAMOCON GmbH | Produkthandbuch Ustafix.app | Vertraulich\\par}')
}

$null = $rtf.Add('{\\footer\\pard\\qc\\cf2\\fs18 Seite {\\field{\\*\\fldinst PAGE}} / {\\field{\\*\\fldinst NUMPAGES}}\\par}')

$null = $rtf.Add('\\pard\\qc\\cf1\\b\\fs40 USTAFIX.APP\\par')
$null = $rtf.Add('\\pard\\qc\\b\\fs32 Produkt-Handbuch\\par')
$null = $rtf.Add('\\pard\\qc\\b0\\fs24 Version 1.0 \\line Stand: Marz 2026\\par')
$null = $rtf.Add('\\pard\\qc\\b\\fs24 WAMOCON GmbH\\par')
$null = $rtf.Add('\\pard\\qc\\b0\\fs24 Professionelle Technische Dokumentation\\par')
$null = $rtf.Add('\\page')

$null = $rtf.Add('\\pard\\s1\\qc Inhaltsverzeichnis\\par')
$null = $rtf.Add('{\\field{\\*\\fldinst TOC \\o "1-3" \\h \\z \\u}{\\fldrslt Inhaltsverzeichnis wird in Microsoft Word aktualisiert.}}')
$null = $rtf.Add('\\page')

$isInCodeBlock = $false
$skipManualToc = $false
$tableLines = [System.Collections.Generic.List[string]]::new()

foreach ($line in $lines) {
    $trimmed = $line.TrimEnd()

    if ($trimmed -match '^##\s+INHALTSVERZEICHNIS') {
        $skipManualToc = $true
        continue
    }

    if ($skipManualToc) {
        if ($trimmed -eq '---') {
            $skipManualToc = $false
        }
        continue
    }

    if ($trimmed -match '^```') {
        if ($tableLines.Count -gt 0) {
            Add-RtfTable -Rtf $rtf -TableLines $tableLines.ToArray()
            $tableLines.Clear()
        }

        $isInCodeBlock = -not $isInCodeBlock
        continue
    }

    if ($isInCodeBlock) {
        $escaped = Convert-ToRtfText $trimmed
        $null = $rtf.Add("\\pard\\li360\\f1\\fs20 $escaped\\par")
        continue
    }

    if ($trimmed.StartsWith('|')) {
        $null = $tableLines.Add($trimmed)
        continue
    }

    if ($tableLines.Count -gt 0) {
        Add-RtfTable -Rtf $rtf -TableLines $tableLines.ToArray()
        $tableLines.Clear()
    }

    if ([string]::IsNullOrWhiteSpace($trimmed)) {
        $null = $rtf.Add('\\pard\\fs24\\par')
        continue
    }

    if ($trimmed -eq '---') {
        $null = $rtf.Add('\\pard\\brdrb\\brdrs\\brdrw10\\brsp20\\par')
        continue
    }

    if ($trimmed -match '^#\s+(.+)$') {
        $title = Convert-ToRtfText $Matches[1]
        $null = $rtf.Add("\\page\\pard\\s1\\outlinelevel0 $title\\par")
        continue
    }

    if ($trimmed -match '^##\s+(.+)$') {
        $title = Convert-ToRtfText $Matches[1]
        $null = $rtf.Add("\\pard\\s2\\outlinelevel1 $title\\par")
        continue
    }

    if ($trimmed -match '^###\s+(.+)$') {
        $title = Convert-ToRtfText $Matches[1]
        $null = $rtf.Add("\\pard\\s3\\outlinelevel2 $title\\par")
        continue
    }

    if ($trimmed -match '^[-*]\s+(.+)$') {
        $itemText = Convert-ToRtfText $Matches[1]
        $null = $rtf.Add("\\pard\\li720\\fi-360\\fs24 \\bullet\\tab $itemText\\par")
        continue
    }

    if ($trimmed -match '^\d+\.\s+(.+)$') {
        $itemText = Convert-ToRtfText $trimmed
        $null = $rtf.Add("\\pard\\li540\\fi-240\\fs24 $itemText\\par")
        continue
    }

    if ($trimmed -match '^>\s*(.+)$') {
        $quote = Convert-ToRtfText $Matches[1]
        $null = $rtf.Add("\\pard\\li360\\i\\fs24 $quote\\i0\\par")
        continue
    }

    $escaped = Convert-ToRtfText $trimmed
    $null = $rtf.Add("\\pard\\sl300\\slmult1\\fs24 $escaped\\par")
}

if ($tableLines.Count -gt 0) {
    Add-RtfTable -Rtf $rtf -TableLines $tableLines.ToArray()
    $tableLines.Clear()
}

$null = $rtf.Add('}')

$outputDir = Split-Path -Path $outputFullPath -Parent
if (-not (Test-Path $outputDir)) {
    New-Item -Path $outputDir -ItemType Directory -Force | Out-Null
}

[System.IO.File]::WriteAllText($outputFullPath, ($rtf -join "`r`n"), [System.Text.UTF8Encoding]::new($false))
Write-Output "RTF generated at $outputFullPath"
