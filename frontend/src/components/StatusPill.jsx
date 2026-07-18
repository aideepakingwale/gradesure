import { STATUS } from "../utils/ui.js";

export default function StatusPill({ status }) {
  const s = STATUS[status] || STATUS.not_started;
  return <span className={`badge ${s.cls}`}>{s.label}</span>;
}
