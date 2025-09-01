from pydantic import BaseModel, Field
from typing import Dict, Optional, Any
from datetime import datetime

class OfficerPermissions(BaseModel):
    admin_dashboard_access: bool = Field(default=False, alias="adminDashboardAccess")
    homestay_approval: bool = Field(default=False, alias="homestayApproval")
    homestay_edit: bool = Field(default=False, alias="homestayEdit")
    homestay_delete: bool = Field(default=False, alias="homestayDelete")
    document_upload: bool = Field(default=False, alias="documentUpload")
    image_upload: bool = Field(default=False, alias="imageUpload")
    
    class Config:
        allow_population_by_field_name = True

class Officer(BaseModel):
    id: str = Field(..., alias="_id")
    username: str
    email: str
    contact_number: str = Field(..., alias="contactNumber")
    role: Optional[str] = None  # Made optional since API doesn't always return it
    permissions: Dict[str, Any]  # More flexible to handle Map from MongoDB
    is_active: bool = Field(..., alias="isActive")
    parent_admin: str = Field(..., alias="parentAdmin")
    created_at: Any = Field(..., alias="createdAt")  # Can be string or datetime
    updated_at: Optional[Any] = Field(None, alias="updatedAt")  # Made optional since API doesn't always return it
    
    class Config:
        allow_population_by_field_name = True

class CreateOfficerData(BaseModel):
    username: str
    password: str
    email: str
    contact_number: str = Field(..., alias="contactNumber")
    permissions: Optional[Dict[str, bool]] = Field(default_factory=dict)
    is_active: bool = Field(default=True, alias="isActive")
    
    class Config:
        allow_population_by_field_name = True


class UpdateOfficerPermissionsData(BaseModel):
    officer_id: str = Field(..., alias="officerId")
    permissions: Dict[str, bool]
    admin_username: str = Field(..., alias="adminUsername")
    
    class Config:
        allow_population_by_field_name = True