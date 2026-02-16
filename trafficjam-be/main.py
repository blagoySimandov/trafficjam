from io import StringIO

from fastapi import FastAPI

from models import PlanCreationRequest, PlanCreationResponse
from plans import generate_plan_for_agent, MATSimXMLWriter
from agents.agent_creation import create_agents_from_network

app = FastAPI()

MATSIM_WRAPPER_URL = "http://localhost:8080"
MAX_AGENTS = 100


@app.get("/")
def root():
    return {"message": "Hello World! This is the main page."}


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/plan_creation", response_model=PlanCreationResponse)
async def plan_creation(request: PlanCreationRequest):
    writer = MATSimXMLWriter()
    writer.create_plans_document()

    agents = create_agents_from_network(
        bounds=request.bounds,
        buildings=request.buildings,
        transport_routes=[],
        country_code=request.country_code,
    )

    if len(agents) > MAX_AGENTS:
        agents = agents[:MAX_AGENTS]

    for agent in agents:
        plan = generate_plan_for_agent(agent, request.buildings)
        if plan:
            writer.add_person_plan(agent.id, plan)

    stream = StringIO()
    writer.write_to_stream(stream)
    xml_content = stream.getvalue()

    response = PlanCreationResponse(
        person_count=writer.get_person_count(),
        xml_content=xml_content,
    )

    # make it write to postgre
    with open("output/test.xml", "w", encoding="utf-8") as f:
        f.write(xml_content)
    return response


def convert_to_trip(xml_content: str):
    return


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
