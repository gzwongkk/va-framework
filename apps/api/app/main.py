from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title='va-framework API',
    version='2.0.0',
    description='Baseline API shell for the React-native visual analytics framework.',
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=['http://localhost:3000', 'http://127.0.0.1:3000'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)


@app.get('/api/health')
def get_health() -> dict[str, str]:
    return {
        'status': 'ok',
        'version': '2.0.0',
        'stage': 'baseline',
    }
