# from airflow import DAG
# from airflow.operators.python import PythonOperator
# from airflow.utils.dates import days_ago
# from crewai_etl_utils import run_crewai_agents, save_report_to_s3, save_data_to_mongo, send_slack_notification

# from datetime import timedelta

# default_args = {
#     'owner': 'airflow',
#     'depends_on_past': False,
#     'email_on_failure': True,
#     'email_on_retry': False,
#     'retries': 1,
#     'retry_delay': timedelta(minutes=5),
# }

# with DAG(
#     'daily_equity_report_pipeline',
#     default_args=default_args,
#     description='Run CrewAI to generate daily equity report & store to S3 and MongoDB',
#     schedule_interval='0 10 * * 1-5',  # Every weekday at 10 AM
#     start_date=days_ago(1),
#     catchup=False,
#     tags=['equity', 'crewai', 'etl'],
# ) as dag:

#     run_agents_task = PythonOperator(
#         task_id='run_crewai_agents',
#         python_callable=run_crewai_agents,
#     )

#     save_to_s3_task = PythonOperator(
#         task_id='save_report_to_s3',
#         python_callable=save_report_to_s3,
#     )

#     save_to_mongo_task = PythonOperator(
#         task_id='save_data_to_mongo',
#         python_callable=save_data_to_mongo,
#     )

#     notify_slack_task = PythonOperator(
#         task_id='send_slack_notification',
#         python_callable=send_slack_notification,
#     )

#     # DAG structure
#     run_agents_task >> [save_to_s3_task, save_to_mongo_task] >> notify_slack_task
