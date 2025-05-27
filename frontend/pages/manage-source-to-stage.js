import { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';

const initialFormData = {
  source_type: '',
  source_host: '',
  source_db: '',
  source_schema: '',
  source_table: '',
  stage_db: '',
  stage_schema: '',
  stage_table: '',
  connection_name: '',
  notes: '',
};

export default function ManageSourceToStagePage() {
  const [mappings, setMappings] = useState([]);
  const [isLoadingMappings, setIsLoadingMappings] = useState(false);
  const [errorMappings, setErrorMappings] = useState(null);

  const [formData, setFormData] = useState(initialFormData);
  const [isSavingMapping, setIsSavingMapping] = useState(false);
  const [saveMappingSuccess, setSaveMappingSuccess] = useState(false);
  const [errorSavingMapping, setErrorSavingMapping] = useState(null);

  const [isAutoMapping, setIsAutoMapping] = useState(false);
  const [autoMapResult, setAutoMapResult] = useState(null);
  const [errorAutoMapping, setErrorAutoMapping] = useState(null);

  const [discoverSourceAlias, setDiscoverSourceAlias] = useState('');
  const [discoverStageAlias, setDiscoverStageAlias] = useState('');
  const [discoveredMappings, setDiscoveredMappings] = useState([]);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [errorDiscovering, setErrorDiscovering] = useState(null);

  const fetchMappings = useCallback(async () => {
    setIsLoadingMappings(true);
    setErrorMappings(null);
    try {
      const response = await fetch('/api/source-to-stage-map');
      if (!response.ok) {
        throw new Error(`Error fetching mappings: ${response.statusText}`);
      }
      const data = await response.json();
      setMappings(data);
    } catch (err) {
      setErrorMappings(err.message);
    } finally {
      setIsLoadingMappings(false);
    }
  }, []);

  useEffect(() => {
    fetchMappings();
  }, [fetchMappings]);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveNewMapping = async (e) => {
    e.preventDefault();
    setIsSavingMapping(true);
    setErrorSavingMapping(null);
    setSaveMappingSuccess(false);
    try {
      const response = await fetch('/api/source-to-stage-map', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({message: response.statusText}));
        throw new Error(errData.message || `Error: ${response.statusText}`);
      }
      setSaveMappingSuccess(true);
      setFormData(initialFormData); // Reset form
      fetchMappings(); // Refresh list
    } catch (err) {
      setErrorSavingMapping(err.message);
    } finally {
      setIsSavingMapping(false);
    }
  };

  const handleAutoMap = async () => {
    setIsAutoMapping(true);
    setErrorAutoMapping(null);
    setAutoMapResult(null);
    try {
      const response = await fetch('/api/source-to-stage/auto-map', { method: 'POST' });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({message: response.statusText}));
        throw new Error(errData.message || `Error: ${response.statusText}`);
      }
      const data = await response.json();
      setAutoMapResult(data);
      fetchMappings(); // Refresh list
    } catch (err) {
      setErrorAutoMapping(err.message);
    } finally {
      setIsAutoMapping(false);
    }
  };

  const handleDiscoverMappings = async (e) => {
    e.preventDefault();
    setIsDiscovering(true);
    setErrorDiscovering(null);
    setDiscoveredMappings([]);
    try {
      const response = await fetch(`/api/source-to-stage/discover/${discoverSourceAlias}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage_alias: discoverStageAlias }),
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({message: response.statusText}));
        throw new Error(errData.message || `Error: ${response.statusText}`);
      }
      const data = await response.json();
      setDiscoveredMappings(data);
    } catch (err) {
      setErrorDiscovering(err.message);
    } finally {
      setIsDiscovering(false);
    }
  };
  
  const promoteDiscoveredMapping = (mapping) => {
    setFormData({
        source_type: mapping.source_type || '',
        source_host: mapping.source_host || '',
        source_db: mapping.source_db_name || '', // Field name might differ
        source_schema: mapping.source_schema_name || '',
        source_table: mapping.source_table_name || '',
        stage_db: mapping.stage_db_name || '',
        stage_schema: mapping.stage_schema_name || '',
        stage_table: mapping.stage_table_name || '',
        connection_name: mapping.connection_name || discoverSourceAlias, // Or a specific field if available
        notes: `Promoted from discovery (Source: ${discoverSourceAlias}, Stage: ${discoverStageAlias})`,
    });
    // Scroll to the "Add New Mapping" form or highlight it
    document.getElementById('add-new-mapping-form')?.scrollIntoView({ behavior: 'smooth' });
  };


  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 space-y-12">
        <h1 className="text-4xl font-bold text-gray-800 mb-10 text-center">Manage Source-to-Stage Mappings</h1>

        {/* Existing Mappings Section */}
        <section className="bg-white p-6 shadow-xl rounded-lg">
          <h2 className="text-2xl font-semibold text-gray-700 mb-6">Existing Mappings</h2>
          {isLoadingMappings && <p className="text-blue-600">Loading mappings...</p>}
          {errorMappings && <p className="text-red-600 bg-red-100 p-3 rounded-md">Error: {errorMappings}</p>}
          {!isLoadingMappings && !errorMappings && mappings.length === 0 && (
            <p className="text-gray-500">No mappings found.</p>
          )}
          {!isLoadingMappings && !errorMappings && mappings.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {['Source Type', 'Source Host', 'Source DB', 'Source Schema', 'Source Table', 'Stage DB', 'Stage Schema', 'Stage Table', 'Connection Name', 'Notes', 'Created At'].map(header => (
                      <th key={header} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {mappings.map((m, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{m.source_type}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{m.source_host}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{m.source_db}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{m.source_schema}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{m.source_table}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{m.stage_db}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{m.stage_schema}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{m.stage_table}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{m.connection_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 max-w-xs truncate">{m.notes}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(m.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Add New Mapping Section */}
          <section id="add-new-mapping-form" className="bg-white p-6 shadow-xl rounded-lg">
            <h2 className="text-2xl font-semibold text-gray-700 mb-6">Add New Mapping</h2>
            <form onSubmit={handleSaveNewMapping} className="space-y-4">
              {Object.keys(initialFormData).map(key => (
                <div key={key}>
                  <label htmlFor={key} className="block text-sm font-medium text-gray-700 capitalize">{key.replace(/_/g, ' ')}</label>
                  <input
                    type="text"
                    name={key}
                    id={key}
                    value={formData[key]}
                    onChange={handleFormChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    required={!['source_host', 'notes'].includes(key)} // Example: make some fields optional
                  />
                </div>
              ))}
              <button
                type="submit"
                disabled={isSavingMapping}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
              >
                {isSavingMapping ? 'Saving...' : 'Save New Mapping'}
              </button>
              {saveMappingSuccess && <p className="text-green-600 mt-2">Mapping saved successfully!</p>}
              {errorSavingMapping && <p className="text-red-600 bg-red-100 p-3 rounded-md mt-2">Error: {errorSavingMapping}</p>}
            </form>
          </section>

          {/* Actions Section (Auto-map & Discover) */}
          <div className="space-y-8">
            {/* Auto-map Section */}
            <section className="bg-white p-6 shadow-xl rounded-lg">
              <h2 className="text-2xl font-semibold text-gray-700 mb-6">Auto-map Source to Stage</h2>
              <button
                onClick={handleAutoMap}
                disabled={isAutoMapping}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
              >
                {isAutoMapping ? 'Processing...' : 'Run Auto-mapping'}
              </button>
              {autoMapResult && (
                <div className="mt-4 text-green-700 bg-green-100 p-3 rounded-md">
                  <p>Auto-mapping complete!</p>
                  <p>Mappings created: {autoMapResult.created_count || 0}</p>
                  <p>Mappings updated: {autoMapResult.updated_count || 0}</p>
                  <p>Total considered: {autoMapResult.total_considered || 0}</p>
                </div>
              )}
              {errorAutoMapping && <p className="text-red-600 bg-red-100 p-3 rounded-md mt-4">Error: {errorAutoMapping}</p>}
            </section>

            {/* Discover Mappings Section */}
            <section className="bg-white p-6 shadow-xl rounded-lg">
              <h2 className="text-2xl font-semibold text-gray-700 mb-6">Discover Potential Mappings</h2>
              <form onSubmit={handleDiscoverMappings} className="space-y-4">
                <div>
                  <label htmlFor="discoverSourceAlias" className="block text-sm font-medium text-gray-700">Source Connection Alias</label>
                  <input
                    type="text"
                    id="discoverSourceAlias"
                    value={discoverSourceAlias}
                    onChange={(e) => setDiscoverSourceAlias(e.target.value)}
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="discoverStageAlias" className="block text-sm font-medium text-gray-700">Stage Connection Alias</label>
                  <input
                    type="text"
                    id="discoverStageAlias"
                    value={discoverStageAlias}
                    onChange={(e) => setDiscoverStageAlias(e.target.value)}
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isDiscovering}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
                >
                  {isDiscovering ? 'Discovering...' : 'Discover Mappings'}
                </button>
              </form>
              {errorDiscovering && <p className="text-red-600 bg-red-100 p-3 rounded-md mt-4">Error: {errorDiscovering}</p>}
              {discoveredMappings.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-xl font-semibold text-gray-700 mb-3">Proposed Mappings</h3>
                  <div className="overflow-x-auto max-h-96">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          {['Source DB', 'Source Schema', 'Source Table', 'Stage DB', 'Stage Schema', 'Stage Table', 'Action'].map(header => (
                            <th key={header} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{header}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {discoveredMappings.map((pMap, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="px-4 py-2 whitespace-nowrap text-sm">{pMap.source_db_name}</td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm">{pMap.source_schema_name}</td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm">{pMap.source_table_name}</td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm">{pMap.stage_db_name}</td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm">{pMap.stage_schema_name}</td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm">{pMap.stage_table_name}</td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm">
                              <button 
                                onClick={() => promoteDiscoveredMapping(pMap)}
                                className="text-indigo-600 hover:text-indigo-900 text-xs py-1 px-2 border border-indigo-500 rounded hover:bg-indigo-50"
                              >
                                Promote
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              {!isDiscovering && discoveredMappings.length === 0 && !errorDiscovering && (
                <p className="text-gray-500 mt-4">No potential mappings discovered or discovery not yet run.</p>
              )}
            </section>
          </div>
        </div>
      </div>
    </Layout>
  );
}
