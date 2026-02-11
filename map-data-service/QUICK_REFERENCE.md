# Quick Command Reference

## Initial Setup (One Time)

```bash
# 1. Create service account and download key
gcloud iam service-accounts create trafficjam-dev --display-name="Traffic Jam Development"
gcloud iam service-accounts keys create ~/trafficjam-key.json \
  --iam-account=trafficjam-dev@YOUR_PROJECT_ID.iam.gserviceaccount.com
gsutil iam ch serviceAccount:trafficjam-dev@YOUR_PROJECT_ID.iam.gserviceaccount.com:roles/storage.objectViewer gs://YOUR_BUCKET_NAME

# 2. Navigate to backend
cd /path/to/your/backend

# 3. Backup old code
mkdir backup_old_code
cp main.py osm_client.py osm_models.py parser.py constants.py config.py backup_old_code/

# 4. Delete old files
rm osm_client.py osm_models.py parser.py constants.py

# 5. Install dependencies
source .venv/bin/activate
pip install google-cloud-storage==2.18.2

# 6. Create .env file
cp .env.example .env
# Edit .env with your values (bucket name, file name, key path)

# 7. Update .gitignore
echo ".env" >> .gitignore
echo "*.json" >> .gitignore
echo ".venv/" >> .gitignore
```

## Daily Development

```bash
# Start server
cd /path/to/backend
source .venv/bin/activate
fastapi dev

# Test endpoints
curl http://localhost:8000/health
curl "http://localhost:8000/network?min_lat=53.34&min_lng=-6.27&max_lat=53.36&max_lng=-6.23"
```

## GCS Commands

```bash
# List your buckets
gsutil ls

# List files in bucket
gsutil ls gs://your-bucket-name/

# Upload new network file
gsutil cp network.osm.json gs://your-bucket-name/

# Download file
gsutil cp gs://your-bucket-name/network.osm.json ./local-copy.json

# Check file details
gsutil ls -l gs://your-bucket-name/network.osm.json
```

## Troubleshooting

```bash
# Check .env values
cat .env

# Verify key file exists
ls -la /path/to/trafficjam-key.json

# Test GCS access
gsutil ls gs://your-bucket-name/

# Check if service account has access
gsutil iam get gs://your-bucket-name/

# Reinstall dependencies
pip install -r requirements.txt
```

## File Structure

```
your-backend/
├── main.py              ← UPDATED (uses gcs_client)
├── gcs_client.py        ← NEW (GCS + filtering logic)
├── config.py            ← UPDATED (GCS settings)
├── models.py            ← UNCHANGED
├── requirements.txt     ← UPDATED (added google-cloud-storage)
├── pyproject.toml       ← UNCHANGED
├── .env                 ← NEW (your secrets - not in git!)
├── .env.example         ← NEW (template)
└── .gitignore           ← UPDATED (exclude .env and keys)
```

## .env Template

```bash
GCS_BUCKET_NAME=your-bucket-name
GCS_NETWORK_FILE=network.osm.json
GOOGLE_APPLICATION_CREDENTIALS=/path/to/trafficjam-key.json
DEBUG=false
```

## Share With Team

Send team members:
1. The `trafficjam-key.json` file (via secure method)
2. The `SETUP_GUIDE.md` file
3. The updated code (via git, excluding .env and key files)

They need to:
1. Clone/pull the repo
2. Create their own `.env` file pointing to the key
3. Run `pip install -r requirements.txt`
4. Run `fastapi dev`
```
