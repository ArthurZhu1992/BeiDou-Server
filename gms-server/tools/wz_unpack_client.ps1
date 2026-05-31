param(
    [string]$ClientRoot = "D:\application\MapleStory-Client-V83",
    [string]$OutputRoot = "D:\application\MapleStory-Client-V83\Data-xml",
    [string]$WzLibPath = "D:\application\WzComparerR2\Lib\WzComparerR2.WzLib.dll"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path -LiteralPath $ClientRoot)) {
    throw "ClientRoot not found: $ClientRoot"
}
if (-not (Test-Path -LiteralPath $WzLibPath)) {
    throw "WzLibPath not found: $WzLibPath"
}

$dataRoot = Join-Path $ClientRoot "Data"
if (-not (Test-Path -LiteralPath $dataRoot)) {
    throw "Data folder not found: $dataRoot"
}

[Reflection.Assembly]::LoadFrom($WzLibPath) | Out-Null
$asm = [AppDomain]::CurrentDomain.GetAssemblies() | Where-Object {
    $_.GetName().Name -eq "WzComparerR2.WzLib"
} | Select-Object -First 1
if ($null -eq $asm) {
    throw "Failed to load WzComparerR2.WzLib assembly."
}

$structType = $asm.GetType("WzComparerR2.WzLib.Wz_Structure", $true)
$nodeType = $asm.GetType("WzComparerR2.WzLib.Wz_Node", $true)
$nodeExtType = $asm.GetType("WzComparerR2.WzLib.Wz_NodeExtension", $true)
$dumpMethod = $nodeExtType.GetMethod(
    "DumpAsXml",
    [Type[]]@($nodeType, [System.Xml.XmlWriter])
)
if ($null -eq $dumpMethod) {
    throw "DumpAsXml method not found."
}

New-Item -ItemType Directory -Path $OutputRoot -Force | Out-Null
$allImgs = Get-ChildItem -LiteralPath $dataRoot -Recurse -File -Filter "*.img"
$total = $allImgs.Count
$ok = 0
$fail = 0
$idx = 0

Write-Host "Start unpacking..."
Write-Host "Data root : $dataRoot"
Write-Host "Output    : $OutputRoot"
Write-Host "Total img : $total"

foreach ($imgFile in $allImgs) {
    $idx++
    try {
        $relative = $imgFile.FullName.Substring($dataRoot.Length).TrimStart('\', '/')
        $xmlPath = Join-Path $OutputRoot ($relative + ".xml")
        $xmlDir = Split-Path -Parent $xmlPath
        if (-not (Test-Path -LiteralPath $xmlDir)) {
            New-Item -ItemType Directory -Path $xmlDir -Force | Out-Null
        }

        $wzs = [Activator]::CreateInstance($structType)
        $wzs.LoadImg($imgFile.FullName)

        if ($wzs.WzNode.Nodes.Count -lt 1) {
            throw "LoadImg created empty root nodes."
        }
        $imgNode = $wzs.WzNode.Nodes[0]
        if ($null -eq $imgNode.Value) {
            throw "Image node has null Value."
        }
        $wzImage = $imgNode.Value
        if (-not $wzImage.TryExtract()) {
            throw "TryExtract returned false."
        }
        $parsedNode = $wzImage.Node
        if ($null -eq $parsedNode) {
            throw "Parsed node is null."
        }

        $settings = New-Object System.Xml.XmlWriterSettings
        $settings.Indent = $true
        $settings.Encoding = [System.Text.UTF8Encoding]::new($false)

        $writer = [System.Xml.XmlWriter]::Create($xmlPath, $settings)
        try {
            $writer.WriteStartDocument()
            [void]$dumpMethod.Invoke($null, @($parsedNode, $writer))
            $writer.WriteEndDocument()
        } finally {
            $writer.Close()
        }

        $ok++
        if (($idx % 100) -eq 0 -or $idx -eq $total) {
            Write-Host ("[{0}/{1}] OK={2} FAIL={3}" -f $idx, $total, $ok, $fail)
        }
    } catch {
        $fail++
        Write-Warning ("[{0}/{1}] FAIL {2} :: {3}" -f $idx, $total, $imgFile.FullName, $_.Exception.Message)
    }
}

Write-Host "Unpack done."
Write-Host ("Result: OK={0}, FAIL={1}, TOTAL={2}" -f $ok, $fail, $total)
