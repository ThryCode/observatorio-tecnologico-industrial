from sqlalchemy import ColumnElement, func
from sqlalchemy.sql import asc, desc


def apply_sorting(query, _model, sort_by: str | None, sort_order: str = "desc", allowed_sorts: dict | None = None):
    if sort_by and allowed_sorts and sort_by in allowed_sorts:
        col = allowed_sorts[sort_by]
        query = query.order_by(asc(col) if sort_order == "asc" else desc(col))
    return query


def apply_search(query, _model, q: str | None, fields: list[ColumnElement]):
    if not q:
        return query
    like = f"%{q}%"
    cond = func.lower(fields[0]).like(func.lower(like))
    for f in fields[1:]:
        cond = cond | func.lower(f).like(func.lower(like))
    return query.where(cond)


def apply_date_range(query, model_field, date_from, date_to):
    if date_from:
        query = query.where(model_field >= date_from)
    if date_to:
        query = query.where(model_field <= date_to)
    return query
