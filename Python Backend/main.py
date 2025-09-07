import os
import sys
import types
from dotenv import load_dotenv

load_dotenv()

# Disable telemetry & enable debug
os.environ["CREWAI_TELEMETRY_DISABLED"] = "true"
os.environ["CREWAI_DEBUG"] = "true"  # ✅ Force CrewAI to show tracebacks

import requests

# Monkey patch requests to never timeout
_old_request = requests.Session.request
def _new_request(self, *args, **kwargs):
    kwargs['timeout'] = None  # no timeout
    return _old_request(self, *args, **kwargs)

requests.Session.request = _new_request

# --- Now import CrewAI ---
from crewai import Crew, Process
from dags.Features.agents import get_agents
from dags.Features.tasks import get_tasks
from qualifire import client
import json
from Utils.final_datasets import generate_final_dataset
from Utils.cloudinary import upload_md_to_cloudinary

QUALIFIRE_API_KEY = os.getenv("QUALIFIRE_API_KEY")

company_name = "RELIANCE"
stock_ticker = "RELIANCE.NSE"

def run(company_name: str = company_name, stock_ticker: str = stock_ticker) -> str:
    agents = get_agents(company_name, stock_ticker)
    tasks = get_tasks(company_name, stock_ticker, agents)

    crew = Crew(
        agents=list(agents.values()),
        tasks=tasks,
        process=Process.sequential,
        use_mcp=True,
        telemetry=False
    )

    try:
        result = crew.kickoff({
    "query": f"Fetch stock insights for {company_name} ({stock_ticker})",
    "company_name": company_name,
    "stock_ticker": stock_ticker,
})

        print("\n📝 Final Output:\n", result)
    except Exception as e:
        import traceback
        print("❌ Unhandled CrewAI Error:", str(e))
        traceback.print_exc()
        return "ERROR: CrewAI kickoff failed"

    try:
        generate_final_dataset(company_name.lower().replace(" ", "_"))
    except Exception as e:
        print(f"❌ Error generating final dataset CSV: {e}")

    try:
        q = client.Client(api_key=QUALIFIRE_API_KEY)
        validation = q.evaluate(
            input=f"Generate equity report for {company_name} ({stock_ticker})",
            output=str(result),
            hallucinations_check=True,
            grounding_check=True,
            prompt_injections=True,
            instructions_following_check=True,
            dangerous_content_check=True,
            sexual_content_check=True,
            hate_speech_check=True
        )

        print("\n✅ Qualifire Guardrails Summary:")
        print("Score:", validation.score)
        print("Status:", validation.status)
        print("Evaluations:", validation.evaluationResults)

        with open("qualifire_eval_report.json", "w", encoding="utf-8") as f:
            json.dump(validation.__dict__, f, indent=2, default=str)
            print("📄 Saved evaluation results to qualifire_eval_report.json")
    except Exception as e:
        print(f"❌ Qualifire evaluation failed: {e}")

    md_file_path = f"./Reports/{company_name.lower().replace(' ', '_')}.md"
    
    if not os.path.exists(md_file_path):
        raise FileNotFoundError(f"Expected report file not found: {md_file_path}")
    
    try:
        md_cloud_url = upload_md_to_cloudinary(md_file_path, folder="reports")
        print(f"☁ Uploaded Markdown report to Cloudinary: {md_cloud_url}")
    except Exception as e:
        print(f"❌ Upload to Cloudinary failed: {e}")
        md_cloud_url = None

    return md_cloud_url

if __name__ == "__main__":
    md_path = run()
    print(f"Markdown file created at: {md_path}")
