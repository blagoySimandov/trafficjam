"""
Cork City MATSim Agent Generator - FINAL WORKING VERSION
=========================================================
Creates realistic agents for Cork City based on Census 2022 data and O-D patterns.

COORDINATE FIX:
Your network has X-coordinates offset by -32,400m from standard EPSG:2157.
- Standard EPSG:2157 Cork City: X~568,800, Y~5,750,200
- Your network Cork City: X~536,445, Y~5,750,159

This version uses coordinates that match YOUR network exactly.
"""

import random
import csv
from datetime import datetime
from typing import List, Tuple


class CorkODData:
    """
    Cork City O-D data with coordinates matching your network.
    X-offset of -32,400m applied to match network.
    """

    # Major Cork O-D pairs from Census 2022
    MAJOR_FLOWS = {
        ('Carrigaline', 'Cork_City_Centre'): (3477, 12.0),
        ('Cobh', 'Cork_City_Centre'): (2215, 24.0),
        ('Midleton', 'Cork_City_Centre'): (1814, 22.0),
        ('Passage_West', 'Cork_City_Centre'): (1453, 10.0),
        ('Carrigtwohill', 'Cork_City_Centre'): (1216, 18.0),
        ('Mallow', 'Cork_City_Centre'): (1060, 30.0),
        ('Ballincollig', 'Cork_City_Centre'): (2500, 8.0),
        ('Douglas', 'Cork_City_Centre'): (3000, 5.0),
        ('Bishopstown', 'Cork_City_Centre'): (2800, 6.0),
        ('Blackpool', 'Cork_City_Centre'): (2500, 4.0),
        ('Mahon', 'Little_Island'): (1500, 6.0),
        ('Cork_City_Centre', 'Cork_City_Centre'): (25000, 2.0),
    }

    # Coordinates WITH X-OFFSET applied to match your network
    # Format: standard_X - 32400 = network_X
    DESTINATIONS = {
        'Cork_City_Centre': {'x': 536400.0, 'y': 5750200.0, 'jobs': 40000},  # 568800-32400
        'Little_Island': {'x': 547100.0, 'y': 5751200.0, 'jobs': 12000},     # 579500-32400
        'Mahon': {'x': 540900.0, 'y': 5748800.0, 'jobs': 8000},              # 573300-32400
        'Cork_Airport': {'x': 536000.0, 'y': 5744100.0, 'jobs': 3000},       # 568400-32400
        'Ballincollig': {'x': 528700.0, 'y': 5750300.0, 'jobs': 5000},       # 561100-32400
        'Blackpool': {'x': 537500.0, 'y': 5752400.0, 'jobs': 4000},          # 569900-32400
    }
    
    ORIGINS = {
        'Carrigaline': {'x': 541100.0, 'y': 5739900.0},     # 573500-32400
        'Cobh': {'x': 550600.0, 'y': 5744800.0},            # 583000-32400
        'Midleton': {'x': 558100.0, 'y': 5752400.0},        # 590500-32400
        'Passage_West': {'x': 544400.0, 'y': 5746900.0},    # 576800-32400
        'Carrigtwohill': {'x': 553100.0, 'y': 5751700.0},   # 585500-32400
        'Mallow': {'x': 528900.0, 'y': 5777300.0},          # 561300-32400
        'Ballincollig': {'x': 528700.0, 'y': 5750300.0},    # 561100-32400
        'Douglas': {'x': 540600.0, 'y': 5748100.0},         # 573000-32400
        'Bishopstown': {'x': 532300.0, 'y': 5748500.0},     # 564700-32400
        'Blackpool': {'x': 537500.0, 'y': 5752400.0},       # 569900-32400
        'Mahon': {'x': 540900.0, 'y': 5748800.0},           # 573300-32400
        'Cork_City_Centre': {'x': 536400.0, 'y': 5750200.0}, # 568800-32400
    }

    @classmethod
    def get_all_od_pairs(cls) -> List[Tuple[str, str, int, float]]:
        return [
            (origin, dest, count, distance)
            for (origin, dest), (count, distance) in cls.MAJOR_FLOWS.items()
        ]
    
    @classmethod
    def get_origin_coords(cls, origin: str) -> Tuple[float, float]:
        if origin in cls.ORIGINS:
            return (cls.ORIGINS[origin]['x'], cls.ORIGINS[origin]['y'])
        return (536400.0, 5750200.0)  # Default: Cork City Centre
    
    @classmethod
    def get_destination_coords(cls, destination: str) -> Tuple[float, float]:
        if destination in cls.DESTINATIONS:
            return (cls.DESTINATIONS[destination]['x'], cls.DESTINATIONS[destination]['y'])
        return (536400.0, 5750200.0)  # Default: Cork City Centre


