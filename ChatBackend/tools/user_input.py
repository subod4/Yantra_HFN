from pydantic import BaseModel, constr

class UserInput(BaseModel):
    question: constr(min_length=1, max_length=500)

def validate_user_input(user_input: str) -> UserInput:
    """Validate and process user input for questions."""
    return UserInput(question=user_input)