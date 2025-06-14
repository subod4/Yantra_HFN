import streamlit as st
import PyPDF2
from langchain.text_splitter import RecursiveCharacterTextSplitter
from config.settings import get_embeddings
from typing import Optional

class DocumentProcessor:
    def __init__(self):
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            length_function=len
        )

    def extract_text_from_pdf(self, pdf_file) -> str:
        """Extract text from PDF file"""
        try:
            pdf_reader = PyPDF2.PdfReader(pdf_file)
            text = ""
            for page in pdf_reader.pages:
                text += page.extract_text()
            return text
        except Exception as e:
            st.error(f"Error reading PDF: {str(e)}")
            return ""

    def process_physiotherapy_document(self, pdf_file) -> Optional[str]:
        """Process the physiotherapy PDF document for chatbot use"""
        text = self.extract_text_from_pdf(pdf_file)
        if text:
            # Here you can add any additional processing specific to physiotherapy
            return text
        return None