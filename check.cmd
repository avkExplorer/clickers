@echo off
rem Local check for a static site: the page and link check from the Wall, then a build of the image (nothing is pushed).
setlocal
cd /d "%~dp0"
python ..\wall\tools\static_check.py . || exit /b 1
docker build -q -t clickers-check . || exit /b 1
echo ok: pages parse, links resolve, the image builds
