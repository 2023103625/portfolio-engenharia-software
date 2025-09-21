// Global state
let isAdminMode = false;
let isEditMode = false;

// Admin credentials (In production, this should be handled server-side)
const ADMIN_CREDENTIALS = {
    username: 'ana.xavier',
    password: 'ES2025@UAC'
};

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    initializeEditableFields();
    loadSavedReflections();
    setupSmoothScrolling();
    updateProgress();
    initializeProjectFeatures();
    initializePhotoUpload();
    initializeAdminSystem();
    loadPublicReflections();
    
    // Check if admin mode was saved
    if (localStorage.getItem('adminMode') === 'true') {
        enableAdminMode();
    }
    
    // Highlight semana atual na tabela
    highlightCurrentWeek();
});

/* === ADMIN SYSTEM === */

function initializeAdminSystem() {
    // Close modals when clicking outside
    window.addEventListener('click', function(e) {
        const loginModal = document.getElementById('login-modal');
        const fileModal = document.getElementById('file-modal');
        
        if (e.target === loginModal) {
            closeLoginModal();
        }
        if (e.target === fileModal) {
            closeModal();
        }
    });

    // Keyboard shortcuts for admin
    document.addEventListener('keydown', function(e) {
        // Alt + A for admin access
        if (e.altKey && e.key === 'a' && !isAdminMode) {
            showLoginModal();
        }
        // Escape to exit admin mode
        if (e.key === 'Escape' && isAdminMode) {
            exitAdminMode();
        }
        // Ctrl + E to toggle edit mode (admin only)
        if (e.ctrlKey && e.key === 'e' && isAdminMode) {
            e.preventDefault();
            toggleEditMode();
        }
    });
}

function showLoginModal() {
    document.getElementById('login-modal').style.display = 'block';
    document.getElementById('username').focus();
}

function closeLoginModal() {
    document.getElementById('login-modal').style.display = 'none';
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
}

function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
        enableAdminMode();
        closeLoginModal();
        showNotification('Bem-vinda ao modo administrativo, Ana!');
    } else {
        showNotification('Credenciais inválidas. Tente novamente.', 'error');
        document.getElementById('password').value = '';
        document.getElementById('password').focus();
    }
    
    return false;
}

function enableAdminMode() {
    isAdminMode = true;
    document.body.classList.add('admin-mode');
    localStorage.setItem('adminMode', 'true');
    
    // Update admin access button
    const adminBtn = document.querySelector('.admin-access-btn');
    adminBtn.innerHTML = '🛡️ Admin Ativo';
    adminBtn.style.background = 'var(--success)';
}

function exitAdminMode() {
    isAdminMode = false;
    isEditMode = false;
    document.body.classList.remove('admin-mode', 'edit-mode');
    localStorage.removeItem('adminMode');
    
    // Reset admin access button
    const adminBtn = document.querySelector('.admin-access-btn');
    adminBtn.innerHTML = '🔑 Admin';
    adminBtn.style.background = 'var(--admin-color)';
    adminBtn.onclick = showLoginModal;
    
    // Disable all contenteditable
    disableAllEditing();
    
    showNotification('Saiu do modo administrativo');
}

function toggleEditMode() {
    if (!isAdminMode) return;
    
    isEditMode = !isEditMode;
    const editModeText = document.getElementById('edit-mode-text');
    
    if (isEditMode) {
        document.body.classList.add('edit-mode');
        editModeText.textContent = '🔒 Desativar Edição';
        enableAllEditing();
        showNotification('Modo de edição ativado');
    } else {
        document.body.classList.remove('edit-mode');
        editModeText.textContent = '📝 Ativar Edição';
        disableAllEditing();
        saveAllEdits();
        showNotification('Edições guardadas');
    }
}

function enableAllEditing() {
    const editableSections = document.querySelectorAll('.editable-section');
    editableSections.forEach(section => {
        section.contentEditable = true;
        section.addEventListener('input', handleSectionEdit);
    });
}

function disableAllEditing() {
    const editableSections = document.querySelectorAll('.editable-section');
    editableSections.forEach(section => {
        section.contentEditable = false;
        section.removeEventListener('input', handleSectionEdit);
    });
}

