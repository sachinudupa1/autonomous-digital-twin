from fastapi import APIRouter

router = APIRouter(tags=['System'])


@router.get('/')
def root():
    return {'message': 'Packaging Scheduling Backend is running'}


@router.get('/healthz')
def health_check():
    return {'status': 'healthy', 'service': 'packaging-backend'}