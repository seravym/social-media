"use client"
import "./profile.css";
import { useState } from "react";

export default function ProfilePage() {
    const [isEditOpen, setIsEditOpen] = useState(false);

    const [displayName, setDisplayName] = useState("Nama Akun");
    const [username, setUsername] = useState("@username");
    const [bio,setBio] = useState ("")

    const [draftName, setDraftName] = useState(displayName);
  const [draftUsername, setDraftUsername] = useState(username);
  const [draftBio, setDraftBio] = useState(bio);

    const openEditModal = () => {
        setDraftName (displayName);
        setDraftUsername(username);
        setDraftBio(bio);
        setIsEditOpen(true);
    };

    const handleSave = () => {
        const cleanName = draftName.trim() || "Nama Akun";
        const rawHandle = draftUsername.trim() || "@username";
        const cleanHandle = rawHandle.startsWith("@") ? rawHandle : `@${rawHandle}`;  
      

      setDisplayName(cleanName);
      setUsername(cleanHandle);
      setBio(draftBio.slice(0, 50));
      setIsEditOpen(false);
    };

  return (
    <div className="profile-layout">
      <main className="profile-page">
        <section className="profile-banner" >
            <img
            src= "/banner.jpg"
            alt= "banner tercinta"
            className="banner-img"
            />
            </section>
        

        <section className="profile-information">
          <div className="profile-top-row">
            <div className="profile-picture">
                <img
                src="/juhoon.jpg"
                alt="Ma juhoon Profile"
                className="avatar-img"
                />
            </div>

            <div className="profile-stats">
              <div>
                <strong>0</strong>
                <span>Followers</span>
              </div>
              <div>
                <strong>0</strong>
                <span>Following</span>
              </div>
            </div>

            <div className="profile-actions">
              <button type="button" onClick={openEditModal}
                >Edit Profile</button>
              <button type="button">Share</button>
            </div>
          </div>

          <div className="profile-details">
            <h2>{displayName}</h2>
            <p className ="profile-handle">{username}</p>
            {bio && <p className="profile-bio">{bio}</p>}
            <p className="profile-joined">bergabung sejak 2026</p>
          </div>
        </section>

        <section className="profile-navigation">
          <div className="active">Posts</div>
          <div>Replies</div>
          <div>Likes</div>
        </section>

        <section className="profile-posts">
          <div className="post-item">
            <p>
              <strong>Nama Akun</strong> @username
            </p>
            <p>kenapa aku begadang terus??</p>
            <div className = "post-actions">
                <span>💬 890</span>
                <span>♡ 15</span>
                <span>📊 1M</span>
                <span>🔖</span>
            </div>
          </div>
        </section>

        <section className="profile-posts">
          <div className="post-item">
            <p>
              <strong>Nama Akun</strong> @username
            </p>
            <p> Bismillah Front-End A</p>
            <div className = "post-actions">
                <span>💬 8</span>
                <span>♡ 15</span>
                <span>📊 1M</span>
                <span>🔖</span>
            </div>
          </div>
        </section>

      </main>

      

      <aside className="profile-sidebar">
        <input type="text" placeholder="Search..." />
        <div>
          <h3>Trending</h3>
          <p>#randomtrend</p>
        </div>
      </aside>

{isEditOpen && (
    <div className = "edit-backdrop">
        <div className = "edit-card">
            <div className = "edit-header">
                <span> MAKE UR PROFILE </span>
                <button
                type = "button"
                className = "edit-close-btn"
                onClick={() => setIsEditOpen(false)}
                > X </button>
            </div>
    

<div className = "edit-banner-box">
    <img
    src = "/banner.jpg"
    alt = "Ma Banner well"
    className = "edit-banner-img"
    />
    <div className = "edit-banner-actions">
        <button type = "button" className="edit-icon-btn">
            🎀📸
        </button>
    <button type = "button" className = "edit-icon-btn">
             ✦
    </button>
    </div>
</div>

    <div className = "edit-modal-profile">
        <div className= "edit-avatar">
            <div className = "edit-avt-circle">
                <img src="/juhoon.jpg" alt= "ma Profil" />
            </div>
            <button type = "button" className="edit-plus-avt">
                ⊹
            </button>
        </div>

        <div className = "edit-form-col">
            <label className = "edit-label">Nama Akun</label>
            <input type = "text" 
            className="edit-input" 
            value= {draftName}
             onChange={(e) => setDraftName(e.target.value)}
            />
            <label className = "edit-label">Id Akun</label>
             <input type = "text" 
            className="edit-input" 
            value= {draftUsername}
             onChange={(e) => setDraftUsername(e.target.value)}
            />
            <label className = "edit-label">Bio</label>
            <textarea
            maxLength={35}
            placeholder = "Maksimal 35 huruf"
            className = "edit-textarea"
            value ={draftBio}
            onChange={(e) => setDraftBio(e.target.value)}
            />
            <span className="edit-bio-counter">{draftBio.length}/35</span>
            <button
            type = "button"
            className = "edit-save-btn"
            onClick={handleSave}
            >
                ✿ Save ✿
        </button>
            </div>
          </div>
        </div>
      </div>
      )}
    </div>
  );
}