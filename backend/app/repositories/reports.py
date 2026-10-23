from datetime import datetime
import uuid
from typing import Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.final_report import FinalReport


class ReportRepository:
    def __init__(self, db: Session):
        self.db = db

    def create_or_update(self, session_id: uuid.UUID, report_data: dict) -> FinalReport:
        stmt = select(FinalReport).where(FinalReport.session_id == session_id)
        report = self.db.scalars(stmt).first()
        data = dict(report_data)
        if "created_at" in data:
            if isinstance(data["created_at"], str):
                try:
                    data["created_at"] = datetime.fromisoformat(data["created_at"])
                except Exception:
                    data.pop("created_at", None)

        if report:
            for key, val in data.items():
                setattr(report, key, val)
        else:
            report = FinalReport(session_id=session_id, **data)
            self.db.add(report)
        self.db.commit()
        self.db.refresh(report)
        return report

    def get_by_session(self, session_id: uuid.UUID) -> Optional[FinalReport]:
        stmt = select(FinalReport).where(FinalReport.session_id == session_id)
        return self.db.scalars(stmt).first()
