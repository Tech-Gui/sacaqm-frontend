import os, sys
os.chdir(r'd:\Work\sacaqm-dashboard-backend-master\ml-forecast-service')
sys.path.insert(0, r'd:\Work\sacaqm-dashboard-backend-master\ml-forecast-service')
from dotenv import load_dotenv
load_dotenv(r'd:\Work\sacaqm-dashboard-backend-master\ml-forecast-service\.env')
from pymongo import MongoClient
client = MongoClient(os.getenv('MONGO_URI'))
db = client[os.getenv('MONGO_DB', 'test')]
stations = list(db['stations'].find({}, {"name": 1, "sensorIds": 1}))
for s in stations:
    if 'mine' in s.get('name', '').lower():
        print("Station: {} - SensorIDs: {} - ID: {}".format(s['name'], s.get('sensorIds', []), s['_id']))
