 let currentDashboardStatus = "Booked";

async function loadJobsDashboard() {
  const { data: jobs, error } = await window.fdimsSupabase
    .from("jobs")
    .select("id, job_number, status, contact_name, company_name, full_address, inspection_date, inspection_start")
    .eq("status", currentDashboardStatus)
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
<h2>Fire Door Jobs</h2>

<div style="display:flex; gap:8px; margin-bottom:12px; align-items:center;">
  <button class="btn btn-primary" onclick="showCreateJobForm()">
    + Create Job
  </button>
  <button class="btn btn-primary" onclick="showBookingInvitations()">
    📧 Send Booking Invitations
</button>

  <button onclick="setDashboardStatus('Booked')">Booked</button>
  <button onclick="setDashboardStatus('In Progress')">In Progress</button>
  <button onclick="setDashboardStatus('Inspected')">Inspected</button>
</div>
  <button onclick="setDashboardStatus('Booked')">Booked</button>
  <button onclick="setDashboardStatus('In Progress')">In Progress</button>
  <button onclick="setDashboardStatus('Inspected')">Inspected</button>
</div>      <div class="body">
        ${
          jobs.length
            ? jobs.map(job => `
              <div class="card" style="padding:14px;margin-top:12px">
                <strong>${job.job_number || "No job number"}</strong><br>
                ${job.contact_name || ""}<br>
                ${job.company_name || ""}<br>
                ${job.full_address || ""}<br>
                <small>${job.inspection_date || ""}</small><br><br>
                <button class="btn btn-primary"
        onclick="${job.status === 'Inspected'
          ? `openInspectionHistory('${job.id}')`
          : `startInspectionJob('${job.id}')`}">
  ${job.status === "Inspected" ? "Open Inspection" : "Start Inspection"}
</button>

${
  job.status === "In Progress"
    ? `<button class="btn btn-ghost" style="margin-top:8px" onclick="finishInspectionJob('${job.id}')">
        Finish Inspection
      </button>`
    : ""
}
${
  job.status === "Inspected"
    ? `
      <hr style="margin:12px 0">

      <strong>Documents</strong><br>

      <button class="btn btn-ghost"
              style="margin-top:8px"
              onclick="viewJobDocuments('${job.id}')">
              <div id="docs-${job.id}" style="margin-top:10px;"></div>
        📄 View Documents
      </button>
      <button
    class="btn btn-success"
    style="margin-top:8px"
    onclick="emailSurveyReport('${job.id}')">
    📧 Email Survey Report
</button>

<button
    class="btn btn-success"
    style="margin-top:8px"
    onclick="emailQuotation('${job.id}')">
    💷 Email Quotation
</button>
    `
    : ""
}
              </div>
            `).join("")
            : "<p>No booked jobs found.</p>"
        }
      </div>
    </div>
  `;

  const existingDashboard = document.getElementById("jobsDashboard");
if (existingDashboard) existingDashboard.remove();

document.body.prepend(dashboard);
document.querySelector(".topbar").style.display = "none";
document.querySelector(".intro").style.display = "none";
document.querySelector(".doors").style.display = "none";
document.querySelector(".util").style.display = "none";
document.querySelector(".lkstrip").style.display = "none";
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

  const { data: photos, error: photosError } = await window.fdimsSupabase
  .from("door_photos")
  .select("*")
  .eq("door_id", row.id);

console.log("Photos loaded for door:", row.id, photos);
console.log("Photo loading error:", photosError);

  const photoMap = {};

  if (photos) {
    for (const photo of photos) {

      const { data, error: signedUrlError } = await window.fdimsSupabase
  .storage
  .from("door-photos")
  .createSignedUrl(photo.storage_path, 60 * 60);

console.log("Photo row:", photo);
console.log("Signed URL result:", data);
console.log("Signed URL error:", signedUrlError);

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

  [".topbar", ".intro", ".doors", ".util", ".lkstrip"].forEach(selector => {
    const el = document.querySelector(selector);
    if (el) el.style.display = "";
});

const { data: job, error } = await window.fdimsSupabase
    .from("jobs")
    .select("*")
    .eq("id", jobId)

  if (error) {
    console.error("Failed to load selected job:", error);
    return;
  }
  console.log("Job status before starting:", job.status, job);
if (!job.status || job.status === "Booked") {  const { data, error } = await window.fdimsSupabase
    .from("jobs")
    .update({ status: "In Progress" })
    .eq("id", jobId)
    .select();

console.log("Start inspection update:", data);
console.log("Start inspection error:", error);
}
  window.currentJob = job;
  window.currentJobId = jobId;
sessionStorage.setItem("currentJobId", jobId);
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

  const savedJobId = sessionStorage.getItem("currentJobId");

if (savedJobId && typeof startInspectionJob === "function") {
  startInspectionJob(savedJobId);
} else {
  loadJobsDashboard();
}
});
async function finishInspectionJob(jobId) {

  if (!confirm("Mark this inspection as completed?")) return;

  const { error } = await window.fdimsSupabase
  .from("jobs")
  .update({
    status: "Inspected"
  })
  .eq("id", jobId);

  if (error) {
    console.error(error);
    alert(error.message);
    return;
  }

  alert("Inspection marked as completed.");

  loadJobsDashboard();
}
function setDashboardStatus(status) {
  currentDashboardStatus = status;

  const oldDashboard = document.getElementById("jobsDashboard");
  if (oldDashboard) oldDashboard.remove();

  loadJobsDashboard();
}
async function openInspectionHistory(jobId) {
  return startInspectionJob(jobId);
}
async function viewJobDocuments(jobId) {
  const { data, error } = await window.fdimsSupabase
    .from("job_documents")
    .select("*")
    .eq("job_id", jobId)
    .order("created_at", { ascending: false });

  if (error) {
    alert("Could not load documents.");
    console.error(error);
    return;

  }

  console.log("Job documents:", data);
  if (!data.length) {
  alert("No documents found for this job yet.");
  return;
}

const box = document.getElementById("docs-" + jobId);

if (!box) {
  alert("Document area not found.");
  return;
}

box.innerHTML = data.map(doc => `
  <div style="padding:8px; border:1px solid #ddd; border-radius:8px; margin-top:6px;">
    <strong>${doc.document_type}</strong><br>
    <small>${doc.file_name}</small><br>
    <button class="btn btn-ghost"
            style="margin-top:6px"
            onclick="openJobDocument('${doc.storage_path}')">
      Open
    </button>
  </div>
`).join("");
}
async function emailSurveyReport(jobId) {

    if (!confirm("Email the Survey Report to the resident?")) return;

    const { data, error } = await window.fdimsSupabase.functions.invoke(
        "email-job-document",
        {
            body: {
                jobId: jobId,
                documentType: "survey"
            }
        }
    );

    if (error) {
        alert("Email failed.");
        console.error(error);
        return;
    }

    if (!data.success) {
        alert("Email failed: " + (data.error || "Unknown error"));
        console.error(data);
        return;
    }

    alert(data.message);
}

async function emailQuotation(jobId) {

    if (!confirm("Email the Quotation to the resident?")) return;

    const { data, error } = await window.fdimsSupabase.functions.invoke(
        "email-job-document",
        {
            body: {
                jobId: jobId,
                documentType: "quotation"
            }
        }
    );

    if (error) {
        alert("Email failed.");
        console.error(error);
        return;
    }

    if (!data.success) {
        alert("Email failed: " + (data.error || "Unknown error"));
        console.error(data);
        return;
    }

    alert(data.message);
}
async function openJobDocument(storagePath) {
  const { data, error } = await window.fdimsSupabase.storage
    .from("job-documents")
    .createSignedUrl(storagePath, 60 * 10);

  if (error) {
    alert("Could not open document.");
    console.error(error);
    return;
  }

  window.open(data.signedUrl, "_blank");
}
function showCreateJobForm() {
    const existing = document.getElementById("createJobModal");
    if (existing) existing.remove();

    const modal = document.createElement("div");
    modal.id = "createJobModal";
    modal.innerHTML = `
        <div style="
            position:fixed;
            inset:0;
            background:rgba(0,0,0,0.45);
            z-index:9999;
            display:flex;
            align-items:center;
            justify-content:center;
        ">
            <div style="
                background:white;
                padding:24px;
                border-radius:12px;
                width:420px;
                box-shadow:0 10px 30px rgba(0,0,0,0.25);
            ">
                <h2 style="margin-top:0">Create Job</h2>

                <label>Resident Name</label>
                <input id="newJobName" style="width:100%; margin-bottom:10px">

                <label>Email</label>
                <input id="newJobEmail" style="width:100%; margin-bottom:10px">

                <label>Telephone</label>
                <input id="newJobTelephone" style="width:100%; margin-bottom:10px">

                <label>Full Address</label>
                <textarea id="newJobAddress" style="width:100%; margin-bottom:10px"></textarea>

                <label>Inspection Date</label>
                <input id="newJobDate" type="date" style="width:100%; margin-bottom:14px">

                <div style="display:flex; gap:8px; justify-content:flex-end">
                    <button onclick="document.getElementById('createJobModal').remove()">Cancel</button>
                    <button class="btn btn-primary" onclick="createManualJobAndStart()">
                        Create & Start Inspection
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}
    async function createManualJobAndStart() {
    const contact_name = document.getElementById("newJobName").value.trim();
    const email = document.getElementById("newJobEmail").value.trim();
    const telephone = document.getElementById("newJobTelephone").value.trim();
    const full_address = document.getElementById("newJobAddress").value.trim();
    const inspection_date = document.getElementById("newJobDate").value;

    if (!contact_name || !full_address) {
        alert("Resident name and address are required.");
        return;
    }

    const { data, error } = await window.fdimsSupabase.functions.invoke(
        "create-job",
        {
            body: {
                contact_name,
                email,
                telephone,
                full_address,
                inspection_date
            }
        }
    );
console.log("Create job result:", data, error);
    if (error || !data.success) {
        alert("Could not create job.");
        console.error(error || data);
        return;
    }

    document.getElementById("createJobModal").remove();

await startInspectionJob(data.job.id);
}
async function sendBookingInvitations() {
    const rawEmails = document.getElementById("bookingEmails").value.trim();

    if (!rawEmails) {
        alert("Please enter at least one email address.");
        return;
    }

    const emails = rawEmails
        .split(/[\n,;]+/)
        .map(email => email.trim())
        .filter(email => email.includes("@"));

    if (!emails.length) {
        alert("No valid email addresses found.");
        return;
    }

    const propertyName = document.getElementById("invitePropertyName").value.trim();
    const propertyAddress = document.getElementById("invitePropertyAddress").value.trim();
    const bookingLink = document.getElementById("inviteBookingLink").value.trim();

    const dates = Array.from(document.querySelectorAll(".inviteDate"))
        .map(input => input.value)
        .filter(Boolean);

    const formattedDates = dates.length
        ? dates.map(date => `• ${date}`).join("\n")
        : "• Dates to be confirmed";

    const subject = `${propertyName} - Fire Door Inspection Booking`;

    const message = `Dear Resident,

London & Kent Construction has been appointed to undertake the scheduled fire door inspections at:

${propertyName}

${propertyAddress}

Fire doors, including flat entrance doors, play an important role in preventing the spread of fire and smoke.

Access will be required to inspect your flat entrance door.

Scheduled inspection dates

${formattedDates}

Please use the booking link below to choose the most convenient appointment.

${bookingLink}

If none of the available appointments are suitable, please contact us.

Kind regards,

Daniel Todd
FDIS | NEBOSH NGC

London & Kent Construction
020 8850 7064`;

    console.log({ emails, subject, message });

    const { data, error } = await window.fdimsSupabase.functions.invoke(
        "send-booking-invitations",
        {
            body: {
                emails,
                subject,
                message
            }
        }
    );
console.log("Invitation response:", data);
console.log("Invitation error:", error);
    if (error || !data.success) {
        alert("Could not send invitations.");
        console.error(error || data);
        return;
    }

    alert(`Invitations sent: ${data.sent}\nFailed: ${data.failed}`);

    document.getElementById("bookingInviteModal").remove();
}
function showBookingInvitations() {
    const modal = document.createElement("div");

    modal.innerHTML = `
    <div id="bookingInviteModal" style="
        position:fixed;
        inset:0;
        background:rgba(0,0,0,.45);
        display:flex;
        align-items:center;
        justify-content:center;
        z-index:9999;
    ">
        <div style="
            background:#fff;
            width:760px;
            max-width:95%;
            padding:24px;
            border-radius:10px;
        ">
            <h2>📧 Send Booking Invitations</h2>

            <label>Property Name</label>
            <input id="invitePropertyName" style="width:100%; margin-bottom:10px;">

            <label>Property Address</label>
            <textarea id="invitePropertyAddress" style="width:100%; height:70px; margin-bottom:10px;"></textarea>

            <label>Inspection Dates</label>
            <div id="inviteDates">
                <input type="date" class="inviteDate" style="width:100%; margin-bottom:8px;">
            </div>

            <button class="btn" onclick="addInviteDate()">+ Add another date</button>

            <br><br>

            <label>Booking Link</label>
<input
    id="inviteBookingLink"
    style="width:100%"
    value="https://dantodd1998.github.io/firedoor-booking/"
    readonly
>

            <label>Email Addresses</label>
            <p>Paste one email per line:</p>
            <textarea id="bookingEmails" style="width:100%;height:150px;"></textarea>

            <br><br>

            <button class="btn btn-primary" onclick="sendBookingInvitations()">
                Send Invitations
            </button>

            <button class="btn" onclick="document.getElementById('bookingInviteModal').remove()">
                Cancel
            </button>
        </div>
    </div>
    `;

    document.body.appendChild(modal);
}

function addInviteDate() {
    const box = document.getElementById("inviteDates");
    const input = document.createElement("input");
    input.type = "date";
    input.className = "inviteDate";
    input.style = "width:100%; margin-bottom:8px;";
    box.appendChild(input);
}