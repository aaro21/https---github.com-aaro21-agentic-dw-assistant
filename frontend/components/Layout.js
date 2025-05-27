// frontend/components/Layout.js
import Link from 'next/link';
import { useRouter } from 'next/router'; // Import useRouter
import { useState } from 'react'; // Import useState for collapsibles

const navigationGroups = [
  { name: 'Home', href: '/' },
  {
    name: 'Discovery & Exploration',
    links: [
      { name: 'Discover Sources', href: '/discover-sources' },
      { name: 'Explore Schema', href: '/explore-schema' },
      { name: 'Browse Procedures', href: '/browse-procedures' },
    ],
  },
  {
    name: 'Analysis & Lineage',
    links: [
      { name: 'Analyze Procedure', href: '/analyze-procedure' },
      { name: 'Analyze Lineage', href: '/analyze-lineage' },
      { name: 'Procedure Lineage', href: '/lineage' }, // Assumed to be the original "Schema Lineage" or similar
      { name: 'Schema Lineage', href: '/schema-lineage' }, // Keeping this if distinct
    ],
  },
  {
    name: 'Mappings & Suggestions',
    links: [
      { name: 'Manage Source-to-Stage', href: '/manage-source-to-stage' },
      { name: 'Manage Stage-to-Bronze', href: '/manage-stage-to-bronze' },
      { name: 'Source ➝ Stage Mapping', href: '/source-map' }, // Existing "Source Map"
      { name: 'Source Suggestions', href: '/source-suggestions' }, // Existing "Suggestions"
      // Assuming "Confirm Stage Mappings" might be part of one of the manage pages or a separate link.
      // If it's a distinct page, add: { name: 'Confirm Stage Mappings', href: '/confirm-stage-mappings' },
    ],
  },
  // Add other top-level categories or individual links as needed
];

export default function Layout({ children }) {
  const router = useRouter(); // Get router instance
  const [openSections, setOpenSections] = useState({});

  const toggleSection = (name) => {
    setOpenSections(prev => ({ ...prev, [name]: !prev[name] }));
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-gray-800 text-gray-100 p-4 space-y-2 shadow-lg">
        <h1 className="text-2xl font-semibold text-white pb-4 border-b border-gray-700">Data Lineage Tool</h1>
        {navigationGroups.map((group) => (
          <div key={group.name}>
            {group.href ? (
              <Link href={group.href} legacyBehavior>
                <a className={`block py-2.5 px-4 rounded transition duration-200 hover:bg-gray-700 hover:text-white ${router.pathname === group.href ? 'bg-blue-600 text-white font-semibold' : ''}`}>
                  {group.name}
                </a>
              </Link>
            ) : (
              <div>
                <button
                  onClick={() => toggleSection(group.name)}
                  className="w-full flex justify-between items-center py-2.5 px-4 rounded transition duration-200 hover:bg-gray-700 hover:text-white focus:outline-none"
                >
                  <span className="font-semibold">{group.name}</span>
                  <span>{openSections[group.name] ? '▲' : '▼'}</span>
                </button>
                {(openSections[group.name] || group.links.some(link => router.pathname === link.href || router.pathname.startsWith(link.href + '/'))) && (
                  <div className="pl-4 mt-1 space-y-1 border-l border-gray-700 ml-2">
                    {group.links.map((link) => (
                      <Link href={link.href} key={link.name} legacyBehavior>
                        <a className={`block py-1.5 px-3 rounded transition duration-200 text-sm hover:bg-gray-600 hover:text-white ${router.pathname === link.href ? 'bg-blue-500 text-white font-medium' : 'text-gray-300'}`}>
                          {link.name}
                        </a>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 bg-gray-50">
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
            {/* You can put a dynamic header here if needed, e.g., current page title */}
            <h2 className="text-xl font-semibold text-gray-800">Dashboard</h2>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}