@echo off
echo Starting ESG Resolve Platform...
echo.

echo Starting Django Backend on port 3001...
start "Django Backend" cmd /k "cd backend && python manage.py runserver 3001"

timeout /t 3 /nobreak > nul

echo Starting React Frontend on port 3000...
start "React Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo Both servers are starting...
echo Backend: http://localhost:8000
echo Frontend: http://localhost:3000
echo.
echo Press any key to exit...
pause > nul