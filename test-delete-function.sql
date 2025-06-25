-- Test script to verify if delete functions are updated
-- Run this in Supabase SQL Editor to check current function status

-- Check if the functions exist and their source code
SELECT 
    routine_name,
    routine_type,
    created,
    last_altered
FROM information_schema.routines 
WHERE routine_name IN ('delete_ride_with_cleanup', 'cancel_ride_soft_delete')
AND routine_schema = 'public';

-- Test the function with a dummy call (this will show if it's the old or new version)
-- If this returns an error about UUID/TEXT, the old function is still there
-- If this returns a proper "ride not found" error, the new function is active

-- You can test with a fake ride ID to see the error:
-- SELECT delete_ride_with_cleanup('test-123-fake-id');

-- Quick way to see the actual function definition:
SELECT pg_get_functiondef(oid) 
FROM pg_proc 
WHERE proname = 'delete_ride_with_cleanup'; 