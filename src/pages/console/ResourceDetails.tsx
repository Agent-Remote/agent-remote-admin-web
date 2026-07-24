import { DetailRow } from "../../components/ui";
import type {
  AuditLog,
  NodeTask
} from "../../types";
import { formatDate } from "../../utils/format";
export function TaskRow({ task }: { task: NodeTask }) {
  return (
    <DetailRow
      title={task.task_type}
      status={task.status}
      meta={task.task_id}
      value={{ payload: task.payload, result: task.result }}
    />
  );
}

export function AuditRow({ item }: { item: AuditLog }) {
  return (
    <DetailRow
      title={item.action}
      meta={`${item.target_type ?? "-"} · ${item.target_id ?? "-"} · ${formatDate(item.created_at)}`}
      value={item.details}
    />
  );
}
