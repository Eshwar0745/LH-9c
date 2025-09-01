'use client';

import { useState } from 'react';
import { collection, addDoc, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function FirestoreTest() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const addMessage = async () => {
    if (!message.trim()) return;
    
    setLoading(true);
    try {
      await addDoc(collection(db, 'test-messages'), {
        text: message,
        timestamp: new Date(),
        createdAt: new Date().toISOString()
      });
      setMessage('');
      await fetchMessages();
    } catch (error) {
      console.error('Error adding message:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'test-messages'), 
        orderBy('timestamp', 'desc'), 
        limit(5)
      );
      const querySnapshot = await getDocs(q);
      const fetchedMessages = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMessages(fetchedMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto mt-6">
      <CardHeader>
        <CardTitle>Firestore Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter a test message"
            onKeyPress={(e) => e.key === 'Enter' && addMessage()}
          />
          <Button onClick={addMessage} disabled={loading}>
            Add
          </Button>
        </div>
        
        <Button onClick={fetchMessages} variant="outline" className="w-full">
          Fetch Messages
        </Button>

        {messages.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium">Recent Messages:</h4>
            {messages.map((msg) => (
              <div key={msg.id} className="p-2 bg-gray-50 rounded text-sm">
                <p>{msg.text}</p>
                <p className="text-xs text-gray-500">
                  {new Date(msg.createdAt).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}