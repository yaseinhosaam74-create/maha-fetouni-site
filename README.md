# مهى فتوني - الموقع الرسمي

مشروع Next.js 15 (App Router) وTypeScript وTailwind CSS.

## التشغيل

```bash
npm install
cp .env.example .env.local
npm run dev
```

## متغيرات البيئة

انسخ `.env.example` إلى `.env.local` واملأ:

- `NEXT_PUBLIC_FIREBASE_*`: إعدادات مشروع Firebase.
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`: اسم Cloudinary لرفع الصور والصوت.
- `NEXT_PUBLIC_SITE_URL`: رابط الموقع المستخدم في sitemap وrobots.

## الأمان

- لا توجد نقطة نهاية عامة لتهيئة قاعدة البيانات؛ تتم الكتابة من لوحة التحكم بواسطة مستخدم admin فقط.
- طبّق `firestore.rules` في Firebase Console قبل النشر.
- حساب الأدمن يجب أن يحصل على custom claim باسم `admin` وقيمته `true`.
- دخول لوحة التحكم يتحقق من الـ claim على العميل، والقواعد تمنع أي كتابة من غير admin على السيرفر.
- لا تشغّل `setup.sh` القديم؛ maintained setup هو هذا الملف و`.env.example`.

## الأوامر

```bash
npm run dev
npm run build
npm run lint
```

لوحة التحكم: `/mahaftounidashboard1997`
