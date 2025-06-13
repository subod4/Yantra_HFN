from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
import os
from dotenv import load_dotenv


# Initialize Flask app
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})
load_dotenv()

# Configure Gemini API
gemini_api_key = os.getenv("gemini_api_key1")
if not gemini_api_key:
    raise ValueError("GEMINI_API_KEY environment variable is not set.")
genai.configure(api_key=gemini_api_key)

@app.route("/live-feedback", methods=["POST"])
def live_feedback():
    try:
        data = request.json
        rep_count = data.get('rep')
        stage = data.get('stage')
        landmarks = data.get('landmarks') # This will be the raw landmark data

        if not landmarks:
            return jsonify({"feedback": "No landmark data provided."}), 400

        # Constructing the prompt with raw landmark data
        # You'll need to decide which specific landmarks are most relevant
        # for the AI to provide feedback on bicep curls.
        # For a bicep curl, key landmarks would be wrist, elbow, and shoulder.
        # Let's assume right arm for now (indices 16, 14, 12 for wrist, elbow, shoulder)
        right_wrist = landmarks[16] if len(landmarks) > 16 else None
        right_elbow = landmarks[14] if len(landmarks) > 14 else None
        right_shoulder = landmarks[12] if len(landmarks) > 12 else None

        prompt = (
            f"You are a physiotherapist observing a user doing bicep curls in real time.\n"
            f"Current rep: {rep_count}\n"
            f"Current stage: {stage}\n"
        )
        if right_wrist and right_elbow and right_shoulder:
            prompt += (
                f"Right wrist position (x,y,z): ({right_wrist['x']:.2f}, {right_wrist['y']:.2f}, {right_wrist['z']:.2f})\n"
                f"Right elbow position (x,y,z): ({right_elbow['x']:.2f}, {right_elbow['y']:.2f}, {right_elbow['z']:.2f})\n"
                f"Right shoulder position (x,y,z): ({right_shoulder['x']:.2f}, {right_shoulder['y']:.2f}, {right_shoulder['z']:.2f})\n"
            )
        prompt += "Provide a brief, actionable, real-time tip or encouragement (max 100 characters)."
        
        model = genai.GenerativeModel('gemini-2.0-flash')
        response = model.generate_content(prompt)
        
        # Ensure the feedback is max 100 characters
        feedback = response.text
        if len(feedback) > 100:
            feedback = feedback[:97] + "..." # Truncate and add ellipsis

        return jsonify({"feedback": feedback})
    except Exception as e:
        print("Error in live-feedback:", e)
        return jsonify({"feedback": "Error contacting Gemini API."}), 500

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5000, debug=True)