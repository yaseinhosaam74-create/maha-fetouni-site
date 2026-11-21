'use client'
import React, { createContext, useContext, useEffect } from 'react'
import { useLocalStorage } from '@/lib/useLocalStorage'

type Language = 'ar' | 'en'

type LanguageContextType = {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
  isReady: boolean
}

const translations: Record<string, Record<Language, string>> = {
  siteName: { ar: 'مهى فتوني', en: 'Maha Ftouni' },
  heroSubtitle: { ar: 'المطربة اللبنانية', en: 'Lebanese Singer' },
  heroSubtitle2: { ar: 'استمع واستمتع', en: 'Listen and Enjoy' },
  home: { ar: 'الرئيسية', en: 'Home' },
  songs: { ar: 'الأغاني', en: 'Songs' },
  gallery: { ar: 'المعرض', en: 'Gallery' },
  about: { ar: 'نبذة', en: 'About' },
  contact: { ar: 'اتصل بنا', en: 'Contact' },
  latestSongs: { ar: 'أحدث الأغاني', en: 'Latest Songs' },
  latestAlbums: { ar: 'أحدث الألبومات', en: 'Latest Albums' },
  viewAll: { ar: 'عرض الكل', en: 'View All' },
  noSongs: { ar: 'لا توجد أغانٍ بعد', en: 'No songs yet' },
  noAlbums: { ar: 'لا توجد ألبومات بعد', en: 'No albums yet' },
  play: { ar: 'تشغيل', en: 'Play' },
  pause: { ar: 'إيقاف مؤقت', en: 'Pause' },
  download: { ar: 'تحميل', en: 'Download' },
  share: { ar: 'مشاركة', en: 'Share' },
  like: { ar: 'إعجاب', en: 'Like' },
  lyrics: { ar: 'كلمات الأغنية', en: 'Lyrics' },
  composer: { ar: 'الملحن', en: 'Composer' },
  lyricist: { ar: 'كاتب الكلمات', en: 'Lyricist' },
  arranger: { ar: 'الموزع', en: 'Arranger' },
  album: { ar: 'الألبوم', en: 'Album' },
  year: { ar: 'السنة', en: 'Year' },
  notFound: { ar: 'الصفحة غير موجودة', en: 'Page Not Found' },
  backHome: { ar: 'العودة للرئيسية', en: 'Back Home' },
  followUs: { ar: 'تابعنا', en: 'Follow Us' },
  sendMessage: { ar: 'أرسل رسالة', en: 'Send a Message' },
  messageSent: { ar: 'تم إرسال رسالتك بنجاح', en: 'Message sent successfully' },
  sending: { ar: 'جارٍ الإرسال...', en: 'Sending...' },
  send: { ar: 'إرسال', en: 'Send' },
  name: { ar: 'الاسم', en: 'Name' },
  email: { ar: 'البريد الإلكتروني', en: 'Email' },
  subject: { ar: 'الموضوع', en: 'Subject' },
  message: { ar: 'الرسالة', en: 'Message' },
  contactViaEmail: { ar: 'يمكنكم التواصل عبر البريد الإلكتروني:', en: 'You can reach us via email:' },
  shareApp: { ar: 'شارك الموقع', en: 'Share App' },
  downloadContact: { ar: 'تحميل جهة الاتصال', en: 'Download Contact' },
  qrScan: { ar: 'امسح الكود لمشاركة الموقع', en: 'Scan to share the website' },
  close: { ar: 'إغلاق', en: 'Close' },
  changeLanguage: { ar: 'تغيير اللغة', en: 'Change Language' },
  toggleTheme: { ar: 'تبديل الوضع', en: 'Toggle Theme' },
  dontForget: { ar: 'لا تنسي مهى فتوني', en: "Don't Forget Maha Ftouni" },
  followUsOn: { ar: 'تابعونا على', en: 'Follow us on' },
  allRights: { ar: 'جميع الحقوق محفوظة', en: 'All rights reserved' },
  noSocialLinks: { ar: 'لا توجد روابط بعد', en: 'No links yet' },
  selectSong: { ar: 'اختر أغنية لبدء التشغيل', en: 'Select a song to start playing' },
  copiedLink: { ar: 'تم نسخ الرابط', en: 'Link copied' },
  shareSong: { ar: 'شارك الأغنية', en: 'Share Song' },
  shuffle: { ar: 'عشوائي', en: 'Shuffle' },
  loop: { ar: 'تكرار القائمة', en: 'Loop playlist' },
  repeatOff: { ar: 'التكرار مغلق', en: 'Repeat off' },
  repeatAll: { ar: 'تكرار كل الأغاني', en: 'Repeat all' },
  repeatOne: { ar: 'تكرار الأغنية الحالية', en: 'Repeat one' },
  songDownloaded: { ar: 'تم تحميل الأغنية', en: 'Song downloaded' },
  coverDownloaded: { ar: 'تم تحميل صورة الغلاف', en: 'Cover image downloaded' },
  stories: { ar: 'القصص', en: 'Stories' },
  fullscreen: { ar: 'ملء الشاشة', en: 'Fullscreen' },
  exitFullscreen: { ar: 'إنهاء ملء الشاشة', en: 'Exit Fullscreen' },
  sync: { ar: 'مزامنة', en: 'Sync' },
  syncedView: { ar: 'عرض الكلمات المتزامنة', en: 'Synced lyrics view' },
  plainView: { ar: 'عرض الكلمات العادي', en: 'Plain lyrics view' },
  showMore: { ar: 'عرض المزيد', en: 'Show More' },
  showLess: { ar: 'عرض أقل', en: 'Show Less' },
  selectLines: { ar: 'حدد حتى 4 أسطر للمشاركة', en: 'Select up to 4 lines' },
  maxLines: { ar: 'يمكنك تحديد 5 أسطر كحد أقصى', en: 'Maximum 5 lines allowed' },
  copy: { ar: 'نسخ النص', en: 'Copy Text' },
  copied: { ar: 'تم نسخ الكلمات!', en: 'Lyrics copied!' },
  shareImage: { ar: 'مشاركة الصورة', en: 'Share Image' },
  noLyrics: { ar: 'لا توجد كلمات متاحة', en: 'No lyrics available' },
  loading: { ar: 'جاري جلب الكلمات...', en: 'Fetching lyrics...' },
  cancel: { ar: 'إلغاء', en: 'Cancel' },
  backToCurrent: { ar: 'العودة للمقطع الحالي', en: 'Back to current line' },
  background: { ar: 'الخلفية', en: 'Background' },
  shareCover: { ar: 'صورة الغلاف', en: 'Cover image' },
  sharePalette: { ar: 'ألوان الغلاف', en: 'Cover colors' },
  textPosition: { ar: 'موضع النص', en: 'Text position' },
  positionTop: { ar: 'أعلى', en: 'Top' },
  positionCenter: { ar: 'وسط', en: 'Middle' },
  positionBottom: { ar: 'أسفل', en: 'Bottom' },
  fontFamily: { ar: 'الخط', en: 'Font' },
  fontArabic: { ar: 'عربي', en: 'Arabic' },
  fontSerif: { ar: 'كلاسيكي', en: 'Serif' },
  fontSans: { ar: 'بسيط', en: 'Sans' },
  alignment: { ar: 'المحاذاة', en: 'Alignment' },
  alignRight: { ar: 'يمين', en: 'Right' },
  alignCenter: { ar: 'توسيط', en: 'Center' },
  alignLeft: { ar: 'يسار', en: 'Left' },
  copyImage: { ar: 'نسخ الصورة', en: 'Copy image' },
  imageCopied: { ar: 'تم نسخ الصورة!', en: 'Image copied!' },
  imageSaved: { ar: 'تم تحميل الصورة', en: 'Image downloaded' },
  nativeShare: { ar: 'مشاركة', en: 'Share' },
  nowPlaying: { ar: 'يُشغّل الآن', en: 'Now playing' },
  prevTrack: { ar: 'الأغنية السابقة', en: 'Previous track' },
  nextTrack: { ar: 'الأغنية التالية', en: 'Next track' },
  shareLyrics: { ar: 'مشاركة الكلمات', en: 'Share lyrics' },
  songLabel: { ar: 'أغنية', en: 'Song' },
  selectLyrics: { ar: 'اختر الكلمات', en: 'Select Lyrics' },
  linesSelected: { ar: 'سطر محدد', en: 'lines selected' },
  continue: { ar: 'متابعة', en: 'Continue' },
  done: { ar: 'تم', en: 'Done' },
  step: { ar: 'الخطوة', en: 'Step' },
  back: { ar: 'رجوع', en: 'Back' },
  images: { ar: 'الصور', en: 'Images' },
  stickers: { ar: 'الملصقات', en: 'Stickers' },
  sticker_none: { ar: 'بدون', en: 'None' },
  sticker_heart: { ar: 'قلب', en: 'Heart' },
  sticker_star: { ar: 'نجمة', en: 'Star' },
  sticker_sparkle: { ar: 'لمعة', en: 'Sparkle' },
  shareWithMessages: { ar: 'شارك مع MahaFtouni Messages', en: 'Share with MahaFtouni Messages' },
  inviteFriends: { ar: 'ادعُ أصدقاءك', en: 'Invite friends' },
  customizeCard: { ar: 'خصّص البطاقة ثم شاركها', en: 'Customize the card then share it' },
  shareFailed: { ar: 'فشلت المشاركة', en: 'Share failed' },
  selectAtLeastOne: { ar: 'اختر سطرًا واحدًا على الأقل', en: 'Select at least one line' },
  clipboardUnsupported: { ar: 'نسخ الصور غير مدعوم في هذا المتصفح', en: 'Image copy is not supported in this browser' },
  downloadAndLinkCopied: { ar: 'تم تحميل الصورة ونسخ الرابط', en: 'Image downloaded and link copied' },
  uploadInstruction: { ar: 'تم تحميل الصورة', en: 'Image downloaded' },
  white: { ar: 'أبيض', en: 'White' },
  black: { ar: 'أسود', en: 'Black' },
  red: { ar: 'أحمر', en: 'Red' },
  yellow: { ar: 'أصفر', en: 'Yellow' },
  customColor: { ar: 'لون مخصص', en: 'Custom color' },
  bg_black: { ar: 'أسود', en: 'Solid black' },
  bg_white: { ar: 'أبيض', en: 'Solid white' },
  bg_coverBlur: { ar: 'غلاف ضبابي', en: 'Cover blur' },
  bg_gradient: { ar: 'تدرّج الغلاف', en: 'Cover gradient' },
  bg_cover: { ar: 'صورة الغلاف', en: 'Cover image' },
  position: { ar: 'موضع الكلمات', en: 'Lyrics position' },
  pos_bottom: { ar: 'أسفل', en: 'Bottom' },
  pos_center: { ar: 'وسط', en: 'Center' },
  pos_top: { ar: 'أعلى', en: 'Top' },
  pos_overCover: { ar: 'فوق الغلاف', en: 'Over cover' },
  cardSize: { ar: 'مقاس البطاقة', en: 'Card size' },
  size_square: { ar: 'مربع', en: 'Square' },
  size_story: { ar: 'قصة', en: 'Story' },
  size_wide: { ar: 'عريض', en: 'Wide' },
  lyricsColor: { ar: 'لون الكلمات', en: 'Lyrics color' },
  fontSize: { ar: 'حجم الخط', en: 'Font size' },
  cover: { ar: 'الغلاف', en: 'Cover' },
  show: { ar: 'إظهار', en: 'Show' },
  small: { ar: 'صغير', en: 'Small' },
  large: { ar: 'كبير', en: 'Large' },
  showDetails: { ar: 'عناصر البطاقة', en: 'Card details' },
  songTitle: { ar: 'اسم الأغنية', en: 'Song title' },
  artist: { ar: 'الفنان', en: 'Artist' },
  logo: { ar: 'الشعار', en: 'Logo' },
  downloadPng: { ar: 'تحميل PNG', en: 'Download PNG' },
  instagramStory: { ar: 'قصة إنستغرام', en: 'Instagram Story' },
  copyLink: { ar: 'نسخ الرابط', en: 'Copy link' },
  mute: { ar: 'كتم', en: 'Mute' },
  unmute: { ar: 'إلغاء الكتم', en: 'Unmute' },
  more: { ar: 'المزيد', en: 'More' },
  openSongPage: { ar: 'فتح صفحة الأغنية', en: 'Open song page' },
  copiedText: { ar: 'تم نسخ النص بدون رابط محلي', en: 'Text copied without local link' },
  downloadAndTextCopied: { ar: 'تم تحميل الصورة ونسخ النص', en: 'Image downloaded and text copied' },
  tabSong: { ar: 'الأغنية', en: 'Song' },
  tabLyrics: { ar: 'الكلمات', en: 'Lyrics' },
  cardStyle: { ar: 'شكل البطاقة', en: 'Card style' },
  layout: { ar: 'التخطيط', en: 'Layout' },
  style_classic: { ar: 'كلاسيكي', en: 'Classic' },
  style_wide: { ar: 'عريض', en: 'Wide' },
  style_narrow: { ar: 'ضيق', en: 'Narrow' },
  style_slanted: { ar: 'مائل', en: 'Slanted' },
  bg_darkGrey: { ar: 'رمادي داكن', en: 'Dark grey' },
  bg_lightGrey: { ar: 'رمادي فاتح', en: 'Light grey' },
  chooseCover: { ar: 'اختر الغلاف', en: 'Choose cover' },
  editLyrics: { ar: 'تعديل الكلمات', en: 'Edit lyrics' },
  doneEditing: { ar: 'تم التعديل', en: 'Done editing' },
  status: { ar: 'حالة واتساب', en: 'Status' },
  copyright: { ar: '© 2026 مهى فتوني - جميع الحقوق محفوظة', en: '© 2026 Maha Ftouni - All rights reserved' },
}

const LanguageContext = createContext<LanguageContextType | null>(null)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [storedLanguage, setStoredLanguage] = useLocalStorage('language', 'ar')
  const language: Language = storedLanguage === 'en' ? 'en' : 'ar'

  useEffect(() => {
    document.documentElement.lang = language
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr'
  }, [language])

  const changeLanguage = (lang: Language) => {
    setStoredLanguage(lang)
  }

  const t = (key: string): string => {
    return translations[key]?.[language] || key
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage: changeLanguage, t, isReady: true }}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLanguage = () => {
  const context = useContext(LanguageContext)
  if (!context) throw new Error('useLanguage must be used within LanguageProvider')
  return context
}