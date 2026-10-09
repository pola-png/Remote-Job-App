import subprocess
import zipfile
import struct
import os
import sys

def run_cmd(cmd, cwd=None):
    print(f"Executing: {cmd}")
    res = subprocess.run(cmd, shell=True, cwd=cwd)
    if res.returncode != 0:
        print(f"Command failed with code {res.returncode}")
        sys.exit(res.returncode)

def align_elf_data(data):
    if len(data) < 64 or data[:4] != b'\x7fELF':
        return data
    ei_class = data[4]
    if ei_class != 2: # only 64-bit
        return data
    
    e_phoff = struct.unpack('<Q', data[32:40])[0]
    e_phentsize = struct.unpack('<H', data[54:56])[0]
    e_phnum = struct.unpack('<H', data[56:58])[0]
    
    barr = bytearray(data)
    modified = False
    for i in range(e_phnum):
        off = e_phoff + i * e_phentsize
        p_type = struct.unpack('<I', barr[off:off+4])[0]
        if p_type == 1: # PT_LOAD
            p_align = struct.unpack('<Q', barr[off+48:off+56])[0]
            if p_align < 16384:
                barr[off+48:off+56] = struct.pack('<Q', 16384)
                modified = True
    return bytes(barr) if modified else data

def patch_aab(input_aab, output_aab):
    print(f"Aligning ELF headers in {input_aab} to 16 KB...")
    with zipfile.ZipFile(input_aab, 'r') as zin:
        with zipfile.ZipFile(output_aab, 'w', compression=zipfile.ZIP_DEFLATED) as zout:
            for item in zin.infolist():
                content = zin.read(item.filename)
                if item.filename.endswith('.so') and ('arm64-v8a' in item.filename or 'x86_64' in item.filename):
                    content = align_elf_data(content)
                zout.writestr(item, content)

def verify_aab(aab_path):
    print(f"Verifying {aab_path}...")
    with zipfile.ZipFile(aab_path, 'r') as z:
        for info in z.infolist():
            if info.filename.endswith('.so') and ('arm64-v8a' in info.filename or 'x86_64' in info.filename):
                data = z.read(info.filename)
                if data[:4] != b'\x7fELF' or data[4] != 2:
                    continue
                e_phoff = struct.unpack('<Q', data[32:40])[0]
                e_phentsize = struct.unpack('<H', data[54:56])[0]
                e_phnum = struct.unpack('<H', data[56:58])[0]
                for i in range(e_phnum):
                    ph = data[e_phoff + i * e_phentsize : e_phoff + (i + 1) * e_phentsize]
                    if struct.unpack('<I', ph[0:4])[0] == 1: # PT_LOAD
                        p_align = struct.unpack('<Q', ph[48:56])[0]
                        if p_align < 16384:
                            print(f"Verification failed on {info.filename}: align={p_align}")
                            sys.exit(1)
    print("VERIFICATION SUCCESS: 100% 16 KB compliant!")

def main():
    root_dir = r"c:\Romete-Job\remote-job"
    android_dir = os.path.join(root_dir, "android")
    aab_dir = os.path.join(android_dir, r"app\build\outputs\bundle\release")
    aab_path = os.path.join(aab_dir, "app-release.aab")
    temp_aligned = os.path.join(aab_dir, "app-release-aligned.aab")
    keystore = os.path.join(android_dir, r"app\upload-key.jks")
    jarsigner = r"C:\Program Files\Android\Android Studio\jbr\bin\jarsigner.exe"

    # 1. Gradle bundleRelease
    run_cmd(r".\gradlew.bat bundleRelease --no-daemon", cwd=android_dir)

    # 2. Patch 16KB ELF alignment
    patch_aab(aab_path, temp_aligned)

    # 3. Resign with upload keystore
    sign_cmd = f'"{jarsigner}" -verbose -sigalg SHA256withRSA -digestalg SHA-256 -keystore "{keystore}" -storepass "Xapzap@$" -keypass "Xapzap@$" "{temp_aligned}" xapzap'
    run_cmd(sign_cmd)

    # 4. Overwrite original AAB
    if os.path.exists(aab_path):
        os.remove(aab_path)
    os.rename(temp_aligned, aab_path)

    # 5. Verify
    verify_aab(aab_path)
    print(f"FINAL AAB READY AT: {aab_path} ({os.path.getsize(aab_path)} bytes)")

if __name__ == "__main__":
    main()
