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
            }
        } catch (error) {
            console.log('Supabase not initialized yet. Will work without backend.');
        }

        // Board and Subject Data
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

        // Sample Content Data
        const contentData = {
            topics: [
                { id: 1, name: 'Algebra Fundamentals', description: 'Basic algebraic concepts and operations' },
                { id: 2, name: 'Calculus Introduction', description: 'Limits, derivatives and integrals' },
                { id: 3, name: 'Trigonometry', description: 'Angles, ratios and identities' },
                { id: 4, name: 'Geometry', description: 'Shapes, theorems and proofs' }
            ],
            classes: [
                { id: 1, name: 'Live Class: Advanced Algebra', time: 'Today at 5:00 PM', instructor: 'Prof. Sharma' },
                { id: 2, name: 'Live Class: Calculus Deep Dive', time: 'Tomorrow at 3:00 PM', instructor: 'Prof. Gupta' },
                { id: 3, name: 'Upcoming: Trigonometry Workshop', time: 'Friday at 4:00 PM', instructor: 'Prof. Singh' }
            ],
            tests: [
                { id: 1, name: 'Algebra Test - Chapter 1', questions: 20, duration: '30 mins', locked: true },
                { id: 2, name: 'Calculus Quiz', questions: 15, duration: '20 mins', locked: true },
                { id: 3, name: 'Trigonometry Assessment', questions: 25, duration: '40 mins', locked: true }
            ],
            recorded: [
                { id: 1, name: 'Algebra Basics - Part 1', duration: '45 mins', locked: true },
                { id: 2, name: 'Calculus Fundamentals', duration: '60 mins', locked: true },
                { id: 3, name: 'Trigonometry Masterclass', duration: '90 mins', locked: true }
            ]
        };

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

        // Handle Login
        async function handleLogin() {
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;

            if (!email || !password) {
                showAlert('Error', 'Please fill in all fields');
                return;
            }

            // Simulated login (Replace with actual Supabase authentication)
            currentUser = {
                name: email.split('@')[0],
                email: email,
                board: selectedBoard,
                subject: selectedSubject,
                hasPaid: false
            };

            closeModal('loginModal');
            showDashboard();
        }

        // Handle Sign In
        async function handleSignIn() {
            const name = document.getElementById('signInName').value;
            const email = document.getElementById('signInEmail').value;
            const password = document.getElementById('signInPassword').value;

            if (!name || !email || !password) {
                showAlert('Error', 'Please fill in all fields');
                return;
            }

            try {
                const { data, error } = await supabaseClient.auth.signUp({
                    email,
                    password,
                    options: {
                        data: { name, board: selectedBoard, subject: selectedSubject }
                    }
                });

                if (error) throw error;

                showAlert('Sign Up Successful', 'Please check your email to verify your account.');
                closeModal('signInModal');
            } catch (error) {
                showAlert('Sign Up Error', error.message);
            }
        }

        // Show Dashboard
        function showDashboard() {
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

            showSection('topics');
        }

        // Show Section
        function showSection(section) {
            document.querySelectorAll('.content-area > div:not(.welcome-screen)').forEach(el => {
                el.classList.add('hidden');
            });

            document.querySelectorAll('.sidebar-item').forEach(item => {
                item.classList.remove('active');
            });

            event.target.classList.add('active');

            const sectionMap = {
                'topics': 'topicsSection',
                'classes': 'classesSection',
                'tests': 'testsSection',
                'recorded': 'recordedSection'
            };

            document.getElementById(sectionMap[section]).classList.remove('hidden');
            loadContent(section);
        }

        // Load Content
        function loadContent(section) {
            const data = contentData[section];
            const listId = section + 'List';
            const list = document.getElementById(listId);
            list.innerHTML = '';

            data.forEach(item => {
                const card = document.createElement('div');
                card.className = 'item-card';

                if (item.locked && !hasPaidSubscription) {
                    card.classList.add('locked');
                    card.onclick = () => showPaymentAlert();
                }

                let content = `<h3>${item.name}</h3>`;
                if (item.description) content += `<p>${item.description}</p>`;
                if (item.time) content += `<p>⏰ ${item.time}</p>`;
                if (item.instructor) content += `<p>👨‍🏫 ${item.instructor}</p>`;
                if (item.questions) content += `<p>📝 ${item.questions} Questions | ⏱️ ${item.duration}</p>`;
                if (item.duration && !item.questions) content += `<p>⏱️ ${item.duration}</p>`;
                if (item.locked && !hasPaidSubscription) content += `<span class="lock-icon">🔒</span>`;

                card.innerHTML = content;
                list.appendChild(card);
            });
        }

        // Show Payment Alert
        function showPaymentAlert() {
            showAlert('Payment Required', 'Please complete your payment to access this content.');
        }

        // Logout
        function logout() {
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
        }

        // Check Auth Status
        async function checkAuthStatus() {
            const { data, error } = await supabaseClient.auth.getUser();
            if (data?.user) {
                currentUser = data.user;
                showDashboard();
            }
        }

        // Initialize on page load
        window.onload = init;