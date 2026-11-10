# ELBE LIVE — الموقع النهائي جاهز لـ GitHub Pages

هذا المجلد يحتوي على نسختين من الموقع مع نفس النصوص والبيانات الحقيقية، الصور الأربعة، Timeline تفاعلي (24 ساعة / 7 أيام / 30 يوم)، وحالات التحميل والخطأ، وKI-Logbuch بالألماني.

## النشر — بدون برامج إضافية

1. فك ضغط ملف `ELBE-LIVE-FINAL.zip` على جهازك.
2. افتح https://github.com وسجل الدخول.
3. اضغط **+ → New repository**، سمّه مثلاً `elbe-live`، واختَر **Public**، ثم **Create repository**.
4. اختر **uploading an existing file** وارفع **محتويات مجلد `ELBE-LIVE-FINAL`** (كل الملفات والمجلدات الموجودة *داخله*)، حتى يظهر ملف `index.html` مباشرة في أعلى المستودع وليس داخل مجلد فرعي.
5. اضغط **Commit changes**.
6. افتح **Settings → Pages** واختَر **Deploy from a branch** ثم `main` و`/(root)` واضغط **Save**.
7. عند ظهور رابط الموقع في صفحة Pages ستكون روابطك عادةً هكذا:
   - `https://USERNAME.github.io/elbe-live/` — الصفحة الرئيسية
   - `https://USERNAME.github.io/elbe-live/variante-a/` — Variante A
   - `https://USERNAME.github.io/elbe-live/variante-b/` — Variante B
   - `https://USERNAME.github.io/elbe-live/ki-logbuch/` — KI-Logbuch

استبدل `USERNAME` باسم حساب GitHub الخاص فيك. رابط الاستضافة الفعلي يظهر في Settings → Pages.

## اختبارات ضرورية قبل التسليم

- افتح رابط النسختين في نافذة خاصة (بدون تسجيل دخول)، وتأكد من ظهور رقم حقيقي مع وقت القياس.
- افتح أدوات المطور F12 → Network، ثم أعد تحميل الصفحة. يجب أن تظهر طلبات `pegelonline.wsv.de` ويرجع طلب JSON بنجاح (غالباً HTTP 200).
- اضغط أزرار **24 Stunden، 7 Tage، 30 Tage**، وجرّب سحب الـTimeline وتشغيل ▶ Verlauf abspielen.
- خذ Screenshot من Network وScreenshotين من القياسات الحقيقية بينهما ساعة، وأضف الصور إلى `ki-logbuch/belege/` وحدّث الروابط داخل `ki-logbuch/index.html` إذا لزم. مشروع الـLogbuch يذكر بصراحة أن هذا الاختبار يحتاج تنفيذ بعد النشر.
- اكتب رأيك الشخصي: أي تصميم تفضّل ولماذا؟ واذكر أي تعديل يدوي عملته فعلياً.

## ملاحظات تقنية

- البيانات الحقيقية تأتي من **PEGELONLINE REST-API v2** لمحطة **Hamburg St. Pauli** (`d488c5cc-4de9-4631-8ce1-0db0e700b546`). البيانات مجانية وبدون API Key.
- الموقع يحدث البيانات عند فتح الصفحة ثم كل 5 دقائق أثناء فتح التبويب. الـTimeline يعرض آخر 30 يوم المتاحة مباشرة من API، وليس أرقاماً مخزنة.
- البيانات **ارتفاع ماء فوق الصفر المرجعي للقياس** (Pegelnullpunkt)، ولا تمثل عمق النهر.
- الصور الأربعة مولّدة بالذكاء الاصطناعي وهي للأجواء البصرية وليست توثيقاً فوتوغرافياً حرفياً للمكان.
- `noindex` و `robots.txt` موجودان في المشروع، وGitHub Pages كموقع عام يظل متاحاً لمن لديه الرابط.
- المشروع HTML + CSS + JavaScript فقط؛ GitHub Pages يكفي دون npm أو backend.
- **مهم:** تم اختبار واجهة الموقع والتفاعل باستخدام بيانات اختبار محلية. اختبار الوصول إلى API الفعلي في GitHub Pages يجب إجراؤه بعد النشر لأن بيئة تطوير المشروع لم تسمح بفتح رابط API مباشرةً.

## أين تجد الملفات؟

`index.html` صفحة اختيار التصميم، `variante-a/` و`variante-b/` النسختان، `js/app.js` جلب البيانات وتفاعل الـTimeline، `css/` التنسيقات، `assets/img/` الصور، `ki-logbuch/` دفتر العمل بالألماني.
