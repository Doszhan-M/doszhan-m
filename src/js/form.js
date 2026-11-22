import { bot } from "./bot";

// функция отправки формы
const sendForm = async (message, bot) => {
  const token = bot.token;
  const chat_id = bot.chat_id;
  return await fetch(
    `https://api.telegram.org/bot${token}/sendMessage?chat_id=${chat_id}&text=${encodeURIComponent(message)}`
  )
    .then((response) => {
      return response.json();
    })
    .then((data) => {
      return data.ok === true;
    })
    .catch(() => {
      // сетевая ошибка — не считаем отправку успешной
      return false;
    });
};

// найти все элементы формы
const closeBtn = document.querySelectorAll(".contact__alert_close");
const name = document.getElementById("name");
const email = document.getElementById("email");
const message = document.getElementById("message");
const btn = document.getElementById("submit");

export function sendContactForm() {
  // Отправить сообщение из формы
  btn.addEventListener("click", async () => {
    const userErrorAlert = document.getElementById("userError");
    const systemErrorAlert = document.getElementById("systemError");
    const successAlert = document.getElementById("success");

    if (
      name.value.length > 0 &&
      email.value.length > 0 &&
      message.value.length > 0
    ) {
      const data = `Name: ${name.value}\n${email.value}\n${message.value}`;
      btn.classList.add("is-loading");
      btn.disabled = true;
      const result = await sendForm(data, bot);
      btn.classList.remove("is-loading");
      btn.disabled = false;

      if (result) {
        if (userErrorAlert.classList.contains("alert")) {
          userErrorAlert.classList.remove("alert");
        }
        if (systemErrorAlert.classList.contains("alert")) {
          systemErrorAlert.classList.remove("alert");
        }
        successAlert.classList.add("alert");
        name.value = "";
        email.value = "";
        message.value = "";
      } else {
        if (userErrorAlert.classList.contains("alert")) {
          userErrorAlert.classList.remove("alert");
        }
        systemErrorAlert.classList.add("alert");
      }
    } else {
      successAlert.classList.remove("alert");
      systemErrorAlert.classList.remove("alert");
      userErrorAlert.classList.add("alert");
    }
  });

  // закрыть алерт через кнопку х
  closeBtn.forEach((btn) => {
    btn.addEventListener("click", () => {
      btn.parentNode.classList.remove("alert");
    });
    btn.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        btn.click();
      }
    });
  });
}
