// 全局变量
let ws = null;
let currentRole = null;

// 登录函数
function login(role) {
    currentRole = role;
    document.getElementById('login-container').classList.add('hidden');
    document.getElementById('chat-container').classList.remove('hidden');
    
    const chatSection = document.getElementById('chat-section');
    chatSection.className = `chat-section ${role}-mode`;
    
    document.getElementById('role-title').textContent = role === 'husband' ? '老公' : '老婆';
    document.getElementById('message-input').placeholder = `${role === 'husband' ? '老公' : '老婆'}说...`;
    
    connectWebSocket();
}

// 加载历史消息
async function loadHistory() {
    try {
        const response = await fetch('/history');
        const messages = await response.json();
        
        // 按时间顺序显示消息
        messages.reverse().forEach(message => {
            appendMessage(message.role, message.content);
        });
        
        displaySystemMessage('历史消息加载完成');
    } catch (error) {
        console.error('加载历史消息失败:', error);
        displaySystemMessage('加载历史消息失败');
    }
}

// WebSocket连接
function connectWebSocket() {
    ws = new WebSocket(`ws://${window.location.host}/ws`);
    
    ws.onopen = () => {
        console.log('WebSocket连接已建立');
        displaySystemMessage('连接成功');
        loadHistory();
    };

    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'message') {
            appendMessage(data.role, data.content);
        }
    };

    ws.onclose = () => {
        console.log('WebSocket连接已关闭，尝试重新连接...');
        displaySystemMessage('连接断开，正在重新连接...');
        setTimeout(connectWebSocket, 1000);
    };

    ws.onerror = (error) => {
        console.error('WebSocket错误:', error);
        displaySystemMessage('连接错误');
    };
}

// 发送消息
function sendMessage() {
    if (!currentRole) return;
    
    const input = document.getElementById('message-input');
    const content = input.value.trim();
    
    if (!content) return;
    
    if (ws && ws.readyState === WebSocket.OPEN) {
        const message = {
            type: 'message',
            role: currentRole,
            content: content
        };
        
        ws.send(JSON.stringify(message));
        input.value = '';
    } else {
        displaySystemMessage('无法发送消息，连接已断开');
    }
}

// 添加消息到聊天框
function appendMessage(role, content) {
    const chatBox = document.getElementById('chat-box');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message';
    messageDiv.textContent = content;
    
    // 根据发送者设置消息的样式
    messageDiv.classList.add(`${role}-message`);
    
    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}

// 显示系统消息
function displaySystemMessage(message) {
    const chatBox = document.getElementById('chat-box');
    const systemMessage = document.createElement('div');
    systemMessage.className = 'system-message';
    systemMessage.textContent = message;
    
    chatBox.appendChild(systemMessage);
    chatBox.scrollTop = chatBox.scrollHeight;
}

// 添加回车发送功能
document.addEventListener('DOMContentLoaded', () => {
    const messageInput = document.getElementById('message-input');
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
});
