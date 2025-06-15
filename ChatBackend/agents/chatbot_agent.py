# agents/gemini_chatbot_agent.py
from langchain_community.vectorstores import FAISS
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from fastapi import HTTPException
import google.generativeai as genai
import os
import uuid
from typing import Dict, Optional, List
from config.settings import GOOGLE_API_KEY, PHYSIOTHERAPY_PROMPT, BICEP_CURL_PROMPT

class GeminiChatbotAgent:
    def __init__(self, session_id: str, pdf_path: str):
        self.session_id = session_id
        self.pdf_path = pdf_path
        self.vector_store = None
        self.document_chunks = []
        
        # Configure Google AI
        if not GOOGLE_API_KEY:
            raise HTTPException(status_code=500, detail="Google API key not configured")
        
        genai.configure(api_key=GOOGLE_API_KEY)
        
        # Use Google Gemini embeddings - optimized for latest version
        try:
            self.embeddings = GoogleGenerativeAIEmbeddings(
                model="models/embedding-001",
                google_api_key=GOOGLE_API_KEY,
                task_type="retrieval_document"  # Optimized for document retrieval
            )
        except Exception as e:
            # Fallback for older versions
            self.embeddings = GoogleGenerativeAIEmbeddings(
                model="models/embedding-001",
                google_api_key=GOOGLE_API_KEY
            )
        
        # Initialize Gemini model
        self.model = genai.GenerativeModel(
            "gemini-2.0-flash",
            generation_config=genai.GenerationConfig(
                temperature=0.7,
                top_p=0.8,
                top_k=40,
                max_output_tokens=2048,
            )
        )
        
    def load_document(self):
        """Load and process the PDF document with optimized chunking for Gemini"""
        if not os.path.exists(self.pdf_path):
            raise HTTPException(status_code=404, detail="PDF document not found.")
        
        try:
            # Load PDF
            loader = PyPDFLoader(self.pdf_path)
            documents = loader.load()
            
            # Optimize text splitting for Gemini's context window
            text_splitter = RecursiveCharacterTextSplitter(
                chunk_size=1500,  # Larger chunks work better with Gemini
                chunk_overlap=300,  # More overlap for better context
                separators=["\n\n", "\n", ". ", "! ", "? ", " ", ""]
            )
            
            # Split documents
            self.document_chunks = text_splitter.split_documents(documents)
            
            # Create vector store with Gemini embeddings
            self.vector_store = FAISS.from_documents(
                self.document_chunks, 
                self.embeddings
            )
            
            # Save vector store for persistence
            self._save_vector_store()
            
            print(f"✅ Processed {len(self.document_chunks)} document chunks")
            
        except Exception as e:
            print(f"❌ Error processing PDF: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Error processing PDF: {str(e)}")
    
    def _save_vector_store(self):
        """Save vector store to disk for persistence"""
        vector_store_path = f"backend/sessions/{self.session_id}/vector_store"
        os.makedirs(os.path.dirname(vector_store_path), exist_ok=True)
        
        if self.vector_store:
            try:
                self.vector_store.save_local(vector_store_path)
                print(f"✅ Vector store saved for session {self.session_id}")
            except Exception as e:
                print(f"❌ Error saving vector store: {str(e)}")
    
    def _load_vector_store(self):
        """Load vector store from disk"""
        vector_store_path = f"backend/sessions/{self.session_id}/vector_store"
        
        try:
            if os.path.exists(vector_store_path):
                self.vector_store = FAISS.load_local(
                    vector_store_path, 
                    self.embeddings,
                    allow_dangerous_deserialization=True  # Required for FAISS loading
                )
                print(f"✅ Vector store loaded for session {self.session_id}")
                return True
        except Exception as e:
            print(f"❌ Error loading vector store: {str(e)}")
        
        return False

    def get_answer(self, query: str, prompt_template: str = PHYSIOTHERAPY_PROMPT) -> str:
        """Get answer using Gemini with retrieved context"""
        # Try to load existing vector store first
        if self.vector_store is None:
            if not self._load_vector_store():
                raise HTTPException(
                    status_code=500, 
                    detail="Document not loaded. Please upload a PDF first."
                )
        
        try:
            # Search for relevant documents with higher k for better context
            docs = self.vector_store.similarity_search(query, k=5)
            
            # Create rich context from retrieved documents
            context_parts = []
            for i, doc in enumerate(docs, 1):
                context_parts.append(f"Section {i}:\n{doc.page_content}\n")
            context = "\n".join(context_par

            # Use the selected prompt template
            prompt = prompt_template.format(context=context, query=query)

            # Generate response using Gemini
            response = self.model.generate_content(prompt)
            
            if response.text:
                return response.text
            else:
                return "I apologize, but I couldn't generate a response. Please try rephrasing your question."
                
        except Exception as e:
            print(f"❌ Error generating response: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Error generating response: {str(e)}")

    def get_document_summary(self) -> str:
        """Get a summary of the uploaded document"""
        if not self.document_chunks:
            return "No document loaded"
        
        # Get a sample of content from the document
        sample_content = ""
        for chunk in self.document_chunks[:3]:  # First 3 chunks
            sample_content += chunk.page_content + "\n\n"
        
        prompt = f"""Provide a brief summary of this physiotherapy document based on the following content:

{sample_content}

Summary:"""
        
        try:
            response = self.model.generate_content(prompt)
            return response.text if response.text else "Unable to generate summary"
        except Exception as e:
            return f"Error generating summary: {str(e)}"


class GeminiSessionManager:
    """Enhanced session manager for Gemini-optimized agents"""
    
    def __init__(self):
        self.sessions: Dict[str, GeminiChatbotAgent] = {}
        self.session_data_path = "backend/sessions"
        os.makedirs(self.session_data_path, exist_ok=True)
    
    def create_session(self) -> str:
        """Create a new session and return session ID"""
        session_id = str(uuid.uuid4())
        session_dir = os.path.join(self.session_data_path, session_id)
        os.makedirs(session_dir, exist_ok=True)
        
        print(f"✅ Created new session: {session_id}")
        return session_id
    
    def get_agent(self, session_id: str) -> Optional[GeminiChatbotAgent]:
        """Get or create Gemini chatbot agent for session"""
        if session_id not in self.sessions:
            # Check if session directory exists
            session_dir = os.path.join(self.session_data_path, session_id)
            if not os.path.exists(session_dir):
                return None
            
            # Check if PDF exists for this session
            pdf_path = os.path.join(session_dir, "document.pdf")
            if os.path.exists(pdf_path):
                self.sessions[session_id] = GeminiChatbotAgent(session_id, pdf_path)
        
        return self.sessions.get(session_id)
    
    def upload_document(self, session_id: str, file_content: bytes, filename: str) -> GeminiChatbotAgent:
        """Upload and process document for a session"""
        session_dir = os.path.join(self.session_data_path, session_id)
        
        if not os.path.exists(session_dir):
            raise HTTPException(status_code=404, detail="Session not found")
        
        # Save PDF file
        pdf_path = os.path.join(session_dir, "document.pdf")
        with open(pdf_path, "wb") as f:
            f.write(file_content)
        
        print(f"✅ Saved PDF for session {session_id}: {filename}")
        
        # Create and initialize agent
        agent = GeminiChatbotAgent(session_id, pdf_path)
        agent.load_document()
        
        # Store in memory
        self.sessions[session_id] = agent
        
        return agent
    
    def get_session_info(self, session_id: str) -> dict:
        """Get detailed session information"""
        agent = self.get_agent(session_id)
        session_dir = os.path.join(self.session_data_path, session_id)
        
        info = {
            "session_id": session_id,
            "exists": os.path.exists(session_dir),
            "document_uploaded": False,
            "processed": False,
            "ready_for_chat": False,
            "document_chunks": 0,
            "document_summary": None
        }
        
        pdf_path = os.path.join(session_dir, "document.pdf")
        if os.path.exists(pdf_path):
            info["document_uploaded"] = True
            
            if agent:
                info["ready_for_chat"] = True
                info["document_chunks"] = len(agent.document_chunks)
                
                vector_store_path = os.path.join(session_dir, "vector_store")
                info["processed"] = os.path.exists(vector_store_path)
                
                # Get document summary
                try:
                    info["document_summary"] = agent.get_document_summary()
                except:
                    info["document_summary"] = "Summary unavailable"
        
        return info