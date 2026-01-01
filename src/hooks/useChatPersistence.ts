import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { ChatMessage } from '@/types/chat';

interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export function useChatPersistence() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load all conversations for the user
  const loadConversations = useCallback(async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });
    
    if (error) {
      console.error('Error loading conversations:', error);
      return;
    }
    
    setConversations(data || []);
  }, [user]);

  // Load messages for a specific conversation
  const loadMessages = useCallback(async (conversationId: string) => {
    if (!user) return;
    
    setIsLoading(true);
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });
    
    setIsLoading(false);
    
    if (error) {
      console.error('Error loading messages:', error);
      return;
    }
    
    setMessages(data?.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })) || []);
    setActiveConversationId(conversationId);
  }, [user]);

  // Create a new conversation
  const createConversation = useCallback(async (title?: string) => {
    if (!user) return null;
    
    const { data, error } = await supabase
      .from('conversations')
      .insert({
        user_id: user.id,
        title: title || 'New conversation',
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating conversation:', error);
      return null;
    }
    
    setConversations(prev => [data, ...prev]);
    setActiveConversationId(data.id);
    setMessages([]);
    return data.id;
  }, [user]);

  // Save a message to the active conversation
  const saveMessage = useCallback(async (message: ChatMessage) => {
    if (!user || !activeConversationId) return;
    
    const { error } = await supabase
      .from('chat_messages')
      .insert({
        user_id: user.id,
        conversation_id: activeConversationId,
        role: message.role,
        content: message.content,
      });
    
    if (error) {
      console.error('Error saving message:', error);
    }
  }, [user, activeConversationId]);

  // Update conversation title based on first message
  const updateConversationTitle = useCallback(async (conversationId: string, title: string) => {
    if (!user) return;
    
    const truncatedTitle = title.slice(0, 50) + (title.length > 50 ? '...' : '');
    
    const { error } = await supabase
      .from('conversations')
      .update({ title: truncatedTitle })
      .eq('id', conversationId)
      .eq('user_id', user.id);
    
    if (error) {
      console.error('Error updating conversation title:', error);
      return;
    }
    
    setConversations(prev => 
      prev.map(c => c.id === conversationId ? { ...c, title: truncatedTitle } : c)
    );
  }, [user]);

  // Delete a conversation
  const deleteConversation = useCallback(async (conversationId: string) => {
    if (!user) return;
    
    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('id', conversationId)
      .eq('user_id', user.id);
    
    if (error) {
      console.error('Error deleting conversation:', error);
      return;
    }
    
    setConversations(prev => prev.filter(c => c.id !== conversationId));
    
    if (activeConversationId === conversationId) {
      setActiveConversationId(null);
      setMessages([]);
    }
  }, [user, activeConversationId]);

  // Start new chat
  const startNewChat = useCallback(() => {
    setActiveConversationId(null);
    setMessages([]);
  }, []);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  return {
    conversations,
    activeConversationId,
    messages,
    setMessages,
    isLoading,
    loadConversations,
    loadMessages,
    createConversation,
    saveMessage,
    updateConversationTitle,
    deleteConversation,
    startNewChat,
  };
}
