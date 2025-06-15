# Configuration settings for the Physiotherapy Assistant application

import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# API keys and configuration
GOOGLE_API_KEY = "AIzaSyDyxPL6-cgjjMvKecy4LPCudpfsVbMhxOk"
GOOGLE_CREDENTIALS_BASE64 = os.getenv("GOOGLE_CREDENTIALS_BASE64")
GOOGLE_SHEET_NAME = os.getenv("GOOGLE_SHEET_NAME")

# Email configuration
SMTP_SERVER = os.getenv("SMTP_SERVER")
SMTP_PORT = os.getenv("SMTP_PORT")
SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")

# Application settings
UPLOAD_FOLDER = os.getenv("UPLOAD_FOLDER", "uploads")
ALLOWED_EXTENSIONS = {'pdf', 'docx', 'txt'}

# Other settings
DEBUG = os.getenv("DEBUG", "False") == "True"

PHYSIOTHERAPY_PROMPT = (
    "You are an expert physiotherapist. Answer the following question based on the provided context from a physiotherapy document.\n\n"
    "CONTEXT FROM PHYSIOTHERAPY DOCUMENT:\n"
    "{context}\n\n"
    "QUESTION: {query}\n"
    "If the context does not contain enough information, say so and provide general physiotherapy advice."
    "make answer as short as possible, but still informative."
    "use natural text formatting, with out markdown."
)

BICEP_CURL_PROMPT = (
    "You are an expert physiotherapist. Answer the following question specifically about the bicep curl exercise, based on the provided context from a physiotherapy document.\n\n"
    "CONTEXT FROM PHYSIOTHERAPY DOCUMENT:\n"
    "{context}\n\n"
    "QUESTION: {query}\n"
    "If the context does not contain enough information, say so and provide general advice about bicep curls."
    "make answer as short as possible, but still informative."
    "use natural text formatting, with out markdown."
)