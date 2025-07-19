# import os
# import json
# import boto3
# from slack_sdk import WebClient
# from pymongo import MongoClient
# from main import run

# AWS_BUCKET = os.getenv("AWS_BUCKET")
# AWS_REGION = os.getenv("AWS_REGION")
# SLACK_TOKEN = os.getenv("SLACK_TOKEN")
# SLACK_CHANNEL = os.getenv("SLACK_CHANNEL")
# MONGO_URI = os.getenv("MONGO_URI")

# # 1️⃣ Run CrewAI and produce report
# def run_crewai_agents():
#     result = run()  # runs agents, saves markdown to file
#     print("✅ CrewAI agents finished")
#     return result

# # 2️⃣ Upload report to S3
# def save_report_to_s3():
#     s3 = boto3.client('s3', region_name=AWS_REGION)
#     filename = 'reliance_report.md'
#     with open(filename, 'rb') as f:
#         s3.upload_fileobj(f, AWS_BUCKET, f"reports/{filename}")
#     print(f"✅ Uploaded report to s3://{AWS_BUCKET}/reports/{filename}")

# # 3️⃣ Save structured data to Mongo
# def save_data_to_mongo():
#     client = MongoClient(MONGO_URI)
#     db = client['equity_reports']
#     with open('qualifire_eval_report.json', 'r', encoding='utf-8') as f:
#         data = json.load(f)
#     db.reports.insert_one(data)
#     print("✅ Saved structured data to MongoDB")

# # 4️⃣ Slack notification
# def send_slack_notification():
#     client = WebClient(token=SLACK_TOKEN)
#     report_url = f"https://{AWS_BUCKET}.s3.{AWS_REGION}.amazonaws.com/reports/reliance_report.md"
#     text = f"📈 New Equity Report generated!\n🔗 [View Report]({report_url})"
#     client.chat_postMessage(channel=SLACK_CHANNEL, text=text)
#     print("✅ Slack notification sent")
