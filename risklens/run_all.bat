@echo off
echo ============================================
echo   RiskLens - Setup and Run
echo ============================================

REM Create virtual environment if it doesn't already exist
if not exist "venv\" (
    echo Creating virtual environment...
    python -m venv venv
)

REM Activate it
call venv\Scripts\activate.bat

echo Installing dependencies (this may take a minute the first time)...
pip install -r requirements.txt -q

echo.
echo Step 1/4: Generating synthetic data...
python data\generate_data.py

echo.
echo Step 2/4: Loading data into SQLite...
python data\load_to_db.py

echo.
echo Step 3/4: Training ML model...
python model\train_model.py

echo.
echo Step 4/4: Launching dashboard...
streamlit run app\streamlit_app.py

pause
