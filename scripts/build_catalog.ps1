$ErrorActionPreference = "Stop"

$sourcePath = "temp_inspect_archive (7)\leetcode_problems.json"
if (-not (Test-Path $sourcePath)) {
    Write-Error "Source dataset file not found at $sourcePath"
    exit 1
}

Write-Host "Reading $sourcePath..."
$raw = Get-Content -LiteralPath $sourcePath -Raw
$items = $raw | ConvertFrom-Json
Write-Host "Found $($items.Count) problems in dataset."

# 1. Generate supabase/seed_problem_catalog.sql
$sqlPath = "supabase\seed_problem_catalog.sql"
$sb = [System.Text.StringBuilder]::new()
[void]$sb.AppendLine("-- Auto-generated problem catalog seed from LeetCode dataset")
[void]$sb.AppendLine("-- Total problems: $($items.Count)")
[void]$sb.AppendLine("INSERT INTO public.problem_catalog (platform, external_id, slug, title, difficulty, topics, url, is_active)")
[void]$sb.AppendLine("VALUES")

$count = 0
$validItems = [System.Collections.Generic.List[PSObject]]::new()

for ($i = 0; $i -lt $items.Count; $i++) {
    $item = $items[$i]
    $title = if ($item.title) { [string]$item.title } else { "" }
    if ([string]::IsNullOrWhiteSpace($title)) { continue }
    
    $slug = if ($item.titleSlug) { [string]$item.titleSlug } else { $title.ToLower().Replace(" ", "-") }
    $extId = if ($item.frontendQuestionId) { [string]$item.frontendQuestionId } else { "" }
    $diff = if ($item.difficulty -and ($item.difficulty -in @("Easy", "Medium", "Hard"))) { [string]$item.difficulty } else { "Medium" }
    $url = if ($item.url) { [string]$item.url } else { "https://leetcode.com/problems/$slug/" }
    
    $topicList = [System.Collections.Generic.List[string]]::new()
    if ($item.topics) {
        foreach ($t in $item.topics) {
            if ($t) { [void]$topicList.Add([string]$t) }
        }
    }
    
    $validItems.Add([PSCustomObject]@{
        id = "lc-" + $extId
        platform = "LeetCode"
        externalId = $extId
        slug = $slug
        title = $title
        difficulty = $diff
        topics = $topicList.ToArray()
        url = $url
    })
    
    # SQL formatting
    $escapedTitle = $title.Replace("'", "''")
    $escapedSlug = $slug.Replace("'", "''")
    $escapedExtId = $extId.Replace("'", "''")
    $escapedUrl = $url.Replace("'", "''")
    
    $topicsArraySql = "ARRAY[" + (($topicList | ForEach-Object { "'" + $_.Replace("'", "''") + "'" }) -join ",") + "]::text[]"
    if ($topicList.Count -eq 0) {
        $topicsArraySql = "'{}'::text[]"
    }
    
    $row = "  ('LeetCode', '$escapedExtId', '$escapedSlug', '$escapedTitle', '$diff', $topicsArraySql, '$escapedUrl', true)"
    if ($count -gt 0) {
        [void]$sb.AppendLine(",")
    }
    [void]$sb.Append($row)
    $count++
}

[void]$sb.AppendLine("")
[void]$sb.AppendLine("ON CONFLICT (platform, slug) DO UPDATE SET")
[void]$sb.AppendLine("  title = EXCLUDED.title,")
[void]$sb.AppendLine("  external_id = EXCLUDED.external_id,")
[void]$sb.AppendLine("  difficulty = EXCLUDED.difficulty,")
[void]$sb.AppendLine("  topics = EXCLUDED.topics,")
[void]$sb.AppendLine("  url = EXCLUDED.url,")
[void]$sb.AppendLine("  updated_at = now();")

[System.IO.File]::WriteAllText((Join-Path (Get-Location) $sqlPath), $sb.ToString(), [System.Text.Encoding]::UTF8)
Write-Host "Generated $sqlPath with $count rows."

