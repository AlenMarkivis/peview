const words = ["clients", "partners", "employees"];
const element = document.querySelector(".word-animate");

let index = 0;

function showWord() {
  element.style.opacity = "0";
  element.style.transform = "translateY(8px)";

  setTimeout(() => {
    element.textContent = words[index];

    element.style.opacity = "1";
    element.style.transform = "translateY(0)";

    index = (index + 1) % words.length;

    setTimeout(showWord, 1800);
  }, 350);
}

element.style.transition = "opacity 0.35s ease, transform 0.35s ease";

showWord();
