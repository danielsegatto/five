window.FiveApp = window.FiveApp || {};

// ============================================================
// CONFIGURE ME — paste your Supabase values here
// ============================================================
const SUPABASE_URL = "https://jntnpavxsqfddtczvxkp.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpudG5wYXZ4c3FmZGR0Y3p2eGtwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5NDU0ODUsImV4cCI6MjA5MjUyMTQ4NX0.pTLV_jacLiwKdYjqYCr4dA358eS6dN7pZVRoSF1rjJo";
// ============================================================

const configured = SUPABASE_URL !== "YOUR_SUPABASE_URL" && SUPABASE_ANON !== "YOUR_SUPABASE_ANON";
const supa = configured ? supabase.createClient(SUPABASE_URL, SUPABASE_ANON) : null;

window.FiveApp.config = { SUPABASE_URL, SUPABASE_ANON, configured, supa };
