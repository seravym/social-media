
"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import "./communities.css";

type Community = {
  id: number;
  name: string;
  description: string | null;
  image: string | null;
  creatorId: string;
  createdAt: string;
  isJoined: boolean;
  _count?: {
    members: number;
  };
};

export default function CommunitiesPage() {
  const router = useRouter();

  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [actionError, setActionError] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [communityName, setCommunityName] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [formError, setFormError] = useState("");

  async function fetchCommunities(): Promise<Community[]> {
    const response = await fetch("/api/commmunities");
    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Failed to fetch communities");
    }

    const communitiesData = result.data as Community[];

    return Promise.all(
      communitiesData.map(async (community) => {
        try {
          const membershipResponse = await fetch(
            `/api/commmunities/${community.id}/membership`
          );

          const membershipResult = await membershipResponse.json();

          return {
            ...community,
            isJoined: membershipResponse.ok
              ? membershipResult.isMember
              : false,
          };
        } catch {
          return {
            ...community,
            isJoined: false,
          };
        }
      })
    );
  }

  useEffect(() => {
    let ignore = false;

    fetchCommunities()
      .then((data) => {
        if (!ignore) {
          setCommunities(data);
        }
      })
      .catch((error) => {
        console.error("Failed to fetch communities:", error);
      })
      .finally(() => {
        if (!ignore) {
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  const filteredCommunities = communities.filter((community) =>
    community.name.toLowerCase().includes(search.toLowerCase())
  );

  async function handleMembership(community: Community) {
    setProcessingId(community.id);
    setActionError("");

    try {
      const response = await fetch(
        `/api/commmunities/${community.id}/membership`,
        {
          method: community.isJoined ? "DELETE" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: process.env.NEXT_PUBLIC_TEST_USER_ID,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to update membership");
      }

      setCommunities((previous) =>
        previous.map((item) =>
          item.id === community.id
            ? {
                ...item,
                isJoined: !community.isJoined,
                _count: {
                  members: Math.max(
                    0,
                    (item._count?.members ?? 0) +
                      (community.isJoined ? -1 : 1)
                  ),
                },
              }
            : item
        )
      );
    } catch (error) {
      console.error("Community Membership Error:", error);
      setActionError(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setProcessingId(null);
    }
  }

  async function handleCreateCommunity(e: FormEvent<HTMLFormElement>) {
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
    setSubmitting(true);

    try {
      const response = await fetch("/api/commmunities", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: communityName.trim(),
          description: description.trim(),
          image: image.trim(),
          creatorId: process.env.NEXT_PUBLIC_TEST_USER_ID,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setFormError(result.message || "Failed to create community.");
        return;
      }

      const updatedCommunities = await fetchCommunities();
      setCommunities(updatedCommunities);

      setShowModal(false);
      setCommunityName("");
      setDescription("");
      setImage("");
      setFormError("");
    } catch (error) {
      console.error("Create Community Error:", error);
      setFormError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function closeModal() {
    if (submitting) return;

    setShowModal(false);
    setFormError("");
  }

  return (
    <div className="communities-page">
      <div className="communities-container">
        <div className="communities-header">
          <div>
            <p className="communities-subtitle">
              YOUR COMMUNITY SPACE
            </p>

            <h1>Communities</h1>

            <p className="communities-description">
              Discover communities and connect with people who share your interests.
            </p>
          </div>

          <button
            className="create-community-btn"
            onClick={() => setShowModal(true)}
          >
            + Create Community
          </button>
        </div>

        <div className="community-page-tabs">
          <Link
            href="/communities/home"
            className="community-page-tab"
          >
            Home
          </Link>

          <Link
            href="/communities"
            className="community-page-tab active"
          >
            Explore
          </Link>
        </div>

        <div className="community-explore-heading">
          <div>
            <h2>Explore Communities</h2>
            <p>Find a community that matches your interests.</p>
          </div>
        </div>

        <div className="community-search">
          <input
            type="text"
            placeholder="Search communities..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {actionError && (
          <p className="form-error">{actionError}</p>
        )}

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
              <div
                className="community-card"
                key={community.id}
                onClick={() =>
                  router.push(`/communities/${community.id}`)
                }
                style={{ cursor: "pointer" }}
              >
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

                  <button
                    type="button"
                    className={
                      community.isJoined
                        ? "leave-community-btn"
                        : "join-community-btn"
                    }
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMembership(community);
                    }}
                    disabled={processingId === community.id}
                  >
                    {processingId === community.id
                      ? "Please wait..."
                      : community.isJoined
                        ? "Leave"
                        : "Join"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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
                disabled={submitting}
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
                  required
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
                  disabled={submitting}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="submit-btn"
                  disabled={submitting}
                >
                  {submitting ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
