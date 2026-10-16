import subprocess
import os
import sys
import shutil

def run_cmd(cmd, cwd=None):
    print(f"Executing: {cmd}")
    res = subprocess.run(cmd, shell=True, cwd=cwd)
    if res.returncode != 0:
        print(f"Command failed with code {res.returncode}")
        sys.exit(res.returncode)

def main():
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    android_dir = os.path.join(root_dir, "android")
    aab_path = os.path.join(android_dir, r"app\build\outputs\bundle\release\app-release.aab")
    patch_script = os.path.join(root_dir, "scripts", "patch_and_resign_aab.py")

    # 1. Gradle bundleRelease
    print("Building Android release bundle via Gradle...")
    gradle_cmd = r".\gradlew.bat bundleRelease --no-daemon" if os.name == 'nt' else "./gradlew bundleRelease --no-daemon"
    run_cmd(gradle_cmd, cwd=android_dir)

    # 2. Patch AAB for 16 KB page size compliance and re-sign with upload-key.jks
    print("\nEnsuring 16 KB ELF page size compliance and verifying AAB...")
    run_cmd(f'python "{patch_script}" "{aab_path}"', cwd=root_dir)

    # 3. Copy to root app-release.aab
    root_aab = os.path.join(root_dir, "app-release.aab")
    try:
        shutil.copyfile(aab_path, root_aab)
        print(f"Copied AAB to root: {root_aab}")
    except Exception as e:
        print(f"Warning: could not copy to root: {e}")

    print(f"\n==========================================")
    print(f"SUCCESS: 16 KB Compliant Release AAB generated at:")
    print(f"  {aab_path}")
    print(f"  {root_aab}")
    print(f"==========================================\n")

if __name__ == "__main__":
    main()
