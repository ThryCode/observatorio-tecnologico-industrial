NODE_LABELS: dict[str, list[str]] = {
    "Technology": [
        "id", "nombre", "descripcion", "sector_codigo",
        "trl_nivel", "referencia_ontologia", "palabras_clave",
    ],
    "Organization": [
        "id", "nombre", "siglas", "tipo", "sector_codigo",
        "pais", "provincia", "sitio_web", "email_contacto",
    ],
    "Patent": [
        "id", "title", "patent_number", "applicant", "inventor",
        "filing_date", "publication_date", "status", "abstract",
        "technological_sector", "country", "technology_id", "organization_id",
    ],
    "Regulation": [
        "id", "title", "regulation_number", "issuing_body",
        "publication_date", "effective_date", "category", "summary",
        "sector_codigo",
    ],
    "Person": ["id", "name", "role"],
    "Indicator": [
        "id", "name", "code", "description", "unit", "value",
        "source", "period", "sector_codigo", "date",
    ],
    "IndustrialSector": ["codigo", "nombre", "descripcion"],
}

RELATIONSHIPS: list[tuple[str, str, str]] = [
    ("Organization", "HAS_PATENT", "Patent"),
    ("Patent", "RELATES_TO", "Technology"),
    ("Regulation", "REGULATES", "Technology"),
    ("Organization", "OPERATES_IN", "Technology"),
    ("Person", "WORKS_AT", "Organization"),
    ("Person", "IS_AUTHOR_OF", "Patent"),
    ("Indicator", "MEASURES", "Technology"),
    ("Organization", "BELONGS_TO_SECTOR", "IndustrialSector"),
    ("Technology", "BELONGS_TO_SECTOR", "IndustrialSector"),
    ("Regulation", "BELONGS_TO_SECTOR", "IndustrialSector"),
    ("Indicator", "BELONGS_TO_SECTOR", "IndustrialSector"),
]
