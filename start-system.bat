@echo off
setlocal enabledelayedexpansion
if not defined NODE_ENV set NODE_ENV=development

echo ==========================================
echo      SISTEMA ENSAIO REGIONAL - START
echo ==========================================
echo.

:: 1. Backend Setup
echo [Backend] Instalando dependencias...
cd backend
call npm install
if !errorlevel! neq 0 (
    echo [ERRO] Falha ao instalar dependencias do backend.
    pause
    exit /b 1
)

:: 2. Database Sync (Preserving Data)
if "%NODE_ENV%"=="development" (
    echo [Backend] Sincronizando schema com o banco...
    call npx prisma db push
    if !errorlevel! neq 0 (
        echo [ERRO] Falha na sincronizacao do banco de dados.
        pause
        exit /b 1
    )
)

:: 3. Database Seeding
echo [Backend] Executando Seed...
call npx prisma db seed
if !errorlevel! neq 0 (
    echo [ERRO] Falha ao executar o seed.
    pause
    exit /b 1
)

:: 4. Start Backend Server
echo [Backend] Iniciando servidor em nova janela...
start "Backend Server" cmd /k "npm run dev"

:: 5. Frontend Setup
echo.
echo [Frontend] Instalando dependencias...
cd ../frontend
call npm install
if !errorlevel! neq 0 (
    echo [ERRO] Falha ao instalar dependencias do frontend.
    pause
    exit /b 1
)

:: 6. Start Frontend Server
echo [Frontend] Iniciando servidor em nova janela...
start "Frontend Server" cmd /k "npm run dev"

echo.
echo ==========================================
echo      SISTEMA INICIADO COM SUCESSO!
echo ==========================================
echo Backend: http://localhost:3333
echo Frontend: http://localhost:5173
echo.
echo Pressione uma tecla para fechar este launcher.
pause
endlocal
