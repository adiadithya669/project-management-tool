const COLORS = ["#0F9D8A", "#5B5BD6", "#E5484D", "#F5A524", "#3E63DD", "#AB4ABA", "#12A594"];

export default function Avatar({ name = "?", size = 28 }) {
  const hue = [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % COLORS.length;
  return (
    <span className="avatar" title={name}
      style={{ background: COLORS[hue], width: size, height: size, fontSize: size * 0.42 }}>
      {name.slice(0, 2).toUpperCase()}
    </span>
  );
}
