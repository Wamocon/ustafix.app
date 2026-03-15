param(
  [string]$MarkdownPath = "D:\01 Antigrafity Projekte\ustafix.app\docs\Produkthandbuch-Ustafix.md",
  [string]$OutputPath = "D:\01 Antigrafity Projekte\ustafix.app\docs\Produkthandbuch-Ustafix_WAMOCON.docx",
  [string]$LogoPath = "D:\01 Antigrafity Projekte\ustafix.app\.tmp-wamocon-logo.png",
  [string]$StatusPath = "D:\01 Antigrafity Projekte\ustafix.app\docs\export-handbook-status.txt"
)

$ErrorActionPreference = "Stop"

$wdStyleNormal = -1
$wdStyleHeading1 = -2
$wdStyleHeading2 = -3
$wdStyleHeading3 = -4
$wdStyleTitle = -63
$wdCollapseEnd = 0
$wdHeaderFooterPrimary = 1
$wdFieldEmpty = -1
$wdPageBreak = 7
$wdLineSpaceSingle = 0
$wdAlignParagraphLeft = 0
$wdAlignParagraphCenter = 1
$wdAutoFitContent = 1
$wdPreferredWidthPercent = 2
$wdSaveFormatDocumentDefault = 16

function Add-Paragraph {
  param(
    $Document,
    [string]$Text,
    [int]$Style = $wdStyleNormal,
    [int]$Alignment = $wdAlignParagraphLeft,
    [switch]$Bold,
    [Nullable[int]]$FontSize = $null,
    [string]$FontName = "Arial Narrow"
  )

  $range = $Document.Content
  $range.Collapse($wdCollapseEnd)
  if ($range.Start -gt 0) {
    $range.InsertParagraphAfter() | Out-Null
    $range.Collapse($wdCollapseEnd)
  }

  $range.Text = $Text
  $range.Style = $Document.Styles.Item($Style)
  $range.ParagraphFormat.Alignment = $Alignment
  $range.Font.Name = $FontName
  if ($FontSize.HasValue) {
    $range.Font.Size = $FontSize.Value
  }
  $range.Font.Bold = [int]($Bold.IsPresent)
  $range.InsertParagraphAfter() | Out-Null
}

function Add-TableFromMarkdown {
  param(
    $Document,
    [string[]]$TableLines
  )

  $rows = @()
  foreach ($line in $TableLines) {
    if ($line -match '^\|?\s*:?-{3,}') {
      continue
    }
    $trimmed = $line.Trim()
    if (-not $trimmed) {
      continue
    }
    $cells = $trimmed.Trim('|').Split('|') | ForEach-Object { $_.Trim() }
    $rows += ,@($cells)
  }

  if ($rows.Count -eq 0) {
    return
  }

  $colCount = ($rows | ForEach-Object { $_.Count } | Measure-Object -Maximum).Maximum
  $range = $Document.Content
  $range.Collapse($wdCollapseEnd)
  if ($range.Start -gt 0) {
    $range.InsertParagraphAfter() | Out-Null
    $range.Collapse($wdCollapseEnd)
  }

  $table = $Document.Tables.Add($range, $rows.Count, $colCount)
  $table.Style = "Table Grid"
  $table.PreferredWidthType = $wdPreferredWidthPercent
  $table.PreferredWidth = 100
  $table.AutoFitBehavior($wdAutoFitContent) | Out-Null

  for ($r = 1; $r -le $rows.Count; $r++) {
    $row = $rows[$r - 1]
    for ($c = 1; $c -le $colCount; $c++) {
      $text = if ($c -le $row.Count) { [string]$row[$c - 1] } else { "" }
      $cellRange = $table.Cell($r, $c).Range
      $cellRange.Text = $text
      $cellRange.Font.Name = "Arial Narrow"
      $cellRange.Font.Size = 12
      if ($r -eq 1) {
        $cellRange.Font.Bold = 1
      }
    }
  }

  $table.Rows.Alignment = $wdAlignParagraphLeft
  $table.Borders.Enable = 1

  $end = $Document.Content
  $end.Collapse($wdCollapseEnd)
  $end.InsertParagraphAfter() | Out-Null
}

function Add-CodeBlock {
  param(
    $Document,
    [string[]]$CodeLines
  )

  foreach ($codeLine in $CodeLines) {
    $range = $Document.Content
    $range.Collapse($wdCollapseEnd)
    if ($range.Start -gt 0) {
      $range.InsertParagraphAfter() | Out-Null
      $range.Collapse($wdCollapseEnd)
    }
    $range.Text = $codeLine
    $range.Style = $Document.Styles.Item($wdStyleNormal)
    $range.Font.Name = "Consolas"
    $range.Font.Size = 10
    $range.ParagraphFormat.LeftIndent = 18
    $range.ParagraphFormat.SpaceAfter = 3
    $range.InsertParagraphAfter() | Out-Null
  }

  $end = $Document.Content
  $end.Collapse($wdCollapseEnd)
  $end.InsertParagraphAfter() | Out-Null
}