function handleSectionEdit(event) {
    const section = event.target;
    const sectionId = section.dataset.section;
    if (sectionId) {
        // Auto-save section content
        const content = section.innerHTML;
        localStorage.setItem(`section_${sectionId}`, content);
    }
}

function saveAllEdits() {
    const editableSections = document.querySelectorAll('.editable-section');
    const edits = {};
    
    editableSections.forEach(section => {
        const sectionId = section.dataset.section;
        if (sectionId) {
            edits[sectionId] = section.innerHTML;
        }
    });
    
    localStorage.setItem('sectionEdits', JSON.stringify(edits));
}

function loadSavedEdits() {
    const savedEdits = localStorage.getItem('sectionEdits');
    if (savedEdits) {
        const edits = JSON.parse(savedEdits);
        Object.keys(edits).forEach(sectionId => {
            const section = document.querySelector(`[data-section="${sectionId}"]`);
            if (section) {
                section.innerHTML = edits[sectionId];
            }
        });
    }
}

// Load saved edits on page load
setTimeout(loadSavedEdits, 100);

function exportData() {
    const data = {
        sectionEdits: JSON.parse(localStorage.getItem('sectionEdits') || '{}'),
        savedProjects: JSON.parse(localStorage.getItem('savedProjects') || '[]'),
        savedReflections: JSON.parse(localStorage.getItem('savedReflections') || '[]'),
        profilePhoto: localStorage.getItem('profilePhoto') || null,
        exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `portfolio-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    showNotification('Dados exportados com sucesso!');
}

function importData() {
    document.getElementById('data-import-input').click();
    
    document.getElementById('data-import-input').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                try {
                    const data = JSON.parse(event.target.result);
                    
                    if (confirm('Isto vai substituir todos os dados atuais. Tem a certeza?')) {
                        // Import all data
                        if (data.sectionEdits) {
                            localStorage.setItem('sectionEdits', JSON.stringify(data.sectionEdits));
                        }
                        if (data.savedProjects) {
                            localStorage.setItem('savedProjects', JSON.stringify(data.savedProjects));
                        }
                        if (data.savedReflections) {
                            localStorage.setItem('savedReflections', JSON.stringify(data.savedReflections));
                        }
                        if (data.profilePhoto) {
                            localStorage.setItem('profilePhoto', data.profilePhoto);
                        }
                        
                        // Reload page to apply changes
                        location.reload();
                    }
                } catch (error) {
                    showNotification('Erro ao importar dados. Ficheiro inválido.', 'error');
                }
            };
            reader.readAsText(file);
        }
    }, { once: true });
}

function clearAllData() {
    if (!confirm('ATENÇÃO: Isto vai eliminar todos os dados permanentemente. Tem a certeza?')) {
        return;
    }
    
    if (!confirm('Última confirmação. Todos os projetos, reflexões e edições serão perdidos. Continuar?')) {
        return;
    }
    
    // Clear all localStorage
    localStorage.removeItem('sectionEdits');
    localStorage.removeItem('savedProjects');
    localStorage.removeItem('savedReflections');
    localStorage.removeItem('profilePhoto');
    localStorage.removeItem('currentReflection');
    
    showNotification('Todos os dados foram eliminados');
    
    // Reload page
    setTimeout(() => location.reload(), 2000);
}

/* === PHOTO UPLOAD - Admin Only === */
function initializePhotoUpload() {
    const photoInput = document.getElementById('photo-input');
    const profileImg = document.getElementById('profile-img');
    const photoOverlay = document.getElementById('photo-overlay');

    // Load saved photo
    const savedPhoto = localStorage.getItem('profilePhoto');
    if (savedPhoto) {
        profileImg.src = savedPhoto;
    } else {
        // Use placeholder
        profileImg.style.background = 'linear-gradient(135deg, #2ea4b2, #32808d)';
        profileImg.style.display = 'flex';
        profileImg.style.alignItems = 'center';
        profileImg.style.justifyContent = 'center';
        profileImg.style.fontSize = '5rem';
        profileImg.style.color = 'white';
        profileImg.innerHTML = '👤';
        profileImg.alt = 'Clique para adicionar foto';
    }

    // Click handler for photo overlay (admin only)
    if (photoOverlay) {
        photoOverlay.addEventListener('click', function() {
            if (isAdminMode) {
                photoInput.click();
            }
        });
    }

    photoInput.addEventListener('change', function(e) {
        if (!isAdminMode) return;
        
        const file = e.target.files[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                showNotification('Por favor selecione apenas ficheiros de imagem.', 'error');
                return;
            }
            
            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                showNotification('A imagem deve ter menos de 5MB.', 'error');
                return;
            }
            
            const reader = new FileReader();
            reader.onload = function(e) {
                profileImg.src = e.target.result;
                profileImg.style.background = 'none';
                profileImg.innerHTML = '';
                
                // Save photo
                localStorage.setItem('profilePhoto', e.target.result);
                showNotification('Foto atualizada com sucesso!');
            };
            reader.readAsDataURL(file);
        }
    });
}

/* === PROJECT MANAGEMENT - Admin Only === */
function initializeProjectFeatures() {
    const uploadArea = document.getElementById('upload-area');
    const projectFiles = document.getElementById('project-files');
    const projectForm = document.getElementById('project-form');

    if (!uploadArea) return; // Element might not exist if not admin

    // Drag and drop functionality (admin only)
    uploadArea.addEventListener('dragover', function(e) {
        if (!isAdminMode) return;
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', function(e) {
        if (!isAdminMode) return;
        e.preventDefault();
        uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', function(e) {
        if (!isAdminMode) return;
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileSelection(files);
        }
    });

    projectFiles.addEventListener('change', function(e) {
        if (!isAdminMode) return;
        if (e.target.files.length > 0) {
            handleFileSelection(e.target.files);
        }
    });

    // Load projects
    loadSavedProjects();
}

function handleFileSelection(files) {
    if (!isAdminMode) {
        showNotification('Acesso negado. Apenas administradores podem adicionar projetos.', 'error');
        return;
    }
    
    const fileList = Array.from(files);
    const fileNames = fileList.map(f => f.name).join(', ');
    
    // Show form
    document.getElementById('project-form').style.display = 'block';
    
    // Suggest project name
    const projectName = document.getElementById('project-name');
    if (fileList.length === 1) {
        const name = fileList[0].name.split('.')[0];
        projectName.value = name.charAt(0).toUpperCase() + name.slice(1);
    }

    // Store files temporarily
    window.tempProjectFiles = fileList;
    
    showNotification(`${fileList.length} ficheiro(s) selecionado(s): ${fileNames}`);
}

function saveProject() {
    if (!isAdminMode) {
        showNotification('Acesso negado. Apenas administradores podem guardar projetos.', 'error');
        return;
    }
    
    const name = document.getElementById('project-name').value.trim();
    const description = document.getElementById('project-description').value.trim();
    const category = document.getElementById('project-category').value;
    const isPublic = document.getElementById('project-public').checked;
    
    if (!name) {
        alert('Por favor, insira o nome do projeto.');
        return;
    }

    if (!window.tempProjectFiles || window.tempProjectFiles.length === 0) {
        alert('Por favor, selecione pelo menos um ficheiro.');
        return;
    }

    // Create project object
    const project = {
        id: Date.now(),
        name: name,
        description: description,
        category: category || 'Outros',
        isPublic: isPublic,
        files: [],
        createdAt: new Date().toISOString()
    };

    // Process files
    const promises = Array.from(window.tempProjectFiles).map(file => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = function(e) {
                project.files.push({
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    data: e.target.result,
                    icon: getFileIcon(file.name)
                });
                resolve();
            };
            reader.readAsDataURL(file);
        });
    });

    Promise.all(promises).then(() => {
        // Save project
        let savedProjects = JSON.parse(localStorage.getItem('savedProjects') || '[]');
        savedProjects.push(project);
        localStorage.setItem('savedProjects', JSON.stringify(savedProjects));

        // Clear form
        document.getElementById('project-name').value = '';
        document.getElementById('project-description').value = '';
        document.getElementById('project-category').value = '';
        document.getElementById('project-public').checked = true;
        document.getElementById('project-form').style.display = 'none';
        
        // Clear temporary files
        window.tempProjectFiles = null;
        document.getElementById('project-files').value = '';

        // Reload projects list
        loadSavedProjects();
        
        showNotification('Projeto guardado com sucesso!');
    });
}

function cancelProject() {
    document.getElementById('project-form').style.display = 'none';
    document.getElementById('project-name').value = '';
    document.getElementById('project-description').value = '';
    document.getElementById('project-category').value = '';
    document.getElementById('project-public').checked = true;
    window.tempProjectFiles = null;
    document.getElementById('project-files').value = '';
}

function loadSavedProjects() {
    const savedProjects = JSON.parse(localStorage.getItem('savedProjects') || '[]');
    const container = document.getElementById('projects-grid');
    
    if (!container) return;
    
    if (savedProjects.length === 0) {
        container.innerHTML = `
            <div class="project-card">
                <div class="project-header">
                    <h4>Projeto Vending Machine</h4>
                    <span class="project-category">Programação</span>
                </div>
                <div class="project-description">
                    Sistema de venda automática desenvolvido em Java utilizando princípios de POO.
                </div>
                <div class="project-files">
                    <div class="file-item">
                        <span class="file-icon">📄</span>
                        <span class="file-name">VendingMachine.java</span>
                        <button class="file-action" onclick="viewFile('exemplo')">Ver</button>
                    </div>
                    <div class="file-item">
                        <span class="file-icon">📊</span>
                        <span class="file-name">Documentação.pdf</span>
                        <button class="file-action" onclick="viewFile('exemplo')">Ver</button>
                    </div>
                </div>
                <div class="project-actions admin-only">
                    <button class="btn btn-secondary btn-small" onclick="editProject('exemplo')">Editar</button>
                    <button class="btn btn-secondary btn-small" onclick="deleteProject('exemplo')">Eliminar</button>
                </div>
            </div>
        `;
        return;
    }

    let html = '';

    savedProjects.forEach(project => {
        const createdDate = new Date(project.createdAt).toLocaleDateString('pt-PT');
        const publicBadge = project.isPublic ? 
            '<span style="background: var(--success); color: white; padding: 0.25rem 0.5rem; border-radius: 10px; font-size: 0.7rem; margin-left: 0.5rem;">Público</span>' : 
            '<span style="background: var(--warning); color: white; padding: 0.25rem 0.5rem; border-radius: 10px; font-size: 0.7rem; margin-left: 0.5rem;">Privado</span>';
        
        html += `
            <div class="project-card">
                <div class="project-header">
                    <h4>${project.name} ${publicBadge}</h4>
                    <span class="project-category">${project.category}</span>
                </div>
                <div class="project-description">
                    ${project.description || 'Sem descrição'}
                    <div style="font-size: 0.8rem; color: var(--text-light); margin-top: 0.5rem;">
                        Criado em: ${createdDate}
                    </div>
                </div>
                <div class="project-files">
                    ${project.files.map(file => `
                        <div class="file-item">
                            <span class="file-icon">${file.icon}</span>
                            <span class="file-name">${file.name}</span>
                            <button class="file-action" onclick="viewFile('${project.id}', '${file.name}')">Ver</button>
                            ${project.isPublic ? `<button class="file-action" onclick="downloadFile('${project.id}', '${file.name}')" style="background: var(--success);">Download</button>` : ''}
                        </div>
                    `).join('')}
                </div>
                <div class="project-actions admin-only">
                    <button class="btn btn-secondary btn-small" onclick="editProject(${project.id})">Editar</button>
                    <button class="btn btn-secondary btn-small" onclick="deleteProject(${project.id})">Eliminar</button>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

function getFileIcon(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    const iconMap = {
        'pdf': '📄',
        'doc': '📄', 'docx': '📄',
        'txt': '📄',
        'jpg': '🖼️', 'jpeg': '🖼️', 'png': '🖼️', 'gif': '🖼️',
        'mp4': '🎥', 'avi': '🎥', 'mov': '🎥',
        'zip': '📦', 'rar': '📦',
        'java': '☕', 'js': '📜', 'html': '🌐', 'css': '🎨',
        'pptx': '📊', 'ppt': '📊'
    };
    return iconMap[ext] || '📁';
}

function viewFile(projectId, fileName) {
    if (projectId === 'exemplo') {
        alert('Este é um projeto de exemplo. Os ficheiros não estão disponíveis.');
        return;
    }

    const savedProjects = JSON.parse(localStorage.getItem('savedProjects') || '[]');
    const project = savedProjects.find(p => p.id == projectId);
    
    if (!project) {
        alert('Projeto não encontrado.');
        return;
    }

    const file = project.files.find(f => f.name === fileName);
    if (!file) {
        alert('Ficheiro não encontrado.');
        return;
    }

    // Open modal
    const modal = document.getElementById('file-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');

    modalTitle.textContent = `${fileName} - ${project.name}`;

    if (file.type.startsWith('image/')) {
        modalBody.innerHTML = `<img src="${file.data}" style="max-width: 100%; height: auto;">`;
    } else if (file.type === 'application/pdf') {
        modalBody.innerHTML = `<embed src="${file.data}" type="application/pdf" width="100%" height="500px">`;
    } else if (file.type.startsWith('text/')) {
        try {
            const textContent = atob(file.data.split(',')[1]);
            modalBody.innerHTML = `<pre style="white-space: pre-wrap; font-family: monospace; max-height: 400px; overflow-y: auto;">${textContent}</pre>`;
        } catch (e) {
            modalBody.innerHTML = getFileInfoHTML(file, project);
        }
    } else {
        modalBody.innerHTML = getFileInfoHTML(file, project);
    }

    modal.style.display = 'block';
}

function getFileInfoHTML(file, project) {
    const downloadButton = project.isPublic ? 
        `<button class="btn btn-primary" onclick="downloadFile('${project.id}', '${file.name}')">Descarregar</button>` : 
        '<p style="color: var(--warning);">Ficheiro privado - download não disponível</p>';
        
    return `
        <div style="text-align: center; padding: 2rem;">
            <p>Visualização não disponível para este tipo de ficheiro.</p>
            <p><strong>Nome:</strong> ${file.name}</p>
            <p><strong>Tamanho:</strong> ${formatFileSize(file.size)}</p>
            <p><strong>Tipo:</strong> ${file.type || 'Desconhecido'}</p>
            <p><strong>Visibilidade:</strong> ${project.isPublic ? 'Público' : 'Privado'}</p>
            <div style="margin-top: 1rem;">
                ${downloadButton}
            </div>
        </div>
    `;
}

function downloadFile(projectId, fileName) {
    const savedProjects = JSON.parse(localStorage.getItem('savedProjects') || '[]');
    const project = savedProjects.find(p => p.id == projectId);
    
    if (!project) {
        alert('Projeto não encontrado.');
        return;
    }
    
    if (!project.isPublic && !isAdminMode) {
        showNotification('Este ficheiro é privado e não está disponível para download.', 'error');
        return;
    }
    
    const file = project.files.find(f => f.name === fileName);
    if (!file) {
        alert('Ficheiro não encontrado.');
        return;
    }
    
    const link = document.createElement('a');
    link.href = file.data;
    link.download = file.name;
    link.click();
}

function editProject(projectId) {
    if (!isAdminMode) {
        showNotification('Acesso negado. Apenas administradores podem editar projetos.', 'error');
        return;
    }
    
    if (projectId === 'exemplo') {
        alert('Não é possível editar o projeto de exemplo.');
        return;
    }

    const savedProjects = JSON.parse(localStorage.getItem('savedProjects') || '[]');
    const project = savedProjects.find(p => p.id == projectId);
    
    if (project) {
        document.getElementById('project-name').value = project.name;
        document.getElementById('project-description').value = project.description || '';
        document.getElementById('project-category').value = project.category;
        document.getElementById('project-public').checked = project.isPublic !== false;
        document.getElementById('project-form').style.display = 'block';
        
        // Mark as editing
        window.editingProjectId = projectId;
        
        // Scroll to form
        document.getElementById('project-form').scrollIntoView({ behavior: 'smooth' });
    }
}

function deleteProject(projectId) {
    if (!isAdminMode) {
        showNotification('Acesso negado. Apenas administradores podem eliminar projetos.', 'error');
        return;
    }
    
    if (projectId === 'exemplo') {
        alert('Não é possível eliminar o projeto de exemplo.');
        return;
    }

    if (confirm('Tem a certeza que deseja eliminar este projeto? Esta ação não pode ser desfeita.')) {
        let savedProjects = JSON.parse(localStorage.getItem('savedProjects') || '[]');
        savedProjects = savedProjects.filter(p => p.id != projectId);
        localStorage.setItem('savedProjects', JSON.stringify(savedProjects));
        loadSavedProjects();
        showNotification('Projeto eliminado com sucesso!');
    }
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function closeModal() {
    document.getElementById('file-modal').style.display = 'none';
}

/* === PUBLIC REFLECTIONS === */
function loadPublicReflections() {
    const savedReflections = JSON.parse(localStorage.getItem('savedReflections') || '[]');
    const container = document.getElementById('public-reflections');
    
    if (!container) return;
    
    if (savedReflections.length === 0) {
        container.innerHTML = '<p style="color: var(--text-light); text-align: center; padding: 2rem;">Nenhuma reflexão publicada ainda.</p>';
        return;
    }

    let html = '';
    
    // Show only published reflections (last 3)
    const publicReflections = savedReflections.slice(-3).reverse();
    
    publicReflections.forEach(reflection => {
        const savedDate = new Date(reflection.savedAt).toLocaleDateString('pt-PT');
        html += `
            <div class="weekly-entry">
                <h5>${reflection.title}</h5>
                <div class="reflection-content" style="font-size: 0.95rem; line-height: 1.6;">
                    ${formatReflectionContent(reflection.data)}
                </div>
                <div style="margin-top: 1rem; font-size: 0.8rem; color: var(--text-light); text-align: right;">
                    <em>Publicado em: ${savedDate}</em>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

/* === REFLECTION SYSTEM (Admin Only for editing) === */

function initializeEditableFields() {
    const editableFields = document.querySelectorAll('.editable-field');
    
    editableFields.forEach(field => {
        // Placeholder functionality
        if (field.textContent.trim() === '') {
            field.classList.add('placeholder');
            field.textContent = field.dataset.placeholder || 'Clique para editar...';
        }

        field.addEventListener('focus', function() {
            if (!isAdminMode) {
                this.blur();
                showNotification('Apenas administradores podem editar reflexões.', 'error');
                return;
            }
            
            if (this.classList.contains('placeholder')) {
                this.textContent = '';
                this.classList.remove('placeholder');
            }
        });

        field.addEventListener('blur', function() {
            if (this.textContent.trim() === '') {
                this.classList.add('placeholder');
                this.textContent = this.dataset.placeholder || 'Clique para editar...';
            }
        });

        field.addEventListener('input', function() {
            if (isAdminMode) {
                autoSave();
            }
        });
    });
}

let autoSaveTimer;
function autoSave() {
    if (!isAdminMode) return;
    
    clearTimeout(autoSaveTimer);
    autoSaveTimer = setTimeout(() => {
        const templateData = gatherTemplateData();
        localStorage.setItem('currentReflection', JSON.stringify(templateData));
    }, 2000);
}

function gatherTemplateData() {
    const fields = document.querySelectorAll('.editable-field');
    const data = {};
    
    fields.forEach((field, index) => {
        const content = field.classList.contains('placeholder') ? '' : field.textContent.trim();
        data[`field_${index}`] = content;
    });
    
    data.timestamp = new Date().toISOString();
    return data;
}

function saveReflection() {
    if (!isAdminMode) {
        showNotification('Apenas administradores podem guardar reflexões.', 'error');
        return;
    }
    
    const templateData = gatherTemplateData();
    const weekTitle = document.querySelector('.template-title .editable-field').textContent.trim();
    
    if (!weekTitle || weekTitle.includes('Clique para editar')) {
        alert('Por favor, preencha pelo menos o título da semana antes de guardar.');
        return;
    }

    let savedReflections = JSON.parse(localStorage.getItem('savedReflections') || '[]');
    
    const existingIndex = savedReflections.findIndex(r => r.title === weekTitle);
    
    const reflectionData = {
        id: existingIndex >= 0 ? savedReflections[existingIndex].id : Date.now(),
        title: weekTitle,
        data: templateData,
        savedAt: new Date().toISOString()
    };

    if (existingIndex >= 0) {
        savedReflections[existingIndex] = reflectionData;
    } else {
        savedReflections.push(reflectionData);
    }

    localStorage.setItem('savedReflections', JSON.stringify(savedReflections));
    
    showNotification('Reflexão guardada com sucesso!');
    
    loadSavedReflections();
    loadPublicReflections(); // Update public view
    updateLastUpdate();
}

function loadSavedReflections() {
    const savedReflections = JSON.parse(localStorage.getItem('savedReflections') || '[]');
    const container = document.getElementById('weekly-entries');
    
    if (!container) return; // Element might not exist if not admin
    
    if (savedReflections.length === 0) {
        container.innerHTML = '<h3 class="section-subtitle">Reflexões Guardadas</h3><p style="color: var(--text-light); text-align: center; padding: 2rem;">Nenhuma reflexão guardada ainda. Use o template acima para criar a sua primeira reflexão.</p>';
        return;
    }

    let html = '<h3 class="section-subtitle">Reflexões Guardadas</h3>';
    
    savedReflections.reverse().forEach(reflection => {
        const savedDate = new Date(reflection.savedAt).toLocaleDateString('pt-PT');
        html += `
            <div class="weekly-entry">
                <h5>${reflection.title} <span style="font-weight: normal; color: var(--text-light); font-size: 0.9rem;">(guardado em ${savedDate})</span></h5>
                <div class="reflection-content" style="font-size: 0.95rem; line-height: 1.6;">
                    ${formatReflectionContent(reflection.data)}
                </div>
                <div style="margin-top: 1rem; text-align: right;">
                    <button class="btn btn-secondary" onclick="editReflection(${reflection.id})" style="font-size: 0.8rem;">Editar</button>
                    <button class="btn btn-secondary" onclick="deleteReflection(${reflection.id})" style="font-size: 0.8rem; background: var(--edit-border); color: white;">Eliminar</button>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

function formatReflectionContent(data) {
    const labels = [
        'Semana/Data',
        'Recursos Consultados',
        'Tipo de Aula',
        'Conceitos-Chave Aprendidos',
        'Reflexão Crítica',
        'Atividades Práticas Realizadas',
        'Ligações Interdisciplinares',
        'Preparação para Avaliação',
        'Objetivos para Próxima Semana',
        'Recursos Úteis Descobertos'
    ];

    let html = '';
    Object.keys(data).forEach((key, index) => {
        if (key !== 'timestamp' && data[key] && !data[key].includes('Clique para editar')) {
            html += `<p><strong>${labels[index] || 'Campo ' + (index + 1)}:</strong><br>${data[key].replace(/\n/g, '<br>')}</p>`;
        }
    });

    return html;
}

function editReflection(id) {
    if (!isAdminMode) {
        showNotification('Apenas administradores podem editar reflexões.', 'error');
        return;
    }
    
    const savedReflections = JSON.parse(localStorage.getItem('savedReflections') || '[]');
    const reflection = savedReflections.find(r => r.id === id);
    
    if (reflection) {
        const fields = document.querySelectorAll('.editable-field');
        Object.keys(reflection.data).forEach((key, index) => {
            if (fields[index] && reflection.data[key]) {
                fields[index].textContent = reflection.data[key];
                fields[index].classList.remove('placeholder');
            }
        });

        document.getElementById('template-box').scrollIntoView({ behavior: 'smooth' });
    }
}

function deleteReflection(id) {
    if (!isAdminMode) {
        showNotification('Apenas administradores podem eliminar reflexões.', 'error');
        return;
    }
    
    if (confirm('Tem a certeza que deseja eliminar esta reflexão?')) {
        let savedReflections = JSON.parse(localStorage.getItem('savedReflections') || '[]');
        savedReflections = savedReflections.filter(r => r.id !== id);
        localStorage.setItem('savedReflections', JSON.stringify(savedReflections));
        loadSavedReflections();
        loadPublicReflections(); // Update public view
        showNotification('Reflexão eliminada com sucesso!');
    }
}

function resetTemplate() {
    if (!isAdminMode) {
        showNotification('Apenas administradores podem repor o template.', 'error');
        return;
    }
    
    if (confirm('Tem a certeza que deseja limpar todos os campos?')) {
        const fields = document.querySelectorAll('.editable-field');
        fields.forEach(field => {
            field.textContent = field.dataset.placeholder || 'Clique para editar...';
            field.classList.add('placeholder');
        });
        localStorage.removeItem('currentReflection');
        showNotification('Template reposto!');
    }
}

function addWeeklyEntry() {
    if (!isAdminMode) {
        showNotification('Apenas administradores podem criar novas entradas.', 'error');
        return;
    }
    
    const hasContent = Array.from(document.querySelectorAll('.editable-field'))
        .some(field => !field.classList.contains('placeholder') && field.textContent.trim());
    
    if (hasContent) {
        const shouldSave = confirm('Deseja guardar a reflexão atual antes de criar uma nova?');
        if (shouldSave) {
            saveReflection();
        }
    }

    resetTemplate();
    
    const currentWeek = getCurrentWeekNumber();
    const nextWeek = currentWeek + 1;
    const nextDate = getNextWeekDate(currentWeek);
    
    const titleField = document.querySelector('.template-title .editable-field');
    titleField.textContent = `Semana ${nextWeek} - ${nextDate} - [Tema a definir]`;
    titleField.classList.remove('placeholder');
    
    document.getElementById('template-box').scrollIntoView({ behavior: 'smooth' });
}

/* === UTILITY FUNCTIONS === */

function getCurrentWeekNumber() {
    const startDate = new Date('2025-09-09');
    const today = new Date();
    const diffTime = Math.abs(today - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.ceil(diffDays / 7);
}

function getNextWeekDate(currentWeek) {
    const startDate = new Date('2025-09-09');
    const nextWeekDate = new Date(startDate);
    nextWeekDate.setDate(startDate.getDate() + (currentWeek * 7));
    return nextWeekDate.toLocaleDateString('pt-PT');
}

function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    
    // Set color based on type
    if (type === 'error') {
        notification.style.background = 'var(--edit-border)';
    } else {
        notification.style.background = 'var(--success)';
    }
    
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

function updateLastUpdate() {
    const element = document.getElementById('last-update');
    if (element) {
        element.textContent = new Date().toLocaleDateString('pt-PT');
    }
}

function highlightCurrentWeek() {
    const currentWeekRow = document.querySelector('.current-week');
    if (currentWeekRow) {
        currentWeekRow.style.background = 'rgba(46, 164, 178, 0.1)';
        currentWeekRow.style.borderLeft = '4px solid var(--accent-color)';
    }
}

function updateProgress() {
    const currentWeek = getCurrentWeekNumber();
    const totalWeeks = 15;
    const progress = Math.min((currentWeek / totalWeeks) * 100, 100);
    
    const weekElement = document.getElementById('current-week');
    const progressElement = document.getElementById('progress-fill');
    
    if (weekElement) weekElement.textContent = `${currentWeek} de ${totalWeeks}`;
    if (progressElement) progressElement.style.width = `${progress}%`;
}

function setupSmoothScrolling() {
    const links = document.querySelectorAll('a[href^="#"]');
    
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

function loadAutoSavedData() {
    if (!isAdminMode) return;
    
    const autoSaved = localStorage.getItem('currentReflection');
    if (autoSaved) {
        const data = JSON.parse(autoSaved);
        const fields = document.querySelectorAll('.editable-field');
        
        Object.keys(data).forEach((key, index) => {
            if (fields[index] && data[key] && !key.includes('timestamp')) {
                fields[index].textContent = data[key];
                if (data[key] !== '') {
                    fields[index].classList.remove('placeholder');
                }
            }
        });
    }
}

// Load auto-saved data after admin mode is enabled
setTimeout(() => {
    if (isAdminMode) loadAutoSavedData();
}, 500);
