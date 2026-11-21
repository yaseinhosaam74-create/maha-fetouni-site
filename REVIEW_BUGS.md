# REVIEW_BUGS — بانتظار مراجعتك

## RESUME
- **منفذ الاختبار:** `npm run dev` فقط على http://localhost:3000/songs/[id] — لا build ولا deploy.
- **تم واختباره:** الخطوات 0-5 ثم أُوقفت الخطوة 5 وأُعيد بناء المشغّل وبطاقة المشاركة. المشغّل الآن شاشة كاملة سوداء حقيقية: `AppShell` يُلغي الهيدر والفوتر وصفحة الأغنية عند الفتح، ولا يبقى سوى الغلاف والكلمات المتزامنة والتحكم وزر إغلاق واحد. بطاقة المشاركة تُرسَم بـ Canvas API (لا html-to-image) مع لوحة تخصيص كاملة ومعاينة حيّة وكل أزرار المشاركة.
- **الملفات الأساسية المعدّلة:** `components/AudioContext.tsx`، `components/AppShell.tsx`، `components/FullScreenPlayer.tsx`، `components/LyricsShareCard.tsx` (حلت محل `FullScreenLyrics.tsx` المحذوفة)، `app/page.tsx`، `app/songs/[id]/page.tsx`، `lib/shareCard.ts`، `lib/coverColors.ts`، `app/context/LanguageContext.tsx`.
- **التالي:** خطوة التحسينات للأخطاء 3،6،10،14،15،16،17.

هذا الملف يسجّل الملاحظات والأخطاء المكتشفة أثناء فحص المشروع قبل ترقية المشغّلات.
اعتمدت موافقتك على العناصر السبعة عشر، وجارٍ تنفيذها ضمن خطوات الترقية.

### حالة التنفيذ
- **أُصلحت في الخطوة 1:** 1، 2، 5، 8، 9، 11، 13.
- **أُصلحت في الخطوتين 3 و4:** 4، 7، 12.
- **متبقية لخطوة التحسينات:** 3، 6، 10، 14، 15، 16، 17.

---

## 1. أسماء حقول التحليلات لا تطابق قواعد Firestore
- **الوصف:** الكود يكتب أحداث التحليلات بالحقلين `type` و`path`، بينما `firestore.rules` تسمح بـ `event` و`page` فقط. النتيجة المتوقعة: رفض معظم أحداث التحليلات.
- **الملف:** `lib/analytics.ts:23-27`، `lib/analyticsStats.ts:11-17`، `firestore.rules:59-61`
- **الإصلاح المقترح:** توحيد أسماء الحقول بين الكاتب والقارئ والقواعد (إما `event/page` في الكود، أو السماح بـ `type/path` في القواعد).

## 2. Service Worker يحذف كاش الصوت
- **الوصف:** الـ service worker يحذف كل cache اسمه ليس `maha-ftouni-cache-v2`، وهذا يشمل `maha-ftouni-songs` الذي يستخدمه `AudioContext` لتخزين الصوت.
- **الملف:** `public/sw.js:22-24`، `components/AudioContext.tsx:132-136`
- **الإصلاح المقترح:** استخدام allowlist لأسماء الـ caches أو ضم كاش الصوت داخل استراتيجية الـ SW.

## 3. المشغّل الصغير `AudioPlayer.tsx` غير مستخدم
- **الوصف:** المكوّن موجود لكن لا يوجد أي استيراد أو رندر له خارج ملفه.
- **الملف:** `components/AudioPlayer.tsx:11-176`
- **الإصلاح المقترح:** إما إضافته في `AppShell` بعد التأكد من عدم التعارض مع المشغّل الكبير، أو حذفه إن لم يعد مطلوبًا.
- **ملاحظة:** حسب توضيحك، المقصود بالمشغّل الصغير هو معاينة الكلمات في `app/songs/[id]/page.tsx:209-217`، لذا هذا العنصر للمراجعة فقط ولا علاقة له بالخطوة 4.

