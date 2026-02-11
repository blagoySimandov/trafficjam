import xml.etree.ElementTree as ET
from xml.dom import minidom
from typing import TextIO
from pathlib import Path

from .activity_scheduler import DailyPlan, Activity, Leg


def _format_coordinate(value: float, precision: int = 4) -> str:
    """Format coordinate with appropriate precision."""
    return f"{value:.{precision}f}"


def _indent_xml(elem: ET.Element, level: int = 0) -> None:
    """Add indentation to XML element for pretty printing."""
    indent = "\n" + "  " * level
    if len(elem):
        if not elem.text or not elem.text.strip():
            elem.text = indent + "  "
        if not elem.tail or not elem.tail.strip():
            elem.tail = indent
        for child in elem:
            _indent_xml(child, level + 1)
        if not child.tail or not child.tail.strip():
            child.tail = indent
    else:
        if level and (not elem.tail or not elem.tail.strip()):
            elem.tail = indent


class MATSimXMLWriter:
    """Write MATSim-compatible XML plan files."""

    def __init__(self, crs: str = "EPSG:4326"):
        self.crs = crs
        self.plans_element: ET.Element | None = None
        self._person_count = 0

    def create_plans_document(self) -> ET.Element:
        """Create the root plans element with attributes."""
        self.plans_element = ET.Element("plans")

        # Add attributes element with CRS
        attributes = ET.SubElement(self.plans_element, "attributes")
        crs_attr = ET.SubElement(attributes, "attribute")
        crs_attr.set("name", "coordinateReferenceSystem")
        crs_attr.set("class", "java.lang.String")
        crs_attr.text = self.crs

        self._person_count = 0
        return self.plans_element

    def add_person_plan(
        self, person_id: str, plan: DailyPlan, selected: bool = True
    ) -> None:
        """Add a person with their plan to the document."""
        if self.plans_element is None:
            self.create_plans_document()

        person = ET.SubElement(self.plans_element, "person")
        person.set("id", person_id)

        plan_elem = ET.SubElement(person, "plan")
        if selected:
            plan_elem.set("selected", "yes")

        # Interleave activities and legs
        for i, activity in enumerate(plan.activities):
            act = ET.SubElement(plan_elem, "act")
            act.set("type", activity.type.value)
            act.set("x", _format_coordinate(activity.x))
            act.set("y", _format_coordinate(activity.y))

            if activity.end_time:
                act.set("end_time", activity.end_time)
            if activity.duration:
                act.set("dur", activity.duration)

            # Add leg after activity (except for last activity)
            if i < len(plan.legs):
                leg = ET.SubElement(plan_elem, "leg")
                leg.set("mode", plan.legs[i].mode)

        self._person_count += 1

    def write_to_file(self, output_path: str | Path) -> None:
        """Write the XML document to a file."""
        if self.plans_element is None:
            raise ValueError("No plans document created. Call create_plans_document first.")

        output_path = Path(output_path)
        output_path.parent.mkdir(parents=True, exist_ok=True)

        # Add indentation for readability
        _indent_xml(self.plans_element)

        # Create the XML string with declaration and doctype
        xml_str = ET.tostring(self.plans_element, encoding="unicode")

        with open(output_path, "w", encoding="utf-8") as f:
            f.write('<?xml version="1.0" ?>\n')
            f.write(
                '<!DOCTYPE plans SYSTEM "http://www.matsim.org/files/dtd/plans_v4.dtd">\n'
            )
            f.write(xml_str)

    def write_to_stream(self, stream: TextIO) -> None:
        """Write the XML document to a stream."""
        if self.plans_element is None:
            raise ValueError("No plans document created. Call create_plans_document first.")

        _indent_xml(self.plans_element)
        xml_str = ET.tostring(self.plans_element, encoding="unicode")

        stream.write('<?xml version="1.0" ?>\n')
        stream.write(
            '<!DOCTYPE plans SYSTEM "http://www.matsim.org/files/dtd/plans_v4.dtd">\n'
        )
        stream.write(xml_str)

    def get_person_count(self) -> int:
        """Return the number of persons added."""
        return self._person_count


def write_plans_xml(
    plans: list[tuple[str, DailyPlan]],
    output_path: str | Path,
    crs: str = "EPSG:4326",
) -> int:
    """Convenience function to write multiple plans to a file.

    Args:
        plans: List of (person_id, DailyPlan) tuples
        output_path: Path to write the XML file
        crs: Coordinate reference system (default WGS84)

    Returns:
        Number of persons written
    """
    writer = MATSimXMLWriter(crs=crs)
    writer.create_plans_document()

    for person_id, plan in plans:
        writer.add_person_plan(person_id, plan)

    writer.write_to_file(output_path)
    return writer.get_person_count()
