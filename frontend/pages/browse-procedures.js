import { useState, useEffect } from 'react';
import Layout from '../components/Layout';

export default function BrowseProceduresPage() {
  const [alias, setAlias] = useState('');
  const [procedures, setProcedures] = useState([]);
  const [selectedProcedure, setSelectedProcedure] = useState(null);
  const [procedureDefinition, setProcedureDefinition] = useState('');
  const [isLoadingProcedures, setIsLoadingProcedures] = useState(false);
  const [isLoadingDefinition, setIsLoadingDefinition] = useState(false);
  const [errorProcedures, setErrorProcedures] = useState(null);
  const [errorDefinition, setErrorDefinition] = useState(null);
  const [connectionAliases, setConnectionAliases] = useState([]);
  const [isLoadingAliases, setIsLoadingAliases] = useState(false);
  const [errorAliases, setErrorAliases] = useState(null);


  useEffect(() => {
    const fetchAliases = async () => {
      setIsLoadingAliases(true);
      setErrorAliases(null);
      try {
        const response = await fetch('/api/connections');
        if (!response.ok) {
          throw new Error(`Error: ${response.statusText}`);
        }
        const data = await response.json();
        setConnectionAliases(data.map(conn => conn.alias));
      } catch (err) {
        setErrorAliases(err.message);
      } finally {
        setIsLoadingAliases(false);
      }
    };
    fetchAliases();
  }, []);

  const handleFetchProcedures = async (currentAlias) => {
    if (!currentAlias) {
      setProcedures([]);
      setSelectedProcedure(null);
      setProcedureDefinition('');
      return;
    }
    setIsLoadingProcedures(true);
    setErrorProcedures(null);
    setProcedures([]);
    setSelectedProcedure(null);
    setProcedureDefinition('');

    try {
      const response = await fetch(`/api/procedures/${currentAlias}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(`Error ${response.status}: ${errorData.message || response.statusText}`);
      }
      const data = await response.json();
      setProcedures(data);
    } catch (err) {
      setErrorProcedures(err.message);
    } finally {
      setIsLoadingProcedures(false);
    }
  };

  const handleAliasChange = (e) => {
    const newAlias = e.target.value;
    setAlias(newAlias);
    if (newAlias) {
        handleFetchProcedures(newAlias);
    } else {
        setProcedures([]);
        setSelectedProcedure(null);
        setProcedureDefinition('');
        setErrorProcedures(null);
        setErrorDefinition(null);
    }
  };

  const handleProcedureClick = async (procName) => {
    if (!alias || !procName) return;
    setSelectedProcedure(procName);
    setIsLoadingDefinition(true);
    setErrorDefinition(null);
    setProcedureDefinition('');

    try {
      const response = await fetch(`/api/procedures/${alias}/${procName}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(`Error ${response.status}: ${errorData.message || response.statusText}`);
      }
      const data = await response.json();
      setProcedureDefinition(data.definition);
    } catch (err) {
      setErrorDefinition(err.message);
    } finally {
      setIsLoadingDefinition(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Browse Stored Procedures</h1>

        <div className="mb-6">
          <label htmlFor="alias" className="block text-sm font-medium text-gray-700 mb-1">
            Select Connection Alias:
          </label>
          {isLoadingAliases && <p>Loading aliases...</p>}
          {errorAliases && <p className="text-red-500">Failed to load aliases: {errorAliases}</p>}
          {connectionAliases.length > 0 && !isLoadingAliases && (
            <select
              id="alias"
              value={alias}
              onChange={handleAliasChange}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md shadow-sm"
            >
              <option value="">-- Select an Alias --</option>
              {connectionAliases.map(connAlias => (
                <option key={connAlias} value={connAlias}>{connAlias}</option>
              ))}
            </select>
          )}
          {!isLoadingAliases && !errorAliases && connectionAliases.length === 0 && (
            <p className="text-gray-500">No connection aliases found. Please add a connection first.</p>
          )}
        </div>

        {/* Removed manual "Fetch Procedures" button as it's triggered by alias change now */}

        {isLoadingProcedures && (
          <div className="mt-4 text-blue-500">Loading procedures...</div>
        )}
        {errorProcedures && (
          <div className="mt-4 p-4 bg-red-100 text-red-700 border border-red-400 rounded-md">
            <p>Failed to fetch procedures: {errorProcedures}</p>
          </div>
        )}

        {procedures.length > 0 && !isLoadingProcedures && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 bg-white p-6 shadow-md rounded-lg max-h-96 overflow-y-auto">
              <h2 className="text-xl font-semibold mb-4">Procedures in '{alias}'</h2>
              <ul className="space-y-2">
                {procedures.map((proc) => (
                  <li key={proc}
                      onClick={() => handleProcedureClick(proc)}
                      className={`p-2 rounded-md cursor-pointer hover:bg-gray-200 ${selectedProcedure === proc ? 'bg-blue-100 text-blue-700 font-semibold' : 'text-gray-700'}`}
                  >
                    {proc}
                  </li>
                ))}
              </ul>
            </div>

            <div className="md:col-span-2">
              {isLoadingDefinition && (
                <div className="text-blue-500">Loading procedure definition...</div>
              )}
              {errorDefinition && (
                <div className="p-4 bg-red-100 text-red-700 border border-red-400 rounded-md">
                  <p>Failed to fetch definition: {errorDefinition}</p>
                </div>
              )}
              {procedureDefinition && !isLoadingDefinition && (
                <div className="bg-white p-6 shadow-md rounded-lg">
                  <h2 className="text-xl font-semibold mb-4">Definition for '{selectedProcedure}'</h2>
                  <pre className="bg-gray-800 text-white p-4 rounded-md overflow-x-auto max-h-[600px]">
                    <code>{procedureDefinition}</code>
                  </pre>
                </div>
              )}
              {!selectedProcedure && !isLoadingDefinition && !errorDefinition && (
                <div className="bg-white p-6 shadow-md rounded-lg text-gray-500">
                  <p>Select a procedure from the list to see its definition.</p>
                </div>
              )}
            </div>
          </div>
        )}
        {procedures.length === 0 && alias && !isLoadingProcedures && !errorProcedures && (
            <div className="mt-8 text-gray-500">
                <p>No procedures found for alias '{alias}'.</p>
            </div>
        )}
      </div>
    </Layout>
  );
}
