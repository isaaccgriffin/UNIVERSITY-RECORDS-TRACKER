const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const helmet = require('helmet');

const app = express();
const port = 5500;

// Middleware
app.use(cors({
  origin: ['http://localhost:5500', 'http://127.0.0.1:5500'], // Allow both localhost and 127.0.0.1
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  credentials: true
}));
app.use(express.json()); // Parses incoming JSON requests
app.use(express.json());

// Use helmet with xssFilter disabled
app.use(
    helmet({
        xssFilter: false,
    })
);

// Set proper cache-control headers
app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, max-age=0, must-revalidate');
    next();
});

// Data path
const dataPath = path.join(__dirname, 'data.json');

console.log('📁 Using data path:', dataPath);

// Ensure data.json exists with base structure
const readData = () => {
  if (!fs.existsSync(dataPath)) {
    console.warn('⚠️ data.json not found. Creating a new one.');
    fs.writeFileSync(dataPath, JSON.stringify({
      users: [],
      requests: [],
      complaints: [],
      files: []
    }, null, 2));
  }
  return JSON.parse(fs.readFileSync(dataPath, 'utf8'));
};

const writeData = (data) => {
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
};

// File upload config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// ========== ROUTES ==========

// ✅ Register a new student
app.post('/api/students', (req, res) => {
  try {
    const data = readData();
    const { email, studentId, fullName, course } = req.body;

    if (!email || !studentId || !fullName || !course) {
      console.error('❌ Missing required fields in request body:', req.body);
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    const newUser = { email, studentId, name: fullName, course };
    const exists = data.users.some(user => user.email === email);

    if (!exists) {
      data.users.push(newUser);
      writeData(data);
      console.log('✅ New student registered:', newUser);
      res.status(201).json({ success: true, student: newUser });
    } else {
      console.log('⚠️ Duplicate student not added:', email);
      res.status(409).json({ success: false, error: 'Student already exists' });
    }
  } catch (error) {
    console.error('❌ Failed to register student:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// 🔍 Get all students
app.get('/api/students', (req, res) => {
  try {
    const data = readData();
    console.log('📤 Sending all students');
    res.json(data.users);
  } catch (error) {
    console.error('❌ Failed to get students:', error);
    res.status(500).json({ success: false });
  }
});

// ✅ Submit a new request
app.post('/api/requests', (req, res) => {
  const data = readData();
  const request = {
    id: Date.now().toString(),
    studentId: req.body.studentId,
    studentName: req.body.studentName,
    requestType: req.body.requestType,
    academicYear: req.body.academicYear,
    semester: req.body.semester,
    comments: req.body.comments,
    status: 'pending',
    createdAt: new Date().toISOString()
  };

  data.requests.push(request);
  writeData(data);
  console.log('📨 New request submitted:', request);
  res.status(201).json(request);
});

// 🔍 Get requests by student name
app.get('/api/requests/:studentName', (req, res) => {
  const name = req.params.studentName?.toLowerCase();

  // Validate studentName
  if (!name || typeof name !== 'string') {
    return res.status(400).json({ error: 'Invalid student name' });
  }

  const data = readData();
  const result = data.requests.filter(r => r.studentName?.toLowerCase() === name);
  res.json(result);
});

// ✅ Submit a complaint
app.post('/api/complaints', (req, res) => {
  const data = readData();

  // Prepare the new complaint object
  const complaint = {
    id: Date.now().toString(), // Unique ID for the complaint
    studentId: req.body.studentId, // The student's ID
    studentName: req.body.studentName, // The student's name
    complaintType: req.body.complaintType, // Type of the complaint (e.g., technical, academic)
    details: req.body.details, // Details of the complaint
    status: 'pending', // Default status for new complaints
    createdAt: new Date().toISOString() // Timestamp when the complaint was created
  };

  // Add the new complaint to the complaints array
  data.complaints.push(complaint);

  // Save the updated data back to the JSON file
  writeData(data);

  // Log the submitted complaint
  console.log('🗣️ Complaint submitted:', complaint);

  // Respond with the newly created complaint
  res.status(201).json(complaint);
});

// 🔍 Get complaints by student name
app.get('/api/complaints/:studentName', (req, res) => {
  try {
    const studentName = req.params.studentName;
    if (!studentName) {
      return res.status(400).json({ error: 'Student name is required' });
    }

    // Ensure `studentName` and `c.studentName` are defined before calling `toLowerCase`
    const filteredComplaints = complaints.filter(c => 
      c.studentName && studentName && c.studentName.toLowerCase() === studentName.toLowerCase()
    );

    res.json(filteredComplaints);
  } catch (error) {
    console.error('Error fetching complaints:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ✅ Get all complaints (for admin)
app.get('/api/complaints', (req, res) => {
  try {
    // Read data from the JSON file
    const data = readData();

    // Respond with the list of all complaints
    res.json(data.complaints);
  } catch (error) {
    console.error('❌ Failed to fetch complaints:', error);

    // Respond with a 500 status code in case of an error
    res.status(500).json({ error: 'Failed to fetch complaints' });
  }
});

// PATCH: Update a complaint's status and/or admin response
app.patch('/api/complaints/:id', (req, res) => {
  try {
    const data = readData(); // Read the current data from the JSON file
    const { id } = req.params; // Extract the complaint ID from the route parameter
    const { status, adminResponse } = req.body; // Extract status and admin response from the request body

    // Find the complaint by ID
    const complaint = data.complaints.find(c => c.id === id);
    if (!complaint) {
      // If the complaint is not found, return a 404 response
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    // Update the complaint's status if provided
    if (status) complaint.status = status;

    // Update the admin response if provided
    if (adminResponse) complaint.adminResponse = adminResponse;

    // Save the updated data back to the JSON file
    writeData(data);

    console.log(`🛠 Complaint ${id} updated. Status: ${status || 'unchanged'}, Response: ${adminResponse || 'none'}`);
    res.json({ success: true, complaint }); // Respond with the updated complaint
  } catch (error) {
    console.error('❌ Failed to update complaint:', error);
    res.status(500).json({ success: false }); // Respond with a 500 error in case of failure
  }
});

// Delete a complaint by ID
app.delete('/api/complaints/:id', (req, res) => {
    try {
        const data = readData();
        const { id } = req.params;

        const complaintIndex = data.complaints.findIndex(c => c.id === id);
        if (complaintIndex === -1) {
            return res.status(404).json({ error: 'Complaint not found' });
        }

        data.complaints.splice(complaintIndex, 1); // Remove the complaint
        writeData(data);

        res.json({ success: true, message: 'Complaint deleted successfully' });
    } catch (error) {
        console.error('❌ Failed to delete complaint:', error);
        res.status(500).json({ error: 'Failed to delete complaint' });
    }
});

// 📁 Upload a file (optional future feature)
app.post('/api/student-files', upload.single('file'), (req, res) => {
  const data = readData();
  const { studentId, studentName } = req.body;
  const file = req.file;

  if (!file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const fileDoc = {
    id: Date.now().toString(),
    filename: file.filename,
    originalName: file.originalname,
    studentName,
    uploadDate: new Date().toISOString(),
    path: `uploads/${file.filename}`
  };

  data.files.push(fileDoc);
  writeData(data);
  console.log('📎 File uploaded:', fileDoc);
  res.status(201).json(fileDoc);
});

// Admin uploads a file for a student
app.post('/api/admin-files', upload.single('file'), (req, res) => {
  try {
    const data = readData();
    const { studentId, studentName } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileDoc = {
      id: Date.now().toString(),
      filename: file.filename,
      originalName: file.originalname,
      studentId,
      studentName,
      uploadDate: new Date().toISOString(),
      path: `uploads/${file.filename}`
    };

    data.files.push(fileDoc);
    writeData(data);

    console.log('📎 File uploaded by admin:', fileDoc);
    res.status(201).json(fileDoc);
  } catch (error) {
    console.error('❌ Failed to upload file:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

// Get uploaded files for a specific student
app.get('/api/files/:studentId', (req, res) => {
  try {
    const { studentId } = req.params;
    const data = readData();

    // Filter files by studentId
    const studentFiles = data.files.filter(file => file.studentId === studentId);

    res.json(studentFiles);
  } catch (error) {
    console.error('❌ Failed to fetch files:', error);
    res.status(500).json({ error: 'Failed to fetch files' });
  }
});

// Route: Get all users
app.get('/api/users', (req, res) => {
  const data = readData();
  res.json(data.users);
});

// Route: Delete a user by ID
app.delete('/api/users/:id', (req, res) => {
  const data = readData();
  const userId = req.params.id;
  data.users = data.users.filter(user => user.id !== userId);
  writeData(data);
  res.status(200).json({ message: 'User deleted successfully' });
});

// 🔍 Get all requests
app.get('/api/requests', (req, res) => {
  try {
    const data = readData(); // Read data from data.json
    res.json(data.requests); // Send all requests to the client
  } catch (error) {
    console.error('❌ Failed to fetch requests:', error);
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
});

// Update a request's status and admin response
app.patch('/api/requests/:id', (req, res) => {
    try {
        const data = readData(); // Read data from data.json
        const { id } = req.params; // Extract request ID from the URL
        const { status, adminResponse } = req.body; // Extract status and admin response from the request body

        // Find the request by ID
        const request = data.requests.find(r => r.id === id);
        if (!request) {
            return res.status(404).json({ error: 'Request not found' });
        }

        // Update the request
        request.status = status;
        request.adminResponse = adminResponse;
        request.responseDate = new Date().toISOString();

        writeData(data); // Save changes to data.json

        res.json({ success: true, request });
    } catch (error) {
        console.error('❌ Failed to update request:', error);
        res.status(500).json({ error: 'Failed to update request' });
    }
});

// Delete a request by ID
app.delete('/api/requests/:id', (req, res) => {
    try {
        const data = readData();
        const { id } = req.params;

        const requestIndex = data.requests.findIndex(r => r.id === id);
        if (requestIndex === -1) {
            return res.status(404).json({ error: 'Request not found' });
        }

        data.requests.splice(requestIndex, 1); // Remove the request
        writeData(data);

        res.json({ success: true, message: 'Request deleted successfully' });
    } catch (error) {
        console.error('❌ Failed to delete request:', error);
        res.status(500).json({ error: 'Failed to delete request' });
    }
});

// 🚀 Start the server
app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});

async function fetchComplaints(studentName) {
    try {
        const response = await fetch(`http://localhost:5500/api/complaints/${encodeURIComponent(studentName)}`);
        if (!response.ok) {
            throw new Error(`Server error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Complaints fetched:', data);
        // Render complaints on the dashboard
        renderComplaints(data);
    } catch (error) {
        console.error('Error fetching complaints:', error);
        alert('Failed to fetch complaints. Please try again later.');
 
 // Add this to your server.js
app.patch('/api/requests/:id/respond', (req, res) => {
  try {
    const data = readData();
    const { id } = req.params;
    const { status, adminComment } = req.body;

    const request = data.requests.find(r => r.id === id);
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    // Update the request
    request.status = status;
    request.adminResponse = {
      comment: adminComment,
      date: new Date().toISOString()
    };
    request.responseDate = new Date().toISOString();

    // Add to timeline
    request.timeline = request.timeline || [];
    request.timeline.push({
      status: status,
      date: new Date().toISOString(),
      message: `Request ${status} by admin`
    });

    writeData(data);
    res.json({ success: true, request });
  } catch (error) {
    console.error('Failed to update request:', error);
    res.status(500).json({ error: 'Failed to update request' });
  }
});     }
}
// Add this to your server.js routes
app.get('/api/requests/by-id/:studentId', (req, res) => {
  try {
    const data = readData();
    const studentId = req.params.studentId;
    
    if (!studentId) {
      return res.status(400).json({ error: 'Student ID is required' });
    }

    const studentRequests = data.requests.filter(request => 
      request.studentId === studentId
    );
    
    res.json(studentRequests);
  } catch (error) {
    console.error('Failed to fetch requests by student ID:', error);
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
});