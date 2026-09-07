'use client'
import { useState, useEffect } from 'react'
import { db } from '@/lib/firebase'
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore'
import toast from 'react-hot-toast'
import { Pencil, Trash2, Plus, X } from 'lucide-react'

type Song = {
  id: string
  titleAr: string
  titleEn: string
  audioUrl: string
  coverImageUrl: string
  albumAr?: string
  albumEn?: string
  year?: number
  composerAr?: string
  composerEn?: string
  lyricistAr?: string
  lyricistEn?: string
  arrangerAr?: string
  arrangerEn?: string
  lyricsAr?: string
  lyricsEn?: string
  isPublished: boolean
  plays: number
  likes: number
}

export default function AdminSongsPage() {
  const [songs, setSongs] = useState<Song[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingSong, setEditingSong] = useState<Song | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // الحقول
  const [titleAr, setTitleAr] = useState('')
  const [titleEn, setTitleEn] = useState('')
  const [audioUrl, setAudioUrl] = useState('')
  const [coverImageUrl, setCoverImageUrl] = useState('')
  const [albumAr, setAlbumAr] = useState('')
  const [albumEn, setAlbumEn] = useState('')
  const [year, setYear] = useState<number | undefined>(undefined)
  const [composerAr, setComposerAr] = useState('')
  const [composerEn, setComposerEn] = useState('')
  const [lyricistAr, setLyricistAr] = useState('')
  const [lyricistEn, setLyricistEn] = useState('')
  const [arrangerAr, setArrangerAr] = useState('')
  const [arrangerEn, setArrangerEn] = useState('')
  const [lyricsAr, setLyricsAr] = useState('')
  const [lyricsEn, setLyricsEn] = useState('')
  const [isPublished, setIsPublished] = useState(true)

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME

  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://widget.cloudinary.com/v2.0/global/all.js'
    script.async = true
    document.body.appendChild(script)
    return () => {
      document.body.removeChild(script)
    }
  }, [])

  useEffect(() => {
    fetchSongs()
  }, [])

  const fetchSongs = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'songs'))
      const songsList = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Song))
      setSongs(songsList)
    } catch (error) {
      toast.error('تعذر جلب الأغاني')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setTitleAr('')
    setTitleEn('')
    setAudioUrl('')
    setCoverImageUrl('')
    setAlbumAr('')
    setAlbumEn('')
    setYear(undefined)
    setComposerAr('')
    setComposerEn('')
    setLyricistAr('')
    setLyricistEn('')
    setArrangerAr('')
    setArrangerEn('')
    setLyricsAr('')
    setLyricsEn('')
    setIsPublished(true)
    setEditingSong(null)
  }

  const openUploadWidget = (type: 'audio' | 'image') => {
    if (!cloudName) return
    if (typeof window === 'undefined' || !(window as any).cloudinary) return
    const widget = (window as any).cloudinary.createUploadWidget(
      {
        cloudName,
        uploadPreset: 'maha_fetouni_preset',
        sources: ['local', 'url'],
        multiple: false,
        resourceType: type === 'audio' ? 'video' : 'image',
        folder: type === 'audio' ? 'maha-fetouni/songs' : 'maha-fetouni/covers',
      },
      (error: any, result: any) => {
        if (!error && result && result.event === 'success') {
          const url = result.info.secure_url
          if (type === 'audio') {
            setAudioUrl(url)
            toast.success('تم رفع الملف الصوتي')
          } else {
            setCoverImageUrl(url)
            toast.success('تم رفع صورة الغلاف')
          }
        }
      }
    )
    widget.open()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!titleAr || !titleEn || !audioUrl || !coverImageUrl) {
      toast.error('يرجى تعبئة الحقول الأساسية (الاسم بالعربية والإنجليزية، الملف الصوتي، صورة الغلاف)')
      return
    }
    setSubmitting(true)
    try {
      const songData = {
        titleAr,
        titleEn,
        audioUrl,
        coverImageUrl,
        albumAr,
        albumEn,
        year,
        composerAr,
        composerEn,
        lyricistAr,
        lyricistEn,
        arrangerAr,
        arrangerEn,
        lyricsAr,
        lyricsEn,
        isPublished,
        plays: editingSong?.plays || 0,
        likes: editingSong?.likes || 0,
        updatedAt: new Date(),
      }

      if (editingSong) {
        await updateDoc(doc(db, 'songs', editingSong.id), songData)
        toast.success('تم تحديث الأغنية')
      } else {
        await addDoc(collection(db, 'songs'), {
          ...songData,
          createdAt: new Date(),
        })
        toast.success('تمت إضافة الأغنية')
      }
      resetForm()
      setShowForm(false)
      fetchSongs()
    } catch (error) {
      toast.error('حدث خطأ أثناء الحفظ')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (song: Song) => {
    setEditingSong(song)
    setTitleAr(song.titleAr)
    setTitleEn(song.titleEn)
    setAudioUrl(song.audioUrl)
    setCoverImageUrl(song.coverImageUrl)
    setAlbumAr(song.albumAr || '')
    setAlbumEn(song.albumEn || '')
    setYear(song.year)
    setComposerAr(song.composerAr || '')
    setComposerEn(song.composerEn || '')
    setLyricistAr(song.lyricistAr || '')
    setLyricistEn(song.lyricistEn || '')
    setArrangerAr(song.arrangerAr || '')
    setArrangerEn(song.arrangerEn || '')
    setLyricsAr(song.lyricsAr || '')
    setLyricsEn(song.lyricsEn || '')
    setIsPublished(song.isPublished)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذه الأغنية؟')) {
      try {
        await deleteDoc(doc(db, 'songs', id))
        toast.success('تم حذف الأغنية')
        fetchSongs()
      } catch (error) {
        toast.error('تعذر الحذف')
      }
    }
  }

  const handleTogglePublish = async (song: Song) => {
    try {
      await updateDoc(doc(db, 'songs', song.id), {
        isPublished: !song.isPublished,
      })
      fetchSongs()
      toast.success('تم تحديث حالة النشر')
    } catch (error) {
      toast.error('تعذر التحديث')
    }
  }

  if (loading) return <div className="p-8 text-center">جارٍ التحميل...</div>

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">إدارة الأغاني</h1>
        <button
          onClick={() => { resetForm(); setShowForm(!showForm) }}
          className="bg-rubine text-white px-4 py-2 rounded-full flex items-center gap-2 hover:bg-tamarind transition"
        >
          {showForm ? <X size={18} /> : <Plus size={18} />}
          {showForm ? 'إلغاء' : 'إضافة أغنية'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-tamarind p-6 rounded-xl mb-8 space-y-4">
          <h2 className="text-xl font-bold">{editingSong ? 'تعديل أغنية' : 'إضافة أغنية جديدة'}</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1">العنوان بالعربية *</label>
              <input type="text" value={titleAr} onChange={(e) => setTitleAr(e.target.value)} className="w-full p-3 rounded bg-italian-roast border border-boho focus:outline-none" required />
            </div>
            <div>
              <label className="block mb-1">العنوان بالإنجليزية *</label>
              <input type="text" value={titleEn} onChange={(e) => setTitleEn(e.target.value)} className="w-full p-3 rounded bg-italian-roast border border-boho focus:outline-none" required />
            </div>
            <div>
              <label className="block mb-1">الألبوم بالعربية (اختياري)</label>
              <input type="text" value={albumAr} onChange={(e) => setAlbumAr(e.target.value)} className="w-full p-3 rounded bg-italian-roast border border-boho focus:outline-none" />
            </div>
            <div>
              <label className="block mb-1">الألبوم بالإنجليزية (اختياري)</label>
              <input type="text" value={albumEn} onChange={(e) => setAlbumEn(e.target.value)} className="w-full p-3 rounded bg-italian-roast border border-boho focus:outline-none" />
            </div>
            <div>
              <label className="block mb-1">السنة</label>
              <input type="number" value={year || ''} onChange={(e) => setYear(Number(e.target.value) || undefined)} className="w-full p-3 rounded bg-italian-roast border border-boho focus:outline-none" />
            </div>
            <div>
              <label className="block mb-1">الملحن عربي (اختياري)</label>
              <input type="text" value={composerAr} onChange={(e) => setComposerAr(e.target.value)} className="w-full p-3 rounded bg-italian-roast border border-boho focus:outline-none" />
            </div>
            <div>
              <label className="block mb-1">الملحن إنجليزي (اختياري)</label>
              <input type="text" value={composerEn} onChange={(e) => setComposerEn(e.target.value)} className="w-full p-3 rounded bg-italian-roast border border-boho focus:outline-none" />
            </div>
            <div>
              <label className="block mb-1">كاتب الكلمات عربي (اختياري)</label>
              <input type="text" value={lyricistAr} onChange={(e) => setLyricistAr(e.target.value)} className="w-full p-3 rounded bg-italian-roast border border-boho focus:outline-none" />
            </div>
            <div>
              <label className="block mb-1">كاتب الكلمات إنجليزي (اختياري)</label>
              <input type="text" value={lyricistEn} onChange={(e) => setLyricistEn(e.target.value)} className="w-full p-3 rounded bg-italian-roast border border-boho focus:outline-none" />
            </div>
            <div>
              <label className="block mb-1">الموزع عربي (اختياري)</label>
              <input type="text" value={arrangerAr} onChange={(e) => setArrangerAr(e.target.value)} className="w-full p-3 rounded bg-italian-roast border border-boho focus:outline-none" />
            </div>
            <div>
              <label className="block mb-1">الموزع إنجليزي (اختياري)</label>
              <input type="text" value={arrangerEn} onChange={(e) => setArrangerEn(e.target.value)} className="w-full p-3 rounded bg-italian-roast border border-boho focus:outline-none" />
            </div>
          </div>

          <div>
            <label className="block mb-1">كلمات الأغنية بالعربية</label>
            <textarea value={lyricsAr} onChange={(e) => setLyricsAr(e.target.value)} rows={6} className="w-full p-3 rounded bg-italian-roast border border-boho focus:outline-none resize-none" />
          </div>
          <div>
            <label className="block mb-1">كلمات الأغنية بالإنجليزية</label>
            <textarea value={lyricsEn} onChange={(e) => setLyricsEn(e.target.value)} rows={6} className="w-full p-3 rounded bg-italian-roast border border-boho focus:outline-none resize-none" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1">الملف الصوتي *</label>
              <div className="flex gap-2">
                <input type="url" value={audioUrl} onChange={(e) => setAudioUrl(e.target.value)} className="flex-1 p-3 rounded bg-italian-roast border border-boho focus:outline-none" placeholder="https://res.cloudinary.com/..." required />
                <button type="button" onClick={() => openUploadWidget('audio')} className="bg-boho text-white px-4 py-2 rounded hover:bg-rubine transition">رفع</button>
              </div>
            </div>
            <div>
              <label className="block mb-1">صورة الغلاف *</label>
              <div className="flex gap-2">
                <input type="url" value={coverImageUrl} onChange={(e) => setCoverImageUrl(e.target.value)} className="flex-1 p-3 rounded bg-italian-roast border border-boho focus:outline-none" placeholder="https://res.cloudinary.com/..." required />
                <button type="button" onClick={() => openUploadWidget('image')} className="bg-boho text-white px-4 py-2 rounded hover:bg-rubine transition">رفع</button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} className="w-4 h-4" />
            <label>منشورة (ظاهرة للجمهور)</label>
          </div>

          <button type="submit" disabled={submitting} className="bg-rubine text-white px-6 py-3 rounded-full hover:bg-tamarind transition disabled:opacity-50">
            {submitting ? 'جارٍ الحفظ...' : editingSong ? 'تحديث' : 'إضافة'}
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {songs.map((song) => (
          <div key={song.id} className="bg-tamarind p-4 rounded-xl flex gap-4">
            <img src={song.coverImageUrl} alt={song.titleAr} className="w-20 h-20 object-cover rounded" />
            <div className="flex-1">
              <h3 className="font-bold">{song.titleAr}</h3>
              <p className="text-sm text-boho">{song.titleEn}</p>
              <div className="flex gap-2 mt-2">
                <button onClick={() => handleEdit(song)} className="text-camel-coat hover:text-rubine"><Pencil size={16} /></button>
                <button onClick={() => handleTogglePublish(song)} className={`${song.isPublished ? 'text-green-500' : 'text-gray-500'}`}>
                  {song.isPublished ? 'منشور' : 'مخفي'}
                </button>
                <button onClick={() => handleDelete(song.id)} className="text-red-500 hover:text-red-700"><Trash2 size={16} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {songs.length === 0 && !loading && <p className="text-center text-boho py-8">لا توجد أغانٍ بعد</p>}
    </div>
  )
}