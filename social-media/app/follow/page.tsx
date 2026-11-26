"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

interface UserItem {
  id: string;
  name: string | null;
  username: string;
  avatarUrl: string | null;
  followersCount: number;
  followingCount: number;
  isFollowing: boolean;
}

export default function FollowPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadUsers() {
      try {
        const res = await fetch("/api/follow");
        const data = await res.json();
        if (cancelled) return;

        if (!res.ok) {
          setErrorMsg(data.error || "Gagal memuat daftar pengguna");
        } else {
          setUsers(data.users || []);
        }
      } catch {
        if (!cancelled) setErrorMsg("Terjadi kesalahan jaringan");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadUsers();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleToggleFollow = async (targetUserId: string) => {
    try {
      const res = await fetch("/api/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ followingId: targetUserId }),
      });
      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Gagal memproses follow");
        return;
      }

      setUsers((prev) =>
        prev.map((u) => {
          if (u.id !== targetUserId) return u;
          return {
            ...u,
            isFollowing: data.following,
            followersCount: data.following
              ? u.followersCount + 1
              : u.followersCount - 1,
          };
        })
      );
    } catch {
      alert("Terjadi kesalahan saat memproses follow");
    }
  };

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto", padding: "16px" }}>
      <nav>
        <Link href="/home">← Kembali ke Home</Link>
      </nav>

      <hr />

      <h1>Who to Follow</h1>

      {errorMsg && <p style={{ color: "red" }}>{errorMsg}</p>}

      {loading ? (
        <p>Memuat pengguna...</p>
      ) : users.length === 0 ? (
        <p>Belum ada pengguna lain yang terdaftar.</p>
      ) : (
        users.map((user) => (
          <div
            key={user.id}
            style={{
              border: "1px solid gray",
              padding: "12px",
              margin: "10px 0",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <p style={{ margin: 0 }}>
                <strong>{user.name || user.username}</strong> @{user.username}
              </p>
              <p style={{ margin: 0, fontSize: "0.85rem", color: "gray" }}>
                {user.followersCount} Followers · {user.followingCount} Following
              </p>
            </div>
            <button onClick={() => handleToggleFollow(user.id)}>
              {user.isFollowing ? "Following" : "Follow"}
            </button>
          </div>
        ))
      )}
    </div>
  );
}