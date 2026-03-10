import asyncio
import logging
from contextlib import asynccontextmanager

import nats as nats_lib
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from config import get_settings
from db import engine
from services.status_monitor import monitor_all_statuses
from api.scenarios import router as scenarios_router
from api.runs import router as runs_router

logging.basicConfig(level=logging.INFO)


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    app.state.nc = await nats_lib.connect(settings.nats_url)
    app.state.js = app.state.nc.jetstream()
    app.state.status_worker = asyncio.create_task(monitor_all_statuses(app.state.js))
    yield
    app.state.status_worker.cancel()
    await app.state.nc.drain()
    await engine.dispose()


app = FastAPI(lifespan=lifespan)
app.include_router(scenarios_router)
app.include_router(runs_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Encoding"],
)


@app.middleware("http")
async def decompress_gzip_request(request: Request, call_next):
    if request.headers.get("content-encoding") == "gzip":
        import gzip
        body = await request.body()
        request._body = gzip.decompress(body)
    return await call_next(request)


@app.get("/")
def root():
    return {"message": "Hello World! This is the main page."}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
