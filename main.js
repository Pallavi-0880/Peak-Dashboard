// Application State - Declare first before everything
let currentUser = null;
let selectedBoard = null;
let selectedSubject = null;
let hasPaidSubscription = false;

// Supabase Configuration
const SUPABASE_URL = 'https://zggtadgymqkszwizvono.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpnZ3RhZGd5bXFrc3p3aXp2b25vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIzMTg4NTAsImV4cCI6MjA3Nzg5NDg1MH0.A2R9qcrwKq7qSGbGXUwHYRzregQGy4SMYU7yQAZwm1Q';

// Initialize Supabase client
let supabaseClient = null;

try {
    if (typeof supabase !== 'undefined') {
        const { createClient } = supabase;
        supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);
        console.log('✅ Supabase client initialized successfully');
    }
} catch (error) {
    console.error('❌ Supabase initialization error:', error);
}

// Board and Subject Data (Only for dropdowns)
const boardsData = {
    'ISC-XI': ['Math', 'English', 'Economics', 'Physics', 'Chemistry', 'Biology', 'Computer Science', 'Accounts'],
    'ISC-XII': ['Math', 'English', 'Economics', 'Physics', 'Chemistry', 'Biology', 'Computer Science', 'Accounts'],
    'CBSE-XI': ['Math', 'English', 'Economics', 'Physics', 'Chemistry', 'Biology', 'Computer Science', 'Accounts'],
    'CBSE-XII': ['Math', 'English', 'Economics', 'Physics', 'Chemistry', 'Biology', 'Computer Science', 'Accounts'],
    'IB-XI': ['Math', 'English', 'Economics', 'Physics', 'Chemistry', 'Biology', 'Computer Science'],
    'IB-XII': ['Math', 'English', 'Economics', 'Physics', 'Chemistry', 'Biology', 'Computer Science'],
    'A LEVEL': ['Math', 'English', 'Economics', 'Physics', 'Chemistry', 'Biology', 'Computer Science'],
    'AP': ['Math', 'English', 'Economics', 'Physics', 'Chemistry', 'Biology', 'Computer Science'],
    'ICSE': ['Math', 'English', 'Economics', 'Physics', 'Chemistry', 'Biology', 'Computer Science']
};

// NOTE: All content (topics, classes, tests, videos) is now fetched from Supabase database
// No hardcoded content in frontend - everything is dynamic from backend

// Fetch content from Supabase database
async function getContentFromDatabase(board, subject, contentType) {
    if (!supabaseClient) {
        console.error('❌ Supabase client not available');
        return [];
    }

    try {
        console.log(`🔍 Fetching ${contentType} for ${board} - ${subject}`);
        
        const tableName = contentType === 'recorded' ? 'recorded_videos' : contentType;
        
        const { data, error } = await supabaseClient
            .from(tableName)
            .select('*')
            .eq('board', board)
            .eq('subject', subject)
            .order('created_at', { ascending: true });

        if (error) {
            console.error(`❌ Error fetching ${contentType}:`, error);
            return [];
        }

        console.log(`✅ Fetched ${data.length} ${contentType} items`);
        return data;
        
    } catch (error) {
        console.error(`❌ Exception fetching ${contentType}:`, error);
        return [];
    }
}

// Fetch topic detail with content paragraphs
async function getTopicDetail(topicId) {
    if (!supabaseClient) {
        console.error('❌ Supabase client not available');
        return null;
    }

    try {
        console.log(`🔍 Fetching topic detail for ID: ${topicId}`);
        
        // Fetch topic info
        const { data: topic, error: topicError } = await supabaseClient
            .from('topics')
            .select('*')
            .eq('id', topicId)
            .single();

        if (topicError) {
            console.error('❌ Error fetching topic:', topicError);
            return null;
        }

        // Fetch topic content (paragraphs)
        const { data: content, error: contentError } = await supabaseClient
            .from('topic_content')
            .select('*')
            .eq('topic_id', topicId)
            .order('order_index', { ascending: true });

        if (contentError) {
            console.error('❌ Error fetching topic content:', contentError);
            return { ...topic, content: [] };
        }

        console.log(`✅ Fetched topic with ${content.length} paragraphs`);
        return { ...topic, content };
        
    } catch (error) {
        console.error('❌ Exception fetching topic detail:', error);
        return null;
    }
}