# 2. Generate constants/catalogData.ts
# Also include famous Codeforces and CodeChef starter catalog items for variety
$cfCcItems = @(
    [PSCustomObject]@{ id = "cf-4a"; platform = "Codeforces"; externalId = "4A"; slug = "watermelon"; title = "Watermelon"; difficulty = "Easy"; topics = @("Math", "Brute Force"); url = "https://codeforces.com/problemset/problem/4/A" },
    [PSCustomObject]@{ id = "cf-71a"; platform = "Codeforces"; externalId = "71A"; slug = "way-too-long-words"; title = "Way Too Long Words"; difficulty = "Easy"; topics = @("Strings"); url = "https://codeforces.com/problemset/problem/71/A" },
    [PSCustomObject]@{ id = "cf-1a"; platform = "Codeforces"; externalId = "1A"; slug = "theatre-square"; title = "Theatre Square"; difficulty = "Easy"; topics = @("Math"); url = "https://codeforces.com/problemset/problem/1/A" },
    [PSCustomObject]@{ id = "cf-231a"; platform = "Codeforces"; externalId = "231A"; slug = "team"; title = "Team"; difficulty = "Easy"; topics = @("Brute Force", "Greedy"); url = "https://codeforces.com/problemset/problem/231/A" },
    [PSCustomObject]@{ id = "cf-158a"; platform = "Codeforces"; externalId = "158A"; slug = "next-round"; title = "Next Round"; difficulty = "Easy"; topics = @("Special Problem"); url = "https://codeforces.com/problemset/problem/158/A" },
    [PSCustomObject]@{ id = "cf-282a"; platform = "Codeforces"; externalId = "282A"; slug = "bit++"; title = "Bit++"; difficulty = "Easy"; topics = @("Implementation"); url = "https://codeforces.com/problemset/problem/282/A" },
    [PSCustomObject]@{ id = "cf-112a"; platform = "Codeforces"; externalId = "112A"; slug = "petya-and-strings"; title = "Petya and Strings"; difficulty = "Easy"; topics = @("Strings", "Implementation"); url = "https://codeforces.com/problemset/problem/112/A" },
    [PSCustomObject]@{ id = "cf-339a"; platform = "Codeforces"; externalId = "339A"; slug = "helpful-maths"; title = "Helpful Maths"; difficulty = "Easy"; topics = @("Greedy", "Strings"); url = "https://codeforces.com/problemset/problem/339/A" },
    [PSCustomObject]@{ id = "cf-263a"; platform = "Codeforces"; externalId = "263A"; slug = "beautiful-matrix"; title = "Beautiful Matrix"; difficulty = "Easy"; topics = @("Implementation"); url = "https://codeforces.com/problemset/problem/263/A" },
    [PSCustomObject]@{ id = "cf-50a"; platform = "Codeforces"; externalId = "50A"; slug = "domino-piling"; title = "Domino piling"; difficulty = "Easy"; topics = @("Greedy", "Math"); url = "https://codeforces.com/problemset/problem/50/A" },
    [PSCustomObject]@{ id = "cc-flow001"; platform = "CodeChef"; externalId = "FLOW001"; slug = "add-two-numbers"; title = "Add Two Numbers"; difficulty = "Easy"; topics = @("Basic Math"); url = "https://www.codechef.com/problems/FLOW001" },
    [PSCustomObject]@{ id = "cc-flow002"; platform = "CodeChef"; externalId = "FLOW002"; slug = "find-remainder"; title = "Find Remainder"; difficulty = "Easy"; topics = @("Basic Math"); url = "https://www.codechef.com/problems/FLOW002" },
    [PSCustomObject]@{ id = "cc-flow006"; platform = "CodeChef"; externalId = "FLOW006"; slug = "sum-of-digits"; title = "Sum of Digits"; difficulty = "Easy"; topics = @("Basic Math"); url = "https://www.codechef.com/problems/FLOW006" },
    [PSCustomObject]@{ id = "cc-flow007"; platform = "CodeChef"; externalId = "FLOW007"; slug = "reverse-the-number"; title = "Reverse The Number"; difficulty = "Easy"; topics = @("Basic Math"); url = "https://www.codechef.com/problems/FLOW007" },
    [PSCustomObject]@{ id = "cc-fctrl2"; platform = "CodeChef"; externalId = "FCTRL2"; slug = "small-factorials"; title = "Small factorials"; difficulty = "Medium"; topics = @("Math", "BigInt"); url = "https://www.codechef.com/problems/FCTRL2" },
    [PSCustomObject]@{ id = "cc-tsort"; platform = "CodeChef"; externalId = "TSORT"; slug = "turbo-sort"; title = "Turbo Sort"; difficulty = "Easy"; topics = @("Sorting"); url = "https://www.codechef.com/problems/TSORT" }
)

$allCatalog = [System.Collections.Generic.List[PSObject]]::new()
foreach ($item in $validItems) {
    [void]$allCatalog.Add($item)
}
foreach ($item in $cfCcItems) {
    [void]$allCatalog.Add($item)
}

$catalogJson = $allCatalog | ConvertTo-Json -Compress
$tsContent = "// Pre-bundled offline catalog for instant zero-latency autocomplete`n" +
             "import type { ProblemCatalogItem } from '../types/problem';`n`n" +
             "export const BUNDLED_PROBLEM_CATALOG: ProblemCatalogItem[] = " + $catalogJson + ";`n"

$tsPath = "constants\catalogData.ts"
[System.IO.File]::WriteAllText((Join-Path (Get-Location) $tsPath), $tsContent, [System.Text.Encoding]::UTF8)
Write-Host "Generated $tsPath with $($allCatalog.Count) catalog entries."
