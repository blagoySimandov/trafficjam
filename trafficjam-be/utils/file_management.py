"""File and directory management utilities for MATSim simulations."""
import json
import logging
from pathlib import Path
from typing import Any, Dict

logger = logging.getLogger(__name__)


def get_next_try_number(
    user_id: str, city_name: str, country_code: str, base_dir: Path
) -> int:
    """
    Get the next try number for a user's city simulation.

    Args:
        user_id: User identifier
        city_name: City name (cleaned)
        country_code: Country code
        base_dir: Base directory for tries

    Returns:
        Next try number (1-indexed)
    """
    pattern = f"{user_id}_{city_name}_{country_code}_try*"
    existing_tries = list(base_dir.glob(pattern))

    if not existing_tries:
        return 1

    try_numbers = []
    for try_path in existing_tries:
        try:
            try_num = int(try_path.name.split("_try")[-1])
            try_numbers.append(try_num)
        except (ValueError, IndexError):
            continue

    return max(try_numbers) + 1 if try_numbers else 1


def save_network_snapshot(
    output_dir: Path, network_data: Any, bounds: Dict[str, float]
) -> str:
    """
    Save a snapshot of the network data (map state) that was used for this try.

    This allows users to see exactly what map configuration produced these results.

    Args:
        output_dir: Directory to save snapshot
        network_data: The network data from the request
        bounds: Geographic bounds

    Returns:
        Path to snapshot file
    """
    snapshot = {
        "bounds": bounds,
        "building_count": len(network_data.buildings or []),
        "node_count": len(network_data.nodes or []),
        "link_count": len(network_data.links or []),
        "transport_route_count": len(network_data.transportRoutes or []),
        "buildings": [
            {
                "id": b.id,
                "osmId": b.osmId,
                "position": b.position,
                "type": b.type,
                "tags": b.tags,
            }
            for b in (network_data.buildings or [])
        ],
        "nodes": [
            {
                "id": n.id,
                "osmId": n.osmId,
                "position": n.position,
                "connectionCount": n.connectionCount,
            }
            for n in (network_data.nodes or [])
        ],
        "links": [
            {
                "id": links.id,
                "osmId": links.osmId,
                "from_node": links.from_node,
                "to_node": links.to_node,
                "tags": links.tags,
            }
            for links in (network_data.links or [])
        ],
    }

    snapshot_path = output_dir / "network_snapshot.json"
    with open(snapshot_path, "w", encoding="utf-8") as f:
        json.dump(snapshot, f, indent=2)

    logger.info(f"Saved network snapshot to {snapshot_path}")
    return str(snapshot_path)
