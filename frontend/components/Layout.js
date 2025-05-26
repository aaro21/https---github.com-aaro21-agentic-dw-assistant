// frontend/components/Layout.js
import Link from 'next/link';

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-700 text-white py-4 shadow">
        <nav className="max-w-6xl mx-auto px-4 flex flex-wrap gap-6 text-sm">
          <Link href="/" className="hover:underline">Home</Link>
          <Link href="/lineage" className="hover:underline">Procedure Lineage</Link>
          <Link href="/schema-lineage" className="hover:underline">Schema Lineage</Link>
          <Link href="/source-map" className="hover:underline">Source ➝ Stage Mapping</Link>
          <Link href="/source-suggestions" className="hover:underline">Suggestions</Link>
        </nav>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
}