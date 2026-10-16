#!/usr/bin/env python3
"""
Patch ELF PT_LOAD p_align from 4KB (0x1000) to 16KB (0x4000) for all .so files
in the given directories. Required for Google Play's 16KB page size enforcement
on apps targeting API 35+. Safe to run on already-aligned files (no-op).
"""
import struct
import os
import sys

PT_LOAD = 1

def patch_file(path):
    try:
        with open(path, 'rb') as f:
            data = bytearray(f.read())
    except Exception as e:
        print(f"  [16KB] Error reading {path}: {e}")
        return False

    if len(data) < 64 or data[:4] != b'\x7fELF':
        return False

    cls = data[4]       # 1 = 32-bit, 2 = 64-bit
    endian = '<' if data[5] == 1 else '>'
    patched = False

    if cls == 2:  # 64-bit (arm64-v8a, x86_64)
        phoff = struct.unpack_from(endian + 'Q', data, 32)[0]
        phesz = struct.unpack_from(endian + 'H', data, 54)[0]
        phn   = struct.unpack_from(endian + 'H', data, 56)[0]
        for i in range(phn):
            ph = phoff + i * phesz
            if ph + 56 > len(data):
                break
            if struct.unpack_from(endian + 'I', data, ph)[0] == PT_LOAD:
                o = ph + 48
                align = struct.unpack_from(endian + 'Q', data, o)[0]
                if align < 0x4000:
                    struct.pack_into(endian + 'Q', data, o, 0x4000)
                    patched = True
    elif cls == 1:  # 32-bit (armeabi-v7a, x86)
        phoff = struct.unpack_from(endian + 'I', data, 28)[0]
        phesz = struct.unpack_from(endian + 'H', data, 42)[0]
        phn   = struct.unpack_from(endian + 'H', data, 44)[0]
        for i in range(phn):
            ph = phoff + i * phesz
            if ph + 32 > len(data):
                break
            if struct.unpack_from(endian + 'I', data, ph)[0] == PT_LOAD:
                o = ph + 28
                align = struct.unpack_from(endian + 'I', data, o)[0]
                if align < 0x4000:
                    struct.pack_into(endian + 'I', data, o, 0x4000)
                    patched = True

    if patched:
        try:
            with open(path, 'wb') as f:
                f.write(data)
            print(f'  [16KB] Aligned {os.path.basename(path)} to 16KB (0x4000)')
            return True
        except Exception as e:
            print(f"  [16KB] Error writing {path}: {e}")
            return False

    return False

def patch_dir(directory):
    count = 0
    for root, dirs, files in os.walk(directory):
        for fname in files:
            if fname.endswith('.so'):
                if patch_file(os.path.join(root, fname)):
                    count += 1
    return count

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: patch_elf_16kb.py <lib_dir1> [lib_dir2 ...]")
        sys.exit(1)
    for lib_dir in sys.argv[1:]:
        if os.path.exists(lib_dir):
            print(f'[16KB] Scanning directory: {lib_dir}')
            c = patch_dir(lib_dir)
            print(f'[16KB] Successfully processed {lib_dir} ({c} patched to 16KB)')
        else:
            print(f'[16KB] Directory not found (skipped): {lib_dir}')
    print('[16KB] Done.')
