import { useState } from 'react';
import Layout from '../components/Layout';

export default function AnalyzeLineagePage() {
  const [procedureName, setProcedureName] = useState('');
  const [database, setDatabase] = useState('');
  const [content, setContent] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleAnalyzeLineage = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);
    setSaveSuccess(false);
    setSaveError(null);

    try {
      const response = await fetch('/api/lineage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          procedure_name: procedureName,
          database,
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

  const handleSaveLineage = async () => {
    if (!analysisResult) return;
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const response = await fetch('/api/lineage/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          procedure_name: procedureName,
          database,
          content,
          lineage: analysisResult,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(`Error ${response.status}: ${errorData.message || response.statusText}`);
      }
      setSaveSuccess(true);
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Analyze Procedure for Lineage</h1>

        <form onSubmit={handleAnalyzeLineage} className="space-y-6 bg-white p-6 shadow-md rounded-lg">
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
            <label htmlFor="database" className="block text-sm font-medium text-gray-700">
              Database
            </label>
            <input
              type="text"
              id="database"
              value={database}
              onChange={(e) => setDatabase(e.target.value)}
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
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
          >
            {isLoading ? 'Analyzing...' : 'Analyze Lineage'}
          </button>
        </form>

        {error && (
          <div className="mt-6 p-4 bg-red-100 text-red-700 border border-red-400 rounded-md">
            <p>Failed to analyze lineage: {error}</p>
          </div>
        )}

        {analysisResult && (
          <div className="mt-8 bg-white p-6 shadow-md rounded-lg">
            <h2 className="text-2xl font-semibold mb-4">Analysis Result</h2>
            <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto">
              {JSON.stringify(analysisResult, null, 2)}
            </pre>
            <button
              onClick={handleSaveLineage}
              disabled={isSaving}
              className="mt-6 w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Lineage'}
            </button>
            {saveSuccess && (
              <div className="mt-4 p-3 bg-green-100 text-green-700 border border-green-400 rounded-md">
                Lineage saved successfully!
              </div>
            )}
            {saveError && (
              <div className="mt-4 p-3 bg-red-100 text-red-700 border border-red-400 rounded-md">
                Failed to save lineage: {saveError}
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
