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

    # 2. Patch 16KB ELF alignment and re-sign with upload keystore
    python_cmd = sys.executable or "python"
    run_cmd(f'"{python_cmd}" "{patch_script}" "{aab_path}"', cwd=root_dir)

    print(f"\n==========================================")
    print(f"SUCCESS: 16 KB compliant AAB generated at:")
    print(f"{aab_path}")
    print(f"==========================================\n")

if __name__ == "__main__":
    main()
