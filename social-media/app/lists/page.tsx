"use client";

import { useEffect, useState } from "react";
import "./lists.css";

type List = {
  id: number;
  name: string;
  description: string | null;
  isPrivate: boolean;
  ownerId: string;
  createdAt: string;
  _count?: {
    members: number;
  };
};

export default function ListsPage() {
  const [discoverLists, setDiscoverLists] = useState<List[]>([]);
  const [myLists, setMyLists] = useState<List[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("discover");

  const [showModal, setShowModal] = useState(false);
  const [listName, setListName] = useState("");
  const [description, setDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [formError, setFormError] = useState("");

  // Fetch public lists
  useEffect(() => {
    async function fetchLists() {
      try {
        const response = await fetch("/api/lists/discover");
        const result = await response.json();

        if (response.ok && result.success) {
          setDiscoverLists(result.data);
        }
      } catch (error) {
        console.error("Failed to fetch lists:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchLists();
  }, []);

  // Search lists
  const filteredDiscoverLists = discoverLists.filter((list) =>
    list.name.toLowerCase().includes(search.toLowerCase())
  );

  const filteredMyLists = myLists.filter((list) =>
    list.name.toLowerCase().includes(search.toLowerCase())
  );

  // Validate create list form
  function handleCreateList(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!listName.trim()) {
      setFormError("List name cannot be empty.");
      return;
    }

    if (listName.trim().length < 3) {
      setFormError("List name must be at least 3 characters.");
      return;
    }

    setFormError("");

    alert("Form is valid! API connection will be added after login is ready.");

    setShowModal(false);
    setListName("");
    setDescription("");
    setIsPrivate(false);
  }

  function closeModal() {
    setShowModal(false);
    setFormError("");
  }

  return (
    <div className="lists-page">
      <div className="lists-container">

        {/* Header */}
        <div className="lists-header">
          <div>
            <p className="lists-subtitle">ORGANIZE YOUR INTERESTS</p>
            <h1>Lists</h1>
            <p className="lists-description">
              Discover and create lists to organize your favorite accounts.
            </p>
          </div>

          <button
            className="create-list-btn"
            onClick={() => setShowModal(true)}
          >
            + Create List
          </button>
        </div>

        {/* Search */}
        <div className="lists-search">
          <input
            type="text"
            placeholder="Search lists..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Tabs */}
        <div className="lists-tabs">
          <button
            className={activeTab === "discover" ? "active" : ""}
            onClick={() => setActiveTab("discover")}
          >
            Discover new Lists
          </button>

          <button
            className={activeTab === "mine" ? "active" : ""}
            onClick={() => setActiveTab("mine")}
          >
            Your Lists
          </button>
        </div>

        {/* Discover Lists */}
        {activeTab === "discover" && (
          <section className="lists-section">
            {loading ? (
              <p className="lists-loading">Loading lists...</p>
            ) : filteredDiscoverLists.length === 0 ? (
              <div className="lists-empty">
                <div className="lists-empty-icon">📋</div>
                <h2>No lists found</h2>
                <p>
                  {search
                    ? "Try searching with another keyword."
                    : "Public lists created by other users will appear here."}
                </p>
              </div>
            ) : (
              <div className="lists-grid">
                {filteredDiscoverLists.map((list) => (
                  <div className="list-card" key={list.id}>
                    <div className="list-card-icon">📑</div>

                    <div className="list-card-content">
                      <h2>{list.name}</h2>
                      <p>
                        {list.description || "No description available."}
                      </p>

                      <span>
                        {list._count?.members ?? 0} members
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Your Lists */}
        {activeTab === "mine" && (
          <section className="lists-section">
            {filteredMyLists.length === 0 ? (
              <div className="lists-empty">
                <div className="lists-empty-icon">🗂️</div>
                <h2>You havent created any lists yet</h2>
                <p>
                  Create your first list to organize your favorite accounts.
                </p>

                <button
                  className="empty-create-btn"
                  onClick={() => setShowModal(true)}
                >
                  Create your first List
                </button>
              </div>
            ) : (
              <div className="lists-grid">
                {filteredMyLists.map((list) => (
                  <div className="list-card" key={list.id}>
                    <div className="list-card-icon">📑</div>

                    <div className="list-card-content">
                      <h2>{list.name}</h2>
                      <p>
                        {list.description || "No description available."}
                      </p>

                      <span>
                        {list.isPrivate ? "Private" : "Public"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

      </div>

      {/* Create List Modal */}
      {showModal && (
        <div className="list-modal-overlay" onClick={closeModal}>
          <div
            className="create-list-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="list-modal-header">
              <h2>Create a List</h2>

              <button
                type="button"
                className="list-modal-close"
                onClick={closeModal}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateList}>
              <div className="list-form-group">
                <label>List Name *</label>
                <input
                  type="text"
                  placeholder="Enter list name"
                  value={listName}
                  onChange={(e) => setListName(e.target.value)}
                  maxLength={50}
                />
              </div>

              <div className="list-form-group">
                <label>Description</label>
                <textarea
                  placeholder="Describe your list..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  maxLength={300}
                />
              </div>

              <label className="list-privacy">
                <input
                  type="checkbox"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                />
                <span>Make this list private</span>
              </label>

              {formError && (
                <p className="list-form-error">{formError}</p>
              )}

              <div className="list-modal-actions">
                <button
                  type="button"
                  className="list-cancel-btn"
                  onClick={closeModal}
                >
                  Cancel
                </button>

                <button type="submit" className="list-submit-btn">
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
