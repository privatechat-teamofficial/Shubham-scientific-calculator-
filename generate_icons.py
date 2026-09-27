#!/usr/bin/env python3
import struct
import zlib
import os

def create_png(width, height, get_pixel_func):
    """
    Generate uncompressed RGBA PNG in pure Python
    """
    raw_data = bytearray()
    for y in range(height):
        raw_data.append(0)  # Filter type 0 (None)
        for x in range(width):
            r, g, b, a = get_pixel_func(x, y, width, height)
            raw_data.extend([r, g, b, a])
            
    # PNG signature
    png = b'\x89PNG\r\n\x1a\n'
    
    # IHDR chunk
    ihdr_data = struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)
    ihdr_crc = zlib.crc32(b'IHDR' + ihdr_data)
    png += struct.pack('>I', 13) + b'IHDR' + ihdr_data + struct.pack('>I', ihdr_crc)
    
    # IDAT chunk
    compressed = zlib.compress(bytes(raw_data), 9)
    idat_crc = zlib.crc32(b'IDAT' + compressed)
    png += struct.pack('>I', len(compressed)) + b'IDAT' + compressed + struct.pack('>I', idat_crc)
    
    # IEND chunk
    iend_crc = zlib.crc32(b'IEND')
    png += struct.pack('>I', 0) + b'IEND' + struct.pack('>I', iend_crc)
    
    return png

