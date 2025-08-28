// Configuração
const N8N_WEBHOOK_URL = 'https://settled-saving-dog.ngrok-free.app/webhook/hubspot-assistant';

// Função principal para enviar pergunta
async function sendQuestion() {
    const input = document.getElementById('queryInput');
    const chatContainer = document.getElementById('chatContainer');
    const sendButton = document.getElementById('sendButton');
    const typingIndicator = document.getElementById('typingIndicator');
    
    const question = input.value.trim();
    
    if (!question) {
        input.focus();
        return;
    }
    
    // Adicionar mensagem do usuário ao chat
    addMessage(question, 'user');
    
    // Limpar input e desabilitar controles
    input.value = '';
    sendButton.disabled = true;
    input.disabled = true;
    
    // Mostrar indicador de digitação
    typingIndicator.classList.add('show');
    
    try {
        // Fazer requisição para o webhook N8N
        const response = await fetch(N8N_WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'ngrok-skip-browser-warning': 'true'
            },
            body: JSON.stringify({
                question: question,
                timestamp: new Date().toISOString(),
                source: 'hubspot-assistant-web'
            })
        });
        
        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status} - ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Esconder indicador de digitação
        typingIndicator.classList.remove('show');
        
        // Adicionar resposta do assistente
        const botResponse = data.response || data.message || data.answer || 'Desculpe, não consegui processar sua pergunta.';
        addMessage(botResponse, 'bot');
        
        // Se houver metadados, adicionar
        if (data.metadata) {
            addMetadata(data.metadata);
        }
        
    } catch (error) {
        console.error('Erro ao comunicar com N8N:', error);
        
        // Esconder indicador de digitação
        typingIndicator.classList.remove('show');
        
        // Mostrar mensagem de erro amigável
        let errorMessage = 'Desculpe, ocorreu um erro ao processar sua pergunta.';
        
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            errorMessage = 'Não foi possível conectar ao servidor. Verifique sua conexão.';
        } else if (error.message.includes('CORS')) {
            errorMessage = 'Erro de configuração. Por favor, contate o administrador.';
        }
        
        addMessage(errorMessage, 'bot', 'error');
        
    } finally {
        // Reabilitar controles
        sendButton.disabled = false;
        input.disabled = false;
        input.focus();
    }
}

// Função para adicionar mensagem ao chat
function addMessage(text, sender, type = 'normal') {
    const chatContainer = document.getElementById('chatContainer');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;
    
    // Avatar
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    
    if (sender === 'bot') {
        avatar.style.background = type === 'error' ? '#f56565' : '#4299e1';
        avatar.textContent = '🤖';
    } else {
        avatar.style.background = '#9f7aea';
        avatar.textContent = '👤';
    }
    
    // Conteúdo da mensagem
    const content = document.createElement('div');
    content.className = 'message-content';
    
    if (type === 'error') {
        content.style.background = '#fed7e2';
        content.style.color = '#9b2c2c';
        content.style.borderLeft = '4px solid #f56565';
    }
    
    // Suporte básico a markdown/formatação
    const formattedText = formatMessage(text);
    content.innerHTML = formattedText;
    
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(content);
    
    chatContainer.appendChild(messageDiv);
    
    // Auto-scroll para a última mensagem
    chatContainer.scrollTop = chatContainer.scrollHeight;
    
    // Animação suave
    messageDiv.style.opacity = '0';
    messageDiv.style.transform = 'translateY(10px)';
    
    setTimeout(() => {
        messageDiv.style.opacity = '1';
        messageDiv.style.transform = 'translateY(0)';
        messageDiv.style.transition = 'all 0.3s ease';
    }, 10);
}

