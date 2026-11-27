
"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import "./detail.css";

type Author = {
  id: string;
  name: string | null;
  username: string;
  avatarUrl: string | null;
};

type Post = {
  id: string;
  content: string;
  views: number;
  createdAt: string;
  author: Author;
  _count: {
    comments: number;
    likes: number;
  };
};

type Community = {
  id: number;
  name: string;
  description: string | null;
  image: string | null;
  creatorId: string;
  createdAt: string;
  creator: Author;
  members: {
    userId: string;
  }[];
  posts: Post[];
  _count: {
    members: number;
    posts: number;
  };
};

function CommunityDetailContent() {
  const params = useParams<{ id: string }>();
  const communityId = params.id;

  const [community, setCommunity] = useState<Community | null>(null);
  const [isJoined, setIsJoined] = useState(false);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    async function loadData() {
      setLoading(true);
      setError("");

      try {
        const [communityResponse, membershipResponse] =
          await Promise.all([
            fetch(`/api/commmunities/${communityId}`),
            fetch(`/api/commmunities/${communityId}/membership`),
          ]);

        const communityResult = await communityResponse.json();
        const membershipResult = await membershipResponse.json();

        if (!communityResponse.ok || !communityResult.success) {
          throw new Error(
            communityResult.message ||
              communityResult.error ||
              `Failed to fetch community (${communityResponse.status})`
          );
        }

        if (!membershipResponse.ok || !membershipResult.success) {
          throw new Error(
            membershipResult.message ||
              membershipResult.error ||
              `Failed to check membership (${membershipResponse.status})`
          );
        }

        if (!ignore) {
          setCommunity(communityResult.data);
          setIsJoined(membershipResult.isMember);
        }
      } catch (err) {
        if (!ignore) {
          setError(
            err instanceof Error
              ? err.message
              : "Something went wrong."
          );
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      ignore = true;
    };
  }, [communityId]);

  async function handleMembership() {
    if (!community) return;

    setProcessing(true);
    setError("");

    try {
      const response = await fetch(
        `/api/commmunities/${community.id}/membership`,
        {
          method: isJoined ? "DELETE" : "POST",
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
        throw new Error(
          result.message ||
            result.error ||
            "Failed to update membership"
        );
      }

      setIsJoined(!isJoined);

      setCommunity((previous) => {
        if (!previous) return previous;

        return {
          ...previous,
          _count: {
            ...previous._count,
            members: Math.max(
              0,
              previous._count.members + (isJoined ? -1 : 1)
            ),
          },
        };
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong."
      );
    } finally {
      setProcessing(false);
    }
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleString("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }

  if (loading) {
    return (
      <div className="community-detail-page">
        <p className="detail-loading">Loading community...</p>
      </div>
    );
  }

  if (!community) {
    return (
      <div className="community-detail-page">
        <Link href="/communities" className="detail-back">
          ← Back to Communities
        </Link>

        <div className="detail-error">
          {error || "Community not found."}
        </div>
      </div>
    );
  }

  return (
    <div className="community-detail-page">
      <div className="community-detail-container">
        <Link href="/communities" className="detail-back">
          ← Back to Communities
        </Link>

        {error && <div className="detail-error">{error}</div>}

        <section className="detail-community-header">
          <div className="detail-community-image">
            {community.image ? (
              <img src={community.image} alt={community.name} />
            ) : (
              <span>🌷</span>
            )}
          </div>

          <div className="detail-community-info">
            <p className="detail-subtitle">COMMUNITY</p>

            <h1>{community.name}</h1>

            <p className="detail-description">
              {community.description || "No description available."}
            </p>

            <div className="detail-meta">
              <span>👥 {community._count.members} members</span>
              <span>📝 {community._count.posts} posts</span>
            </div>

            <p className="detail-creator">
              Created by{" "}
              <strong>
                {community.creator.name ||
                  community.creator.username}
              </strong>
            </p>

            <button
              type="button"
              className={
                isJoined ? "detail-leave-btn" : "detail-join-btn"
              }
              onClick={handleMembership}
              disabled={processing}
            >
              {processing
                ? "Please wait..."
                : isJoined
                  ? "Leave Community"
                  : "Join Community"}
            </button>
          </div>
        </section>

        <section className="detail-posts-section">
          <div className="detail-posts-heading">
            <h2>Community Posts</h2>
            <span>{community.posts.length} posts</span>
          </div>

          {community.posts.length === 0 ? (
            <div className="detail-empty">
              <div>🌸</div>
              <h3>No posts yet</h3>
              <p>
                Be the first to share something with this community!
              </p>
            </div>
          ) : (
            <div className="detail-post-list">
              {community.posts.map((post) => (
                <article
                  className="detail-post-card"
                  key={post.id}
                >
                  <div className="detail-post-author">
                    {post.author.avatarUrl ? (
                      <img
                        src={post.author.avatarUrl}
                        alt={post.author.username}
                      />
                    ) : (
                      <div className="detail-avatar-placeholder">
                        {(post.author.name || post.author.username)
                          .charAt(0)
                          .toUpperCase()}
                      </div>
                    )}

                    <div>
                      <strong>
                        {post.author.name || post.author.username}
                      </strong>
                      <span>@{post.author.username}</span>
                    </div>
                  </div>

                  <p className="detail-post-content">
                    {post.content}
                  </p>

                  <div className="detail-post-footer">
                    <span>{formatDate(post.createdAt)}</span>
                    <span>💬 {post._count.comments}</span>
                    <span>❤️ {post._count.likes}</span>
                    <span>👁 {post.views}</span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default function CommunityDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="community-detail-page">
          <p className="detail-loading">Loading community...</p>
        </div>
      }
    >
      <CommunityDetailContent />
    </Suspense>
  );
}
