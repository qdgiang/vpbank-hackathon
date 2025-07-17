import logging
from typing import Dict, List, Any

logger = logging.getLogger(__name__)

_chat_history: List[Dict[str, Any]] = []

def load_chat_history() -> List[Dict[str, Any]]:
    return _chat_history

def save_to_chat_history(user_prompt: str, ai_answer: str, used_tools: List[Dict[str, Any]]):
    _chat_history.append({"user_prompt": user_prompt, "ai_answer": ai_answer, "used_tools": used_tools})
    logger.info(f"Saved chat history. Cache size: {len(_chat_history)} entries.")

def format_prompt_with_history(chat_history: List[Dict[str, Any]], new_prompt: str) -> str:
    if not chat_history:
        return new_prompt

    recent_history = chat_history[-4:]
    
    formatted_history = "\n".join([
        f"User: {entry['user_prompt']}\nAI: {entry['ai_answer']}\nUsed tools: {entry['used_tools']}"
        for entry in recent_history
    ])

    return (
        f"Please continue the conversation based on the chat history below. "
        f"The user's latest query is at the end.\n\n"
        f"--- Chat History ---\n"
        f"{formatted_history}\n"
        f"--- End of History ---\n\n"
        f"New User Query: {new_prompt}"
    )