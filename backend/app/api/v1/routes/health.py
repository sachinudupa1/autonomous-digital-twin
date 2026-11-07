from fastapi import APIRouter

router = APIRouter(prefix='/health', tags=['Machine health'])

# Order endpoints are added in Phase 4.