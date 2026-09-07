import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
      <h1 className="text-6xl font-bold text-rubine mb-4">404</h1>
      <p className="text-2xl text-camel-coat mb-8">الصفحة غير موجودة</p>
      <Link
        href="/"
        className="bg-rubine text-white px-8 py-3 rounded-full hover:bg-tamarind transition"
      >
        العودة للرئيسية
      </Link>
    </div>
  )
}
