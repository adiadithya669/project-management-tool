import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, { errorText } from "../api";
import { useAuth } from "../AuthContext";
import Avatar from "../components/Avatar";

export default function Dashboard() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [form, setForm] = useState({ name: "", description: "" });
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");

  const load = () => api.get("/projects/").then((r) => setProjects(r.data));
  useEffect(() => { load().catch((e) => setError(errorText(e))); }, []);

  const total = projects.reduce((n, p) => n + p.task_count, 0);
  const done = projects.reduce((n, p) => n + p.done_count, 0);

  const create = async (e) => {
    e.preventDefault();
    try {
      await api.post("/projects/", form);
      setForm({ name: "", description: "" });
      setOpen(false);
      setError("");
      await load();
      window.dispatchEvent(new Event("projects:changed"));
    } catch (err) {
      setError(errorText(err));
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this project and all its tasks?")) return;
    await api.delete(`/projects/${id}/`).catch((e) => setError(errorText(e)));
    await load();
    window.dispatchEvent(new Event("projects:changed"));
  };

  return (
    <>
      <header className="page-head">
        <div>
          <h1>Hi, {user.username}</h1>
          <p className="muted">Here is where your projects stand today.</p>
        </div>
        <button className="btn" onClick={() => setOpen(!open)}>{open ? "Cancel" : "New project"}</button>
      </header>
      {error && <p className="error">{error}</p>}

      <section className="stats">
        <div className="stat"><span className="stat-num">{projects.length}</span>Projects</div>
        <div className="stat"><span className="stat-num">{total - done}</span>Open tasks</div>
        <div className="stat"><span className="stat-num">{done}</span>Completed</div>
      </section>

      {open && (
        <form className="panel row-form" onSubmit={create}>
          <input autoFocus placeholder="Project name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <input placeholder="What is it about? (optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <button className="btn" type="submit">Create project</button>
        </form>
      )}

      {projects.length === 0 ? (
        <div className="empty">
          <h3>No projects yet</h3>
          <p className="muted">Create a project to start tracking tasks with your team.</p>
        </div>
      ) : (
        <div className="grid">
          {projects.map((p) => {
            const pct = p.task_count ? Math.round((p.done_count / p.task_count) * 100) : 0;
            return (
              <article className="project-card" key={p.id}>
                <h3><Link to={`/projects/${p.id}`}>{p.name}</Link></h3>
                <p className="muted clamp">{p.description || "No description"}</p>
                <div className="progress-row">
                  <div className="progress"><div style={{ width: `${pct}%` }} /></div>
                  <span className="small">{pct}%</span>
                </div>
                <div className="card-foot">
                  <div className="avatar-stack">
                    {p.members_detail.slice(0, 4).map((m) => <Avatar key={m.id} name={m.username} />)}
                  </div>
                  <span className="small muted">{p.done_count}/{p.task_count} done</span>
                  {p.owner === user.id && (
                    <button className="link-btn danger" onClick={() => remove(p.id)}>Delete</button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}
