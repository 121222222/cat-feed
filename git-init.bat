@echo off
chcp 65001 >nul
echo ========================================
echo   初始化 Git 本地仓库并关联远程仓库
echo ========================================
echo.

cd /d %~dp0

echo [1/3] 初始化本地 Git 仓库...
git init
echo.

echo [2/3] 关联远程仓库...
git remote add origin git@github.com:121222222/cat-feed.git
echo.

echo [3/3] 验证远程仓库配置...
git remote -v
echo.

echo ========================================
echo   本地仓库初始化完成！
echo   远程仓库: git@github.com:121222222/cat-feed.git
echo ========================================
echo.
pause
