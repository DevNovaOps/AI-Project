import uuid
from typing import List

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.test_run import TestRun


class TestRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, test_data: dict) -> TestRun:
        test_run = TestRun(**test_data)
        self.db.add(test_run)
        self.db.commit()
        self.db.refresh(test_run)
        return test_run

    def get_by_session(self, session_id: uuid.UUID) -> List[TestRun]:
        stmt = (
            select(TestRun)
            .where(TestRun.session_id == session_id)
            .order_by(TestRun.started_at)
        )
        return list(self.db.scalars(stmt).all())