// Show topic detail page
async function showTopicDetail(topicId, topicName) {
    console.log('📖 Opening topic detail:', topicName);
    
    // Hide all sections
    document.querySelectorAll('.content-area > div:not(.welcome-screen)').forEach(el => {
        el.classList.add('hidden');
    });
    
    // Show topic detail section
    const detailSection = document.getElementById('topicDetailSection');
    detailSection.classList.remove('hidden');
    
    // Set title
    document.getElementById('topicDetailTitle').textContent = topicName;
    document.getElementById('topicDetailDesc').textContent = 'Loading...';
    document.getElementById('topicDetailContent').innerHTML = '<p style="padding: 20px;">Loading content...</p>';
    
    // Fetch topic details
    const topicData = await getTopicDetail(topicId);
    
    if (!topicData) {
        document.getElementById('topicDetailDesc').textContent = 'Error loading topic';
        document.getElementById('topicDetailContent').innerHTML = '<p style="color: #dc3545;">Failed to load content. Please try again.</p>';
        return;
    }
    
    // Set description
    document.getElementById('topicDetailDesc').textContent = topicData.description || '';
    
    // Display content paragraphs
    const contentDiv = document.getElementById('topicDetailContent');
    contentDiv.innerHTML = '';
    
    if (!topicData.content || topicData.content.length === 0) {
        contentDiv.innerHTML = '<p style="color: #666;">No detailed content available yet.</p>';
        return;
    }
    
    topicData.content.forEach(item => {
        const section = document.createElement('div');
        section.style.marginBottom = '25px';
        section.style.padding = '20px';
        section.style.background = '#f8f9fa';
        section.style.borderRadius = '8px';
        section.style.borderLeft = '4px solid #667eea';
        
        if (item.heading) {
            const heading = document.createElement('h3');
            heading.textContent = item.heading;
            heading.style.color = '#333';
            heading.style.marginBottom = '10px';
            section.appendChild(heading);
        }
        
        const para = document.createElement('p');
        para.textContent = item.paragraph;
        para.style.color = '#555';
        para.style.lineHeight = '1.6';
        section.appendChild(para);
        
        contentDiv.appendChild(section);
    });
    
    console.log('✅ Topic detail loaded successfully');
}

// Back to topics list
function backToTopics() {
    showSection('topics');
}

// Initialize the application
function init() {
    populateBoardDropdown();
    checkAuthStatus();
}

// Populate Board Dropdown
function populateBoardDropdown() {
    const dropdown = document.getElementById('boardDropdown');
    dropdown.innerHTML = '';

    Object.keys(boardsData).forEach(board => {
        const link = document.createElement('a');
        link.href = '#';
        link.textContent = board;
        link.onclick = (e) => {
            e.preventDefault();
            selectBoard(board);
        };
        dropdown.appendChild(link);
    });
}

// Select Board
function selectBoard(board) {
    selectedBoard = board;
    closeAllDropdowns();
    showSubjectModal(board);
}

// Show Subject Modal
function showSubjectModal(board) {
    const modal = document.getElementById('subjectModal');
    const subjectList = document.getElementById('subjectList');
    subjectList.innerHTML = '';

    boardsData[board].forEach(subject => {
        const btn = document.createElement('button');
        btn.className = 'btn btn-login';
        btn.style.margin = '5px';
        btn.textContent = subject;
        btn.onclick = () => selectSubject(subject);
        subjectList.appendChild(btn);
    });

    modal.classList.add('active');
}

