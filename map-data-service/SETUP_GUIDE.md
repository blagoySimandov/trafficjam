# Step-by-Step Setup Guide (Service Account Key Method)

## 🎯 Goal
Get your FastAPI backend working with Google Cloud Storage using a service account key file.

---

## Step 1: Create Service Account & Download Key

```bash
# 1. Set your Google Cloud project ID
export PROJECT_ID=your-project-id-here

# 2. Create a service account
gcloud iam service-accounts create trafficjam-dev \
  --display-name="Traffic Jam Development" \
  --project=$PROJECT_ID

# 3. Grant the service account access to your GCS bucket
gsutil iam ch \
  serviceAccount:trafficjam-dev@${PROJECT_ID}.iam.gserviceaccount.com:roles/storage.objectViewer \
  gs://your-bucket-name

# 4. Create and download the key file
gcloud iam service-accounts keys create ~/trafficjam-key.json \
  --iam-account=trafficjam-dev@${PROJECT_ID}.iam.gserviceaccount.com

# 5. You now have ~/trafficjam-key.json - keep this safe!
```

**Important:** The `trafficjam-key.json` file is sensitive. Don't commit it to git!

---

## Step 2: Update Your Backend Code

Navigate to your backend directory:
```bash
cd /path/to/your/backend
```

### 2a. Backup Old Files (Optional but Recommended)

```bash
mkdir backup_old_code
cp main.py osm_client.py osm_models.py parser.py constants.py config.py backup_old_code/
```

### 2b. Delete Files You No Longer Need

```bash
rm osm_client.py
rm osm_models.py
rm parser.py
rm constants.py
```

### 2c. Replace With New Files

Download the new files I provided and replace:
- Replace `main.py` with the new version
- Replace `config.py` with the new version
- Replace `requirements.txt` with the new version
- Add `gcs_client.py` (NEW file)
- Add `.env.example` (NEW file)

Keep these files unchanged:
- `models.py` ✅ (no changes)
- `pyproject.toml` ✅ (no changes)

Your directory should now look like:
```
your-backend/
├── main.py              ← UPDATED
├── gcs_client.py        ← NEW
├── config.py            ← UPDATED
├── models.py            ← UNCHANGED
├── pyproject.toml       ← UNCHANGED
├── requirements.txt     ← UPDATED
└── .env.example         ← NEW
```

---

## Step 3: Install Dependencies

```bash
# Make sure you're in your virtual environment
source .venv/bin/activate

# Install the new dependency (Google Cloud Storage)
pip install google-cloud-storage==2.18.2

# Or install everything from requirements.txt
pip install -r requirements.txt
```

---

## Step 4: Configure Environment Variables

```bash
# Copy the example .env file
cp .env.example .env

# Edit the .env file
nano .env  # or use your preferred editor (code .env, vim .env, etc.)
```

Update `.env` with your actual values:
```bash
# Replace with your actual bucket name
GCS_BUCKET_NAME=your-actual-bucket-name

# Replace with your actual file name
GCS_NETWORK_FILE=network.osm.json

# Replace with the actual path to your key file
GOOGLE_APPLICATION_CREDENTIALS=/Users/yourname/trafficjam-key.json

DEBUG=false
```

**Example:**
```bash
GCS_BUCKET_NAME=trafficjam-network-data
GCS_NETWORK_FILE=network.osm.json
GOOGLE_APPLICATION_CREDENTIALS=/Users/john/Desktop/trafficjam-key.json
DEBUG=false
```

---

## Step 5: Test It Works

```bash
# Start the dev server
fastapi dev

# You should see:
# INFO:     Uvicorn running on http://127.0.0.1:8000
```

In another terminal, test the endpoints:

```bash
# Test health endpoint
curl http://localhost:8000/health

# Expected output: {"status":"ok"}

# Test network endpoint (adjust coordinates for your data)
# These are Dublin coordinates - change for your area
curl "http://localhost:8000/network?min_lat=53.34&min_lng=-6.27&max_lat=53.36&max_lng=-6.23"

# You should see JSON with nodes, links, buildings, transport_routes
```

