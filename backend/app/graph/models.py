from typing import Dict, List, Tuple

NODE_LABELS: Dict[str, List[str]] = {
    "Technology": ["id", "name", "sector", "description"],
    "Company": ["id", "name", "country", "sector"],
    "Patent": ["id", "number", "title"],
    "Regulation": ["id", "number", "title"],
    "Person": ["id", "name", "role"],
    "Indicator": ["id", "code", "name"],
}

RELATIONSHIPS: List[Tuple[str, str, str]] = [
    ("Company", "HAS_PATENT", "Patent"),
    ("Patent", "RELATES_TO", "Technology"),
    ("Regulation", "REGULATES", "Technology"),
    ("Company", "OPERATES_IN", "Technology"),
    ("Person", "WORKS_AT", "Company"),
    ("Person", "IS_AUTHOR_OF", "Patent"),
    ("Indicator", "MEASURES", "Technology"),
]
