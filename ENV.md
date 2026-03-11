# Настройка окружения

## Режимы работы

### Development (локальная разработка)
При запуске `npm run dev` автоматически используется `.env.development`:
```
VITE_API_URL=http://localhost:3000
VITE_WS_URL=http://localhost:3000
```

### Production (сервер)
При запуске `npm run build` или `npm run build:prod` используется `.env.production`:
```
VITE_API_URL=https://168.222.194.152/api
VITE_WS_URL=https://168.222.194.152
```

## Команды сборки

- `npm run dev` - запуск сервера разработки (localhost)
- `npm run build:dev` - сборка для development окружения
- `npm run build:prod` - сборка для production окружения (сервер)
- `npm run build` - сборка для production окружения (сервер, по умолчанию)
- `npm run preview` - предпросмотр production сборки

## Файлы окружения

- `.env` - локальные настройки (не коммитится)
- `.env.development` - настройки для разработки (не коммитится)
- `.env.production` - настройки для продакшена (не коммитится)
- `.env.example` - пример настроек (можно коммитить)
