from fastapi import Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.repositories.events import EventRepository
from app.repositories.findings import FindingRepository
from app.repositories.repairs import RepairRepository
from app.repositories.reports import ReportRepository
from app.repositories.sessions import SessionRepository
from app.repositories.tests import TestRepository


def get_session_repo(db: Session = Depends(get_db)) -> SessionRepository:
    return SessionRepository(db)


def get_finding_repo(db: Session = Depends(get_db)) -> FindingRepository:
    return FindingRepository(db)


def get_repair_repo(db: Session = Depends(get_db)) -> RepairRepository:
    return RepairRepository(db)


def get_test_repo(db: Session = Depends(get_db)) -> TestRepository:
    return TestRepository(db)


def get_report_repo(db: Session = Depends(get_db)) -> ReportRepository:
    return ReportRepository(db)


def get_event_repo(db: Session = Depends(get_db)) -> EventRepository:
    return EventRepository(db)
