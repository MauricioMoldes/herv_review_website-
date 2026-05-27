import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { getPrimersForward, getPrimersReverse } from "../api/primers";
import PrimerSetCard from "../components/PrimerSetCard";

const lookupCache = new Map();

export default function PrimerLookup() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [mode, setMode] = useState("forward");
  const [sequence, setSequence] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    const urlMode = searchParams.get("mode") || "forward";
    const urlSeq = searchParams.get("sequence") || "";

    setMode(urlMode);
    setSequence(urlSeq);

    if (!urlSeq.trim()) {
      setResults([]);
      return;
    }

    const cacheKey = searchParams.toString();

    if (lookupCache.has(cacheKey)) {
      setResults(lookupCache.get(cacheKey));
      return;
    }

    let isActive = true;

    (async () => {
      setLoading(true);
      setError(null);

      try {
        const data =
          urlMode === "forward"
            ? await getPrimersForward(urlSeq)
            : await getPrimersReverse(urlSeq);

        lookupCache.set(cacheKey, data);
        if (isActive) setResults(data);
      } catch (err) {
        if (isActive)
          setError("Lookup failed. Check sequence or API connection.");
      } finally {
        if (isActive) setLoading(false);
      }
    })();

    return () => {
      isActive = false;
    };
  }, [searchParams.toString()]);

  const handleSearch = () => {
    if (!sequence.trim()) return;

    setHasSearched(true);

    setSearchParams({
      mode,
      sequence: sequence.trim().toUpperCase(),
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">

      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-blue-900">
          Primer Pair Lookup
        </h1>
        <p className="mt-2 text-gray-600 max-w-3xl">
          Resolve forward ↔ reverse primer relationships using exact sequence matching.
        </p>
      </div>

      {/* INPUT CARD */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">

        {/* MODE SWITCH */}
        <div className="flex gap-2 mb-5">
          <button
            onClick={() => setMode("forward")}
            className={`px-4 py-2 rounded-lg text-sm border transition ${
              mode === "forward"
                ? "bg-blue-700 text-white border-blue-700"
                : "bg-white text-gray-700"
            }`}
          >
            Forward → Reverse
          </button>

          <button
            onClick={() => setMode("reverse")}
            className={`px-4 py-2 rounded-lg text-sm border transition ${
              mode === "reverse"
                ? "bg-blue-700 text-white border-blue-700"
                : "bg-white text-gray-700"
            }`}
          >
            Reverse → Forward
          </button>
        </div>

        {/* INPUT */}
        <div className="flex gap-3">
          <input
            className="flex-1 border rounded-lg p-3 font-mono text-sm uppercase placeholder:normal-case"
            placeholder={
              mode === "forward"
                ? "Paste forward primer sequence..."
                : "Paste reverse primer sequence..."
            }
            value={sequence}
            onChange={(e) => {
              setSequence(e.target.value.toUpperCase());
              setHasSearched(false);
            }}
            onKeyDown={handleKeyDown}
          />

          <button
            onClick={handleSearch}
            className="bg-blue-700 text-white px-6 rounded-lg hover:bg-blue-800"
          >
            Lookup
          </button>
        </div>
      </div>

      {/* STATUS */}
      <div className="mt-6">
        {loading && (
          <p className="text-gray-500">
            Searching primer relationships...
          </p>
        )}
        {error && <p className="text-red-600">{error}</p>}
        {!loading && results.length > 0 && (
          <p className="text-sm text-gray-500">
            {results.length} match{results.length !== 1 ? "es" : ""} found
          </p>
        )}
      </div>

      {/* RESULTS */}
      <div className="mt-6 space-y-5">
        {results.map((r) => (
          <PrimerSetCard
            key={r.set_index}
            r={r}
            queryPrimer={{ type: mode, sequence }}
          />
        ))}
      </div>

      {/* EMPTY STATE */}
      {!loading && hasSearched && results.length === 0 && sequence && (
        <p className="text-gray-400 mt-6">
          No matches found for this sequence.
        </p>
      )}

    </div>
  );
}