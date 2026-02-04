# Настройка SSH для GitHub Actions

## Проблема

GitHub Actions не может подключиться к серверу через SSH. Есть два варианта решения:

## Вариант 1: Использование SSH ключа (рекомендуется)

### Шаг 1: Генерация SSH ключа

На вашей локальной машине выполните:

```bash
ssh-keygen -t rsa -b 4096 -C "github-actions-deploy" -f ~/.ssh/github_actions_deploy
```

**Важно:** Не используйте пароль для ключа (просто нажмите Enter).

### Шаг 2: Копирование публичного ключа на сервер

```bash
ssh-copy-id -i ~/.ssh/github_actions_deploy.pub root@85.239.47.11
# Введите пароль: uN9?9^Ke.6jdeM
```

Или вручную:

```bash
cat ~/.ssh/github_actions_deploy.pub
# Скопируйте вывод и выполните на сервере:
ssh root@85.239.47.11
mkdir -p ~/.ssh
echo "ВАШ_ПУБЛИЧНЫЙ_КЛЮЧ" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh
```

### Шаг 3: Добавление приватного ключа в GitHub Secrets

1. Откройте ваш репозиторий на GitHub
2. Перейдите в **Settings** → **Secrets and variables** → **Actions**
3. Нажмите **New repository secret**
4. Имя: `SSH_PRIVATE_KEY`
5. Значение: скопируйте содержимое приватного ключа:

```bash
cat ~/.ssh/github_actions_deploy
```

**Важно:** Скопируйте весь ключ, включая строки:
```
-----BEGIN OPENSSH PRIVATE KEY-----
...
-----END OPENSSH PRIVATE KEY-----
```

Или для старых форматов:
```
-----BEGIN RSA PRIVATE KEY-----
...
-----END RSA PRIVATE KEY-----
```

### Шаг 4: Проверка подключения

```bash
ssh -i ~/.ssh/github_actions_deploy root@85.239.47.11
```

Если подключение успешно, ключ настроен правильно.

## Вариант 2: Использование пароля (проще, но менее безопасно)

Если у вас проблемы с SSH ключом, можно использовать пароль напрямую:

1. Откройте ваш репозиторий на GitHub
2. Перейдите в **Settings** → **Secrets and variables** → **Actions**
3. Нажмите **New repository secret**
4. Имя: `SSH_PASSWORD`
5. Значение: `uN9?9^Ke.6jdeM`

**Важно:** Этот метод менее безопасен, но проще для начала. Рекомендуется перейти на SSH ключи позже.

## Проверка формата SSH ключа

Если вы получаете ошибку "error in libcrypto", проверьте формат ключа:

```bash
# Проверка формата ключа
ssh-keygen -l -f ~/.ssh/id_rsa

# Если ключ в старом формате, конвертируйте в новый:
ssh-keygen -p -m PEM -f ~/.ssh/id_rsa
```

## Устранение проблем

### Ошибка "Permission denied"

1. Проверьте права на файл ключа на сервере:
   ```bash
   ssh root@85.239.47.11
   ls -la ~/.ssh/
   chmod 600 ~/.ssh/authorized_keys
   chmod 700 ~/.ssh
   ```

2. Проверьте, что публичный ключ добавлен в `~/.ssh/authorized_keys`:
   ```bash
   cat ~/.ssh/authorized_keys
   ```

3. Проверьте настройки SSH на сервере:
   ```bash
   cat /etc/ssh/sshd_config | grep -E "PubkeyAuthentication|PasswordAuthentication"
   ```

### Ошибка "error in libcrypto"

Эта ошибка обычно означает неправильный формат ключа. Убедитесь, что:
- Ключ сохранен полностью (все строки, включая BEGIN/END)
- Нет лишних пробелов в начале/конце
- Используется правильный формат (OpenSSH или PEM)

## Безопасность

После настройки SSH ключа рекомендуется:

1. Отключить вход по паролю на сервере (опционально):
   ```bash
   # На сервере
   nano /etc/ssh/sshd_config
   # Измените: PasswordAuthentication no
   systemctl restart sshd
   ```

2. Использовать не-root пользователя для деплоя (опционально):
   - Создайте отдельного пользователя
   - Настройте sudo без пароля для необходимых команд
   - Обновите `SERVER_USER` в workflow

## Тестирование

После настройки, запустите workflow вручную:
1. Перейдите в **Actions** → **Deploy to Production**
2. Нажмите **Run workflow**
3. Проверьте логи выполнения
