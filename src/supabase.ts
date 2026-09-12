import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://yxtlfwyvzwtszwhdboau.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4dGxmd3l2end0c3p3aGRib2F1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkyMDIwMDAsImV4cCI6MjEwNDc3ODAwMH0.hzZHypoCB5gRyH2xs-Z1_62JbFA7JfD3-nF1G1pGWXw'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
