// frontend/components/SchemaLineagePanel.js
import { useState, useEffect } from 'react';
import axios from 'axios';

export default function SchemaLineagePanel({ connections }) {
  const [selectedConn, setSelectedConn] = useState(null);
  const [schemas, setSchemas] = useState([]);
  const [selectedSchema, setSelectedSchema] = useState(null);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000';

  useEffect(() => {
    if (!selectedConn) return;
    axios.get(`${API_BASE}/tables/${selectedConn}`)
      .then(res => {
        const uniqueSchemas = [...new Set(res.data.map(t => t.split('.')[0]))];
        setSchemas(uniqueSchemas);
        if (uniqueSchemas.length > 0) setSelectedSchema(uniqueSchemas[0]);
      });
  }, [selectedConn]);

  const handleAnalyze = async () => {
    if (!selectedConn || !selectedSchema) return;
    setLoading(true);
    setStatus(null);
    try {
      const res = await axios.post(`${API_BASE}/lineage/bulk/by-schema`, {
        alias: selectedConn,
        schema: selectedSchema,
      });
      setStatus(`✅ Processed ${res.data.total} procedures.`);
    } catch (err) {
      setStatus(`❌ Error: ${err.response?.data?.detail || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-4 rounded shadow mt-8">
      <h2 className="text-lg font-semibold mb-2">📁 Analyze Schema Lineage</h2>

      <label className="block mb-1 text-sm font-medium text-gray-700">Connection</label>
      <select className="w-full mb-3 border rounded p-2" onChange={e => setSelectedConn(e.target.value)}>
        <option value="">-- Select Connection --</option>
        {connections.map(conn => (
          <option key={conn} value={conn}>{conn}</option>
        ))}
      </select>

      <label className="block mb-1 text-sm font-medium text-gray-700">Schema</label>
      <select className="w-full mb-4 border rounded p-2" value={selectedSchema || ''} onChange={e => setSelectedSchema(e.target.value)}>
        {schemas.map(schema => (
          <option key={schema} value={schema}>{schema}</option>
        ))}
      </select>

      <button
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        onClick={handleAnalyze}
        disabled={loading || !selectedSchema || !selectedConn}
      >
        {loading ? 'Analyzing...' : 'Analyze Schema'}
      </button>

      {status && <p className="mt-3 text-sm text-gray-800">{status}</p>}
    </div>
  );
}