// =========================
// ESTRELAS
// =========================

const starsContainer = document.getElementById("stars");

for(let i = 0; i < 120; i++){

  const star = document.createElement("div");

  star.classList.add("star");

  const size = Math.random() * 3;

  star.style.width = `${size}px`;
  star.style.height = `${size}px`;

  star.style.top = `${Math.random() * 100}%`;
  star.style.left = `${Math.random() * 100}%`;

  star.style.setProperty("--d", `${1 + Math.random() * 3}s`);
  star.style.setProperty("--delay", `${Math.random() * 2}s`);

  starsContainer.appendChild(star);

}

// =========================
// MODAIS
// =========================

const tutorialModal = document.getElementById("tutorialModal");

const accessibilityModal = document.getElementById("accessibilityModal");

const optionsModal = document.getElementById("optionsModal");

const tutorialBtn = document.querySelector(".tutorial");

const accessibilityBtn = document.querySelector(".accessibility");

const optionsBtn = document.querySelector(".options");

// ABRIR MODAIS

if(tutorialBtn){

  tutorialBtn.onclick = () => {

    tutorialModal.style.display = "flex";

  };

}

if(accessibilityBtn){

  accessibilityBtn.onclick = () => {

    accessibilityModal.style.display = "flex";

  };

}

if(optionsBtn){

  optionsBtn.onclick = () => {

    optionsModal.style.display = "flex";

  };

}

// =========================
// FECHAR MODAIS
// =========================

const closeButtons = document.querySelectorAll(".btn-close");

closeButtons.forEach(button => {

  button.onclick = () => {

    if(tutorialModal){
      tutorialModal.style.display = "none";
    }

    if(accessibilityModal){
      accessibilityModal.style.display = "none";
    }

    if(optionsModal){
      optionsModal.style.display = "none";
    }

  };

});

// =========================
// ACESSIBILIDADE
// =========================

const contrastBtn = document.getElementById("contrastBtn");

if(contrastBtn){

  contrastBtn.onclick = () => {

    document.body.classList.toggle("high-contrast");

  };

}

// =========================
// AUMENTAR FONTE
// =========================

const fontBtn = document.getElementById("fontBtn");

if(fontBtn){

  fontBtn.onclick = () => {

    document.body.classList.toggle("large-font");

  };

}

// =========================
// BOTÃO JOGAR
// =========================

const playBtn = document.querySelector(".play");

if(playBtn){

  playBtn.onclick = () => {

    window.location.href = "jogolabirinto.html";

  };

}

// =========================
// TUTORIAL DO JOGO
// =========================

const openTutorial = document.getElementById("openTutorial");

const closeTutorial = document.getElementById("closeTutorial");

// ABRIR TUTORIAL

if(openTutorial){

  openTutorial.onclick = () => {

    tutorialModal.style.display = "flex";

  };

}

// FECHAR TUTORIAL

if(closeTutorial){

  closeTutorial.onclick = () => {

    tutorialModal.style.display = "none";

  };

}