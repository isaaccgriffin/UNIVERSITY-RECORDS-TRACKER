async function handleRequestSubmission(e) {
    e.preventDefault();
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));

    const files = Array.from(document.getElementById('supportingDocs').files);
    const filesList = await Promise.all(files.map(async file => ({
        name: file.name,
        size: file.size,
        type: file.type,
        data: await convertFileToBase64(file)
    })));

    const requestData = {
        studentId: currentUser.uid,
        requestType: document.getElementById('requestType').value,
        academicYear: document.getElementById('academicYear').value,
        semester: document.getElementById('semester').value,
        comments: document.getElementById('comments').value,
        files: filesList
    };

    try {
        const response = await fetch('http://localhost:3000/api/submit-request', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestData),
        });
        const result = await response.json();
        if (response.ok) {
            alert('Request submitted successfully!');
        } else {
            alert('Failed to submit request: ' + result.error);
        }
    } catch (error) {
        alert('An error occurred while submitting the request.');
    }
}

async function loadRequests() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) return;

    try {
        const response = await fetch(`http://localhost:3000/api/student/requests?studentId=${currentUser.uid}`);
        const requests = await response.json();
        displayRequests(requests);
    } catch (error) {
        alert('An error occurred while loading requests.');
    }
}

function displayRequests(requests) {
    const container = document.getElementById('requestsList');
    container.innerHTML = '';

    if (requests.length === 0) {
        container.innerHTML = '<p>No requests found.</p>';
        return;
    }

    requests.forEach((request) => {
        const div = document.createElement('div');
        div.className = 'request-card';
        div.innerHTML = `
            <h3>${request.requestType}</h3>
            <p><strong>Status:</strong> ${request.status}</p>
            <p><strong>Submitted:</strong> ${new Date(request.createdAt).toLocaleDateString()}</p>
        `;
        container.appendChild(div);
    });
}

// Function to fetch and display student requests
async function fetchStudentRequests(studentName) {
    try {
        const response = await fetch(`http://localhost:5500/api/requests/${studentName}`);
        if (!response.ok) {
            throw new Error('Failed to fetch student requests');
        }
        const requests = await response.json();

        // Display the requests in the console or update the UI
        console.log('Student Requests:', requests);

        // Example: Display requests in a table
        const table = document.getElementById('requestsTable');
        table.innerHTML = ''; // Clear existing rows
        requests.forEach(request => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${request.requestType}</td>
                <td>${request.academicYear}</td>
                <td>${request.semester}</td>
                <td>${request.comments}</td>
                <td>${request.status}</td>
                <td>${new Date(request.createdAt).toLocaleString()}</td>
            `;
            table.appendChild(row);
        });
    } catch (error) {
        console.error('Error fetching student requests:', error);
    }
}

// Example usage: Fetch requests for a specific student
const studentName = 'John Doe'; // Replace with the actual student name
fetchStudentRequests(studentName);

// Handle complaint form submission
async function handleComplaintSubmission(e) {
    e.preventDefault();
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));

    const complaintData = {
        studentName: currentUser.name,
        complaintType: document.getElementById('complaintType').value,
        details: document.getElementById('complaintDetails').value,
    };

    try {
        // Example: Update the complaint submission endpoint
        const response = await fetch('http://localhost:5500/api/complaints', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(complaintData),
        });
        const result = await response.json();
        if (response.ok) {
            alert('Complaint submitted successfully!');
            document.getElementById('complaintForm').reset();
        } else {
            alert('Failed to submit complaint: ' + result.error);
        }
    } catch (error) {
        alert('An error occurred while submitting the complaint.');
    }
}

// Fetch and display complaints for tracking
async function loadComplaints() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) return;

    try {
        const response = await fetch(`http://localhost:5500/api/complaints/${currentUser.name}`);
        const complaints = await response.json();

        const container = document.getElementById('complaintsList');
        container.innerHTML = '';

        if (complaints.length === 0) {
            container.innerHTML = '<p>No complaints found.</p>';
            return;
        }

        complaints.forEach((complaint) => {
            const div = document.createElement('div');
            div.className = 'complaint-card';
            div.innerHTML = `
                <h3>${complaint.complaintType}</h3>
                <p><strong>Status:</strong> ${complaint.status}</p>
                <p><strong>Details:</strong> ${complaint.details}</p>
                <p><strong>Submitted:</strong> ${new Date(complaint.createdAt).toLocaleDateString()}</p>
            `;
            container.appendChild(div);
        });
    } catch (error) {
        alert('An error occurred while loading complaints.');
    }
}

// Attach event listener to the complaint form
document.getElementById('complaintForm').addEventListener('submit', handleComplaintSubmission);

// Example usage: Load complaints when the "View Complaints" section is shown
document.getElementById('viewComplaintsBtn').addEventListener('click', () => {
    document.getElementById('newRequestForm').style.display = 'none';
    document.getElementById('submitComplaint').style.display = 'none';
    document.getElementById('viewRequests').style.display = 'none';
    document.getElementById('viewComplaints').style.display = 'block';
    loadComplaints();
});

// Example usage: Show the "Submit Complaint" section
document.getElementById('newComplaintBtn').addEventListener('click', () => {
    document.getElementById('submitComplaint').style.display = 'block';
    document.getElementById('viewComplaints').style.display = 'none';
});