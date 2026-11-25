
"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
  owner: User;
  members: ListMember[];
  _count: {
    members: number;
  };
};

function ListDetailContent() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [list, setList] = useState<ListDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchList() {
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
      fetchList();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="list-detail-page">
        <p>Loading list...</p>
      </div>
    );
  }

  if (error || !list) {
    return (
      <div className="list-detail-page">
        <button onClick={() => router.push("/lists")}>
          Back to Lists
        </button>
        <p>{error || "List not found"}</p>
      </div>
    );
  }

  return (
    <div className="list-detail-page">
      <div className="list-detail-header">
        <button
          className="back-button"
          onClick={() => router.push("/lists")}
        >
          ← Back to Lists
        </button>

        <h1>{list.name}</h1>
        <p>{list.description || "No description available."}</p>

        <span>
          {list.isPrivate ? "🔒 Private List" : "🌐 Public List"}
        </span>
      </div>

      <div className="list-detail-card">
        <h2>List Information</h2>

        <p>
          Created by: {list.owner?.name || "Unknown"}
        </p>

        <p>
          @{list.owner?.username || "unknown"}
        </p>

        <p>
          Created on:{" "}
          {new Date(list.createdAt).toLocaleDateString("id-ID")}
        </p>

        <p>
          Total Members: {list._count.members}
        </p>
      </div>

      <div className="list-members-section">
        <h2>Members</h2>

        {list.members.length === 0 ? (
          <p>No members in this list yet.</p>
        ) : (
          <div className="members-list">
            {list.members.map((member) => (
              <div className="member-item" key={member.id}>
                <div>
                  <strong>{member.user.name}</strong>
                  <p>@{member.user.username}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ListDetail() {
  return (
    <Suspense
      fallback={
        <div className="list-detail-page">
          <p>Loading list...</p>
        </div>
      }
    >
      <ListDetailContent />
    </Suspense>
  );
}
