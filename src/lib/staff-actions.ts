export interface ActionMeta {
  label: string;
  color: string;
  description: string;
}

export const ACTION_META: Record<string, ActionMeta> = {
  member_kick: { label: "Member Kicked", color: "#f87171", description: "A member was kicked from the Discord server." },
  member_ban: { label: "Member Banned", color: "#dc2626", description: "A member was banned from the Discord server." },
  member_unban: { label: "Member Unbanned", color: "#34d399", description: "A ban was lifted for a member." },
  role_change: { label: "Role Changed", color: "#fbbf24", description: "A member's roles were modified." },
  punish: { label: "Punishment Issued", color: "#ef4444", description: "A punishment role was applied to a member." },
  unpunish: { label: "Punishment Removed", color: "#34d399", description: "A punishment role was removed from a member." },
  application_approve: { label: "Application Approved", color: "#22c55e", description: "An application was approved." },
  application_deny: { label: "Application Denied", color: "#f87171", description: "An application was denied." },
  ticket_assign: { label: "Ticket Assigned", color: "#60a5fa", description: "A ticket was assigned to a staff member." },
  ticket_close: { label: "Ticket Closed", color: "#94a3b8", description: "A ticket was closed." },
  announcement_create: { label: "Announcement Created", color: "#f59e0b", description: "A new announcement was posted." },
  announcement_delete: { label: "Announcement Deleted", color: "#f59e0b", description: "An announcement was removed." },
  note_create: { label: "Staff Note Added", color: "#c084fc", description: "A staff note was added to a member." },
  note_delete: { label: "Staff Note Deleted", color: "#c084fc", description: "A staff note was removed." },
  config_update: { label: "Config Updated", color: "#38bdf8", description: "Server configuration was changed." },
  login: { label: "Logged In", color: "#94a3b8", description: "A staff member signed in." },
  app_config_editor_add: { label: "Editor Granted", color: "#34d399", description: "A member or role was granted permission to edit an application's questions." },
  app_config_editor_remove: { label: "Editor Revoked", color: "#f87171", description: "A member or role lost permission to edit an application's questions." },
  application_viewer_add: { label: "Viewer Granted", color: "#c084fc", description: "A member or role was granted permission to view an application's submissions." },
  application_viewer_remove: { label: "Viewer Revoked", color: "#f87171", description: "A member or role lost permission to view an application's submissions." },
  application_questions_update: { label: "Questions Updated", color: "#fbbf24", description: "An application's questions were edited." },
};

export function getActionMeta(action: string): ActionMeta {
  return (
    ACTION_META[action] || {
      label: action.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      color: "#94a3b8",
      description: "",
    }
  );
}
