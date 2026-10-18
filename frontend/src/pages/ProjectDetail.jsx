import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api, { errorText } from "../api";
import { useAuth } from "../AuthContext";
import Avatar from "../components/Avatar";

const COLUMNS = [
  ["todo", "To do", "dot-todo"],
  ["in_progress", "In progress", "dot-progress"],
  ["done", "Done", "dot-done"],
];
const EMPTY_TASK = { title: "", description: "", priority: "medium", assignee: "", due_date: "" };
const today = () => new Date().toISOString().slice(0, 10);

export default function ProjectDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [form, setForm] = useState(EMPTY_TASK);
  const [showForm, setShowForm] = useState(false);
  const [member, setMember] = useState("");
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const [p, t] = await Promise.all([api.get(`/projects/${id}/`), api.get(`/tasks/?project=${id}`)]);
      setProject(p.data);
      setTasks(t.data);
    } catch (err) {
      setError(errorText(err));
    }
  }, [id]);

  useEffect(() => { setProject(null); load(); }, [load]);

  const addTask = async (e) => {
    e.preventDefault();
    try {
      await api.post("/tasks/", { ...form, project: Number(id), assignee: form.assignee || null, due_date: form.due_date || null });
      setForm(EMPTY_TASK);
      setShowForm(false);
      setError("");
      load();
    } catch (err) {
      setError(errorText(err));
    }
  };

  const updateTask = async (task, patch) => {
    await api.patch(`/tasks/${task.id}/`, patch).catch((e) => setError(errorText(e)));
    load();
  };

  const deleteTask = async (task) => {
    await api.delete(`/tasks/${task.id}/`).catch((e) => setError(errorText(e)));
    setSelected(null);
    load();
  };

  const addMember = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/projects/${id}/add_member/`, { username: member });
      setMember("");
      setError("");
      load();
    } catch (err) {
      setError(errorText(err));
    }
  };

  if (!project) return <p className="center muted">{error || "Loading…"}</p>;
  const isOwner = project.owner === user.id;
  const pct = project.task_count ? Math.round((project.done_count / project.task_count) * 100) : 0;

  return (
    <>
      <header className="page-head">
        <div>
          <p className="crumb"><Link to="/">Overview</Link> / Project</p>
          <h1>{project.name}</h1>
          <p className="muted">{project.description}</p>
        </div>
        <button className="btn" onClick={() => setShowForm(!showForm)}>{showForm ? "Cancel" : "New task"}</button>
      </header>
      {error && <p className="error">{error}</p>}

      <section className="panel meta-row">
        <div className="meta">
          <span className="small muted">Progress</span>
          <div className="progress-row"><div className="progress"><div style={{ width: `${pct}%` }} /></div><b>{pct}%</b></div>
        </div>
        <div className="meta">
          <span className="small muted">Team</span>
          <div className="avatar-stack">{project.members_detail.map((m) => <Avatar key={m.id} name={m.username} size={30} />)}</div>
        </div>
        {isOwner && (
          <form className="inline-form" onSubmit={addMember}>
            <input placeholder="Invite by username" value={member} onChange={(e) => setMember(e.target.value)} required />
            <button className="btn btn-ghost btn-sm" type="submit">Add member</button>
          </form>
        )}
      </section>

      {showForm && (
        <form className="panel row-form" onSubmit={addTask}>
          <input autoFocus placeholder="What needs to be done?" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
            <option value="low">Low priority</option>
            <option value="medium">Medium priority</option>
            <option value="high">High priority</option>
          </select>
          <select value={form.assignee} onChange={(e) => setForm({ ...form, assignee: e.target.value })}>
            <option value="">Unassigned</option>
            {project.members_detail.map((m) => <option key={m.id} value={m.id}>{m.username}</option>)}
          </select>
          <input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
          <button className="btn" type="submit">Add task</button>
        </form>
      )}

      <div className="board">
        {COLUMNS.map(([status, label, dot]) => {
          const items = tasks.filter((t) => t.status === status);
          return (
            <section className="column" key={status}>
              <h3><i className={`dot ${dot}`} />{label}<span className="count">{items.length}</span></h3>
              {items.length === 0 && <p className="muted small empty-col">Nothing here yet.</p>}
              {items.map((t) => {
                const overdue = t.due_date && t.due_date < today() && t.status !== "done";
                return (
                  <article className={`task prio-${t.priority}`} key={t.id}>
                    <button className="task-title" onClick={() => setSelected(t)}>{t.title}</button>
                    <div className="task-meta">
                      <span className={`chip chip-${t.priority}`}>{t.priority}</span>
                      {t.due_date && <span className={`chip ${overdue ? "chip-overdue" : ""}`}>{overdue ? "Overdue " : "Due "}{t.due_date}</span>}
                      {t.assignee_name && <Avatar name={t.assignee_name} size={24} />}
                    </div>
                    <select aria-label="Move task" value={t.status} onChange={(e) => updateTask(t, { status: e.target.value })}>
                      {COLUMNS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  </article>
                );
              })}
            </section>
          );
        })}
      </div>

      {selected && <TaskModal task={selected} onClose={() => setSelected(null)} onDelete={() => deleteTask(selected)} />}
    </>
  );
}

function TaskModal({ task, onClose, onDelete }) {
  const [comments, setComments] = useState([]);
  const [text, setText] = useState("");

  const load = useCallback(() => api.get(`/comments/?task=${task.id}`).then((r) => setComments(r.data)), [task.id]);
  useEffect(() => { load(); }, [load]);

  const post = async (e) => {
    e.preventDefault();
    await api.post("/comments/", { task: task.id, text });
    setText("");
    load();
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{task.title}</h2>
        <p className="muted">{task.description || "No description."}</p>
        <h4>Comments</h4>
        {comments.length === 0 && <p className="muted small">No comments yet. Start the conversation.</p>}
        {comments.map((c) => (
          <div className="comment" key={c.id}>
            <Avatar name={c.author_name} size={26} />
            <div><b>{c.author_name}</b><p>{c.text}</p></div>
          </div>
        ))}
        <form className="inline-form" onSubmit={post}>
          <input placeholder="Write a comment" value={text} onChange={(e) => setText(e.target.value)} required />
          <button className="btn btn-sm" type="submit">Post comment</button>
        </form>
        <div className="modal-actions">
          <button className="link-btn danger" onClick={onDelete}>Delete task</button>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
