from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
from datetime import timedelta
from core.auth import create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES

router = APIRouter(prefix="/auth", tags=["auth"])

class LoginRequest(BaseModel):
    username: str # e.g., 'priya', 'arjun', 'ramesh'
    
class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: dict

# Pre-seeded users as per PRD
USERS = {
    "priya": {
        "sub": "user-1",
        "name": "Priya S.",
        "role": "REGULATORY_AFFAIRS",
        "org_id": "org-xypheria",
        "site_id": None,
        "trial_ids": ["trial-glucozen"]
    },
    "arjun": {
        "sub": "user-2",
        "name": "Arjun M.",
        "role": "DATA_MANAGER",
        "org_id": "org-xypheria",
        "site_id": None,
        "trial_ids": ["trial-glucozen"]
    },
    "ramesh": {
        "sub": "user-3",
        "name": "Dr. Ramesh K.",
        "role": "DOCTOR",
        "org_id": "org-xypheria",
        "site_id": "site-3",
        "trial_ids": ["trial-glucozen"]
    }
}

@router.post("/login", response_model=TokenResponse)
async def login(req: LoginRequest):
    user_id = req.username.lower()
    
    if user_id not in USERS:
        # Fallback to demo defaults or error out
        if user_id == "priya": user_id = "priya"
        else: raise HTTPException(status_code=401, detail="Invalid demo persona")
        
    user_data = USERS[user_id]
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data=user_data, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer", "user": user_data}