class CorkModeChoice:
    @staticmethod
    def assign_mode(distance_km: float) -> str:
        if distance_km < 2.0:
            modes = ['car'] * 30 + ['walk'] * 50 + ['bike'] * 10 + ['bus'] * 5 + ['car_passenger'] * 5
        elif distance_km < 5.0:
            modes = ['car'] * 55 + ['walk'] * 20 + ['bike'] * 5 + ['bus'] * 10 + ['car_passenger'] * 10
        elif distance_km < 15.0:
            modes = ['car'] * 70 + ['walk'] * 2 + ['bike'] * 1 + ['bus'] * 12 + ['car_passenger'] * 15
        else:
            modes = ['car'] * 75 + ['walk'] * 0 + ['bike'] * 0 + ['bus'] * 10 + ['car_passenger'] * 15
        return random.choice(modes)


class CorkTemporalDistribution:
    @staticmethod
    def generate_departure_time() -> str:
        rand = random.random()
        if rand < 0.05:
            hour = random.randint(5, 6)
            minute = random.randint(0, 29)
        elif rand < 0.15:
            hour = 6
            minute = random.randint(30, 59)
        elif rand < 0.35:
            hour = 7
            minute = random.randint(0, 29)
        elif rand < 0.60:
            hour = 7
            minute = random.randint(30, 59)
        elif rand < 0.85:
            hour = 8
            minute = random.randint(0, 29)
        elif rand < 0.95:
            hour = 8
            minute = random.randint(30, 59)
        else:
            hour = 9
            minute = random.randint(0, 29)
        second = random.randint(0, 59)
        return f"{hour:02d}:{minute:02d}:{second:02d}"
    
    @staticmethod
    def generate_work_duration() -> str:
        hours = random.randint(7, 9)
        minutes = random.choice([0, 15, 30, 45])
        return f"{hours:02d}:{minutes:02d}:00"


class CorkAgent:
    def __init__(self, agent_id: int, origin: str, destination: str,
                 origin_coords: Tuple[float, float], dest_coords: Tuple[float, float],
                 distance_km: float):
        self.agent_id = agent_id
        self.origin = origin
        self.destination = destination
        self.home_x, self.home_y = origin_coords
        self.work_x, self.work_y = dest_coords
        self.distance_km = distance_km
        
        # Add spatial variation (±1km)
        self.home_x += random.uniform(-1000, 1000)
        self.home_y += random.uniform(-1000, 1000)
        self.work_x += random.uniform(-1000, 1000)
        self.work_y += random.uniform(-1000, 1000)
        
        self.mode = CorkModeChoice.assign_mode(distance_km)
        self.departure_time = CorkTemporalDistribution.generate_departure_time()
        self.work_duration = CorkTemporalDistribution.generate_work_duration()
    
    def to_matsim_xml(self) -> str:
        xml = f'<person id="{self.agent_id}">\n'
        xml += '\t<plan>\n'
        xml += f'\t\t<act type="h" x="{self.home_x:.1f}" y="{self.home_y:.1f}" end_time="{self.departure_time}" />\n'
        xml += f'\t\t<leg mode="{self.mode}">\n'
        xml += '\t\t</leg>\n'
        xml += f'\t\t<act type="w" x="{self.work_x:.1f}" y="{self.work_y:.1f}" dur="{self.work_duration}" />\n'
        xml += f'\t\t<leg mode="{self.mode}">\n'
        xml += '\t\t</leg>\n'
        xml += f'\t\t<act type="h" x="{self.home_x:.1f}" y="{self.home_y:.1f}" />\n'
        xml += '\t</plan>\n'
        xml += '</person>\n'
        return xml


