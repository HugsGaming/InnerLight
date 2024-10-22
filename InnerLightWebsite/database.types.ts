export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[];

export type Database = {
    public: {
        Tables: {
            auditLogs: {
                Row: {
                    action_type: string | null;
                    add_info: Json | null;
                    created_at: string;
                    id: string;
                    user_id: string | null;
                };
                Insert: {
                    action_type?: string | null;
                    add_info?: Json | null;
                    created_at?: string;
                    id?: string;
                    user_id?: string | null;
                };
                Update: {
                    action_type?: string | null;
                    add_info?: Json | null;
                    created_at?: string;
                    id?: string;
                    user_id?: string | null;
                };
                Relationships: [];
            };
            commentDownVote: {
                Row: {
                    comment_id: string | null;
                    created_at: string;
                    id: number;
                    user_id: string | null;
                };
                Insert: {
                    comment_id?: string | null;
                    created_at?: string;
                    id?: number;
                    user_id?: string | null;
                };
                Update: {
                    comment_id?: string | null;
                    created_at?: string;
                    id?: number;
                    user_id?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: "commentDownVote_comment_id_fkey";
                        columns: ["comment_id"];
                        isOneToOne: false;
                        referencedRelation: "comments";
                        referencedColumns: ["id"];
                    },
                ];
            };
            comments: {
                Row: {
                    content: string | null;
                    created_at: string;
                    id: string;
                    post_id: string | null;
                    root_comment_id: string | null;
                    user_id: string | null;
                };
                Insert: {
                    content?: string | null;
                    created_at?: string;
                    id?: string;
                    post_id?: string | null;
                    root_comment_id?: string | null;
                    user_id?: string | null;
                };
                Update: {
                    content?: string | null;
                    created_at?: string;
                    id?: string;
                    post_id?: string | null;
                    root_comment_id?: string | null;
                    user_id?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: "comments_post_id_fkey";
                        columns: ["post_id"];
                        isOneToOne: false;
                        referencedRelation: "posts";
                        referencedColumns: ["id"];
                    },
                    {
                        foreignKeyName: "comments_root_comment_id_fkey";
                        columns: ["root_comment_id"];
                        isOneToOne: false;
                        referencedRelation: "comments";
                        referencedColumns: ["id"];
                    },
                ];
            };
            commentUpvote: {
                Row: {
                    comment_id: string | null;
                    created_at: string;
                    id: number;
                    user_id: string | null;
                };
                Insert: {
                    comment_id?: string | null;
                    created_at?: string;
                    id?: number;
                    user_id?: string | null;
                };
                Update: {
                    comment_id?: string | null;
                    created_at?: string;
                    id?: number;
                    user_id?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: "commentUpvote_comment_id_fkey";
                        columns: ["comment_id"];
                        isOneToOne: false;
                        referencedRelation: "comments";
                        referencedColumns: ["id"];
                    },
                ];
            };
            followers: {
                Row: {
                    created_at: string;
                    followee_id: string | null;
                    follower_id: string | null;
                    id: number;
                };
                Insert: {
                    created_at?: string;
                    followee_id?: string | null;
                    follower_id?: string | null;
                    id?: number;
                };
                Update: {
                    created_at?: string;
                    followee_id?: string | null;
                    follower_id?: string | null;
                    id?: number;
                };
                Relationships: [
                    {
                        foreignKeyName: "followers_followee_id_fkey";
                        columns: ["followee_id"];
                        isOneToOne: false;
                        referencedRelation: "profiles";
                        referencedColumns: ["id"];
                    },
                ];
            };
            messageChannels: {
                Row: {
                    created_at: string;
                    id: string;
                    name: string | null;
                };
                Insert: {
                    created_at?: string;
                    id?: string;
                    name?: string | null;
                };
                Update: {
                    created_at?: string;
                    id?: string;
                    name?: string | null;
                };
                Relationships: [];
            };
            messages: {
                Row: {
                    channel_id: string | null;
                    created_at: string;
                    data: Json | null;
                    id: string;
                    text_message: string | null;
                    title: string | null;
                    type: string | null;
                    user_id: string | null;
                };
                Insert: {
                    channel_id?: string | null;
                    created_at?: string;
                    data?: Json | null;
                    id?: string;
                    text_message?: string | null;
                    title?: string | null;
                    type?: string | null;
                    user_id?: string | null;
                };
                Update: {
                    channel_id?: string | null;
                    created_at?: string;
                    data?: Json | null;
                    id?: string;
                    text_message?: string | null;
                    title?: string | null;
                    type?: string | null;
                    user_id?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: "messages_channel_id_fkey";
                        columns: ["channel_id"];
                        isOneToOne: false;
                        referencedRelation: "messageChannels";
                        referencedColumns: ["id"];
                    },
                ];
            };
            postDownvotes: {
                Row: {
                    created_at: string;
                    id: number;
                    post_id: string | null;
                    user_id: string | null;
                };
                Insert: {
                    created_at?: string;
                    id?: number;
                    post_id?: string | null;
                    user_id?: string | null;
                };
                Update: {
                    created_at?: string;
                    id?: number;
                    post_id?: string | null;
                    user_id?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: "postDownvotes_post_id_fkey";
                        columns: ["post_id"];
                        isOneToOne: false;
                        referencedRelation: "posts";
                        referencedColumns: ["id"];
                    },
                ];
            };
            posts: {
                Row: {
                    content: string | null;
                    created_at: string;
                    id: string;
                    post_image: string | null;
                    title: string | null;
                    user_id: string | null;
                };
                Insert: {
                    content?: string | null;
                    created_at?: string;
                    id?: string;
                    post_image?: string | null;
                    title?: string | null;
                    user_id?: string | null;
                };
                Update: {
                    content?: string | null;
                    created_at?: string;
                    id?: string;
                    post_image?: string | null;
                    title?: string | null;
                    user_id?: string | null;
                };
                Relationships: [];
            };
            postUpvotes: {
                Row: {
                    created_at: string;
                    id: number;
                    post_id: string | null;
                    user_id: string | null;
                };
                Insert: {
                    created_at?: string;
                    id?: number;
                    post_id?: string | null;
                    user_id?: string | null;
                };
                Update: {
                    created_at?: string;
                    id?: number;
                    post_id?: string | null;
                    user_id?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: "postUpvotes_post_id_fkey";
                        columns: ["post_id"];
                        isOneToOne: false;
                        referencedRelation: "posts";
                        referencedColumns: ["id"];
                    },
                ];
            };
            profiles: {
                Row: {
                    about: string | null;
                    avatar_url: string | null;
                    created_at: string;
                    email: string;
                    first_name: string | null;
                    id: string;
                    last_name: string | null;
                    username: string;
                };
                Insert: {
                    about?: string | null;
                    avatar_url?: string | null;
                    created_at?: string;
                    email: string;
                    first_name?: string | null;
                    id?: string;
                    last_name?: string | null;
                    username: string;
                };
                Update: {
                    about?: string | null;
                    avatar_url?: string | null;
                    created_at?: string;
                    email?: string;
                    first_name?: string | null;
                    id?: string;
                    last_name?: string | null;
                    username?: string;
                };
                Relationships: [];
            };
            user_channels: {
                Row: {
                    channel_id: string;
                    created_at: string;
                    user_id: string;
                };
                Insert: {
                    channel_id: string;
                    created_at?: string;
                    user_id: string;
                };
                Update: {
                    channel_id?: string;
                    created_at?: string;
                    user_id?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: "user_channels_channel_id_fkey";
                        columns: ["channel_id"];
                        isOneToOne: false;
                        referencedRelation: "messageChannels";
                        referencedColumns: ["id"];
                    },
                ];
            };
            userReadMessages: {
                Row: {
                    channel_id: string | null;
                    created_at: string;
                    id: string;
                    message_id: string | null;
                    user_id: string | null;
                };
                Insert: {
                    channel_id?: string | null;
                    created_at?: string;
                    id?: string;
                    message_id?: string | null;
                    user_id?: string | null;
                };
                Update: {
                    channel_id?: string | null;
                    created_at?: string;
                    id?: string;
                    message_id?: string | null;
                    user_id?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: "userReadMessages_channel_id_fkey";
                        columns: ["channel_id"];
                        isOneToOne: false;
                        referencedRelation: "messageChannels";
                        referencedColumns: ["id"];
                    },
                    {
                        foreignKeyName: "userReadMessages_message_id_fkey";
                        columns: ["message_id"];
                        isOneToOne: false;
                        referencedRelation: "messages";
                        referencedColumns: ["id"];
                    },
                ];
            };
        };
        Views: {
            [_ in never]: never;
        };
        Functions: {
            [_ in never]: never;
        };
        Enums: {
            [_ in never]: never;
        };
        CompositeTypes: {
            [_ in never]: never;
        };
    };
};

