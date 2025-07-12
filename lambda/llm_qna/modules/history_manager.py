import logging
from typing import Dict, List, Any

logger = logging.getLogger(__name__)

_session_cache: Dict[str, List[Dict[str, Any]]] = {}

def load_chat_history(session_id: str) -> List[Dict[str, Any]]:
    return _session_cache.get(session_id, [])

def save_to_chat_history(session_id: str, user_prompt: str, ai_answer: str, used_tools: List[Dict[str, Any]]):
    if session_id not in _session_cache:
        _session_cache[session_id] = []
    _session_cache[session_id].append({"user_prompt": user_prompt, "ai_answer": ai_answer, "used_tools": used_tools})
    logger.info(f"Saved chat history for session '{session_id}'. Cache size: {len(_session_cache[session_id])} entries.")

def format_prompt_with_history(chat_history: List[Dict[str, Any]], new_prompt: str) -> str:
    if not chat_history:
        return new_prompt

    recent_history = chat_history[-6:]
    
    formatted_history = "\n".join([
        f"User: {entry['user_prompt']}\nAI: {entry['ai_answer']}"
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