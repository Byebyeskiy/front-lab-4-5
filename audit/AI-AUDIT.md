# Первинний AI-аудит FlowTask (§5.2)

Дата: 15.10.2026. Агент: OpenAI Codex, сімейство GPT-6; точний номер збірки/API model ID інтерфейс не надає. Не підмінювати його вигаданою версією.

Промпт: «Проаналізуй офіційний FlowTask starter, HTML, CSS, JS, початкові axe/Lighthouse і Chrome Accessibility Tree. Спочатку сформуй таблицю Category / Problem / Evidence / Severity / Recommendation / Verification. Не змінюй дизайн; виправляй лише підтверджене. Перевір щонайменше 5 рекомендацій і відхили хоча б одну з посиланням на джерело. Не вигадуй польові INP, деплої чи результати ручного DevTools».

Джерело: офіційний архів `public/labs/flowtask-starter.zip` з GitHub `denysmatsevych/web-development-2026`, коміт `306900f5b11efe6096ccbbbfee44da071f8f7f06`. SHA256 архіву: `eb0080c8775cc16d8b11e09613fd5e80e9d0718d248e91a3f83612fe6fa0f1db`. Прямий URL курсу недоступний через мережевий proxy (403), тому використано той самий архів з офіційного Git-репозиторію. Список прихованих дефектів не використовувався.

Початковий код збережено комітом `ca4a46f`. Результати: `evidence/before/`. Перевірки тут локальні, а не обов'язковий за ТЗ аудит Vercel. Користувач виконає публікацію Vercel самостійно.

| Category | Problem | Evidence | Severity | Recommendation | Verification |
|---|---|---|---|---|---|
| Accessibility | Немає мови документа | Обидва `<html>` без lang; axe html-has-lang | Висока | lang="en" відповідно до контенту | axe + DOM |
| Accessibility | Nav — div, hero CTA — div, submit лише click | Tab пропускає навігацію і hero; div submit не активується Space/Enter як button | Висока | Посилання для переходів, нативний submit | Реальні Tab/Enter/Space |
| Accessibility | Вимкнений focus | `:focus { outline:none }`, журнал Tab outline=none | Висока | Контрастний focus, scroll-margin для sticky header, skip link | Tab + скріншоти |
| Accessibility | Некоректна ієрархія | h1 → h4 → h3; axe heading-order | Середня | h2 зі збереженням розміру | DOM + AX |
| Accessibility | Hero без alt | axe image-alt, зображення показує task board | Висока | Змістовний alt і розміри | axe + AX |
| Accessibility | Слабкий контраст | axe color-contrast: 18 елементів головної, 4 About | Висока | Затемнити muted/soft; контраст placeholders і focus | axe + числові ratios |
| Accessibility | Іконки соцмереж без назв, малі цілі | axe link-name (3), target-size (3) | Висока | Назви лише icon-only controls; цілі ≥24px | axe + вимірювання |
| Accessibility | Placeholder замість постійних labels, помилка лише кольором | input без label; порожній email отримує тільки boxShadow | Висока | Видимі labels, required/type=email, текст помилки, aria-describedby/invalid | Порожнє, невалідне, валідне введення |
| Accessibility | FAQ повідомляє протилежний стан | Browser audit: expanded=true, visible=false; axe це не виявив | Висока | Синхронізувати hidden та aria-expanded; aria-controls | AX і Enter/Space |
| Accessibility/SEO | Неробочі фрагменти та заглушки | #pricing-details без id; About nav без targets; href="#" | Середня | Чинні локальні посилання; чесно позначити відсутні demo destinations | Перевірка всіх фрагментів |
| SEO | noindex на головній | meta robots=noindex | Висока | Прибрати для сторінки, призначеної до індексації | DOM + Lighthouse |
| SEO | Немає description, canonical, OG; однакові titles | DOM обох сторінок, Lighthouse | Середня | Унікальні метадані, один canonical origin, absolute OG image | DOM assertions |
| SEO | JSON-LD суперечить видимому контенту | Pro $19 у JSON проти $29 на сторінці; 4.9/1284 немає у контенті | Висока | SoftwareApplication, $29 USD, без непідтвердженого rating | Зіставити JSON-LD з pricing; онлайн validators після деплою |
| SEO | Robots блокує ресурси, sitemap відсутній | Disallow /css/, /img/; GET sitemap.xml =404 | Висока | Дозволити ресурси, додати sitemap з обома canonical URL | HTTP/XML + Vercel /robots.txt після публікації |
| Performance | Надмірний hero JPEG | 4000×2500, 2 782 688 байтів; LCP IMG.hero__image | Висока | Responsive WebP, width/height, fetchpriority=high; не lazy-load LCP | Network + Lighthouse 3 runs |
| Performance | Promo зсуває layout | JS вставляє банер через 800ms; LayoutShift sources і Lighthouse CLS | Висока | Той самий банер у початковому HTML обох сторінок | PerformanceObserver shifts |
| Performance | Busy loop у CTA | CPU profile; dispatch click ~300ms; результат total не використовується | Висока | Прибрати непотрібну синхронну роботу | CPU profile та click duration; не називати INP |
| Performance | Блокувальний JS, font без display | script у head без defer; @font-face без font-display | Середня | defer, font-display:swap | DOM + network/render перевірка |
| Кандидат AI, ВІДХИЛЕНО | «Заповнити всі порожні alt; hero зробити lazy» | Порожні alt у декоративних іконок/аватарів правильні: імена вже поруч. Hero — LCP | — | Залишити декоративним alt="", для hero не використовувати lazy | WAI decorative images; web.dev optimize-lcp |
| Кандидат AI, ВІДХИЛЕНО | «Додати role=button і tabindex до hero div, aria-label усім кнопкам» | Додає ручну імітацію клавіатури і перезаписує текстову назву | — | Нативний link/button, name з видимого тексту | WAI first rule of ARIA; APG button |

Фіксується до внесення змін до коду сторінок. Browser/CDP експерименти не видаються за ручне відкриття панелі DevTools студентом. Публічний аудит та ручні скріншоти панелей залишаються етапом після деплою.