def calc_icon_pixel(x, y, w, h):
    # Normalized coordinates 0.0 to 1.0
    nx = x / float(w)
    ny = y / float(h)
    
    # Rounded rectangle mask with radius = 0.22
    r_corner = 0.22
    dx = max(0.0, max(r_corner - nx, nx - (1.0 - r_corner)))
    dy = max(0.0, max(r_corner - ny, ny - (1.0 - r_corner)))
    dist = (dx*dx + dy*dy)**0.5
    
    if dist > r_corner:
        return (0, 0, 0, 0) # Transparent outside squircle
        
    # Background gradient: sleek dark titanium (#0a0e14 to #18202c)
    bg_t = (nx + ny) * 0.5
    br = int(12 + bg_t * 18)
    bg = int(18 + bg_t * 22)
    bb = int(28 + bg_t * 30)
    
    # Subtle border bevel
    is_border = (nx < 0.02 or nx > 0.98 or ny < 0.02 or ny > 0.98 or dist > (r_corner - 0.02))
    if is_border:
        return (60, 80, 110, 255)
        
    # Top display glass section (LCD green/cyan screen: y: 0.12 to 0.38, x: 0.14 to 0.86)
    if 0.12 <= ny <= 0.38 and 0.14 <= nx <= 0.86:
        # LCD Screen Bevel
        if nx <= 0.15 or nx >= 0.85 or ny <= 0.13 or ny >= 0.37:
            return (35, 45, 40, 255)
        # LCD screen inner: classic Casio natural display (#dce7d5 greenish-gray)
        # Gradient on LCD screen
        scr_t = (nx + ny) * 0.5
        lr = int(220 + scr_t * 15)
        lg = int(235 + scr_t * 12)
        lb = int(215 + scr_t * 15)
        
        # Draw "fx" and mathematical formula on LCD
        # "fx" on left side of LCD (nx: 0.22 to 0.42, ny: 0.18 to 0.32)
        # Draw f (vertical stroke and bar)
        if 0.22 <= nx <= 0.24 and 0.18 <= ny <= 0.32:
            return (20, 35, 25, 255)
        if 0.20 <= nx <= 0.26 and 0.23 <= ny <= 0.25:
            return (20, 35, 25, 255)
        if 0.24 <= nx <= 0.27 and 0.18 <= ny <= 0.20:
            return (20, 35, 25, 255)
        # Draw x
        if 0.28 <= nx <= 0.34 and 0.23 <= ny <= 0.32:
            # Diagonal strokes of x
            rel_x = (nx - 0.28) / 0.06
            rel_y = (ny - 0.23) / 0.09
            if abs(rel_x - rel_y) < 0.22 or abs(rel_x - (1.0 - rel_y)) < 0.22:
                return (20, 35, 25, 255)
                
        # Draw fraction [ 3 / 2 ] on right side of LCD
        # Numerator 3
        if 0.55 <= nx <= 0.65 and 0.18 <= ny <= 0.24:
            if (ny <= 0.20 and 0.55 <= nx <= 0.65) or (0.21 <= ny <= 0.22 and 0.57 <= nx <= 0.65) or (0.62 <= nx <= 0.65) or (0.23 <= ny <= 0.24 and 0.55 <= nx <= 0.65):
                return (20, 35, 25, 255)
        # Fraction Bar
        if 0.52 <= nx <= 0.72 and 0.25 <= ny <= 0.26:
            return (20, 35, 25, 255)
        # Denominator 2
        if 0.55 <= nx <= 0.65 and 0.27 <= ny <= 0.33:
            if (ny <= 0.28 and 0.55 <= nx <= 0.65) or (nx >= 0.62 and 0.27 <= ny <= 0.30) or (0.29 <= ny <= 0.31 and 0.55 <= nx <= 0.65) or (nx <= 0.58 and 0.30 <= ny <= 0.33) or (ny >= 0.32 and 0.55 <= nx <= 0.65):
                return (20, 35, 25, 255)
                
        return (lr, lg, lb, 255)
        
    # Golden / Titanium Keypad Section (y: 0.44 to 0.88, 4x4 Grid of keys)
    # Check if inside any key in the grid
    if 0.44 <= ny <= 0.88 and 0.14 <= nx <= 0.86:
        col = int((nx - 0.14) / 0.18)
        row = int((ny - 0.44) / 0.11)
        if 0 <= col < 4 and 0 <= row < 4:
            k_left = 0.14 + col * 0.18 + 0.02
            k_right = k_left + 0.14
            k_top = 0.44 + row * 0.11 + 0.015
            k_bot = k_top + 0.08
            
            if k_left <= nx <= k_right and k_top <= ny <= k_bot:
                # Key border / shadow
                if nx <= k_left + 0.01 or nx >= k_right - 0.01 or ny >= k_bot - 0.01:
                    return (15, 20, 30, 255)
                if ny <= k_top + 0.01:
                    return (100, 120, 150, 255)
                    
                # Special Golden Accent Keys (top row: SHIFT / ALPHA / SOLVE / MODE)
                if row == 0:
                    if col == 0: # SHIFT - Golden Amber
                        return (220, 160, 40, 255)
                    elif col == 1: # ALPHA - Ruby Red
                        return (210, 60, 80, 255)
                    else: # Function keys - Dark Steel
                        return (45, 55, 70, 255)
                        
                # Operational Action Keys (Rightmost column: DEL, AC, =, etc.)
                if col == 3:
                    if row == 3: # '=' Key - Electric Cyan Accent
                        return (14, 165, 233, 255)
                    elif row == 1: # DEL key - Amber / Red
                        return (180, 50, 50, 255)
                    elif row == 2: # AC key - Amber
                        return (200, 70, 40, 255)
                        
                # Standard Digit / Math Keys - Clean Dark Slate (#2a3545)
                return (38, 48, 62, 255)

    # Default background
    return (br, bg, bb, 255)

def main():
    print("Generating crisp, high-resolution scientific calculator icons...")
    sizes = [
        (512, "public/pwa-512x512.png"),
        (192, "public/pwa-192x192.png"),
        (180, "public/apple-touch-icon.png"),
        (192, "public/icon-192.png"),
        (512, "public/icon.png"),
    ]
    
    for size, rel_path in sizes:
        print(f"Creating {rel_path} ({size}x{size})...")
        png_data = create_png(size, size, calc_icon_pixel)
        with open(rel_path, "wb") as f:
            f.write(png_data)
            
    print("All scientific calculator icons generated successfully!")

if __name__ == "__main__":
    main()
