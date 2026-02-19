import xml.etree.ElementTree as ET
from typing import TextIO
from pathlib import Path
from models import DailyPlan


def _format_coordinate(value: float, precision: int = 4) -> str:
    return f"{value:.{precision}f}"


def _indent_xml(elem: ET.Element, level: int = 0) -> None:
    indent = "\n" + "  " * level
    if len(elem):
        if not elem.text or not elem.text.strip():
            elem.text = indent + "  "
        if not elem.tail or not elem.tail.strip():
            elem.tail = indent
        for child in elem:
            _indent_xml(child, level + 1)
        if not elem[-1].tail or not elem[-1].tail.strip():
            elem[-1].tail = indent
    else:
        if level and (not elem.tail or not elem.tail.strip()):
            elem.tail = indent


class MATSimXMLWriter:
    def __init__(self, crs: str = "EPSG:4326"):
        self.crs = crs
        self.plans_element: ET.Element | None = None
        self._person_count = 0

    def create_plans_document(self) -> ET.Element:
        self.plans_element = ET.Element("plans")

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
        if self.plans_element is None:
            self.create_plans_document()
        assert self.plans_element is not None

        person = ET.SubElement(self.plans_element, "person")
        person.set("id", person_id)

        plan_elem = ET.SubElement(person, "plan")
        if selected:
            plan_elem.set("selected", "yes")

        for i, activity in enumerate(plan.activities):
            act = ET.SubElement(plan_elem, "act")
            act.set("type", activity.type.value)
            x, y = activity.location
            act.set("x", _format_coordinate(x))
            act.set("y", _format_coordinate(y))

            if activity.end_time:
                act.set("end_time", activity.end_time.strftime("%H:%M:%S"))
            if activity.duration:
                act.set("dur", activity.duration.strftime("%H:%M:%S"))

            if i < len(plan.transport):
                leg = ET.SubElement(plan_elem, "leg")
                leg.set("mode", plan.transport[i].mode)

        self._person_count += 1

    def write_to_file(self, output_path: str | Path) -> None:
        if self.plans_element is None:
            raise ValueError(
                "No plans document created. Call create_plans_document first."
            )

        output_path = Path(output_path)
        output_path.parent.mkdir(parents=True, exist_ok=True)

        _indent_xml(self.plans_element)

        xml_str = ET.tostring(self.plans_element, encoding="unicode")

        with open(output_path, "w", encoding="utf-8") as f:
            f.write('<?xml version="1.0" ?>\n')
            f.write(
                '<!DOCTYPE plans SYSTEM "http://www.matsim.org/files/dtd/plans_v4.dtd">\n'
            )
            f.write(xml_str)

    def write_to_stream(self, stream: TextIO) -> None:
        if self.plans_element is None:
            raise ValueError(
                "No plans document created. Call create_plans_document first."
            )

        _indent_xml(self.plans_element)
        xml_str = ET.tostring(self.plans_element, encoding="unicode")

        stream.write('<?xml version="1.0" ?>\n')
        stream.write(
            '<!DOCTYPE plans SYSTEM "http://www.matsim.org/files/dtd/plans_v4.dtd">\n'
        )
        stream.write(xml_str)

    def get_person_count(self) -> int:
        return self._person_count


def write_plans_xml(
    plans: list[tuple[str, DailyPlan]],
    output_path: str | Path,
    crs: str = "EPSG:4326",
) -> int:
    writer = MATSimXMLWriter(crs=crs)
    writer.create_plans_document()

    for person_id, plan in plans:
        writer.add_person_plan(person_id, plan)

    writer.write_to_file(output_path)
    return writer.get_person_count()
