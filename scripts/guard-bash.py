#!/usr/bin/env python3
"""Хук PreToolUse для Bash: не пропускает команды, которые правила проекта запрещают всегда.

Запреты из промптов агентов (committer, CLAUDE.md) здесь продублированы кодом: промпт модель
может забыть, хук — нет. Хук срабатывает и в субагентах.

Читает JSON хука со stdin, смотрит tool_input.command. Код выхода 2 блокирует вызов,
текст в stderr возвращается модели как причина. Всё остальное — 0, без вывода.

Проверка вручную:
  echo '{"tool_name":"Bash","tool_input":{"command":"git push --force"}}' | scripts/guard-bash.py
"""

import json
import re
import sys

# Команда ищется только в позиции команды: начало строки или после `;`, `&`, `|`, `(`.
# Иначе хук блокировал бы правку документа, в тексте которого упомянута запрещённая команда.
START = r"(?:^|[;&|(])[ \t]*"

# (регулярное выражение, что сказать модели)
RULES = [
    (
        START
        + r"git\b[^|;&\n]*\bpush\b[^|;&\n]*(\s--force\b|\s-f\b|\s--force-with-lease\b)",
        "принудительный push запрещён правилами проекта",
    ),
    (
        START + r"git\b[^|;&\n]*\bpush\b[^|;&\n]*(\s--delete\b|\s-d\b|\s:[\w/.-]+)",
        "удаление веток и тегов на сервере запрещено правилами проекта",
    ),
    (
        START + r"git\b[^|;&\n]*\breset\b[^|;&\n]*\s--hard\b",
        "git reset --hard запрещён: теряет чужие правки; спроси пользователя",
    ),
    (
        START + r"git\b[^|;&\n]*\bcommit\b[^|;&\n]*\s--no-verify\b",
        "обход хуков коммита запрещён: верни вывод хука пользователю",
    ),
    (
        START
        + r"git\b[^|;&\n]*\s-c\s*(?i:core\.hookspath|include\.path|includeif\.[^\s=]*\.path)\s*=",
        "подмена хуков git через -c core.hooksPath или include.path — тот же обход хуков, запрещено",
    ),
    # `git branch -d` удаляет только слитую ветку — разрешён по слову пользователя.
    # Принудительное удаление (-D, -d -f, --force) теряет несмёрженные коммиты.
    (
        START
        + r"git\b[^|;&\n]*\bbranch\b[^|;&\n]*(\s-[a-zA-Z]*D|\s--force\b|\s-[a-zA-Z]*f)",
        "принудительное удаление или перезапись ветки — только руками; слитую ветку удаляет git branch -d",
    ),
    (
        START + r"git\b[^|;&\n]*\btag\b[^|;&\n]*\s-d\b",
        "удаление тегов — только по слову пользователя, руками",
    ),
    (
        START + r"git\b[^|;&\n]*\bclean\b[^|;&\n]*\s-[a-zA-Z]*f",
        "git clean -f удаляет неотслеживаемые файлы; спроси пользователя",
    ),
    (
        START + r"docker\s+stack\s+(deploy|rm)\b",
        "docker stack deploy/rm — действие на проде, только по отдельному согласию пользователя",
    ),
]


def main():
    try:
        data = json.load(sys.stdin)
    except ValueError:
        return 0
    if data.get("tool_name") != "Bash":
        return 0
    command = (data.get("tool_input") or {}).get("command") or ""
    for pattern, reason in RULES:
        if re.search(pattern, command, re.MULTILINE):
            print(f"Команда заблокирована хуком guard-bash: {reason}.", file=sys.stderr)
            return 2
    return 0


if __name__ == "__main__":
    sys.exit(main())
