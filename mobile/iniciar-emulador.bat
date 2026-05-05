@echo off
setlocal EnableExtensions EnableDelayedExpansion

set "PROJECT_DIR=E:\andoridstudio"
set "SDK=%LOCALAPPDATA%\Android\Sdk"
set "ADB=%SDK%\platform-tools\adb.exe"
set "EMULATOR=%SDK%\emulator\emulator.exe"
set "CMDLINE_BIN="
set "WAIT_DEVICE_SECONDS=420"
set "WAIT_BOOT_SECONDS=420"
set "LOG_DIR=%PROJECT_DIR%\logs"
set "LOG_FILE=%LOG_DIR%\emulator-last.log"

if exist "%SDK%\cmdline-tools\latest\bin\sdkmanager.bat" (
  set "CMDLINE_BIN=%SDK%\cmdline-tools\latest\bin"
) else (
  for /d %%D in ("%SDK%\cmdline-tools\*") do (
    if exist "%%~fD\bin\sdkmanager.bat" set "CMDLINE_BIN=%%~fD\bin"
  )
)

set "SDKMANAGER=%CMDLINE_BIN%\sdkmanager.bat"
set "AVDMANAGER=%CMDLINE_BIN%\avdmanager.bat"

if /I "%~1"=="--help" goto :HELP

if not exist "%LOG_DIR%" mkdir "%LOG_DIR%" >nul 2>nul
> "%LOG_FILE%" echo ==== iniciar-emulador.bat ====
>>"%LOG_FILE%" echo Project: %PROJECT_DIR%
>>"%LOG_FILE%" echo SDK: %SDK%

if not exist "%EMULATOR%" (
  echo [ERRO] Emulator nao encontrado em "%EMULATOR%".
  goto :FAIL
)
if not exist "%ADB%" (
  echo [ERRO] adb nao encontrado em "%ADB%".
  goto :FAIL
)
if not exist "%SDKMANAGER%" (
  echo [ERRO] sdkmanager nao encontrado em "%SDKMANAGER%".
  goto :FAIL
)
if not exist "%AVDMANAGER%" (
  echo [ERRO] avdmanager nao encontrado em "%AVDMANAGER%".
  goto :FAIL
)

echo [1/8] Encerrando processos antigos...
call :KILL_OLD

echo [2/8] Limpando AVDs antigos...
if exist "%USERPROFILE%\.android\avd" rmdir /S /Q "%USERPROFILE%\.android\avd"
if exist "%USERPROFILE%\.android\cache" rmdir /S /Q "%USERPROFILE%\.android\cache"
mkdir "%USERPROFILE%\.android\avd" >nul 2>nul

echo [3/8] Tentativa 1: Android 34 + GPU auto...
call :RUN_ATTEMPT "Pixel_7_API_34" "system-images;android-34;google_apis;x86_64" "platforms;android-34" "pixel_7" "auto"
if errorlevel 1 goto :FALLBACK_PROFILE

call :INSTALL_APP
if errorlevel 1 (
  echo [AVISO] Instalacao falhou no perfil Android 34. Tentando fallback...
  call :KILL_OLD
  goto :FALLBACK_PROFILE
)
goto :SUCCESS

:FALLBACK_PROFILE
echo [4/8] Tentativa 2: Android 35 + GPU swiftshader...
call :RUN_ATTEMPT "Pixel_7_API_35" "system-images;android-35;google_apis;x86_64" "platforms;android-35" "pixel_7" "swiftshader_indirect"
if errorlevel 1 goto :FAIL

call :INSTALL_APP
if errorlevel 1 goto :FAIL

goto :SUCCESS

:INSTALL_APP
echo [5/8] Emulador pronto. Instalando app...
pushd "%PROJECT_DIR%"
call gradlew.bat :app:installDebug
if errorlevel 1 (
  echo [AVISO] installDebug falhou. Tentando fallback via APK...
  call gradlew.bat :app:assembleDebug
  if errorlevel 1 (
    popd
    echo [ERRO] Falha no assembleDebug.
    exit /b 1
  )
  "%ADB%" -s !SERIAL! install -r "%PROJECT_DIR%\app\build\outputs\apk\debug\app-debug.apk"
  if errorlevel 1 (
    popd
    echo [ERRO] Falha no install via adb.
    exit /b 1
  )
)
"%ADB%" -s !SERIAL! shell am start -n com.kifome.app/.MainActivity >nul 2>nul
popd
exit /b 0

:SUCCESS
echo [6/8] App iniciado no dispositivo !SERIAL!.
echo [7/8] Log salvo em "%LOG_FILE%".
echo [8/8] Finalizado com sucesso.
goto :END

:RUN_ATTEMPT
set "AVD_NAME=%~1"
set "SYSTEM_IMAGE=%~2"
set "PLATFORM_PACKAGE=%~3"
set "DEVICE_ID=%~4"
set "GPU_MODE=%~5"

