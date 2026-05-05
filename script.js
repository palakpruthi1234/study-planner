document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const dateDisplay = document.getElementById('dateDisplay');
    const taskForm = document.getElementById('taskForm');
    const taskList = document.getElementById('taskList');
    const totalHoursDisplay = document.getElementById('totalHours');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    
    // Inputs
    const subjectNameInput = document.getElementById('subjectName');
    const studyHoursInput = document.getElementById('studyHours');
    const priorityInput = document.getElementById('priority');

    // State
    let tasks = [];

    // Initialize Date
    const options = { weekday: 'long', month: 'long', day: 'numeric' };
    const today = new Date().toLocaleDateString('en-US', options);
    dateDisplay.textContent = today;

    // Load from local storage if available
    const savedTasks = localStorage.getItem('studyPlannerTasks');
    if (savedTasks) {
        try {
            tasks = JSON.parse(savedTasks);
        } catch (e) {
            console.error('Failed to parse tasks from local storage');
            tasks = [];
        }
    }
    
    // Initial Render
    renderTasks();
    updateStats();

    // Event Listeners
    taskForm.addEventListener('submit', addTask);

    function addTask(e) {
        e.preventDefault();

        const name = subjectNameInput.value.trim();
        const hours = parseFloat(studyHoursInput.value);
        const priority = priorityInput.value;

        if (!name || isNaN(hours) || !priority) return;

        const newTask = {
            id: Date.now().toString(),
            name,
            hours,
            priority,
            completed: false
        };

        tasks.push(newTask);
        saveTasks();
        renderTasks();
        updateStats();

        // Reset form cleanly
        taskForm.reset();
        priorityInput.value = ""; // Reset select specifically
        subjectNameInput.focus(); // Return focus for quick entry
    }

    function toggleTaskComplete(id) {
        tasks = tasks.map(task => {
            if (task.id === id) {
                return { ...task, completed: !task.completed };
            }
            return task;
        });
        saveTasks();
        renderTasks();
        updateStats();
    }

    function deleteTask(id) {
        tasks = tasks.filter(task => task.id !== id);
        saveTasks();
        renderTasks();
        updateStats();
    }

    function renderTasks() {
        taskList.innerHTML = '';

        if (tasks.length === 0) {
            taskList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-book-open"></i>
                    <p>No tasks yet. Add a study subject to get started!</p>
                </div>
            `;
            return;
        }

        // Sort tasks: Incomplete first, then by priority (High -> Medium -> Low)
        const priorityScore = { 'High': 3, 'Medium': 2, 'Low': 1 };
        
        const sortedTasks = [...tasks].sort((a, b) => {
            if (a.completed === b.completed) {
                return priorityScore[b.priority] - priorityScore[a.priority];
            }
            return a.completed ? 1 : -1;
        });

        sortedTasks.forEach(task => {
            const li = document.createElement('li');
            li.className = `task-item priority-${task.priority} ${task.completed ? 'completed' : ''}`;
            
            li.innerHTML = `
                <div class="task-content">
                    <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} aria-label="Mark task as complete">
                    <div class="task-details">
                        <span class="task-title">${escapeHTML(task.name)}</span>
                        <div class="task-meta">
                            <span><i class="far fa-clock"></i> ${task.hours}h</span>
                            <span class="task-badge badge-${task.priority}">${task.priority}</span>
                        </div>
                    </div>
                </div>
                <button class="delete-btn" aria-label="Delete Task">
                    <i class="fas fa-trash"></i>
                </button>
            `;

            // Add event listeners to the generated elements
            const checkbox = li.querySelector('.task-checkbox');
            checkbox.addEventListener('change', () => toggleTaskComplete(task.id));

            const deleteBtn = li.querySelector('.delete-btn');
            deleteBtn.addEventListener('click', () => deleteTask(task.id));

            taskList.appendChild(li);
        });
    }

    function updateStats() {
        const totalHours = tasks.reduce((sum, task) => sum + task.hours, 0);
        totalHoursDisplay.textContent = `${totalHours.toFixed(1)}h`;

        if (tasks.length === 0) {
            progressFill.style.width = '0%';
            progressText.textContent = '0%';
            return;
        }

        const completedTasks = tasks.filter(task => task.completed).length;
        const totalTasks = tasks.length;
        const progressPercentage = Math.round((completedTasks / totalTasks) * 100);

        progressFill.style.width = `${progressPercentage}%`;
        progressText.textContent = `${progressPercentage}%`;
        
        // Dynamic progress color based on completion
        if (progressPercentage === 100) {
            progressFill.style.background = 'var(--success)';
        } else {
            progressFill.style.background = 'var(--accent)';
        }
    }

    function saveTasks() {
        localStorage.setItem('studyPlannerTasks', JSON.stringify(tasks));
    }

    // Utility function to prevent XSS
    function escapeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
});
