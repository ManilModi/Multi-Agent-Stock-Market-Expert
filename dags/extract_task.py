from Features.agents import get_agents
from Features.tasks import get_tasks
from crewai import Crew, Process

def extract_data(company_name: str, stock_ticker: str, **context):
    print("🔍 Extract step: running CrewAI extract tasks...")

    agents = get_agents(company_name, stock_ticker)
    tasks = get_tasks(company_name, stock_ticker, agents)

    extract_tasks = tasks[:4]

    crew = Crew(
        agents=list(agents.values()),
        tasks=extract_tasks,
        process=Process.sequential,
        use_mcp=True
    )

    result = crew.kickoff({
        "query": f"Fetch raw data for {company_name} ({stock_ticker})"
    })

    context['ti'].xcom_push(key='raw_extract', value=result)
    print("✅ Extract completed")