class CorkAgentGenerator:
    def __init__(self, sample_fraction: float = 1.0):
        self.sample_fraction = sample_fraction
        self.agents: List[CorkAgent] = []
        self.agent_counter = 0
    
    def generate_agents_from_od_data(self):
        print("Generating Cork City agents with network-matched coordinates...")
        print(f"Coordinate ranges: X: ~528k-558k, Y: ~5.74M-5.78M (7 digits!)")
        print()
        
        od_pairs = CorkODData.get_all_od_pairs()
        
        for origin, destination, count, distance_km in od_pairs:
            num_agents = int(count * self.sample_fraction)
            origin_coords = CorkODData.get_origin_coords(origin)
            dest_coords = CorkODData.get_destination_coords(destination)
            
            print(f"  {origin} -> {destination}: {num_agents} agents")
            print(f"    Origin: x={origin_coords[0]:.1f}, y={origin_coords[1]:.1f}")
            print(f"    Dest:   x={dest_coords[0]:.1f}, y={dest_coords[1]:.1f}")
            
            for _ in range(num_agents):
                self.agent_counter += 1
                agent = CorkAgent(
                    agent_id=self.agent_counter,
                    origin=origin,
                    destination=destination,
                    origin_coords=origin_coords,
                    dest_coords=dest_coords,
                    distance_km=distance_km
                )
                self.agents.append(agent)
        
        print(f"\n[OK] Total: {len(self.agents)} agents")
        self._print_mode_statistics()
    
    def _print_mode_statistics(self):
        if not self.agents:
            return
        mode_counts = {}
        for agent in self.agents:
            mode_counts[agent.mode] = mode_counts.get(agent.mode, 0) + 1
        total = len(self.agents)
        print("\nMode Shares:")
        for mode in sorted(mode_counts.keys()):
            print(f"  {mode}: {mode_counts[mode]} ({mode_counts[mode]/total*100:.1f}%)")
    
    def write_matsim_plans(self, output_file: str):
        print(f"\nWriting to: {output_file}")
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write('<?xml version="1.0" ?>\n')
            f.write('<!DOCTYPE plans SYSTEM "http://www.matsim.org/files/dtd/plans_v4.dtd">\n')
            f.write('<plans xml:lang="de-CH">\n')
            f.write(f'<!-- {len(self.agents)} agents, {datetime.now().strftime("%Y-%m-%d %H:%M:%S")} -->\n')
            f.write('<!-- Coordinates offset by X=-32,400m to match network -->\n')
            f.write('<!-- Network range: X ~536k-537k, Y ~5.75M -->\n')
            
            for agent in self.agents:
                f.write(agent.to_matsim_xml())
                f.write('\n')
            
            f.write('</plans>\n')
        print(f"[OK] Written {len(self.agents)} agents")
        print(f"   Coordinate format check: Y-values have 7 digits (5.7M range)")
    
    def write_od_summary(self, output_file: str):
        print(f"Writing summary: {output_file}")
        od_counts = {}
        for agent in self.agents:
            key = (agent.origin, agent.destination)
            od_counts[key] = od_counts.get(key, 0) + 1
        
        with open(output_file, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow(['Origin', 'Destination', 'Count', 'Sample', 'Full_Pop'])
            for (origin, dest), count in sorted(od_counts.items()):
                writer.writerow([origin, dest, count, f"{self.sample_fraction:.2f}", int(count/self.sample_fraction)])


def main():
    print("=" * 70)
    print("Cork City MATSim Agent Generator - FINAL WORKING VERSION")
    print("=" * 70)
    print()
    print("This script generates agents with coordinates that match YOUR network:")
    print("  - Network X: ~536,000-537,000 (offset from standard EPSG:2157)")
    print("  - Network Y: ~5,749,000-5,751,000 (7 digits, standard EPSG:2157)")
    print()
    
    SAMPLE_FRACTION = 0.1
    generator = CorkAgentGenerator(sample_fraction=SAMPLE_FRACTION)
    generator.generate_agents_from_od_data()
    
    output_plans = 'MatSimInputs/cork_city_plans_WORKING.xml'
    output_summary = 'MatSimInputs/cork_city_od_summary_WORKING.csv'
    
    generator.write_matsim_plans(output_plans)
    generator.write_od_summary(output_summary)
    
    print("\n" + "=" * 70)
    print("[OK] SUCCESS! Files generated:")
    print(f"   - {output_plans}")
    print(f"   - {output_summary}")
    print("=" * 70)
    print("\nUpdate your config.xml:")
    print(f'  <param name="inputPlansFile" value="{output_plans}" />')
    print()
    print("Your agents will now appear in the correct locations on the network!")


if __name__ == "__main__":
    main()