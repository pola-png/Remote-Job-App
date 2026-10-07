@echo off
set "PATH=%LOCALAPPDATA%\Android\Sdk\platform-tools;%PATH%"
echo [REMOTE JOBS] Starting Metro Bundler for Connected Android Device...
npx expo start
