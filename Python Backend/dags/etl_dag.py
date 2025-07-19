from airflow import DAG
from airflow.operators.python import PythonOperator
from datetime import datetime
from extract_task import extract_data
from transform_task import transform_data
from load_task import load_report

COMPANY_NAME = "Nifty 50"
STOCK_TICKER = "^NSEI"
OUTPUT_REPORT = f"{COMPANY_NAME.lower().replace(' ', '_')}_report.md"

default_args = {
    'owner': 'airflow',
    'start_date': datetime(2025, 7, 7),
    'depends_on_past': False,
}

with DAG(
    dag_id='investment_report_etl_modular',
    default_args=default_args,
    schedule_interval='@daily',
    catchup=False,
    description='Modular ETL pipeline for daily investment report'
) as dag:

    extract = PythonOperator(
        task_id='extract_data',
        python_callable=extract_data,
        op_kwargs={'company_name': COMPANY_NAME, 'stock_ticker': STOCK_TICKER},
    )

    transform = PythonOperator(
        task_id='transform_data',
        python_callable=transform_data,
        op_kwargs={'company_name': COMPANY_NAME, 'stock_ticker': STOCK_TICKER},
    )

    load = PythonOperator(
        task_id='load_report',
        python_callable=load_report,
        op_kwargs={
            'company_name': COMPANY_NAME,
            'stock_ticker': STOCK_TICKER,
            'output_file': OUTPUT_REPORT
        },
    )

    extract >> transform >> load
