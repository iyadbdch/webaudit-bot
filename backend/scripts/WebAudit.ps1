#requires -Version 5.1
<#
.SYNOPSIS
    Universal Full-Stack Website Audit
#>

[CmdletBinding()]
param(
    [string]$Url                  = '',
    [string]$OutputDir            = '',
    [int]   $RequestTimeoutSec    = 20,
    [int]   $MaxPagesFromSitemap  = 0,
    [switch]$SampleOnlyLargeAudits
)

Set-StrictMode -Off
$ErrorActionPreference = 'SilentlyContinue'

#region GLOBALS
$script:UA         = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36'
$script:Issues     = [System.Collections.ArrayList]::new()
$script:PageData   = [System.Collections.ArrayList]::new()
$script:StartTime  = Get-Date
#endregion

#region CORE HTTP HELPER
function Invoke-HttpRaw {
    param(
        [Parameter(Mandatory)][string]$FetchUrl,
        [int]   $MaxLines    = 600,
        [switch]$FullBody,
        [switch]$HeadOnly
    )
    $out = [PSCustomObject]@{
        Url           = $FetchUrl
        StatusCode    = 0
        RedirectUrl   = ''
        ContentLength = 0
        TtfbMs        = 0
        TotalMs       = 0
        Body          = ''
        Error         = ''
    }
    try {
        $fmt    = '%{http_code}|%{size_download}|%{time_starttransfer}|%{time_total}|%{redirect_url}'
        $curlArgs = @('-s','-o','nul','-w',$fmt,'--max-time',$RequestTimeoutSec,'-L','-k','-A',$script:UA)
        if ($HeadOnly) { $curlArgs += '-I' }
        $meta   = (curl.exe $curlArgs "$FetchUrl" 2>$null) -split '\|'
        $out.StatusCode    = [int]   ($meta[0] -replace '\D')
        $out.ContentLength = [long]  ($meta[1] -replace '\D')
        $out.TtfbMs        = [math]::Round([double]($meta[2]) * 1000, 0)
        $out.TotalMs       = [math]::Round([double]($meta[3]) * 1000, 0)
        $out.RedirectUrl   = $meta[4].Trim()
        if (-not $HeadOnly) {
            $bodyArgs = @('-s','--max-time',$RequestTimeoutSec,'-L','-k','-A',$script:UA)
            if ($FullBody) {
                $out.Body = (curl.exe $bodyArgs "$FetchUrl" 2>$null) -join "`n"
            } else {
                $out.Body = (curl.exe $bodyArgs "$FetchUrl" 2>$null | Select-Object -First $MaxLines) -join "`n"
            }
        }
    } catch { $out.Error = $_.Exception.Message }
    return $out
}
#endregion

#region SITEMAP DISCOVERY
$discoveredSitemaps = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::OrdinalIgnoreCase)

function Add-SitemapIfLive {
    param([string]$SitemapUrl)
    if ($discoveredSitemaps.Contains($SitemapUrl)) { return $false }
    $code = [int]((curl.exe -s -o nul -w '%{http_code}' --max-time $RequestTimeoutSec -L -k -A $script:UA "$SitemapUrl" 2>$null) -replace '\D')
    if ($code -eq 200) { [void]$discoveredSitemaps.Add($SitemapUrl); return $true }
    return $false
}

function Expand-SitemapIndex {
    param([string]$IndexUrl)
    $body = (Invoke-HttpRaw -FetchUrl $IndexUrl -FullBody).Body
    if ($body -notmatch '<sitemapindex') { return }
    $locs = [regex]::Matches($body, '<loc>\s*([^\s<]+)\s*</loc>', 'IgnoreCase') |
        ForEach-Object { $_.Groups[1].Value.Trim() } |
        Where-Object { $_ -match '\.(xml|gz)$' -or $_ -match 'sitemap' }
    foreach ($loc in $locs) {
        if ($discoveredSitemaps.Contains($loc)) { continue }
        $ok = Add-SitemapIfLive -SitemapUrl $loc
        if ($ok) {
            $childBody = (Invoke-HttpRaw -FetchUrl $loc -FullBody).Body
            if ($childBody -match '<sitemapindex') { Expand-SitemapIndex -IndexUrl $loc }
        }
    }
}
#endregion

