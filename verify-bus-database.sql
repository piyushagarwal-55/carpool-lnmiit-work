-- =============================================
-- BUS NOTIFICATION SYSTEM VERIFICATION SCRIPT
-- =============================================

-- Check if all tables exist
SELECT 
    'Tables Check' as test_type,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bus_schedules') 
             AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bus_notifications')
             AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notification_history')
             AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_notification_preferences')
        THEN '✅ All tables exist'
        ELSE '❌ Some tables missing'
    END as result;

-- Check if sample data was inserted
SELECT 
    'Sample Data Check' as test_type,
    CASE 
        WHEN (SELECT COUNT(*) FROM bus_schedules) > 0
        THEN CONCAT('✅ ', (SELECT COUNT(*) FROM bus_schedules), ' bus schedules inserted')
        ELSE '❌ No sample data found'
    END as result;

-- Check if functions were created
SELECT 
    'Functions Check' as test_type,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'get_user_notification_count')
             AND EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'can_add_notification')
             AND EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'get_pending_notifications')
        THEN '✅ All functions created'
        ELSE '❌ Some functions missing'
    END as result;

-- Test weekday/weekend bus schedules
SELECT 
    'Schedule Types' as test_type,
    CONCAT(
        'Weekday: ', (SELECT COUNT(*) FROM bus_schedules WHERE schedule_type = 'weekday'),
        ', Weekend: ', (SELECT COUNT(*) FROM bus_schedules WHERE schedule_type = 'weekend')
    ) as result;

-- Test function with dummy UUID
SELECT 
    'Function Test' as test_type,
    CASE 
        WHEN get_user_notification_count('00000000-0000-0000-0000-000000000000') = 0
        THEN '✅ get_user_notification_count() works'
        ELSE '❌ Function error'
    END as result;

-- Show all bus schedules by type
SELECT 
    '📋 WEEKDAY SCHEDULES' as info,
    route_name,
    origin,
    destination,
    departure_time,
    CONCAT(available_seats, '/', total_seats) as seats,
    COALESCE(driver_notification, 'No alerts') as alerts
FROM bus_schedules 
WHERE schedule_type = 'weekday'
ORDER BY departure_time;

SELECT 
    '📋 WEEKEND SCHEDULES' as info,
    route_name,
    origin,
    destination,
    departure_time,
    CONCAT(available_seats, '/', total_seats) as seats,
    COALESCE(driver_notification, 'No alerts') as alerts
FROM bus_schedules 
WHERE schedule_type = 'weekend'
ORDER BY departure_time; 