---

## Step 6: Share With Team Members

### Method 1: Share the Key File (Simple)

1. Send `trafficjam-key.json` to team members via secure method:
   - 1Password shared vault
   - LastPass
   - Encrypted email
   - Secure file share (NOT email attachment!)

2. Send them this setup guide

3. They follow Steps 2-5 above

### Method 2: Create Individual Service Accounts (More Secure)

Repeat Step 1 for each team member:
```bash
# For Alice
gcloud iam service-accounts create trafficjam-alice \
  --display-name="Traffic Jam - Alice"

gsutil iam ch \
  serviceAccount:trafficjam-alice@${PROJECT_ID}.iam.gserviceaccount.com:roles/storage.objectViewer \
  gs://your-bucket-name

gcloud iam service-accounts keys create ~/trafficjam-alice-key.json \
  --iam-account=trafficjam-alice@${PROJECT_ID}.iam.gserviceaccount.com

# Send trafficjam-alice-key.json to Alice
```

---

## Step 7: Add to .gitignore

**CRITICAL:** Don't commit sensitive files to git!

```bash
# Add to .gitignore
echo ".env" >> .gitignore
echo "*.json" >> .gitignore
echo "trafficjam-key.json" >> .gitignore
echo ".venv/" >> .gitignore

# Verify .gitignore
cat .gitignore
```

---

## Troubleshooting

### Error: "Failed to fetch network data from GCS"

**Check 1:** Is your bucket name correct in `.env`?
```bash
cat .env | grep GCS_BUCKET_NAME
```

**Check 2:** Does the file exist in your bucket?
```bash
gsutil ls gs://your-bucket-name/network.osm.json
```

**Check 3:** Is the key file path correct?
```bash
cat .env | grep GOOGLE_APPLICATION_CREDENTIALS
ls -la /path/shown/in/env/file
```

### Error: "Permission denied" or "403 Forbidden"

**Fix:** Make sure the service account has access:
```bash
gsutil iam ch \
  serviceAccount:trafficjam-dev@${PROJECT_ID}.iam.gserviceaccount.com:roles/storage.objectViewer \
  gs://your-bucket-name
```

### Error: "Module 'gcs_client' not found"

**Fix:** Make sure `gcs_client.py` is in your backend directory:
```bash
ls -la gcs_client.py
```

### Error: "No module named 'google'"

**Fix:** Install google-cloud-storage:
```bash
pip install google-cloud-storage==2.18.2
```

### First Request is Slow (1-2 seconds)

**This is normal!** The first request downloads the JSON from GCS and caches it.
Subsequent requests will be <100ms.

---

## Success Checklist

- [ ] Service account created
- [ ] Key file downloaded (trafficjam-key.json)
- [ ] Old files deleted (osm_client.py, parser.py, etc.)
- [ ] New files added (gcs_client.py)
- [ ] Updated files replaced (main.py, config.py, requirements.txt)
- [ ] Dependencies installed (google-cloud-storage)
- [ ] .env file created with correct values
- [ ] .gitignore updated to exclude sensitive files
- [ ] Server starts without errors (`fastapi dev`)
- [ ] Health endpoint works (`curl http://localhost:8000/health`)
- [ ] Network endpoint returns data

---

## Quick Reference

**Start server:**
```bash
fastapi dev
```

**Test health:**
```bash
curl http://localhost:8000/health
```

**Test network (Dublin example):**
```bash
curl "http://localhost:8000/network?min_lat=53.34&min_lng=-6.27&max_lat=53.36&max_lng=-6.23"
```

**Find your bucket:**
```bash
gsutil ls
```

**List files in bucket:**
```bash
gsutil ls gs://your-bucket-name/
```

---

## Next Steps

Once everything works:
1. Share the key file with your team (securely!)
2. Update your frontend to use the new API (if URL changed)
3. Deploy to production (Cloud Run, Docker, etc.)

---

Need help? Check the error message and look in the Troubleshooting section above.
