// frontend/pages/confirm-stage-mappings.js
import { useEffect, useState } from 'react';
import axios from 'axios';
import Layout from '../components/Layout';

export default function ConfirmStageMappings() {
  const [suggestions, setSuggestions] = useState([]);
  const [status, setStatus] = useState(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000';

  useEffect(() => {
    axios.get(`${API_BASE}/stage-to-bronze-suggestions`)
      .then(res => setSuggestions(res.data))
      .catch(err => setStatus(`Failed to load: ${err.message}`));
  }, []);

  const handleChange = (index, field, value) => {
    const updated = [...suggestions];
    updated[index][field] = value;
    setSuggestions(updated);
  };

  const handleSave = async () => {
    try {
      await axios.post(`${API_BASE}/stage-to-bronze-map/bulk`, { mappings: suggestions });
      setStatus('✅ Mappings saved successfully');
    } catch (err) {
      setStatus(`❌ Error saving: ${err.response?.data?.detail || err.message}`);
    }
  };

  return (
    <Layout>
      <div className="p-6 max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">📥 Confirm Stage to Bronze Mappings</h1>

        {status && <p className="mb-4 text-sm text-gray-700">{status}</p>}

        <div className="overflow-auto border rounded mb-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100">
                {['stage_database', 'stage_schema', 'stage_table', 'bronze_database', 'bronze_schema', 'bronze_table'].map(col => (
                  <th key={col} className="p-2 text-left whitespace-nowrap">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {suggestions.map((row, i) => (
                <tr key={i} className="border-t">
                  {['stage_database', 'stage_schema', 'stage_table'].map(col => (
                    <td key={col} className="p-2 whitespace-nowrap text-gray-800">{row[col]}</td>
                  ))}
                  {['bronze_database', 'bronze_schema', 'bronze_table'].map(col => (
                    <td key={col} className="p-2 whitespace-nowrap">
                      <input
                        type="text"
                        value={row[col] || ''}
                        onChange={e => handleChange(i, col, e.target.value)}
                        className="border p-1 rounded w-full"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button
          onClick={handleSave}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          ✅ Confirm Mappings
        </button>
      </div>
    </Layout>
  );
}