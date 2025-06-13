from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
# from dotenv import load_dotenv
import os

# Load environment variables from .env file
# load_dotenv()

# Initialize Flask app
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# Configure Gemini API
gemini_api_key = 'AIzaSyCi77ZL-rSfa3SAHcd84A6EYM-0jpZnRBk'
if not gemini_api_key:
    raise ValueError("GEMINI_API_KEY environment variable is not set.")
genai.configure(api_key=gemini_api_key)

@app.route("/live-feedback", methods=["POST"])
def live_feedback():
    try:
        data = request.json
        prompt = (
            f"You are a physiotherapist observing a user doing bicep curls in real time.\n"
            f"Current rep: {data.get('rep')}\n"
            f"Current stage: {data.get('stage')}\n"
            f"Elbow angle: {data.get('elbowAngle')} degrees\n"
            f"Provide a brief, actionable, real-time tip or encouragement based on this data."
        )
        model = genai.GenerativeModel('gemini-2.0-flash')
        response = model.generate_content(prompt)
        feedback = response.text
        return jsonify({"feedback": feedback})
    except Exception as e:
        print("Error in live-feedback:", e)
        return jsonify({"feedback": "Error contacting Gemini API."}), 500

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5000, debug=True)