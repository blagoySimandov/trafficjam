"""MATSim XML file generation utilities."""
import logging
from typing import List, Dict
from pathlib import Path

from agents.daily_plans import generate_daily_plan
from agents.transport_modes import get_transport_mode
from utils.link_calculations import calculate_link_length

logger = logging.getLogger(__name__)


def create_matsim_population_xml(agents: List[Dict], output_path: str) -> str:
    """
    Create MATSim population XML file with realistic activity plans and transport modes.

    Args:
        agents: List of agent dictionaries
        output_path: Path to save the XML file

    Returns:
        Path to created file
    """
    xml_lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<!DOCTYPE population SYSTEM "http://www.matsim.org/files/dtd/population_v6.dtd">',
        "<population>",
    ]

    mode_stats = {"car": 0, "pt": 0, "walk": 0, "bike": 0}

    for agent in agents:
        xml_lines.append(f'  <person id="{agent["id"]}">')

        xml_lines.append("    <attributes>")
        xml_lines.append(
            f'      <attribute name="age" class="java.lang.Integer">{agent["age"]}</attribute>'
        )
        xml_lines.append(
            f'      <attribute name="employed" class="java.lang.Boolean">{str(agent.get("employed", False)).lower()}</attribute>'
        )
        xml_lines.append(
            f'      <attribute name="has_car" class="java.lang.Boolean">{str(agent.get("has_car", False)).lower()}</attribute>'
        )
        xml_lines.append("    </attributes>")

        activities = generate_daily_plan(agent)

        xml_lines.append('    <plan selected="yes">')

        for i, activity in enumerate(activities):
            lat, lon = activity["location"]

            if i < len(activities) - 1:
                xml_lines.append(
                    f'      <activity type="{activity["type"]}" '
                    f'x="{lon}" y="{lat}" end_time="{activity["end_time"]}" />'
                )

                mode = get_transport_mode(agent, activity["type"])
                mode_stats[mode] = mode_stats.get(mode, 0) + 1

                xml_lines.append(f'      <leg mode="{mode}" />')
            else:
                xml_lines.append(
                    f'      <activity type="{activity["type"]}" '
                    f'x="{lon}" y="{lat}" />'
                )

        xml_lines.append("    </plan>")
        xml_lines.append("  </person>")

    xml_lines.append("</population>")

    Path(output_path).parent.mkdir(parents=True, exist_ok=True)

    with open(output_path, "w", encoding="utf-8") as f:
        f.write("\n".join(xml_lines))

    logger.info(f"Created MATSim population file: {output_path}")
    logger.info(f"Transport mode distribution: {mode_stats}")
    return output_path


def create_matsim_network_xml(
    nodes: List[Dict],
    links: List[Dict],
    output_path: str,
    crs: str = "EPSG:4326",
) -> str:
    """
    Create MATSim network XML file from OSM data.

    Args:
        nodes: List of traffic nodes (coordinates in projected CRS)
        links: List of traffic links (coordinates in projected CRS)
        output_path: Path to save the XML file
        crs: Coordinate reference system

    Returns:
        Path to created file
    """
    xml_lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<!DOCTYPE network SYSTEM "http://www.matsim.org/files/dtd/network_v2.dtd">',
        '<network name="osm-network">',
        "  <attributes>",
        f'    <attribute name="coordinateReferenceSystem" class="java.lang.String">{crs}</attribute>',
        "  </attributes>",
        "  <nodes>",
    ]

    for node in nodes:
        x, y = node["position"]
        xml_lines.append(f'    <node id="{node["id"]}" x="{x}" y="{y}" />')

    xml_lines.append("  </nodes>")
    xml_lines.append("  <links>")

    highway_speeds = {
        "motorway": 110,
        "trunk": 100,
        "primary": 80,
        "secondary": 60,
        "tertiary": 50,
        "residential": 30,
        "service": 20,
        "unclassified": 40,
    }

    highway_capacity = {
        "motorway": 2000,
        "trunk": 1800,
        "primary": 1500,
        "secondary": 1200,
        "tertiary": 1000,
        "residential": 600,
        "service": 300,
        "unclassified": 800,
    }

    for link in links:
        highway_type = link["tags"].get("highway", "unclassified")

        maxspeed_kmh = link["tags"].get(
            "maxspeed", highway_speeds.get(highway_type, 50)
        )
        freespeed_ms = maxspeed_kmh / 3.6

        lanes = link["tags"].get("lanes", 1)

        capacity = highway_capacity.get(highway_type, 800) * lanes

        geometry = link["geometry"]
        length = calculate_link_length(geometry, crs)

        xml_lines.append(
            f'    <link id="{link["id"]}" from="{link["from_node"]}" to="{link["to_node"]}" '
            f'length="{length:.2f}" freespeed="{freespeed_ms:.2f}" '
            f'capacity="{capacity}" permlanes="{lanes}" />'
        )

    xml_lines.append("  </links>")
    xml_lines.append("</network>")

    Path(output_path).parent.mkdir(parents=True, exist_ok=True)

    with open(output_path, "w", encoding="utf-8") as f:
        f.write("\n".join(xml_lines))

    logger.info(f"Created MATSim network file: {output_path}")
    return output_path


def create_matsim_config_xml(
    city_name: str, country_code: str, output_path: str, crs: str = "EPSG:4326"
) -> str:
    """
    Create MATSim configuration XML file.

    Args:
        city_name: Name of the city
        country_code: Country code
        output_path: Path to save the XML file
        crs: Coordinate reference system

    Returns:
        Path to created file
    """
    xml_content = f"""<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE config SYSTEM "http://www.matsim.org/files/dtd/config_v2.dtd">
<config>
    <module name="global">
        <param name="coordinateSystem" value="{crs}" />
    </module>

    <module name="network">
        <param name="inputNetworkFile" value="network.xml" />
    </module>

    <module name="plans">
        <param name="inputPlansFile" value="population.xml" />
    </module>

    <module name="controler">
        <param name="outputDirectory" value="./simulation_output/{city_name}_{country_code}" />
        <param name="firstIteration" value="0" />
        <param name="lastIteration" value="10" />
        <param name="writeEventsInterval" value="10" />
        <param name="writePlansInterval" value="10" />
    </module>

    <module name="qsim">
        <param name="startTime" value="00:00:00" />
        <param name="endTime" value="30:00:00" />
        <param name="flowCapacityFactor" value="1.0" />
        <param name="storageCapacityFactor" value="1.0" />
    </module>

    <module name="strategy">
        <param name="maxAgentPlanMemorySize" value="5" />
        <parameterset type="strategysettings">
            <param name="strategyName" value="BestScore" />
            <param name="weight" value="0.9" />
        </parameterset>
        <parameterset type="strategysettings">
            <param name="strategyName" value="ReRoute" />
            <param name="weight" value="0.1" />
        </parameterset>
    </module>
</config>"""

    Path(output_path).parent.mkdir(parents=True, exist_ok=True)

    with open(output_path, "w", encoding="utf-8") as f:
        f.write(xml_content)

    logger.info(f"Created MATSim config file: {output_path}")
    return output_path
