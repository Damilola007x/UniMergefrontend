/**
 * UniMerge MAS - script.js 
 * Comprehensive Logic: Personalized Welcome, Course Validation, and Agent Negotiation
 */

// CHANGE THIS to your actual Render URL if it differs from the one below
const API_BASE_URL = "https://unimerge.onrender.com"; 

let currentUserName = "User";
let currentUserLoginId = ""; 

// 1. SYSTEM ENTRY (Handles Login and View Switching)
async function enterSystem() {
    const role = document.getElementById('userRole').value;
    const loginId = document.getElementById('loginId').value;
    const loginPass = document.getElementById('loginPass').value;

    if (!loginId || !loginPass) {
        alert("Please enter both ID and Password");
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/schedule/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ role: role, loginId: loginId })
        });

        if (!response.ok) throw new Error("Server communication error");

        const result = await response.text();

        if (result.startsWith("SUCCESS")) {
            currentUserName = result.split(":")[1];
            currentUserLoginId = loginId; // Store for the session

            document.getElementById('login-overlay').style.display = 'none';
            document.getElementById('dashboard').style.display = 'flex';

            if (role === 'lecturer') {
                document.getElementById('lecturer-view').style.display = 'block';
                document.getElementById('student-view').style.display = 'none';
                
                const lectHeader = document.querySelector('#lecturer-view h2');
                if (lectHeader) lectHeader.innerHTML = `Welcome, <span style="color:#f43f5e">${currentUserName}</span>`;
                
                addLog(`SYSTEM: Lecturer Agent active for ${currentUserName}`, "info");
            } else {
                document.getElementById('student-view').style.display = 'block';
                document.getElementById('lecturer-view').style.display = 'none';
                
                const studHeader = document.getElementById('welcome-msg');
                if (studHeader) studHeader.innerHTML = `Welcome, <span style="color:#38bdf8">${currentUserName}</span>`;
                
                updateStep(1);
                addLog(`SYSTEM: Student Agent active for ${currentUserName}`, "info");
            }
        } else {
            alert(result); 
        }
    } catch (e) {
        console.error(e);
        alert("CONNECTION ERROR: Ensure the Render service is fully 'Live' and not sleeping.");
    }
}

// 2. LECTURER LOGIC: BROADCAST RULES
async function saveGlobalConstraints() {
    const venue = document.getElementById('venueSelect').value;
    const checkboxes = document.querySelectorAll('input[name="blockedDay"]:checked');
    const days = Array.from(checkboxes).map(cb => cb.value).join(", ");

    addLog(`LECTURER: Broadcasting Venue: ${venue}`, "info");

    try {
        const response = await fetch(`${API_BASE_URL}/api/schedule/constraints`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                venueName: venue, 
                prohibitedDays: days || "None" 
            })
        });
        
        if (response.ok) {
            alert("Constraints Synchronized with VenueAgent!");
            addLog("MAS: Knowledge base updated.", "success");
        }
    } catch (e) {
        addLog("CONNECTION ERROR: Cloud backend unreachable.", "error");
    }
}

// 3. STUDENT LOGIC: NEGOTIATE
async function spawnAgent() {
    const course = document.getElementById('courseCode').value.trim();
    const venue = document.getElementById('preferredVenue').value;
    const day = document.getElementById('preferredDay').value;
    const matric = currentUserLoginId; // Use the verified ID from login

    if (!course) {
        alert("Please enter a course code (e.g., CSC301)");
        return;
    }

    const logBox = document.getElementById('agent-logs');
    if (logBox) logBox.innerHTML = ""; 
    updateStep(1);

    addLog(`INITIALIZING: StudentAgent for ${currentUserName}...`, "info");

    try {
        const response = await fetch(`${API_BASE_URL}/api/schedule/negotiate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                matricNumber: matric, 
                courseCode: course, 
                preferredVenue: venue, 
                preferredDay: day 
            })
        });

        const result = await response.text();

        if (result.startsWith("AGENT_SPAWNED")) {
            const parts = result.split(":");
            runCNP(parts[1], parts[3], parts[4]);
        } else {
            addLog(`VenueAgent: ACL_REFUSE`, "error");
            addLog(`REASON: ${result}`, "error");
            alert(result);
        }
    } catch (e) {
        addLog("CRITICAL ERROR: Connection to Render API failed.", "error");
    }
}

// 4. CNP ANIMATION (Agent Protocol Simulation)
function runCNP(course, day, venue) {
    setTimeout(() => { 
        addLog(`StudentAgent -> VenueAgent: ACL_CFP (Requesting ${course})`, "msg"); 
        updateStep(2); 
    }, 800);

    setTimeout(() => { 
        addLog(`VenueAgent -> StudentAgent: ACL_PROPOSE (Venue: ${venue} on ${day})`, "msg"); 
    }, 2200);

    setTimeout(() => { 
        addLog(`StudentAgent: ACL_ACCEPT_PROPOSAL`, "success"); 
        updateStep(3); 
    }, 3800);

    setTimeout(() => { 
        addLog(`VenueAgent: ACL_INFORM (Negotiation Finalized)`, "success"); 
        addLog(`FINAL: ${course} scheduled at ${venue} (${day})`, "info");
        updateStep(4);
        showDownloadButton(course, day, venue);
    }, 5500);
}

// 5. HELPERS
function addLog(msg, type) {
    const logBox = document.getElementById('agent-logs');
    if (logBox) {
        const p = document.createElement('p');
        p.className = `log-${type}`;
        p.innerHTML = `[${new Date().toLocaleTimeString()}] ${msg}`;
        logBox.appendChild(p);
        logBox.scrollTop = logBox.scrollHeight;
    }
}

function updateStep(n) {
    const listItems = document.querySelectorAll('#flow-list li');
    listItems.forEach(li => li.classList.remove('active'));
    const currentStep = document.getElementById(`step${n}`);
    if (currentStep) currentStep.classList.add('active');
}

function showDownloadButton(course, day, venue) {
    const oldBtn = document.getElementById('dl-btn');
    if (oldBtn) oldBtn.remove();

    const btn = document.createElement('button');
    btn.id = 'dl-btn';
    btn.className = 'spawn-btn';
    btn.style.marginTop = "20px";
    btn.style.background = "#10b981"; 
    btn.innerHTML = "📥 Download Exam Slip";
    btn.onclick = () => {
        const win = window.open('', '_blank');
        win.document.write(`
            <div style="border:5px solid #38bdf8; padding:20px; font-family:sans-serif; text-align:center;">
                <h1>UniMerge MAS: Exam Slip</h1>
                <hr>
                <p><strong>Student:</strong> ${currentUserName}</p>
                <p><strong>Course:</strong> ${course}</p>
                <p><strong>Venue:</strong> ${venue}</p>
                <p><strong>Day:</strong> ${day}</p>
                <h3 style="color:green;">VERIFIED BY AGENT NEGOTIATION</h3>
            </div>
        `);
        win.document.close();
        win.print();
    };
    document.getElementById('agent-logs').after(btn);
}