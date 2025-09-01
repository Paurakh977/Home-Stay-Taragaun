from mcp.server.fastmcp import FastMCP
from .tools import create_officer, list_officers, update_officer_status, delete_officer, update_officer_permissions
from .models import CreateOfficerData, Officer
from typing import Dict, Any

mcp = FastMCP(name="Admin_Officer_manager_server", stateless_http=True)


@mcp.tool(name="create_officer")
async def create_officer_tool(
    officer_data: CreateOfficerData,
    admin_username: str,
    auth_token: str,
) -> Officer:
    """
    Creates a new officer under the specified admin.

    Args:
        officer_data: The data for the new officer.
        admin_username: The username of the admin under whom the officer is being created.
        auth_token: The authentication token for the admin (will be sent as cookie).

    Returns:
        The created officer.
    """
    return await create_officer(officer_data, admin_username, auth_token)

@mcp.tool(name="list_officers")
async def list_officers_tool(
    admin_username: str,
    auth_token: str,
) -> list[Officer]:
    """
    Lists all officers for a given admin.

    Args:
        admin_username: The username of the admin.
        auth_token: The authentication token for the admin.

    Returns:
        A list of officers.
    """
    return await list_officers(admin_username, auth_token)

@mcp.tool(name="update_officer_status")
async def update_officer_status_tool(
    officer_id: str,
    is_active: bool,
    admin_username: str,
    auth_token: str,
) -> Dict[str, Any]:
    """
    Updates the status of an officer.

    Args:
        officer_id: The ID of the officer to update.
        is_active: The new status of the officer.
        admin_username: The username of the admin.
        auth_token: The authentication token for the admin.

    Returns:
        A confirmation message.
    """
    return await update_officer_status(officer_id, is_active, admin_username, auth_token)

@mcp.tool(name="delete_officer")
async def delete_officer_tool(
    
    officer_id: str,
    admin_username: str,
    auth_token: str,
) -> Dict[str, Any]:
    """
    Deletes an officer.

    Args:
        officer_id: The ID of the officer to delete.
        admin_username: The username of the admin.
        auth_token: The authentication token for the admin.

    Returns:
        A confirmation message.
    """
    return await delete_officer(officer_id, admin_username, auth_token)

@mcp.tool(name="update_officer_permissions")
async def update_officer_permissions_tool(
    officer_id: str,
    permissions: Dict[str, bool],
    admin_username: str,
    auth_token: str,
) -> Officer:
    """
    Updates permissions for an EXISTING officer (does NOT create new officer).
    Use this when you want to add/remove specific permissions.
   
    Args:
        officer_id: The ID of the officer to update.
        permissions: Dictionary of permissions to update (e.g., {"homestayApproval": True, "documentUpload": False}).
        admin_username: The username of the admin updating the permissions.
        auth_token: The authentication token for the admin (will be sent as cookie).

    Returns:
        The updated officer object.
    """
    return await update_officer_permissions(officer_id, permissions, admin_username, auth_token)