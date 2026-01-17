from fastapi import FastAPI, HTTPException
from typing import List
from models import UserCreate, UserResponse, StatusCreate, StatusUpdate, StatusResponse
from database import supabase


# Create a FastAPI "instance"
app = FastAPI()


# Define a path operation decorator and function
@app.get("/")
def read_root():
    return {"Hello": "World"}


@app.post("/users", response_model=UserResponse, status_code=201)
async def create_user(user: UserCreate):
    """Create a new user in the database."""
    try:
        # Create the user
        response = (
            supabase.table("users")
            .insert({"username": user.username, "is_admin": user.is_admin})
            .execute()
        )

        if not response.data:
            raise HTTPException(status_code=500, detail="Failed to create user")

        user_data = response.data[0]
        user_uuid = user_data["id"]

        # Create a default status entry for the new user
        status_response = (
            supabase.table("status")
            .insert(
                {
                    "user_uuid": user_uuid,
                    "is_enabled": False,
                    "theme": None,
                }
            )
            .execute()
        )

        if not status_response.data:
            # If status creation fails, we should ideally rollback the user creation
            # For now, we'll just log the error but still return the user
            # In a production system, you'd want proper transaction handling
            raise HTTPException(
                status_code=500, detail="User created but failed to create status entry"
            )

        return user_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@app.get("/users/{user_id}", response_model=UserResponse)
async def get_user(user_id: str):
    """Get a user by their UUID."""
    try:
        response = supabase.table("users").select("*").eq("id", user_id).execute()

        if not response.data:
            raise HTTPException(status_code=404, detail="User not found")

        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@app.get("/users", response_model=List[UserResponse])
async def list_users():
    """List all users in the database."""
    try:
        response = supabase.table("users").select("*").execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


# Status endpoints
@app.post("/status", response_model=StatusResponse, status_code=201)
async def create_status(status: StatusCreate):
    """Create a new status entry in the database."""
    try:
        # Verify user exists
        user_response = (
            supabase.table("users").select("id").eq("id", status.user_uuid).execute()
        )
        if not user_response.data:
            raise HTTPException(status_code=404, detail="User not found")

        # Insert status into Supabase
        response = (
            supabase.table("status")
            .insert(
                {
                    "user_uuid": status.user_uuid,
                    "is_enabled": status.is_enabled,
                    "theme": status.theme,
                }
            )
            .execute()
        )

        if not response.data:
            raise HTTPException(status_code=500, detail="Failed to create status")

        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@app.get("/status/{status_id}", response_model=StatusResponse)
async def get_status(status_id: int):
    """Get a status entry by its ID."""
    try:
        response = supabase.table("status").select("*").eq("id", status_id).execute()

        if not response.data:
            raise HTTPException(status_code=404, detail="Status not found")

        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@app.put("/status/{status_id}", response_model=StatusResponse)
async def update_status(status_id: int, status: StatusUpdate):
    """Update a status entry."""
    try:
        # Build update dict with only provided fields
        update_data = {}
        if status.is_enabled is not None:
            update_data["is_enabled"] = status.is_enabled
        if status.theme is not None:
            update_data["theme"] = status.theme

        if not update_data:
            raise HTTPException(status_code=400, detail="No fields to update")

        # Update status in Supabase
        response = (
            supabase.table("status").update(update_data).eq("id", status_id).execute()
        )

        if not response.data:
            raise HTTPException(status_code=404, detail="Status not found")

        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@app.get("/users/{user_identifier}/status", response_model=List[StatusResponse])
async def list_user_status(user_identifier: str):
    """List all status entries for a specific user (by UUID or username)."""
    try:
        # First, try to find the user by UUID
        user_response = (
            supabase.table("users").select("id").eq("id", user_identifier).execute()
        )

        # If not found by UUID, try to find by username
        if not user_response.data:
            user_response = (
                supabase.table("users")
                .select("id")
                .eq("username", user_identifier)
                .execute()
            )

        # If still not found, raise 404
        if not user_response.data:
            raise HTTPException(status_code=404, detail="User not found")

        user_uuid = user_response.data[0]["id"]

        # Get all status entries for this user
        response = (
            supabase.table("status").select("*").eq("user_uuid", user_uuid).execute()
        )
        return response.data
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
