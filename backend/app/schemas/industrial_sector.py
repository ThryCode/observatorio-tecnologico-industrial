from pydantic import BaseModel, Field


class IndustrialSectorCreate(BaseModel):
    codigo: str = Field(..., min_length=3, max_length=3)
    nombre: str = Field(..., min_length=1, max_length=50)
    descripcion: str | None = None


class IndustrialSectorUpdate(BaseModel):
    nombre: str | None = Field(None, min_length=1, max_length=50)
    descripcion: str | None = None


class IndustrialSectorResponse(BaseModel):
    codigo: str
    nombre: str
    descripcion: str | None

    model_config = {"from_attributes": True}