#region PAGE EXTRACTION
$allPageUrls     = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::OrdinalIgnoreCase)
$sitemapMeta     = [System.Collections.ArrayList]::new()
$allPageUrlList  = [System.Collections.Generic.List[string]]::new()

if (-not $Url) { $Url = Read-Host 'Enter URL: ' }
if ($Url -notmatch '^https?://') { $Url = "https://$Url" }
$Url = $Url.TrimEnd('/')
$parsedUri = [System.Uri]$Url
$siteRoot  = "$($parsedUri.Scheme)://$($parsedUri.Host)"
$hostRoot  = ($parsedUri.Host -replace '^www\.', '')

if (-not $OutputDir) {
    $safeHost  = $parsedUri.Host -replace '[^a-zA-Z0-9\-\.]', '_'
    $OutputDir = ".\audit_${safeHost}_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
}
New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null

# robots.txt sitemaps
$robotsUrl = "$siteRoot/robots.txt"
$robotsData = Invoke-HttpRaw -FetchUrl $robotsUrl -FullBody
if ($robotsData.StatusCode -eq 200) {
    $robotsSitemapUrls = [regex]::Matches($robotsData.Body, '(?im)^Sitemap\s*:\s*(.+)$') |
        ForEach-Object { $_.Groups[1].Value.Trim() } |
        Where-Object { $_ -match '^https?://' }
    $robotsSitemapUrls | ForEach-Object { 
        $ok = Add-SitemapIfLive -SitemapUrl $_
        if ($ok) { Expand-SitemapIndex -IndexUrl $_ }
    }
}

# Standard paths
$standardPaths = @('/sitemap_index.xml','/sitemap.xml','/sitemap-index.xml','/wp-sitemap.xml')
foreach ($path in $standardPaths) {
    $candidate = "$siteRoot$path"
    if (-not $discoveredSitemaps.Contains($candidate)) {
        $ok = Add-SitemapIfLive -SitemapUrl $candidate
        if ($ok) { Expand-SitemapIndex -IndexUrl $candidate }
    }
}

# Non-www variant
$siteRootNww = "https://$hostRoot"
if ($siteRoot -ne $siteRootNww) {
    foreach ($path in @('/sitemap_index.xml','/sitemap.xml','/wp-sitemap.xml')) {
        $candidate = "$siteRootNww$path"
        if (-not $discoveredSitemaps.Contains($candidate)) {
            $ok = Add-SitemapIfLive -SitemapUrl $candidate
            if ($ok) { Expand-SitemapIndex -IndexUrl $candidate }
        }
    }
}

# Extract pages from leaf sitemaps
foreach ($smUrl in $discoveredSitemaps) {
    $body = (Invoke-HttpRaw -FetchUrl $smUrl -FullBody).Body
    if ($body -match '<sitemapindex') { continue }
    $locs = [regex]::Matches($body, '<loc>\s*([^\s<]+)\s*</loc>', 'IgnoreCase') |
        ForEach-Object { $_.Groups[1].Value.Trim() } |
        Where-Object { $_ -match '^https?://' -and $_ -notmatch '\.(xml|gz)$' }
    foreach ($loc in $locs) { 
        [void]$allPageUrls.Add($loc); 
        $allPageUrlList.Add($loc)
    }
}

# Sampling
$deepAuditUrls = [System.Collections.Generic.List[string]]::new()
$urlArray = @($allPageUrls)
if ($MaxPagesFromSitemap -gt 0 -and $urlArray.Count -gt $MaxPagesFromSitemap) {
    $step = [Math]::Ceiling($urlArray.Count / $MaxPagesFromSitemap)
    for ($i = 0; $i -lt $urlArray.Count; $i += $step) { $deepAuditUrls.Add($urlArray[$i]) }
} elseif ($SampleOnlyLargeAudits -and $urlArray.Count -gt 500) {
    $sampleSize = 500; $step = [Math]::Ceiling($urlArray.Count / $sampleSize)
    for ($i = 0; $i -lt $urlArray.Count; $i += $step) { $deepAuditUrls.Add($urlArray[$i]) }
} else { $deepAuditUrls.AddRange($urlArray) }
#endregion

