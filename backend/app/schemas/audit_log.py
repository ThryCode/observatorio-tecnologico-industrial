from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class AuditLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    action: str
    entity_type: str
    entity_id: str
    changes: dict | None = None
    ip_address: str | None = None
    created_at: datetime
