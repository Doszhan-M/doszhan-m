
# Фан блог

## Инструкции по запуску приложения:

### 1. Установить Redis:
```bash
sudo apt-get update
sudo apt-get install redis
redis-server
```

### Установить необходимые пакеты:
```bash
pip3 install -r requirements.txt
```

### Настроить почтовый сервер:
В директории `ad_board/secret` Создать 4 текстовых файла с названием:

- **ADMINS.txt**  
  почта администраторов в виде кортежа:  
  `('John', 'john@example.com'), ('Mary', 'mary@example.com')`

- **EMAIL_HOST.txt**  
  smtp сервер почты

- **EMAIL_HOST_PASSWORD.txt**  
  пароль от почтового ящика

- **EMAIL_HOST_USER.txt**  
  логин от почтового ящика

### Запустить сервер:
```bash
python3 manage.py migrate
python3 manage.py runserver
```

### Запустить celery:
```bash
celery -A slackbot worker -l INFO -B
```