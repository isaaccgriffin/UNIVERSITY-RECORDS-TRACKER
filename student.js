import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";

// Initialize Firebase (using the config from your HTML)
const firebaseConfig = {
    apiKey: "AIzaSyBr2sHC1c_Ll0v0y4boSVNhFz8kjQ9fgOY",
    authDomain: "university-tracker00.firebaseapp.com",
    projectId: "university-tracker00",
    storageBucket: "university-tracker00.firebasestorage.app",
    messagingSenderId: "130275131839",
    appId: "1:130275131839:web:707cce82f1d0ddecbf610a"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// 🔐 Check auth state and redirect accordingly
onAuthStateChanged(auth, async (user) => {
  const currentPage = window.location.pathname;

  if (!user) {
    if (!currentPage.includes('student-login.html') && !currentPage.includes('student-register.html')) {
      window.location.href = 'student-login.html';
    }
    return;
  }

  try {
    // Fetch complete student data from your server
    const response = await fetch(`http://localhost:5500/api/students?email=${user.email}`);
    if (!response.ok) throw new Error('Failed to fetch student data');
    
    const studentData = await response.json();
    const currentStudent = studentData.find(s => s.email === user.email);
    
    if (currentStudent) {
      localStorage.setItem('currentUser', JSON.stringify({
        ...user,
        studentId: currentStudent.studentId,
        fullName: currentStudent.name,
        course: currentStudent.course
      }));
    }

    if (currentPage.includes('student-login.html') || currentPage.includes('student-register.html')) {
      window.location.href = 'student-dashboard.html';
    }
  } catch (error) {
    console.error('Error fetching student data:', error);
    if (!currentPage.includes('student-login.html')) {
      window.location.href = 'student-login.html';
    }
  }
});

// DOM Elements
const newRequestBtn = document.getElementById('newRequestBtn');
const viewRequestsBtn = document.getElementById('viewRequestsBtn');
const viewComplaintsBtn = document.getElementById('viewComplaintsBtn');
const logoutBtn = document.getElementById('logoutBtn');
const requestForm = document.getElementById('requestForm');
const complaintForm = document.getElementById('complaintForm');
const requestsList = document.getElementById('requestsList');
const complaintsList = document.getElementById('complaintsList');

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    showSection('newRequestForm');
});

function setupEventListeners() {
    newRequestBtn.addEventListener('click', () => showSection('newRequestForm'));
    viewRequestsBtn.addEventListener('click', () => {
        showSection('viewRequests');
        loadRequests();
    });
    viewComplaintsBtn.addEventListener('click', () => {
        showSection('viewComplaints');
        loadComplaints();
    });
    
    requestForm.addEventListener('submit', handleRequestSubmission);
    complaintForm.addEventListener('submit', handleComplaintSubmission);
}

// Show/Hide Sections
function showSection(sectionId) {
    const sections = ['newRequestForm', 'viewRequests', 'viewComplaints'];
    sections.forEach(id => {
        const section = document.getElementById(id);
        if (section) {
            section.style.display = id === sectionId ? 'block' : 'none';
        }
    });
}

// Add convertFileToBase64 and downloadFile functions
function convertFileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

window.downloadFile = function(base64Data, fileName) {
    const link = document.createElement('a');
    link.href = base64Data;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

// Handle Request Submission
async function handleRequestSubmission(e) {
    e.preventDefault();

    // Get currentUser from localStorage
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');

    // Validate currentUser and fullName
    if (!currentUser || !currentUser.fullName) {
        alert('Missing student name. Please register again.');
        return;
    }

    const studentName = currentUser.fullName; // Use fullName directly

    const files = document.getElementById('supportingDocs').files;

    // Convert files to base64
    const filesList = await Promise.all(Array.from(files).map(async file => ({
        name: file.name,
        size: file.size,
        type: file.type,
        data: await convertFileToBase64(file)
    })));

    const requestData = {
        id: Date.now().toString(),
        studentId: currentUser.studentId,
        studentName: studentName,
        requestType: document.getElementById('requestType').value,
        academicYear: document.getElementById('academicYear').value,
        semester: document.getElementById('semester').value,
        comments: document.getElementById('comments').value,
        status: 'pending',
        createdAt: new Date().toISOString(),
        timeline: [{
            status: 'pending',
            date: new Date().toISOString(),
            message: 'Request submitted'
        }],
        files: filesList
    };

    try {
        const response = await fetch('http://localhost:5500/api/requests', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestData)
        });

        if (!response.ok) {
            throw new Error('Failed to submit the request');
        }

        // Fetch updated requests
        const updatedRequests = await fetch(`http://localhost:5500/api/requests/${studentName}`);
        const requests = await updatedRequests.json();
        console.log('📬 Updated requests:', requests);

        alert('Request submitted successfully!');
        document.getElementById('requestForm').reset();

        // Show the requests section and load requests
        showSection('viewRequests');
        loadRequests();
    } catch (error) {
        alert('Error submitting request: ' + error.message);
    }
}

