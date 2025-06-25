-- Chat Database Setup for LNMIIT Carpool App
-- Run this in your Supabase SQL Editor

-- 1. Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ride_id UUID NOT NULL,
  sender_id TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  sender_photo TEXT,
  message TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'system', 'image', 'location')),
  reply_to UUID REFERENCES chat_messages(id),
  is_edited BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create chat_participants table
CREATE TABLE IF NOT EXISTS chat_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ride_id UUID NOT NULL,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_photo TEXT,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE(ride_id, user_id)
);

-- 3. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_ride_id ON chat_messages(ride_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_id ON chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_participants_ride_id ON chat_participants(ride_id);
CREATE INDEX IF NOT EXISTS idx_chat_participants_user_id ON chat_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_participants_active ON chat_participants(is_active);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_participants ENABLE ROW LEVEL SECURITY;

-- 5. Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read chat messages from their rides" ON chat_messages;
DROP POLICY IF EXISTS "Users can send messages to their rides" ON chat_messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON chat_messages;

-- Create RLS policies for chat_messages
-- Users can read messages from rides they're participating in
CREATE POLICY "Users can read chat messages from their rides" ON chat_messages
  FOR SELECT USING (
    ride_id IN (
      SELECT ride_id FROM chat_participants 
      WHERE user_id = auth.uid()::TEXT AND is_active = TRUE
    )
    OR ride_id IN (
      SELECT id FROM carpool_rides 
      WHERE driver_id = auth.uid()
    )
  );

-- Users can insert messages to rides they're participating in
CREATE POLICY "Users can send messages to their rides" ON chat_messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid()::TEXT
    AND (
      ride_id IN (
        SELECT ride_id FROM chat_participants 
        WHERE user_id = auth.uid()::TEXT AND is_active = TRUE
      )
      OR ride_id IN (
        SELECT id FROM carpool_rides 
        WHERE driver_id = auth.uid()
      )
    )
  );

-- Users can update their own messages
CREATE POLICY "Users can update their own messages" ON chat_messages
  FOR UPDATE USING (sender_id = auth.uid()::TEXT);

-- Users can delete their own messages
CREATE POLICY "Users can delete their own messages" ON chat_messages
  FOR DELETE USING (sender_id = auth.uid()::TEXT);

-- 6. Drop existing policies for chat_participants if they exist
DROP POLICY IF EXISTS "Users can read chat participants from their rides" ON chat_participants;
DROP POLICY IF EXISTS "Users can join chat for accessible rides" ON chat_participants;
DROP POLICY IF EXISTS "Users can update their own participation" ON chat_participants;

-- Create RLS policies for chat_participants
-- Simplified policy to avoid infinite recursion
CREATE POLICY "Users can read chat participants from their rides" ON chat_participants
  FOR SELECT USING (
    user_id = auth.uid()::TEXT
    OR ride_id IN (
      SELECT id FROM carpool_rides 
      WHERE driver_id = auth.uid()
    )
  );

-- Users can join chats for rides they have access to
CREATE POLICY "Users can join chat for accessible rides" ON chat_participants
  FOR INSERT WITH CHECK (
    user_id = auth.uid()::TEXT
    AND (
      ride_id IN (
        SELECT id FROM carpool_rides 
        WHERE driver_id = auth.uid() OR status = 'active'
      )
    )
  );

-- Users can update their own participation status
CREATE POLICY "Users can update their own participation" ON chat_participants
  FOR UPDATE USING (user_id = auth.uid()::TEXT);

-- 7. Drop existing function if it exists and create new one
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 8. Drop existing trigger if it exists and create new one
DROP TRIGGER IF EXISTS update_chat_messages_updated_at ON chat_messages;
CREATE TRIGGER update_chat_messages_updated_at 
  BEFORE UPDATE ON chat_messages 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 9. Grant necessary permissions
GRANT ALL ON chat_messages TO authenticated;
GRANT ALL ON chat_participants TO authenticated;

-- 10. Enable real-time for chat tables (only if not already added)
DO $$
BEGIN
  -- Add chat_messages to realtime publication if not already added
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'chat_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
  END IF;
  
  -- Add chat_participants to realtime publication if not already added
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'chat_participants'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE chat_participants;
  END IF;
END $$;

-- 11. Create function to clean up expired ride chats
CREATE OR REPLACE FUNCTION cleanup_expired_ride_chats()
RETURNS void AS $$
BEGIN
  -- Delete messages from expired rides (older than 7 days after ride completion)
  DELETE FROM chat_messages 
  WHERE ride_id IN (
    SELECT id FROM carpool_rides 
    WHERE status IN ('completed', 'cancelled') 
    AND updated_at < NOW() - INTERVAL '7 days'
  );
  
  -- Deactivate participants from expired rides
  UPDATE chat_participants 
  SET is_active = FALSE 
  WHERE ride_id IN (
    SELECT id FROM carpool_rides 
    WHERE status IN ('completed', 'cancelled') 
    AND updated_at < NOW() - INTERVAL '7 days'
  );
END;
$$ LANGUAGE plpgsql;

-- 12. Create scheduled job for cleanup (optional - can be run manually)
-- This would typically be set up as a cron job or scheduled function
-- Example: SELECT cron.schedule('cleanup-expired-chats', '0 2 * * *', 'SELECT cleanup_expired_ride_chats();');

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Chat database setup completed successfully!';
  RAISE NOTICE '✅ Tables created: chat_messages, chat_participants';
  RAISE NOTICE '✅ RLS policies configured for security';
  RAISE NOTICE '✅ Real-time subscriptions enabled';
  RAISE NOTICE '✅ Indexes created for performance';
  RAISE NOTICE '✅ Chat persistence until ride expiry configured';
  RAISE NOTICE '🚀 Chat system is ready to use!';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Manual cleanup command (run weekly):';
  RAISE NOTICE '   SELECT cleanup_expired_ride_chats();';
END $$; 