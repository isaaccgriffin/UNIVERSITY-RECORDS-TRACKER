import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import { getAuth, signOut } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";

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

document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('responseModal');
    const responseForm = document.getElementById('responseForm');
    const statusFilter = document.getElementById('statusFilter');
    const fileList = document.getElementById('fileList');

    window.modal = modal;
    window.responseForm = responseForm;
    window.statusFilter = statusFilter;
    window.fileList = fileList;

    setupEventListeners();
    fetchAndDisplayRequests('pending');
    fetchAndDisplayComplaints('pending');
});

function setupEventListeners() {
    document.querySelector('.close-btn')?.addEventListener('click', () => closeModal());
    window.addEventListener('click', (e) => { if (e.target === window.modal) closeModal(); });

    document.getElementById('requestFilter')?.addEventListener('change', (event) => {
        const filter = event.target.value;
        fetchAndDisplayRequests(filter);
    });

    document.getElementById('complaintFilter')?.addEventListener('change', (event) => {
        const filter = event.target.value;
        fetchAndDisplayComplaints(filter);
    });

    document.getElementById('logoutBtn')?.addEventListener('click', handleLogout);

    // Add event listeners for view toggles
    document.getElementById('viewRequestsBtn')?.addEventListener('click', () => {
        document.getElementById('requestsSection').style.display = 'block';
        document.getElementById('complaintsSection').style.display = 'none';
        document.getElementById('viewRequestsBtn').classList.add('active');
        document.getElementById('viewComplaintsBtn').classList.remove('active');
        fetchAndDisplayRequests(document.getElementById('requestFilter')?.value || 'pending');
    });

    document.getElementById('viewComplaintsBtn')?.addEventListener('click', () => {
        document.getElementById('complaintsSection').style.display = 'block';
        document.getElementById('requestsSection').style.display = 'none';
        document.getElementById('viewComplaintsBtn').classList.add('active');
        document.getElementById('viewRequestsBtn').classList.remove('active');
        fetchAndDisplayComplaints(document.getElementById('complaintFilter')?.value || 'pending');
    });

    // Add event delegation for response buttons
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('approve-btn')) {
            const id = e.target.getAttribute('data-id');
            showResponseModal(id, 'approve');
        } else if (e.target.classList.contains('decline-btn')) {
            const id = e.target.getAttribute('data-id');
            showResponseModal(id, 'decline');
        }
    });
}

function showResponseModal(id, action) {
    const modal = document.getElementById('responseModal');
    const form = document.getElementById('responseForm');
    
    form.innerHTML = `
        <h3>${action === 'approve' ? 'Approve' : 'Decline'} Request</h3>
        <input type="hidden" id="requestId" value="${id}">
        <input type="hidden" id="actionType" value="${action}">
        <div class="form-group">
            <label for="adminComment">Comment:</label>
            <textarea id="adminComment" rows="3" required></textarea>
        </div>
        <button type="submit">Submit Response</button>
    `;

    form.onsubmit = async (e) => {
        e.preventDefault();
        const comment = document.getElementById('adminComment').value;
        const status = action === 'approve' ? 'approved' : 'declined';
        
        try {
            const response = await fetch(`http://localhost:5500/api/requests/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    status: status,
                    adminComment: comment
                })
            });

            if (response.ok) {
                alert(`Request ${status} successfully!`);
                closeModal();
                fetchAndDisplayRequests();
            } else {
                throw new Error('Failed to update request');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Failed to submit response. Please try again.');
        }
    };

    modal.style.display = 'block';
}

async function fetchAndDisplayRequests(filter = 'pending') {
    try {
        const res = await fetch(`http://localhost:5500/api/requests?status=${filter}`);
        const requests = await res.json();

        const requestsContainer = document.getElementById('requestsContainer');
        requestsContainer.innerHTML = '';

        if (requests.length === 0) {
            requestsContainer.innerHTML = '<p>No requests found.</p>';
            return;
        }

        requests.forEach(request => {
            const requestDiv = document.createElement('div');
            requestDiv.classList.add('request-item');
            requestDiv.innerHTML = `
                <p><strong>ID:</strong> ${request.id}</p>
                <p><strong>Student Name:</strong> ${request.studentName || 'N/A'}</p>
                <p><strong>Type:</strong> ${request.requestType}</p>
                <p><strong>Status:</strong> ${request.status}</p>
                <p><strong>Date:</strong> ${new Date(request.createdAt).toLocaleString()}</p>
                <div class="response-buttons">
                    <button class="approve-btn" data-id="${request.id}">Approve & Comment</button>
                    <button class="decline-btn" data-id="${request.id}">Decline & Comment</button>
                </div>
                <hr>
            `;
            requestsContainer.appendChild(requestDiv);
        });
    } catch (error) {
        console.error('❌ Failed to fetch requests:', error);
    }
}

async function fetchAndDisplayComplaints(filter = 'pending') {
    try {
        const res = await fetch(`http://localhost:5500/api/complaints?status=${filter}`);
        const complaints = await res.json();

        const complaintsContainer = document.getElementById('complaintsContainer');
        complaintsContainer.innerHTML = '';

        if (complaints.length === 0) {
            complaintsContainer.innerHTML = '<p>No complaints found.</p>';
            return;
        }

        complaints.forEach(complaint => {
            const complaintDiv = document.createElement('div');
            complaintDiv.classList.add('complaint-item');
            complaintDiv.innerHTML = `
                <p><strong>ID:</strong> ${complaint.id}</p>
                <p><strong>Student Name:</strong> ${complaint.studentName || 'N/A'}</p>
                <p><strong>Type:</strong> ${complaint.complaintType}</p>
                <p><strong>Status:</strong> ${complaint.status}</p>
                <p><strong>Date:</strong> ${new Date(complaint.createdAt).toLocaleString()}</p>
                <div class="response-buttons">
                    <button class="approve-btn" data-id="${complaint.id}">Approve & Comment</button>
                    <button class="decline-btn" data-id="${complaint.id}">Decline & Comment</button>
                </div>
                <hr>
            `;
            complaintsContainer.appendChild(complaintDiv);
        });
    } catch (error) {
        console.error('❌ Failed to fetch complaints:', error);
    }
}

function handleLogout() {
    signOut(auth).then(() => {
        alert('✅ Successfully logged out!');
        window.location.href = 'index.html';
    }).catch((error) => {
        console.error('❌ Logout failed:', error);
        alert('❌ Logout failed. Please try again.');
    });
}

function closeModal() {
    const modal = document.getElementById('responseModal');
    if (modal) modal.style.display = 'none';
}
// In admin.js, improve the error handling:
document.getElementById('responseForm').onsubmit = async (e) => {
    e.preventDefault();
    const comment = document.getElementById('adminComment').value;
    const status = action === 'approve' ? 'approved' : 'declined';
    
    try {
      const response = await fetch(`http://localhost:5500/api/requests/${id}/respond`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: status,
          adminComment: comment
        })
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update request');
      }
  
      alert(`Request ${status} successfully!`);
      closeModal();
      fetchAndDisplayRequests();
    } catch (error) {
      console.error('Error:', error);
      alert(`Failed to submit response: ${error.message}`);
    }
  };