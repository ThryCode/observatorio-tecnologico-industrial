from pydantic import BaseModel


class IndustrialSectorResponse(BaseModel):
    codigo: str
    nombre: str
    descripcion: str | None

    model_config = {"from_attributes": True}
