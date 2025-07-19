from Features.agents import get_agents
from Features.tasks import get_tasks
from crewai import Crew, Process

def transform_data(company_name: str, stock_ticker: str, **context):
    print("⚙️ Transform step: running analysis & technical tasks...")

    agents = get_agents(company_name, stock_ticker)
    tasks = get_tasks(company_name, stock_ticker, agents)

    # Filter tasks that are analysis, chart interpretation, calculation
    transform_tasks = tasks[4:-1]  # adjust indices, skip extract & final summary

    crew = Crew(
        agents=list(agents.values()),
        tasks=transform_tasks,
        process=Process.sequential,
        use_mcp=True
    )

    result = crew.kickoff({
        "query": f"Analyze and calculate indicators for {company_name} ({stock_ticker})"
    })

    # Push result to XCom
    context['ti'].xcom_push(key='analysis_result', value=result)
    print("✅ Transform completed")
