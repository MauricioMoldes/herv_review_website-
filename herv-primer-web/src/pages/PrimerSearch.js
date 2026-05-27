import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { getPrimers } from "../api/primers";
import { primerCache } from "../api/primerCache";
import PrimerSetCard from "../components/PrimerSetCard";

export default function PrimerSearch() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [family, setFamily] = useState("");
  const [subgroup, setSubgroup] = useState("");
  const [component, setComponent] = useState("");
  const [dna, setDna] = useState(false);

  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const params = Object.fromEntries(searchParams.entries());

    const q = {
      family: params.family || "",
      subgroup: params.subgroup || "",
      component: params.component || "",
      dna: params.dna === "true",
    };

    setFamily(q.family);
    setSubgroup(q.subgroup);
    setComponent(q.component);
    setDna(q.dna);

    const hasQuery = q.family || q.subgroup || q.component || q.dna;

    if (!hasQuery) {
      setResults([]);
      return;
    }

    const cacheKey = searchParams.toString();

    if (primerCache.has(cacheKey)) {
      setResults(primerCache.get(cacheKey));
      return;
    }

    let isActive = true;

    (async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await getPrimers(q);
        primerCache.set(cacheKey, data);
        if (isActive) setResults(data);
      } catch (e) {
        if (isActive) setError("Failed to fetch primers");
      } finally {
        if (isActive) setLoading(false);
      }
    })();

    return () => {
      isActive = false;
    };
  }, [searchParams.toString()]);

  const handleSearch = () => {
    const q = {
      family: family.trim().toUpperCase(),
      subgroup: subgroup.trim().toUpperCase(),
      component: component.trim().toLowerCase(),
      dna,
    };

    setSearchParams(
      Object.fromEntries(
        Object.entries(q).filter(([_, v]) => v !== "" && v !== false)
      )
    );
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">

      {/* PAGE HEADER */}
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-blue-900">
          Primer Search
        </h1>
        <p className="mt-2 text-gray-600 max-w-3xl">
          Query curated HERV primer assays by family, subgroup,
          genomic component, and assay type.
        </p>
      </div>

      {/* SEARCH PANEL */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

          <input
            className="w-full border rounded-lg p-3 uppercase placeholder:normal-case"
            placeholder="Family (e.g. HERV-K)"
            value={family}
            onChange={(e) => setFamily(e.target.value.toUpperCase())}
            onKeyDown={handleKeyDown}
          />

          <input
            className="w-full border rounded-lg p-3 uppercase placeholder:normal-case"
            placeholder="Subgroup (e.g. HML-2)"
            value={subgroup}
            onChange={(e) => setSubgroup(e.target.value.toUpperCase())}
            onKeyDown={handleKeyDown}
          />

          <input
            className="w-full border rounded-lg p-3 lowercase placeholder:normal-case"
            placeholder="Component (gag / env / pol)"
            value={component}
            onChange={(e) => setComponent(e.target.value.toLowerCase())}
            onKeyDown={handleKeyDown}
          />

        </div>

        <div className="mt-6 flex justify-between items-center">

          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={dna}
              onChange={(e) => setDna(e.target.checked)}
              onKeyDown={handleKeyDown}
            />
            DNA assays only
          </label>

          <button
            onClick={handleSearch}
            className="bg-blue-700 text-white px-6 py-3 rounded-lg hover:bg-blue-800"
          >
            Search
          </button>

        </div>

      </div>

      {/* STATUS */}
      <div className="mt-6">
        {loading && <p className="text-gray-500">Loading...</p>}
        {error && <p className="text-red-600">{error}</p>}
        {!loading && results.length > 0 && (
          <p className="text-sm text-gray-500">
            {results.length} primer set{results.length !== 1 ? "s" : ""} found
          </p>
        )}
      </div>

      {/* RESULTS */}
      <div className="mt-6 space-y-5">
        {results.map((r) => (
          <PrimerSetCard
            key={`${r.family_name}-${r.component_name}-${r.set_index}`}
            r={r}
          />
        ))}
      </div>

    </div>
  );
}