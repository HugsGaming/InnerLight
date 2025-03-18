import { createClient } from "../supabase/client";
import { v4 as uuidv4 } from "uuid";

export type Emotion = "angry" | "disgust" | "fear" | "happy" | "sad" | "surprise" | "neutral";

interface InteractionRecord {
    userId: string;
    timestamp: string;
    
}
