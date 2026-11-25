
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import "./lists.css";

type List = {
  id: number;
  name: string;
  description: string | null;
  isPrivate: boolean;
  ownerId: string;
  createdAt: string;
  updatedAt?: string;
  _count?: {
    members: number;
  };
};

const TEST_USER_ID = process.env.NEXT_PUBLIC_TEST_USER_ID;

export default function ListsPage() {
  const router = useRouter();

  const [discoverLists, setDiscoverLists] = useState<List[]>([]);
  const [myLists, setMyLists] = useState<List[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pageError, setPageError] = useState("");

  const [activeTab, setActiveTab] = useState<"discover" | "my">("discover");
  const [search, setSearch] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingListId, setEditingListId] = useState<number | null>(null);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  const [listName, setListName] = useState("");
  const [description, setDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [formError, setFormError] = useState("");

  const fetchLists = useCallback(async () => {
    try {
      await Promise.resolve();

      if (!TEST_USER_ID) {
        throw new Error("Test User ID belum diatur di file .env.local.");
      }

      const [discoverResponse, myResponse] = await Promise.all([
        fetch(
          `/api/lists/discover?userId=${encodeURIComponent(TEST_USER_ID)}`
        ),
        fetch(`/api/lists/my?userId=${encodeURIComponent(TEST_USER_ID)}`),
      ]);

      const [discoverResult, myResult] = await Promise.all([
        discoverResponse.json(),
        myResponse.json(),
      ]);

      if (!discoverResponse.ok || !discoverResult.success) {
        throw new Error(
          discoverResult.message || "Failed to fetch Discover Lists."
        );
      }

      if (!myResponse.ok || !myResult.success) {
        throw new Error(myResult.message || "Failed to fetch Your Lists.");
      }

      setDiscoverLists(discoverResult.data);
      setMyLists(myResult.data);
      setPageError("");
    } catch (error) {
      console.error("Fetch Lists Error:", error);
      setPageError(
        error instanceof Error ? error.message : "Failed to load lists."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchLists();
  }, [fetchLists]);

  const filteredDiscoverLists = useMemo(() => {
    return discoverLists.filter((list) => {
      const keyword = search.toLowerCase();

      return (
        list.name.toLowerCase().includes(keyword) ||
        (list.description || "").toLowerCase().includes(keyword)
      );
    });
  }, [discoverLists, search]);

  const filteredMyLists = useMemo(() => {
    return myLists.filter((list) => {
      const keyword = search.toLowerCase();

      return (
        list.name.toLowerCase().includes(keyword) ||
        (list.description || "").toLowerCase().includes(keyword)
      );
    });
  }, [myLists, search]);

  function openCreateModal() {
    setEditingListId(null);
    setListName("");
    setDescription("");
    setIsPrivate(false);
    setFormError("");
    setShowModal(true);
  }

  function openEditModal(list: List) {
    setEditingListId(list.id);
    setListName(list.name);
    setDescription(list.description || "");
    setIsPrivate(list.isPrivate);
    setFormError("");
    setOpenMenuId(null);
    setShowModal(true);
  }

  function openManageMembers() {
    if (editingListId === null) return;

    setShowModal(false);
    router.push(`/lists/${editingListId}/members`);
  }

  function closeModal() {
    if (saving) return;

    setShowModal(false);
    setEditingListId(null);
    setListName("");
    setDescription("");
    setIsPrivate(false);
    setFormError("");
  }

  async function handleSaveList() {
    const trimmedName = listName.trim();

    if (!trimmedName) {
      setFormError("List name is required.");
      return;
    }

    if (trimmedName.length < 3) {
      setFormError("List name must be at least 3 characters.");
      return;
    }

    if (!TEST_USER_ID) {
      setFormError("Test User ID belum tersedia.");
      return;
    }

    setSaving(true);
    setFormError("");

    try {
      const isEditing = editingListId !== null;

      const response = await fetch(
        isEditing ? `/api/lists/${editingListId}` : "/api/lists",
        {
          method: isEditing ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: trimmedName,
            description: description.trim() || null,
            isPrivate,
            ownerId: TEST_USER_ID,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to save list.");
      }

      setShowModal(false);
      setEditingListId(null);
      setListName("");
      setDescription("");
      setIsPrivate(false);
      setActiveTab("my");

      await fetchLists();
    } catch (error) {
      console.error("Save List Error:", error);
      setFormError(
        error instanceof Error ? error.message : "Failed to save list."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteList(listId: number) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this list?"
    );

    if (!confirmed) return;

    if (!TEST_USER_ID) {
      alert("Test User ID belum tersedia.");
      return;
    }

    try {
      const response = await fetch(
        `/api/lists/${listId}?ownerId=${encodeURIComponent(TEST_USER_ID)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to delete list.");
      }

      setOpenMenuId(null);
      await fetchLists();
    } catch (error) {
      console.error("Delete List Error:", error);
      alert(
        error instanceof Error ? error.message : "Failed to delete list."
      );
    }
  }

  function openListDetail(listId: number) {
    router.push(`/lists/${listId}`);
  }

  return (
    <div className="lists-page">
      <div className="lists-container">
        <div className="lists-header">
          <div>
            <h1>Lists</h1>
            <p>Discover and organize your favorite people.</p>
          </div>

          <button className="create-list-btn" onClick={openCreateModal}>
            + Create List
          </button>
        </div>

        <div className="lists-search">
          <span>⌕</span>
          <input
            type="text"
            placeholder="Search Lists..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <div className="lists-tabs">
          <button
            className={activeTab === "discover" ? "active" : ""}
            onClick={() => setActiveTab("discover")}
          >
            Discover new Lists
          </button>

          <button
            className={activeTab === "my" ? "active" : ""}
            onClick={() => setActiveTab("my")}
          >
            Your Lists
          </button>
        </div>

        {pageError && (
          <div className="lists-empty">
            <p>{pageError}</p>
          </div>
        )}

        {activeTab === "discover" && !pageError && (
          <section className="lists-content">
            {loading ? (
              <div className="lists-empty">
                <p>Loading lists...</p>
              </div>
            ) : filteredDiscoverLists.length === 0 ? (
              <div className="lists-empty">
                <div className="lists-empty-icon">🔎</div>
                <h3>No Lists found</h3>
                <p>
                  There are no public lists available matching your search.
                </p>
              </div>
            ) : (
              <div className="lists-grid">
                {filteredDiscoverLists.map((list) => (
                  <div
                    className="list-card"
                    key={list.id}
                    onClick={() => openListDetail(list.id)}
                  >
                    <div className="list-card-title">
                      <h3>{list.name}</h3>
                      <span>
                        {list.isPrivate ? "🔒 Private" : "🌐 Public"}
                      </span>
                    </div>

                    <p className="list-card-description">
                      {list.description || "No description available."}
                    </p>

                    <div className="list-card-footer">
                      <span>👥 {list._count?.members ?? 0} members</span>
                      <span className="view-list-link">View List →</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === "my" && !pageError && (
          <section className="lists-content">
            {loading ? (
              <div className="lists-empty">
                <p>Loading your lists...</p>
              </div>
            ) : filteredMyLists.length === 0 ? (
              <div className="lists-empty">
                <div className="lists-empty-icon">📋</div>
                <h3>You have not created any Lists yet</h3>
                <p>
                  Create your first List to organize your favorite people.
                </p>

                <button
                  className="create-list-btn empty-create-btn"
                  onClick={openCreateModal}
                >
                  + Create List
                </button>
              </div>
            ) : (
              <div className="lists-grid">
                {filteredMyLists.map((list) => (
                  <div
                    className="list-card"
                    key={list.id}
                    onClick={() => openListDetail(list.id)}
                  >
                    <div className="list-card-top">
                      <div className="list-card-title">
                        <h3>{list.name}</h3>
                        <span>
                          {list.isPrivate ? "🔒 Private" : "🌐 Public"}
                        </span>
                      </div>

                      <div className="list-menu-wrapper">
                        <button
                          className="list-menu-btn"
                          onClick={(event) => {
                            event.stopPropagation();
                            setOpenMenuId(
                              openMenuId === list.id ? null : list.id
                            );
                          }}
                          aria-label="List options"
                        >
                          ⋯
                        </button>

                        {openMenuId === list.id && (
                          <div
                            className="list-dropdown"
                            onClick={(event) => event.stopPropagation()}
                          >
                            <button onClick={() => openEditModal(list)}>
                              ✏️ Edit
                            </button>

                            <button
                              className="delete-option"
                              onClick={() => handleDeleteList(list.id)}
                            >
                              🗑️ Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <p className="list-card-description">
                      {list.description || "No description available."}
                    </p>

                    <div className="list-card-footer">
                      <span>👥 {list._count?.members ?? 0} members</span>
                      <span className="view-list-link">View List →</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>

      {showModal && (
        <div className="list-modal-overlay" onClick={closeModal}>
          <div
            className="list-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="list-modal-header">
              <h2>
                {editingListId !== null ? "Edit List" : "Create a List"}
              </h2>

              <button className="list-modal-close" onClick={closeModal}>
                ×
              </button>
            </div>

            <div className="list-form">
              <label htmlFor="list-name">List Name</label>
              <input
                id="list-name"
                type="text"
                placeholder="Enter list name"
                value={listName}
                onChange={(event) => setListName(event.target.value)}
              />

              <label htmlFor="list-description">Description</label>
              <textarea
                id="list-description"
                placeholder="Describe your list..."
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={3}
              />

              <label className="private-checkbox">
                <input
                  type="checkbox"
                  checked={isPrivate}
                  onChange={(event) => setIsPrivate(event.target.checked)}
                />
                Make this List private
              </label>

              {formError && <p className="list-form-error">{formError}</p>}

              {editingListId !== null && (
                <button
                  type="button"
                  className="manage-members-btn"
                  onClick={openManageMembers}
                >
                  👥 Manage Members
                </button>
              )}

              <div className="list-modal-actions">
                <button
                  className="cancel-list-btn"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  className="save-list-btn"
                  onClick={handleSaveList}
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingListId !== null
                      ? "Save Changes"
                      : "Create List"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
