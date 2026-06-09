# Whale Tracker - 깃허브 자동 푸시 스크립트 (git-autopush.ps1)
# 주석 언어: 한국어

$watchPath = "C:\Users\Administrator\source\repos\whale-tracker"
$filter = "*.*" # 모든 파일 감시

# 파일 감시자 객체 생성 (FileSystemWatcher)
# 기술 설명: 지정한 폴더 내의 파일 변경 이벤트를 감시하는 닷넷(.NET) 객체입니다.
$watcher = New-Object System.IO.FileSystemWatcher
$watcher.Path = $watchPath
$watcher.Filter = $filter
$watcher.IncludeSubdirectories = $false
$watcher.EnableRaisingEvents = $true

# 이벤트 핸들러 차단 플래그 (중복 푸시 및 무한 루프 방지용 디바운싱 변수)
$global:lastPushTime = [DateTime]::MinValue

Write-Host "Whale Tracker 파일 감시 시작..."
Write-Host "감시 경로: $watchPath"
Write-Host "파일을 수정하고 저장하면 자동으로 깃허브에 푸시됩니다. (Ctrl+C로 종료)"

# 파일 변경 감지 시 실행될 이벤트 등록
# 기술 설명: 파일이 수정(Changed)되면 호출되는 이벤트 액션 블록입니다.
$action = {
    $path = $Event.SourceEventArgs.FullPath
    $name = $Event.SourceEventArgs.Name
    
    # .git 폴더 내부 변경 및 스크립트 파일 자체는 무시
    if ($path -like "*\.git\*" -or $name -eq "git-autopush.ps1") {
        return
    }

    # 디바운싱 (Debounce): 3초 이내의 다중 저장 시 1회만 푸시 처리
    $now = Get-Date
    if ($now.Subtract($global:lastPushTime).TotalSeconds -lt 3) {
        return
    }
    $global:lastPushTime = $now

    Write-Host ""
    Write-Host "--------------------------------------------------"
    Write-Host "[변경 감지] 파일: $name ($now)"
    Write-Host "깃허브 자동 업데이트를 시작합니다..."
    
    # 깃 커맨드 실행
    try {
        # 작업 디렉터리를 프로젝트 폴더로 강제 고정
        Push-Location $watchPath
        
        # 1. 깃 변경 스테이징
        git add .
        
        # 2. 변경 내용 커밋 (수정된 파일명 표기)
        $commitMsg = "auto: update $name at $($now.ToString('yyyy-MM-dd HH:mm:ss'))"
        git commit -m $commitMsg
        
        # 3. 원격 저장소 푸시
        Write-Host "원격 푸시 중..."
        git push origin main
        
        Write-Host "[완료] 깃허브 자동 업데이트 성공!" -ForegroundColor Green
    }
    catch {
        Write-Error "업데이트 중 오류 발생: $_"
    }
    finally {
        Pop-Location
    }
    Write-Host "--------------------------------------------------"
}

# Changed 이벤트 등록
Register-ObjectEvent $watcher "Changed" -Action $action | Out-Null
Register-ObjectEvent $watcher "Created" -Action $action | Out-Null

# 스크립트가 종료될 때까지 대기하는 루프
try {
    while ($true) {
        Start-Sleep -Seconds 1
    }
}
finally {
    # 감시자 자원 해제
    $watcher.Dispose()
    Write-Host "파일 감시가 종료되었습니다."
}
