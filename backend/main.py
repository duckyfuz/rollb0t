# main.py
from fastapi import FastAPI

# Create a FastAPI "instance"
app = FastAPI()

# Define a path operation decorator and function
@app.get("/")
def read_root():
    return {"Hello": "World"}

