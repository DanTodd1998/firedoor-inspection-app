const FDIMS_SUPABASE_URL = "https://swbqgkqmjorilaptheyj.supabase.co";

const FDIMS_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3YnFna3Ftam9yaWxhcHRoZXlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4NDg1NTIsImV4cCI6MjA5ODQyNDU1Mn0.6Xywmya1dtJAoS9SIgSP6FgFcIJZFi0cKILGaNeMwSk";

window.fdimsSupabase = window.supabase.createClient(
  FDIMS_SUPABASE_URL,
  FDIMS_SUPABASE_ANON_KEY
);

console.log("FDIMS Supabase connected:", FDIMS_SUPABASE_URL);