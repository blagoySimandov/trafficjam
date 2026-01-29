"""Orchestration module for creating MATSim simulation plans."""
import logging
from typing import List, Dict, Any
from pathlib import Path

from agents.matsim_xml import (
    create_matsim_population_xml,
    create_matsim_config_xml,
)
from utils.file_management import get_next_try_number, save_network_snapshot

logger = logging.getLogger(__name__)


def create_matsim_plans(
    agents: List[Dict],
    bounds: Dict[str, float],
    user_id: str = "default_user",
    network_data: Any = None,
    crs: str = "EPSG:4326",
) -> Dict[str, Any]:
    """
    Create all MATSim input files for a user's try.

    Files are stored per user/city/try combination:
    - temp_tries/{user_id}_{city}_{country}_try{N}/
      - population.xml
      - config.xml
      - network_snapshot.json (map state that was used)

    Future: Will be uploaded to GCS bucket instead of temp storage.

    Args:
        agents: List of agents with locations and demographics
        bounds: Geographic bounds
        user_id: User identifier (email, session ID, etc.)
        network_data: Original network data for snapshot
        crs: Coordinate reference system

    Returns:
        Dictionary with file paths and try information
    """
    city_name = agents[0].get("city", "unknown") if agents else "unknown"
    country_code = agents[0].get("country_code", "UNK") if agents else "UNK"

    city_clean = city_name.replace(" ", "_").replace("/", "_").lower()
    user_clean = user_id.replace("@", "_").replace(".", "_").replace(" ", "_").lower()

    base_dir = Path("temp_tries")
    base_dir.mkdir(parents=True, exist_ok=True)

    try_number = get_next_try_number(user_clean, city_clean, country_code, base_dir)

    try_name = f"{user_clean}_{city_clean}_{country_code}_try{try_number}"
    output_dir = base_dir / try_name
    output_dir.mkdir(parents=True, exist_ok=True)

    files = {}

    population_path = output_dir / "population.xml"
    files["population"] = create_matsim_population_xml(agents, str(population_path))

    config_path = output_dir / "config.xml"
    files["config"] = create_matsim_config_xml(
        city_name, country_code, str(config_path), crs
    )

    if network_data:
        snapshot_path = save_network_snapshot(output_dir, network_data, bounds)
        files["network_snapshot"] = snapshot_path

    files["try_number"] = try_number
    files["try_name"] = try_name
    files["output_dir"] = str(output_dir)

    logger.info(f"Created try {try_number} for user '{user_id}' in {output_dir}")
    logger.info(f"Files created: {list(files.keys())}")
    logger.info(
        f"Future: This will be uploaded to GCS bucket at: gs://trafficjam-tries/{try_name}/"
    )

    return files
