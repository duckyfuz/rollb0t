from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
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

# Configure CORS to allow all origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

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
                    "request": None,
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


@app.get("/users/{username}", response_model=UserResponse)
async def get_user(username: str):
    """Get a user by their username."""
    try:
        response = (
            supabase.table("users").select("*").eq("username", username).execute()
        )

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
                    "request": status.request,
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
        if status.request is not None:
            update_data["request"] = status.request
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


@app.post("/user/{username}/status", response_model=StatusResponse, status_code=201)
async def create_user_status_by_username(username: str, status: StatusUpdate):
    """Create a new status entry for a user identified by username."""
    try:
        # 1. Look up the user by username
        user_response = (
            supabase.table("users").select("id").eq("username", username).execute()
        )

        if not user_response.data:
            raise HTTPException(status_code=404, detail="User not found")

        user_uuid = user_response.data[0]["id"]

        # 2. Create the status entry
        status_data = {
            "user_uuid": user_uuid,
            "is_enabled": status.is_enabled if status.is_enabled is not None else False,
            "theme": status.theme,
            "request": status.request,
            "image_url": status.image_url,
            "sound_url": status.sound_url,
        }

        response = supabase.table("status").insert(status_data).execute()

        if not response.data:
            raise HTTPException(status_code=500, detail="Failed to create status")

        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@app.put("/user/{username}/status", response_model=StatusResponse)
async def update_user_status_by_username(username: str, status: StatusUpdate):
    """Update the status entry for a user identified by username."""
    try:
        # 1. Look up the user by username
        user_response = (
            supabase.table("users").select("id").eq("username", username).execute()
        )

        if not user_response.data:
            raise HTTPException(status_code=404, detail="User not found")

        user_uuid = user_response.data[0]["id"]

        # 2. Build update dict with only provided fields
        update_data = {}
        if status.is_enabled is not None:
            update_data["is_enabled"] = status.is_enabled
        if status.theme is not None:
            update_data["theme"] = status.theme
        if status.request is not None:
            update_data["request"] = status.request
        if status.image_url is not None:
            update_data["image_url"] = status.image_url
        if status.sound_url is not None:
            update_data["sound_url"] = status.sound_url

        if not update_data:
            raise HTTPException(status_code=400, detail="No fields to update")

        # 3. Update the status entry for this user
        response = (
            supabase.table("status")
            .update(update_data)
            .eq("user_uuid", user_uuid)
            .execute()
        )

        if not response.data:
            raise HTTPException(
                status_code=404, detail="Status not found for this user"
            )

        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@app.post("/users/{username}/transform", response_model=TextTransformResponse)
async def transform_text(username: str, request: TextTransformRequest):
    """Transform text based on user's request and theme intensity."""
    try:
        # 1. Fetch the user by username
        user_response = (
            supabase.table("users").select("id").eq("username", username).execute()
        )

        if not user_response.data:
            raise HTTPException(status_code=404, detail="User not found")

        user_uuid = user_response.data[0]["id"]

        # 2. Fetch the user's status (request and theme)
        status_response = (
            supabase.table("status").select("*").eq("user_uuid", user_uuid).execute()
        )

        if not status_response.data:
            raise HTTPException(
                status_code=404, detail="Status not found for this user"
            )

        status = status_response.data[0]
        user_request = status.get("request")
        theme = status.get("theme")

        # 3. If no request is set, return the original text
        if not user_request:
            return TextTransformResponse(
                original_text=request.text,
                transformed_text=request.text,
                theme=theme,
                request=None,
            )

        # 4. Map theme to transformation intensity
        intensity_map = {
            "transform_01": {
                "level": "subtle",
                "description": "Make minimal, barely noticeable changes that maintain the original tone and structure.",
                "temperature": 0.5,
            },
            "transform_02": {
                "level": "moderate",
                "description": "Make noticeable but natural changes that clearly incorporate the theme while keeping readability.",
                "temperature": 0.7,
            },
            "transform_03": {
                "level": "intense",
                "description": "Make dramatic, obvious changes that heavily emphasize the theme throughout the text.",
                "temperature": 0.9,
            },
        }

        # Get intensity settings, default to moderate if theme is not recognized
        intensity = intensity_map.get(
            theme,
            {
                "level": "moderate",
                "description": "Make noticeable but natural changes.",
                "temperature": 0.7,
            },
        )

        # 5. Use ChatGPT to transform the text based on the request and intensity
        system_prompt = (
            f"You are a text transformation assistant. Your job is to rewrite text "
            f"based on the user's specific request with a {intensity['level']} intensity level. "
            f"{intensity['description']} "
            f"The transformed text should maintain readability and coherence."
        )

        user_prompt = f"""Transform the following text according to this request: "{user_request}"

Original text: {request.text}

Provide ONLY the transformed text, without any explanations or additional commentary."""

        completion = openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=intensity["temperature"],
            max_tokens=500,
        )

        transformed_text = completion.choices[0].message.content.strip()

        return TextTransformResponse(
            original_text=request.text,
            transformed_text=transformed_text,
            theme=theme,
            request=user_request,
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error transforming text: {str(e)}"
        )
