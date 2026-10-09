// Quiz Module
const CONFETTI_COLORS = [
  "#ff69b4",
  "#ffe45c",
  "#48d1cc",
  "#663399",
  "#ffffff",
  "#ff6347",
];

const MESSAGES = [
  [10, "Parfait ! Vous connaissez les couleurs CSS sur le bout des doigts 🏆"],
  [7, "Bravo, votre œil est affûté !"],
  [4, "Pas mal ! Encore quelques nuances à apprivoiser."],
  [0, "Les couleurs nommées ont encore des secrets pour vous… Rejouez !"],
];

export class ColorQuiz {
  constructor(colors) {
    this.colors = colors.filter((c) => !c.system); // Exclude system colors
    this.totalQuestions = 10;
    this.currentQuestion = 0;
    this.score = 0;
    this.questions = [];
    this.history = [];

    this.initElements();
    this.attachEventListeners();
  }

  initElements() {
    this.dialog = document.getElementById("quiz-dialog");
    this.closeBtn = document.getElementById("quiz-close");
    this.startScreen = document.getElementById("quiz-start");
    this.gameScreen = document.getElementById("quiz-game");
    this.resultsScreen = document.getElementById("quiz-results");
    this.startBtn = document.getElementById("quiz-start-btn");
    this.nextBtn = document.getElementById("quiz-next-btn");
    this.replayBtn = document.getElementById("quiz-replay-btn");
    this.colorNameEl = document.getElementById("quiz-color-name");
    this.choicesEl = document.getElementById("quiz-choices");
    this.answerEl = document.getElementById("quiz-answer");
    this.feedbackEl = document.getElementById("quiz-feedback");
    this.progressEl = document.getElementById("quiz-progress");
    this.currentScoreEl = document.getElementById("quiz-current-score");
    this.questionNumEl = document.getElementById("quiz-question-num");
    this.finalScoreEl = document.getElementById("quiz-final-score");
    this.burstScoreEl = document.getElementById("quiz-burst-score");
    this.messageEl = document.getElementById("quiz-message");
    this.confettiEl = document.getElementById("quiz-confetti");
  }

  attachEventListeners() {
    this.closeBtn.addEventListener("click", () => this.dialog.close());
    this.dialog.addEventListener("close", () => this.reset());
    this.startBtn.addEventListener("click", () => this.startGame());
    this.nextBtn.addEventListener("click", () => this.nextQuestion());
    this.replayBtn.addEventListener("click", () => this.startGame());
  }

  open() {
    this.dialog.showModal();
  }

  reset() {
    this.confettiEl.innerHTML = "";
    this.showScreen("start");
  }

  showScreen(screen) {
    this.startScreen.hidden = screen !== "start";
    this.gameScreen.hidden = screen !== "game";
    this.resultsScreen.hidden = screen !== "results";
  }

  startGame() {
    this.currentQuestion = 0;
    this.score = 0;
    this.history = [];
    this.questions = this.generateQuestions();
    this.showScreen("game");
    this.displayQuestion();
  }

  generateQuestions() {
    const questions = [];
    const usedColors = new Set();

    // Select interesting colors (not too common, not too obscure)
    const interestingColors = this.colors.filter(
      (c) => c.name.length >= 6 && c.name.length <= 15
    );

    for (let i = 0; i < this.totalQuestions; i++) {
      let correctColor;
      do {
        correctColor =
          interestingColors[
            Math.floor(Math.random() * interestingColors.length)
          ];
      } while (usedColors.has(correctColor.name));

      usedColors.add(correctColor.name);

      // Generate 5 wrong answers (6 choices total), with distinct hex values
      const wrongColors = [];
      while (wrongColors.length < 5) {
        const randomColor =
          this.colors[Math.floor(Math.random() * this.colors.length)];
        if (
          randomColor.hex !== correctColor.hex &&
          !wrongColors.find((c) => c.hex === randomColor.hex)
        ) {
          wrongColors.push(randomColor);
        }
      }

      // Shuffle choices
      const choices = [correctColor, ...wrongColors].sort(
        () => Math.random() - 0.5
      );

      questions.push({
        correctColor,
        choices,
      });
    }

    return questions;
  }

  renderProgress() {
    this.progressEl.innerHTML = "";
    for (let i = 0; i < this.totalQuestions; i++) {
      const li = document.createElement("li");
      if (i < this.history.length) {
        li.className = this.history[i] ? "is-ok" : "is-ko";
      } else if (i === this.currentQuestion) {
        li.className = "is-current";
      }
      this.progressEl.appendChild(li);
    }
  }

