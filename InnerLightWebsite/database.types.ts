export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      ai_interaction_history: {
        Row: {
          encrypted_ai_response: string
          encrypted_context: string | null
          encrypted_user_message: string
          id: string
          timestamp: string
          user_emotion: string
          user_feedback: string | null
          user_id: string
        }
        Insert: {
          encrypted_ai_response: string
          encrypted_context?: string | null
          encrypted_user_message: string
          id: string
          timestamp?: string
          user_emotion: string
          user_feedback?: string | null
          user_id: string
        }
        Update: {
          encrypted_ai_response?: string
          encrypted_context?: string | null
          encrypted_user_message?: string
          id?: string
          timestamp?: string
          user_emotion?: string
          user_feedback?: string | null
          user_id?: string
        }
        Relationships: []
      }
      auditLogs: {
        Row: {
          action_type: string | null
          add_info: Json | null
          created_at: string
          id: string
          user_id: string | null
        }
        Insert: {
          action_type?: string | null
          add_info?: Json | null
          created_at?: string
          id?: string
          user_id?: string | null
        }
        Update: {
          action_type?: string | null
          add_info?: Json | null
          created_at?: string
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      chat_feedback: {
        Row: {
          created_at: string
          helpful: boolean
          id: number
          message_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          helpful: boolean
          id?: number
          message_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          helpful?: boolean
          id?: number
          message_id?: string
          user_id?: string
        }
        Relationships: []
      }
      commentDownVotes: {
        Row: {
          comment_id: string | null
          created_at: string
          id: string
          user_id: string | null
        }
        Insert: {
          comment_id?: string | null
          created_at?: string
          id?: string
          user_id?: string | null
        }
        Update: {
          comment_id?: string | null
          created_at?: string
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "commentDownVotes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "new_commentDownVotes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          content: string
          created_at: string
          id: string
          post_id: string
          root_comment_id: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          post_id: string
          root_comment_id?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          post_id?: string
          root_comment_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_root_comment_id_fkey"
            columns: ["root_comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_user_id_fkey1"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      commentUpVotes: {
        Row: {
          comment_id: string | null
          created_at: string
          id: number
          user_id: string | null
        }
        Insert: {
          comment_id?: string | null
          created_at?: string
          id?: number
          user_id?: string | null
        }
        Update: {
          comment_id?: string | null
          created_at?: string
          id?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "new_commentUpVotes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "new_commentUpVotes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      data_access_logs: {
        Row: {
          action: string | null
          data_type: string | null
          id: string
          ip_address: string | null
          timestamp: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action?: string | null
          data_type?: string | null
          id?: string
          ip_address?: string | null
          timestamp?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string | null
          data_type?: string | null
          id?: string
          ip_address?: string | null
          timestamp?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "data_access_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      detected_topics: {
        Row: {
          created_at: string
          frequency: number
          id: number
          last_detected: string
          topic: string
          user_id: string
        }
        Insert: {
          created_at?: string
          frequency?: number
          id?: number
          last_detected?: string
          topic: string
          user_id: string
        }
        Update: {
          created_at?: string
          frequency?: number
          id?: number
          last_detected?: string
          topic?: string
          user_id?: string
        }
        Relationships: []
      }
      emotion_logs: {
        Row: {
          confidence: number
          created_at: string | null
          emotion: string
          id: string
          page_path: string | null
          session_id: string
          timestamp: string
          user_id: string
        }
        Insert: {
          confidence: number
          created_at?: string | null
          emotion: string
          id?: string
          page_path?: string | null
          session_id: string
          timestamp: string
          user_id: string
        }
        Update: {
          confidence?: number
          created_at?: string | null
          emotion?: string
          id?: string
          page_path?: string | null
          session_id?: string
          timestamp?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "emotion_logs_user_id_fkey1"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      encryption_audit_logs: {
        Row: {
          action_type: string
          id: string
          success: boolean
          timestamp: string
          user_id: string
        }
        Insert: {
          action_type: string
          id?: string
          success: boolean
          timestamp?: string
          user_id: string
        }
        Update: {
          action_type?: string
          id?: string
          success?: boolean
          timestamp?: string
          user_id?: string
        }
        Relationships: []
      }
      followers: {
        Row: {
          created_at: string
          followee_id: string | null
          follower_id: string | null
          id: number
        }
        Insert: {
          created_at?: string
          followee_id?: string | null
          follower_id?: string | null
          id?: number
        }
        Update: {
          created_at?: string
          followee_id?: string | null
          follower_id?: string | null
          id?: number
        }
        Relationships: [
          {
            foreignKeyName: "followers_followee_id_fkey"
            columns: ["followee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "followers_follower_id_fkey1"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      hpt_analysis_logs: {
        Row: {
          error_message: string | null
          id: string
          processing_time_ms: number | null
          request_timestamp: string
          response_status: string | null
          session_id: string
          user_id: string
        }
        Insert: {
          error_message?: string | null
          id?: string
          processing_time_ms?: number | null
          request_timestamp: string
          response_status?: string | null
          session_id: string
          user_id: string
        }
        Update: {
          error_message?: string | null
          id?: string
          processing_time_ms?: number | null
          request_timestamp?: string
          response_status?: string | null
          session_id?: string
          user_id?: string
        }
        Relationships: []
      }
      hpt_test_drawings: {
        Row: {
          created_at: string | null
          house_drawing_path: string | null
          id: string
          person_drawing_path: string | null
          session_id: string
          tree_drawing_path: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          house_drawing_path?: string | null
          id?: string
          person_drawing_path?: string | null
          session_id: string
          tree_drawing_path?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          house_drawing_path?: string | null
          id?: string
          person_drawing_path?: string | null
          session_id?: string
          tree_drawing_path?: string | null
          user_id?: string
        }
        Relationships: []
      }
      hpt_test_results: {
        Row: {
          created_at: string | null
          emotional_stability_score: number | null
          environmental_adaptation_score: number | null
          house_analysis: string | null
          id: string
          overall_analysis: string | null
          person_analysis: string | null
          self_perception_score: number | null
          session_id: string
          social_interaction_score: number | null
          tree_analysis: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          emotional_stability_score?: number | null
          environmental_adaptation_score?: number | null
          house_analysis?: string | null
          id?: string
          overall_analysis?: string | null
          person_analysis?: string | null
          self_perception_score?: number | null
          session_id: string
          social_interaction_score?: number | null
          tree_analysis?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          emotional_stability_score?: number | null
          environmental_adaptation_score?: number | null
          house_analysis?: string | null
          id?: string
          overall_analysis?: string | null
          person_analysis?: string | null
          self_perception_score?: number | null
          session_id?: string
          social_interaction_score?: number | null
          tree_analysis?: string | null
          user_id?: string
        }
        Relationships: []
      }
      messageChannels: {
        Row: {
          created_at: string
          id: string
          name: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          channel_id: string | null
          created_at: string
          data: Json | null
          encrypted_content: Json | null
          file_metadata: Json | null
          id: string
          text_message: string | null
          title: string | null
          type: string | null
          user_id: string | null
        }
        Insert: {
          channel_id?: string | null
          created_at?: string
          data?: Json | null
          encrypted_content?: Json | null
          file_metadata?: Json | null
          id?: string
          text_message?: string | null
          title?: string | null
          type?: string | null
          user_id?: string | null
        }
        Update: {
          channel_id?: string | null
          created_at?: string
          data?: Json | null
          encrypted_content?: Json | null
          file_metadata?: Json | null
          id?: string
          text_message?: string | null
          title?: string | null
          type?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "messageChannels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_user_id_fkey1"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      postDownVotes: {
        Row: {
          created_at: string
          id: string
          post_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          post_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "new_postDownVotes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "new_postDownVotes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          content: string | null
          created_at: string
          id: string
          post_image: string | null
          title: string | null
          user_id: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          post_image?: string | null
          title?: string | null
          user_id?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          post_image?: string | null
          title?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_user_id_fkey1"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      postUpVotes: {
        Row: {
          created_at: string
          id: string
          post_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          post_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "new_postUpvotes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "new_postUpvotes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          about: string | null
          avatar_url: string | null
          created_at: string
          email: string
          first_name: string | null
          id: string
          last_name: string | null
          username: string
        }
        Insert: {
          about?: string | null
          avatar_url?: string | null
          created_at?: string
          email: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          username: string
        }
        Update: {
          about?: string | null
          avatar_url?: string | null
          created_at?: string
          email?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          username?: string
        }
        Relationships: []
      }
      user_ai_contexts: {
        Row: {
          encrypted_context_data: string
          last_updated: string
          user_id: string
        }
        Insert: {
          encrypted_context_data: string
          last_updated?: string
          user_id: string
        }
        Update: {
          encrypted_context_data?: string
          last_updated?: string
          user_id?: string
        }
        Relationships: []
      }
      user_channels: {
        Row: {
          channel_id: string
          created_at: string
          user_id: string
        }
        Insert: {
          channel_id: string
          created_at?: string
          user_id: string
        }
        Update: {
          channel_id?: string
          created_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_channels_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "messageChannels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_channels_user_id_fkey1"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_context: {
        Row: {
          context: Json
          created_at: string
          id: number
          updated_at: string
          user_id: string
        }
        Insert: {
          context?: Json
          created_at?: string
          id?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          context?: Json
          created_at?: string
          id?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_emotion_patterns: {
        Row: {
          contexts: string[] | null
          emotion_sequence: string[]
          frequency: number
          id: string
          last_seen: string
          user_id: string
        }
        Insert: {
          contexts?: string[] | null
          emotion_sequence: string[]
          frequency?: number
          id?: string
          last_seen?: string
          user_id: string
        }
        Update: {
          contexts?: string[] | null
          emotion_sequence?: string[]
          frequency?: number
          id?: string
          last_seen?: string
          user_id?: string
        }
        Relationships: []
      }
      userReadMessages: {
        Row: {
          channel_id: string | null
          created_at: string
          id: string
          last_read_at: string
          message_id: string | null
          user_id: string | null
        }
        Insert: {
          channel_id?: string | null
          created_at?: string
          id?: string
          last_read_at?: string
          message_id?: string | null
          user_id?: string | null
        }
        Update: {
          channel_id?: string | null
          created_at?: string
          id?: string
          last_read_at?: string
          message_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "userReadMessages_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "messageChannels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "userReadMessages_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "userReadMessages_user_id_fkey1"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      user_preferences_view: {
        Row: {
          conversation_notes: string | null
          email: string | null
          last_updated: string | null
          preferences: string | null
          username: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

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
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
