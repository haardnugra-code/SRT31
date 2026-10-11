@echo off
title Sistem Keasramaan Sekolah Rakyat - Desktop Launcher
echo ========================================================
echo   SISTEM KEASRAMAAN SEKOLAH RAKYAT - KEMENSOS RI
echo   Menjalankan Aplikasi dalam Mode Desktop Standalone...
echo ========================================================
echo.

REM Periksa apakah node_modules sudah ada
if not exist "node_modules\" (
    echo Menginstal dependensi pertama kali...
    call npm install
)

echo Membuka jendela aplikasi desktop...
call npm run desktop
if %errorlevel% neq 0 (
    echo.
    echo Ada kendala saat menjalankan mode desktop.
    echo Anda juga dapat membuka aplikasi melalui browser dan menekan tombol "Pasang di Desktop".
    pause
)
