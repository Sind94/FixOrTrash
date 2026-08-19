@echo off
title Avvio FixOrTrash Pro (Tauri Dev)
echo Configurazione variabili d'ambiente in corso...
set "PATH=%USERPROFILE%\.cargo\bin;%PATH%"
cd /d "E:\Antigravity Progetti\Software Negozio Tauri"
echo Avvio del server di sviluppo Tauri...
call npx tauri dev
pause
