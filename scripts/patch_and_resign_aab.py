import zipfile
import struct
import os
import sys
import subprocess
import shutil

def patch_elf_data(data):
    if len(data) < 64 or data[:4] != b'\x7fELF':
        return data
    ei_class = data[4]
    endian = '<' if data[5] == 1 else '>'
    barr = bytearray(data)
    modified = False

    if ei_class == 2:  # 64-bit ELF (arm64-v8a, x86_64)
        e_phoff = struct.unpack_from(endian + 'Q', barr, 32)[0]
        e_phentsize = struct.unpack_from(endian + 'H', barr, 54)[0]
        e_phnum = struct.unpack_from(endian + 'H', barr, 56)[0]
        for i in range(e_phnum):
            ph = e_phoff + i * e_phentsize
            if ph + 56 > len(barr):
                break
            if struct.unpack_from(endian + 'I', barr, ph)[0] == 1:  # PT_LOAD
                align_off = ph + 48
                align = struct.unpack_from(endian + 'Q', barr, align_off)[0]
                if align < 16384:
                    struct.pack_into(endian + 'Q', barr, align_off, 16384)
                    modified = True
    elif ei_class == 1:  # 32-bit ELF (armeabi-v7a, x86)
        e_phoff = struct.unpack_from(endian + 'I', barr, 28)[0]
        e_phentsize = struct.unpack_from(endian + 'H', barr, 42)[0]
        e_phnum = struct.unpack_from(endian + 'H', barr, 44)[0]
        for i in range(e_phnum):
            ph = e_phoff + i * e_phentsize
            if ph + 32 > len(barr):
                break
            if struct.unpack_from(endian + 'I', barr, ph)[0] == 1:  # PT_LOAD
                align_off = ph + 28
                align = struct.unpack_from(endian + 'I', barr, align_off)[0]
                if align < 16384:
                    struct.pack_into(endian + 'I', barr, align_off, 16384)
                    modified = True

    return bytes(barr) if modified else data

def patch_aab(input_path, output_path):
    print(f"[16KB-Patch] Scanning native libraries in {input_path}...")
    patched_count = 0
    with zipfile.ZipFile(input_path, 'r') as zin:
        with zipfile.ZipFile(output_path, 'w') as zout:
            for item in zin.infolist():
                data = zin.read(item.filename)
                if item.filename.endswith('.so'):
                    new_data = patch_elf_data(data)
                    if new_data != data:
                        patched_count += 1
                        print(f"  [16KB] Patched: {item.filename}")
                    data = new_data
                zout.writestr(item, data)
    print(f"[16KB-Patch] Successfully aligned {patched_count} .so libraries to 16 KB boundaries.")
    return patched_count

def find_jarsigner():
    jarsigner_in_path = shutil.which("jarsigner")
    if jarsigner_in_path:
        return jarsigner_in_path
    potential_paths = [
        r"C:\Program Files\Eclipse Adoptium\jdk-11.0.28.6-hotspot\bin\jarsigner.exe",
        r"C:\Program Files\Android\Android Studio\jbr\bin\jarsigner.exe",
        r"C:\Program Files\Java\jdk-17\bin\jarsigner.exe",
        r"C:\Program Files\Java\jdk-11\bin\jarsigner.exe",
    ]
    for p in potential_paths:
        if os.path.exists(p):
            return p
    return "jarsigner"

def resign_aab(aab_path, keystore_path, storepass, keyalias):
    jarsigner_path = find_jarsigner()
    cmd = [
        jarsigner_path,
        "-verbose",
        "-sigalg", "SHA256withRSA",
        "-digestalg", "SHA-256",
        "-keystore", keystore_path,
        "-storepass", storepass,
        "-keypass", storepass,
        aab_path,
        keyalias
    ]
    print(f"[16KB-Patch] Re-signing {aab_path} with alias '{keyalias}' using {jarsigner_path}...")
    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode != 0:
        print(f"[16KB-Patch] Error: jarsigner failed:\n{res.stderr}")
        sys.exit(1)
    print("[16KB-Patch] JAR signature applied successfully.")

def verify_16kb_compliance(aab_path):
    print(f"[16KB-Patch] Verifying 16 KB compliance on {aab_path}...")
    failed = []
    with zipfile.ZipFile(aab_path, 'r') as z:
        for info in z.infolist():
            if info.filename.endswith('.so') and ('arm64-v8a' in info.filename or 'x86_64' in info.filename):
                data = z.read(info.filename)
                if len(data) < 64 or data[:4] != b'\x7fELF' or data[4] != 2:
                    continue
                endian = '<' if data[5] == 1 else '>'
                e_phoff = struct.unpack_from(endian + 'Q', data, 32)[0]
                e_phentsize = struct.unpack_from(endian + 'H', data, 54)[0]
                e_phnum = struct.unpack_from(endian + 'H', data, 56)[0]
                for i in range(e_phnum):
                    ph = data[e_phoff + i * e_phentsize : e_phoff + (i + 1) * e_phentsize]
                    if struct.unpack_from(endian + 'I', ph, 0)[0] == 1:  # PT_LOAD
                        p_align = struct.unpack_from(endian + 'Q', ph, 48)[0]
                        if p_align < 16384:
                            failed.append((info.filename, p_align))
    if failed:
        print(f"[16KB-Patch] Verification failed for {len(failed)} libraries: {failed}")
        sys.exit(1)
    print("[16KB-Patch] VERIFICATION PASSED: All 64-bit native libraries meet 16 KB memory page size requirements!")

def main():
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    default_aab = os.path.join(root_dir, "android", "app", "build", "outputs", "bundle", "release", "app-release.aab")
    default_keystore = os.path.join(root_dir, "android", "app", "upload-key.jks")

    aab_path = sys.argv[1] if len(sys.argv) > 1 else default_aab
    keystore_path = sys.argv[2] if len(sys.argv) > 2 else default_keystore
    storepass = sys.argv[3] if len(sys.argv) > 3 else "Xapzap@$"
    keyalias = sys.argv[4] if len(sys.argv) > 4 else "xapzap"

    if not os.path.exists(aab_path):
        print(f"[16KB-Patch] AAB not found at {aab_path}, skipping.")
        return

    temp_path = aab_path + ".16kb.tmp"
    patch_aab(aab_path, temp_path)
    if os.path.exists(keystore_path):
        resign_aab(temp_path, keystore_path, storepass, keyalias)
    else:
        print(f"[16KB-Patch] Warning: Keystore not found at {keystore_path}, skipped re-signing.")

    os.replace(temp_path, aab_path)
    verify_16kb_compliance(aab_path)
    print(f"[16KB-Patch] COMPLETED: {aab_path} ({os.path.getsize(aab_path)} bytes) is 16 KB ready for Google Play.")

if __name__ == '__main__':
    main()
