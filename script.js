document.addEventListener('DOMContentLoaded', () => {
    loadTasks();

    const todoForm = document.getElementById('todo-form');
    const todoInput = document.getElementById('todo-input');
    const columns = document.querySelectorAll('.task-list');

    todoForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const taskText = todoInput.value.trim();
      if (taskText) {
        addTask(taskText, 'todo-list');
        todoInput.value = '';
        updateTaskCounts();
        saveTasks();
      }
    });

    columns.forEach(column => {
      column.addEventListener('dragover', handleDragOver);
      column.addEventListener('drop', handleDrop);
      column.addEventListener('dragleave', handleDragLeave);
    });

    function addTask(taskText, columnId, isLoading = false) {
      const li = document.createElement('li');
      li.className = 'task-item';
      li.draggable = true;
      
      const priority = ['low', 'medium', 'high'][Math.floor(Math.random() * 3)];
      
      const taskContent = document.createElement('div');
      taskContent.className = 'task-content';
      taskContent.innerHTML = `
        ${taskText}
        <div class="task-meta">
          <span class="priority priority-${priority}">${priority}</span>
          <span><i class="far fa-clock"></i> ${new Date().toLocaleDateString()}</span>
        </div>
      `;

      const actions = document.createElement('div');
      actions.className = 'task-actions';
      
      const editBtn = document.createElement('button');
      editBtn.className = 'btn-edit';
      editBtn.innerHTML = '<i class="fas fa-edit"></i> Edit';
      editBtn.onclick = () => editTask(li);

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'btn-delete';
      deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i> Delete';
      deleteBtn.onclick = () => {
        li.remove();
        updateTaskCounts();
        saveTasks();
      };

      actions.appendChild(editBtn);
      actions.appendChild(deleteBtn);
      
      li.appendChild(taskContent);
      li.appendChild(actions);

      li.addEventListener('dragstart', handleDragStart);
      li.addEventListener('dragend', handleDragEnd);

      document.getElementById(columnId).appendChild(li);
      
      if (!isLoading) {
        updateTaskCounts();
        saveTasks();
      }
    }

    function editTask(taskElement) {
      const taskContent = taskElement.querySelector('.task-content');
      const currentText = taskContent.childNodes[0].textContent.trim();
      const input = document.createElement('input');
      input.type = 'text';
      input.value = currentText;
      input.style.width = '100%';
      input.style.padding = '0.5rem';
      input.style.marginBottom = '0.5rem';
      input.style.borderRadius = '4px';
      input.style.background = 'var(--bg-dark)';
      input.style.border = '1px solid var(--border-color)';
      input.style.color = 'var(--text-primary)';

      const oldContent = taskContent.innerHTML;
      taskContent.innerHTML = '';
      taskContent.appendChild(input);
      input.focus();

      input.addEventListener('blur', finishEditing);
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          finishEditing();
        }
      });

      function finishEditing() {
        const newText = input.value.trim();
        if (newText) {
          const metaContent = oldContent.substring(oldContent.indexOf('<div class="task-meta"'));
          taskContent.innerHTML = newText + metaContent;
          saveTasks();
        } else {
          taskContent.innerHTML = oldContent;
        }
      }
    }

    function handleDragStart(e) {
      e.target.classList.add('dragging');
    }

    function handleDragEnd(e) {
      e.target.classList.remove('dragging');
      document.querySelectorAll('.task-list').forEach(column => {
        column.classList.remove('dropzone');
      });
    }

    function handleDragOver(e) {
      e.preventDefault();
      e.currentTarget.classList.add('dropzone');
    }

    function handleDragLeave(e) {
      e.currentTarget.classList.remove('dropzone');
    }

    function handleDrop(e) {
      e.preventDefault();
      const draggedItem = document.querySelector('.dragging');
      if (draggedItem) {
        e.currentTarget.appendChild(draggedItem);
        updateTaskCounts();
        saveTasks();
      }
      e.currentTarget.classList.remove('dropzone');
    }

    function updateTaskCounts() {
      document.getElementById('todo-count').textContent = 
        document.getElementById('todo-list').children.length;
      document.getElementById('progress-count').textContent = 
        document.getElementById('in-progress-list').children.length;
      document.getElementById('completed-count').textContent = 
        document.getElementById('completed-list').children.length;
    }

    function saveTasks() {
      const tasks = {
        todo: Array.from(document.getElementById('todo-list').children).map(task => ({
          text: task.querySelector('.task-content').childNodes[0].textContent.trim(),
          priority: task.querySelector('.priority').textContent,
          date: task.querySelector('.fa-clock').parentNode.textContent.trim()
        })),
        progress: Array.from(document.getElementById('in-progress-list').children).map(task => ({
          text: task.querySelector('.task-content').childNodes[0].textContent.trim(),
          priority: task.querySelector('.priority').textContent,
          date: task.querySelector('.fa-clock').parentNode.textContent.trim()
        })),
        completed: Array.from(document.getElementById('completed-list').children).map(task => ({
          text: task.querySelector('.task-content').childNodes[0].textContent.trim(),
          priority: task.querySelector('.priority').textContent,
          date: task.querySelector('.fa-clock').parentNode.textContent.trim()
        }))
      };
      localStorage.setItem('githubKanbanTasks', JSON.stringify(tasks));
    }

    function loadTasks() {
      const savedTasks = localStorage.getItem('githubKanbanTasks');
      if (savedTasks) {
        const tasks = JSON.parse(savedTasks);
        
        document.querySelectorAll('.task-list').forEach(list => list.innerHTML = '');
        
        tasks.todo.forEach(task => addTask(task.text, 'todo-list', true));
        tasks.progress.forEach(task => addTask(task.text, 'in-progress-list', true));
        tasks.completed.forEach(task => addTask(task.text, 'completed-list', true));
        
        updateTaskCounts();
      }
    }

    const searchTasks = (searchTerm) => {
      document.querySelectorAll('.task-item').forEach(task => {
        const taskText = task.querySelector('.task-content').textContent.toLowerCase();
        if (taskText.includes(searchTerm.toLowerCase())) {
          task.style.display = '';
          task.style.backgroundColor = searchTerm ? 'var(--accent-blue)' : '';
        } else {
          task.style.display = 'none';
        }
      });
    };

    // Add search input
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = 'Search tasks...';
    searchInput.className = 'search-input';
    searchInput.style.cssText = `
      width: 200px;
      padding: 0.5rem;
      background: var(--bg-dark);
      border: 1px solid var(--border-color);
      border-radius: 6px;
      color: var(--text-primary);
    `;
    document.querySelector('.header h1').insertAdjacentElement('afterend', searchInput);

    searchInput.addEventListener('input', (e) => searchTasks(e.target.value));

    // Add keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // Press '/' to focus search
      if (e.key === '/' && document.activeElement !== searchInput) {
        e.preventDefault();
        searchInput.focus();
      }
      // Press 'n' to focus new task input
      if (e.key === 'n' && document.activeElement !== todoInput) {
        e.preventDefault();
        todoInput.focus();
      }
    });

    // Add tooltip for keyboard shortcuts
    const tooltip = document.createElement('div');
    tooltip.innerHTML = `
      <div style="
        position: fixed;
        bottom: 1rem;
        right: 1rem;
        background: var(--bg-card);
        padding: 0.75rem;
        border-radius: 6px;
        border: 1px solid var(--border-color);
        font-size: 0.75rem;
        color: var(--text-secondary);
      ">
        <div><kbd>/</kbd> to search</div>
        <div><kbd>n</kbd> new task</div>
      </div>
    `;
    document.body.appendChild(tooltip);

    // Initialize task counts
    updateTaskCounts();
  });