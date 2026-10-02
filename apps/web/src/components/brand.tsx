import { Link } from "@tanstack/react-router";

export function Brand({ to = "/" }: { to?: "/" | "/explore" }) {
  return (
    <Link to={to} className="brand" aria-label="Touch Grass home">
      <img
        className="brand-mark"
        src="/icon.svg"
        alt=""
        width={29}
        height={29}
      />
      touch grass
    </Link>
  );
}
