# Мідгард — археологічне медіа

Сайт на Next.js 16 + Payload CMS 3 + Postgres. Адмінка: `/admin`.
ТЗ: `docs/TZ-1.1.md`. Дизайн-система: `docs/DESIGN.md`.

## Змінні середовища

| Змінна | Для чого |
| --- | --- |
| `DATABASE_URL` | Postgres |
| `PAYLOAD_SECRET` | секрет сесій адмінки (довгий випадковий рядок) |
| `SERVER_URL` | повна адреса сайту, напр. `https://midgard.set.in.ua` |
| `S3_BUCKET`, `S3_ENDPOINT`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` | сховище фото (Railway Bucket або будь-яке S3) |
| `SITE_PASSWORD`, `SITE_USER` | тестовий етап: сайт закритий паролем (basic auth) |
| `SITE_NOINDEX=1` | тестовий етап: заборона індексації |
| `RESEND_API_KEY`, `EMAIL_FROM` | листи з адмінки (скидання пароля) |

## Локально

```bash
npm ci
cp .env.example .env   # заповнити
npx payload migrate
npm run dev
```

Міграції бази в продакшені застосовуються автоматично під час старту.
Після зміни колекцій: `npx payload migrate:create <назва>`.

## Тестовий вміст

`npx payload run src/seed/demo.ts` — створює тестові матеріали (тег «тест»).
`npx payload run src/seed/demo.ts --remove` — видаляє їх. Перед запуском сайту — обов'язково видалити.

## Деплой

Railway, збірка з `Dockerfile`, автодеплой з гілки `main`.
