from typing import Any, Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, Field


class FileCreateRequest(BaseModel):
    path: str = Field(..., min_length=1, max_length=1000)
    content: Optional[str] = Field("", max_length=2_000_000)


class FileSaveRequest(BaseModel):
    path: str = Field(..., min_length=1, max_length=1000)
    content: str = Field(..., max_length=2_000_000)
    version: Optional[int] = Field(None, description="Expected version for conflict detection")


class FolderCreateRequest(BaseModel):
    path: str = Field(..., min_length=1, max_length=1000)


class FileRenameRequest(BaseModel):
    old_path: str = Field(..., min_length=1, max_length=1000)
    new_path: str = Field(..., min_length=1, max_length=1000)


class FileContentResponse(BaseModel):
    path: str
    filename: str
    extension: str
    content: str
    size_bytes: int
    version: int
    content_hash: str
    updated_at: Optional[str] = None


class FileTreeNode(BaseModel):
    id: str
    name: str
    type: str  # 'file' or 'folder'
    ext: Optional[str] = None
    size: Optional[int] = None
    version: Optional[int] = None
    children: Optional[List["FileTreeNode"]] = None
