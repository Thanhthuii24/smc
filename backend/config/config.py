import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
EXCEL_DIR = os.path.abspath(os.path.join(BASE_DIR, '..', '..', 'data', 'excel'))
DB_PATH = os.path.abspath(os.path.join(BASE_DIR, '..', '..', 'data', 'location.db'))