  displayQuestion() {
    const question = this.questions[this.currentQuestion];
    const name = question.correctColor.name;

    this.colorNameEl.textContent = name;
    this.colorNameEl.style.setProperty(
      "--q-size",
      name.length <= 10 ? "5rem" : name.length <= 15 ? "3.875rem" : "3.125rem"
    );
    this.questionNumEl.textContent = this.currentQuestion + 1;
    this.currentScoreEl.textContent = this.score;
    this.answerEl.hidden = true;
    this.renderProgress();

    // Clear previous choices
    this.choicesEl.innerHTML = "";

    // Create choice buttons
    question.choices.forEach((color, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "quiz-choice";
      button.style.setProperty("--swatch", color.hex);
      button.dataset.color = color.name;
      button.setAttribute("aria-label", `Choix ${index + 1}`);
      button.addEventListener("click", () => this.checkAnswer(color.name));
      this.choicesEl.appendChild(button);
    });
  }

  checkAnswer(selectedColorName) {
    const question = this.questions[this.currentQuestion];
    const isCorrect = selectedColorName === question.correctColor.name;

    if (isCorrect) {
      this.score++;
      this.currentScoreEl.textContent = this.score;
    }
    this.history.push(isCorrect);
    this.renderProgress();

    // Disable all choices and reveal their names
    const choices = this.choicesEl.querySelectorAll(".quiz-choice");
    choices.forEach((choice) => {
      const name = choice.dataset.color;
      choice.disabled = true;
      choice.setAttribute("aria-label", name);

      if (name === question.correctColor.name) {
        choice.classList.add("is-correct");
        choice.insertAdjacentHTML(
          "beforeend",
          '<span class="quiz-choice-mark" aria-hidden="true">✓</span>'
        );
      } else if (name === selectedColorName) {
        choice.classList.add("is-wrong");
        choice.insertAdjacentHTML(
          "beforeend",
          '<span class="quiz-choice-mark" aria-hidden="true">✕</span>'
        );
      } else {
        choice.classList.add("is-dim");
      }

      const label = document.createElement("span");
      label.className = "quiz-choice-name";
      label.textContent = name;
      choice.appendChild(label);
    });

    // Show feedback
    this.feedbackEl.classList.toggle("is-ok", isCorrect);
    this.feedbackEl.textContent = isCorrect
      ? `Bravo ! C'est bien ${question.correctColor.name} 🎉`
      : `Raté… vous avez choisi ${selectedColorName}.`;

    const isLast = this.currentQuestion >= this.totalQuestions - 1;
    this.nextBtn.textContent = isLast
      ? "Voir le résultat →"
      : "Question suivante →";
    this.answerEl.hidden = false;
    this.nextBtn.focus();

    if (isCorrect) this.launchConfetti();
  }

  nextQuestion() {
    if (this.currentQuestion >= this.totalQuestions - 1) {
      this.showResults();
      return;
    }
    this.currentQuestion++;
    this.displayQuestion();
  }

  launchConfetti() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    this.confettiEl.innerHTML = "";
    const count = 44;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + (i % 3) * 0.2;
      const distance = 260 + ((i * 53) % 260);
      const piece = document.createElement("span");
      piece.style.cssText = `
        width: ${i % 2 ? 16 : 12}px;
        height: ${i % 2 ? 10 : 12}px;
        border-radius: ${i % 3 === 0 ? "50%" : "3px"};
        --confetti-color: ${CONFETTI_COLORS[i % CONFETTI_COLORS.length]};
        --x: ${Math.cos(angle) * distance}px;
        --y: ${Math.sin(angle) * distance}px;
        --rot: ${(i * 47) % 720}deg;
        --duration: ${0.9 + (i % 5) * 0.12}s;
      `;
      this.confettiEl.appendChild(piece);
    }
    clearTimeout(this.confettiTimer);
    this.confettiTimer = setTimeout(() => {
      this.confettiEl.innerHTML = "";
    }, 1600);
  }

  showResults() {
    this.showScreen("results");
    this.finalScoreEl.textContent = this.score;
    this.burstScoreEl.textContent = this.score;

    const message = MESSAGES.find(([min]) => this.score >= min);
    this.messageEl.textContent = message[1];
    this.replayBtn.focus();
  }
}
