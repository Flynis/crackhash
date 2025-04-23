# crackhash

Распределенная система для взлома MD-5 хэша.

![Архитектура системы](/assets/arch.png)

## API

Интрефейс системы описан в файле `manager/api.yaml`.

Пример запроса на взлом хэша:

```bash
curl --location 'localhost:8000/api/hash/crack' \
--header 'Content-Type: application/json' \
--data '{
  "hash": "ab56b4d92b40713acc5af89985d4b786",
  "maxLength": 5
}'
```

В ответ получим ID, который сможем использовать для отслеживая прогресса выполнения запроса.

Пример запроса статуса взлома:

```bash
curl --location 'localhost:8000/api/hash/status?requestId=YOUR_REQUEST_ID'
```

## Сборка и запуск

Чтобы собрать нужно выполнить:

```bash
docker compose build
```

Чтобы запустить:

```bash
docker compose up
```

После запуска система ожидает запросы на 8000 порту (можно изменить в корневом `.env`).

## Конфигурация

Количество воркеров можно изменить в корневом `.env` файле. Изменить параметры менеджера и воркеров можно в файлах `manager/.env` и `worker/.env` соответственно.
