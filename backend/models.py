from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class UserCreate(BaseModel):
    """Schema for creating a new user."""

    username: str = Field(..., min_length=1, description="Username for the user")
    is_admin: bool = Field(default=False, description="Whether the user is an admin")


class UserResponse(BaseModel):
    """Schema for user response."""

    id: str
    created_at: datetime
    username: str
    is_admin: bool

    class Config:
        from_attributes = True


class StatusCreate(BaseModel):
    """Schema for creating a new status entry."""

    user_uuid: str = Field(..., description="UUID of the user this status belongs to")
    is_enabled: bool = Field(default=False, description="Whether the status is enabled")
    theme: Optional[str] = Field(default=None, description="Theme setting for the user")


class StatusUpdate(BaseModel):
    """Schema for updating a status entry."""

    is_enabled: Optional[bool] = Field(
        default=None, description="Whether the status is enabled"
    )
    theme: Optional[str] = Field(default=None, description="Theme setting for the user")


class StatusResponse(BaseModel):
    """Schema for status response."""

    id: int
    created_at: datetime
    user_uuid: str
    is_enabled: bool
    theme: Optional[str]

    class Config:
        from_attributes = True


class TextTransformRequest(BaseModel):
    """Schema for text transformation request."""

    text: str = Field(..., min_length=1, description="Original text to transform")


class TextTransformResponse(BaseModel):
    """Schema for text transformation response."""

    original_text: str
    transformed_text: str
    theme: Optional[str] = Field(description="Theme that was applied, if any")
