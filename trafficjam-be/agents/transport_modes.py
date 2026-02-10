import random

from models import Agent, Adult, TransportMode


def get_transport_mode(agent: Agent, activity_type: str) -> TransportMode:
    """
    Determine transport mode based on agent characteristics and activity.
    """
    if agent.uses_public_transport:
        if random.random() > 0.8:
            return TransportMode.PUBLIC_TRANSPORT

    if agent.age < 16:
        if random.random() > 0.7:
            return TransportMode.WALK
        else:
            return TransportMode.CAR

    if 16 <= agent.age <= 25:
        if isinstance(agent, Adult) and agent.is_student:
            modes = [
                TransportMode.PUBLIC_TRANSPORT,
                TransportMode.BIKE,
                TransportMode.WALK,
                TransportMode.CAR,
            ]
            weights = [0.3, 0.2, 0.2, 0.3]
            return random.choices(modes, weights=weights)[0]

    if agent.age >= 65:
        if agent.has_car:
            modes = [
                TransportMode.CAR,
                TransportMode.PUBLIC_TRANSPORT,
                TransportMode.WALK,
            ]
            weights = [0.5, 0.3, 0.2]
            return random.choices(modes, weights=weights)[0]
        else:
            modes = [TransportMode.PUBLIC_TRANSPORT, TransportMode.WALK]
            weights = [0.6, 0.4]
            return random.choices(modes, weights=weights)[0]

    if activity_type in ["shopping", "healthcare"]:
        if agent.has_car:
            modes = [
                TransportMode.CAR,
                TransportMode.PUBLIC_TRANSPORT,
                TransportMode.WALK,
            ]
            weights = [0.6, 0.2, 0.2]
            return random.choices(modes, weights=weights)[0]
        else:
            modes = [TransportMode.PUBLIC_TRANSPORT, TransportMode.WALK]
            weights = [0.7, 0.3]
            return random.choices(modes, weights=weights)[0]

    if agent.has_car:
        return TransportMode.CAR

    return TransportMode.PUBLIC_TRANSPORT