echo   - Garantindo componentes: !SYSTEM_IMAGE!
>>"%LOG_FILE%" echo --- RUN_ATTEMPT !AVD_NAME! ---
call "%SDKMANAGER%" --install "platform-tools" "emulator" "!SYSTEM_IMAGE!" "!PLATFORM_PACKAGE!"
if errorlevel 1 (
  echo [ERRO] Falha ao instalar componentes do SDK para !AVD_NAME!.
  exit /b 1
)

echo   - Criando AVD limpo: !AVD_NAME!
if exist "%USERPROFILE%\.android\avd\!AVD_NAME!.ini" del /F /Q "%USERPROFILE%\.android\avd\!AVD_NAME!.ini" >nul 2>nul
if exist "%USERPROFILE%\.android\avd\!AVD_NAME!.avd" rmdir /S /Q "%USERPROFILE%\.android\avd\!AVD_NAME!.avd"
echo no | call "%AVDMANAGER%" create avd -n "!AVD_NAME!" -k "!SYSTEM_IMAGE!" -d "!DEVICE_ID!" --force
if errorlevel 1 (
  echo [ERRO] Falha ao criar o AVD !AVD_NAME!.
  exit /b 1
)

echo   - Iniciando emulador (!GPU_MODE!)...
set "SERIAL=emulator-5554"
start "Emulator-!AVD_NAME!" "%EMULATOR%" -avd "!AVD_NAME!" -port 5554 -no-snapshot-load -gpu !GPU_MODE!

call :WAIT_DEVICE
if errorlevel 1 (
  echo [ERRO] Timeout aguardando emulador aparecer no adb - !AVD_NAME!.
  call :DUMP_DIAG
  exit /b 1
)

echo   - Aguardando Android estabilizar...
"%ADB%" -s !SERIAL! wait-for-device >nul 2>nul
timeout /T 25 /NOBREAK >nul

call :WAIT_PM_READY
if errorlevel 1 (
  echo [ERRO] Package Manager nao ficou pronto no tempo esperado.
  call :DUMP_DIAG
  exit /b 1
)

exit /b 0

:WAIT_PM_READY
set /A ELAPSED=0
:WAIT_PM_READY_LOOP
"%ADB%" -s !SERIAL! shell pm path android >nul 2>nul
if not errorlevel 1 (
  echo   - Package Manager pronto.
  exit /b 0
)
timeout /T 2 /NOBREAK >nul
set /A ELAPSED+=2
if !ELAPSED! GEQ 180 exit /b 1
goto :WAIT_PM_READY_LOOP

:WAIT_DEVICE
set /A ELAPSED=0
:WAIT_DEVICE_LOOP
"%ADB%" -s !SERIAL! get-state 2>nul | findstr /I "^device$" >nul
if not errorlevel 1 (
  echo   - Dispositivo detectado: !SERIAL!
  >>"%LOG_FILE%" echo SERIAL=!SERIAL!
  exit /b 0
)
timeout /T 2 /NOBREAK >nul
set /A ELAPSED+=2
if !ELAPSED! GEQ %WAIT_DEVICE_SECONDS% exit /b 1
goto :WAIT_DEVICE_LOOP

:: Mantido para futuras depuracoes, atualmente nao usado.
:WAIT_BOOT
set /A ELAPSED=0
:WAIT_BOOT_LOOP
"%ADB%" -s !SERIAL! shell getprop sys.boot_completed 2>nul | findstr /R "^1$" >nul
if not errorlevel 1 (
  echo   - Boot completo.
  exit /b 0
)
timeout /T 2 /NOBREAK >nul
set /A ELAPSED+=2
if !ELAPSED! GEQ %WAIT_BOOT_SECONDS% exit /b 1
goto :WAIT_BOOT_LOOP

:KILL_OLD
taskkill /F /IM emulator.exe >nul 2>nul
taskkill /F /IM qemu-system-x86_64.exe >nul 2>nul
"%ADB%" kill-server >nul 2>nul
"%ADB%" start-server >nul 2>nul
exit /b 0

:DUMP_DIAG
>>"%LOG_FILE%" echo --- adb devices ---
"%ADB%" devices >>"%LOG_FILE%" 2>&1
>>"%LOG_FILE%" echo --- fim diag ---
exit /b 0

:HELP
echo Uso:
echo   iniciar-emulador.bat
echo.
echo Fluxo automatico:
echo   1. Fecha emuladores antigos
echo   2. Remove todos os AVDs
echo   3. Tenta Android 34 + GPU auto
echo   4. Se falhar, tenta Android 35 + GPU swiftshader
echo   5. Aguarda adb e boot completo
echo   6. Instala e abre o app
exit /b 0

:FAIL
echo.
echo Processo interrompido. Veja o log em:
echo   %LOG_FILE%
exit /b 1

:END
endlocal
