-- =============================================
-- BUS NOTIFICATION SYSTEM DATABASE SCHEMA - FIXED VERSION
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (in correct order due to foreign keys)
DROP TABLE IF EXISTS notification_history CASCADE;
DROP TABLE IF EXISTS bus_notifications CASCADE;
DROP TABLE IF EXISTS user_notification_preferences CASCADE;
DROP TABLE IF EXISTS bus_schedules CASCADE;

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS get_pending_notifications() CASCADE;
DROP FUNCTION IF EXISTS can_add_notification(UUID) CASCADE;
DROP FUNCTION IF EXISTS get_user_notification_count(UUID) CASCADE;
DROP FUNCTION IF EXISTS set_notification_time() CASCADE;
DROP FUNCTION IF EXISTS calculate_notification_time(TIME) CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- =============================================
-- 1. BUS SCHEDULES TABLE
-- =============================================
CREATE TABLE bus_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    route_name VARCHAR(255) NOT NULL,
    origin VARCHAR(255) NOT NULL,
    destination VARCHAR(255) NOT NULL,
    departure_time TIME NOT NULL,
    arrival_time TIME NOT NULL,
    available_seats INTEGER DEFAULT 40,
    total_seats INTEGER DEFAULT 40,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'departed', 'cancelled')),
    schedule_type VARCHAR(20) DEFAULT 'weekday' CHECK (schedule_type IN ('weekday', 'weekend')),
    driver_notification TEXT,
    color VARCHAR(7) DEFAULT '#E3F2FD',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 2. BUS NOTIFICATIONS TABLE
-- =============================================
CREATE TABLE bus_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    bus_schedule_id UUID NOT NULL REFERENCES bus_schedules(id) ON DELETE CASCADE,
    route_name VARCHAR(255) NOT NULL,
    origin VARCHAR(255) NOT NULL,
    destination VARCHAR(255) NOT NULL,
    departure_time TIME NOT NULL,
    notification_time TIMESTAMPTZ, -- When to send the notification (30 mins before)
    is_sent BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure user can't have duplicate notifications for same bus
    UNIQUE(user_id, bus_schedule_id)
);

-- =============================================
-- 3. NOTIFICATION HISTORY TABLE
-- =============================================
CREATE TABLE notification_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    notification_id UUID NOT NULL REFERENCES bus_notifications(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    bus_schedule_id UUID NOT NULL,
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    notification_type VARCHAR(50) DEFAULT 'departure_reminder',
    message TEXT,
    delivery_status VARCHAR(50) DEFAULT 'sent' CHECK (delivery_status IN ('sent', 'failed', 'pending'))
);

-- =============================================
-- 4. USER PREFERENCES TABLE
-- =============================================
CREATE TABLE user_notification_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE,
    max_notifications INTEGER DEFAULT 3,
    reminder_minutes INTEGER DEFAULT 30, -- How many minutes before departure
    email_notifications BOOLEAN DEFAULT TRUE,
    push_notifications BOOLEAN DEFAULT TRUE,
    sms_notifications BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 5. INDEXES FOR PERFORMANCE
