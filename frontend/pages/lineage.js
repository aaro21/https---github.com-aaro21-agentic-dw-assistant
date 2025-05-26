import { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';

export default function LineageTest() {
  const [connections, setConnections] = useState([]);
  const [selectedConnection, setSelectedConnection] = useState(null);
  const [procedures, setProcedures] = useState([]);
  const [selectedProc, setSelectedProc] = useState(null);
  const [procBody, setProcBody] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);

  const router = useRouter();
  const initialProc = router.query.procedure_name || "";

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000';

  useEffect(() => {
    axios.get(`${API_BASE}/connections`).then((res) => {
      setConnections(res.data);
      if (res.data.length > 0) setSelectedConnection(res.data[0]);
    });
  }, []);

  useEffect(() => {
    if (selectedConnection) {
      axios.get(`${API_BASE}/procedures/${selectedConnection}`).then((res) => {
        setProcedures(res.data);
        if (initialProc) setSelectedProc(initialProc);
      });
    }
  }, [selectedConnection]);

  useEffect(() => {
    if (selectedProc && selectedConnection) {
      axios
        .get(`${API_BASE}/procedures/${selectedConnection}/${selectedProc}`)
        .then((res) => setProcBody(res.data.definition))
        .catch((err) => setError(err.message));
    }
  }, [selectedProc]);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    setSaveStatus(null);
    try {
      const res = await axios.post(`${API_BASE}/lineage`, {
        procedure_name: selectedProc,
        database: selectedConnection || "",
        content: procBody,
      });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!result || !result.column_mappings?.length) return;

    try {
      const res = await axios.post(`${API_BASE}/lineage/save`, {
        procedure_name: selectedProc,
        database: selectedConnection || "",
        content: procBody,
        lineage: result,
      });
      setSaveStatus(`✅ Saved ${res.data.rows} mappings.`);
    } catch (err) {
      setSaveStatus(`❌ Save failed: ${err.response?.data?.detail || err.message}`);
    }
  };

  return (
    <Layout>
      <div className="p-6 max-w-4xl mx-auto">
        <h1 className="text-2xl font-semibold mb-4 text-gray-800">📊 Explore Lineage</h1>

        <div className="mb-4">
          <label className="block text-gray-600 font-medium mb-1">Connection</label>
          <div className="flex flex-wrap gap-2">
            {connections.map((conn) => (
              <button
                key={conn}
                className={`px-3 py-1 rounded text-sm border ${
                  selectedConnection === conn
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border-gray-300'
                }`}
                onClick={() => setSelectedConnection(conn)}
              >
                {conn}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-gray-600 font-medium mb-1">Procedure</label>
          <select
            className="w-full border border-gray-300 rounded p-2"
            value={selectedProc || ""}
            onChange={(e) => setSelectedProc(e.target.value)}
          >
            <option value="">-- Select Stored Procedure --</option>
            {procedures.map((proc) => (
              <option key={proc} value={proc}>
                {proc}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-4 mb-4">
          <button
            onClick={handleSubmit}
            disabled={loading || !selectedProc}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            {loading ? "Analyzing..." : "Analyze Lineage"}
          </button>

          {result && (
            <button
              onClick={handleSave}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              💾 Save Lineage
            </button>
          )}
        </div>

        {saveStatus && <p className="text-sm text-gray-700 mb-4">{saveStatus}</p>}

        {error && (
          <div className="mt-4 text-red-600 text-sm">
            ❌ Error:
            <pre className="mt-1 whitespace-pre-wrap break-all">
              {typeof error === "string" ? error : JSON.stringify(error, null, 2)}
            </pre>
          </div>
        )}

        {result && (
          <div className="mt-6 bg-white border rounded p-4 shadow">
            <h2 className="font-bold text-gray-700 mb-2">🔍 Lineage Result</h2>
            <pre className="whitespace-pre-wrap text-sm text-gray-800">
              {JSON.stringify(
                Object.fromEntries(
                  Object.entries(result).filter(([k]) => !["_raw", "_prompt"].includes(k))
                ),
                null,
                2
              )}
            </pre>

            {result._raw && (
              <details className="mt-4">
                <summary className="font-semibold text-gray-600">📄 Raw LLM Response</summary>
                <pre className="mt-2 p-2 bg-gray-100 text-xs overflow-x-auto">
                  {result._raw}
                </pre>
              </details>
            )}

            {result._prompt && (
              <details className="mt-4">
                <summary className="font-semibold text-gray-600">🧠 Prompt Sent to LLM</summary>
                <pre className="mt-2 p-2 bg-gray-100 text-xs overflow-x-auto">
                  {result._prompt}
                </pre>
              </details>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}