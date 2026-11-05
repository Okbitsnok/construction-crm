export type UserRole = "manager" | "executor";
export type TaskStatus = "new" | "in_progress" | "in_review" | "accepted" | "rework";

// Insert and Update list only the columns the API role is granted (see migrations).
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: { id: string; full_name: string; role: UserRole; created_at: string };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      objects: {
        Row: {
          id: string;
          name: string;
          address: string;
          created_by: string;
          created_at: string;
          deleted_at: string | null;
        };
        Insert: { name: string; address: string };
        Update: { name?: string; address?: string };
        Relationships: [
          {
            foreignKeyName: "objects_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      tasks: {
        Row: {
          id: string;
          title: string;
          description: string;
          object_id: string;
          assignee_id: string;
          status: TaskStatus;
          author_id: string;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: { title: string; description?: string; object_id: string; assignee_id: string };
        Update: { title?: string; description?: string; object_id?: string; assignee_id?: string };
        Relationships: [
          {
            foreignKeyName: "tasks_object_id_fkey";
            columns: ["object_id"];
            isOneToOne: false;
            referencedRelation: "objects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tasks_assignee_id_fkey";
            columns: ["assignee_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tasks_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      task_status_history: {
        Row: {
          id: number;
          task_id: string;
          from_status: TaskStatus | null;
          to_status: TaskStatus;
          changed_by: string;
          comment: string | null;
          changed_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [
          {
            foreignKeyName: "task_status_history_task_id_fkey";
            columns: ["task_id"];
            isOneToOne: false;
            referencedRelation: "tasks";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "task_status_history_changed_by_fkey";
            columns: ["changed_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<never, never>;
    Functions: {
      get_available_transitions: {
        Args: { p_task_id: string };
        Returns: { to_status: TaskStatus; comment_required: boolean }[];
      };
      change_task_status: {
        Args: { p_task_id: string; p_new_status: TaskStatus; p_comment?: string };
        Returns: undefined;
      };
      delete_task: { Args: { p_task_id: string }; Returns: undefined };
      delete_object: { Args: { p_object_id: string }; Returns: undefined };
    };
    Enums: { user_role: UserRole; task_status: TaskStatus };
    CompositeTypes: Record<never, never>;
  };
};
