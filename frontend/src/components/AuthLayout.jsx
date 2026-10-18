export default function AuthLayout({ children }) {
  return (
    <div className="auth-page">
      <section className="auth-hero">
        <div className="brand"><span className="brand-mark" />Taskboard</div>
        <h1>Plan the work.<br />Ship it together.</h1>
        <p>Organize projects, assign tasks to your team, and watch progress move across the board.</p>
        <div className="hero-board">
          <div><i className="dot dot-todo" />To do<b /><b className="short" /></div>
          <div><i className="dot dot-progress" />In progress<b /></div>
          <div><i className="dot dot-done" />Done<b /><b className="short" /><b /></div>
        </div>
      </section>
      <section className="auth-panel">{children}</section>
    </div>
  );
}