type PublicSchema = Database[Extract<keyof Database, "public">];

export type Tables<
    PublicTableNameOrOptions extends
        | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
        | { schema: keyof Database },
    TableName extends PublicTableNameOrOptions extends {
        schema: keyof Database;
    }
        ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
              Database[PublicTableNameOrOptions["schema"]]["Views"])
        : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
    ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
          Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
          Row: infer R;
      }
        ? R
        : never
    : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
            PublicSchema["Views"])
      ? (PublicSchema["Tables"] &
            PublicSchema["Views"])[PublicTableNameOrOptions] extends {
            Row: infer R;
        }
          ? R
          : never
      : never;

export type TablesInsert<
    PublicTableNameOrOptions extends
        | keyof PublicSchema["Tables"]
        | { schema: keyof Database },
    TableName extends PublicTableNameOrOptions extends {
        schema: keyof Database;
    }
        ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
        : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
    ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
          Insert: infer I;
      }
        ? I
        : never
    : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
      ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
            Insert: infer I;
        }
          ? I
          : never
      : never;

export type TablesUpdate<
    PublicTableNameOrOptions extends
        | keyof PublicSchema["Tables"]
        | { schema: keyof Database },
    TableName extends PublicTableNameOrOptions extends {
        schema: keyof Database;
    }
        ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
        : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
    ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
          Update: infer U;
      }
        ? U
        : never
    : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
      ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
            Update: infer U;
        }
          ? U
          : never
      : never;

export type Enums<
    PublicEnumNameOrOptions extends
        | keyof PublicSchema["Enums"]
        | { schema: keyof Database },
    EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
        ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
        : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
    ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
    : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
      ? PublicSchema["Enums"][PublicEnumNameOrOptions]
      : never;

export type CompositeTypes<
    PublicCompositeTypeNameOrOptions extends
        | keyof PublicSchema["CompositeTypes"]
        | { schema: keyof Database },
    CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
        schema: keyof Database;
    }
        ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
        : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
    ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
    : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
      ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
      : never;
