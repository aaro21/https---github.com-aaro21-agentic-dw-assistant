// frontend/pages/source-map.js
import { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '../components/Layout';

export default function SourceStageMap() {
  const [mappings, setMappings] = useState([]);
  const [form, setForm] = useState({
    source_type: '',
    source_host: '',
    source_database: '',
    source_schema: '',
    source_table: '',
    source_tns: '',
    stage_database: '',
    stage_schema: '',
    stage_table: ''
  });
  const [status, setStatus] = useState(null);
  const [stageToBronzeMatches, setStageToBronzeMatches] = useState([]);
  const [suggestError, setSuggestError] = useState(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000';

  useEffect(() => {
    loadMappings();
    loadStageToBronzeMatches();
  }, []);

  const loadMappings = async () => {
    try {
      const res = await axios.get(`${API_BASE}/source-to-stage-map`);
      setMappings(res.data);
    } catch (err) {
      setStatus(`Error loading mappings: ${err.message}`);
    }
  };

  const loadStageToBronzeMatches = async () => {
    try {
      const res = await axios.get(`${API_BASE}/stage-to-bronze-map`);
      setStageToBronzeMatches(res.data);
    } catch (err) {
      console.error("Failed to load stage-bronze matches", err);
    }
  };

  const handleSuggest = async () => {
    setSuggestError(null);
    try {
      const res = await axios.post(`${API_BASE}/stage-to-bronze-map/suggest`);
      setStageToBronzeMatches(res.data);
    } catch (err) {
      setSuggestError(`❌ Failed to suggest mappings: ${err.response?.data?.detail || err.message}`);
    }
  };

  const handleSaveSuggested = async () => {
    try {
      const res = await axios.post(`${API_BASE}/stage-to-bronze-map/bulk`, stageToBronzeMatches);
      alert(`✅ Saved ${res.data.rows} suggested mappings.`);
    } catch (err) {
      alert(`❌ Failed to save mappings: ${err.response?.data?.detail || err.message}`);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus(null);
    try {
      await axios.post(`${API_BASE}/source-to-stage-map`, form);
      setStatus('✅ Mapping added');
      await loadMappings();
      setForm({
        source_type: '', source_host: '', source_database: '', source_schema: '', source_table: '',
        source_tns: '', stage_database: '', stage_schema: '', stage_table: ''
      });
    } catch (err) {
      setStatus(`❌ Error: ${err.response?.data?.detail || err.message}`);
    }
  };

  return (
    <Layout>
      <div className="p-6 max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">🔗 Source to Stage Mapping</h1>

        <form onSubmit={handleSubmit} className="space-y-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(form).map(([key, value]) => (
              <input
                key={key}
                name={key}
                placeholder={key.replace(/_/g, ' ')}
                value={value}
                onChange={handleChange}
                className="border p-2 rounded w-full"
                required={key !== 'source_tns'}
              />
            ))}
          </div>
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Add Mapping</button>
        </form>

        {status && <p className="mb-4 text-gray-700 text-sm">{status}</p>}

        <h2 className="text-lg font-semibold mb-2">📋 Existing Source to Stage Mappings</h2>
        <div className="overflow-auto border rounded mb-8">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100">
                {Object.keys(form).map(col => (
                  <th key={col} className="p-2 text-left whitespace-nowrap">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mappings.map((row, i) => (
                <tr key={i} className="border-t">
                  {Object.keys(form).map(col => (
                    <td key={col} className="p-2 whitespace-nowrap">{row[col]}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-semibold">🔄 Suggested Stage-to-Bronze Mappings</h2>
          <button
            onClick={handleSuggest}
            className="bg-indigo-600 text-white text-sm px-3 py-1 rounded hover:bg-indigo-700"
          >
            🔍 Suggest Stage-to-Bronze Mappings
          </button>
        </div>

        {suggestError && <p className="text-red-600 text-sm mb-2">{suggestError}</p>}

        <div className="overflow-auto border rounded">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 text-left whitespace-nowrap">Stage Table</th>
                <th className="p-2 text-left whitespace-nowrap">Bronze Table</th>
              </tr>
            </thead>
            <tbody>
              {stageToBronzeMatches.map((row, i) => (
                <tr key={i} className="border-t">
                  <td className="p-2 whitespace-nowrap">{`${row.stage_schema}.${row.stage_table}`}</td>
                  <td className="p-2 whitespace-nowrap">{`${row.bronze_schema}.${row.bronze_table}`}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {stageToBronzeMatches.length > 0 && (
            <div className="mt-4">
              <button
                onClick={handleSaveSuggested}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                💾 Save Suggested Mappings
              </button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}