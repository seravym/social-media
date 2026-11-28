
"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import "./list-detail.css";

type User = {
  id: string;
  name: string | null;
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

type Post = {
  id: string;
  content: string;
  views: number;
  createdAt: string;
  author: User;
  repliesCount: number;
  likesCount: number;
  isLiked: boolean;
  isBookmarked: boolean;
};

function ListDetailContent() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [list, setList] = useState<ListDetail | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(true);
  const [error, setError] = useState("");
  const [postsError, setPostsError] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        const [listResponse, postsResponse] = await Promise.all([
          fetch(`/api/lists/${id}`),
          fetch(`/api/lists/${id}/posts`),
        ]);

        const [listResult, postsResult] = await Promise.all([
          listResponse.json(),
          postsResponse.json(),
        ]);

        if (!listResponse.ok || !listResult.success) {
          throw new Error(listResult.message || "Failed to load list");
        }

        setList(listResult.data);

        if (!postsResponse.ok || !postsResult.success) {
          setPostsError(
            postsResult.message || "Failed to load List Timeline."
          );
        } else {
          setPosts(postsResult.posts || []);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Something went wrong"
        );
      } finally {
        setLoading(false);
        setPostsLoading(false);
      }
    }

    if (id) {
      fetchData();
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
          Created by:{" "}
          {list.owner?.name ||
            (list.owner?.username
              ? `@${list.owner.username}`
              : "Unknown")}
        </p>

        <p>
          Created on:{" "}
          {new Date(list.createdAt).toLocaleDateString("id-ID")}
        </p>

        <p>Total Members: {list._count.members}</p>
      </div>

      <div className="list-members-section">
        <div className="members-section-header">
          <div>
            <h2>Members</h2>
            <p>{list._count.members} accounts in this List</p>
          </div>

          <button
            className="manage-members-button"
            onClick={() => router.push(`/lists/${id}/members`)}
          >
            Manage Members
          </button>
        </div>

        {list.members.length === 0 ? (
          <p>No members in this list yet.</p>
        ) : (
          <div className="members-list">
            {list.members.map((member) => (
              <div className="member-item" key={member.id}>
                <div>
                  <strong>
                    {member.user.name || `@${member.user.username}`}
                  </strong>
                  <p>@{member.user.username}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="list-timeline-section">
        <div className="list-timeline-header">
          <h2>List Timeline</h2>
          <p>Latest posts from accounts in this List</p>
        </div>

        {postsLoading ? (
          <div className="timeline-empty">
            <p>Loading posts...</p>
          </div>
        ) : postsError ? (
          <div className="timeline-empty">
            <p>{postsError}</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="timeline-empty">
            <div className="timeline-empty-icon">📝</div>
            <h3>No posts yet</h3>
            <p>
              Posts from accounts added to this List will appear here.
            </p>
          </div>
        ) : (
          <div className="list-posts">
            {posts.map((post) => (
              <article className="list-post-card" key={post.id}>
                <div className="list-post-author">
                  {post.author.avatarUrl ? (
                    <img
                      src={post.author.avatarUrl}
                      alt={post.author.username}
                      className="list-post-avatar"
                    />
                  ) : (
                    <div className="list-post-avatar-placeholder">
                      {(post.author.name || post.author.username)
                        .charAt(0)
                        .toUpperCase()}
                    </div>
                  )}

                  <div className="list-post-author-info">
                    <strong>
                      {post.author.name || `@${post.author.username}`}
                    </strong>
                    <span>
                      @{post.author.username} ·{" "}
                      {new Date(post.createdAt).toLocaleString("id-ID", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </span>
                  </div>
                </div>

                <p className="list-post-content">{post.content}</p>

                <div className="list-post-stats">
                  <span>💬 {post.repliesCount} Replies</span>
                  <span>
                    {post.isLiked ? "❤️" : "♡"} {post.likesCount} Likes
                  </span>
                  <span>👁️ {post.views} Views</span>
                </div>
              </article>
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
