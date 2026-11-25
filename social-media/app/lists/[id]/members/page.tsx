
"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import "./members.css";

type User = {
  id: string;
  name: string | null;
  username: string;
  avatarUrl: string | null;
};

type List = {
  id: number;
  name: string;
  description: string | null;
  isPrivate: boolean;
  _count?: {
    members: number;
  };
};

function ManageMembersContent() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const listId = params.id;
  const TEST_USER_ID = process.env.NEXT_PUBLIC_TEST_USER_ID;

  const [list, setList] = useState<List | null>(null);
  const [members, setMembers] = useState<User[]>([]);
  const [suggested, setSuggested] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState<"members" | "suggested">(
    "members"
  );
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionUserId, setActionUserId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    try {
      if (!TEST_USER_ID) {
        throw new Error("Test User ID belum tersedia.");
      }

      const [listResponse, membersResponse, suggestedResponse] =
        await Promise.all([
          fetch(`/api/lists/${listId}`),
          fetch(`/api/lists/${listId}/members`),
          fetch(
            `/api/lists/${listId}/suggested?ownerId=${encodeURIComponent(
              TEST_USER_ID
            )}`
          ),
        ]);

      const [listResult, membersResult, suggestedResult] =
        await Promise.all([
          listResponse.json(),
          membersResponse.json(),
          suggestedResponse.json(),
        ]);

      if (!listResponse.ok || !listResult.success) {
        throw new Error(listResult.message || "Failed to fetch list.");
      }

      if (!membersResponse.ok || !membersResult.success) {
        throw new Error(
          membersResult.message || "Failed to fetch members."
        );
      }

      if (!suggestedResponse.ok || !suggestedResult.success) {
        throw new Error(
          suggestedResult.message || "Failed to fetch suggested users."
        );
      }

      setList(listResult.data);
      setMembers(
        membersResult.data.map((member: { user: User }) => member.user)
      );
      setSuggested(suggestedResult.data);
      setError("");
    } catch (error) {
      console.error("Manage Members Error:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to load members."
      );
    } finally {
      setLoading(false);
    }
  }, [listId, TEST_USER_ID]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchData();
  }, [fetchData]);

  async function handleAddMember(userId: string) {
    if (!TEST_USER_ID) return;

    setActionUserId(userId);
    setError("");

    try {
      const response = await fetch(`/api/lists/${listId}/members`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          ownerId: TEST_USER_ID,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to add member.");
      }

      await fetchData();
    } catch (error) {
      console.error("Add Member Error:", error);
      setError(
        error instanceof Error ? error.message : "Failed to add member."
      );
    } finally {
      setActionUserId(null);
    }
  }

  async function handleRemoveMember(userId: string) {
    if (!TEST_USER_ID) return;

    const confirmed = window.confirm(
      "Are you sure you want to remove this member?"
    );

    if (!confirmed) return;

    setActionUserId(userId);
    setError("");

    try {
      const query = new URLSearchParams({
        userId,
        ownerId: TEST_USER_ID,
      });

      const response = await fetch(
        `/api/lists/${listId}/members?${query.toString()}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to remove member.");
      }

      await fetchData();
    } catch (error) {
      console.error("Remove Member Error:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to remove member."
      );
    } finally {
      setActionUserId(null);
    }
  }

  const filteredMembers = members.filter((user) => {
    const keyword = search.toLowerCase();

    return (
      (user.name || "").toLowerCase().includes(keyword) ||
      user.username.toLowerCase().includes(keyword)
    );
  });

  const filteredSuggested = suggested.filter((user) => {
    const keyword = search.toLowerCase();

    return (
      (user.name || "").toLowerCase().includes(keyword) ||
      user.username.toLowerCase().includes(keyword)
    );
  });

  if (loading) {
    return (
      <div className="manage-members-page">
        <p className="members-loading">Loading members...</p>
      </div>
    );
  }

  if (error && !list) {
    return (
      <div className="manage-members-page">
        <button
          className="members-back-btn"
          onClick={() => router.push("/lists")}
        >
          ← Back to Lists
        </button>
        <p className="members-error">{error}</p>
      </div>
    );
  }

  if (!list) return null;

  return (
    <div className="manage-members-page">
      <div className="manage-members-container">
        <button
          className="members-back-btn"
          onClick={() => router.push("/lists")}
        >
          ← Lists
        </button>

        <div className="manage-members-header">
          <div>
            <h1>Manage Members</h1>
            <p>{list.name}</p>
          </div>

          <div className="members-count">
            {members.length} Members
          </div>
        </div>

        <div className="members-tabs">
          <button
            className={activeTab === "members" ? "active" : ""}
            onClick={() => {
              setActiveTab("members");
              setSearch("");
            }}
          >
            Members
            <span>{members.length}</span>
          </button>

          <button
            className={activeTab === "suggested" ? "active" : ""}
            onClick={() => {
              setActiveTab("suggested");
              setSearch("");
            }}
          >
            Suggested
            <span>{suggested.length}</span>
          </button>
        </div>

        <div className="members-search">
          <span>⌕</span>
          <input
            type="text"
            placeholder={
              activeTab === "members"
                ? "Search members..."
                : "Search suggested users..."
            }
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        {error && <p className="members-error">{error}</p>}

        {activeTab === "members" ? (
          <section className="members-content">
            {filteredMembers.length === 0 ? (
              <div className="members-empty">
                <div>👥</div>
                <h3>No members yet</h3>
                <p>
                  Add people from the Suggested tab to your List.
                </p>
                <button onClick={() => setActiveTab("suggested")}>
                  Find People
                </button>
              </div>
            ) : (
              <div className="members-list">
                {filteredMembers.map((user) => (
                  <div className="member-card" key={user.id}>
                    <div className="member-avatar">
                      {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt={user.name || user.username} />
                      ) : (
                        <span>
                          {(user.name || user.username)
                            .charAt(0)
                            .toUpperCase()}
                        </span>
                      )}
                    </div>

                    <div className="member-info">
                      <h3>{user.name || user.username}</h3>
                      <p>@{user.username}</p>
                    </div>

                    <button
                      className="remove-member-btn"
                      onClick={() => handleRemoveMember(user.id)}
                      disabled={actionUserId === user.id}
                    >
                      {actionUserId === user.id
                        ? "Removing..."
                        : "Remove"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        ) : (
          <section className="members-content">
            {filteredSuggested.length === 0 ? (
              <div className="members-empty">
                <div>✨</div>
                <h3>No suggested users</h3>
                <p>
                  There are no more users available to add to this List.
                </p>
              </div>
            ) : (
              <div className="members-list">
                {filteredSuggested.map((user) => (
                  <div className="member-card" key={user.id}>
                    <div className="member-avatar">
                      {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt={user.name || user.username} />
                      ) : (
                        <span>
                          {(user.name || user.username)
                            .charAt(0)
                            .toUpperCase()}
                        </span>
                      )}
                    </div>

                    <div className="member-info">
                      <h3>{user.name || user.username}</h3>
                      <p>@{user.username}</p>
                    </div>

                    <button
                      className="add-member-btn"
                      onClick={() => handleAddMember(user.id)}
                      disabled={actionUserId === user.id}
                    >
                      {actionUserId === user.id ? "Adding..." : "+ Add"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

export default function ManageMembersPage() {
  return (
    <Suspense
      fallback={
        <div className="manage-members-page">
          <p className="members-loading">Loading members...</p>
        </div>
      }
    >
      <ManageMembersContent />
    </Suspense>
  );
}
