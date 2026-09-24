#!/usr/bin/env python3
import os
import sys
import subprocess
import shutil
import zipfile
import hashlib
import base64

APPLET_DIR = "/app/applet"
BUILD_DIR = "/tmp/apk_real_build"
KEYSTORE_DIR = os.path.join(APPLET_DIR, ".keystore")

def ensure_keystore():
    os.makedirs(KEYSTORE_DIR, exist_ok=True)
    key_pem = os.path.join(KEYSTORE_DIR, "release.key.pem")
    cert_pem = os.path.join(KEYSTORE_DIR, "release.cert.pem")
    
    if not (os.path.exists(key_pem) and os.path.exists(cert_pem)):
        print("Generating SHUBHAM Release Key & Certificate...")
        subprocess.run([
            "openssl", "req", "-x509", "-newkey", "rsa:2048",
            "-keyout", key_pem, "-out", cert_pem,
            "-days", "10000", "-nodes",
            "-subj", "/C=US/O=SHUBHAM/CN=SHUBHAM Calculator"
        ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        
    return key_pem, cert_pem

def clean_old_duplicate_apks():
    print("Cleaning up old duplicate APK files across directories...")
    folders = [
        os.path.join(APPLET_DIR, "APK_DOWNLOAD"),
        os.path.join(APPLET_DIR, ".build-outputs"),
        os.path.join(APPLET_DIR, "public")
    ]
    for folder in folders:
        if os.path.exists(folder):
            for item in os.listdir(folder):
                if item.endswith(".apk") and item != "app-debug.apk":
                    file_p = os.path.join(folder, item)
                    try:
                        os.remove(file_p)
                        print(f"   Removed old duplicate: {file_p}")
                    except Exception as e:
                        print(f"   Could not remove {file_p}: {e}")

def main():
    print("==================================================")
    print("  BUILDING CLEAN SINGLE ANDROID DEBUG APK (v1)   ")
    print("==================================================")
    
    os.makedirs(BUILD_DIR, exist_ok=True)
    clean_old_duplicate_apks()
    
    # 1. Compile React web application bundle
    print("1. Compiling React web application bundle...")
    subprocess.run(["npm", "run", "build"], cwd=APPLET_DIR, check=True)
    
    dist_dir = os.path.join(APPLET_DIR, "dist")
    if not os.path.exists(dist_dir):
        raise RuntimeError("dist directory was not created!")
        
    # 2. Locate pristine base APK with Android runtime binaries
    base_apk = "/tmp/original_app/public/SHUBHAM-Calculator.apk"
    if not os.path.exists(base_apk):
        base_apk = os.path.join(APPLET_DIR, "public", "SHUBHAM-Calculator.apk")
        
    if not os.path.exists(base_apk):
        raise RuntimeError(f"Base APK not found at {base_apk}")
        
    print(f"2. Extracting Android runtime binaries from {base_apk}...")
    files_map = {}
    with zipfile.ZipFile(base_apk, 'r') as z_in:
        for item in z_in.infolist():
            if item.filename.startswith("META-INF/"):
                continue
            if item.filename.startswith("assets/www/"):
                if "mathjs" in item.filename or "katex" in item.filename:
                    files_map[item.filename] = z_in.read(item.filename)
                continue
            files_map[item.filename] = z_in.read(item.filename)
            
    # Verify core Android binaries
    if "AndroidManifest.xml" not in files_map:
        raise RuntimeError("Missing AndroidManifest.xml in base APK")
    if "classes.dex" not in files_map:
        raise RuntimeError("Missing classes.dex in base APK")
    if "resources.arsc" not in files_map:
        raise RuntimeError("Missing resources.arsc in base APK")
        
    # 3. Inject latest web application build
    print("3. Injecting latest web application assets into APK assets/www/...")
    with open(os.path.join(dist_dir, "index.html"), "r", encoding="utf-8") as f:
        html = f.read()
    adapted_html = html.replace('href="/fonts/', 'href="./fonts/').replace('src="/assets/', 'src="./assets/').replace('href="/assets/', 'href="./assets/').replace('href="/favicon', 'href="./favicon')
    files_map["assets/www/index.html"] = adapted_html.encode("utf-8")
    
    # Copy dist/assets
    dist_assets = os.path.join(dist_dir, "assets")
    if os.path.exists(dist_assets):
        for root, dirs, files in os.walk(dist_assets):
            for f in files:
                full_p = os.path.join(root, f)
                rel_p = os.path.relpath(full_p, dist_dir)
                with open(full_p, "rb") as fp:
                    files_map["assets/www/" + rel_p] = fp.read()
                    
    # Copy public fonts
    fonts_dir = os.path.join(APPLET_DIR, "public", "fonts")
    if os.path.exists(fonts_dir):
        for f in os.listdir(fonts_dir):
            fp = os.path.join(fonts_dir, f)
            if os.path.isfile(fp):
                with open(fp, "rb") as f_obj:
                    files_map["assets/www/fonts/" + f] = f_obj.read()

    # 4. Generate Cryptographic Signature (APK Signature Scheme v1 with SHA1 & SHA256)
    print("4. Generating APK Signature Scheme v1 (MANIFEST.MF, RELEASE.SF, RELEASE.RSA)...")
    key_pem, cert_pem = ensure_keystore()
    
    # Generate MANIFEST.MF with both SHA1 and SHA256 digests
    manifest_lines = ["Manifest-Version: 1.0\r\nCreated-By: 1.0 (Android)\r\n\r\n"]
    manifest_entries = {}
    for name in sorted(files_map.keys()):
        file_bytes = files_map[name]
        sha1_d = base64.b64encode(hashlib.sha1(file_bytes).digest()).decode("ascii")
        sha256_d = base64.b64encode(hashlib.sha256(file_bytes).digest()).decode("ascii")
        entry = f"Name: {name}\r\nSHA1-Digest: {sha1_d}\r\nSHA-256-Digest: {sha256_d}\r\n\r\n"
        manifest_entries[name] = entry
        manifest_lines.append(entry)
    manifest_bytes = "".join(manifest_lines).encode("utf-8")
    
    # Generate RELEASE.SF with both SHA1 and SHA256 digests
    manifest_sha1 = base64.b64encode(hashlib.sha1(manifest_bytes).digest()).decode('ascii')
    manifest_sha256 = base64.b64encode(hashlib.sha256(manifest_bytes).digest()).decode('ascii')
    
    sf_lines = [
        "Signature-Version: 1.0\r\n",
        "Created-By: 1.0 (Android)\r\n",
        f"SHA1-Digest-Manifest: {manifest_sha1}\r\n",
        f"SHA-256-Digest-Manifest: {manifest_sha256}\r\n\r\n"
    ]
    for name in sorted(files_map.keys()):
        entry_bytes = manifest_entries[name].encode("utf-8")
        sha1_d = base64.b64encode(hashlib.sha1(entry_bytes).digest()).decode("ascii")
        sha256_d = base64.b64encode(hashlib.sha256(entry_bytes).digest()).decode("ascii")
        sf_lines.append(f"Name: {name}\r\nSHA1-Digest: {sha1_d}\r\nSHA-256-Digest: {sha256_d}\r\n\r\n")
    sf_bytes = "".join(sf_lines).encode("utf-8")
    
    # Sign RELEASE.SF using OpenSSL CMS
    sf_tmp = os.path.join(BUILD_DIR, "RELEASE.SF")
    rsa_tmp = os.path.join(BUILD_DIR, "RELEASE.RSA")
    with open(sf_tmp, "wb") as f:
        f.write(sf_bytes)
        
    subprocess.run([
        "openssl", "cms", "-sign",
        "-in", sf_tmp,
        "-signer", cert_pem,
        "-inkey", key_pem,
        "-outform", "DER",
        "-out", rsa_tmp,
        "-binary", "-nosmimecap"
    ], check=True)
    
    with open(rsa_tmp, "rb") as f:
        rsa_bytes = f.read()
        
    # 5. Assemble final signed APK
    print("5. Assembling signed APK archive...")
    signed_apk = os.path.join(BUILD_DIR, "app-debug.apk")
    with zipfile.ZipFile(signed_apk, "w", zipfile.ZIP_DEFLATED) as z_out:
        z_out.writestr("META-INF/MANIFEST.MF", manifest_bytes)
        z_out.writestr("META-INF/RELEASE.SF", sf_bytes)
        z_out.writestr("META-INF/RELEASE.RSA", rsa_bytes)
        for name in sorted(files_map.keys()):
            # Keep uncompressed store for resources.arsc and .so files
            if name == "resources.arsc" or name.endswith(".so"):
                z_out.writestr(name, files_map[name], compress_type=zipfile.ZIP_STORED)
            else:
                z_out.writestr(name, files_map[name], compress_type=zipfile.ZIP_DEFLATED)
            
    apk_size = os.path.getsize(signed_apk)
    apk_size_mb = apk_size / (1024 * 1024)
    print(f"6. Final Validated APK Size: {apk_size} bytes ({apk_size_mb:.2f} MB)")
    if apk_size < 1024 * 1024:
        raise RuntimeError(f"APK size {apk_size} bytes is smaller than 1MB!")
        
    # 6. Distribute ONLY ONE SINGLE APK (app-debug.apk) to target locations
    destinations = [
        os.path.join(APPLET_DIR, "APK_DOWNLOAD", "app-debug.apk"),
        os.path.join(APPLET_DIR, ".build-outputs", "app-debug.apk"),
        os.path.join(APPLET_DIR, "public", "app-debug.apk"),
    ]
    
    for dest in destinations:
        os.makedirs(os.path.dirname(dest), exist_ok=True)
        shutil.copy2(signed_apk, dest)
        print(f"   ✓ Placed SINGLE APK at: {dest} ({os.path.getsize(dest)} bytes)")
        
    # Clean up any leftover duplicate files again
    clean_old_duplicate_apks()

    # 7. Create clean SHUBHAM-Calculator-App.zip with ONLY 1 APK
    print("7. Packaging full project ZIP (including strictly ONE single APK)...")
    zip_path = os.path.join(APPLET_DIR, "SHUBHAM-Calculator-App.zip")
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
        for folder in ["src", "public", "APK_DOWNLOAD", ".build-outputs"]:
            folder_path = os.path.join(APPLET_DIR, folder)
            if os.path.exists(folder_path):
                for root, dirs, files in os.walk(folder_path):
                    for f in files:
                        p = os.path.join(root, f)
                        arcname = os.path.relpath(p, APPLET_DIR)
                        zf.write(p, arcname)
        for f in ["index.html", "package.json", "tsconfig.json", "vite.config.ts", "README.md", "build-apk.py"]:
            p = os.path.join(APPLET_DIR, f)
            if os.path.exists(p):
                zf.write(p, f)
                
    zip_size_mb = os.path.getsize(zip_path) / (1024 * 1024)
    print(f"   ✓ Generated Clean ZIP at {zip_path} ({zip_size_mb:.2f} MB)")
    
    # Copy zip to public for download
    shutil.copy2(zip_path, os.path.join(APPLET_DIR, "public", "SHUBHAM-Calculator-App.zip"))
    
    print("==================================================")
    print("  BUILD SUCCESSFUL: SINGLE REAL APK READY         ")
    print("==================================================")

if __name__ == "__main__":
    main()
