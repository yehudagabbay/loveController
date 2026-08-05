$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent (Split-Path -Parent $PSCommandPath)
$secretsPath = Join-Path $root 'appsettings.Secrets.json'
$config = Get-Content -Raw -Encoding UTF8 $secretsPath | ConvertFrom-Json
$connectionString = $config.ConnectionStrings.DefaultConnection

$languages = @('he', 'en', 'es', 'fr', 'ar', 'ru', 'zh')
$translationTargets = @{
    en = 'en'
    es = 'es'
    fr = 'fr'
    ar = 'ar'
    ru = 'ru'
    zh = 'zh-CN'
}

function Normalize-CardText {
    param(
        [Parameter(Mandatory = $true)][string] $Text,
        [Parameter(Mandatory = $true)][string] $LanguageCode
    )

    $value = $Text -replace "[\r\n]+", " "
    $value = $value -replace "[\-‐‑‒–—―]", ", "
    $value = $value -replace "\s+", " "
    $value = $value -replace "\s+([,.;:!?؟،。！？])", '$1'
    $value = $value.Trim()

    switch ($LanguageCode) {
        'en' {
            $value = $value -replace '(?i)\bspouse\b', 'partner'
            $value = $value -replace '(?i)\bgas mechanism\b', 'accelerator'
            $value = $value -replace '(?i)\bsexual gas\b', 'sexual accelerator'
            $value = $value -replace '(?i)\bgas pedal\b', 'accelerator'
            $value = $value -replace '(?i)\bgas\b', 'accelerator'
            $value = $value -replace '(?i)\bbrakes\b', 'brake'
        }
        'es' {
            $value = $value -replace '(?i)\bcónyuge\b', 'pareja'
            $value = $value -replace '(?i)\bconyuge\b', 'pareja'
            $value = $value -replace '(?i)\bmecanismo de gas\b', 'acelerador'
            $value = $value -replace '(?i)\bgas\b', 'acelerador'
            $value = $value -replace '(?i)\bfrenos\b', 'freno'
        }
        'fr' {
            $value = $value -replace '(?i)\bconjoint\b', 'partenaire'
            $value = $value -replace '(?i)\bépoux\b', 'partenaire'
            $value = $value -replace '(?i)\bepoux\b', 'partenaire'
            $value = $value -replace '(?i)\bmécanisme de gaz\b', 'accélérateur'
            $value = $value -replace '(?i)\bmecanisme de gaz\b', 'accélérateur'
            $value = $value -replace '(?i)\bgaz\b', 'accélérateur'
        }
        'ru' {
            $value = $value -replace '(?i)газовый механизм', 'внутренний ускоритель'
            $value = $value -replace '(?i)\bгаз\b', 'внутренний ускоритель'
        }
        'ar' {
            $value = $value -replace 'آلية الغاز', 'محرك الرغبة'
            $value = $value -replace 'الغاز', 'محرك الرغبة'
        }
        'zh' {
            $value = $value -replace '气体机制', '性欲加速器'
            $value = $value -replace '气体', '性欲加速器'
        }
    }

    $value = $value -replace "\s+", " "
    return $value.Trim()
}

function Invoke-GoogleTranslate {
    param(
        [Parameter(Mandatory = $true)][string] $Text,
        [Parameter(Mandatory = $true)][string] $TargetLanguage
    )

    $encoded = [uri]::EscapeDataString($Text)
    $url = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=iw&tl=$TargetLanguage&dt=t&q=$encoded"
    $lastError = $null

    for ($attempt = 1; $attempt -le 5; $attempt++) {
        try {
            $raw = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 30
            $json = ConvertFrom-Json $raw.Content
            $translated = ($json[0] | ForEach-Object { $_[0] }) -join ''

            if ([string]::IsNullOrWhiteSpace($translated)) {
                throw "Empty translation returned for target $TargetLanguage"
            }

            return $translated
        } catch {
            $lastError = $_
            Start-Sleep -Seconds ([Math]::Min(20, $attempt * 3))
        }
    }

    throw $lastError
}

