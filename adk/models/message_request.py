from pydantic import BaseModel, Field
from pathlib import Path
from typing import Optional


class MessageRequest(BaseModel):
    mime_type: str = Field(..., description="MIME type of the message")
    data: str = Field(..., description="Message data (text or base64 encoded)")
    auth_token: Optional[str] = Field(None, description="Authentication token for the user")
    admin_username: Optional[str] = Field(None, description="Admin username for officer management")
