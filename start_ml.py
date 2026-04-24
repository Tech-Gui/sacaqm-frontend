import os, sys
os.chdir(r'd:\Work\sacaqm-dashboard-backend-master\ml-forecast-service')
sys.path.insert(0, r'd:\Work\sacaqm-dashboard-backend-master\ml-forecast-service')
import uvicorn
uvicorn.run('app:app', host='0.0.0.0', port=8001)
