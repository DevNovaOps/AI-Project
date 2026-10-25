import uuid
from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.finding import Finding


class FindingRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, finding_data: dict) -> Finding:
        valid_cols = {
            "id", "session_id", "source_file_id", "category",
            "severity", "title", "description", "line_number",
            "column_number", "evidence", "origin", "status",
            "metadata_info"
        }
        meta = dict(finding_data.get("metadata_info") or {})
        cleaned = {}
        for k, v in finding_data.items():
            if k in valid_cols:
                cleaned[k] = v
            else:
                meta[k] = v
        cleaned["metadata_info"] = meta
        finding = Finding(**cleaned)
        self.db.add(finding)
        self.db.commit()
        self.db.refresh(finding)
        return finding

    def create_bulk(self, findings_list: List[dict]) -> List[Finding]:
        valid_cols = {
            "id", "session_id", "source_file_id", "category",
            "severity", "title", "description", "line_number",
            "column_number", "evidence", "origin", "status",
            "metadata_info"
        }
        cleaned_list = []
        for finding_data in findings_list:
            meta = dict(finding_data.get("metadata_info") or {})
            cleaned = {}
            for k, v in finding_data.items():
                if k in valid_cols:
                    cleaned[k] = v
                else:
                    meta[k] = v
            cleaned["metadata_info"] = meta
            cleaned_list.append(Finding(**cleaned))
        self.db.add_all(cleaned_list)
        self.db.commit()
        for f in cleaned_list:
            self.db.refresh(f)
        return cleaned_list

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

    def delete_by_session(self, session_id: uuid.UUID) -> int:
        from sqlalchemy import delete
        stmt = delete(Finding).where(Finding.session_id == session_id)
        res = self.db.execute(stmt)
        self.db.commit()
        return res.rowcount