// Select Subject
function selectSubject(subject) {
    selectedSubject = subject;
    closeModal('subjectModal');
    showAlert('Selection Complete', `You have selected ${selectedBoard} - ${selectedSubject}`);
}

// Toggle Curriculum Dropdown
function toggleCurriculumDropdown(e) {
    e.preventDefault();
    e.stopPropagation();
    const dropdown = document.getElementById('boardDropdown');
    dropdown.classList.toggle('show');
}

// Close all dropdowns when clicking outside
document.addEventListener('click', function (e) {
    if (!e.target.closest('.dropdown')) {
        closeAllDropdowns();
    }
});

function closeAllDropdowns() {
    const dropdowns = document.querySelectorAll('.dropdown-content');
    dropdowns.forEach(d => d.classList.remove('show'));
}

// Show Modals
function showLoginModal() {
    if (!selectedBoard || !selectedSubject) {
        showAlert('Selection Required', 'Please select your Board and Subject first.');
        return;
    }
    document.getElementById('loginModal').classList.add('active');
}

function showSignInModal() {
    if (!selectedBoard || !selectedSubject) {
        showAlert('Selection Required', 'Please select your Board and Subject first.');
        return;
    }
    document.getElementById('signInModal').classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

function showAlert(title, message) {
    document.getElementById('alertTitle').textContent = title;
    document.getElementById('alertMessage').textContent = message;
    document.getElementById('alertModal').classList.add('active');
}

// Handle Login - WITH SUPABASE (NO EMAIL VERIFICATION)
async function handleLogin() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    if (!email || !password) {
        showAlert('Error', 'Please fill in all fields');
        return;
    }

    if (!supabaseClient) {
        showAlert('Error', 'Database connection not available');
        return;
    }

    try {
        console.log('🔐 Attempting login for:', email);

        // Supabase auth login
        const { data: authData, error: authError } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (authError) {
            console.error('❌ Auth error:', authError);
            showAlert('Login Error', authError.message);
            return;
        }

        console.log('✅ User authenticated:', authData.user.id);

        // Students table se data fetch karo
        const { data: studentData, error: studentError } = await supabaseClient
            .from('Students')
            .select('*')
            .eq('user_id', authData.user.id)
            .single();

        if (studentError) {
            console.error('❌ Student fetch error:', studentError);
            showAlert('Error', 'Unable to fetch student data. Please try again.');
            return;
        }

        console.log('✅ Student data fetched:', studentData);

        // Set current user
        currentUser = {
            id: authData.user.id,
            name: studentData.name,
            email: studentData.email,
            board: studentData.board,
            subject: studentData.subject
        };

        selectedBoard = studentData.board;
        selectedSubject = studentData.subject;

        closeModal('loginModal');
        showAlert('Success', `Welcome back, ${studentData.name}!`);
        
        setTimeout(() => {
            closeModal('alertModal');
            showDashboard();
        }, 1500);

    } catch (error) {
        console.error('❌ Login error:', error);
        showAlert('Error', 'Something went wrong: ' + error.message);
    }
}

