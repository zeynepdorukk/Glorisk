import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jxugvxaqbbaosvqhoxrk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4dWd2eGFxYmJhb3N2cWhveHJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5OTIwMTcsImV4cCI6MjA3OTU2ODAxN30.QOn_kmt_SJIfzoOaT6rAdhO34L8OigdoDJ8dBaM1nPc';

export const supabase = createClient(supabaseUrl, supabaseKey);
