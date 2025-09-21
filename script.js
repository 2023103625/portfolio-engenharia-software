// Funcionalidade de edição e gestão das reflexões
document.addEventListener('DOMContentLoaded', function() {
    initializeEditableFields();
    loadSavedReflections();
    setupSmoothScrolling();
    updateProgress();
    initializeProjectFeatures();
    initializePhotoUpload();
    
    // Highlight semana atual na tabela
    highlightCurrentWeek();
});

/* === FUNCIONALIDADES DE FOTO DE PERFIL === */
function initializePhotoUpload() {
    const photoInput = document.getElementById('photo-input');
    const profileImg = document.getElementById('profile-img');

    // Carregar foto salva
    const savedPhoto = localStorage.getItem('profilePhoto');
    if (savedPhoto) {
        profileImg.src = savedPhoto;
    } else {
        // Usar placeholder personalizado
        profileImg.style.background = 'linear-gradient(135deg, #2ea4b2, #32808d)';
        profileImg.style.display = 'flex';
        profileImg.style.alignItems = 'center';
        profileImg.style.justifyContent = 'center';
        profileImg.style.fontSize = '4rem';
        profileImg.style.color = 'white';
        profileImg.innerHTML = '👤';
        profileImg.alt = 'Clique para adicionar foto';
    }

    photoInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                profileImg.src = e.target.result;
                profileImg.style.background = 'none';
                profileImg.innerHTML = '';
                
                // Salvar foto no localStorage
                localStorage.setItem('profilePhoto', e.target.result);
                showNotification('Foto atualizada com sucesso!');
            };
            reader.readAsDataURL(file);
        }
    });
}

/* === FUNCIONALIDADES DE PROJETOS === */
function initializeProjectFeatures() {
    const uploadArea = document.getElementById('upload-area');
    const projectFiles = document.getElementById('project-files');
    const projectForm = document.getElementById('project-form');

    // Drag and drop functionality
    uploadArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', function(e) {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', function(e) {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileSelection(files);
        }
    });

    projectFiles.addEventListener('change', function(e) {
        if (e.target.files.length > 0) {
            handleFileSelection(e.target.files);
        }
    });

    // Carregar projetos salvos
    loadSavedProjects();
}

function handleFileSelection(files) {
    const fileList = Array.from(files);
    const fileNames = fileList.map(f => f.name).join(', ');
    
    // Mostrar formulário
    document.getElementById('project-form').style.display = 'block';
    
    // Sugerir nome do projeto baseado nos arquivos
    const projectName = document.getElementById('project-name');
    if (fileList.length === 1) {
        const name = fileList[0].name.split('.')[0];
        projectName.value = name.charAt(0).toUpperCase() + name.slice(1);
    }

    // Armazenar arquivos temporariamente
    window.tempProjectFiles = fileList;
    
    showNotification(`${fileList.length} ficheiro(s) selecionado(s): ${fileNames}`);
}

function saveProject() {
    const name = document.getElementById('project-name').value.trim();
    const description = document.getElementById('project-description').value.trim();
    const category = document.getElementById('project-category').value;
    
    if (!name) {
        alert('Por favor, insira o nome do projeto.');
        return;
    }

    if (!window.tempProjectFiles || window.tempProjectFiles.length === 0) {
        alert('Por favor, selecione pelo menos um ficheiro.');
        return;
    }

    // Criar objeto do projeto
    const project = {
        id: Date.now(),
        name: name,
        description: description,
        category: category || 'Outros',
        files: [],
        createdAt: new Date().toISOString()
    };

    // Processar arquivos
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
        // Salvar projeto
        let savedProjects = JSON.parse(localStorage.getItem('savedProjects') || '[]');
        savedProjects.push(project);
        localStorage.setItem('savedProjects', JSON.stringify(savedProjects));

        // Limpar formulário
        document.getElementById('project-name').value = '';
        document.getElementById('project-description').value = '';
        document.getElementById('project-category').value = '';
        document.getElementById('project-form').style.display = 'none';
        
        // Limpar arquivos temporários
        window.tempProjectFiles = null;
        document.getElementById('project-files').value = '';

        // Recarregar lista de projetos
        loadSavedProjects();
        
        showNotification('Projeto guardado com sucesso!');
    });
}

function cancelProject() {
    document.getElementById('project-form').style.display = 'none';
    document.getElementById('project-name').value = '';
    document.getElementById('project-description').value = '';
    document.getElementById('project-category').value = '';
    window.tempProjectFiles = null;
    document.getElementById('project-files').value = '';
}

