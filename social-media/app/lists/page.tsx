
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import "./list-detail.css";

type User = {
  id: string;
  name: string;
  username: string;
  avatarUrl: string | null;
};

type ListMember = {
  id: number;
  userId: string;
  addedAt: string;
  user: User;
};

type ListDetail = {
  id: number;
  name: string;
  description: string | null;
  isPrivate: boolean;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  owner: User;
  members: ListMember[];
  _count: {
    members: number;
  };
};

export default function ListDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [list, setList] = useState<ListDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchListDetail() {
      try {
        const response = await fetch(`/api/lists/${id}`);
        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || "Failed to load list");
        }

        setList(result.data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Something went wrong"
        );
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchListDetail();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="list-detail-page">
        <p className="list-detail-loading">Loading list...</p>
      </div>
    );
  }

  if (error || !list) {
    return (
      <div className="list-detail-page">
        <button
          className="detail-back-btn"
          onClick={() => router.push("/lists")}
        >
          ← Back to Lists
        </button>

        <div className="detail-empty">
          <h2>List not found</h2>
          <p>{error || "This list may have been deleted."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="list-detail-page">
      <header className="list-detail-header">
        <button
          className="detail-back-btn"
          onClick={() => router.push("/lists")}
        >
          ← Back
        </button>

        <h1>List Details</h1>
      </header>

      <section className="list-detail-card">
        <div className="detail-title-row">
          <div>
            <span className="detail-label">
              {list.isPrivate ? "🔒 Private List" : "🌐 Public List"}
            </span>

            <h2>{list.name}</h2>
          </div>
        </div>

        <p className="detail-description">
          {list.description || "No description available."}
        </p>

        <div className="detail-owner">
          <div className="detail-avatar">
            {list.owner.avatarUrl ? (
              <img src={list.owner.avatarUrl} alt={list.owner.name} />
            ) : (
              <span>
                {list.owner.name?.charAt(0).toUpperCase() || "U"}
              </span>
            )}
          </div>

          <div>
            <strong>{list.owner.name}</strong>
            <p>@{list.owner.username}</p>
          </div>
        </div>

        <div className="detail-stats">
          <div>
            <strong>{list._count.members}</strong>
            <span>Members</span>
          </div>

          <div>
            <strong>
              {new Date(list.createdAt).toLocaleDateString("id-ID")}
            </strong>
            <span>Created</span>
          </div>
        </div>
      </section>

      <section className="list-members-section">
        <div className="members-heading">
          <h2>Members</h2>
          <span>{list._count.members} members</span>
        </div>

        {list.members.length === 0 ? (
          <div className="members-empty">
            <div className="members-empty-icon">👥</div>
            <h3>No members yet</h3>
            <p>Members added to this list will appear here.</p>
          </div>
        ) : (
          <div className="members-list">
            {list.members.map((member) => (
              <div className="member-item" key={member.id}>
                <div className="member-avatar">
                  {member.user.avatarUrl ? (
                    <img
                      src={member.user.avatarUrl}
                      alt={member.user.name}
                    />
                  ) : (
                    <span>
                      {member.user.name?.charAt(0).toUpperCase() || "U"}
                    </span>
                  )}
                </div>

                <div className="member-info">
                  <strong>{member.user.name}</strong>
                  <span>@{member.user.username}</span>
                </div>

                {member.userId === list.ownerId && (
                  <span className="owner-badge">Owner</span>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="detail-footer">
        <Link href="/lists">Back to Your Lists</Link>
      </div>
    </div>
  );
}
