import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://ynjzqkrnivxwtyzljwma.supabase.co"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inluanpxa3JuaXZ4d3R5emxqd21hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA2MDE5MzUsImV4cCI6MjA2NjE3NzkzNX0.gyQbjljqBwk1djlQL-B8pQe7yrDjkPTEMApKuKz4ReE"

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})