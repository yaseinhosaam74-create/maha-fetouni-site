import { db } from './firebase'
import { doc, getDoc, setDoc } from 'firebase/firestore'

export type SeoSettings = {
  home: { titleAr: string; titleEn: string; descriptionAr: string; descriptionEn: string; keywords: string }
  songs: { titleAr: string; titleEn: string; descriptionAr: string; descriptionEn: string; keywords: string }
  gallery: { titleAr: string; titleEn: string; descriptionAr: string; descriptionEn: string; keywords: string }
  about: { titleAr: string; titleEn: string; descriptionAr: string; descriptionEn: string; keywords: string }
  contact: { titleAr: string; titleEn: string; descriptionAr: string; descriptionEn: string; keywords: string }
}

export const defaultSeoSettings: SeoSettings = {
  home: {
    titleAr: 'مهى فتوني | الموقع الرسمي',
    titleEn: 'Maha Ftouni | Official Website',
    descriptionAr: 'الموقع الرسمي للمطربة اللبنانية مهى فتوني - أغاني، صور، كلمات',
    descriptionEn: 'Official website of Lebanese singer Maha Ftouni - Songs, Photos, Lyrics',
    keywords: 'مهى فتوني, اغاني, لبنان, Maha Ftouni, songs, Lebanon',
  },
  songs: {
    titleAr: 'الأغاني | مهى فتوني',
    titleEn: 'Songs | Maha Ftouni',
    descriptionAr: 'استمع إلى جميع أغاني مهى فتوني',
    descriptionEn: 'Listen to all songs by Maha Ftouni',
    keywords: 'أغاني مهى فتوني, Maha Ftouni songs',
  },
  gallery: {
    titleAr: 'المعرض | مهى فتوني',
    titleEn: 'Gallery | Maha Ftouni',
    descriptionAr: 'شاهد صور مهى فتوني',
    descriptionEn: 'View photos of Maha Ftouni',
    keywords: 'صور مهى فتوني, Maha Ftouni photos',
  },
  about: {
    titleAr: 'نبذة عن مهى فتوني',
    titleEn: 'About Maha Ftouni',
    descriptionAr: 'تعرف على السيرة الذاتية للمطربة مهى فتوني',
    descriptionEn: 'Learn about the biography of singer Maha Ftouni',
    keywords: 'نبذة مهى فتوني, Maha Ftouni bio',
  },
  contact: {
    titleAr: 'اتصل بنا | مهى فتوني',
    titleEn: 'Contact Us | Maha Ftouni',
    descriptionAr: 'تواصل مع مهى فتوني',
    descriptionEn: 'Contact Maha Ftouni',
    keywords: 'اتصل بمهى فتوني, Contact Maha Ftouni',
  },
}

export async function getSeoSettings(): Promise<SeoSettings> {
  const docRef = doc(db, 'settings', 'seo')
  const docSnap = await getDoc(docRef)
  if (docSnap.exists()) {
    return { ...defaultSeoSettings, ...docSnap.data() }
  }
  return defaultSeoSettings
}

export async function saveSeoSettings(settings: SeoSettings) {
  await setDoc(doc(db, 'settings', 'seo'), settings, { merge: true })
}