#region PER-PAGE AUDIT
foreach ($pageUrl in $deepAuditUrls) {
    $http = Invoke-HttpRaw -FetchUrl $pageUrl -MaxLines 800
    $html = $http.Body
    $rec = [PSCustomObject]@{
        Url = $pageUrl; StatusCode = $http.StatusCode; RedirectUrl = $http.RedirectUrl
        ContentLengthKB = [math]::Round($http.ContentLength / 1KB, 1); TtfbMs = $http.TtfbMs; TotalMs = $http.TotalMs
        Title = ''; TitleLength = 0; MetaDesc = ''; MetaDescLength = 0; Canonical = ''; CanonicalMatch = $false
        RobotsMeta = ''; HasNoindex = $false; HasNofollow = $false; OgTitle = ''; OgDesc = ''; OgImage = ''
        TwitterCard = ''; H1Count = 0; H1Text = ''; H2Count = 0; H2Texts = ''; JsonLdCount = 0; JsonLdTypes = ''
        MixedContent = 0; ImgTotal = 0; ImgMissingAlt = 0; Error = $http.Error
    }
    if ($http.StatusCode -eq 200) {
        # Title
        if ($html -match '(?is)<title[^>]*>(.*?)</title>') { $rec.Title = ([System.Net.WebUtility]::HtmlDecode($matches[1]) -replace '\s+',' ').Trim(); $rec.TitleLength = $rec.Title.Length }
        # Meta desc
        $mdm = [regex]::Match($html, '(?is)<meta[^>]+name=["'']description["''][^>]+content=["'']([^"'']*)["'']')
        if (-not $mdm.Success) { $mdm = [regex]::Match($html, '(?is)<meta[^>]+content=["'']([^"'']*)["''][^>]+name=["'']description["'']') }
        if ($mdm.Success) { $rec.MetaDesc = [System.Net.WebUtility]::HtmlDecode($mdm.Groups[1].Value.Trim()); $rec.MetaDescLength = $rec.MetaDesc.Length }
        # Canonical
        $cm = [regex]::Match($html, '(?is)<link[^>]+rel=["'']canonical["''][^>]+href=["'']([^"'']*)["'']')
        if (-not $cm.Success) { $cm = [regex]::Match($html, '(?is)<link[^>]+href=["'']([^"'']*)["''][^>]+rel=["'']canonical["'']') }
        if ($cm.Success) { $rec.Canonical = $cm.Groups[1].Value.Trim(); $rec.CanonicalMatch = ($rec.Canonical -eq $pageUrl) -or ($rec.Canonical -eq ($pageUrl + '/')) }
        # Robots meta
        $rm = [regex]::Match($html, '(?is)<meta[^>]+name=["'']robots["''][^>]*>')
        if ($rm.Success) { $rec.RobotsMeta = $rm.Value; $rec.HasNoindex = $rm.Value -match 'noindex'; $rec.HasNofollow = $rm.Value -match 'nofollow' }
        # OpenGraph
        $ogTitle = [regex]::Match($html, '(?is)<meta[^>]+property=["'']og:title["''][^>]+content=["'']([^"'']*)["'']')
        $ogDesc  = [regex]::Match($html, '(?is)<meta[^>]+property=["'']og:description["''][^>]+content=["'']([^"'']*)["'']')
        $ogImg   = [regex]::Match($html, '(?is)<meta[^>]+property=["'']og:image["''][^>]+content=["'']([^"'']*)["'']')
        if ($ogTitle.Success) { $rec.OgTitle = [System.Net.WebUtility]::HtmlDecode($ogTitle.Groups[1].Value.Trim()) }
        if ($ogDesc.Success)  { $rec.OgDesc  = [System.Net.WebUtility]::HtmlDecode($ogDesc.Groups[1].Value.Trim()) }
        if ($ogImg.Success)   { $rec.OgImage = $ogImg.Groups[1].Value.Trim() }
        # Twitter Card
        $tc = [regex]::Match($html, '(?is)<meta[^>]+name=["'']twitter:card["''][^>]+content=["'']([^"'']*)["'']')
        if ($tc.Success) { $rec.TwitterCard = $tc.Groups[1].Value.Trim() }
        # H1
        $h1s = [regex]::Matches($html, '(?is)<h1[^>]*>(.*?)</h1>') | ForEach-Object { ([regex]::Replace($_.Groups[1].Value, '<[^>]+>', '')).Trim() } | Where-Object { $_ }
        $rec.H1Count = $h1s.Count; $rec.H1Text = ($h1s | Select-Object -First 3) -join ' || '
        # H2
        $h2s = [regex]::Matches($html, '(?is)<h2[^>]*>(.*?)</h2>') | ForEach-Object { ([regex]::Replace($_.Groups[1].Value, '<[^>]+>', '')).Trim() } | Where-Object { $_ }
        $rec.H2Count = $h2s.Count; $rec.H2Texts = ($h2s | Select-Object -First 5) -join ' || '
        # JSON-LD
        $ldBlocks = [regex]::Matches($html, '(?is)<script[^>]+type=["'']application/ld\+json["''][^>]*>(.*?)</script>')
        $rec.JsonLdCount = $ldBlocks.Count
        $ldTypes = $ldBlocks | ForEach-Object { if ($_.Groups[1].Value -match '"@type"\s*:\s*"([^"]+)"') { $matches[1] } } | Where-Object { $_ }
        $rec.JsonLdTypes = $ldTypes -join ', '
        # Mixed content
        if ($pageUrl -match '^https://') {
            $httpRefs = [regex]::Matches($html, 'http://[^\s"''<>]+') | ForEach-Object { $_.Value } | Where-Object { $_ -notmatch '^http://(schema\.org|www\.w3\.org|xmlns|ogp\.me|purl\.org)' } | Select-Object -Unique
            $rec.MixedContent = $httpRefs.Count
        }
        # Image alt
        $imgs = [regex]::Matches($html, '(?is)<img[^>]*>')
        $rec.ImgTotal = $imgs.Count; $rec.ImgMissingAlt = ($imgs | Where-Object { $_.Value -notmatch '\balt=' }).Count
    }
    $null = $script:PageData.Add($rec)
}
#endregion

