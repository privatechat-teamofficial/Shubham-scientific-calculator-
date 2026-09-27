#!/usr/bin/env python3
import struct
import zlib
import os

def create_png(width, height, get_pixel_func):
    raw_data = bytearray()
    for y in range(height):
        raw_data.append(0)  # Filter type 0 (None)
        for x in range(width):
            r, g, b, a = get_pixel_func(x, y, width, height)
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

def sigma_icon_pixel(x, y, w, h):
    nx = x / float(w)
    ny = y / float(h)
    
    # Rounded badge margin and squircle radius
    pad = 0.05
    if nx < pad or nx > 1.0 - pad or ny < pad or ny > 1.0 - pad:
        return (0, 0, 0, 0) # Transparent outer edge
        
    # Normalized coords inside badge 0.0 to 1.0
    bx = (nx - pad) / (1.0 - 2.0 * pad)
    by = (ny - pad) / (1.0 - 2.0 * pad)
    
    # Corner radius = 0.22
    r_corner = 0.22
    dx = max(0.0, max(r_corner - bx, bx - (1.0 - r_corner)))
    dy = max(0.0, max(r_corner - by, by - (1.0 - r_corner)))
    dist = (dx*dx + dy*dy)**0.5
    
    if dist > r_corner:
        return (0, 0, 0, 0) # Transparent outside squircle
        
    # Gold gradient (#fbbf24 to #d97706) from top-left to bottom-right
    t = (bx + by) * 0.5
    gr = int(251 * (1.0 - t) + 217 * t)
    gg = int(191 * (1.0 - t) + 119 * t)
    gb = int(36 * (1.0 - t) + 6 * t)
    
    # Subtle inner border shine
    if bx < 0.03 or bx > 0.97 or by < 0.03 or by > 0.97 or dist > (r_corner - 0.03):
        return (min(255, gr + 30), min(255, gg + 30), min(255, gb + 20), 255)
        
    # Draw Bold Greek Capital Sigma Σ in pure black (#000000)
    # Sigma centered in range: sx in [0.24, 0.76], sy in [0.22, 0.78]
    sx = bx
    sy = by
    
    # 1. Top horizontal bar: sy in [0.22, 0.32], sx in [0.24, 0.76]
    if 0.22 <= sy <= 0.32 and 0.24 <= sx <= 0.76:
        return (0, 0, 0, 255)
        
    # 2. Bottom horizontal bar: sy in [0.68, 0.78], sx in [0.24, 0.76]
    if 0.68 <= sy <= 0.78 and 0.24 <= sx <= 0.76:
        return (0, 0, 0, 255)
        
    # 3. Upper diagonal stroke from top-right (0.76, 0.25) to center vertex (0.34, 0.50)
    # Line equation: (sy - 0.25) / 0.25 = (0.76 - sx) / 0.42 => sx = 0.76 - 0.42 * (sy - 0.25)/0.25
    if 0.24 <= sy <= 0.52:
        rel_y = (sy - 0.25) / 0.25
        center_x = 0.76 - 0.42 * rel_y
        if abs(sx - center_x) <= 0.09:
            return (0, 0, 0, 255)
            
    # 4. Lower diagonal stroke from center vertex (0.34, 0.50) to bottom-right (0.76, 0.75)
    # Line equation: (0.75 - sy) / 0.25 = (0.76 - sx) / 0.42 => sx = 0.76 - 0.42 * (0.75 - sy)/0.25
    if 0.48 <= sy <= 0.76:
        rel_y = (0.75 - sy) / 0.25
        center_x = 0.76 - 0.42 * rel_y
        if abs(sx - center_x) <= 0.09:
            return (0, 0, 0, 255)
            
    # Inner gold background
    return (gr, gg, gb, 255)

def main():
    print("Generating authentic golden Sigma Σ app icons matching the in-app logo...")
    sizes = [
        (512, "public/pwa-512x512.png"),
        (192, "public/pwa-192x192.png"),
        (180, "public/apple-touch-icon.png"),
        (192, "public/icon-192.png"),
        (512, "public/icon.png"),
    ]
    
    for size, rel_path in sizes:
        print(f"Creating {rel_path} ({size}x{size})...")
        png_data = create_png(size, size, sigma_icon_pixel)
        with open(rel_path, "wb") as f:
            f.write(png_data)
            
    print("All Sigma calculator icons generated successfully!")

if __name__ == "__main__":
    main()