// Handle Sign In - WITH SUPABASE (NO EMAIL VERIFICATION REQUIRED)
async function handleSignIn() {
    const name = document.getElementById('signInName').value;
    const email = document.getElementById('signInEmail').value;
    const password = document.getElementById('signInPassword').value;

    if (!name || !email || !password) {
        showAlert('Error', 'Please fill in all fields');
        return;
    }

    if (!supabaseClient) {
        showAlert('Error', 'Database connection not available');
        return;
    }

    try {
        console.log('📝 Attempting signup for:', email);

        // Supabase auth me user banao (EMAIL VERIFICATION SKIP)
        const { data: authData, error: authError } = await supabaseClient.auth.signUp({
            email: email,
            password: password,
            options: {
                emailRedirectTo: window.location.origin,
                data: {
                    name: name
                }
            }
        });

        if (authError) {
            console.error('❌ Auth signup error:', authError);
            showAlert('Sign Up Error', authError.message);
            return;
        }

        // Check if email confirmation is required
        if (authData.user && !authData.session) {
            showAlert('Email Verification Required', 'Please check your email to verify your account before logging in.');
            closeModal('signInModal');
            return;
        }

        console.log('✅ Auth user created:', authData.user.id);

        // Students table me data save karo
        const { data: studentData, error: studentError } = await supabaseClient
            .from('Students')
            .insert([{
                user_id: authData.user.id,
                name: name,
                email: email,
                board: selectedBoard,
                subject: selectedSubject
            }])
            .select();

        if (studentError) {
            console.error('❌ Student insert error:', studentError);
            showAlert('Error', 'Failed to save student data: ' + studentError.message);
            return;
        }

        console.log('✅ Student data saved:', studentData);

        // Success - Auto login if session exists
        if (authData.session) {
            currentUser = {
                id: authData.user.id,
                name: name,
                email: email,
                board: selectedBoard,
                subject: selectedSubject
            };

            showAlert('Success', 'Account created successfully!');
            closeModal('signInModal');
            
            setTimeout(() => {
                closeModal('alertModal');
                showDashboard();
            }, 1500);
        } else {
            showAlert('Success', 'Account created! You can now login.');
            closeModal('signInModal');
        }

    } catch (error) {
        console.error('❌ Signup error:', error);
        showAlert('Error', 'Something went wrong: ' + error.message);
    }
}

// Show Dashboard
function showDashboard() {
    console.log('🏠 Opening dashboard...');
    console.log('👤 User:', currentUser);
    console.log('📚 Board:', selectedBoard, '| Subject:', selectedSubject);
    
    document.getElementById('publicNav').classList.add('hidden');
    document.getElementById('userNav').classList.remove('hidden');
    document.getElementById('sidebar').classList.remove('hidden');
    document.getElementById('welcomeScreen').classList.add('hidden');

    const boardClass = selectedBoard.includes('XI') ? 'XI' : 'XII';
    const userProfile = document.getElementById('userProfile');
    userProfile.innerHTML = `
        <div class="user-avatar">${currentUser.name.charAt(0).toUpperCase()}</div>
        <div>${currentUser.name}_${selectedBoard.split('-')[0]}_${boardClass}_${selectedSubject}</div>
    `;

    console.log('🎯 Loading Topics section...');
    showSection('topics');
}

