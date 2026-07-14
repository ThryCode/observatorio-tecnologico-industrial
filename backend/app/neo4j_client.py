from neo4j import AsyncGraphDatabase

from app.core.config import Settings


def create_neo4j_driver(settings: Settings):
    return AsyncGraphDatabase.driver(
        settings.neo4j_uri,
        auth=(settings.neo4j_user, settings.neo4j_password),
    )
