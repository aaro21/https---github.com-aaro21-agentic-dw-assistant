import { useState, useEffect } from 'react';
import Layout from '../components/Layout';

export default function ManageStageToBronzePage() {
  const [suggestions, setSuggestions] = useState([]);
  const [selectedSuggestions, setSelectedSuggestions] = useState({}); // Using an object for easy toggle
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [errorSuggestions, setErrorSuggestions] = useState(null);

  const [stageDatabase, setStageDatabase] = useState('');
  const [bronzeDatabase, setBronzeDatabase] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState('');
  const [errorSaving, setErrorSaving] = useState(null);

  const handleSuggestMappings = async () => {
    setIsLoadingSuggestions(true);
    setErrorSuggestions(null);
    setSuggestions([]);
    setSelectedSuggestions({});
    setSaveSuccessMessage('');
    setErrorSaving(null);
    try {
      const response = await fetch('/api/stage-to-bronze-map/suggest', { method: 'POST' });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(errData.message || `Error: ${response.statusText}`);
      }
      const data = await response.json();
      setSuggestions(data);
    } catch (err) {
      setErrorSuggestions(err.message);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const toggleSelection = (index) => {
    setSelectedSuggestions(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const getSelectedItems = () => {
    return suggestions.filter((_, index) => selectedSuggestions[index]);
  };

  const handleSaveSelected = async () => {
    const itemsToSave = getSelectedItems();
    if (itemsToSave.length === 0) {
      setErrorSaving("No suggestions selected to save.");
      return;
    }
    if (!stageDatabase.trim() || !bronzeDatabase.trim()) {
        setErrorSaving("Please provide Stage Database Name and Bronze Database Name for saving.");
        return;
    }

    setIsSaving(true);
    setErrorSaving(null);
    setSaveSuccessMessage('');

    const payload = itemsToSave.map(sugg => ({
      stage_database: stageDatabase,
      stage_schema: sugg.stage_schema,
      stage_table: sugg.stage_table,
      bronze_database: bronzeDatabase,
      bronze_schema: sugg.bronze_schema,
      bronze_table: sugg.bronze_table,
      // Add any other required fields from your StageToBronzeMapping model,
      // potentially with default values or more form inputs if needed.
      // e.g., notes: "Created from suggestion"
    }));

    try {
      const response = await fetch('/api/stage-to-bronze-map/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(errData.error || errData.message || `Error: ${response.statusText}`);
      }
      const result = await response.json();
      setSaveSuccessMessage(`${result.saved_count || payload.length} mappings saved successfully!`);
      setSelectedSuggestions({}); // Clear selections
      // Optionally, refresh suggestions or clear the list:
      // setSuggestions([]); 
    } catch (err) {
      setErrorSaving(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const numSelected = getSelectedItems().length;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 space-y-12">
        <h1 className="text-4xl font-bold text-gray-800 mb-10 text-center">Manage Stage-to-Bronze Mappings</h1>

        {/* Suggest Mappings Section */}
        <section className="bg-white p-6 shadow-xl rounded-lg">
          <h2 className="text-2xl font-semibold text-gray-700 mb-6">1. Suggest Mappings</h2>
          <button
            onClick={handleSuggestMappings}
            disabled={isLoadingSuggestions}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50 mb-4"
          >
            {isLoadingSuggestions ? 'Loading Suggestions...' : 'Suggest Stage-to-Bronze Mappings'}
          </button>

          {errorSuggestions && <p className="text-red-600 bg-red-100 p-3 rounded-md">Error: {errorSuggestions}</p>}
          
          {suggestions.length > 0 && !errorSuggestions && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left w-12">
                      <input 
                        type="checkbox"
                        className="form-checkbox h-5 w-5 text-blue-600"
                        onChange={(e) => {
                            const newSelected = {};
                            if (e.target.checked) {
                                suggestions.forEach((_, index) => newSelected[index] = true);
                            }
                            setSelectedSuggestions(newSelected);
                        }}
                        checked={numSelected > 0 && numSelected === suggestions.length}
                        />
                    </th>
                    {['Stage Schema', 'Stage Table', 'Bronze Schema', 'Bronze Table'].map(header => (
                      <th key={header} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {suggestions.map((sugg, index) => (
                    <tr key={index} className={`hover:bg-gray-50 ${selectedSuggestions[index] ? 'bg-blue-50' : ''}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input 
                          type="checkbox"
                          className="form-checkbox h-5 w-5 text-blue-600"
                          checked={!!selectedSuggestions[index]}
                          onChange={() => toggleSelection(index)}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{sugg.stage_schema}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{sugg.stage_table}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{sugg.bronze_schema}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{sugg.bronze_table}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {!isLoadingSuggestions && suggestions.length === 0 && !errorSuggestions && (
            <p className="text-gray-500">No suggestions available. Click the button to generate them.</p>
          )}
        </section>

        {/* Save Selected Mappings Section */}
        {suggestions.length > 0 && (
          <section className="bg-white p-6 shadow-xl rounded-lg">
            <h2 className="text-2xl font-semibold text-gray-700 mb-6">2. Save Selected Mappings</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                    <label htmlFor="stageDatabase" className="block text-sm font-medium text-gray-700">
                        Stage Database Name (for saving)
                    </label>
                    <input
                        type="text"
                        id="stageDatabase"
                        value={stageDatabase}
                        onChange={(e) => setStageDatabase(e.target.value)}
                        required
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        placeholder="e.g., STAGE_DB"
                    />
                </div>
                <div>
                    <label htmlFor="bronzeDatabase" className="block text-sm font-medium text-gray-700">
                        Bronze Database Name (for saving)
                    </label>
                    <input
                        type="text"
                        id="bronzeDatabase"
                        value={bronzeDatabase}
                        onChange={(e) => setBronzeDatabase(e.target.value)}
                        required
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        placeholder="e.g., BRONZE_DB"
                    />
                </div>
            </div>
            <button
              onClick={handleSaveSelected}
              disabled={isSaving || numSelected === 0 || !stageDatabase.trim() || !bronzeDatabase.trim()}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : `Save ${numSelected} Selected Mapping(s)`}
            </button>
            {saveSuccessMessage && <p className="text-green-600 mt-3 bg-green-50 p-3 rounded-md">{saveSuccessMessage}</p>}
            {errorSaving && <p className="text-red-600 bg-red-100 p-3 rounded-md mt-3">Error: {errorSaving}</p>}
          </section>
        )}
      </div>
    </Layout>
  );
}