// Handle Complaint Submission
async function handleComplaintSubmission(e) {
    e.preventDefault();
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) return;

    const complaintData = {
        studentId: currentUser.studentId,
        studentName: currentUser.fullName,
        complaintType: document.getElementById('complaintType').value,
        details: document.getElementById('complaintDetails').value,
        status: 'pending',
        createdAt: new Date().toISOString()
    };

    try {
        await fetch('http://localhost:5500/api/complaints', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(complaintData)
        });

        // Fetch updated complaints
        const studentName = currentUser.fullName; // Replace with the actual variable holding the student's name
        const res = await fetch(`http://localhost:5500/api/complaints/${studentName}`);
        const complaints = await res.json();
        console.log('🗣️ Updated complaints:', complaints);

        // Optionally, update the UI with the new complaints
    } catch (error) {
        alert('Error submitting complaint: ' + error.message);
    }
}

// Load Requests
async function loadRequests() {
    try {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (!currentUser) return;

        // First try to fetch by student ID
        let response = await fetch(`http://localhost:5500/api/requests/by-id/${currentUser.studentId}`);
        
        // If not found, fall back to student name
        if (!response.ok) {
            response = await fetch(`http://localhost:5500/api/requests/${encodeURIComponent(currentUser.fullName)}`);
        }

        if (!response.ok) {
            throw new Error(`Failed to fetch requests: ${response.status}`);
        }

        const userRequests = await response.json();
        const requestsList = document.getElementById('requestsList');
        requestsList.innerHTML = '';

        if (userRequests.length === 0) {
            requestsList.innerHTML = '<p>No requests found.</p>';
            return;
        }

        requestsList.innerHTML = userRequests.map(request => `
            <div class="request-card">
                <div class="request-header">
                    <h3>${request.requestType}</h3>
                    <span class="status-badge status-${request.status}">${request.status}</span>
                </div>
                
                <div class="request-details">
                    <p><strong>Academic Year:</strong> ${request.academicYear}</p>
                    <p><strong>Semester:</strong> ${request.semester}</p>
                    <p><strong>Submitted:</strong> ${new Date(request.createdAt).toLocaleDateString()}</p>
                    <p><strong>Status:</strong> ${request.status}</p>
                    ${request.comments ? `<p><strong>Your Comments:</strong> ${request.comments}</p>` : ''}
                </div>

                <!-- Student's uploaded files -->
                <div class="files-section">
                    <h4>Your Uploaded Documents</h4>
                    <div class="files-list">
                        ${request.files ? request.files.map(file => `
                            <div class="file-item">
                                <span class="file-name">${file.name}</span>
                                <a href="${file.data}" class="download-btn" download>
                                    <i class="fas fa-download"></i> Download
                                </a>
                            </div>
                        `).join('') : '<p>No files uploaded</p>'}
                    </div>
                </div>

                <!-- Admin Response Section -->
                ${request.status === 'approved' ? `
                    <div class="admin-response-section">
                        <h4>Admin Response</h4>
                        ${request.responseMessage ? `
                            <div class="response-message">
                                <p>${request.responseMessage}</p>
                            </div>
                        ` : ''}
                        
                        ${request.responseFiles && request.responseFiles.length > 0 ? `
                            <div class="files-section admin-files">
                                <h4>Documents from Admin</h4>
                                <div class="files-list">
                                    ${request.responseFiles.map(file => `
                                        <div class="file-item">
                                            <span class="file-name">${file.name}</span>
                                            <a href="${file.url}" class="download-btn" download>
                                                <i class="fas fa-download"></i> Download
                                            </a>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}
                    </div>
                ` : ''}

                <!-- Request Timeline -->
                <div class="request-timeline">
                    <h4>Request Timeline</h4>
                    ${request.timeline ? request.timeline.map(item => `
                        <div class="timeline-item">
                            <span class="timeline-date">${new Date(item.date).toLocaleDateString()}</span>
                            <span class="status-badge status-${item.status}">${item.status}</span>
                            <p>${item.message}</p>
                        </div>
                    `).join('') : ''}
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading requests:', error);
        document.getElementById('requestsList').innerHTML = `
            <p class="error-message">Error loading requests: ${error.message}</p>
        `;
    }
}

// Load complaints for the current student
async function loadComplaints() {
  try {
    // Get the current user from localStorage
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const studentName = currentUser.fullName || currentUser.name || currentUser.email?.split('@')[0];

    // Validate studentName
    if (!studentName) {
      console.error('❌ Cannot load complaints. Student name missing.');
      alert("Error: Student name not found. Please login again.");
      return;
    }

    // Fetch complaints for the current student
    const res = await fetch(`http://localhost:5500/api/complaints/${encodeURIComponent(studentName)}`);
    if (!res.ok) throw new Error("Failed to fetch complaints");

    // Parse the response
    const complaints = await res.json();

    // Populate the complaints list in the UI
    const complaintsList = document.getElementById('complaintsList');
    complaintsList.innerHTML = complaints.map(c => `
      <div class="complaint-card">
        <p><strong>Type:</strong> ${c.complaintType}</p>
        <p><strong>Details:</strong> ${c.details}</p>
        <p><strong>Status:</strong> ${c.status}</p>
        <p><strong>Date:</strong> ${new Date(c.createdAt).toLocaleString()}</p>
      </div>
    `).join('');
  } catch (error) {
    console.error('❌ Error loading complaints:', error);
    alert("Error loading complaints. Please try again.");
  }
}

// Filter Requests
function filterRequests(e) {
    const status = e.target.value;
    const cards = document.querySelectorAll('.request-card');
    
    cards.forEach(card => {
        if (status === 'all') {
            card.style.display = 'block';
        } else {
            const cardStatus = card.querySelector('.status-badge').textContent.toLowerCase();
            card.style.display = cardStatus === status ? 'block' : 'none';
        }
    });
}

// Handle Logout
async function handleLogout() {
    try {
        await signOut(auth);
        localStorage.removeItem('currentUser');
        localStorage.removeItem('userRole');
        window.location.href = 'student-dashboard.html';
    } catch (error) {
        console.error('Error signing out:', error);
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    const requestForm = document.getElementById('requestForm');
    const statusFilter = document.getElementById('statusFilter');
    
    if (requestForm) {
        requestForm.addEventListener('submit', handleRequestSubmission);
    }
    
    if (statusFilter) {
        statusFilter.addEventListener('change', filterRequests);
    }
    
    // Load initial requests
    loadRequests();
});

document.getElementById('submitComplaintBtn').addEventListener('click', () => {
    document.getElementById('newRequestForm').style.display = 'none';
    document.getElementById('viewRequests').style.display = 'none';
    document.getElementById('viewComplaints').style.display = 'none';
    document.getElementById('submitComplaint').style.display = 'block'; // Show the Submit Complaint section
});

document.getElementById('viewRequestsBtn').addEventListener('click', () => {
    document.getElementById('newRequestForm').style.display = 'none';
    document.getElementById('submitComplaint').style.display = 'none'; // Hide the Submit Complaint section
    document.getElementById('viewComplaints').style.display = 'none';
    document.getElementById('viewRequests').style.display = 'block'; // Show the View Requests section
});
