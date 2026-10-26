#!/usr/bin/env python3
"""Pure‑Python PNG scaler – generates PWA icon set from the 1024×1024 logo.

The script reads an 8‑bit RGB(A) PNG, center‑crops to a square, then scales
with a simple box filter. It writes PNGs of the requested size.

Usage::
    python3 scale_png.py <src> <dst> <size>

Example::
    python3 scale_png.py src/assets/logo.png public/icon-512.png 512
"""
import sys, struct, zlib

def read_png(path):
    with open(path, "rb") as f:
        data = f.read()
    assert data[:8] == b"\x89PNG\r\n\x1a\n", "not a png"
    pos = 8
    width = height = bitdepth = colortype = None
    idat = bytearray()
    while pos < len(data):
        length = struct.unpack(">I", data[pos:pos+4])[0]
        ctype = data[pos+4:pos+8]
        chunk = data[pos+8:pos+8+length]
        if ctype == b"IHDR":
            width, height, bitdepth, colortype = struct.unpack(">IIBB", chunk[:10])
        elif ctype == b"IDAT":
            idat.extend(chunk)
        elif ctype == b"IEND":
            break
        pos += 12 + length
    raw = zlib.decompress(bytes(idat))
    channels = {0:1, 2:3, 3:1, 4:2, 6:4}[colortype]
    assert bitdepth == 8, "only 8‑bit supported"
    stride = width * channels
    rows = []
    prev = bytearray(stride)
    i = 0
    for _ in range(height):
        ft = raw[i]; i += 1
        line = bytearray(raw[i:i+stride]); i += stride
        # simple filters (Sub, Up, Average, Paeth)
        if ft == 1:
            for x in range(channels, stride):
                line[x] = (line[x] + line[x-channels]) & 0xFF
        elif ft == 2:
            for x in range(stride):
                line[x] = (line[x] + prev[x]) & 0xFF
        elif ft == 3:
            for x in range(stride):
                a = line[x-channels] if x >= channels else 0
                line[x] = (line[x] + ((a + prev[x]) >> 1)) & 0xFF
        elif ft == 4:
            for x in range(stride):
                a = line[x-channels] if x >= channels else 0
                b = prev[x]
                c = prev[x-channels] if x >= channels else 0
                p = a + b - c
                pa, pb, pc = abs(p-a), abs(p-b), abs(p-c)
                pr = a if (pa <= pb and pa <= pc) else (b if pb <= pc else c)
                line[x] = (line[x] + pr) & 0xFF
        rows.append(line)
        prev = line
    return width, height, channels, rows

def box_scale(width, height, channels, rows, out_w, out_h):
    out = []
    for y in range(out_h):
        src_y0 = y * height // out_h
        src_y1 = (y + 1) * height // out_h
        if src_y1 == src_y0:
            src_y1 = src_y0 + 1
        line = bytearray(out_w * channels)
        for x in range(out_w):
            src_x0 = x * width // out_w
            src_x1 = (x + 1) * width // out_w
            if src_x1 == src_x0:
                src_x1 = src_x0 + 1
            acc = [0] * channels
            cnt = 0
            for yy in range(src_y0, src_y1):
                row = rows[yy]
                for xx in range(src_x0, src_x1):
                    offset = xx * channels
                    for c in range(channels):
                        acc[c] += row[offset + c]
                    cnt += 1
            for c in range(channels):
                line[x * channels + c] = acc[c] // cnt
        out.append(line)
    return out_w, out_h, channels, out

def write_png(path, w, h, channels, rows):
    raw = bytearray()
    for line in rows:
        raw.append(0)
        raw.extend(line)
    comp = zlib.compress(bytes(raw), 9)
    def chunk(t, d):
        c = t + d
        return struct.pack('>I', len(d)) + c + struct.pack('>I', zlib.crc32(c) & 0xffffffff)
    with open(path, 'wb') as f:
        f.write(b'\x89PNG\r\n\x1a\n')
        f.write(chunk(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, channels, 0, 0, 0)))
        f.write(chunk(b'IDAT', comp))
        f.write(chunk(b'IEND', b''))

def square_crop_and_scale(src_path, dst_path, size):
    w, h, ch, rows = read_png(src_path)
    side = min(w, h)
    ox = (w - side)//2
    oy = (h - side)//2
    sq = [rows[y][ox*ch:(ox+side)*ch] for y in range(oy, oy+side)]
    nw, nh, nch, nrows = box_scale(side, side, ch, sq, size, size)
    write_png(dst_path, nw, nh, nch, nrows)
    print(f"Wrote {dst_path} ({nw}x{nh}, ch={nch})")

if __name__ == '__main__':
    if len(sys.argv) != 4:
        print('Usage: python3 scale_png.py <src> <dst> <size>')
        sys.exit(1)
    src, dst, sz = sys.argv[1], sys.argv[2], int(sys.argv[3])
    square_crop_and_scale(src, dst, sz)
