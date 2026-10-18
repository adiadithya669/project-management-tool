import { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import api from "../api";
import { useAuth } from "../AuthContext";
import Avatar from "./Avatar";

export default function Sidebar() {
  const { user, logout } = useAuth();
  const [projects, setProjects] = useState([]);
  const { pathname } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const load = () => api.get("/projects/").then((r) => setProjects(r.data)).catch(() => {});
    load();
    window.addEventListener("projects:changed", load);
    return () => window.removeEventListener("projects:changed", load);
  }, [pathname]);

  return (
    <aside className="sidebar">
      <div className="brand"><span className="brand-mark" />Taskboard</div>
      <nav>
        <NavLink to="/" end className="nav-link">Overview</NavLink>
        <p className="nav-heading">Your projects</p>
        {projects.length === 0 && <p className="nav-empty">No projects yet</p>}
        {projects.map((p) => (
          <NavLink key={p.id} to={`/projects/${p.id}`} className="nav-link">{p.name}</NavLink>
        ))}
      </nav>
      <div className="sidebar-user">
        <Avatar name={user.username} size={32} />
        <span className="user-name">{user.username}</span>
        <button className="link-btn" onClick={() => { logout(); navigate("/login"); }}>Log out</button>
      </div>
    </aside>
  );
}
