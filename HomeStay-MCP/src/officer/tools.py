import httpx,os
from mcp.server.fastmcp import FastMCP
from .models import CreateOfficerData, Officer
from typing import Dict, Any
from pathlib import Path
from dotenv import load_dotenv

env_path = Path(__file__).resolve().parent.parent.parent / ".env"
load_dotenv(dotenv_path=env_path) 
API_BASE_URL =  os.getenv("NEXT_API_BASE") 

async def create_officer(
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
    try:
        async with httpx.AsyncClient() as client:
            payload = officer_data.dict(by_alias=True)
            payload["adminUsername"] = admin_username
            
            # Send auth token as cookie, not Bearer header
            cookies = {"auth_token": auth_token}
            
            response = await client.post(
                f"{API_BASE_URL}/api/admin/officer/create",
                json=payload,
                cookies=cookies,
                timeout=30.0
            )
            
            if response.status_code != 200:
                error_detail = response.text
                try:
                    error_json = response.json()
                    error_detail = error_json.get('message', error_detail)
                except:
                    pass
                raise Exception(f"Failed to create officer: {error_detail}")
            
            result = response.json()
            if not result.get('success'):
                raise Exception(f"API returned error: {result.get('message', 'Unknown error')}")
            
            return Officer(**result["officer"])
    except httpx.RequestError as e:
        raise Exception(f"Network error while creating officer: {str(e)}")
    except Exception as e:
        raise Exception(f"Error creating officer: {str(e)}")

async def list_officers(
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
    try:
        async with httpx.AsyncClient() as client:
            cookies = {"auth_token": auth_token}
            
            response = await client.get(
                f"{API_BASE_URL}/api/admin/officer/list?adminUsername={admin_username}",
                cookies=cookies,
                timeout=30.0
            )
            
            if response.status_code != 200:
                error_detail = response.text
                try:
                    error_json = response.json()
                    error_detail = error_json.get('message', error_detail)
                except:
                    pass
                raise Exception(f"Failed to list officers: {error_detail}")
            
            print(response.text)  # Debugging line to see the response
            result = response.json()
            if not result.get('success'):
                raise Exception(f"API returned error: {result.get('message', 'Unknown error')}")
            
            return [Officer(**officer) for officer in result["officers"]]
    except httpx.RequestError as e:
        raise Exception(f"Network error while listing officers: {str(e)}")
    except Exception as e:
        raise Exception(f"Error listing officers: {str(e)}")

async def update_officer_status(
    officer_id: str,
    is_active: bool,
    admin_username: str,
    auth_token: str,
) -> Dict[str, Any]:
    """
    Updates the status of an officer.
    ie: updating whether the officer is active or not.
    
    Args:
        officer_id: The ID of the officer to update.
        is_active: The new status of the officer.
        admin_username: The username of the admin.
        auth_token: The authentication token for the admin.

    Returns:
        A confirmation message.
    """
    try:
        async with httpx.AsyncClient() as client:
            cookies = {"auth_token": auth_token}
            
            response = await client.post(
                f"{API_BASE_URL}/api/admin/officer/update-status",
                json={
                    "officerId": officer_id,
                    "isActive": is_active,
                    "adminUsername": admin_username,
                },
                cookies=cookies,
                timeout=30.0
            )
            
            if response.status_code != 200:
                error_detail = response.text
                try:
                    error_json = response.json()
                    error_detail = error_json.get('message', error_detail)
                except:
                    pass
                raise Exception(f"Failed to update officer status: {error_detail}")
            
            result = response.json()
            if not result.get('success'):
                raise Exception(f"API returned error: {result.get('message', 'Unknown error')}")
            
            return result
    except httpx.RequestError as e:
        raise Exception(f"Network error while updating officer status: {str(e)}")
    except Exception as e:
        raise Exception(f"Error updating officer status: {str(e)}")

async def delete_officer(
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
    try:
        async with httpx.AsyncClient() as client:
            cookies = {"auth_token": auth_token}
            
            response = await client.post(
                f"{API_BASE_URL}/api/admin/officer/delete",
                json={"officerId": officer_id, "adminUsername": admin_username},
                cookies=cookies,
                timeout=30.0
            )
            
            if response.status_code != 200:
                error_detail = response.text
                try:
                    error_json = response.json()
                    error_detail = error_json.get('message', error_detail)
                except:
                    pass
                raise Exception(f"Failed to delete officer: {error_detail}")
            
            result = response.json()
            if not result.get('success'):
                raise Exception(f"API returned error: {result.get('message', 'Unknown error')}")
            
            return result
    except httpx.RequestError as e:
        raise Exception(f"Network error while deleting officer: {str(e)}")
    except Exception as e:
        raise Exception(f"Error deleting officer: {str(e)}")

async def update_officer_permissions(
    officer_id: str,
    permissions: Dict[str, bool],
    admin_username: str,
    auth_token: str,
) -> Officer:
    """
    Updates an officer's permissions.

    Args:
        officer_id: The ID of the officer to update.
        permissions: Dictionary of permissions to update (e.g., {"homestayApproval": True, "documentUpload": False}).
        admin_username: The username of the admin updating the permissions.
        auth_token: The authentication token for the admin (will be sent as cookie).

    Returns:
        The updated officer object.
    """
    try:
        async with httpx.AsyncClient() as client:
            payload = {
                "officerId": officer_id,
                "permissions": permissions,
                "adminUsername": admin_username
            }
            
            # Send auth token as cookie
            cookies = {"auth_token": auth_token}
            
            response = await client.put(
                f"{API_BASE_URL}/api/admin/officer/update-permissions",
                json=payload,
                cookies=cookies,
                timeout=30.0
            )
            
            if response.status_code != 200:
                error_detail = response.text
                try:
                    error_json = response.json()
                    error_detail = error_json.get('message', error_detail)
                except:
                    pass
                raise Exception(f"Failed to update officer permissions: {error_detail}")
            
            result = response.json()
            if not result.get('success'):
                raise Exception(f"API returned error: {result.get('message', 'Unknown error')}")
            
            return Officer(**result["officer"])
    except httpx.RequestError as e:
        raise Exception(f"Network error while updating officer permissions: {str(e)}")
    except Exception as e:
        raise Exception(f"Error updating officer permissions: {str(e)}")