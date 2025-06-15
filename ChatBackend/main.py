# main.py - Gemini Optimized Version
from fastapi import FastAPI, UploadFile, File, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from agents.chatbot_agent import GeminiSessionManager
from pydantic import BaseModel
from typing import Optional
import os
from config.settings import DEBUG, UPLOAD_FOLDER, ALLOWED_EXTENSIONS, GOOGLE_API_KEY, PHYSIOTHERAPY_PROMPT, BICEP_CURL_PROMPT

# Validate Google API key at startup
if not GOOGLE_API_KEY:
    raise ValueError("GOOGLE_API_KEY not found in environment variables")

app = FastAPI(
    title="Physiotherapy Assistant API - Gemini Powered", 
    version="2.0.0",
    description="AI-powered physiotherapy assistant using Google Gemini"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure this properly for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Gemini session manager
session_manager = GeminiSessionManager()

# Pydantic models for request/response
class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    response: str
    session_id: str

class SessionResponse(BaseModel):
    session_id: str
    message: str = "Session created successfully"

class UploadResponse(BaseModel):
    filename: str
    message: str
    session_id: str
    document_chunks: int = 0

class SessionInfo(BaseModel):
    session_id: str
    exists: bool
    document_uploaded: bool
    processed: bool
    ready_for_chat: bool
    document_chunks: int
    document_summary: Optional[str] = None

@app.get("/")
async def root():
    return {
        "message": "Physiotherapy Assistant API - Gemini Powered", 
        "version": "2.0.0",
        "status": "running"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "gemini_configured": bool(GOOGLE_API_KEY),
        "upload_folder": UPLOAD_FOLDER
    }

@app.post("/api/sessions", response_model=SessionResponse)
async def create_session():
    """Create a new chat session"""
    try:
        session_id = session_manager.create_session()
        return SessionResponse(session_id=session_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating session: {str(e)}")

@app.post("/api/sessions/{session_id}/upload", response_model=UploadResponse)
async def upload_document(session_id: str, file: UploadFile = File(...)):
    """Upload a PDF document for a specific session"""
    
    # Validate file type
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")
    
    # Additional file validation
    file_extension = file.filename.split('.')[-1].lower()
    if file_extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400, 
            detail=f"File type not allowed. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    try:
        # Read file content
        file_content = await file.read()
        
        # Check file size (limit to 15MB for better processing)
        if len(file_content) > 15 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File too large. Maximum size is 15MB")
        
        # Upload and process document
        agent = session_manager.upload_document(session_id, file_content, file.filename)
        
        return UploadResponse(
            filename=file.filename,
            message="Document uploaded and processed successfully with Gemini",
            session_id=session_id,
            document_chunks=len(agent.document_chunks)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error uploading document: {str(e)}")

@app.post("/api/sessions/{session_id}/chat", response_model=ChatResponse)
async def chat(session_id: str, request: ChatRequest):
    """Chat with the Gemini-powered assistant using the uploaded document"""
    
    try:
        # Get agent for session
        agent = session_manager.get_agent(session_id)
        
        if agent is None:
            raise HTTPException(
                status_code=404, 
                detail="Session not found or no document uploaded for this session"
            )
        
        # Get answer from Gemini
        answer = agent.get_answer(request.message)
        
        return ChatResponse(response=answer, session_id=session_id)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing chat: {str(e)}")

@app.get("/api/sessions/{session_id}/status", response_model=SessionInfo)
async def get_session_status(session_id: str):
    """Get detailed session status including document info"""
    
    try:
        info = session_manager.get_session_info(session_id)
        return SessionInfo(**info)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error checking session status: {str(e)}")

@app.get("/api/sessions/{session_id}/summary")
async def get_document_summary(session_id: str):
    """Get a summary of the uploaded document"""
    
    try:
        agent = session_manager.get_agent(session_id)
        
        if agent is None:
            raise HTTPException(
                status_code=404, 
                detail="Session not found or no document uploaded"
            )
        
        summary = agent.get_document_summary()
        
        return {
            "session_id": session_id,
            "summary": summary,
            "document_chunks": len(agent.document_chunks)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting document summary: {str(e)}")

@app.delete("/api/sessions/{session_id}")
async def delete_session(session_id: str):
    """Delete a session and all its data"""
    
    try:
        import shutil
        
        session_dir = f"backend/sessions/{session_id}"
        
        if os.path.exists(session_dir):
            shutil.rmtree(session_dir)
        
        # Remove from memory
        if session_id in session_manager.sessions:
            del session_manager.sessions[session_id]
        
        return {"message": f"Session {session_id} deleted successfully"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting session: {str(e)}")

@app.get("/api/sessions")
async def list_sessions():
    """List all active sessions"""
    
    try:
        sessions_dir = "backend/sessions"
        if not os.path.exists(sessions_dir):
            return {"sessions": []}
        
        sessions = []
        for session_id in os.listdir(sessions_dir):
            session_path = os.path.join(sessions_dir, session_id)
            if os.path.isdir(session_path):
                info = session_manager.get_session_info(session_id)
                sessions.append(info)
        
        return {"sessions": sessions}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error listing sessions: {str(e)}")

@app.post("/api/sessions/{session_id}/chat")
async def chat_with_bot(session_id: str, request: Request):
    data = await request.json()
    message = data.get("message")
    is_bicep_page = data.get("isBicepPage", False)  # Frontend should send this flag

    # Choose prompt
    if is_bicep_page:
        prompt = BICEP_CURL_PROMPT
    else:
        prompt = PHYSIOTHERAPY_PROMPT

    # ...call your LLM/chatbot with the selected prompt and message...
    # response = call_llm(prompt, message)
    # return {"response": response}

    return {"response": f"Prompt used: {prompt}\nUser message: {message}"}

if __name__ == "__main__":
    import uvicorn
    
    # Create necessary directories
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    os.makedirs("backend/sessions", exist_ok=True)
    
    print("🚀 Starting Physiotherapy Assistant API with Gemini")
    print(f"📁 Upload folder: {UPLOAD_FOLDER}")
    print(f"🔑 Google API configured: {'✅' if GOOGLE_API_KEY else '❌'}")
    
    uvicorn.run(
        app, 
        host="0.0.0.0", 
        port=8000, 
        debug=DEBUG,
        reload=DEBUG
    )