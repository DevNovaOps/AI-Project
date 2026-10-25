from typing import Any, Dict, List, Optional
from fastapi import APIRouter, status
from pydantic import BaseModel, Field

from app.services.llm_service import llm_service

router = APIRouter(prefix="/chat", tags=["Chat"])


class ChatMessageSchema(BaseModel):
    role: str = Field(default="user", description="Message sender role: user, assistant, system")
    content: str = Field(..., description="Message text content")


class ChatContextSchema(BaseModel):
    active_file_path: Optional[str] = None
    active_file_content: Optional[str] = None
    language: Optional[str] = None
    project_name: Optional[str] = None
    selected_code: Optional[str] = None
    issues: Optional[List[Dict[str, Any]]] = None


class ChatRequestSchema(BaseModel):
    messages: List[ChatMessageSchema]
    context: Optional[ChatContextSchema] = None
    model: Optional[str] = None


class ChatResponseSchema(BaseModel):
    role: str = "assistant"
    content: str
    model: str


@router.post("", response_model=ChatResponseSchema, status_code=status.HTTP_200_OK)
def chat_with_aetherion(request: ChatRequestSchema) -> ChatResponseSchema:
    """
    Conversational endpoint for interactive AI pair programming like ChatGPT and Gemini.
    Provides multi-turn dialogue, real workspace context awareness, and model failover.
    """
    msgs_data = [{"role": m.role, "content": m.content} for m in request.messages]
    context_data = request.context.model_dump() if request.context else None

    result = llm_service.chat(
        messages=msgs_data,
        context=context_data,
        preferred_model=request.model,
    )

    return ChatResponseSchema(
        role=result.get("role", "assistant"),
        content=result.get("content", ""),
        model=result.get("model", "qwen/qwen3.8-27b"),
    )