## 4. أولوية خاطئة في اسم الألبوم
- **الوصف:** التعبير `[language === 'ar' ? song.albumAr : song.albumEn || 'أغنية']` قد يُظهر `undefined` عند غياب `albumAr`.
- **الملف:** `app/songs/[id]/page.tsx:184`
- **الإصلاح المقترح:** `(language === 'ar' ? song.albumAr : song.albumEn) || 'أغنية'`.

## 5. جلب LRCLIB قد يستبدل كلمات الأغنية الصحيحة
- **الوصف:** الطلب الخارجي يعمل حتى عند وجود `plainText`، والنتيجة المجتلبة تأخذ أولوية على النص المخزّن؛ قد تظهر كلمات عربية/خاطئة لأغنية إنجليزية.
- **الملف:** `components/FullScreenLyrics.tsx:70-87`، `components/FullScreenLyrics.tsx:90-103`
- **الإصلاح المقترح:** لا تجلب إلا عند غياب `lrcText` **و** `plainText`، أو اجعل الجلب اختياريًا مع تحقّق من اللغة والمدة.

## 6. ترجمات محلية مكرّرة داخل `FullScreenLyrics`
- **الوصف:** المكوّن يعرّف قاموسًا خاصًا به يتجاوز `LanguageContext`، وبعض مفاتيحه مثل `selectLines` غير معرّفة في القاموس المركزي.
- **الملف:** `components/FullScreenLyrics.tsx:46-58`، `app/context/LanguageContext.tsx:14-65`
- **الإصلاح المقترح:** نقل المفاتيح إلى `LanguageContext` واستخدام `useLanguage().t` في كل الواجهة.

## 7. «ملء الشاشة» ليس Fullscreen حقيقيًا
- **الوصف:** زر التكبير يبدّل `inset-4` إلى `inset-0` فقط؛ لا يوجد `requestFullscreen` ولا متابعة لـ `fullscreenchange`.
- **الملف:** `components/FullScreenLyrics.tsx:36`، `:212-214`، `:240-242`
- **الإصلاح المقترح:** استخدام Fullscreen API ومزامنة الحالة عند خروج المستخدم بمفتاح Esc.
- **ملاحظة:** هذا ضمن المطلوب في الخطوة 3، وسينفّذ كجزء من الترقية إن وافقت على العنصر 7.

## 8. تكرار منطق تحليل LRC وتجاهل `offset`
- **الوصف:** التحليل مكرر في المشغّلين، ويتجاهل `[offset:]`، بينما `lib/lyrics.ts` يعالجه لكنه غير مستخدم.
- **الملف:** `components/FullScreenPlayer.tsx:30-66`، `components/FullScreenLyrics.tsx:90-118`، `lib/lyrics.ts:46-51,84-100`
- **الإصلاح المقترح:** توحيد كل التحليل داخل `lib/lyrics.ts` واستدعاء `parseLyrics/getActiveLineIndex` من المكوّنين.
- **ملاحظة:** هذا ضمن المطلوب في الخطوة 1.

## 9. نوع `Song` في `lib/firestore.ts` ناقص
- **الوصف:** النوع لا يحتوي `syncedLyricsAr/En` رغم أن `AudioContext` ولوحة التحكم يتعاملان معهما.
- **الملف:** `lib/firestore.ts:15-38`، `components/AudioContext.tsx:26-27`
- **الإصلاح المقترح:** إضافة الحقلين إلى النوع المشترك.
- **ملاحظة:** هذا ضمن المطلوب في الخطوة 1.

## 10. نظاما إعجاب مختلفان وغير متزامنان
- **الوصف:** `AudioPlayer` يستخدم `liked_${id}` في localStorage، بينما المشغّل الكبير وصفحة الأغنية يستخدمان مستند `likes/{deviceId}_{songId}`؛ الحالة لا تزامن بين الواجهات.
- **الملف:** `components/AudioPlayer.tsx:14,58-69`، `components/FullScreenPlayer.tsx:137-151`، `app/songs/[id]/page.tsx:135-141`، `lib/firestore.ts:131-153`
- **الإصلاح المقترح:** استخدام دوال `likeSong/unlikeSong/isSongLiked` الموحّدة في كل الواجهات.

