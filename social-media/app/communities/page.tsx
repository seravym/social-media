export default function CommunitiesPage() {
  return (
    <div className="communities-page">

      <div className="communities-header">
        <h1>Communities</h1>
        <p>Explore communities on X</p>
      </div>

      <div className="communities-search">
        <input
          type="text"
          placeholder="Search communities"
        />
      </div>

      <div className="communities-content">
        <h2>Discover Communities</h2>

        <div className="community-card">
          <h3>Frontend Developers</h3>
          <p>
            A place to discuss frontend development, React,
            Next.js, and web technologies.
          </p>
          <span>1,250 members</span>
          <button>Join</button>
        </div>

        <div className="community-card">
          <h3>Programming Community</h3>
          <p>
            Share knowledge, discuss coding, and learn
            together with other programmers.
          </p>
          <span>2,400 members</span>
          <button>Join</button>
        </div>

      </div>

    </div>
  );
}