function Invoke-GoogleTranslateBatch {
    param(
        [Parameter(Mandatory = $true)][array] $Rows,
        [Parameter(Mandatory = $true)][string] $TargetLanguage
    )

    $body = ($Rows | ForEach-Object { "[[CARD$($_.CardID)]] $($_.SourceText)" }) -join "`n"
    $encoded = [uri]::EscapeDataString($body)
    $url = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=iw&tl=$TargetLanguage&dt=t&q=$encoded"
    $lastError = $null

    for ($attempt = 1; $attempt -le 5; $attempt++) {
        try {
            $raw = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 45
            $json = ConvertFrom-Json $raw.Content
            $translated = ($json[0] | ForEach-Object { $_[0] }) -join ''

            if ([string]::IsNullOrWhiteSpace($translated)) {
                throw "Empty batch translation returned for target $TargetLanguage"
            }

            $result = @{}
            $matches = [regex]::Matches($translated, '(?s)\[\[CARD(\d+)\]\]\s*(.*?)(?=\s*\[\[CARD\d+\]\]|$)')
            foreach ($match in $matches) {
                $result[[int]$match.Groups[1].Value] = $match.Groups[2].Value.Trim()
            }

            if ($result.Count -ne $Rows.Count) {
                throw "Batch split mismatch for target $TargetLanguage. Expected $($Rows.Count), got $($result.Count)"
            }

            return $result
        } catch {
            $lastError = $_
            Start-Sleep -Seconds ([Math]::Min(25, $attempt * 4))
        }
    }

    throw $lastError
}

$missingSql = @"
WITH langs AS (
    SELECT v.LanguageCode
    FROM (VALUES (N'he'),(N'en'),(N'es'),(N'fr'),(N'ar'),(N'ru'),(N'zh')) v(LanguageCode)
), sourceCards AS (
    SELECT
        c.CardID,
        c.ModeID,
        c.CategoryID,
        c.LevelID,
        c.IsResearchBased,
        c.CardDescription AS SourceText
    FROM dbo.Cards c
    WHERE c.IsActive = 1
      AND ISNULL(c.ModeID, 1) <> 99
)
SELECT
    c.CardID,
    c.ModeID,
    c.CategoryID,
    c.LevelID,
    c.IsResearchBased,
    c.SourceText,
    l.LanguageCode
FROM sourceCards c
CROSS JOIN langs l
WHERE NOT EXISTS (
    SELECT 1
    FROM dbo.CardTranslations t
    WHERE t.CardID = c.CardID
      AND LOWER(t.LanguageCode) = l.LanguageCode
)
ORDER BY c.CardID, l.LanguageCode;
"@

$adapter = New-Object System.Data.SqlClient.SqlDataAdapter($missingSql, $connectionString)
$missing = New-Object System.Data.DataTable
[void]$adapter.Fill($missing)

if ($missing.Rows.Count -eq 0) {
    Write-Host "No missing regular card translations found."
    exit 0
}

Write-Host "Missing rows to create: $($missing.Rows.Count)"

$translations = New-Object System.Collections.Generic.List[object]

foreach ($row in $missing.Rows) {
    if ([string]$row.LanguageCode -ne 'he') {
        continue
    }

    $cardId = [int]$row.CardID
    $sourceText = [string]$row.SourceText
    if ([string]::IsNullOrWhiteSpace($sourceText)) {
        throw "Card $cardId has empty source text"
    }

    $cleanText = Normalize-CardText -Text $sourceText -LanguageCode 'he'
    if ($cleanText.Contains('-')) {
        throw "Card $cardId language he still contains a hyphen"
    }

    $translations.Add([pscustomobject]@{
        CardID = $cardId
        LanguageCode = 'he'
        CardText = $cleanText
    })
}

foreach ($languageCode in @('en', 'es', 'fr', 'ar', 'ru', 'zh')) {
    $rowsForLanguage = @(
        $missing.Rows |
            Where-Object { [string]$_.LanguageCode -eq $languageCode } |
            ForEach-Object {
                [pscustomobject]@{
                    CardID = [int]$_.CardID
                    SourceText = [string]$_.SourceText
                }
            }
    )

    if ($rowsForLanguage.Count -eq 0) {
        continue
    }

    Write-Host "Translating $($rowsForLanguage.Count) rows to $languageCode"

    for ($offset = 0; $offset -lt $rowsForLanguage.Count; $offset += 25) {
        $end = [Math]::Min($offset + 24, $rowsForLanguage.Count - 1)
        $chunk = @($rowsForLanguage[$offset..$end])
        $translatedByCardId = $null

        try {
            $translatedByCardId = Invoke-GoogleTranslateBatch -Rows $chunk -TargetLanguage $translationTargets[$languageCode]
        } catch {
            Write-Host "Batch failed for $languageCode rows $offset to $end. Falling back to single requests."
            $translatedByCardId = @{}
            foreach ($item in $chunk) {
                $translatedByCardId[$item.CardID] = Invoke-GoogleTranslate -Text $item.SourceText -TargetLanguage $translationTargets[$languageCode]
                Start-Sleep -Milliseconds 220
            }
        }

        foreach ($item in $chunk) {
            $translatedText = $translatedByCardId[$item.CardID]
            $cleanText = Normalize-CardText -Text $translatedText -LanguageCode $languageCode

            if ([string]::IsNullOrWhiteSpace($cleanText)) {
                throw "Card $($item.CardID) language $languageCode produced empty text"
            }

            if ($cleanText.Contains('-')) {
                throw "Card $($item.CardID) language $languageCode still contains a hyphen"
            }

            $translations.Add([pscustomobject]@{
                CardID = $item.CardID
                LanguageCode = $languageCode
                CardText = $cleanText
            })
        }

        Write-Host "Prepared $([Math]::Min($offset + $chunk.Count, $rowsForLanguage.Count)) of $($rowsForLanguage.Count) for $languageCode"
        Start-Sleep -Milliseconds 400
    }
}