// Função para formatar mensagens básicas
function formatMessage(text) {
    return text
        .replace(/\n/g, '<br>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`(.*?)`/g, '<code style="background: #f1f5f9; padding: 2px 4px; border-radius: 3px; font-family: monospace;">$1</code>');
}

// Função para adicionar metadados
function addMetadata(metadata) {
    const chatContainer = document.getElementById('chatContainer');
    const lastMessage = chatContainer.lastElementChild;
    
    if (lastMessage && lastMessage.classList.contains('bot')) {
        const metadataDiv = document.createElement('div');
        metadataDiv.className = 'metadata';
        metadataDiv.innerHTML = `
            <small>
                ${metadata.source ? `Fonte: ${metadata.source}` : ''}
                ${metadata.timestamp ? ` • ${new Date(metadata.timestamp).toLocaleTimeString('pt-BR')}` : ''}
                ${metadata.confidence ? ` • Confiança: ${Math.round(metadata.confidence * 100)}%` : ''}
            </small>
        `;
        
        lastMessage.querySelector('.message-content').appendChild(metadataDiv);
    }
}

// Função para adicionar exemplos de perguntas
function addExampleButtons() {
    const examples = [
        "Como autenticar na API do HubSpot?",
        "Quais são os endpoints principais?",
        "Como criar um webhook no HubSpot?",
        "Como buscar contatos via API?",
        "Rate limits da API do HubSpot",
        "Como atualizar propriedades de contato?"
    ];
    
    const examplesContainer = document.createElement('div');
    examplesContainer.className = 'examples';
    examplesContainer.innerHTML = `
        <div class="examples-title">💡 Perguntas frequentes:</div>
        <div class="example-buttons">
            ${examples.map(example => 
                `<button class="example-button" onclick="fillInput('${example}')">${example}</button>`
            ).join('')}
        </div>
    `;
    
    const container = document.querySelector('.container');
    container.appendChild(examplesContainer);
}

// Função para preencher input com exemplo
function fillInput(text) {
    const input = document.getElementById('queryInput');
    input.value = text;
    input.focus();
}

// Função para limpar chat
function clearChat() {
    const chatContainer = document.getElementById('chatContainer');
    chatContainer.innerHTML = `
        <div class="message bot">
            <div class="message-avatar">🤖</div>
            <div class="message-content">
                Olá! Sou seu assistente especializado em HubSpot API. Posso ajudar com dúvidas sobre integrações, endpoints, autenticação, webhooks e muito mais. Como posso ajudá-lo hoje?
            </div>
        </div>
    `;
}

// Função para verificar status do N8N
async function checkN8NStatus() {
    try {
        const response = await fetch(N8N_WEBHOOK_URL.replace('/webhook/', '/healthz'), {
            method: 'GET',
            timeout: 5000
        });
        
        const statusIndicator = document.querySelector('.status-dot');
        if (response.ok) {
            statusIndicator.style.background = '#48bb78'; // Verde
        } else {
            statusIndicator.style.background = '#f56565'; // Vermelho
        }
    } catch (error) {
        const statusIndicator = document.querySelector('.status-dot');
        statusIndicator.style.background = '#ed8936'; // Laranja
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    const input = document.getElementById('queryInput');
    const sendButton = document.getElementById('sendButton');
    
    // Enviar com Enter
    input.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !sendButton.disabled && !input.disabled) {
            e.preventDefault();
            sendQuestion();
        }
    });
    
    // Controle do botão enviar baseado no input
    input.addEventListener('input', function() {
        sendButton.disabled = this.value.trim() === '';
    });
    
    // Adicionar botões de exemplo
    addExampleButtons();
    
    // Verificar status inicial
    // checkN8NStatus();
    
    // Verificar status periodicamente (opcional)
    // setInterval(checkN8NStatus, 30000); // A cada 30 segundos
    
    // Focus inicial no input
    input.focus();
    
    // Adicionar botão de limpar chat
    const header = document.querySelector('.header');
    const clearButton = document.createElement('button');
    clearButton.innerHTML = '🗑️ Limpar Chat';
    clearButton.style.cssText = `
        background: #f7fafc;
        border: 1px solid #e2e8f0;
        border-radius: 20px;
        padding: 6px 12px;
        font-size: 0.8rem;
        color: #4a5568;
        cursor: pointer;
        margin-top: 10px;
        transition: all 0.3s ease;
    `;
    
    clearButton.addEventListener('click', clearChat);
    clearButton.addEventListener('mouseenter', function() {
        this.style.background = '#edf2f7';
        this.style.borderColor = '#cbd5e0';
    });
    clearButton.addEventListener('mouseleave', function() {
        this.style.background = '#f7fafc';
        this.style.borderColor = '#e2e8f0';
    });
    
    header.appendChild(clearButton);
});

// Função para debug (remover em produção)
function debugN8N() {
    console.log('Webhook URL:', N8N_WEBHOOK_URL);
    console.log('User Agent:', navigator.userAgent);
    console.log('Location:', window.location.href);
}

// Exportar funções para uso global
window.sendQuestion = sendQuestion;
window.fillInput = fillInput;
window.clearChat = clearChat;
