async function loadJobsDashboard() {
  const { data: jobs, error } = await window.fdimsSupabase
    .from("jobs")
    .select("id, job_number, status, contact_name, company_name, full_address, inspection_date, inspection_start")
    .eq("status", "Booked")
    .order("inspection_start", { ascending: true });

  if (error) {
    console.error("Dashboard failed to load jobs:", error);
    return;
  }

  const dashboard = document.createElement("div");
  dashboard.id = "jobsDashboard";
  dashboard.className = "wrap";

  dashboard.innerHTML = `
    <div class="card">
      <h2>Booked Fire Door Jobs</h2>
      <div class="body">
        ${
          jobs.length
            ? jobs.map(job => `
              <div class="card" style="padding:14px;margin-top:12px">
                <strong>${job.job_number || "No job number"}</strong><br>
                ${job.contact_name || ""}<br>
                ${job.company_name || ""}<br>
                ${job.full_address || ""}<br>
                <small>${job.inspection_date || ""}</small><br><br>
                <button class="btn btn-primary" onclick="startInspectionJob('${job.id}')">
                  Start Inspection
                </button>
              </div>
            `).join("")
            : "<p>No booked jobs found.</p>"
        }
      </div>
    </div>
  `;

  document.body.prepend(dashboard);
}

async function loadSavedDoorsForJob(jobId) {
  const { data: savedDoors, error } = await window.fdimsSupabase
    .from("doors")
    .select("*")
    .eq("job_id", jobId)
    .order("door_index", { ascending: true });

  if (error) {
    console.error("Failed to load saved doors:", error);
    doors = [blankDoor()];
    cur = 0;
    return;
  }

  if (savedDoors && savedDoors.length) {
  doors = [];

for (const row of savedDoors) {

  const { data: photos } = await window.fdimsSupabase
    .from("door_photos")
    .select("*")
    .eq("door_id", row.id);

  const photoMap = {};

  if (photos) {
    for (const photo of photos) {

      const { data } = await window.fdimsSupabase
  .storage
  .from("door-photos")
  .createSignedUrl(photo.storage_path, 60 * 60);

      if (!photoMap[photo.section_key]) {
  photoMap[photo.section_key] = [];
}

console.log(data.signedUrl);
photoMap[photo.section_key].push(data.signedUrl);
    }
  }

  doors.push({
    fields: row.fields || {},
    photos: photoMap
  });

}
    cur = 0;
    console.log("Loaded saved doors:", savedDoors);
  } else {
    doors = [blankDoor()];
    cur = 0;
    console.log("No saved doors yet. Starting blank inspection.");
  }
}

async function startInspectionJob(jobId) {
  const { data: job, error } = await window.fdimsSupabase
    .from("jobs")
    .select("*")
    .eq("id", jobId)
    .single();

  if (error) {
    console.error("Failed to load selected job:", error);
    return;
  }

  window.currentJob = job;
  window.currentJobId = jobId;

  const dashboard = document.getElementById("jobsDashboard");
  if (dashboard) dashboard.style.display = "none";

  const surveyView = document.getElementById("surveyView");
  if (surveyView) surveyView.style.display = "";

  const doorsBar = document.querySelector(".doors");
  if (doorsBar) doorsBar.style.display = "";

  const actionsBar = document.querySelector(".actions");
  if (actionsBar) actionsBar.style.display = "";

  await loadSavedDoorsForJob(jobId);

  buildForm();
  loadDoor();
window.scrollTo(0,0);
  if (surveyView) {
    surveyView.addEventListener("input", function () {
      saveForm();

      if (typeof syncCurrentDoor === "function") {
        syncCurrentDoor();
      }
    });
  }

  setTimeout(function () {
    const job = window.currentJob;
    if (!job) return;

    const setVal = (id, value) => {
      const el = document.getElementById(id);
      if (el && !el.value) el.value = value || "";
    };

    setVal("propName", job.building_name || "");
    setVal("propRef", "");
    setVal("propAddr", "");
    setVal("producedFor", "");
    setVal("assessDate", job.inspection_date);
    setVal("assessor", "D. Todd");
    setVal("strategy", "");

    if (typeof saveForm === "function") {
      saveForm();
    }
  }, 100);

  console.log("Loaded job:", job);
}

window.addEventListener("DOMContentLoaded", function () {
  const surveyView = document.getElementById("surveyView");
  if (surveyView) surveyView.style.display = "none";

  const doorsBar = document.querySelector(".doors");
  if (doorsBar) doorsBar.style.display = "none";

  const actionsBar = document.querySelector(".actions");
  if (actionsBar) actionsBar.style.display = "none";

  loadJobsDashboard();
});