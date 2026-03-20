@echo off
chcp 65001 >nul
echo ========================================
echo   提交代码并推送到远程仓库
echo ========================================
echo.

cd /d %~dp0

echo [1/4] 查看当前修改状态...
git status
echo.

echo [2/4] 添加所有修改到暂存区...
git add .
echo.

set /p COMMIT_MSG="[3/4] 请输入提交说明信息: "
if "%COMMIT_MSG%"=="" (
    set COMMIT_MSG=update: 更新代码
)
git commit -m "%COMMIT_MSG%"
echo.

echo [4/4] 推送到远程 main 分支...
git push origin main
echo.

echo ========================================
echo   代码推送完成！
echo ========================================
echo.
pause
