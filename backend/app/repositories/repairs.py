import uuid
from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.repair_attempt import RepairAttempt


class RepairRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, repair_data: dict) -> RepairAttempt:
        repair = RepairAttempt(**repair_data)
        self.db.add(repair)
        self.db.commit()
        self.db.refresh(repair)
        return repair

    def get_by_session(self, session_id: uuid.UUID) -> List[RepairAttempt]:
        stmt = (
            select(RepairAttempt)
            .where(RepairAttempt.session_id == session_id)
            .order_by(RepairAttempt.attempt_number)
        )
        return list(self.db.scalars(stmt).all())

    def get_latest_attempt(self, session_id: uuid.UUID) -> Optional[RepairAttempt]:
        stmt = (
            select(RepairAttempt)
            .where(RepairAttempt.session_id == session_id)
            .order_by(RepairAttempt.attempt_number.desc())
        )
        return self.db.scalars(stmt).first()