// Show Section - Fixed event handling
function showSection(section) {
    console.log('📂 Switching to section:', section);
    
    // Hide all content sections
    document.querySelectorAll('.content-area > div:not(.welcome-screen)').forEach(el => {
        el.classList.add('hidden');
    });
    
    // Remove active class from all sidebar items
    document.querySelectorAll('.sidebar-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Add active class to clicked item (if event target exists)
    if (window.event && window.event.target) {
        window.event.target.classList.add('active');
    }

    const sectionMap = {
        'topics': 'topicsSection',
        'classes': 'classesSection',
        'tests': 'testsSection',
        'recorded': 'recordedSection'
    };

    const sectionId = sectionMap[section];
    
    if (sectionId) {
        document.getElementById(sectionId).classList.remove('hidden');
        loadContent(section);
    } else {
        console.error('❌ Invalid section:', section);
    }
}

// Load Content - Fetch from Supabase Database
async function loadContent(section) {
    console.log('📖 Loading content for section:', section);
    console.log('👤 Current user board:', selectedBoard, '| Subject:', selectedSubject);
    
    // Fix: Correct element IDs (singular, not plural)
    const listId = section === 'topics' ? 'topicList' :
                   section === 'classes' ? 'classList' :
                   section === 'tests' ? 'testList' :
                   section === 'recorded' ? 'recordedList' : section + 'List';
    
    console.log('🎯 Looking for element with ID:', listId);
    
    const list = document.getElementById(listId);
    
    if (!list) {
        console.error('❌ List element not found:', listId);
        return;
    }
    
    // Show loading message
    list.innerHTML = '<p style="padding: 20px; color: #666;">Loading...</p>';

    // Fetch data from Supabase
    const data = await getContentFromDatabase(selectedBoard, selectedSubject, section);

    if (!data || data.length === 0) {
        console.warn('⚠️ No data found for section:', section);
        list.innerHTML = '<p style="padding: 20px; color: #666;">No content available for this section yet.</p>';
        return;
    }

    // Clear loading message
    list.innerHTML = '';

    console.log(`✅ Loading ${data.length} items for section: ${section}`);

    data.forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.name}`);
        
        const card = document.createElement('div');
        card.className = 'item-card';

        // For topics section, make cards clickable to show detail
        if (section === 'topics') {
            card.style.cursor = 'pointer';
            card.onclick = () => showTopicDetail(item.id, item.name);
        }

        // Check if locked (for tests and recorded videos)
        const isLocked = item.is_locked !== undefined ? item.is_locked : (item.locked || false);
        
        if (isLocked && !hasPaidSubscription && section !== 'topics') {
            card.classList.add('locked');
            card.onclick = () => showPaymentAlert();
        }

        let content = `<h3>${item.name}</h3>`;
        if (item.description) content += `<p>${item.description}</p>`;
        if (item.time) content += `<p>⏰ ${item.time}</p>`;
        if (item.instructor) content += `<p>👨‍🏫 ${item.instructor}</p>`;
        if (item.questions) content += `<p>📝 ${item.questions} Questions | ⏱️ ${item.duration}</p>`;
        if (item.duration && !item.questions) content += `<p>⏱️ ${item.duration}</p>`;
        if (isLocked && !hasPaidSubscription) content += `<span class="lock-icon">🔒</span>`;
        
        // Add click indicator for topics
        if (section === 'topics') {
            content += `<span style="float: right; color: #667eea;">→</span>`;
        }

        card.innerHTML = content;
        list.appendChild(card);
    });
    
    console.log(`✅ Successfully loaded ${data.length} items for ${selectedBoard} - ${selectedSubject} (${section})`);
}

// Show Payment Alert
function showPaymentAlert() {
    showAlert('Payment Required', 'Please complete your payment to access this content.');
}

// Logout
async function logout() {
    try {
        if (supabaseClient) {
            const { error } = await supabaseClient.auth.signOut();
            if (error) {
                console.error('Logout error:', error);
            }
        }
    } catch (error) {
        console.error('Logout error:', error);
    }

    currentUser = null;
    selectedBoard = null;
    selectedSubject = null;
    hasPaidSubscription = false;

    document.getElementById('publicNav').classList.remove('hidden');
    document.getElementById('userNav').classList.add('hidden');
    document.getElementById('sidebar').classList.add('hidden');
    document.getElementById('welcomeScreen').classList.remove('hidden');

    document.querySelectorAll('.content-area > div:not(.welcome-screen)').forEach(el => {
        el.classList.add('hidden');
    });

    showAlert('Success', 'You have been logged out successfully.');
}

// Check Auth Status
async function checkAuthStatus() {
    if (!supabaseClient) {
        console.log('Supabase client not available');
        return;
    }

    try {
        const { data: { user }, error } = await supabaseClient.auth.getUser();
        
        if (error) {
            console.log('No active session');
            return;
        }

        if (user) {
            console.log('✅ Active session found for user:', user.id);
            
            // Fetch student data
            const { data: studentData, error: studentError } = await supabaseClient
                .from('Students')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (studentError) {
                console.error('Error fetching student data:', studentError);
                return;
            }

            // Set current user
            currentUser = {
                id: user.id,
                name: studentData.name,
                email: studentData.email,
                board: studentData.board,
                subject: studentData.subject
            };

            selectedBoard = studentData.board;
            selectedSubject = studentData.subject;

            showDashboard();
        }
    } catch (error) {
        console.error('Auth check error:', error);
    }
}

// Initialize on page load
window.onload = init;