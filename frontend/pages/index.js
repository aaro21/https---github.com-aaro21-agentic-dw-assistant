// frontend/pages/index.js
import { useEffect, useState } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomOneDark } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import SchemaLineagePanel from '../components/SchemaLineagePanel';

export default function Home() {
  const [connections, setConnections] = useState([]);
  const [selectedConnection, setSelectedConnection] = useState(null);
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [columns, setColumns] = useState([]);
  const [procedures, setProcedures] = useState([]);
  const [procSearch, setProcSearch] = useState("");
  const [selectedProc, setSelectedProc] = useState(null);
  const [procBody, setProcBody] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [analysisCached, setAnalysisCached] = useState(false);
  const [procStatusMap, setProcStatusMap] = useState({});

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000';

  useEffect(() => {
    axios.get(`${API_BASE}/connections`)
      .then(res => setConnections(res.data))
      .catch(err => setError(err.message));
  }, []);

  const fetchTables = (alias) => {
    setSelectedConnection(alias);
    setSelectedTable(null);
    setColumns([]);
    setProcedures([]);
    setProcSearch("");
    setSelectedProc(null);
    setProcBody("");
    setAnalysis(null);
    setAnalysisCached(false);
    setProcStatusMap({});

    axios.get(`${API_BASE}/tables/${alias}`)
      .then(res => setTables(res.data))
      .catch(err => setError(err.message));

    axios.get(`${API_BASE}/procedures/${alias}`)
      .then(res => setProcedures(res.data))
      .catch(err => setError(err.message));

    axios.get(`${API_BASE}/analyze/status/${alias}`)
      .then(res => setProcStatusMap(res.data))
      .catch(err => console.error("Status fetch failed", err));
  };

  const fetchColumns = (alias, table) => {
    setSelectedTable(table);
    setColumns([]);
    axios.get(`${API_BASE}/tables/${alias}/${table}/columns`)
      .then(res => setColumns(res.data))
      .catch(err => setError(err.message));
  };

  const fetchProcedure = (alias, procName) => {
    setSelectedProc(procName);
    setAnalysis(null);
    setAnalysisCached(false);
    axios.get(`${API_BASE}/procedures/${alias}/${procName}`)
      .then(res => setProcBody(res.data.definition))
      .catch(err => setError(err.message));
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setAnalysis(null);
    setAnalysisCached(false);
    try {
      const res = await axios.post(`${API_BASE}/analyze`, {
        content: procBody,
        db_alias: selectedConnection,
        procedure_name: selectedProc,
      });
      setAnalysis(res.data.summary);
      setAnalysisCached(res.data.cached);

      const statusRes = await axios.get(`${API_BASE}/analyze/status/${selectedConnection}`);
      setProcStatusMap(statusRes.data);
    } catch (err) {
      setAnalysis("Error analyzing procedure: " + err.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const filteredProcedures = procedures.filter(proc =>
    proc.toLowerCase().includes(procSearch.toLowerCase())
  );

  const statusBadge = (status) => {
    switch (status) {
      case "up_to_date": return <span className="ml-2 text-green-700 text-xs">🟢 Up-to-date</span>;
      case "outdated": return <span className="ml-2 text-yellow-700 text-xs">🟡 Outdated</span>;
      case "not_analyzed": return <span className="ml-2 text-gray-500 text-xs">⚪ Not analyzed</span>;
      default: return null;
    }
  };

  return (
  <div className="p-6 min-h-screen bg-gray-50 font-sans">
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">📦 Data Warehouse Schema Explorer</h1>

      {/* ✅ Add SchemaLineagePanel here */}
      <SchemaLineagePanel connections={connections} />

      {error && <p className="text-red-600">Error: {error}</p>}

        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Connections</h2>
          <div className="flex flex-wrap gap-3">
            {connections.map(conn => (
              <button
                key={conn}
                onClick={() => fetchTables(conn)}
                className={`px-4 py-2 rounded shadow text-sm font-medium transition ${
                  conn === selectedConnection ? 'bg-blue-600 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
                }`}
              >
                {conn}
              </button>
            ))}
          </div>
        </div>

        {procedures.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-700 mb-2">Stored Procedures in <span className="text-blue-600">{selectedConnection}</span></h2>
            <input
              type="text"
              value={procSearch}
              onChange={e => setProcSearch(e.target.value)}
              placeholder="Search procedures..."
              className="mb-3 w-full px-3 py-2 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <div className="bg-white shadow rounded p-4">
              <ul className="space-y-1">
                {filteredProcedures.map(proc => (
                  <li key={proc} className="flex items-center justify-between">
                    <button
                      onClick={() => fetchProcedure(selectedConnection, proc)}
                      className={`text-left px-2 py-1 rounded flex-grow ${
                        proc === selectedProc ? 'bg-green-100 text-green-800 font-semibold' : 'hover:bg-gray-100 text-gray-800'
                      }`}
                    >
                      {proc} {statusBadge(procStatusMap[proc])}
                    </button>
                    <Link
                      href={`/lineage?procedure_name=${encodeURIComponent(proc)}`}
                      className="ml-3 text-blue-500 text-sm underline hover:text-blue-700"
                    >
                      View Lineage
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            {procBody && (
              <div className="mt-8 bg-white p-4 rounded shadow">
                <h2 className="text-lg font-semibold text-gray-700 mb-2">📜 Definition for {selectedProc}</h2>
                <SyntaxHighlighter language="sql" style={atomOneDark} wrapLongLines>
                  {procBody}
                </SyntaxHighlighter>
              </div>
            )}
            {analysis && (
              <div className="mt-6 bg-white p-4 rounded shadow">
                <h2 className="text-lg font-semibold text-gray-700 mb-2">🧠 AI Summary</h2>
                <pre className="whitespace-pre-wrap text-sm text-gray-800">
                  {analysis}
                </pre>
                {analysisCached && (
                  <p className="text-xs text-gray-500 mt-1">(cached result)</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}