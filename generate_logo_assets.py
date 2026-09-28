#!/usr/bin/env python3
"""
Generates the exact logo assets matching the user's provided logo:
- Vibrant golden-amber squircle background (#FFA800)
- Exact black Greek Capital Sigma (Σ) glyph with serif teeth and center vertex
Updates all web icons, favicons, PWA icons, cached Android assets, and base-runtime.apk.
"""

import struct
import zlib
import os
import zipfile

# Exact SVG definition matching the user's logo image
SVG_CONTENT = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
  <rect width="1024" height="1024" rx="225" ry="225" fill="#FFA800" />
  <path d="M 320 316 L 662 316 L 662 404 L 616 404 L 458 374 L 572 512 L 458 650 L 616 620 L 662 620 L 662 708 L 320 708 L 444 512 Z" fill="#000000" />
</svg>
"""

# Polygon vertices on 1024x1024 coordinate system
SIGMA_POLY = [
    (320.0, 316.0),
    (662.0, 316.0),
    (662.0, 404.0),
    (616.0, 404.0),
    (458.0, 374.0),
    (572.0, 512.0),
    (458.0, 650.0),
    (616.0, 620.0),
    (662.0, 620.0),
    (662.0, 708.0),
    (320.0, 708.0),
    (444.0, 512.0),
]

def point_in_poly(x, y, poly):
    n = len(poly)
    inside = False
    p1x, p1y = poly[0]
    for i in range(n + 1):
        p2x, p2y = poly[i % n]
        if y > min(p1y, p2y):
            if y <= max(p1y, p2y):
                if x <= max(p1x, p2x):
                    if p1y != p2y:
                        xinters = (y - p1y) * (p2x - p1x) / (p2y - p1y) + p1x
                    if p1x == p2x or x <= xinters:
                        inside = not inside
        p1x, p1y = p2x, p2y
    return inside

def render_pixel(x, y, width, height):
    # 2x2 subpixel supersampling for smooth antialiasing
    samples = [
        (0.25, 0.25),
        (0.75, 0.25),
        (0.25, 0.75),
        (0.75, 0.75),
    ]
    
    total_r, total_g, total_b, total_a = 0, 0, 0, 0
    
    for sx, sy in samples:
        px = ((x + sx) / float(width)) * 1024.0
        py = ((y + sy) / float(height)) * 1024.0
        
        # Check squircle corner radius (225 on 1024)
        r_corner = 225.0
        dx = max(0.0, max(r_corner - px, px - (1024.0 - r_corner)))
        dy = max(0.0, max(r_corner - py, py - (1024.0 - r_corner)))
        dist = (dx * dx + dy * dy) ** 0.5
        
        if dist > r_corner:
            continue
            
        if point_in_poly(px, py, SIGMA_POLY):
            # Pure Black (#000000)
            total_a += 255
        else:
            # Vibrant Amber/Yellow-Orange (#FFA800)
            total_r += 255
            total_g += 168
            total_b += 0
            total_a += 255
            
    return (int(total_r / 4), int(total_g / 4), int(total_b / 4), int(total_a / 4))

def create_png_bytes(width, height):
    raw_data = bytearray()
    for y in range(height):
        raw_data.append(0)  # Filter byte 0
        for x in range(width):
            r, g, b, a = render_pixel(x, y, width, height)
            raw_data.extend([r, g, b, a])
            
    png = b'\x89PNG\r\n\x1a\n'
    ihdr_data = struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)
    ihdr_crc = zlib.crc32(b'IHDR' + ihdr_data)
    png += struct.pack('>I', 13) + b'IHDR' + ihdr_data + struct.pack('>I', ihdr_crc)
    
    compressed = zlib.compress(bytes(raw_data), 9)
    idat_crc = zlib.crc32(b'IDAT' + compressed)
    png += struct.pack('>I', len(compressed)) + b'IDAT' + compressed + struct.pack('>I', idat_crc)
    
    iend_crc = zlib.crc32(b'IEND')
    png += struct.pack('>I', 0) + b'IEND' + struct.pack('>I', iend_crc)
    
    return png

def main():
    print("Generating exact logo assets matching uploaded image...")
    
    # Write SVG
    with open("public/favicon.svg", "w") as f:
        f.write(SVG_CONTENT)
    print("✓ Created public/favicon.svg")
    
    targets = [
        ("public/pwa-512x512.png", 512),
        ("public/pwa-192x192.png", 192),
        ("public/icon.png", 512),
        ("public/icon-192.png", 192),
        ("public/apple-touch-icon.png", 180),
        ("public/icons/icon-48.png", 48),
        ("public/icons/icon-72.png", 72),
        ("public/icons/icon-96.png", 96),
        ("public/icons/icon-144.png", 144),
        ("public/icons/icon-192.png", 192),
        (".cached_res/mipmap-mdpi-v4/ic_launcher.png", 48),
        (".cached_res/mipmap-hdpi-v4/ic_launcher.png", 72),
        (".cached_res/mipmap-xhdpi-v4/ic_launcher.png", 96),
        (".cached_res/mipmap-xxhdpi-v4/ic_launcher.png", 144),
        (".cached_res/mipmap-xxxhdpi-v4/ic_launcher.png", 192),
        (".cached_res/drawable/ic_launcher.png", 192),
    ]
    
    generated_pngs = {}
    for path, size in targets:
        os.makedirs(os.path.dirname(path), exist_ok=True)
        if size not in generated_pngs:
            generated_pngs[size] = create_png_bytes(size, size)
        data = generated_pngs[size]
        with open(path, "wb") as f:
            f.write(data)
        print(f"✓ Generated {path} ({size}x{size})")
        
    # Directly update base-runtime.apk if present
    base_apk = ".cached_res/base-runtime.apk"
    if os.path.exists(base_apk):
        print(f"Updating all icon entries inside {base_apk}...")
        tmp_apk = ".cached_res/base-runtime-updated.apk"
        density_sizes = {
            "res/mipmap-mdpi-v4/ic_launcher.png": 48,
            "res/mipmap-hdpi-v4/ic_launcher.png": 72,
            "res/mipmap-xhdpi-v4/ic_launcher.png": 96,
            "res/mipmap-xxhdpi-v4/ic_launcher.png": 144,
            "res/mipmap-xxxhdpi-v4/ic_launcher.png": 192,
            "res/drawable/ic_launcher.png": 192,
        }
        with zipfile.ZipFile(base_apk, 'r') as z_in, zipfile.ZipFile(tmp_apk, 'w') as z_out:
            for item in z_in.infolist():
                if item.filename in density_sizes:
                    sz = density_sizes[item.filename]
                    z_out.writestr(item.filename, generated_pngs[sz], compress_type=zipfile.ZIP_DEFLATED)
                else:
                    data = z_in.read(item.filename)
                    compress_type = zipfile.ZIP_STORED if item.filename == "resources.arsc" else item.compress_type
                    z_out.writestr(item, data)
        os.replace(tmp_apk, base_apk)
        print("✓ Updated base-runtime.apk with exact logo icons")
        
    print("All logo and icon assets updated successfully!")

if __name__ == "__main__":
    main()
