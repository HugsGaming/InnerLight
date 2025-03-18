import { createClient } from "../supabase/client";

export interface UserInteraction {
  message: string;
  emotion: string;
  timestamp: number;
  response: string;
  helpful: boolean | null; // User feedback
}

export interface UserContext {
  userId: string;
  sessionId: string;
  preferredTopics: string[];
  avoidedTopics: string[];
  emotionalPatterns: Record<string, number>;
  recentInteractions: UserInteraction[];
  responsiveness: Record<string, number>; // Track what types of responses work best
}

export class UserContextManager {
  private supabase = createClient();
  private userContext: UserContext | null = null;
  private maxInteractionsStored = 20;
  
  constructor() {}

  async initializeContext(userId: string): Promise<UserContext> {
    // Check if we have a stored context for this user
    const { data, error } = await this.supabase
      .from('user_context')
      .select('*')
      .eq('user_id', userId)
      .single();
      
    if (error || !data) {
      // Create new context if none exists
      const sessionId = crypto.randomUUID();
      this.userContext = {
        userId,
        sessionId,
        preferredTopics: [],
        avoidedTopics: [],
        emotionalPatterns: {},
        recentInteractions: [],
        responsiveness: {
          supportive: 0,
          informative: 0,
          directive: 0,
          reflective: 0,
          empathetic: 0
        }
      };
      
      // Store new context
      await this.supabase.from('user_context').insert({
        user_id: userId,
        context: this.userContext
      });
      
    } else {
      this.userContext = data.context as UserContext;
    }
    
    return this.userContext;
  }
  
  async updateContext(
    message: string,
    emotion: string,
    response: string,
    responseType: keyof UserContext['responsiveness']
  ): Promise<void> {
    if (!this.userContext) {
      throw new Error('User context not initialized');
    }
    
    // Update emotional patterns
    this.userContext.emotionalPatterns[emotion] = 
      (this.userContext.emotionalPatterns[emotion] || 0) + 1;
    
    // Update response type effectiveness
    this.userContext.responsiveness[responseType] += 1;
    
    // Add to recent interactions
    const newInteraction: UserInteraction = {
      message,
      emotion,
      timestamp: Date.now(),
      response,
      helpful: null // To be updated when user provides feedback
    };
    
    this.userContext.recentInteractions.unshift(newInteraction);
    
    // Keep only the most recent interactions
    if (this.userContext.recentInteractions.length > this.maxInteractionsStored) {
      this.userContext.recentInteractions = this.userContext.recentInteractions.slice(0, this.maxInteractionsStored);
    }
    
    // Save updated context
    await this.persistContext();
  }
  
  async addUserFeedback(messageId: string, helpful: boolean): Promise<void> {
    if (!this.userContext) {
      throw new Error('User context not initialized');
    }
    
    // Find the interaction and update it
    const interaction = this.userContext.recentInteractions.find(
      int => int.timestamp.toString() === messageId
    );
    
    if (interaction) {
      interaction.helpful = helpful;
      
      // Update our model of what works for this user
      if (helpful) {
        // We could enhance the weight of the response type that worked
      } else {
        // We could reduce the weight of the response type that didn't work
      }
      
      await this.persistContext();
    }
  }
  
  async updatePreferredTopics(topic: string, isPreferred: boolean): Promise<void> {
    if (!this.userContext) {
      throw new Error('User context not initialized');
    }
    
    if (isPreferred) {
      if (!this.userContext.preferredTopics.includes(topic)) {
        this.userContext.preferredTopics.push(topic);
      }
      // Remove from avoided if it was there
      this.userContext.avoidedTopics = this.userContext.avoidedTopics.filter(t => t !== topic);
    } else {
      if (!this.userContext.avoidedTopics.includes(topic)) {
        this.userContext.avoidedTopics.push(topic);
      }
      // Remove from preferred if it was there
      this.userContext.preferredTopics = this.userContext.preferredTopics.filter(t => t !== topic);
    }
    
    await this.persistContext();
  }
  
  getDominantEmotion(): string | null {
    if (!this.userContext) {
      return null;
    }
    
    const emotions = this.userContext.emotionalPatterns;
    if (Object.keys(emotions).length === 0) {
      return null;
    }
    
    return Object.entries(emotions)
      .sort((a, b) => b[1] - a[1])[0][0];
  }
  
  getMostEffectiveResponseType(): keyof UserContext['responsiveness'] | null {
    if (!this.userContext) {
      return null;
    }
    
    const responsiveness = this.userContext.responsiveness;
    if (Object.keys(responsiveness).length === 0) {
      return null;
    }
    
    return Object.entries(responsiveness)
      .sort((a, b) => b[1] - a[1])[0][0] as keyof UserContext['responsiveness'];
  }
  
  getContextEnhancedPrompt(basePrompt: string, currentEmotion: string): string {
    if (!this.userContext) {
      return basePrompt;
    }
    
    // Create a context-enhanced prompt
    const dominantEmotion = this.getDominantEmotion();
    const effectiveResponseType = this.getMostEffectiveResponseType();
    
    let contextInfo = '';
    
    if (this.userContext.preferredTopics.length > 0) {
      contextInfo += `\nUser frequently discusses: ${this.userContext.preferredTopics.join(', ')}.`;
    }
    
    if (this.userContext.avoidedTopics.length > 0) {
      contextInfo += `\nUser tends to avoid: ${this.userContext.avoidedTopics.join(', ')}.`;
    }
    
    if (dominantEmotion) {
      contextInfo += `\nUser's emotional pattern: Often ${dominantEmotion}, currently ${currentEmotion}.`;
    }
    
    if (effectiveResponseType) {
      contextInfo += `\nUser responds best to: ${effectiveResponseType} communication style.`;
    }
    
    // Add recent context (last 2-3 interactions)
    if (this.userContext.recentInteractions.length > 0) {
      contextInfo += '\nRecent conversation context:';
      const recentInteractions = this.userContext.recentInteractions.slice(0, 3);
      
      for (const interaction of recentInteractions) {
        contextInfo += `\n- User (${interaction.emotion}): "${interaction.message}"`;
        contextInfo += `\n- Assistant: "${interaction.response}"${interaction.helpful === true ? ' (user found helpful)' : interaction.helpful === false ? ' (user did not find helpful)' : ''}`;
      }
    }
    
    return basePrompt + contextInfo;
  }
  
  private async persistContext(): Promise<void> {
    if (!this.userContext) {
      return;
    }
    
    await this.supabase
      .from('user_context')
      .upsert({
        user_id: this.userContext.userId,
        context: this.userContext,
        updated_at: new Date().toISOString()
      });
  }
}