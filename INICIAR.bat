@echo off
chcp 65001 > nul
title ERP TecnoCel - Sistema Integral de Gestión Empresarial
cls

echo ===============================================================================
echo                SISTEMA INTEGRAL DE GESTION ERP TECNOCEL
echo            Innovación y Desarrollo Tecnológico - UCSS Nueva Cajamarca
echo ===============================================================================
echo.
echo Equipo de Desarrollo:
echo   - Erick Piero Vasquez Silva
echo   - Vanessa Llanos Julca
echo   - Maryuri Navarro Estrella
echo   - Willy Fernandes Hoyos
echo   - Harvin Ander Fustamante Calderon
echo.
echo ===============================================================================
echo.

:: 1. Verificar si Node.js está instalado
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js no está instalado o no se encuentra en el PATH.
    echo Por favor instale Node.js (versión 18 o superior) desde https://nodejs.org/
    echo.
    pause
    exit /b 1
)

:: 2. Verificar dependencias
if not exist "node_modules\" (
    echo [INFO] Carpeta node_modules no encontrada. Instalando dependencias necesarias...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Ocurrió un error al instalar las dependencias con npm install.
        pause
        exit /b 1
    )
    echo [OK] Dependencias instaladas correctamente.
    echo.
)

:: 3. Verificar archivo de variables de entorno
if not exist ".env.local" (
    echo [ADVERTENCIA] No se encontró el archivo .env.local.
    if exist ".env.example" (
        echo Creando .env.local a partir de .env.example...
        copy .env.example .env.local > nul
        echo [INFO] Se ha creado .env.local. Por favor verifique las credenciales de Supabase.
    )
)

echo [INFO] Iniciando servidor de desarrollo Next.js...
echo [INFO] El sistema abrirá automáticamente su navegador en http://localhost:3000
echo.
echo ===============================================================================
echo Para iniciar sesión puede usar cualquiera de las siguientes cuentas:
echo   - Gerente General:    gerencia@tecnocel.com  /  Clave: Erp2026*
echo   - Jefe Almacén:       almacen@tecnocel.com   /  Clave: Erp2026*
echo   - Vendedor 1:         cajero1@tecnocel.com   /  Clave: Erp2026*
echo   - Encargado Compras:  compras@tecnocel.com   /  Clave: Erp2026*
echo   - Jefe Finanzas:      finanzas@tecnocel.com  /  Clave: Erp2026*
echo ===============================================================================
echo.

:: Abrir navegador tras 4 segundos en segundo plano
start "" /b cmd /c "timeout /t 4 /nobreak > nul && start http://localhost:3000"

:: Iniciar Next.js
call npm run dev

pause
