@echo off
title LinguaAI - Automated Verification Tests
color 0a

echo =========================================================================
echo               LINGUAAI - AUTOMATED VERIFICATION SUITE
echo =========================================================================
echo.
echo Running all 15 Pytest Integration & Feature Tests...
echo.

.\backend\venv\Scripts\python.exe -m pytest -v

echo.
echo =========================================================================
pause
