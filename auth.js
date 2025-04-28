import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBr2sHC1c_Ll0v0y4boSVNhFz8kjQ9fgOY",
    authDomain: "university-tracker00.firebaseapp.com",
    projectId: "university-tracker00",
    storageBucket: "university-tracker00.firebasestorage.app",
    messagingSenderId: "130275131839",
    appId: "1:130275131839:web:707cce82f1d0ddecbf610a"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export const registerStudent = async (email, password) => {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        alert('Account Created Successfully!');
        return { success: true, user };
    } catch (error) {
        alert(error.message);
        return { success: false, error: error.message };
    }
};

// Handle student login
if (document.getElementById('studentLoginForm')) {
    const studentForm = document.getElementById('studentLoginForm');
    studentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            
            // Get student data from Firestore
            const studentDoc = await getDoc(doc(db, "students", user.uid));
            if (studentDoc.exists() && studentDoc.data().role === 'student') {
                localStorage.setItem('currentUser', JSON.stringify({
                    uid: user.uid,
                    email: user.email,
                    name: studentDoc.data().name,
                    studentId: studentDoc.data().studentId,
                    role: 'student'
                }));
                window.location.href = 'student-dashboard.html';
            } else {
                await signOut(auth);
                alert('Invalid student account!');
            }
        } catch (error) {
            alert('Login failed: ' + error.message);
        }
    });
}

// Handle admin login
if (document.getElementById('adminLoginForm')) {
    const adminForm = document.getElementById('adminLoginForm');
    adminForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            
            // Check if user is admin in Firestore
            const adminDoc = await getDoc(doc(db, "admins", user.uid));
            if (adminDoc.exists() && adminDoc.data().role === 'admin') {
                localStorage.setItem('currentUser', JSON.stringify({
                    uid: user.uid,
                    email: user.email,
                    role: 'admin'
                }));
                window.location.href = 'admin-dashboard.html';
            } else {
                await signOut(auth);
                alert('Invalid admin credentials!');
            }
        } catch (error) {
            alert('Login failed: ' + error.message);
        }
    });
}

// Handle student registration
const registerForm = document.getElementById('studentRegisterForm');
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log('Registration form submitted'); // Debug log

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            console.log('User registered:', userCredential); // Debug log

            // Save additional user data in Firestore
            await setDoc(doc(db, "students", userCredential.user.uid), {
                email: email,
                role: 'student',
                createdAt: new Date().toISOString()
            });

            // Store user info in localStorage
            localStorage.setItem('currentUser', JSON.stringify({
                uid: userCredential.user.uid,
                email: userCredential.user.email,
                role: 'student'
            }));

            // Redirect to dashboard
            window.location.href = 'student-dashboard.html';
        } catch (error) {
            console.error('Registration error:', error); // Debug log
            alert(error.message);
        }
    });
}

// Handle logout
if (document.getElementById('logout')) {
    document.getElementById('logout').addEventListener('click', async () => {
        try {
            await signOut(auth);
            localStorage.removeItem('currentUser');
            window.location.href = 'index.html';
        } catch (error) {
            alert('Logout failed: ' + error.message);
        }
    });
}

// Auth state observer
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log('User is signed in:', user.email);
    } else {
        console.log('User is signed out');
    }
});

// Handle Login
const loginForm = document.getElementById('studentLoginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const errorMessage = document.getElementById('errorMessage');

        try {
            const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
            console.log('Login successful:', userCredential.user);
            
            // Save user data to localStorage
            localStorage.setItem('currentUser', JSON.stringify({
                uid: userCredential.user.uid,
                email: userCredential.user.email,
                role: 'student'
            }));

            // Redirect to dashboard
            window.location.href = 'student-dashboard.html';
        } catch (error) {
            console.error('Login error:', error);
            errorMessage.textContent = error.message;
        }
    });
}