function loadSavedProjects() {
    const savedProjects = JSON.parse(localStorage.getItem('savedProjects') || '[]');
    const container = document.getElementById('projects-grid');
    
    if (savedProjects.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 2rem; color: var(--text-light);">
                <p>Nenhum projeto adicionado ainda.</p>
                <p>Use a área de upload acima para adicionar os seus projetos.</p>
            </div>
        `;
        return;
    }

    let html = '';
    
    // Manter o projeto de exemplo se não houver projetos salvos
    if (savedProjects.length === 0) {
        html += `
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
                <div class="project-actions">
                    <button class="btn btn-secondary btn-small" onclick="editProject('exemplo')">Editar</button>
                    <button class="btn btn-secondary btn-small" onclick="deleteProject('exemplo')">Eliminar</button>
                </div>
            </div>
        `;
    }

    savedProjects.forEach(project => {
        const createdDate = new Date(project.createdAt).toLocaleDateString('pt-PT');
        html += `
            <div class="project-card">
                <div class="project-header">
                    <h4>${project.name}</h4>
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
                        </div>
                    `).join('')}
                </div>
                <div class="project-actions">
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

    // Abrir modal para visualização
    const modal = document.getElementById('file-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');

    modalTitle.textContent = `${fileName} - ${project.name}`;

    if (file.type.startsWith('image/')) {
        modalBody.innerHTML = `<img src="${file.data}" style="max-width: 100%; height: auto;">`;
    } else if (file.type === 'application/pdf') {
        modalBody.innerHTML = `<embed src="${file.data}" type="application/pdf" width="100%" height="500px">`;
    } else if (file.type.startsWith('text/')) {
        // Para ficheiros de texto, tentar mostrar conteúdo
        modalBody.innerHTML = `<pre style="white-space: pre-wrap; font-family: monospace;">${atob(file.data.split(',')[1])}</pre>`;
    } else {
        modalBody.innerHTML = `
            <div style="text-align: center; padding: 2rem;">
                <p>Visualização não disponível para este tipo de ficheiro.</p>
                <p><strong>Nome:</strong> ${file.name}</p>
                <p><strong>Tamanho:</strong> ${formatFileSize(file.size)}</p>
                <p><strong>Tipo:</strong> ${file.type || 'Desconhecido'}</p>
                <button class="btn btn-primary" onclick="downloadFile('${projectId}', '${fileName}')">Descarregar</button>
            </div>
        `;
    }

    modal.style.display = 'block';
}

function closeModal() {
    document.getElementById('file-modal').style.display = 'none';
}

function downloadFile(projectId, fileName) {
    const savedProjects = JSON.parse(localStorage.getItem('savedProjects') || '[]');
    const project = savedProjects.find(p => p.id == projectId);
    const file = project.files.find(f => f.name === fileName);
    
    const link = document.createElement('a');
    link.href = file.data;
    link.download = file.name;
    link.click();
}

function editProject(projectId) {
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
        document.getElementById('project-form').style.display = 'block';
        
        // Marcar como edição
        window.editingProjectId = projectId;
        
        // Scroll para o formulário
        document.getElementById('project-form').scrollIntoView({ behavior: 'smooth' });
    }
}

function deleteProject(projectId) {
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

/* === FUNCIONALIDADES DE REFLEXÃO === */

// Inicializar campos editáveis
function initializeEditableFields() {
    const editableFields = document.querySelectorAll('.editable-field');
    
    editableFields.forEach(field => {
        // Placeholder functionality
        if (field.textContent.trim() === '') {
            field.classList.add('placeholder');
            field.textContent = field.dataset.placeholder || 'Clique para editar...';
        }

        field.addEventListener('focus', function() {
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

        // Auto-save on content change
        field.addEventListener('input', function() {
            autoSave();
        });
    });
}

// Auto-save functionality
let autoSaveTimer;
function autoSave() {
    clearTimeout(autoSaveTimer);
    autoSaveTimer = setTimeout(() => {
        const templateData = gatherTemplateData();
        localStorage.setItem('currentReflection', JSON.stringify(templateData));
    }, 2000);
}

// Recolher dados do template
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

// Guardar reflexão
function saveReflection() {
    const templateData = gatherTemplateData();
    const weekTitle = document.querySelector('.template-title .editable-field').textContent.trim();
    
    if (!weekTitle || weekTitle.includes('Clique para editar')) {
        alert('Por favor, preencha pelo menos o título da semana antes de guardar.');
        return;
    }

    // Guardar no localStorage
    let savedReflections = JSON.parse(localStorage.getItem('savedReflections') || '[]');
    
    // Verificar se já existe uma reflexão para esta semana
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
    
    // Mostrar notificação
    showNotification('Reflexão guardada com sucesso!');
    
    // Recarregar as reflexões guardadas
    loadSavedReflections();
    
    // Atualizar data de última atualização
    updateLastUpdate();
}

// Carregar reflexões guardadas
function loadSavedReflections() {
    const savedReflections = JSON.parse(localStorage.getItem('savedReflections') || '[]');
    const container = document.getElementById('weekly-entries');
    
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

// Formatar conteúdo da reflexão para exibição
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

// Editar reflexão existente
function editReflection(id) {
    const savedReflections = JSON.parse(localStorage.getItem('savedReflections') || '[]');
    const reflection = savedReflections.find(r => r.id === id);
    
    if (reflection) {
        // Carregar dados no template
        const fields = document.querySelectorAll('.editable-field');
        Object.keys(reflection.data).forEach((key, index) => {
            if (fields[index] && reflection.data[key]) {
                fields[index].textContent = reflection.data[key];
                fields[index].classList.remove('placeholder');
            }
        });

        // Scroll para o template
        document.getElementById('template-box').scrollIntoView({ behavior: 'smooth' });
    }
}

// Eliminar reflexão
function deleteReflection(id) {
    if (confirm('Tem a certeza que deseja eliminar esta reflexão?')) {
        let savedReflections = JSON.parse(localStorage.getItem('savedReflections') || '[]');
        savedReflections = savedReflections.filter(r => r.id !== id);
        localStorage.setItem('savedReflections', JSON.stringify(savedReflections));
        loadSavedReflections();
        showNotification('Reflexão eliminada com sucesso!');
    }
}

// Repor template
function resetTemplate() {
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

// Adicionar nova entrada semanal
function addWeeklyEntry() {
    // Primeiro, guardar a reflexão atual se tiver conteúdo
    const hasContent = Array.from(document.querySelectorAll('.editable-field'))
        .some(field => !field.classList.contains('placeholder') && field.textContent.trim());
    
    if (hasContent) {
        const shouldSave = confirm('Deseja guardar a reflexão atual antes de criar uma nova?');
        if (shouldSave) {
            saveReflection();
        }
    }

    // Limpar template para nova entrada
    resetTemplate();
    
    // Auto-incrementar semana
    const currentWeek = getCurrentWeekNumber();
    const nextWeek = currentWeek + 1;
    const nextDate = getNextWeekDate(currentWeek);
    
    const titleField = document.querySelector('.template-title .editable-field');
    titleField.textContent = `Semana ${nextWeek} - ${nextDate} - [Tema a definir]`;
    titleField.classList.remove('placeholder');
    
    // Scroll para o template
    document.getElementById('template-box').scrollIntoView({ behavior: 'smooth' });
}

/* === FUNÇÕES AUXILIARES === */

// Auxiliares para gestão de semanas
function getCurrentWeekNumber() {
    const startDate = new Date('2025-09-09'); // Início do semestre
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

// Mostrar notificação
function showNotification(message) {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Atualizar última atualização
function updateLastUpdate() {
    document.getElementById('last-update').textContent = new Date().toLocaleDateString('pt-PT');
}

// Destacar semana atual
function highlightCurrentWeek() {
    const currentWeekRow = document.querySelector('.current-week');
    if (currentWeekRow) {
        currentWeekRow.style.background = 'rgba(46, 164, 178, 0.1)';
        currentWeekRow.style.borderLeft = '4px solid var(--accent-color)';
    }
}

// Atualizar progresso
function updateProgress() {
    const currentWeek = getCurrentWeekNumber();
    const totalWeeks = 15;
    const progress = Math.min((currentWeek / totalWeeks) * 100, 100);
    
    document.getElementById('current-week').textContent = `${currentWeek} de ${totalWeeks}`;
    document.getElementById('progress-fill').style.width = `${progress}%`;
}

// Smooth scrolling
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

// Carregar dados salvos automaticamente na inicialização
function loadAutoSavedData() {
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

// Fechar modal ao clicar fora
window.addEventListener('click', function(e) {
    const modal = document.getElementById('file-modal');
    if (e.target === modal) {
        closeModal();
    }
});

// Chamada inicial para carregar dados auto-salvos
setTimeout(loadAutoSavedData, 100);
