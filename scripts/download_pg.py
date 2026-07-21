import urllib.request, urllib.error, ssl, sys, os, time

url = "https://get.enterprisedb.com/postgresql/postgresql-15.7-1-windows-x64-binaries.zip"
dest = r"C:\pgsql\pg_final.zip"
chunk_size = 8192

# Disable SSL verification (required behind some proxies)
ssl_ctx = ssl.create_default_context()
ssl_ctx.check_hostname = False
ssl_ctx.verify_mode = ssl.CERT_NONE

print(f"Downloading {url}")
print(f"To: {dest}")
sys.stdout.flush()

req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
start = 0
mode = "wb"

# Delete any existing partial file to start fresh
if os.path.exists(dest):
    os.remove(dest)
    print("Deleted existing partial file")

try:
    response = urllib.request.urlopen(req, context=ssl_ctx, timeout=300)
    total = int(response.headers.get("Content-Length", 0)) + start
    print(f"Total size: {total} bytes ({total/1024/1024:.1f} MB)")
    
    downloaded = start
    last_log = time.time()
    
    with open(dest, mode) as f:
        while True:
            chunk = response.read(chunk_size)
            if not chunk:
                break
            f.write(chunk)
            downloaded += len(chunk)
            
            if time.time() - last_log > 5:
                pct = downloaded / total * 100 if total else 0
                print(f"  {downloaded/1024/1024:.1f} MB / {total/1024/1024:.1f} MB ({pct:.1f}%)")
                sys.stdout.flush()
                last_log = time.time()
    
    print(f"✓ Done: {downloaded} bytes")
    
except Exception as e:
    print(f"✗ Error: {e}")
    sys.exit(1)
