'use client'
import { useState, useEffect } from 'react'
import { db } from '@/lib/firebase'
import { collection, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore'
import toast from 'react-hot-toast'
import { Trash2, MailOpen } from 'lucide-react'

type Message = {
  id: string
  name: string
  email: string
  subject?: string
  message: string
  read: boolean
  createdAt?: any
}

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMessages()
  }, [])

  const fetchMessages = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'messages'))
      const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Message))
      // فرز يدوي تنازلي حسب createdAt
      list.sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() || 0
        const bTime = b.createdAt?.toMillis?.() || 0
        return bTime - aTime
      })
      setMessages(list)
    } catch (error) {
      toast.error('تعذر جلب الرسائل')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('حذف هذه الرسالة؟')) {
      try {
        await deleteDoc(doc(db, 'messages', id))
        toast.success('تم الحذف')
        fetchMessages()
      } catch (error) {
        toast.error('تعذر الحذف')
      }
    }
  }

  const handleMarkRead = async (id: string) => {
    try {
      await updateDoc(doc(db, 'messages', id), { read: true })
      fetchMessages()
    } catch (error) {
      toast.error('تعذر التحديث')
    }
  }

  if (loading) return <div className="p-8 text-center">جارٍ التحميل...</div>

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">الرسائل</h1>
      {messages.length === 0 ? (
        <p className="text-center text-boho py-12">لا توجد رسائل</p>
      ) : (
        <div className="space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`bg-tamarind p-4 rounded-xl ${!msg.read ? 'border-r-4 border-rubine' : ''}`}>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="font-bold">{msg.name}</span>
                  <span className="text-boho text-sm mr-2">{msg.email}</span>
                </div>
                <div className="flex gap-2">
                  {!msg.read && (
                    <button onClick={() => handleMarkRead(msg.id)} className="text-green-500 hover:text-green-700">
                      <MailOpen size={16} />
                    </button>
                  )}
                  <button onClick={() => handleDelete(msg.id)} className="text-red-500 hover:text-red-700">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              {msg.subject && <p className="text-camel-coat font-semibold">{msg.subject}</p>}
              <p className="text-boho text-sm mt-1 whitespace-pre-line">{msg.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}