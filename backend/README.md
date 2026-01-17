# Rollb0t Backend API

FastAPI backend for the Rollb0t Chrome extension, providing user management, status tracking, and AI-powered text transformation.

## 🚀 Quick Start

### Prerequisites

- Python 3.8+
- Supabase account with configured database
- OpenAI API key

### Installation

1. Install dependencies:

```bash
pip install -r requirements.txt
```

2. Configure environment variables in `.env.local`:

```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
OPENAI_API_KEY=your_openai_api_key
```

3. Run the server:

```bash
uvicorn main:app --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`

## 📋 API Routes

### Root

- **`GET /`** - Health check endpoint

### User Endpoints

#### `POST /users`

Create a new user (automatically creates default status entry)

**Request Body:**

```json
{
  "username": "string",
  "is_admin": false // optional, defaults to false
}
```

**Response:** `UserResponse`

---

#### `GET /users/{user_id}`

Get a user by UUID

**Response:** `UserResponse`

---

#### `GET /users`

List all users

**Response:** `List[UserResponse]`

---

#### `GET /users/{username}/status`

Get all status entries for a user by username

**Response:** `List[StatusResponse]`

---

#### `POST /users/{username}/transform`

Transform text based on user's theme using ChatGPT

**Request Body:**

```json
{
  "text": "string"
}
```

**Response:** `TextTransformResponse`

---

### Status Endpoints

#### `POST /status`

Create a new status entry

**Request Body:**

```json
{
  "user_uuid": "string",
  "is_enabled": false, // optional, defaults to false
  "theme": "string", // optional, defaults to null
  "image_url": "string", // optional, defaults to null
  "sound_url": "string" // optional, defaults to null
}
```

**Response:** `StatusResponse`

---

#### `GET /status/{status_id}`

Get a status entry by ID

**Response:** `StatusResponse`

---

#### `PUT /status/{status_id}`

Update a status entry (partial update)

**Request Body:**

```json
{
  "is_enabled": true, // optional
  "theme": "string", // optional
  "image_url": "string", // optional
  "sound_url": "string" // optional
}
```

**Response:** `StatusResponse`

---

## 📦 Response Schemas

### UserResponse

```json
{
  "id": "uuid-string",
  "created_at": "2026-01-17T12:00:00Z",
  "username": "string",
  "is_admin": false
}
```

### StatusResponse

```json
{
  "id": 123,
  "created_at": "2026-01-17T12:00:00Z",
  "user_uuid": "uuid-string",
  "is_enabled": true,
  "theme": "pirate",
  "image_url": "https://example.com/image.png",
  "sound_url": "https://example.com/sound.mp3"
}
```

### TextTransformResponse

```json
{
  "original_text": "Hello world",
  "transformed_text": "Ahoy, matey!",
  "theme": "pirate"
}
```

---

## 🗄️ Database Schema

### `users` table

- `id` (UUID, primary key)
- `created_at` (timestamp)
- `username` (string, unique)
- `is_admin` (boolean)

### `status` table

- `id` (integer, primary key)
- `created_at` (timestamp)
- `user_uuid` (UUID, foreign key to users.id)
- `is_enabled` (boolean)
- `theme` (string, nullable)
- `image_url` (string, nullable)
- `sound_url` (string, nullable)

---

## 🔑 Key Features

- **Automatic Status Creation**: Creating a user automatically creates a default status entry
- **Partial Updates**: All `PUT` endpoints support partial updates - only send fields you want to update
- **AI Text Transformation**: Uses OpenAI's GPT-4o-mini to transform text based on user themes
- **RESTful Design**: Clean, predictable URL structure following REST principles

---

## 🛠️ Tech Stack

- **FastAPI** - Modern, fast web framework
- **Supabase** - PostgreSQL database and authentication
- **OpenAI API** - AI-powered text transformation
- **Pydantic** - Data validation and serialization
- **Uvicorn** - ASGI server

---

## 📝 Example Usage

### Create a user and set their theme

```bash
# Create user
curl -X POST http://localhost:8000/users \
  -H "Content-Type: application/json" \
  -d '{"username": "johndoe"}'

# Update their status with a theme
curl -X PUT http://localhost:8000/status/1 \
  -H "Content-Type: application/json" \
  -d '{"theme": "pirate", "is_enabled": true}'

# Transform text
curl -X POST http://localhost:8000/users/johndoe/transform \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello, how are you?"}'
```

---

## 📄 License

MIT
