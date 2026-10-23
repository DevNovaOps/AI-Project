import asyncio
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, Optional, Set

from fastapi import WebSocket

from app.core.logging import logger


class ConnectionManager:
    """
    Manages active WebSocket connections per debug session and
    broadcasts real-time workflow events to connected frontends.
    """

    def __init__(self):
        # Maps session_id (str) -> Set[WebSocket]
        self.active_connections: Dict[str, Set[WebSocket]] = {}
        self._lock = asyncio.Lock()

    async def connect(self, session_id: str, websocket: WebSocket) -> None:
        await websocket.accept()
        async with self._lock:
            if session_id not in self.active_connections:
                self.active_connections[session_id] = set()
            self.active_connections[session_id].add(websocket)
        logger.info(f"WebSocket client connected to session {session_id}")

    async def disconnect(self, session_id: str, websocket: WebSocket) -> None:
        async with self._lock:
            if session_id in self.active_connections:
                self.active_connections[session_id].discard(websocket)
                if not self.active_connections[session_id]:
                    del self.active_connections[session_id]
        logger.info(f"WebSocket client disconnected from session {session_id}")

    async def broadcast_event(
        self,
        session_id: str,
        event_type: str,
        stage_or_agent: str,
        message: str,
        payload: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Broadcasts event payload to all clients connected to this session."""
        event_data = {
            "event_id": str(uuid.uuid4()),
            "session_id": session_id,
            "event_type": event_type,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "stage_or_agent": stage_or_agent,
            "message": message,
            "payload": payload or {},
        }

        async with self._lock:
            connections = list(self.active_connections.get(session_id, []))

        dead_connections = []
        for connection in connections:
            try:
                await connection.send_json(event_data)
            except Exception as e:
                logger.warning(f"Failed to send event to WebSocket for session {session_id}: {e}")
                dead_connections.append(connection)

        if dead_connections:
            async with self._lock:
                if session_id in self.active_connections:
                    for dead in dead_connections:
                        self.active_connections[session_id].discard(dead)

        return event_data


event_manager = ConnectionManager()
