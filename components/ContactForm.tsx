'use client'
import { useState } from 'react'
import { db } from '@/lib/firebase'
import { collection, addDoc } from 'firebase/firestore'
import toast from 'react-hot-toast'
import { useLanguage } from '@/app/context/LanguageContext'

export default function ContactForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const { language } = useLanguage()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await addDoc(collection(db, 'messages'), {
        name,
        email,
        subject,
        message,
        read: false,
        createdAt: new Date(),
      })
      toast.success(language === 'ar' ? 'تم إرسال رسالتك بنجاح' : 'Message sent successfully')
      setName('')
      setEmail('')
      setSubject('')
      setMessage('')
    } catch (error) {
      toast.error(language === 'ar' ? 'حدث خطأ أثناء الإرسال' : 'Error sending message')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-tamarind p-6 rounded-xl space-y-4">
      <div>
        <label className="block text-camel-coat mb-1">
          {language === 'ar' ? 'الاسم' : 'Name'}
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full p-3 rounded bg-italian-roast text-camel-coat border border-boho focus:outline-none"
        />
      </div>
      <div>
        <label className="block text-camel-coat mb-1">
          {language === 'ar' ? 'البريد الإلكتروني' : 'Email'}
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full p-3 rounded bg-italian-roast text-camel-coat border border-boho focus:outline-none"
        />
      </div>
      <div>
        <label className="block text-camel-coat mb-1">
          {language === 'ar' ? 'الموضوع' : 'Subject'}
        </label>
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="w-full p-3 rounded bg-italian-roast text-camel-coat border border-boho focus:outline-none"
        />
      </div>
      <div>
        <label className="block text-camel-coat mb-1">
          {language === 'ar' ? 'الرسالة' : 'Message'}
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          rows={5}
          className="w-full p-3 rounded bg-italian-roast text-camel-coat border border-boho focus:outline-none resize-none"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="bg-rubine text-white px-6 py-3 rounded-full hover:bg-tamarind transition disabled:opacity-50"
      >
        {loading
          ? language === 'ar'
            ? 'جارٍ الإرسال...'
            : 'Sending...'
          : language === 'ar'
          ? 'إرسال'
          : 'Send'}
      </button>
    </form>
  )
}