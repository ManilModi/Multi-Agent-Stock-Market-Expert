from Features.agents import get_agents
from Features.tasks import get_tasks
from crewai import Crew, Process

def load_report(company_name: str, stock_ticker: str, output_file: str, **context):
    print("📦 Load step: generate final report...")

    agents = get_agents(company_name, stock_ticker)
    tasks = get_tasks(company_name, stock_ticker, agents)

    # Only final summary task
    summary_task = [tasks[-1]]

    crew = Crew(
        agents=list(agents.values()),
        tasks=summary_task,
        process=Process.sequential,
        use_mcp=True
    )

    result = crew.kickoff({
        "query": f"Build final investment report for {company_name} ({stock_ticker})"
    })

    # Save to markdown
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(str(result))

    print(f"✅ Saved report to: {output_file}")
