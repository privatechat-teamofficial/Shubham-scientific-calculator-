#!/usr/bin/env python3
import struct
import zlib
import os

def create_png(width, height, get_pixel_func):
    raw_data = bytearray()
    for y in range(height):
        raw_data.append(0)  # Filter 0
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

def top_left_logo_pixel(x, y, w, h):
    nx = x / float(w)
    ny = y / float(h)
    
    # Corner radius = 0.22 (rounded-[10px] equivalent on squircle)
    r_corner = 0.22
    dx = max(0.0, max(r_corner - nx, nx - (1.0 - r_corner)))
    dy = max(0.0, max(r_corner - ny, ny - (1.0 - r_corner)))
    dist = (dx*dx + dy*dy)**0.5
    
    if dist > r_corner:
        return (0, 0, 0, 0) # Transparent outside squircle
        
    # Pure Vibrant Amber/Yellow (#f59e0b -> RGB 245, 158, 11)
    br, bg, bb = 245, 158, 11
    
    # Bold Greek Capital Sigma Σ in pure black (#000000)
    # Centered: x in [0.22, 0.78], y in [0.20, 0.80]
    sx = nx
    sy = ny
    
    # 1. Top horizontal bar: sy in [0.20, 0.29], sx in [0.22, 0.78]
    if 0.20 <= sy <= 0.29 and 0.22 <= sx <= 0.78:
        return (0, 0, 0, 255)
        
    # 2. Bottom horizontal bar: sy in [0.71, 0.80], sx in [0.22, 0.78]
    if 0.71 <= sy <= 0.80 and 0.22 <= sx <= 0.78:
        return (0, 0, 0, 255)
        
    # 3. Upper diagonal stroke from top-right (0.78, 0.24) to center vertex (0.32, 0.50)
    # y in [0.24, 0.52]
    if 0.22 <= sy <= 0.52:
        rel_y = (sy - 0.24) / 0.26
        center_x = 0.78 - 0.46 * rel_y
        if abs(sx - center_x) <= 0.085:
            return (0, 0, 0, 255)
            
    # 4. Lower diagonal stroke from center vertex (0.32, 0.50) to bottom-right (0.78, 0.76)
    # y in [0.48, 0.78]
    if 0.48 <= sy <= 0.78:
        rel_y = (0.76 - sy) / 0.26
        center_x = 0.78 - 0.46 * rel_y
        if abs(sx - center_x) <= 0.085:
            return (0, 0, 0, 255)
            
    # Amber background
    return (br, bg, bb, 255)

def main():
    print("Generating exact top-left corner logo app icons (#f59e0b + bold black Σ)...")
    sizes = [
        (512, "public/pwa-512x512.png"),
        (192, "public/pwa-192x192.png"),
        (180, "public/apple-touch-icon.png"),
        (192, "public/icon-192.png"),
        (512, "public/icon.png"),
    ]
    
    for size, rel_path in sizes:
        png_data = create_png(size, size, top_left_logo_pixel)
        with open(rel_path, "wb") as f:
            f.write(png_data)
            
    print("All top-left corner matching icons generated successfully!")

if __name__ == "__main__":
    main()
