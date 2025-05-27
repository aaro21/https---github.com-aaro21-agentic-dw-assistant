import { useState } from 'react';
import Layout from '../components/Layout';

export default function AnalyzeProcedurePage() {
  const [procedureName, setProcedureName] = useState('');
  const [dbAlias, setDbAlias] = useState('');
  const [content, setContent] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAnalyzeProcedure = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          procedure_name: procedureName,
          db_alias: dbAlias,
          content,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(`Error ${response.status}: ${errorData.message || response.statusText}`);
      }
      const data = await response.json();
      setAnalysisResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Analyze Stored Procedure</h1>

        <form onSubmit={handleAnalyzeProcedure} className="space-y-6 bg-white p-6 shadow-md rounded-lg">
          <div>
            <label htmlFor="procedureName" className="block text-sm font-medium text-gray-700">
              Procedure Name
            </label>
            <input
              type="text"
              id="procedureName"
              value={procedureName}
              onChange={(e) => setProcedureName(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="dbAlias" className="block text-sm font-medium text-gray-700">
              DB Alias
            </label>
            <input
              type="text"
              id="dbAlias"
              value={dbAlias}
              onChange={(e) => setDbAlias(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-700">
              SQL Content
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows="10"
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Enter the SQL content of the stored procedure here..."
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
          >
            {isLoading ? 'Analyzing...' : 'Analyze Procedure'}
          </button>
        </form>

        {error && (
          <div className="mt-6 p-4 bg-red-100 text-red-700 border border-red-400 rounded-md">
            <p>Failed to analyze procedure: {error}</p>
          </div>
        )}

        {analysisResult && (
          <div className="mt-8 bg-white p-6 shadow-md rounded-lg">
            <h2 className="text-2xl font-semibold mb-4">Analysis Result</h2>
            <div className="mb-4">
              <h3 className="text-lg font-medium text-gray-900">Summary:</h3>
              <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto whitespace-pre-wrap">
                {analysisResult.summary}
              </pre>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">Cached:</h3>
              <p className={`text-md ${analysisResult.cached ? 'text-green-600' : 'text-yellow-600'}`}>
                {analysisResult.cached ? 'Yes, this result was retrieved from cache.' : 'No, this result was newly generated.'}
              </p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
