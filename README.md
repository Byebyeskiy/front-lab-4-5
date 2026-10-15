# FlowTask — ЛР №4–5: Web Quality Audit

Виправлений **офіційний starter**, без зміни візуальної концепції та без framework/bundler. Сторінки — звичайні HTML/CSS/JS; npm-пакети потрібні для аудиту й тестів.

## Відкрити у Visual Studio Code

Відкрийте цю теку через **File → Open Folder**. У Terminal:

```bash
npm ci
npm start
```

Запуск статичного сервера — порт 8000. VS Code → Terminal → Run Task: **FlowTask: start**, **FlowTask: test**, **FlowTask: prepare static site**. Для F5 є Chrome launch configuration (спочатку запустіть сервер). На локальному комп'ютері потрібні Node.js ≥22 та Chrome/Chromium. Python більше не потрібний для звичайного запуску.

## Перевірки

```bash
# Linux cloud: Chromium уже встановлений у /usr/bin/chromium
npm test
npm run audit:browser
# На іншій машині задайте CHROME_PATH шляхом до свого Chrome/Chromium.
# Обов'язкова публічна перевірка після деплою:
AUDIT_URL=https://YOUR-PROJECT.vercel.app/ npm run audit:lighthouse
```

Остання команда виконує 3 Mobile/Slow 4G Lighthouse запуски; перед використанням збережіть локальні докази окремо — runner перезаписує `audit/evidence/after/lighthouse-*`. Для before: `AUDIT_URL=... node tools/lighthouse.mjs before`. Потрібно міряти той самий URL, той самий preset і браузер до/після; GUI incognito та headless CLI слід описувати як різні умови, не змішувати їх результати.

15 функціональних перевірок: axe обох сторінок, метадані, локальні посилання/ресурси, keyboard/focus, CTA Space, FAQ Enter/Space, помилки/валідність форми, відповідність JSON-LD видимій ціні, robots/sitemap, responsive 320–1440px, runtime exceptions. Вони не засвідчують повну WCAG AA.

## Звіт і докази

- **REPORT.pdf** — друкований звіт; **REPORT.html** — самодостатній HTML із вбудованими скріншотами.
- **REPORT.md** — редаговане джерело звіту, теорія, AI-аудит, перевірка рекомендацій, таблиця до/після та кроки після деплою.
- **EMAIL.md** — шаблон листа з точною темою за завданням, URL та полями ПІБ/групи/Vercel.
- **audit/AI-AUDIT.md** — початкові рекомендації, зафіксовані до виправлень.
- **audit/evidence/** — фактичні Lighthouse JSON/HTML, axe, AX Trees, скріншоти та CPU profiles.

Локальні медіани: Lighthouse Performance **70 → 99**, Accessibility **79 → 100**, SEO **50 → 100**, LCP **15,378 → 1,954 с**, CLS **0,130062 → 0,000486**. Це не публічні Vercel-виміри й не польові Core Web Vitals. `npm test`: **15 пройдених перевірок**.

Після редагування звіту: `node tools/render-report.mjs`. Додаткові скріншоти/trace: `node tools/capture-evidence.mjs` при працюючому сервері. Не переписуйте первинні докази новими даними без збереження копії.

## Статична публікація

```bash
npm run prepare:site
```

`artifacts/site` містить лише HTML/CSS/JS, assets, robots/sitemap і .nojekyll. Це копіювання, не bundling. Звіти, node_modules, тести й початковий невикористаний JPEG не публікуються.

**GitHub Pages:** після push на `main`, Settings → Pages → Source **GitHub Actions**. Надано `.github/workflows/pages.yml`. Запланована адреса: https://byebyeskiy.github.io/front-lab-4-5/ . У цій сесії push/активацію Pages не виконано.

**Vercel:** користувач налаштовує самостійно. Import Git Repository → Other, Root Directory — корінь. Наданий `vercel.json` встановлює `npm ci`, Build Command `npm run prepare:site`, Output Directory `artifacts/site`. Framework не потрібний. Після публікації перевірити `/robots.txt` саме в корені Vercel origin та обидві сторінки. Додати URL у EMAIL.md/REPORT.md.

**Відтворення starter для публічного «до»:** `node tools/prepare-site.mjs --baseline` експортує `ca4a46f` без reset і без зміни вихідних файлів. Тимчасово використайте цю команду як Vercel Build Command для первинного production-аудиту; потім поверніть `npm run prepare:site` і повторіть на тій самій production URL. Повна послідовність у REPORT.md, розділ 8.

Canonical site на обох хостингах: `https://byebyeskiy.github.io/front-lab-4-5/`. Canonical та og:url узгоджені, sitemap містить обидві Pages-сторінки. Vercel-копія вказує на цей canonical. Pages project-level robots не є root robots; Vercel robots посилається на Pages sitemap (cross-site submission вимагає підтвердження ownership, автоматичне прийняття не заявляється). У звіті пояснено наслідки вибору.

## Що залишається перед здачею

Вказати ПІБ/групу; опублікувати Pages/Vercel; повторити **публічний** аудит за §4.7 та доповнити звіт; перевірити Schema Markup Validator/Rich Results Test; додати власні скріншоти DevTools Accessibility/Performance і ручний keyboard/zoom-тест. Автоматичні скріншоти сторінок/звітів не видаються за ручну роботу в DevTools. Форма — локальна демоверсія: не створює акаунтів і не надсилає листи. Лист автоматично не надсилався.

## Походження й ресурси

Starter: `denysmatsevych/web-development-2026`, архів `public/labs/flowtask-starter.zip`, commit `306900f5b11efe6096ccbbbfee44da071f8f7f06`. SHA256 та первинний аудит у audit/AI-AUDIT.md. Коміт `ca4a46f` зберігає оригінал. Зображення згенеровані для навчального завдання. Inter — SIL Open Font License 1.1, © The Inter Project Authors. FlowTask, компанії, контакти та відгуки — вигадані навчальні дані.