#region SCORING & OUTPUT
$okPages = $script:PageData | Where-Object { $_.StatusCode -eq 200 }
$totalPages = $okPages.Count
$issuesCount = $script:Issues.Count

# Compute scores
$scoreData = @{
    totalPages = $totalPages
    totalSitemapPages = $allPageUrls.Count
    sitemapsFound = $discoveredSitemaps.Count
    issuesCount = $issuesCount
    pctWithTitle = if ($totalPages -gt 0) { [math]::Round(($okPages | Where-Object { $_.Title }).Count / $totalPages * 100) } else { 0 }
    pctWithMetaDesc = if ($totalPages -gt 0) { [math]::Round(($okPages | Where-Object { $_.MetaDesc }).Count / $totalPages * 100) } else { 0 }
    pctWithCanonical = if ($totalPages -gt 0) { [math]::Round(($okPages | Where-Object { $_.Canonical }).Count / $totalPages * 100) } else { 0 }
    pctWithH1 = if ($totalPages -gt 0) { [math]::Round(($okPages | Where-Object { $_.H1Count -ge 1 }).Count / $totalPages * 100) } else { 0 }
    pctWithJsonLd = if ($totalPages -gt 0) { [math]::Round(($okPages | Where-Object { $_.JsonLdCount -ge 1 }).Count / $totalPages * 100) } else { 0 }
    pctNoindex = if ($totalPages -gt 0) { [math]::Round(($okPages | Where-Object { $_.HasNoindex }).Count / $totalPages * 100) } else { 0 }
    avgTtfbMs = if ($totalPages -gt 0) { [math]::Round(($okPages | Measure-Object -Property TtfbMs -Average).Average, 0) } else { 0 }
    avgSizeKb = if ($totalPages -gt 0) { [math]::Round(($okPages | Measure-Object -Property ContentLengthKB -Average).Average, 0) } else { 0 }
    pagesWithMixedContent = ($okPages | Where-Object { $_.MixedContent -gt 0 }).Count
    pagesMissingAlt = ($okPages | Where-Object { $_.ImgMissingAlt -gt 0 }).Count
    duplicateTitles = ($okPages | Where-Object { $_.Title } | Group-Object Title | Where-Object { $_.Count -gt 1 }).Count
    uri = $siteRoot
    generatedAt = (Get-Date -Format 'o')
    durationSec = [Math]::Round(([DateTime]::Now - $script:StartTime).TotalSeconds, 1)
}

