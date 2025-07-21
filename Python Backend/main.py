from crewai import Crew, Process
from dags.Features.agents import get_agents
from dags.Features.tasks import get_tasks
from qualifire import client
import os
import json
from dotenv import load_dotenv
from Utils.final_datasets import generate_final_dataset

# === Load config ===
load_dotenv()
QUALIFIRE_API_KEY = os.getenv("QUALIFIRE_API_KEY")

# === Company config ===
company_name = "MRF"
stock_ticker = "MRF.NSE"

def run():
    # === Initialize agents and tasks ===
    agents = get_agents(company_name, stock_ticker)
    tasks = get_tasks(company_name, stock_ticker, agents)

    # === Crew setup ===
    crew = Crew(
        agents=list(agents.values()),
        tasks=tasks,
        process=Process.sequential,
        use_mcp=True
    )

    # === Run Crew ===
    result = crew.kickoff({
        "query": f"Fetch stock insights for {company_name} ({stock_ticker})"
    })

    print("\n📝 Final Output:\n")
    print(result)

    # === Run Final Dataset Generator ===
    try:
        generate_final_dataset(company_name.lower().replace(" ", "_"))  # 👈 MRF => mrf
    except Exception as e:
        print(f"❌ Error generating final dataset CSV: {e}")

    # === Validate with Qualifire ===
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
    for check, value in validation.__dict__.items():
        print(f"{check}: {value}")
        
    print("\n✅ Qualifire Guardrails Summary:")
    print("Score:", validation.score)
    print("Status:", validation.status)
    print("Evaluations:", validation.evaluationResults)

    # === Save to file ===
    with open("qualifire_eval_report.json", "w", encoding="utf-8") as f:
        json.dump(validation.__dict__, f, indent=2, default=str)
        print("📄 Saved evaluation results to qualifire_eval_report.json")

if __name__ == "__main__":
    run()
