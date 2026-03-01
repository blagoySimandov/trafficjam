FROM python:3.11-slim

WORKDIR /app

COPY trafficjam-be/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY trafficjam-be/ .

EXPOSE 8001

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]
