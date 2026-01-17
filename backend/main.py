from fastapi import FastAPI, HTTPException
from typing import List
from models import (
    UserCreate,
    UserResponse,
    StatusCreate,
    StatusUpdate,
    StatusResponse,
    TextTransformRequest,
    TextTransformResponse,
)
from database import supabase
from config import settings
from openai import OpenAI


# Create a FastAPI "instance"
app = FastAPI()

# Initialize OpenAI client
openai_client = OpenAI(api_key=settings.OPENAI_API_KEY)


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
                    "image_url": None,
                    "sound_url": None,
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
                    "image_url": status.image_url,
                    "sound_url": status.sound_url,
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
        if status.image_url is not None:
            update_data["image_url"] = status.image_url
        if status.sound_url is not None:
            update_data["sound_url"] = status.sound_url

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


@app.post("/users/{username}/transform", response_model=TextTransformResponse)
async def transform_text(username: str, request: TextTransformRequest):
    """Transform text to match a user's theme using ChatGPT."""
    try:
        # 1. Fetch the user by username
        user_response = (
            supabase.table("users").select("id").eq("username", username).execute()
        )

        if not user_response.data:
            raise HTTPException(status_code=404, detail="User not found")

        user_uuid = user_response.data[0]["id"]

        # 2. Fetch the user's status (theme)
        status_response = (
            supabase.table("status").select("*").eq("user_uuid", user_uuid).execute()
        )

        if not status_response.data:
            raise HTTPException(
                status_code=404, detail="Status not found for this user"
            )

        status = status_response.data[0]
        theme = status.get("theme")

        # 3. If no theme is set, return the original text
        if not theme:
            return TextTransformResponse(
                original_text=request.text,
                transformed_text=request.text,
                theme=None,
            )

        # 4. Use ChatGPT to transform the text based on the theme
        system_prompt = (
            "You are a subtle text transformation assistant. Your job is to rewrite text "
            "to match a specific theme while keeping the changes as inconspicuous as possible. "
            "The transformed text should maintain the same meaning and structure, but incorporate "
            "the theme in a natural, subtle way. Do not make dramatic changes or add unnecessary content."
        )

        user_prompt = f"""Transform the following text to match the theme: "{theme}"

Original text: {request.text}

Provide ONLY the transformed text, without any explanations or additional commentary."""

        completion = openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.7,
            max_tokens=500,
        )

        transformed_text = completion.choices[0].message.content.strip()

        return TextTransformResponse(
            original_text=request.text,
            transformed_text=transformed_text,
            theme=theme,
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error transforming text: {str(e)}"
        )
