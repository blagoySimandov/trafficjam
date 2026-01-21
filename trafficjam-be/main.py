from fastapi import FastAPI

app = FastAPI()


@app.get("/")
def root():
    return {"message": "Hello World! This is the main page."}


@app.get("/health")
def health():
    return {"status": "ok"}


if __name__ == "__main__":
    """This lets you run the file directly with python main.py
        instead of using the uvicorn command"""
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
