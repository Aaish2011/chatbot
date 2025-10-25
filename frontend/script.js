// Global chat storage
const chats = {};
let currentChatId = 0;

// Sidebar controls
const sidebar = document.getElementById("sidebar");
const closeBtn = document.getElementById("closeSidebar");
const logo = document.getElementById("logo");
closeBtn.addEventListener("click", () => sidebar.classList.add("collapsed"));
logo.addEventListener("click", () => sidebar.classList.remove("collapsed"));

// Dark/light toggle
const modeToggle = document.getElementById("modeToggle");
modeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  modeToggle.textContent = document.body.classList.contains("dark") ? "☀️" : "🌙";
});

// Chat form submit
const chatForm = document.getElementById("chatForm");
const chatMessages = document.getElementById("chatMessages");
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const input = document.getElementById("chatInput");
  const userMessage = input.value.trim();
  if (!userMessage) return;

  // Add user message
  const userHTML = `<div class="message user">${userMessage} 😄</div>`;
  chatMessages.innerHTML += userHTML;
  input.value = "";
  chatMessages.scrollTop = chatMessages.scrollHeight;
  saveMessage(currentChatId, userHTML);

  // Add typing bubble
  const typingBubble = document.createElement("div");
  typingBubble.className = "message bot typing";
  typingBubble.innerHTML = '<div class="dot"></div><div class="dot"></div><div class="dot"></div>';
  chatMessages.appendChild(typingBubble);
  chatMessages.scrollTop = chatMessages.scrollHeight;

  try {
    const res = await fetch("/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userMessage }),
    });
    const data = await res.json();
    typingBubble.remove();
    const botHTML = `<div class="message bot">${data.botReply} 🤖💡</div>`;
    chatMessages.innerHTML += botHTML;
    chatMessages.scrollTop = chatMessages.scrollHeight;
    saveMessage(currentChatId, botHTML);
  } catch (error) {
    typingBubble.remove();
    const errorHTML = `<div class="message error-bubble">❌ Unable to contact server</div>`;
    chatMessages.innerHTML += errorHTML;
    chatMessages.scrollTop = chatMessages.scrollHeight;
    saveMessage(currentChatId, errorHTML);
  }
});

// Save chat messages
function saveMessage(chatId, html) {
  if (!chats[chatId]) chats[chatId] = "";
  chats[chatId] += html;
}

// Chat history sidebar
const chatList = document.getElementById("chatList");
function addNewChat() {
  currentChatId++;
  const chatItem = document.createElement("div");
  chatItem.className = "chat-item";
  chatItem.dataset.chatId = currentChatId;
  chatItem.textContent = `💬 Chat ${currentChatId}`;
  chatList.appendChild(chatItem);
  loadChat(currentChatId);
}
document.getElementById("newChat").addEventListener("click", addNewChat);

// Click chat history
chatList.addEventListener("click", (e) => {
  const item = e.target.closest(".chat-item");
  if (!item) return;
  document.querySelectorAll(".chat-item").forEach(i => i.classList.remove("active"));
  item.classList.add("active");
  const chatId = parseInt(item.dataset.chatId);
  loadChat(chatId);
});

function loadChat(chatId) {
  currentChatId = chatId;
  chatMessages.innerHTML = chats[chatId] || "";
  chatMessages.scrollTop = chatMessages.scrollHeight;
}
