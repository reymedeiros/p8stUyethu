import { useEffect, useState, useCallback, useRef } from 'react';
import { ProjectWebSocket, WebSocketMessage, WebSocketStatus } from '@/lib/websocket';
import { Message } from '@/components/project/MessageItem';

export function useProjectWebSocket(projectId: string, token: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [status, setStatus] = useState<WebSocketStatus>('disconnected');
  const [agentStatus, setAgentStatus] = useState<'idle' | 'running' | 'waiting'>('idle');
  const wsRef = useRef<ProjectWebSocket | null>(null);
  const messageIdCounter = useRef(1);

  const connect = useCallback(() => {
    if (!projectId || !token) return;

    // Clean up existing connection
    if (wsRef.current) {
      wsRef.current.disconnect();
    }

    // Create new connection
    const ws = new ProjectWebSocket(projectId, token);
    wsRef.current = ws;

    // Handle status changes
    const unsubscribeStatus = ws.onStatus((newStatus) => {
      setStatus(newStatus);
      
      if (newStatus === 'connected') {
        setAgentStatus('running');
      } else if (newStatus === 'disconnected' || newStatus === 'error') {
        setAgentStatus('idle');
      }
    });

    // Handle incoming messages
    const unsubscribeMessages = ws.onMessage((wsMessage) => {
      handleWebSocketMessage(wsMessage);
    });

    // Connect
    ws.connect();

    // Cleanup function
    return () => {
      unsubscribeStatus();
      unsubscribeMessages();
      ws.disconnect();
    };
  }, [projectId, token]);

  const handleWebSocketMessage = useCallback((wsMessage: WebSocketMessage) => {
    const messageId = `msg-${messageIdCounter.current++}`;
    const timestamp = new Date();

    switch (wsMessage.type) {
      case 'status':
        // Status update from pipeline
        if (wsMessage.message) {
          setMessages((prev) => [
            ...prev,
            {
              id: messageId,
              role: 'agent' as const,
              content: wsMessage.message || '',
              timestamp,
              type: 'text' as const,
            },
          ]);
        }
        setAgentStatus('running');
        break;

      case 'progress':
        // Progress update from pipeline
        if (wsMessage.message) {
          // Check if this is a step message (contains emoji indicators)
          const isStep = /^(🎯|⚡|💾|✅|❌)/.test(wsMessage.message);
          
          if (isStep) {
            const status = wsMessage.message.includes('✅') ? 'completed' as const : 'pending' as const;
            setMessages((prev) => [
              ...prev,
              {
                id: messageId,
                role: 'agent' as const,
                content: wsMessage.message || '',
                timestamp,
                type: 'step' as const,
                status: status,
                fileName: (wsMessage.message || '').replace(/^[🎯⚡💾✅❌]\s*/, ''),
              },
            ]);
          } else {
            setMessages((prev) => [
              ...prev,
              {
                id: messageId,
                role: 'agent' as const,
                content: wsMessage.message || '',
                timestamp,
                type: 'text' as const,
              },
            ]);
          }
        }
        setAgentStatus('running');
        break;

      case 'complete':
        // Build completed
        setMessages((prev) => [
          ...prev,
          {
            id: messageId,
            role: 'agent' as const,
            content: '✅ Build completed successfully!',
            timestamp,
            type: 'text' as const,
          },
        ]);
        setAgentStatus('idle');
        break;

      case 'error':
        // Error occurred
        setMessages((prev) => [
          ...prev,
          {
            id: messageId,
            role: 'agent' as const,
            content: `❌ Error: ${wsMessage.message || 'Unknown error'}`,
            timestamp,
            type: 'text' as const,
          },
        ]);
        setAgentStatus('idle');
        break;

      case 'step':
        // Specific step message
        setMessages((prev) => [
          ...prev,
          {
            id: messageId,
            role: 'agent' as const,
            content: wsMessage.content || wsMessage.message || '',
            timestamp,
            type: 'step' as const,
            status: (wsMessage.status === 'running' ? 'pending' : wsMessage.status) as 'pending' | 'completed' | 'error' | undefined,
            fileName: wsMessage.fileName,
          },
        ]);
        break;

      default:
        console.warn('[useProjectWebSocket] Unknown message type:', wsMessage.type);
    }
  }, []);

  const sendMessage = useCallback((content: string) => {
    if (!wsRef.current) return;

    // Add user message to UI
    const messageId = `msg-${messageIdCounter.current++}`;
    setMessages((prev) => [
      ...prev,
      {
        id: messageId,
        role: 'human',
        content,
        timestamp: new Date(),
        type: 'text',
      },
    ]);

    // Send to backend (for future user input handling)
    wsRef.current.send({
      type: 'user_message',
      content,
    });

    setAgentStatus('running');
  }, []);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.disconnect();
      wsRef.current = null;
    }
  }, []);

  // Connect on mount
  useEffect(() => {
    const cleanup = connect();
    return cleanup;
  }, [connect]);

  return {
    messages,
    status,
    agentStatus,
    sendMessage,
    connect,
    disconnect,
  };
}
