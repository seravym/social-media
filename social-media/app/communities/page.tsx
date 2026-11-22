
"use client";

import { useEffect, useState } from "react";
import "./communities.css";

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

  const [showModal, setShowModal] = useState(false);
  const [communityName, setCommunityName] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [formError, setFormError] = useState("");

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

  function handleCreateCommunity(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!communityName.trim()) {
      setFormError("Community name cannot be empty.");
      return;
    }

    if (communityName.trim().length < 3) {
      setFormError("Community name must be at least 3 characters.");
      return;
    }

    setFormError("");

    alert("Form is valid! API connection will be added later.");

    setShowModal(false);
    setCommunityName("");
    setDescription("");
    setImage("");
  }

  function closeModal() {
    setShowModal(false);
    setFormError("");
  }

  return (
    <div className="communities-page">
      <div className="communities-container">

        {/* Header */}
        <div className="communities-header">
          <div>
            <p className="communities-subtitle">
              EXPLORE YOUR INTERESTS
            </p>

            <h1>Communities</h1>

            <p className="communities-description">
              Find people who share your interests and join their communities.
            </p>
          </div>

          <button
            className="create-community-btn"
            onClick={() => setShowModal(true)}
          >
            + Create Community
          </button>
        </div>

        {/* Search */}
        <div className="community-search">
          <input
            type="text"
            placeholder="Search communities..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Community List */}
        {loading ? (
          <p className="community-loading">
            Loading communities...
          </p>
        ) : filteredCommunities.length === 0 ? (
          <div className="community-empty">
            <div className="empty-icon">🌸</div>

            <h2>
              {search ? "No communities found" : "No communities yet"}
            </h2>

            <p>
              {search
                ? "Try searching with another keyword."
                : "Be the first to create a community!"}
            </p>
          </div>
        ) : (
          <div className="community-grid">
            {filteredCommunities.map((community) => (
              <div className="community-card" key={community.id}>
                <div className="community-image">
                  {community.image ? (
                    <img
                      src={community.image}
                      alt={community.name}
                    />
                  ) : (
                    <span>🌷</span>
                  )}
                </div>

                <div className="community-card-content">
                  <h2>{community.name}</h2>

                  <p>
                    {community.description || "No description available."}
                  </p>

                  <span className="community-members">
                    {community._count?.members ?? 0} members
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* Create Community Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div
            className="create-community-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>Create Community</h2>

              <button
                type="button"
                className="modal-close-btn"
                onClick={closeModal}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateCommunity}>
              <div className="form-group">
                <label>Community Name *</label>

                <input
                  type="text"
                  placeholder="Enter community name"
                  value={communityName}
                  onChange={(e) => setCommunityName(e.target.value)}
                  maxLength={50}
                />
              </div>

              <div className="form-group">
                <label>Description</label>

                <textarea
                  placeholder="What is your community about?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  maxLength={300}
                />
              </div>

              <div className="form-group">
                <label>Image URL</label>

                <input
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                />
              </div>

              {formError && (
                <p className="form-error">{formError}</p>
              )}

              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={closeModal}
                >
                  Cancel
                </button>

                <button type="submit" className="submit-btn">
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
