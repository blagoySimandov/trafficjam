import json
from io import StringIO

from agents.agent_creation import create_agents_from_network
from agents.config import AgentConfig
from agents.models import Building
from agents.plans.plan_generator import generate_plan_for_agent
from agents.plans.xml_writer import MATSimXMLWriter


def parse_buildings_and_bounds(
    buildings_json: str, bounds_json: str
) -> tuple[list[Building], dict]:
    buildings = [Building.model_validate(b) for b in json.loads(buildings_json)]
    bounds = json.loads(bounds_json)
    return buildings, bounds


def generate_plans_xml(
    bounds: dict,
    buildings: list[Building],
    agent_config: AgentConfig,
    max_agents: int,
) -> str:
    writer = MATSimXMLWriter()
    writer.create_plans_document()

    agents = create_agents_from_network(
        bounds=bounds,
        buildings=buildings,
        transport_routes=[],
        country_code="IRL",
        agent_config=agent_config,
        max_agents=max_agents,
    )

    for agent in agents:
        plan = generate_plan_for_agent(agent, buildings, agent_config)
        if plan:
            writer.add_person_plan(agent.id, plan)

    stream = StringIO()
    writer.write_to_stream(stream)
    return stream.getvalue()