# Compute an overall score (0-100) based on various metrics
$overallScore = 0
$overallScore += $scoreData.pctWithTitle * 0.15        # 15% for titles
$overallScore += $scoreData.pctWithMetaDesc * 0.10      # 10% for meta desc
$overallScore += $scoreData.pctWithCanonical * 0.10     # 10% for canonicals
$overallScore += $scoreData.pctWithH1 * 0.10            # 10% for H1s
$overallScore += $scoreData.pctWithJsonLd * 0.05        # 5% for structured data
$overallScore += (100 - $scoreData.pctNoindex) * 0.05   # 5% for no noindex issues
# Performance: 15% - lower TTFB and size are better
$ttfbScore = if ($scoreData.avgTtfbMs -gt 0) { [Math]::Max(0, 100 - ($scoreData.avgTtfbMs / 10)) } else { 0 }
$sizeScore = if ($scoreData.avgSizeKb -gt 0) { [Math]::Max(0, 100 - ($scoreData.avgSizeKb / 15)) } else { 0 }
$overallScore += $ttfbScore * 0.10
$overallScore += $sizeScore * 0.05
# No mixed content: 5%
$overallScore += (100 - [Math]::Min(100, $scoreData.pagesWithMixedContent * 10)) * 0.05
# No duplicate titles: 5%
$overallScore += (100 - [Math]::Min(100, $scoreData.duplicateTitles * 20)) * 0.05
# Sitemap quality: 5%
$overallScore += [Math]::Min(100, $scoreData.sitemapsFound * 25) * 0.05

$overallScore = [Math]::Round($overallScore, 0)
$grade = if ($overallScore -ge 90) { 'A' } elseif ($overallScore -ge 80) { 'B' } elseif ($overallScore -ge 70) { 'C' } elseif ($overallScore -ge 60) { 'D' } else { 'F' }
$scoreData.overall = $overallScore
$scoreData.grade = $grade

# Output all data as JSON
$output = @{
    meta = @{
        version = "4.0"
        baseUrl = $siteRoot
        timestamp = (Get-Date -Format 'o')
        totalPages = $totalPages
        sitemapPages = $allPageUrls.Count
        durationSec = $scoreData.durationSec
    }
    score = @{
        overall = $overallScore
        grade = $grade
        categories = @(
            @{name="SEO Titles"; score=$scoreData.pctWithTitle}
            @{name="Meta Descriptions"; score=$scoreData.pctWithMetaDesc}
            @{name="Canonical Tags"; score=$scoreData.pctWithCanonical}
            @{name="Heading Structure"; score=$scoreData.pctWithH1}
            @{name="Structured Data"; score=$scoreData.pctWithJsonLd}
            @{name="Performance (TTFB)"; score=$ttfbScore}
            @{name="Page Size"; score=$sizeScore}
            @{name="Mixed Content Free"; score=(100 - [Math]::Min(100, $scoreData.pagesWithMixedContent * 10))}
            @{name="No Duplicate Titles"; score=(100 - [Math]::Min(100, $scoreData.duplicateTitles * 20))}
        )
    }
    summary = @{
        totalPages = $totalPages
        sitemapPages = $allPageUrls.Count
        sitemapsFound = $discoveredSitemaps.Count
        issuesCount = $issuesCount
        avgTtfbMs = $scoreData.avgTtfbMs
        avgSizeKb = $scoreData.avgSizeKb
        pctWithTitle = $scoreData.pctWithTitle
        pctWithMetaDesc = $scoreData.pctWithMetaDesc
        pctWithCanonical = $scoreData.pctWithCanonical
        pctWithH1 = $scoreData.pctWithH1
        pctWithJsonLd = $scoreData.pctWithJsonLd
        pagesWithNoindex = ($okPages | Where-Object { $_.HasNoindex }).Count
        pagesWithMixedContent = $scoreData.pagesWithMixedContent
        pagesMissingAlt = $scoreData.pagesMissingAlt
        duplicateTitles = $scoreData.duplicateTitles
    }
    pages = @($script:PageData)
    issues = @($script:Issues)
}

$output | ConvertTo-Json -Depth 8
#endregion