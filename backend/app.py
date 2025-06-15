from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
from dotenv import load_dotenv
import os

# Load environment variables from .env file
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# Configure Gemini API
gemini_api_key = os.getenv("GEMINI_API_KEY")
if not gemini_api_key:
    raise ValueError("GEMINI_API_KEY environment variable is not set.")
genai.configure(api_key=gemini_api_key)

# List of full-body physiotherapy exercises and their descriptions (unchanged)
exercise_details = {
    'Push-ups': 'An exercise to strengthen the upper body, particularly the chest and triceps.',
    'Squats': 'A lower body exercise that targets the thighs, hips, and buttocks.',
    'Lunges': 'An exercise focusing on the legs, enhancing strength and balance.',
    'Plank': 'A core-strengthening exercise that also works the shoulders and back.',
    'Bridges': 'Targets the glutes and lower back while improving core stability.',
    'Clamshells': 'Strengthens the hip muscles and improves hip stability.',
    'Bird Dogs': 'Enhances balance and coordination while working on core stability.',
    'Dead Bugs': 'Strengthens the core while focusing on coordination between limbs.',
    'Shoulder Press': 'An exercise to build shoulder and upper arm strength.',
    'Bicep Curls': 'Strengthens the biceps and improves arm aesthetics.',
    'Tricep Dips': 'Targets the triceps, helping to tone and strengthen the arms.',
    'Calf Raises': 'Focuses on strengthening the calf muscles.',
    'Seated Row': 'Targets the back muscles, improving posture and strength.',
    'Wall Angels': 'Improves shoulder mobility and posture.',
    'Chest Stretch': 'A flexibility exercise for the chest and shoulders.',
    'Hamstring Stretch': 'Stretches the hamstring muscles to enhance flexibility.',
    'Quadriceps Stretch': 'Stretches the quadriceps for improved flexibility.',
    'Hip Flexor Stretch': 'Stretches the hip flexors to improve range of motion.',
    'Spinal Twist': 'Enhances spinal mobility and flexibility.',
    'Side Lunges': 'Strengthens the inner thighs and improves balance.',
    'Glute Bridges': 'Focuses on the glutes and lower back for better stability.',
    'Mountain Climbers': 'A full-body exercise that increases heart rate and builds endurance.',
    'Leg Raises': 'Strengthens the lower abdominal muscles.',
    'Standing Balance': 'Improves balance and stability through weight shifting.',
    'Side Plank': 'Strengthens the oblique muscles and stabilizes the core.',
    'Torso Rotation': 'Enhances core flexibility and stability.',
    'Wrist Flexor Stretch': 'Stretches the wrist and forearm muscles.',
    'Ankle Circles': 'Improves ankle mobility and flexibility.',
    'T-Pose Exercise': 'Strengthens the upper back and shoulders.',
    'Knee to Chest Stretch': 'Stretches the lower back and glutes.',
    'Pigeon Pose': 'A yoga pose that stretches the hips and glutes.'
}

# Validation lists (unchanged)
VALID_INJURY_TERMS = ["sprain", "strain", "pain", "stiffness", "injury", "tear", "dislocation", "arthritis", "sciatica", "tendinitis", "surgery", "replacement", "fracture", "bruise", "spasm", "inflammation", "bursitis", "tendonitis"]
VALID_BODY_PARTS = ["back", "neck", "shoulder", "elbow", "wrist", "hip", "knee", "ankle", "leg", "arm", "chest", "foot", "hand", "spine", "calf", "thigh", "groin"]

@app.route('/api/suggest-exercises', methods=['POST'])
def suggest_exercises():
    try:
        data = request.json
        # ... (validation for data exists) ...

        user_message = data.get('message', '')
        injury_type = data.get('injuryType', '').lower().strip()
        duration = data.get('duration', '')
        severity = data.get('severity', '')

        # ... (validation for injury and body part) ...
        full_description = f"{injury_type} {user_message}".lower()
        has_injury_term = any(term in full_description for term in VALID_INJURY_TERMS)
        has_body_part = any(part in full_description for part in VALID_BODY_PARTS)
        if not (has_injury_term and has_body_part):
            return jsonify({"error": "Please provide a more specific description including the type of injury (e.g., pain, sprain) and the affected body part (e.g., back, knee)."}), 400

        # --- START OF MODIFICATIONS ---

        # MODIFIED PROMPT: Ask for frequency and duration/reps in a specific format
        prompt = (
            f"A user is seeking physiotherapy advice. Their reported condition is: '{injury_type}'. "
            f"They have had it for: '{duration}'. The severity is: '{severity}'. "
            f"Additional details: '{user_message}'. "
            f"Based on this, recommend 2 to 4 suitable physiotherapy exercises from this list: {', '.join(exercise_details.keys())}. "
            "For each exercise, provide a description, a recommended frequency, and duration/reps. "
            "it must include frequency and duration/reps"
            "Format EACH exercise on a new line EXACTLY like this example. it must also give frequency and duration/reps in the format below: "
            "'Exercise Name: The description of the exercise. | Frequency: 3-4 times a week | Duration: 2 sets of 15 reps' "
            "Do not include any other text, explanations, or introductory sentences."
        )
        print("Generated prompt:", prompt)
        
        model = genai.GenerativeModel('gemini-1.5-flash-latest')
        response = model.generate_content(prompt)
        print("Gemini API response:", response.text)

        # MODIFIED PARSING LOGIC: Extract name, description, frequency, and duration
        recommended_exercises = []
        for line in response.text.splitlines():
            if ':' in line and '|' in line:
                try:
                    # Split the line into major parts by the pipe character
                    parts = line.split('|')
                    
                    # The first part contains the name and description
                    name_desc_part = parts[0]
                    name, _, description = name_desc_part.partition(':')

                    # The second part should be frequency
                    freq_part = parts[1]
                    _, _, frequency = freq_part.partition(':')

                    # The third part should be duration/reps
                    dur_part = parts[2]
                    _, _, duration_reps = dur_part.partition(':')

                    recommended_exercises.append({
                        "name": name.strip().strip("'\""),
                        "description": description.strip(),
                        "frequency": frequency.strip(),
                        "duration": duration_reps.strip()
                    })
                except (IndexError, ValueError) as e:
                    print(f"Could not parse line: {line}. Error: {e}")
                    # Optionally, you could try a simpler parse here as a fallback
                    continue
        
        # --- END OF MODIFICATIONS ---

        if not recommended_exercises:
            return jsonify({"error": "I was unable to determine suitable exercises. Please try rephrasing your condition or check if a medical professional's advice is more appropriate."}), 400

        return jsonify({"exercises": recommended_exercises})

    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({"error": "An unexpected error occurred on our server."}), 500

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=4000, debug=True)