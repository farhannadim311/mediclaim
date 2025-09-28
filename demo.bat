@echo off
REM ZK Claim Verifier - Hackathon Demo Script (Windows)
REM This script demonstrates the complete ZK Claim Verifier MVP

echo 🚀 ZK Claim Verifier - Hackathon Demo
echo ======================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed. Please install Node.js v18+ first.
    exit /b 1
)

REM Check if npm is installed
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] npm is not installed. Please install npm first.
    exit /b 1
)

echo [INFO] Prerequisites check passed

REM Install dependencies
echo [INFO] Installing dependencies...
call npm i --legacy-peer-deps
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install dependencies
    exit /b 1
)
echo [SUCCESS] Dependencies installed

REM Build the contract
echo [INFO] Building ZK Claim Verifier contract...
cd contract
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Failed to build contract
    exit /b 1
)
echo [SUCCESS] Contract built successfully
cd ..

REM Start the development environment
echo [INFO] Starting development environment...
start /b make dev-up

REM Wait for services to start
echo [INFO] Waiting for services to start...
timeout /t 10 /nobreak >nul

REM Start the UI
echo [INFO] Starting the UI...
cd dawn-ui
start /b npm run dev

REM Wait for UI to start
echo [INFO] Waiting for UI to start...
timeout /t 15 /nobreak >nul

echo [SUCCESS] Demo environment is ready!
echo.
echo 🎯 Demo Instructions:
echo ====================
echo.
echo 1. Open your browser and go to: http://localhost:5173/claims
echo.
echo 2. Click the 'Generate Sample Data' button to populate the form with test data
echo.
echo 3. Click 'Verify Claim' to see the ZK verification process
echo.
echo 4. Observe the verification result showing:
echo    - Claim ID (generated)
echo    - Verification status (VERIFIED/REJECTED)
echo    - Verification hash (ZK proof)
echo    - Timestamp
echo    - Status message
echo.
echo 5. Try different claim types and amounts to see validation rules
echo.
echo 🔐 Privacy Features Demonstrated:
echo ================================
echo.
echo ✓ Zero-knowledge verification - sensitive data not revealed
echo ✓ Provider signature verification
echo ✓ Business rule validation (amount limits, date ranges)
echo ✓ Authorization checks (provider and patient eligibility)
echo ✓ Minimal disclosure (only verification status and metadata)
echo.
echo 📊 Sample Data Available:
echo ========================
echo.
echo Providers:
echo - HOSPITAL_001 (Medical, Emergency)
echo - CLINIC_002 (Medical, Prescription, Dental)
echo - PHARMACY_003 (Prescription only)
echo - DENTIST_004 (Dental only)
echo - EYE_CARE_005 (Vision only)
echo.
echo Patients:
echo - PATIENT_001 (John Doe)
echo - PATIENT_002 (Jane Smith)
echo - PATIENT_003 (Bob Johnson)
echo.
echo Claim Types ^& Limits:
echo - Medical Invoice: Up to $1,000
echo - Prescription Drug: Up to $500
echo - Dental Procedure: Up to $2,000
echo - Vision Care: Up to $1,500
echo - Emergency Room: Up to $5,000
echo.
echo Press any key to stop the demo...
pause >nul
