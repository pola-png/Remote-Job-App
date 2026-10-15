import subprocess
import os
import sys

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

    # 2. Copy to root app-release.aab
    root_aab = os.path.join(root_dir, "app-release.aab")
    try:
        import shutil
        shutil.copyfile(aab_path, root_aab)
        print(f"Copied AAB to root: {root_aab}")
    except Exception as e:
        print(f"Warning: could not copy to root: {e}")

    print(f"\n==========================================")
    print(f"SUCCESS: Release AAB (versionCode 61) generated at:")
    print(f"{aab_path}")
    print(f"Root path: {root_aab}")
    print(f"==========================================\n")

if __name__ == "__main__":
    main()
