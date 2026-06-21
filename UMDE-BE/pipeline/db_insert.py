import pandas as pd
import psycopg2
import psycopg2.extras
import os
from dotenv import load_dotenv

# Load Environment Variables
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
load_dotenv(os.path.join(BASE_DIR, 'UMDE-BE', '.env'))