if (!(Test-Path $MarkdownPath)) {
  throw "Markdown file not found: $MarkdownPath"
}

Set-Content -Path $StatusPath -Value "START $(Get-Date -Format s)" -Encoding UTF8

$lines = Get-Content -Path $MarkdownPath -Encoding UTF8

$title = "USTAFIX.APP"
$subtitle = "Produkt-Handbuch"
$versionLine = "Version 1.0 · Stand: März 2026"

if ($lines.Length -ge 1 -and $lines[0] -match '^#\s+(.+)$') { $title = $Matches[1] }
if ($lines.Length -ge 2 -and $lines[1] -match '^##\s+(.+)$') { $subtitle = $Matches[1] }
if ($lines.Length -ge 3 -and $lines[2] -match '^###\s+(.+)$') { $versionLine = $Matches[1] }

$word = $null
$document = $null

try {
  $word = New-Object -ComObject Word.Application
  $word.Visible = $false
  $document = $word.Documents.Add()

  $document.Styles.Item($wdStyleNormal).Font.Name = "Arial Narrow"
  $document.Styles.Item($wdStyleNormal).Font.Size = 12
  $document.Styles.Item($wdStyleNormal).ParagraphFormat.SpaceAfter = 6
  $document.Styles.Item($wdStyleNormal).ParagraphFormat.LineSpacingRule = $wdLineSpaceSingle

  $document.Styles.Item($wdStyleHeading1).Font.Name = "Arial Narrow"
  $document.Styles.Item($wdStyleHeading1).Font.Size = 16
  $document.Styles.Item($wdStyleHeading1).Font.Bold = 1
  $document.Styles.Item($wdStyleHeading1).ParagraphFormat.SpaceBefore = 12
  $document.Styles.Item($wdStyleHeading1).ParagraphFormat.SpaceAfter = 6

  $document.Styles.Item($wdStyleHeading2).Font.Name = "Arial Narrow"
  $document.Styles.Item($wdStyleHeading2).Font.Size = 14
  $document.Styles.Item($wdStyleHeading2).Font.Bold = 1
  $document.Styles.Item($wdStyleHeading2).ParagraphFormat.SpaceBefore = 10
  $document.Styles.Item($wdStyleHeading2).ParagraphFormat.SpaceAfter = 4

  $document.Styles.Item($wdStyleHeading3).Font.Name = "Arial Narrow"
  $document.Styles.Item($wdStyleHeading3).Font.Size = 12
  $document.Styles.Item($wdStyleHeading3).Font.Bold = 1

  Add-Paragraph -Document $document -Text $title -Style $wdStyleTitle -Alignment $wdAlignParagraphCenter -Bold -FontSize 20
  Add-Paragraph -Document $document -Text $subtitle -Style $wdStyleHeading1 -Alignment $wdAlignParagraphCenter -FontSize 16
  Add-Paragraph -Document $document -Text $versionLine -Style $wdStyleNormal -Alignment $wdAlignParagraphCenter -FontSize 12
  Add-Paragraph -Document $document -Text "WAMOCON GmbH" -Style $wdStyleNormal -Alignment $wdAlignParagraphCenter -Bold -FontSize 12
  Add-Paragraph -Document $document -Text "Produkt-Dokumentation" -Style $wdStyleNormal -Alignment $wdAlignParagraphCenter -FontSize 12

  $tocRange = $document.Content
  $tocRange.Collapse($wdCollapseEnd)
  $tocRange.InsertBreak($wdPageBreak)
  $tocRange.Collapse($wdCollapseEnd)
  $tocRange.Text = "Inhaltsverzeichnis"
  $tocRange.Style = $document.Styles.Item($wdStyleHeading1)
  $tocRange.InsertParagraphAfter() | Out-Null

  $tocInsertRange = $document.Content
  $tocInsertRange.Collapse($wdCollapseEnd)
  $document.TablesOfContents.Add($tocInsertRange, $true, 1, 3, $true, $true, $false, $true) | Out-Null

  $contentStart = $document.Content
  $contentStart.Collapse($wdCollapseEnd)
  $contentStart.InsertBreak($wdPageBreak)

  $skipManualToc = $false
  $inCodeBlock = $false
  $codeLines = @()
  $tableLines = @()

  for ($i = 0; $i -lt $lines.Length; $i++) {
    $line = $lines[$i]

    if ($i -lt 5) {
      continue
    }

    if ($line -match '^##\s+INHALTSVERZEICHNIS') {
      $skipManualToc = $true
      continue
    }

    if ($skipManualToc) {
      if ($line.Trim() -eq '---') {
        $skipManualToc = $false
      }
      continue
    }

    if ($line.Trim() -eq '```') {
      if ($inCodeBlock) {
        Add-CodeBlock -Document $document -CodeLines $codeLines
        $codeLines = @()
        $inCodeBlock = $false
      } else {
        $inCodeBlock = $true
      }
      continue
    }

    if ($inCodeBlock) {
      $codeLines += $line
      continue
    }

    if ($line.Trim().StartsWith('|')) {
      $tableLines += $line
      continue
    }

    if ($tableLines.Count -gt 0) {
      Add-TableFromMarkdown -Document $document -TableLines $tableLines
      $tableLines = @()
    }

    $trimmed = $line.Trim()
    if (-not $trimmed) {
      continue
    }

    if ($trimmed -eq '---') {
      continue
    }

    if ($trimmed -match '^#\s+(.+)$') {
      Add-Paragraph -Document $document -Text $Matches[1] -Style $wdStyleHeading1 -FontSize 16
      continue
    }

    if ($trimmed -match '^##\s+(.+)$') {
      Add-Paragraph -Document $document -Text $Matches[1] -Style $wdStyleHeading2 -FontSize 14
      continue
    }

    if ($trimmed -match '^###\s+(.+)$') {
      Add-Paragraph -Document $document -Text $Matches[1] -Style $wdStyleHeading3 -FontSize 12
      continue
    }

    if ($trimmed -match '^[-*]\s+(.+)$') {
      Add-Paragraph -Document $document -Text ("• " + $Matches[1]) -Style $wdStyleNormal -FontSize 12
      continue
    }

    if ($trimmed -match '^\d+\.\s+(.+)$') {
      Add-Paragraph -Document $document -Text $trimmed -Style $wdStyleNormal -FontSize 12
      continue
    }

    Add-Paragraph -Document $document -Text $trimmed -Style $wdStyleNormal -FontSize 12
  }

  if ($tableLines.Count -gt 0) {
    Add-TableFromMarkdown -Document $document -TableLines $tableLines
  }

  $header = $document.Sections.Item(1).Headers.Item($wdHeaderFooterPrimary).Range
  $header.Text = ""
  if (Test-Path $LogoPath) {
    $null = $header.InlineShapes.AddPicture($LogoPath)
    if ($header.InlineShapes.Count -gt 0) {
      $header.InlineShapes.Item(1).Width = 85
      $header.InlineShapes.Item(1).Height = 25
    }
    $header.InsertAfter("    WAMOCON GmbH | Produkthandbuch Ustafix.app")
  } else {
    $header.Text = "WAMOCON GmbH | Produkthandbuch Ustafix.app"
  }
  $header.Font.Name = "Arial Narrow"
  $header.Font.Size = 10
  $header.ParagraphFormat.Alignment = $wdAlignParagraphLeft

  foreach ($section in $document.Sections) {
    $footer = $section.Footers.Item($wdHeaderFooterPrimary).Range
    $footer.Text = "Seite "
    $footer.Collapse($wdCollapseEnd)
    $footer.Fields.Add($footer, $wdFieldEmpty, "PAGE", $true) | Out-Null
    $footer.Collapse($wdCollapseEnd)
    $footer.InsertAfter(" von ")
    $footer.Collapse($wdCollapseEnd)
    $footer.Fields.Add($footer, $wdFieldEmpty, "NUMPAGES", $true) | Out-Null
    $footer.Font.Name = "Arial Narrow"
    $footer.Font.Size = 10
    $footer.ParagraphFormat.Alignment = $wdAlignParagraphCenter
  }

  $document.TablesOfContents.Item(1).Update() | Out-Null
  $document.Fields.Update() | Out-Null
  $document.SaveAs([ref]$OutputPath, [ref]$wdSaveFormatDocumentDefault)
  Set-Content -Path $StatusPath -Value @(
    "SUCCESS $(Get-Date -Format s)",
    "OUTPUT=$OutputPath"
  ) -Encoding UTF8
  Write-Output "Created: $OutputPath"
}
catch {
  Set-Content -Path $StatusPath -Value @(
    "ERROR $(Get-Date -Format s)",
    $_.Exception.Message,
    $_.ScriptStackTrace
  ) -Encoding UTF8
  throw
}
finally {
  if ($document -ne $null) {
    $document.Close() | Out-Null
  }
  if ($word -ne $null) {
    $word.Quit()
  }
  [System.GC]::Collect()
  [System.GC]::WaitForPendingFinalizers()
}
