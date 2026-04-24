import requests, json, time

PORT = 8002

print("=== Testing Forecast Quality (ETS + Conv-LSTM) ===")
start = time.time()
r = requests.post(f'http://localhost:{PORT}/predict', json={'sensor_id': '350976650262543', 'hours': 24}, timeout=180)
elapsed = time.time() - start
data = r.json()
print(f"Model: {data.get('model')}")
print(f"Time: {elapsed:.1f}s")
print(f"Data points: {data.get('data_points_found')}")

preds = data.get('predictions', [])
print(f"\nPredictions ({len(preds)} hours):")
for p in preds:
    print(f"  {p['timestamp']}: pm2.5={p['pm2p5']}, pm10={p['pm10p0']}, temp={p['temperature']:.1f}, hum={p['humidity']:.1f}")

pm25_vals = [p['pm2p5'] for p in preds]
print(f"\npm2.5 range: {min(pm25_vals):.1f} - {max(pm25_vals):.1f} (spread: {max(pm25_vals)-min(pm25_vals):.1f})")
temp_vals = [p['temperature'] for p in preds]
print(f"temp range: {min(temp_vals):.1f} - {max(temp_vals):.1f} (spread: {max(temp_vals)-min(temp_vals):.1f})")

metrics = data.get('training_metrics', {})
print("\nTraining Metrics:")
for param in ['pm2p5', 'pm10p0', 'temperature', 'humidity']:
    m = metrics.get(param, {})
    print(f"  {param}: MAE={m.get('mae')}, MAPE={m.get('mape_percent')}%, points={m.get('data_points')}")
