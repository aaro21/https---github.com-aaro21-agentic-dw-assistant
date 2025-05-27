import { useState } from 'react';
import Layout from '../components/Layout';

export default function DiscoverSourcesPage() {
  const [sources, setSources] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleDiscoverSources = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/sources/discover', { method: 'POST' });
      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }
      const data = await response.json();
      setSources(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Discover Source Tables</h1>
        <button
          onClick={handleDiscoverSources}
          disabled={isLoading}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
        >
          {isLoading ? 'Loading...' : 'Discover Sources'}
        </button>

        {error && (
          <div className="mt-4 text-red-500">
            <p>Failed to discover sources: {error}</p>
          </div>
        )}

        {sources.length > 0 && (
          <div className="mt-8 overflow-x-auto">
            <table className="min-w-full bg-white shadow-md rounded-lg">
              <thead className="bg-gray-200 text-gray-700">
                <tr>
                  <th className="py-3 px-4 text-left">Connection Alias</th>
                  <th className="py-3 px-4 text-left">Source Type</th>
                  <th className="py-3 px-4 text-left">Schema Name</th>
                  <th className="py-3 px-4 text-left">Table Name</th>
                  <th className="py-3 px-4 text-left">Database Name</th>
                  <th className="py-3 px-4 text-left">Last Seen</th>
                </tr>
              </thead>
              <tbody className="text-gray-700">
                {sources.map((source, index) => (
                  <tr key={index} className="border-b border-gray-200 hover:bg-gray-100">
                    <td className="py-3 px-4">{source.connection_alias}</td>
                    <td className="py-3 px-4">{source.source_type}</td>
                    <td className="py-3 px-4">{source.schema_name}</td>
                    <td className="py-3 px-4">{source.table_name}</td>
                    <td className="py-3 px-4">{source.database_name}</td>
                    <td className="py-3 px-4">{new Date(source.last_seen).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
         {sources.length === 0 && !isLoading && !error && (
          <div className="mt-8 text-gray-500">
            <p>No sources discovered yet. Click the button to start.</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
