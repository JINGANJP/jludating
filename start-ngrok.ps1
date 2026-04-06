# JLUDating 内网穿透启动脚本
# 使用 ngrok 将本地服务暴露到公网

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  JLUDating 内网穿透启动脚本" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 检查 ngrok 是否已安装
$ngrokPath = "$env:USERPROFILE\ngrok\ngrok.exe"
if (-not (Test-Path $ngrokPath)) {
    Write-Host "[1/5] 正在安装 ngrok..." -ForegroundColor Yellow
    $ngrokZip = "$env:USERPROFILE\Downloads\ngrok.zip"
    if (-not (Test-Path $ngrokZip)) {
        Invoke-WebRequest -Uri "https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-windows-amd64.zip" -OutFile $ngrokZip
    }
    Expand-Archive -Path $ngrokZip -DestinationPath "$env:USERPROFILE\ngrok" -Force
    Write-Host "ngrok 安装完成" -ForegroundColor Green
}

# 启动 ngrok
Write-Host ""
Write-Host "[2/5] 启动 ngrok 内网穿透..." -ForegroundColor Yellow

# 停止现有的 ngrok 进程
Get-Process | Where-Object { $_.ProcessName -like "*ngrok*" } | Stop-Process -Force -ErrorAction SilentlyContinue

# 启动 ngrok HTTP 隧道（前端和后端）
$ngrokCmd = Start-Process -FilePath $ngrokPath -ArgumentList "http", "5173", "--log", "stdout" -PassThru -NoNewWindow -RedirectStandardOutput "$env:TEMP\ngrok-output.txt"

# 等待 ngrok 启动并获取 URL
Write-Host "等待 ngrok 获取公网地址..." -ForegroundColor Gray
Start-Sleep -Seconds 5

# 读取 ngrok 输出获取 URL
$ngrokOutput = Get-Content "$env:TEMP\ngrok-output.txt" -Raw -ErrorAction SilentlyContinue
$frontendUrl = $null
$apiUrl = $null

# 解析 ngrok URL
if ($ngrokOutput -match "https://[a-z0-9-]+\.ngrok\.io") {
    $ngrokBaseUrl = $Matches[0]
    $frontendUrl = $ngrokBaseUrl
    $apiUrl = "$ngrokBaseUrl/api"
    Write-Host "ngrok URL: $ngrokBaseUrl" -ForegroundColor Cyan
}

if (-not $frontendUrl) {
    Write-Host "无法获取 ngrok URL，尝试备用方案..." -ForegroundColor Yellow
    # 尝试从 ngrok API 获取
    Start-Sleep -Seconds 3
    try {
        $apiResponse = Invoke-RestMethod -Uri "http://127.0.0.1:4040/api/tunnels" -TimeoutSec 5 -ErrorAction SilentlyContinue
        if ($apiResponse) {
            $httpsTunnel = $apiResponse.tunnels | Where-Object { $_.proto -eq "https" } | Select-Object -First 1
            if ($httpsTunnel) {
                $ngrokBaseUrl = $httpsTunnel.public_url.TrimEnd('/')
                $frontendUrl = $ngrokBaseUrl
                $apiUrl = "$ngrokBaseUrl/api"
            }
        }
    } catch {
        Write-Host "无法从 ngrok API 获取 URL" -ForegroundColor Gray
    }
}

if (-not $frontendUrl) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "错误：无法获取 ngrok URL" -ForegroundColor Red
    Write-Host "请确保 ngrok 已正确配置并有网络连接" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "提示：首次使用 ngrok 需要配置 authtoken" -ForegroundColor Yellow
    Write-Host "请访问 https://dashboard.ngrok.com/get-started/your-authtoken" -ForegroundColor Yellow
    Write-Host "然后运行: ngrok config add-authtoken <your-token>" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "按 Enter 键退出"
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  公网访问地址已获取" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "前端地址: $frontendUrl" -ForegroundColor Cyan
Write-Host "后端API:  $apiUrl" -ForegroundColor Cyan
Write-Host ""
Write-Host "请将上述地址分享给测试用户！" -ForegroundColor Yellow
Write-Host ""

# 保存配置到临时文件
@{
    FRONTEND_URL = $frontendUrl
    API_URL = $apiUrl
    NGROK_PID = $ngrokCmd.Id
} | ConvertTo-Json | Out-File "$env:TEMP\jludating-ngrok-config.json" -Encoding UTF8

Write-Host "[3/5] 更新后端 CORS 配置..." -ForegroundColor Yellow

# 更新后端 .env
$backendEnvPath = "d:\Codex\JLUDating_web_demo\jludating-api\.env"
$backendEnv = Get-Content $backendEnvPath -Raw
$backendEnv = $backendEnv -replace 'FRONTEND_URL="[^"]*"', "FRONTEND_URL=""$frontendUrl"""
if ($backendEnv -notmatch 'FRONTEND_URL=') {
    $backendEnv += "`nFRONTEND_URL=""$frontendUrl""`n"
}
Set-Content -Path $backendEnvPath -Value $backendEnv -NoNewline
Write-Host "后端 .env 已更新" -ForegroundColor Green

Write-Host ""
Write-Host "[4/5] 创建前端环境配置..." -ForegroundColor Yellow

# 创建前端 .env 文件
$frontendEnv = "VITE_API_URL=$apiUrl`nVITE_APP_URL=$frontendUrl`n"
Set-Content -Path "d:\Codex\JLUDating_web_demo\jludating-web\.env" -Value $frontendEnv -NoNewline
Write-Host "前端 .env 已创建" -ForegroundColor Green

Write-Host ""
Write-Host "[5/5] 检查服务状态..." -ForegroundColor Yellow

# 检查后端
try {
    $backendStatus = (Invoke-WebRequest -Uri "http://localhost:3000/api/health" -UseBasicParsing -TimeoutSec 3).StatusCode
    if ($backendStatus -eq 200) {
        Write-Host "  后端服务: http://localhost:3000 ✅" -ForegroundColor Green
    } else {
        Write-Host "  后端服务: 需要重启 ⚠️" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  后端服务: 未运行，请重启 ⚠️" -ForegroundColor Yellow
}

# 检查前端
try {
    $frontendStatus = (Invoke-WebRequest -Uri "http://localhost:5173" -UseBasicParsing -TimeoutSec 3).StatusCode
    if ($frontendStatus -eq 200) {
        Write-Host "  前端服务: http://localhost:5173 ✅" -ForegroundColor Green
    } else {
        Write-Host "  前端服务: 需要重启 ⚠️" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  前端服务: 未运行，请重启 ⚠️" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  配置完成！" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "如果服务需要重启，请运行:" -ForegroundColor Yellow
Write-Host "  后端: cd d:\Codex\JLUDating_web_demo\jludating-api; npm run start:dev" -ForegroundColor White
Write-Host "  前端: cd d:\Codex\JLUDating_web_demo\jludating-web; npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "ngrok 窗口会显示日志，不要关闭它。" -ForegroundColor Yellow
Write-Host ""
Write-Host "按 Enter 键打开公网地址..." -ForegroundColor Cyan
Read-Host

# 打开浏览器
Start-Process $frontendUrl
