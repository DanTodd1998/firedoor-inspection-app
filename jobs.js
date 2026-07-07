async function testLoadBookedJobs() {
  const { data, error } = await fdimsSupabase
    .from("jobs")
    .select("id, job_number, status, contact_name, full_address, inspection_date, inspection_start")
    .eq("status", "Booked")
    .order("inspection_start", { ascending: true });

  if (error) {
    console.error("Failed to load booked jobs:", error);
    return;
  }

  console.log("Booked jobs loaded:", data);
}

testLoadBookedJobs();