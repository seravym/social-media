
"use client";

import { useEffect, useState } from "react";

type Community = {
  id: number;
  name: string;
  description: string | null;
  image: string | null;
  creatorId: string;
  createdAt: string;
  _count?: {
    members: number;
  };
};

export default function CommunitiesPage() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function fetchCommunities() {
      try {
        const response = await fetch("/api/commmunities");
        const result = await response.json();

        if (response.ok && result.success) {
          setCommunities(result.data);
        }
      } catch (error) {
        console.error("Failed to fetch communities:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchCommunities();
  }, []);

  const filteredCommunities = communities.filter((community) =>
    community.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#f7f8fa] text-gray-900">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-8">
          <p className="mb-2 text-sm font-semibold text-pink-600">
            EXPLORE YOUR INTERESTS
          </p>

          <h1 className="text-3xl font-bold">
            Communities
          </h1>

          <p className="mt-2 text-gray-500">
            Find people who share your interests and join their communities.
          </p>
        </div>

        <div className="mb-6">
          <input
            type="text"
            placeholder="Search communities..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none transition focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
          />
        </div>

        {loading ? (
          <p className="py-10 text-center text-gray-500">
            Loading communities...
          </p>
        ) : filteredCommunities.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white px-6 py-16 text-center">
            <div className="mb-3 text-4xl">🌸</div>

            <h2 className="text-lg font-semibold">
              {search ? "No communities found" : "No communities yet"}
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              {search
                ? "Try searching with another keyword."
                : "Be the first to create a community!"}
            </p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredCommunities.map((community) => (
              <div
                key={community.id}
                className="overflow-hidden rounded-2xl border border-gray-200 bg-white transition hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="flex h-32 items-center justify-center bg-gradient-to-r from-pink-100 to-purple-100">
                  {community.image ? (
                    <img src={community.image} alt={community.name} className="h-full w-full object-cover"/>
                  ) : (
                    <span className="text-5xl">🌷</span>
                  )}
                </div>

                <div className="p-5">
                  <h2 className="text-lg font-bold">
                    {community.name}
                  </h2>

                  <p className="mt-2 line-clamp-3 min-h-12 text-sm text-gray-500">
                    {community.description || "No description available."}
                  </p>

                  <p className="mt-4 text-xs text-gray-400">
                    {community._count?.members ?? 0} members
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
