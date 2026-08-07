from contextvars import ContextVar
from uuid import uuid4

request_id_var: ContextVar[str] = ContextVar("request_id", default="")


def get_request_id() -> str:
    return request_id_var.get()


def set_request_id(request_id: str | None = None) -> str:
    rid = request_id or uuid4().hex[:16]
    request_id_var.set(rid)
    return rid