if ($translations.Count -ne $missing.Rows.Count) {
    throw "Prepared translation count mismatch. Expected $($missing.Rows.Count), got $($translations.Count)"
}

$connection = New-Object System.Data.SqlClient.SqlConnection($connectionString)
$connection.Open()
$transaction = $connection.BeginTransaction()

try {
    $insert = $connection.CreateCommand()
    $insert.Transaction = $transaction
    $insert.CommandTimeout = 60
    $insert.CommandText = @"
IF NOT EXISTS (
    SELECT 1
    FROM dbo.CardTranslations
    WHERE CardID = @CardID
      AND LOWER(LanguageCode) = @LanguageCode
)
BEGIN
    INSERT INTO dbo.CardTranslations
        (CardID, LanguageCode, CardText, CreatedAt, ContentText, ContentMaleSecret, ContentFemaleSecret)
    VALUES
        (@CardID, @LanguageCode, @CardText, GETDATE(), NULL, NULL, NULL);
END
"@

    [void]$insert.Parameters.Add('@CardID', [System.Data.SqlDbType]::Int)
    [void]$insert.Parameters.Add('@LanguageCode', [System.Data.SqlDbType]::NVarChar, 10)
    [void]$insert.Parameters.Add('@CardText', [System.Data.SqlDbType]::NVarChar, -1)

    $inserted = 0
    foreach ($translation in $translations) {
        $insert.Parameters['@CardID'].Value = $translation.CardID
        $insert.Parameters['@LanguageCode'].Value = $translation.LanguageCode
        $insert.Parameters['@CardText'].Value = $translation.CardText
        $before = $connection.CreateCommand()
        $before.Transaction = $transaction
        $before.CommandText = "SELECT COUNT(*) FROM dbo.CardTranslations WHERE CardID = @CardID AND LOWER(LanguageCode) = @LanguageCode"
        [void]$before.Parameters.Add('@CardID', [System.Data.SqlDbType]::Int)
        [void]$before.Parameters.Add('@LanguageCode', [System.Data.SqlDbType]::NVarChar, 10)
        $before.Parameters['@CardID'].Value = $translation.CardID
        $before.Parameters['@LanguageCode'].Value = $translation.LanguageCode
        $existsBefore = [int]$before.ExecuteScalar()

        [void]$insert.ExecuteNonQuery()

        if ($existsBefore -eq 0) {
            $inserted++
        }
    }

    $transaction.Commit()
    Write-Host "Inserted missing regular card translations: $inserted"
} catch {
    $transaction.Rollback()
    throw
} finally {
    $connection.Close()
}

$verifySql = @"
WITH langs AS (
    SELECT v.LanguageCode
    FROM (VALUES (N'he'),(N'en'),(N'es'),(N'fr'),(N'ar'),(N'ru'),(N'zh')) v(LanguageCode)
), regularCards AS (
    SELECT CardID
    FROM dbo.Cards
    WHERE IsActive = 1
      AND ISNULL(ModeID, 1) <> 99
)
SELECT l.LanguageCode, COUNT(*) AS MissingCount
FROM regularCards c
CROSS JOIN langs l
WHERE NOT EXISTS (
    SELECT 1
    FROM dbo.CardTranslations t
    WHERE t.CardID = c.CardID
      AND LOWER(t.LanguageCode) = l.LanguageCode
)
GROUP BY l.LanguageCode
ORDER BY l.LanguageCode;
"@

$verifyAdapter = New-Object System.Data.SqlClient.SqlDataAdapter($verifySql, $connectionString)
$verify = New-Object System.Data.DataTable
[void]$verifyAdapter.Fill($verify)

if ($verify.Rows.Count -eq 0) {
    Write-Host "Verification: no missing active regular card translations remain."
} else {
    Write-Host "Verification: missing translations remain:"
    $verify | Format-Table -AutoSize
}
