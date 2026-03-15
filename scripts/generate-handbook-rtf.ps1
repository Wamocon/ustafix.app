param(
    [string]$InputPath = "docs/Produkthandbuch-Ustafix.md",
    [string]$OutputPath = "docs/Produkthandbuch-Ustafix_WAMOCON.rtf"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Convert-ToRtfText {
    param([string]$Text)

    if ($null -eq $Text) {
        return ""
    }

    $escaped = $Text.Replace('\', '\\').Replace('{', '\{').Replace('}', '\}')
    return $escaped
}

$inputFullPath = Join-Path (Get-Location) $InputPath
$outputFullPath = Join-Path (Get-Location) $OutputPath

$lines = Get-Content -Path $inputFullPath -Encoding UTF8
$rtf = [System.Collections.Generic.List[string]]::new()

$null = $rtf.Add('{\rtf1\ansi\ansicpg65001\deff0')
$null = $rtf.Add('{\fonttbl{\f0 Arial Narrow;}}')
$null = $rtf.Add('{\colortbl;\red34\green34\blue34;\red90\green90\blue90;}')
$null = $rtf.Add('\paperw11907\paperh16840\margl1134\margr1134\margt1134\margb1134')
$null = $rtf.Add('\viewkind4\uc1\pard\lang1031\f0\fs24')
$null = $rtf.Add('{\header\pard\qr\cf1\b\fs20 WAMOCON GmbH\line\b0\fs18 Professionelle Technische Dokumentation\par}')
$null = $rtf.Add('{\footer\pard\qc\cf2\fs18 Seite {\field{\*\fldinst PAGE}} bis {\field{\*\fldinst NUMPAGES}}\par}')
$null = $rtf.Add('\pard\qc\cf1\b\fs40 Produkthandbuch Ustafix.app\par')
$null = $rtf.Add('\pard\qc\b0\fs24 WAMOCON Layout\line Version 1.0\line Stand: Marz 2026\par')
$null = $rtf.Add('\pard\qc\fs20 Technische Dokumentation fur Produkt, Betrieb, Compliance und Audit\par')
$null = $rtf.Add('\page')
$null = $rtf.Add('\pard\sb240\sa120\b\fs32 Inhaltsverzeichnis\par')
$null = $rtf.Add('{\field{\*\fldinst TOC \\o "1-2" \\h \\z \\u}{\fldrslt Inhaltsverzeichnis wird in Microsoft Word aktualisiert.}}')
$null = $rtf.Add('\par')

$isInCodeBlock = $false
$firstHeadingSeen = $false

foreach ($line in $lines) {
    if ($line -match '^```') {
        $isInCodeBlock = -not $isInCodeBlock
        continue
    }

    $trimmed = $line.TrimEnd()
    $escaped = Convert-ToRtfText $trimmed

    if ([string]::IsNullOrWhiteSpace($trimmed)) {
        $null = $rtf.Add('\pard\fs24\par')
        continue
    }

    if ($isInCodeBlock) {
        $null = $rtf.Add("\\pard\\li360\\sl240\\slmult1\\fs22 $escaped\\par")
        continue
    }

    if ($trimmed -match '^# (.+)$') {
        if ($firstHeadingSeen) {
            $null = $rtf.Add('\\page')
        }

        $firstHeadingSeen = $true
        $title = Convert-ToRtfText $Matches[1].ToUpperInvariant()
        $null = $rtf.Add("\\pard\\sb240\\sa120\\cf1\\b\\fs32 $title\\par")
        continue
    }

    if ($trimmed -match '^## (.+)$') {
        $title = Convert-ToRtfText $Matches[1]
        $null = $rtf.Add("\\pard\\sb180\\sa90\\cf1\\b\\fs28 $title\\par")
        continue
    }

    if ($trimmed -match '^### (.+)$') {
        $title = Convert-ToRtfText $Matches[1]
        $null = $rtf.Add("\\pard\\sb120\\sa60\\cf1\\b\\fs24 $title\\par")
        continue
    }

    if ($trimmed -eq '---') {
        $null = $rtf.Add('\\pard\\brdrb\\brdrs\\brdrw10\\brsp20\\par')
        continue
    }

    if ($trimmed -match '^\d+\.\s+(.+)$') {
        $itemText = Convert-ToRtfText $trimmed
        $null = $rtf.Add("\\pard\\li540\\fi-240\\fs24 $itemText\\par")
        continue
    }

    if ($trimmed -match '^-\s+(.+)$') {
        $itemText = Convert-ToRtfText $Matches[1]
        $null = $rtf.Add("\\pard\\li720\\fi-360\\fs24 \\bullet\\tab $itemText\\par")
        continue
    }

    if ($trimmed.StartsWith('|')) {
        $null = $rtf.Add("\\pard\\sl240\\slmult1\\fs22 $escaped\\par")
        continue
    }

    if ($trimmed -match '^\*(.+)\*$') {
        $italicText = Convert-ToRtfText $Matches[1]
        $null = $rtf.Add("\\pard\\i\\fs24 $italicText\\i0\\par")
        continue
    }

    $null = $rtf.Add("\\pard\\sl300\\slmult1\\fs24 $escaped\\par")
}

$null = $rtf.Add('}')

[System.IO.File]::WriteAllText($outputFullPath, ($rtf -join "`r`n"), [System.Text.UTF8Encoding]::new($false))
Write-Output "RTF generated at $outputFullPath"