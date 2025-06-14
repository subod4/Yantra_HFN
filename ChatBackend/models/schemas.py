from pydantic import BaseModel
from typing import Optional, List

class DocumentUploadResponse(BaseModel):
    success: bool
    filename: str
    message: str

class ChatRequest(BaseModel):
    question: str

class ChatResponse(BaseModel):
    answer: str

class SessionInfo(BaseModel):
    session_id: str
    messages: List[str]

class UserInput(BaseModel):
    name: str
    email: str
    phone: str
    appointment_date: str

