#!/usr/bin/env python3
"""Хук PostToolUse для Edit и Write: проверяет только что изменённый файл.

Перенесено из finsight-workspace и упрощено под этот репозиторий. Новых зависимостей нет:
acorn и sass уже стоят в node_modules как зависимости webpack.

  .js          разбор acorn'ом (ES-модуль, иначе скрипт); в src/js ещё поиск console.log
  .scss        сборка src/scss/main.scss через sass — ловит и ошибку в частичном файле
  .json        json.loads
  .py          py_compile

Код выхода 2 возвращает модели текст из stderr как замечание к правке; 0 — молча.
Правки через Bash (sed, heredoc) хук не видит: он смотрит только tool_input.file_path.

Проверка вручную:
  echo '{"tool_name":"Edit","tool_input":{"file_path":"src/js/index.js"}}' | scripts/check-edit.py
"""

import json
import os
import re
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
NODE_BIN = os.path.join(ROOT, "node_modules", ".bin")
SKIP_DIRS = ("/node_modules/", "/dist/", "/.git/", "/originals/", "/.claude/scratch/")
TIMEOUT = 30

PARSE_JS = """
const fs = require("fs"), acorn = require("acorn");
const file = process.argv[1], src = fs.readFileSync(file, "utf8");
const opts = { ecmaVersion: "latest", locations: true };
try { acorn.parse(src, { ...opts, sourceType: "module" }); }
catch (e) {
  try { acorn.parse(src, { ...opts, sourceType: "script", allowReturnOutsideFunction: true }); }
  catch { console.error(`${file}: ${e.message}`); process.exit(1); }
}
"""


def run(cmd):
    """Код возврата и вывод одной строкой; cwd — корень репозитория."""
    try:
        p = subprocess.run(
            cmd, check=False, capture_output=True, text=True, timeout=TIMEOUT, cwd=ROOT
        )
    except (OSError, subprocess.TimeoutExpired) as e:
        return 1, f"не удалось запустить {cmd[0]}: {e}"
    return p.returncode, (p.stdout + p.stderr).strip()


def check_js(path):
    problems = []
    code, out = run(["node", "-e", PARSE_JS, path])
    if code != 0:
        problems.append(out or "JS не разбирается")
    if f"{os.sep}src{os.sep}js{os.sep}" in path:
        with open(path, encoding="utf-8", errors="replace") as f:
            hits = [str(i) for i, line in enumerate(f, 1) if re.search(r"\bconsole\.log\(", line)]
        if hits:
            problems.append(
                "console.log в строках " + ", ".join(hits) + " — отладочный вывод в сайте не оставлять"
            )
    return problems


def check_scss(path):
    sass = os.path.join(NODE_BIN, "sass")
    if not os.path.exists(sass):
        return ["sass не найден: npm install"]
    code, out = run([sass, "--no-source-map", "src/scss/main.scss", os.devnull])
    return [] if code == 0 else [out or "SCSS не собирается"]


def check_json(path):
    if "/.vscode/" in path:  # JSONC с комментариями
        return []
    try:
        with open(path, encoding="utf-8") as f:
            json.load(f)
    except (ValueError, OSError) as e:
        return [f"JSON не разбирается: {e}"]
    return []


def check_python(path):
    code, out = run([sys.executable, "-I", "-m", "py_compile", path])
    return [] if code == 0 else [out or "ошибка синтаксиса"]


CHECKS = {".js": check_js, ".scss": check_scss, ".json": check_json, ".py": check_python}


def main():
    try:
        data = json.load(sys.stdin)
    except ValueError:
        return 0
    if data.get("tool_name") not in ("Edit", "Write", "MultiEdit"):
        return 0
    path = (data.get("tool_input") or {}).get("file_path") or ""
    if path and not os.path.isabs(path):
        path = os.path.join(ROOT, path)
    if not path or not os.path.isfile(path) or any(s in path for s in SKIP_DIRS):
        return 0
    # только файлы этого репозитория, по настоящему пути
    if not os.path.realpath(path).startswith(ROOT + os.sep):
        return 0
    check = CHECKS.get(os.path.splitext(path)[1])
    if not check:
        return 0
    problems = check(path)
    if not problems:
        return 0
    print(f"Проверка после правки {os.path.relpath(path, ROOT)}:\n" + "\n".join(problems), file=sys.stderr)
    return 2


if __name__ == "__main__":
    sys.exit(main())
