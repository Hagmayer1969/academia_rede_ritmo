const form = document.querySelector("#lead-form");
const feedback = document.querySelector("#form-feedback");
const submitButton = form.querySelector('button[type="submit"]');
const menuToggle = document.querySelector(".menu-toggle");
const mobileNav = document.querySelector("#mobile-nav");

document.querySelector("#year").textContent = new Date().getFullYear();

function closeMenu() {
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.setAttribute("aria-label", "Abrir menu");
  mobileNav.hidden = true;
}

menuToggle.addEventListener("click", () => {
  const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
  menuToggle.setAttribute("aria-expanded", String(!isOpen));
  menuToggle.setAttribute("aria-label", isOpen ? "Abrir menu" : "Fechar menu");
  mobileNav.hidden = isOpen;
});

mobileNav.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenu));
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeMenu();
});

const fields = ["nome", "whatsapp", "email", "unidade", "modalidade", "inicio"];

function setFieldError(name, message) {
  const input = form.elements[name];
  const error = document.querySelector(`#${name}-error`);
  error.textContent = message;
  if (message) {
    input.setAttribute("aria-invalid", "true");
    input.setAttribute("aria-describedby", `${name}-error`);
  } else {
    input.removeAttribute("aria-invalid");
    input.removeAttribute("aria-describedby");
  }
}

function showFeedback(type, message) {
  feedback.hidden = false;
  feedback.className = `form-feedback is-${type}`;
  feedback.textContent = message;
  feedback.setAttribute("role", type === "error" ? "alert" : "status");
  feedback.setAttribute("tabindex", "-1");
  feedback.focus({ preventScroll: true });
  feedback.scrollIntoView({ behavior: "smooth", block: "center" });
}

function clearFeedback() {
  feedback.hidden = true;
  feedback.textContent = "";
  feedback.className = "form-feedback";
}

function buildPayload() {
  return {
    nome: form.elements.nome.value.trim().replace(/\s+/g, " "),
    whatsapp: form.elements.whatsapp.value.replace(/\D/g, ""),
    email: form.elements.email.value.trim().toLowerCase(),
    unidade: form.elements.unidade.value,
    modalidade: form.elements.modalidade.value,
    inicio: form.elements.inicio.value,
    site_url: form.elements.site_url.value.trim()
  };
}

function validate(payload) {
  const errors = {};
  if (payload.nome.length < 2) errors.nome = "Informe seu nome.";
  if (!/^\d{10,13}$/.test(payload.whatsapp)) errors.whatsapp = "Informe um WhatsApp com DDD válido.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) errors.email = "Informe um e-mail válido.";
  if (!payload.unidade) errors.unidade = "Escolha uma unidade.";
  if (!payload.modalidade) errors.modalidade = "Escolha uma modalidade.";
  if (!payload.inicio) errors.inicio = "Escolha quando deseja começar.";
  return errors;
}

fields.forEach((name) => {
  const input = form.elements[name];
  input.addEventListener("input", () => {
    setFieldError(name, "");
    clearFeedback();
  });
  input.addEventListener("change", () => setFieldError(name, ""));
});

function setLoading(loading) {
  submitButton.disabled = loading;
  submitButton.classList.toggle("is-loading", loading);
  submitButton.setAttribute("aria-busy", String(loading));
  submitButton.querySelector("span:first-child").textContent = loading
    ? "Enviando seu pedido..."
    : "Solicitar minha aula grátis";
}

function readableServerMessage(data) {
  const raw = data?.mensagem ?? data?.message ?? data?.erro ?? data?.error;
  return typeof raw === "string" && raw.length <= 180 && !/[<>]/.test(raw)
    ? raw
    : "Não foi possível enviar seu pedido. Confira os dados e tente novamente.";
}

async function submitLead(payload) {
  const endpoint = window.REDE_RITMO_CONFIG?.webhookUrl?.trim();
  if (!endpoint || !/^https?:\/\//i.test(endpoint)) {
    throw new Error("O formulário ainda não está disponível. Tente novamente mais tarde.");
  }

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    const body = await response.text();
    let data = null;
    try { data = body ? JSON.parse(body) : null; } catch { /* Respostas de texto também são aceitas. */ }

    if (response.status === 409) throw new Error("Este pedido já foi enviado. Aguarde o contato da equipe.");
    if (!response.ok || data?.success === false || data?.ok === false || data?.status === "error") {
      throw new Error(readableServerMessage(data));
    }
  } catch (error) {
    if (error.name === "AbortError") throw new Error("O envio demorou demais. Tente novamente em instantes.");
    if (error instanceof TypeError) throw new Error("Não conseguimos enviar agora. Tente novamente em instantes.");
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearFeedback();
  fields.forEach((name) => setFieldError(name, ""));

  const payload = buildPayload();
  const errors = validate(payload);
  if (Object.keys(errors).length) {
    Object.entries(errors).forEach(([name, message]) => setFieldError(name, message));
    form.elements[Object.keys(errors)[0]].focus();
    return;
  }

  setLoading(true);
  try {
    await submitLead(payload);
    form.reset();
    showFeedback("success", "Pedido enviado! A equipe da unidade escolhida poderá entrar em contato para combinar sua aula experimental.");
  } catch (error) {
    showFeedback("error", error.message || "Não foi possível enviar seu pedido. Tente novamente.");
  } finally {
    setLoading(false);
  }
});
