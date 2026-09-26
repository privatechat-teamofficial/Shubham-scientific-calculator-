#!/usr/bin/env python3
import os
import sys
import subprocess
import shutil
import zipfile
import hashlib
import struct
import base64
import tempfile
import zlib

APPLET_DIR = os.path.dirname(os.path.abspath(__file__))
BUILD_DIR = "/tmp/apk_real_build"
KEYSTORE_DIR = os.path.join(APPLET_DIR, ".keystore")

def ensure_keystore():
    os.makedirs(KEYSTORE_DIR, exist_ok=True)
    key_pem = os.path.join(KEYSTORE_DIR, "release.key.pem")
    cert_pem = os.path.join(KEYSTORE_DIR, "release.cert.pem")
    key_pk8 = os.path.join(KEYSTORE_DIR, "release.key.pk8")
    
    if not (os.path.exists(key_pem) and os.path.exists(cert_pem)):
        print("Generating SHUBHAM Release Key & Certificate...")
        subprocess.run([
            "openssl", "req", "-x509", "-newkey", "rsa:2048",
            "-keyout", key_pem, "-out", cert_pem,
            "-days", "10000", "-nodes",
            "-subj", "/C=US/O=SHUBHAM/CN=SHUBHAM Calculator"
        ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        
    if not os.path.exists(key_pk8):
        print("Converting release key to PKCS#8 DER format for apksigner...")
        subprocess.run([
            "openssl", "pkcs8", "-topk8", "-outform", "DER",
            "-in", key_pem, "-out", key_pk8, "-nocrypt"
        ], check=True)
        
    return key_pem, cert_pem, key_pk8

def find_android_tool(tool_name):
    # 1. Search PATH
    found = shutil.which(tool_name)
    if found:
        return found
    # 2. Check ANDROID_HOME and ANDROID_SDK_ROOT
    for env_var in ["ANDROID_HOME", "ANDROID_SDK_ROOT"]:
        sdk_root = os.environ.get(env_var)
        if sdk_root and os.path.isdir(sdk_root):
            bt_dir = os.path.join(sdk_root, "build-tools")
            if os.path.isdir(bt_dir):
                for ver in sorted(os.listdir(bt_dir), reverse=True):
                    cand = os.path.join(bt_dir, ver, tool_name)
                    if os.path.isfile(cand) and os.access(cand, os.X_OK):
                        return cand
            cand = os.path.join(sdk_root, "platform-tools", tool_name)
            if os.path.isfile(cand) and os.access(cand, os.X_OK):
                return cand
    # 3. Known system paths
    for cand in [
        f"/usr/bin/{tool_name}",
        f"/usr/lib/android-sdk/build-tools/debian/{tool_name}",
        f"/usr/lib/android-sdk/platform-tools/{tool_name}",
    ]:
        if os.path.isfile(cand) and os.access(cand, os.X_OK):
            return cand
    return None

def modify_manifest(data, string_replacements):
    file_type, file_hdr_size, file_size = struct.unpack('<HHI', data[:8])
    pos = 8
    chunk_type, hdr_size, chunk_size, str_count, style_count, flags, str_start, styles_start = struct.unpack('<HH6I', data[pos:pos+28])
    if chunk_type != 0x0001:
        return data
        
    offsets_start = pos + 28
    offsets = struct.unpack(f'<{str_count}I', data[offsets_start:offsets_start + str_count*4])
    
    old_strings = []
    base = pos + str_start
    for off in offsets:
        p = base + off
        u16len = struct.unpack('<H', data[p:p+2])[0]
        s = data[p+2:p+2+u16len*2].decode('utf-16le', errors='ignore')
        old_strings.append(s)
        
    new_strings = [string_replacements.get(s, s) for s in old_strings]
    
    new_str_data = bytearray()
    new_offsets = []
    for s in new_strings:
        new_offsets.append(len(new_str_data))
        encoded = s.encode('utf-16le')
        u16len = len(s)
        new_str_data.extend(struct.pack('<H', u16len))
        new_str_data.extend(encoded)
        new_str_data.extend(b'\x00\x00')
        
    while len(new_str_data) % 4 != 0:
        new_str_data.append(0)
        
    new_offsets_bytes = struct.pack(f'<{str_count}I', *new_offsets)
    new_str_start = 28 + len(new_offsets_bytes)
    pad_len = (4 - (new_str_start % 4)) % 4
    new_str_start += pad_len
    
    new_chunk_size = 28 + len(new_offsets_bytes) + pad_len + len(new_str_data)
    new_sp_chunk = struct.pack('<HH6I', chunk_type, hdr_size, new_chunk_size, str_count, style_count, flags, new_str_start, styles_start)
    new_sp_chunk += new_offsets_bytes
    new_sp_chunk += b'\x00' * pad_len
    new_sp_chunk += new_str_data
    
    rest_data = data[pos + chunk_size:]
    new_file_size = 8 + len(new_sp_chunk) + len(rest_data)
    new_header = struct.pack('<HHI', file_type, file_hdr_size, new_file_size)
    
    return bytes(new_header + new_sp_chunk + rest_data)

def apply_apk_v2_signature(apk_path, key_pem, cert_pem):
    """
    Applies APK Signature Scheme v2 (ID 0x7109871a) to the APK file.
    """
    with open(apk_path, 'rb') as f:
        apk_bytes = f.read()
        
    # Locate EOCD record
    eocd_pos = apk_bytes.rfind(b'\x50\x4b\x05\x06')
    if eocd_pos == -1:
        raise ValueError("Invalid ZIP: EOCD not found")
        
    eocd = bytearray(apk_bytes[eocd_pos:])
    cd_size, cd_offset = struct.unpack('<II', eocd[12:20])
    
    zip_entries_data = apk_bytes[:cd_offset]
    cd_data = apk_bytes[cd_offset:eocd_pos]
    
    # 1. Compute Whole-file digest
    CHUNK_SIZE = 1024 * 1024
    chunk_hashes = []
    for section in [zip_entries_data, cd_data, bytes(eocd)]:
        offset = 0
        while offset < len(section):
            chunk = section[offset:offset + CHUNK_SIZE]
            h = hashlib.sha256(b'\xa5' + struct.pack('<I', len(chunk)) + chunk).digest()
            chunk_hashes.append(h)
            offset += len(chunk)
            
    content_digest = hashlib.sha256(b'\x5a' + struct.pack('<I', len(chunk_hashes)) + b''.join(chunk_hashes)).digest()
    
    # 2. Prepare SignedData
    # Digest item: Alg ID 0x0103 (SHA256withRSA) + digest
    digest_item = struct.pack('<I', 0x0103) + struct.pack('<I', len(content_digest)) + content_digest
    digest_list = struct.pack('<I', len(digest_item)) + digest_item
    digests_block = struct.pack('<I', len(digest_list)) + digest_list
    
    # Export DER Cert
    cert_der = subprocess.check_output(['openssl', 'x509', '-in', cert_pem, '-outform', 'DER'])
    cert_item = struct.pack('<I', len(cert_der)) + cert_der
    certs_block = struct.pack('<I', len(cert_item)) + cert_item
    
    # Additional Attributes
    attrs_block = struct.pack('<I', 0)
    
    # signed_data
    signed_data = digests_block + certs_block + attrs_block
    signed_data_len_prefixed = struct.pack('<I', len(signed_data)) + signed_data
    
    # 3. Sign SignedData with RSA Key
    with tempfile.NamedTemporaryFile() as data_tmp, tempfile.NamedTemporaryFile() as sig_tmp:
        data_tmp.write(signed_data)
        data_tmp.flush()
        subprocess.run(['openssl', 'dgst', '-sha256', '-sign', key_pem, '-out', sig_tmp.name, data_tmp.name], check=True)
        rsa_sig = sig_tmp.read()
        
    sig_item = struct.pack('<I', 0x0103) + struct.pack('<I', len(rsa_sig)) + rsa_sig
    signatures_block = struct.pack('<I', len(sig_item)) + sig_item
    signatures_len_prefixed = struct.pack('<I', len(signatures_block)) + signatures_block
    
    # 4. Public Key DER
    with tempfile.NamedTemporaryFile(suffix='.pem') as tmp:
        pub_pem = subprocess.check_output(['openssl', 'x509', '-in', cert_pem, '-pubkey', '-noout'])
        tmp.write(pub_pem)
        tmp.flush()
        pubkey_der = subprocess.check_output(['openssl', 'pkey', '-pubin', '-in', tmp.name, '-outform', 'DER'])
    pubkey_len_prefixed = struct.pack('<I', len(pubkey_der)) + pubkey_der
    
    # 5. Signer Block
    signer = signed_data_len_prefixed + signatures_len_prefixed + pubkey_len_prefixed
    signer_len_prefixed = struct.pack('<I', len(signer)) + signer
    signers_list = struct.pack('<I', len(signer_len_prefixed)) + signer_len_prefixed
    
    # 6. APK v2 Block (ID 0x7109871a)
    v2_pair_len = 4 + len(signers_list)
    v2_pair = struct.pack('<Q', v2_pair_len) + struct.pack('<I', 0x7109871a) + signers_list
    
    # Block total size
    block_content = v2_pair
    block_size = len(block_content) + 24 # 8 (size2) + 16 (magic)
    signing_block = struct.pack('<Q', block_size) + block_content + struct.pack('<Q', block_size) + b"APK Sig Block 42"
    
    # 7. Assemble signed APK with updated EOCD Central Directory offset
    new_cd_offset = len(zip_entries_data) + len(signing_block)
    eocd[16:20] = struct.pack('<I', new_cd_offset)
    
    final_apk = zip_entries_data + signing_block + cd_data + bytes(eocd)
    with open(apk_path, 'wb') as f:
        f.write(final_apk)
        
    print(f"   ✓ APK Signature Scheme v2 Applied (Block size: {len(signing_block)} bytes)")

def main():
    print("==================================================")
    print("  BUILDING REAL ANDROID DEBUG APK (v1 + v2 Signed) ")
    print("==================================================")
    
    os.makedirs(BUILD_DIR, exist_ok=True)
    
    # 1. Compile React web application bundle
    print("1. Compiling React web application bundle...")
    subprocess.run(["npm", "run", "build"], cwd=APPLET_DIR, check=True)
    
    dist_dir = os.path.join(APPLET_DIR, "dist")
    if not os.path.exists(dist_dir):
        raise RuntimeError("dist directory was not created!")
        
    # 2. Base APK with Android runtime binaries
    candidates = [
        os.path.join(APPLET_DIR, ".cached_res", "base-runtime.apk"),
        os.path.join(APPLET_DIR, "APK_DOWNLOAD", "app-debug.apk"),
        os.path.join(APPLET_DIR, ".build-outputs", "app-debug.apk"),
        os.path.join(APPLET_DIR, "public", "app-debug.apk"),
    ]
    
    base_apk = None
    for cand in candidates:
        if os.path.exists(cand) and os.path.getsize(cand) > 1024 * 1024:
            base_apk = cand
            break
            
    if not base_apk:
        raise RuntimeError("Base APK not found in any candidate paths!")
        
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
        
    # Update manifest strings to com.shubham.calculator while keeping launcher activity matching classes.dex
    raw_manifest = files_map["AndroidManifest.xml"]
    files_map["AndroidManifest.xml"] = modify_manifest(raw_manifest, {
        "com.mathda.calculator": "com.shubham.calculator",
        "1.0.11": "1.0.0"
    })
    
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
                    content = fp.read()
                if f.endswith(".css"):
                    try:
                        text_css = content.decode("utf-8")
                        text_css = text_css.replace("url(/fonts/", "url(../fonts/").replace("url('/fonts/", "url('../fonts/").replace('url("/fonts/', 'url("../fonts/')
                        content = text_css.encode("utf-8")
                    except Exception:
                        pass
                files_map["assets/www/" + rel_p] = content
                    
    # Copy public fonts
    fonts_dir = os.path.join(APPLET_DIR, "public", "fonts")
    if os.path.exists(fonts_dir):
        for f in os.listdir(fonts_dir):
            fp = os.path.join(fonts_dir, f)
            if os.path.isfile(fp):
                with open(fp, "rb") as f_obj:
                    files_map["assets/www/fonts/" + f] = f_obj.read()
                    
    # 4. Assemble final unsigned APK (resources.arsc must be stored uncompressed ZIP_STORED)
    print("4. Assembling unsigned APK with uncompressed resources.arsc (ZIP_STORED)...")
    unsigned_apk = os.path.join(BUILD_DIR, "app-unsigned.apk")
    with zipfile.ZipFile(unsigned_apk, "w") as z_out:
        for name in sorted(files_map.keys()):
            data = files_map[name]
            compress_type = zipfile.ZIP_STORED if name == "resources.arsc" else zipfile.ZIP_DEFLATED
            z_out.writestr(name, data, compress_type=compress_type)

    # 5. 4-byte ZIP alignment on unsigned APK
    print("5. Running zipalign -p -f 4 on unsigned APK...")
    zipalign_bin = find_android_tool("zipalign")
    if not zipalign_bin:
        raise RuntimeError("zipalign tool not found! Android APK requires 4-byte alignment.")
    aligned_apk = os.path.join(BUILD_DIR, "app-aligned.apk")
    subprocess.run([zipalign_bin, "-p", "-f", "4", unsigned_apk, aligned_apk], check=True)
    print(f"   ✓ Successfully 4-byte aligned APK using {zipalign_bin}")

    # 6. Sign aligned APK
    print("6. Signing aligned APK...")
    key_pem, cert_pem, key_pk8 = ensure_keystore()
    signed_apk = os.path.join(BUILD_DIR, "app-debug.apk")
    apksigner_bin = find_android_tool("apksigner")
    if apksigner_bin and shutil.which("java"):
        shutil.copy2(aligned_apk, signed_apk)
        subprocess.run([
            apksigner_bin, "sign",
            "--key", key_pk8,
            "--cert", cert_pem,
            "--v1-signing-enabled", "true",
            "--v2-signing-enabled", "true",
            "--v3-signing-enabled", "true",
            signed_apk
        ], check=True)
        print(f"   ✓ APK successfully signed using {apksigner_bin}")
    else:
        shutil.copy2(aligned_apk, signed_apk)
        apply_apk_v2_signature(signed_apk, key_pem, cert_pem)

    # 7. Verification of signature and alignment
    print("7. Verifying APK signature and alignment...")
    if apksigner_bin and shutil.which("java"):
        subprocess.run([apksigner_bin, "verify", "--verbose", "--print-certs", signed_apk], check=True)
        print("   ✓ apksigner signature verification PASSED")
    subprocess.run([zipalign_bin, "-c", "-v", "4", signed_apk], check=True)
    print("   ✓ zipalign 4-byte verification PASSED")
    
    apk_size = os.path.getsize(signed_apk)
    apk_size_mb = apk_size / (1024 * 1024)
    print(f"6. Final Validated APK Size: {apk_size} bytes ({apk_size_mb:.2f} MB)")
    if apk_size < 1024 * 1024:
        raise RuntimeError(f"APK size {apk_size} bytes is smaller than 1MB!")
        
    # Clean up old duplicate APK files
    for folder in [os.path.join(APPLET_DIR, "APK_DOWNLOAD"), os.path.join(APPLET_DIR, ".build-outputs"), os.path.join(APPLET_DIR, "public")]:
        if os.path.exists(folder):
            for f in os.listdir(folder):
                if f.endswith(".apk") and f != "app-debug.apk":
                    os.remove(os.path.join(folder, f))
                    
    # 7. Distribute single real APK
    destinations = [
        os.path.join(APPLET_DIR, ".build-outputs", "app-debug.apk"),
        os.path.join(APPLET_DIR, "APK_DOWNLOAD", "app-debug.apk"),
        os.path.join(APPLET_DIR, "public", "app-debug.apk"),
    ]
    
    for dest in destinations:
        os.makedirs(os.path.dirname(dest), exist_ok=True)
        shutil.copy2(signed_apk, dest)
        print(f"   ✓ Placed APK at: {dest} ({os.path.getsize(dest)} bytes)")
        
    # 8. Create/Update SHUBHAM-Calculator-App.zip
    print("8. Packaging full project ZIP (including real APK)...")
    zip_path = os.path.join(APPLET_DIR, "SHUBHAM-Calculator-App.zip")
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
        for folder in ["src", "public", "APK_DOWNLOAD", ".build-outputs", ".github"]:
            folder_path = os.path.join(APPLET_DIR, folder)
            if os.path.exists(folder_path):
                for root, dirs, files in os.walk(folder_path):
                    for f in files:
                        if f.endswith(".zip"):
                            continue
                        p = os.path.join(root, f)
                        arcname = os.path.relpath(p, APPLET_DIR)
                        zf.write(p, arcname)
        for f in ["index.html", "package.json", "tsconfig.json", "vite.config.ts", "server.ts", "README.md", "build-apk.py", "publish-release.sh"]:
            p = os.path.join(APPLET_DIR, f)
            if os.path.exists(p):
                zf.write(p, f)
                
    zip_size_mb = os.path.getsize(zip_path) / (1024 * 1024)
    print(f"   ✓ Generated Clean ZIP at {zip_path} ({zip_size_mb:.2f} MB)")
    
    shutil.copy2(zip_path, os.path.join(APPLET_DIR, "APK_DOWNLOAD", "SHUBHAM-Calculator-App.zip"))
    shutil.copy2(zip_path, os.path.join(APPLET_DIR, "public", "SHUBHAM-Calculator-App.zip"))
    
    print("==================================================")
    print("  BUILD SUCCESSFUL: REAL SIGNED ANDROID APK READY ")
    print("==================================================")

if __name__ == "__main__":
    main()