## 11. زر التشغيل في Media Session يعيد الأغنية للبداية
- **الوصف:** يستدعي `playSong(currentSong)`، وهذا يغيّر `src` ويزيد عدّاد `plays` ويسجّل حدث تشغيل جديد بدل استئناف التشغيل فقط.
- **الملف:** `components/AudioContext.tsx:189`، `:143-177`
- **الإصلاح المقترح:** فصل دالة `resume()` عن `playSong()` واستدعاء `audio.play()` بدون عدّادات.

## 12. مقاسات المشغّل الكبير تسبب overflow
- **الوصف:** `w-[420px] h-[970px]` مع أقسام `560/410` ثابتة؛ على الشاشات الصغيرة أو القصيرة يحدث تجاوز.
- **الملف:** `components/FullScreenPlayer.tsx:170`، `:172`، `:193`
- **الإصلاح المقترح:** `w-full max-w-[420px]` وارتفاع مرن مثل `h-[min(970px,calc(100dvh-2rem))]` مع flex.
- **ملاحظة:** المطلوب «تكبير بسيط مع ثبات الأبعاد» في الخطوة 3 سيأخذ هذا في الحسبان بدون layout shift.

## 13. غياب `crossOrigin` في قوالب مشاركة الصور
- **الوصف:** صور الغلاف داخل قوالب `html-to-image` بلا `crossOrigin="anonymous"`، بعكس صفحة الأغنية؛ قد يفشل توليد PNG بسبب CORS مع Cloudinary.
- **الملف:** `components/FullScreenPlayer.tsx:264,268`، `components/FullScreenLyrics.tsx:330,334`
- **الإصلاح المقترح:** إضافة `crossOrigin="anonymous"` واختبار `toPng` على رابط Cloudinary فعلي.

## 14. حدث `song_like` يُسجّل عند إلغاء الإعجاب أيضًا
- **الوصف:** تسجيل التحليلات يتم بعد التبديل في كلا الفرعين.
- **الملف:** `components/FullScreenPlayer.tsx:147`
- **الإصلاح المقترح:** تسجيل الحدث داخل فرع الإضافة فقط، أو استخدام `song_unlike` للفرع الآخر.

## 15. وميض الثيم وثبات `lang/dir` في SSR
- **الوصف:** لا يوجد script قبل الرسم يقرأ `localStorage`، و`<html lang="ar" dir="rtl">` ثابت على السيرفر.
- **الملف:** `components/ThemeContext.tsx:16-29`، `components/LanguageContext` عبر `app/layout.tsx:48`
- **الإصلاح المقترح:** inline script في `<head>` يضبط الثيم/اللغة قبل الرسم، أو الانتقال إلى cookie/route-based locale.

## 16. لغة لوحة التحكم منفصلة عن `LanguageContext`
- **الوصف:** `AdminShell` يحتفظ بحالة محلية مستقلة رغم توفّر `LanguageProvider` في `AppShell`.
- **الملف:** `components/AdminShell.tsx:15`، `:128-135`، `:182-188`
- **الإصلاح المقترح:** استخدام `useLanguage()` أو إزالة التكرار.

## 17. مستمع الإشعارات غير مركّب
- **الوصف:** `NotificationListener` موجود لكنه غير مضاف إلى `AppShell`، لذلك إشعارات الأغاني الجديدة معطّلة.
- **الملف:** `components/NotificationListener.tsx:6-20`، `components/AppShell.tsx:24-41`
- **الإصلاح المقترح:** إضافته داخل `AppShell` في مسارات الواجهة العامة فقط.

---

**الحالة:** بانتظار مراجعتك. لم يُصلَح أي عنصر، ولم يُنفّذ أي build أو deploy.
