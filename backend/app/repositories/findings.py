import uuid
from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.finding import Finding


class FindingRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, finding_data: dict) -> Finding:
        finding = Finding(**finding_data)
        self.db.add(finding)
        self.db.commit()
        self.db.refresh(finding)
        return finding

    def create_bulk(self, findings_list: List[dict]) -> List[Finding]:
        findings = [Finding(**data) for data in findings_list]
        self.db.add_all(findings)
        self.db.commit()
        for f in findings:
            self.db.refresh(f)
        return findings

    def get_by_session(
        self,
        session_id: uuid.UUID,
        severity: Optional[str] = None,
        category: Optional[str] = None,
    ) -> List[Finding]:
        stmt = select(Finding).where(Finding.session_id == session_id)
        if severity:
            stmt = stmt.where(Finding.severity.ilike(severity))
        if category:
            stmt = stmt.where(Finding.category.ilike(category))
        stmt = stmt.order_by(Finding.created_at)
        return list(self.db.scalars(stmt).all())

    def update_status(self, finding_id: uuid.UUID, status: str) -> Optional[Finding]:
        finding = self.db.get(Finding, finding_id)
        if finding:
            finding.status = status
            self.db.commit()
            self.db.refresh(finding)
        return finding
