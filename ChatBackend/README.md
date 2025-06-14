# Physiotherapy Assistant Backend

This project is a Physiotherapy Assistant chatbot application built using FastAPI. The chatbot is designed to provide answers based on a provided PDF document related to physiotherapy. Users can upload the PDF, and the chatbot will process it to answer questions in real-time.

## Project Structure

- **backend/**: Contains all backend-related files.
  - **main.py**: Entry point for the FastAPI application, defining API endpoints for chat sessions and document uploads.
  - **requirements.txt**: Lists the dependencies required for the backend application.
  - **agents/**: Contains the chatbot agent implementation.
    - **chatbot_agent.py**: Processes user queries and retrieves answers from the uploaded PDF.
  - **config/**: Holds configuration settings for the application.
    - **settings.py**: Contains API keys and environment-specific variables.
  - **models/**: Defines data models and schemas for request and response validation.
    - **schemas.py**: Contains the data models used in the API.
  - **tools/**: Contains functions related to user input and booking.
    - **booking.py**: Functions for booking appointments.
    - **user_input.py**: Handles user input validation and processing.
  - **utils/**: Contains utility functions for various tasks.
    - **document_processor.py**: Extracts text from the uploaded PDF document.
    - **emailer.py**: Sends confirmation emails to users.
    - **sheets.py**: Interacts with Google Sheets for data storage.
    - **validators.py**: Contains validation functions for user inputs.
  - **uploads/**: Directory for uploaded PDF documents.
    - **physiotherapy.pdf**: The PDF document used by the chatbot to provide answers.
  - **.env**: Holds environment variables for the application.
  - **.gitignore**: Specifies files and directories to be ignored by Git.
  - **README.md**: Documentation for the backend application.

## Setup Instructions

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/physiotherapy-assistant.git
   cd physiotherapy-assistant/backend
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Environment Setup**
   - Copy `.env.example` to `.env`
   - Fill in your API keys and configuration settings.

4. **Run the application**
   ```bash
   uvicorn main:app --reload
   ```

## Usage

- Users can upload a PDF document related to physiotherapy.
- The chatbot will process the document and allow users to ask questions based on its content.
- The application supports real-time chat through WebSocket connections.

## API Endpoints

- **POST /api/sessions**: Create a new chat session.
- **POST /api/sessions/{session_id}/upload**: Upload a PDF document for processing.
- **POST /api/sessions/{session_id}/chat**: Send a chat message and receive a response.
- **GET /api/sessions/{session_id}/messages**: Retrieve chat history for a session.

## License

This project is licensed under the MIT License. See the LICENSE file for details.