-- =============================================
CREATE INDEX idx_bus_notifications_user_id ON bus_notifications(user_id);
CREATE INDEX idx_bus_notifications_bus_schedule_id ON bus_notifications(bus_schedule_id);
CREATE INDEX idx_bus_notifications_active ON bus_notifications(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_bus_notifications_pending ON bus_notifications(notification_time) WHERE is_sent = FALSE AND is_active = TRUE;
CREATE INDEX idx_bus_schedules_status ON bus_schedules(status);
CREATE INDEX idx_bus_schedules_schedule_type ON bus_schedules(schedule_type);
CREATE INDEX idx_notification_history_user_id ON notification_history(user_id);

-- =============================================
-- 6. FUNCTIONS AND TRIGGERS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_bus_schedules_updated_at 
    BEFORE UPDATE ON bus_schedules 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bus_notifications_updated_at 
    BEFORE UPDATE ON bus_notifications 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_notification_preferences_updated_at 
    BEFORE UPDATE ON user_notification_preferences 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate notification time (30 minutes before departure)
CREATE OR REPLACE FUNCTION calculate_notification_time(departure_time TIME)
RETURNS TIMESTAMPTZ AS $$
DECLARE
    today_departure TIMESTAMPTZ;
    notification_time TIMESTAMPTZ;
BEGIN
    -- Combine today's date with departure time
    today_departure := (CURRENT_DATE + departure_time)::TIMESTAMPTZ;
    
    -- If the departure time has already passed today, use tomorrow
    IF today_departure <= NOW() THEN
        today_departure := (CURRENT_DATE + INTERVAL '1 day' + departure_time)::TIMESTAMPTZ;
    END IF;
    
    -- Calculate notification time (30 minutes before)
    notification_time := today_departure - INTERVAL '30 minutes';
    
    RETURN notification_time;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-set notification_time when creating notification
CREATE OR REPLACE FUNCTION set_notification_time()
RETURNS TRIGGER AS $$
BEGIN
    NEW.notification_time := calculate_notification_time(NEW.departure_time);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-set notification time
CREATE TRIGGER set_bus_notification_time 
    BEFORE INSERT ON bus_notifications 
    FOR EACH ROW 
    EXECUTE FUNCTION set_notification_time();

-- =============================================
-- 7. UTILITY FUNCTIONS
-- =============================================

-- Function to get user's active notifications count
CREATE OR REPLACE FUNCTION get_user_notification_count(p_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)
        FROM bus_notifications
        WHERE user_id = p_user_id AND is_active = TRUE
    );
END;
$$ LANGUAGE plpgsql;

