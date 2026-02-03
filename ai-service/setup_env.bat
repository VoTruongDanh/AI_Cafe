@echo off
setlocal
cd /d "%~dp0"

title Setup Environment - AI Service (Robust Mode)
echo [INFO] =============================================
echo [INFO] AI SERVICE - AUTO SETUP & REPAIR ENV (ROBUST)
echo [INFO] =============================================
echo.

REM 0. Pre-configure PIP for bad networks
set PIP_DEFAULT_TIMEOUT=100
set PIP_TRUSTED_HOST=pypi.org files.pythonhosted.org pypi.python.org

REM 1. Check Python
echo [STEP 1] Checking Python installation...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python not found or not in PATH.
    echo [HINT] Please install Python 3.10+ and verify "Add to PATH" is checked.
    pause
    exit /b 1
)
python --version
echo [OK] Python found.
echo.

REM 2. Setup Virtual Environment (venv)
echo [STEP 2] Setting up Virtual Environment (venv)...
if not exist "venv" (
    echo [INFO] Creating new venv...
    python -m venv venv
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to create venv. Check permissions.
        pause
        exit /b 1
    )
    echo [OK] venv created.
) else (
    echo [OK] venv already exists.
)

REM 3. Activate venv
echo [STEP 3] Activating venv...
call venv\Scripts\activate
if %errorlevel% neq 0 (
    echo [ERROR] Failed to activate venv.
    pause
    exit /b 1
)
echo [OK] venv activated.
echo.

REM 4. Upgrade Modules (with trusted flags)
echo [STEP 4] Upgrading core tools (pip/setuptools)...
python -m pip install --upgrade pip setuptools wheel --trusted-host pypi.org --trusted-host files.pythonhosted.org --trusted-host pypi.python.org
echo.

REM 5. Install Dependencies (Robust Mode)
echo [STEP 5] Installing dependencies...
echo [INFO] Using trusted-host flags to bypass SSL/Firewall issues...

REM Try installing critical libs individually first to avoid massive failures
pip install "numpy<2.0.0" --trusted-host pypi.org --trusted-host files.pythonhosted.org
pip install "cython" --trusted-host pypi.org --trusted-host files.pythonhosted.org
pip install "insightface==0.7.3" --trusted-host pypi.org --trusted-host files.pythonhosted.org

REM Install the rest
pip install -r requirements.txt --trusted-host pypi.org --trusted-host files.pythonhosted.org --trusted-host pypi.python.org

if %errorlevel% neq 0 (
    echo.
    echo [WARN] Still having issues. Trying to force install InsightFace specifically...
    REM InsightFace sometimes needs --no-build-isolation if build deps fail
    pip install insightface==0.7.3 --no-build-isolation --trusted-host pypi.org --trusted-host files.pythonhosted.org
    
    echo [FIX] Retrying full requirements...
    pip install -r requirements.txt --trusted-host pypi.org --trusted-host files.pythonhosted.org
)

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Installation failed.
    echo [HINT] Possible causes:
    echo    1. Network Blocks: Try switching to 4G/Mobile Hotspot or disabling VPN/Firewall.
    echo    2. DNS Issues: The error 'getaddrinfo failed' means your PC cannot find the PyPI server.
    pause
    exit /b 1
)

echo.
echo [SUCCESS] ENVIRONMENT SETUP COMPLETE! ========================
echo.
echo To run the AI Service:
echo    1. venv\Scripts\activate
echo    2. python main.py
echo.
echo Press any key to start the server immediately...
pause
python main.py
