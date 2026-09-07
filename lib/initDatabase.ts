import { db } from './firebase'
import { doc, setDoc, getDoc } from 'firebase/firestore'

export async function initializeDatabase() {
  try {
    const settingsRef = doc(db, 'settings', 'site_settings')
    const settingsSnap = await getDoc(settingsRef)

    const defaultSettings = {
      siteNameAr: 'مهى فتوني',
      siteNameEn: 'Maha Ftouni',
      heroTitleAr: 'مهى فتوني',
      heroTitleEn: 'Maha Ftouni',
      heroSubtitleAr: 'المطربة اللبنانية',
      heroSubtitleEn: 'Lebanese Singer',
      heroSubtitle2Ar: 'استمع واستمتع',
      heroSubtitle2En: 'Listen and Enjoy',
      aboutTextAr: 'نبذة عن الفنانة...',
      aboutTextEn: 'About the artist...',
      contactEmail: '',
      phoneNumber: '',
      copyrightAr: '© 2024 مهى فتوني - جميع الحقوق محفوظة',
      copyrightEn: '© 2024 Maha Ftouni - All rights reserved',
      socialLinks: {
        facebook: { url: '', enabled: false, color: '#1877F2' },
        instagram: { url: '', enabled: false, color: '#E4405F' },
        twitter: { url: '', enabled: false, color: '#1DA1F2' },
        youtube: { url: '', enabled: false, color: '#FF0000' },
        tiktok: { url: '', enabled: false, color: '#000000' },
        snapchat: { url: '', enabled: false, color: '#FFFC00' },
        whatsapp: { url: '', enabled: false, color: '#25D366' },
        spotify: { url: '', enabled: false, color: '#1DB954' },
        email: { url: '', enabled: false, color: '#D44638' },
      },
      homeCoverImage: '',
      updatedAt: new Date(),
    }

    if (!settingsSnap.exists()) {
      await setDoc(settingsRef, defaultSettings)
    } else {
      // دمج الحقول الناقصة مع الحفاظ على القيم الموجودة
      const existingData = settingsSnap.data()
      const mergedData = { ...defaultSettings, ...existingData }
      // التأكد من أن socialLinks كائن كامل
      mergedData.socialLinks = {
        ...defaultSettings.socialLinks,
        ...(existingData.socialLinks || {}),
      }
      await setDoc(settingsRef, mergedData, { merge: true })
    }
    console.log('Database initialized/updated successfully')
  } catch (error) {
    console.error('Error initializing database:', error)
  }
}