-- Function to check if user can add more notifications
CREATE OR REPLACE FUNCTION can_add_notification(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    current_count INTEGER;
    max_allowed INTEGER;
BEGIN
    -- Get current count
    current_count := get_user_notification_count(p_user_id);
    
    -- Get max allowed (default 3)
    SELECT COALESCE(max_notifications, 3) INTO max_allowed
    FROM user_notification_preferences
    WHERE user_id = p_user_id;
    
    -- If no preferences set, use default
    IF max_allowed IS NULL THEN
        max_allowed := 3;
    END IF;
    
    RETURN current_count < max_allowed;
END;
$$ LANGUAGE plpgsql;

-- Function to get pending notifications (to be sent)
CREATE OR REPLACE FUNCTION get_pending_notifications()
RETURNS TABLE (
    notification_id UUID,
    user_id UUID,
    route_name VARCHAR,
    origin VARCHAR,
    destination VARCHAR,
    departure_time TIME,
    notification_time TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        bn.id,
        bn.user_id,
        bn.route_name,
        bn.origin,
        bn.destination,
        bn.departure_time,
        bn.notification_time
    FROM bus_notifications bn
    WHERE bn.is_active = TRUE 
      AND bn.is_sent = FALSE 
      AND bn.notification_time <= NOW()
    ORDER BY bn.notification_time ASC;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 8. SAMPLE BUS SCHEDULES DATA
-- =============================================

-- Morning Routes
INSERT INTO bus_schedules (route_name, origin, destination, departure_time, arrival_time, available_seats, total_seats, schedule_type, driver_notification, color) VALUES
('LNMIIT to Raja Park', 'LNMIIT Campus', 'Raja Park', '06:00:00', '06:40:00', 35, 40, 'weekday', 'Only 5 seats left!', '#E3F2FD'),
('LNMIIT to Ajmeri Gate', 'LNMIIT Campus', 'Ajmeri Gate', '06:00:00', '06:45:00', 30, 40, 'weekday', NULL, '#F3E5F5'),
('Raja Park to LNMIIT', 'Raja Park', 'LNMIIT Campus', '07:15:00', '07:55:00', 28, 40, 'weekday', NULL, '#E8F5E8'),
('Ajmeri Gate to LNMIIT', 'Ajmeri Gate', 'LNMIIT Campus', '07:15:00', '08:00:00', 25, 40, 'weekday', NULL, '#FFF3E0');

-- Mid-Morning Routes
INSERT INTO bus_schedules (route_name, origin, destination, departure_time, arrival_time, available_seats, total_seats, schedule_type, driver_notification, color) VALUES
('LNMIIT to Raja Park', 'LNMIIT Campus', 'Raja Park', '10:00:00', '10:40:00', 32, 40, 'weekday', NULL, '#E3F2FD'),
('LNMIIT to Ajmeri Gate', 'LNMIIT Campus', 'Ajmeri Gate', '10:00:00', '10:45:00', 38, 40, 'weekday', NULL, '#F3E5F5'),
('Raja Park to LNMIIT', 'Raja Park', 'LNMIIT Campus', '12:00:00', '12:40:00', 22, 40, 'weekday', NULL, '#E8F5E8'),
('Ajmeri Gate to LNMIIT', 'Ajmeri Gate', 'LNMIIT Campus', '12:00:00', '12:45:00', 20, 40, 'weekday', NULL, '#FFF3E0');

-- Afternoon Routes
INSERT INTO bus_schedules (route_name, origin, destination, departure_time, arrival_time, available_seats, total_seats, schedule_type, driver_notification, color) VALUES
('LNMIIT to Raja Park', 'LNMIIT Campus', 'Raja Park', '14:00:00', '14:40:00', 18, 40, 'weekday', 'High demand route!', '#E3F2FD'),
('LNMIIT to Ajmeri Gate', 'LNMIIT Campus', 'Ajmeri Gate', '14:00:00', '14:45:00', 15, 40, 'weekday', NULL, '#F3E5F5'),
('Raja Park to LNMIIT', 'Raja Park', 'LNMIIT Campus', '16:00:00', '16:40:00', 12, 40, 'weekday', NULL, '#E8F5E8'),
('Ajmeri Gate to LNMIIT', 'Ajmeri Gate', 'LNMIIT Campus', '16:00:00', '16:45:00', 10, 40, 'weekday', NULL, '#FFF3E0');

-- Evening Routes
INSERT INTO bus_schedules (route_name, origin, destination, departure_time, arrival_time, available_seats, total_seats, schedule_type, driver_notification, color) VALUES
('LNMIIT to Raja Park', 'LNMIIT Campus', 'Raja Park', '17:45:00', '18:25:00', 8, 40, 'weekday', 'Last bus of the day!', '#E3F2FD'),
('LNMIIT to Ajmeri Gate', 'LNMIIT Campus', 'Ajmeri Gate', '17:45:00', '18:30:00', 5, 40, 'weekday', 'Almost full!', '#F3E5F5'),
('Raja Park to LNMIIT', 'Raja Park', 'LNMIIT Campus', '19:15:00', '19:55:00', 15, 40, 'weekday', NULL, '#E8F5E8');

-- Weekend Routes (Limited)
INSERT INTO bus_schedules (route_name, origin, destination, departure_time, arrival_time, available_seats, total_seats, schedule_type, color) VALUES
('LNMIIT to Raja Park', 'LNMIIT Campus', 'Raja Park', '08:00:00', '08:40:00', 35, 40, 'weekend', '#E3F2FD'),
('Raja Park to LNMIIT', 'Raja Park', 'LNMIIT Campus', '18:00:00', '18:40:00', 30, 40, 'weekend', '#E8F5E8');

-- =============================================
-- SUCCESS MESSAGE
-- =============================================
DO $$
BEGIN
    RAISE NOTICE 'Bus notification system database schema created successfully!';
    RAISE NOTICE 'Tables created: bus_schedules, bus_notifications, notification_history, user_notification_preferences';
    RAISE NOTICE 'Sample data inserted: % bus schedules', (SELECT COUNT(*) FROM bus_schedules);
END $$; 