import { useState, useEffect } from 'react';
import Layout from '../components/Layout';

export default function ExploreSchemaPage() {
  const [connections, setConnections] = useState([]);
  const [selectedAlias, setSelectedAlias] = useState('');
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState('');
  const [columns, setColumns] = useState([]);

  const [isLoadingConnections, setIsLoadingConnections] = useState(false);
  const [errorConnections, setErrorConnections] = useState(null);

  const [isLoadingTables, setIsLoadingTables] = useState(false);
  const [errorTables, setErrorTables] = useState(null);

  const [isLoadingColumns, setIsLoadingColumns] = useState(false);
  const [errorColumns, setErrorColumns] = useState(null);

  // Fetch connections on page load
  useEffect(() => {
    const fetchConnections = async () => {
      setIsLoadingConnections(true);
      setErrorConnections(null);
      try {
        const response = await fetch('/api/connections');
        if (!response.ok) {
          throw new Error(`Error fetching connections: ${response.statusText}`);
        }
        const data = await response.json();
        setConnections(data.map(conn => conn.alias));
      } catch (err) {
        setErrorConnections(err.message);
      } finally {
        setIsLoadingConnections(false);
      }
    };
    fetchConnections();
  }, []);

  // Fetch tables when a connection alias is selected
  useEffect(() => {
    if (!selectedAlias) {
      setTables([]);
      setSelectedTable('');
      setColumns([]);
      return;
    }

    const fetchTables = async () => {
      setIsLoadingTables(true);
      setErrorTables(null);
      setTables([]); // Clear previous tables
      setSelectedTable('');
      setColumns([]); // Clear previous columns
      try {
        const response = await fetch(`/api/tables/${selectedAlias}`);
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: response.statusText }));
          throw new Error(`Error ${response.status} fetching tables: ${errorData.message || response.statusText}`);
        }
        const data = await response.json();
        setTables(data);
      } catch (err) {
        setErrorTables(err.message);
      } finally {
        setIsLoadingTables(false);
      }
    };
    fetchTables();
  }, [selectedAlias]);

  // Fetch columns when a table is selected
  useEffect(() => {
    if (!selectedAlias || !selectedTable) {
      setColumns([]);
      return;
    }

    const fetchColumns = async () => {
      setIsLoadingColumns(true);
      setErrorColumns(null);
      setColumns([]); // Clear previous columns
      try {
        // Next.js automatically handles encoding for path segments
        const response = await fetch(`/api/tables/${selectedAlias}/${selectedTable}/columns`);
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: response.statusText }));
          throw new Error(`Error ${response.status} fetching columns: ${errorData.message || response.statusText}`);
        }
        const data = await response.json();
        setColumns(data);
      } catch (err) {
        setErrorColumns(err.message);
      } finally {
        setIsLoadingColumns(false);
      }
    };
    fetchColumns();
  }, [selectedAlias, selectedTable]);

  const handleSelectAlias = (alias) => {
    setSelectedAlias(alias);
    // Reset downstream selections
    setSelectedTable(''); 
    setColumns([]);
    setErrorTables(null); // Clear previous errors
    setErrorColumns(null);
  };

  const handleSelectTable = (tableName) => {
    setSelectedTable(tableName);
     // Reset downstream selections
    setColumns([]);
    setErrorColumns(null); // Clear previous errors
  };


  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-gray-800">Explore Database Schema</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Connections Column */}
          <div className="bg-white p-6 shadow-lg rounded-lg">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">Connections</h2>
            {isLoadingConnections && <p className="text-blue-600">Loading connections...</p>}
            {errorConnections && <p className="text-red-600 bg-red-100 p-3 rounded-md">Error: {errorConnections}</p>}
            {!isLoadingConnections && !errorConnections && connections.length === 0 && (
              <p className="text-gray-500">No connections found.</p>
            )}
            <ul className="space-y-2 max-h-96 overflow-y-auto">
              {connections.map(alias => (
                <li key={alias}
                    onClick={() => handleSelectAlias(alias)}
                    className={`p-3 rounded-md cursor-pointer transition-colors duration-150 ease-in-out
                                ${selectedAlias === alias ? 'bg-blue-500 text-white shadow-md' : 'bg-gray-100 hover:bg-blue-100 text-gray-700'}`}
                >
                  {alias}
                </li>
              ))}
            </ul>
          </div>

          {/* Tables Column */}
          <div className="bg-white p-6 shadow-lg rounded-lg">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">
              Tables {selectedAlias && `in '${selectedAlias}'`}
            </h2>
            {!selectedAlias && <p className="text-gray-500">Select a connection to see tables.</p>}
            {isLoadingTables && <p className="text-blue-600">Loading tables...</p>}
            {errorTables && <p className="text-red-600 bg-red-100 p-3 rounded-md">Error: {errorTables}</p>}
            {!isLoadingTables && !errorTables && tables.length === 0 && selectedAlias && (
              <p className="text-gray-500">No tables found for this connection.</p>
            )}
            <ul className="space-y-2 max-h-96 overflow-y-auto">
              {tables.map(table => (
                <li key={table}
                    onClick={() => handleSelectTable(table)}
                    className={`p-3 rounded-md cursor-pointer transition-colors duration-150 ease-in-out
                                ${selectedTable === table ? 'bg-green-500 text-white shadow-md' : 'bg-gray-100 hover:bg-green-100 text-gray-700'}`}
                >
                  {table}
                </li>
              ))}
            </ul>
          </div>

          {/* Columns Column */}
          <div className="bg-white p-6 shadow-lg rounded-lg">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">
              Columns {selectedTable && `in '${selectedTable}'`}
            </h2>
            {!selectedTable && <p className="text-gray-500">Select a table to see columns.</p>}
            {isLoadingColumns && <p className="text-blue-600">Loading columns...</p>}
            {errorColumns && <p className="text-red-600 bg-red-100 p-3 rounded-md">Error: {errorColumns}</p>}
            {!isLoadingColumns && !errorColumns && columns.length === 0 && selectedTable && (
              <p className="text-gray-500">No columns found for this table.</p>
            )}
            {columns.length > 0 && (
              <div className="overflow-x-auto max-h-96">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nullable</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Default</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {columns.map((col) => (
                      <tr key={col.name} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{col.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{col.type}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{col.nullable ? 'Yes' : 'No'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{col.default === null || col.default === undefined ? 'N/A' : String(col.default)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
