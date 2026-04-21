let quizData = [];
let testParts = [];
let currentTestIndex = -1;
let currentQuestionIndex = 0;
let userAnswers = {}; // { questionIndexInTest: choiceIndex }
let isReviewMode = false;

// DOM Elements
const eLoading = document.getElementById('loading');
const eDashboard = document.getElementById('dashboard');
const eTestsGrid = document.getElementById('tests-grid');
const eQuizScreen = document.getElementById('quiz-screen');
const eResultScreen = document.getElementById('result-screen');
const eQuestionText = document.getElementById('question-text');
const eQuestionNumber = document.getElementById('question-number');
const eChoicesContainer = document.getElementById('choices-container');
const eNavGrid = document.getElementById('nav-grid');
const eBtnPrev = document.getElementById('btn-prev');
const eBtnNext = document.getElementById('btn-next');
const eBtnSubmit = document.getElementById('btn-submit');
const eBtnBackHome = document.getElementById('btn-back-home');
const eBtnHomeFromResult = document.getElementById('btn-home-from-result');
const eBtnReview = document.getElementById('btn-review');
const eFeedbackContainer = document.getElementById('feedback-container');
const eProgressText = document.getElementById('progress-text');
const eThemeToggle = document.getElementById('theme-toggle');

// Initialization
async function init() {
    try {
        const response = await fetch('quiz_data.json');
        if (!response.ok) throw new Error("Could not load data");
        quizData = await response.json();
        
        partitionData(quizData);
        renderDashboard();
        
        // Hide loading, show dashboard
        eLoading.classList.add('hidden');
        eDashboard.classList.remove('hidden');
    } catch (e) {
        console.error("Error loading quiz data:", e);
        eLoading.innerHTML = `<div class="text-red-500 font-bold mb-2"><i class="fa-solid fa-triangle-exclamation text-3xl"></i></div><p>Lỗi: Không thể tải được file quiz_data.json.<br>Vui lòng chạy ứng dụng qua Local Web Server.</p>`;
    }
}

// Partition data into 4 parts: 100, 100, 100, remaining
function partitionData(data) {
    testParts = [];
    let start = 0;
    for (let i = 0; i < 4; i++) {
        let size = (i === 3) ? data.length - start : 100;
        if (size > 0 && start < data.length) {
            testParts.push({
                id: i + 1,
                name: `Test ${i + 1}`,
                desc: `Câu ${start + 1} - ${start + size}`,
                questions: data.slice(start, start + size)
            });
            start += size;
        }
    }
}

// Render the dashboard test cards
function renderDashboard() {
    eTestsGrid.innerHTML = '';
    testParts.forEach((part, index) => {
        // Find if have saved state
        const saved = localStorage.getItem(`quizState_test${index}`);
        let badge = '';
        if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed.submitted) {
                badge = `<span class="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-bold absolute top-4 right-4 shadow-sm">Đã Hoàn Thành</span>`;
            } else {
                const count = Object.keys(parsed.answers).length;
                badge = `<span class="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-full font-bold absolute top-4 right-4 shadow-sm">Đang làm: ${count}/${part.questions.length}</span>`;
            }
        }

        const card = document.createElement('div');
        card.className = "glass rounded-2xl p-6 relative cursor-pointer transform hover:-translate-y-1 transition-all shadow-md hover:shadow-xl group";
        card.innerHTML = `
            ${badge}
            <div class="w-12 h-12 bg-gradient-to-br from-primary to-purple-600 rounded-xl flex items-center justify-center text-white text-xl mb-4 shadow-lg group-hover:scale-110 transition-transform">
                <i class="fa-solid fa-file-signature"></i>
            </div>
            <h3 class="text-xl font-bold text-slate-800 mb-2">${part.name}</h3>
            <p class="text-slate-500 text-sm mb-4"><i class="fa-solid fa-list-ol mr-1"></i> ${part.desc}</p>
            <div class="text-primary font-medium text-sm flex items-center group-hover:translate-x-1 transition-transform">
                Vào làm bài <i class="fa-solid fa-arrow-right ml-2 text-xs"></i>
            </div>
        `;
        card.onclick = () => startTest(index);
        eTestsGrid.appendChild(card);
    });
}

function startTest(index) {
    currentTestIndex = index;
    currentQuestionIndex = 0;
    isReviewMode = false;
    
    // Load local storage
    const saved = localStorage.getItem(`quizState_test${index}`);
    if (saved) {
        const parsed = JSON.parse(saved);
        userAnswers = parsed.answers || {};
        isReviewMode = parsed.submitted || false;
    } else {
        userAnswers = {};
    }

    eDashboard.classList.add('hidden');
    eResultScreen.classList.add('hidden');
    eQuizScreen.classList.remove('hidden');
    eProgressText.classList.remove('hidden');
    eFeedbackContainer.classList.add('hidden');

    eBtnSubmit.style.display = isReviewMode ? 'none' : 'block';
    
    buildNavGrid();
    renderQuestion();
}

function buildNavGrid() {
    eNavGrid.innerHTML = '';
    const questions = testParts[currentTestIndex].questions;
    
    for (let i = 0; i < questions.length; i++) {
        const btn = document.createElement('button');
        btn.className = `nav-dot ${userAnswers[i] !== undefined ? 'answered' : ''}`;
        btn.textContent = i + 1;
        btn.onclick = () => {
            currentQuestionIndex = i;
            renderQuestion();
        };

        if (isReviewMode) {
            btn.classList.remove('answered');
            if (userAnswers[i] === questions[i].correct_answer) {
                btn.classList.add('review-correct');
            } else {
                btn.classList.add('review-wrong');
            }
        }
        
        eNavGrid.appendChild(btn);
    }
}

function updateNavGridHighlight() {
    const dots = eNavGrid.children;
    for (let i = 0; i < dots.length; i++) {
        dots[i].classList.remove('current');
        if (i === currentQuestionIndex) {
            dots[i].classList.add('current');
            // scroll into view
            dots[i].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }
    
    // Update progress text
    const questions = testParts[currentTestIndex].questions;
    eProgressText.textContent = `${Object.keys(userAnswers).length}/${questions.length}`;
}

function renderQuestion() {
    updateNavGridHighlight();
    
    const container = document.getElementById('question-container');
    container.classList.remove('animate-slide-up');
    void container.offsetWidth; // trigger reflow
    container.classList.add('animate-slide-up');

    const test = testParts[currentTestIndex];
    const qData = test.questions[currentQuestionIndex];
    
    eQuestionNumber.innerHTML = `Câu ${currentQuestionIndex + 1} <span class="text-sm text-slate-400 font-normal">/ ${test.questions.length}</span>`;
    eQuestionText.textContent = qData.question;
    
    eChoicesContainer.innerHTML = '';
    qData.choices.forEach((choice, cIndex) => {
        const btn = document.createElement('button');
        btn.className = 'choice-btn group';
        if (userAnswers[currentQuestionIndex] === cIndex) {
            btn.classList.add('selected');
        }
        
        let icon = '';
        if (isReviewMode) {
            if (cIndex === qData.correct_answer) {
                btn.classList.add('correct');
                icon = '<i class="fa-solid fa-check-circle float-right mt-1"></i>';
            } else if (userAnswers[currentQuestionIndex] === cIndex) {
                btn.classList.add('wrong');
                icon = '<i class="fa-solid fa-times-circle float-right mt-1 cursor-default"></i>';
            }
            btn.style.cursor = 'default';
        } else {
            btn.onclick = () => selectChoice(cIndex);
        }

        btn.innerHTML = `<span>${choice}</span> ${icon}`;
        eChoicesContainer.appendChild(btn);
    });

    // Handle feedback container in review mode
    if (isReviewMode) {
        eFeedbackContainer.classList.remove('hidden');
        if (userAnswers[currentQuestionIndex] === qData.correct_answer) {
            eFeedbackContainer.className = 'p-4 mx-6 mb-6 rounded-xl border border-green-200 bg-green-50 text-green-800';
            eFeedbackContainer.innerHTML = '<strong><i class="fa-solid fa-check mr-2"></i> Trả lời chính xác!</strong>';
        } else {
            eFeedbackContainer.className = 'p-4 mx-6 mb-6 rounded-xl border border-red-200 bg-red-50 text-red-800';
            const correctAnswerText = qData.correct_answer >= 0 && qData.correct_answer < qData.choices.length 
                                    ? qData.choices[qData.correct_answer] 
                                    : "Không xác định được từ file";
            eFeedbackContainer.innerHTML = `<strong><i class="fa-solid fa-xmark mr-2"></i> Trả lời sai!</strong><p class="mt-2 text-sm">Đáp án đúng là: <span class="font-bold">${correctAnswerText}</span></p>`;
        }
    } else {
        eFeedbackContainer.classList.add('hidden');
    }

    // Buttons state
    eBtnPrev.disabled = currentQuestionIndex === 0;
    eBtnPrev.style.opacity = currentQuestionIndex === 0 ? '0.5' : '1';
    
    if (currentQuestionIndex === test.questions.length - 1) {
        eBtnNext.disabled = true;
        eBtnNext.style.opacity = '0.5';
    } else {
        eBtnNext.disabled = false;
        eBtnNext.style.opacity = '1';
    }
}

function selectChoice(choiceIndex) {
    if (isReviewMode) return;
    
    userAnswers[currentQuestionIndex] = choiceIndex;
    
    // Update UI immediately for snappiness
    const btns = eChoicesContainer.children;
    for (let i = 0; i < btns.length; i++) {
        if (i === choiceIndex) {
            btns[i].classList.add('selected');
        } else {
            btns[i].classList.remove('selected');
        }
    }
    
    // Update nav grid
    const dots = eNavGrid.children;
    dots[currentQuestionIndex].classList.add('answered');
    
    saveState();
    
    // Auto next after slight delay
    setTimeout(() => {
        if (currentQuestionIndex < testParts[currentTestIndex].questions.length - 1) {
            currentQuestionIndex++;
            renderQuestion();
        }
    }, 400); // 400ms delay to see the selection
}

function saveState(submitted = false) {
    const state = {
        answers: userAnswers,
        submitted: submitted
    };
    localStorage.setItem(`quizState_test${currentTestIndex}`, JSON.stringify(state));
    updateNavGridHighlight();
}

function submitTest() {
    const test = testParts[currentTestIndex];
    const answeredCount = Object.keys(userAnswers).length;
    
    if (answeredCount < test.questions.length) {
        const confirmSub = confirm(`Bạn mới làm ${answeredCount}/${test.questions.length} câu. Bạn có chắc chắn muốn nộp bài?`);
        if (!confirmSub) return;
    }
    
    // Grade
    let correct = 0;
    for (let i = 0; i < test.questions.length; i++) {
        if (userAnswers[i] === test.questions[i].correct_answer) {
            correct++;
        }
    }
    
    const percent = Math.round((correct / test.questions.length) * 100);
    
    // Update UI Result
    document.getElementById('result-subtitle').textContent = `Bạn vừa hoàn thành ${test.name}`;
    document.getElementById('score-percent').textContent = `${percent}%`;
    document.getElementById('score-correct').textContent = correct;
    document.getElementById('score-total').textContent = test.questions.length;
    
    saveState(true);
    
    eQuizScreen.classList.add('hidden');
    eResultScreen.classList.remove('hidden');
    
    // Make confetti effect
    createConfetti();
}

function createConfetti() {
    const container = document.getElementById('confetti-container');
    container.innerHTML = '';
    const colors = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
    
    for (let i = 0; i < 50; i++) {
        const conf = document.createElement('div');
        conf.style.position = 'absolute';
        conf.style.width = '10px';
        conf.style.height = '10px';
        conf.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        conf.style.left = Math.random() * 100 + '%';
        conf.style.top = '-10px';
        conf.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
        conf.style.opacity = Math.random();
        conf.style.animation = `fall ${Math.random() * 3 + 2}s linear forwards`;
        container.appendChild(conf);
    }
}

// Global CSS for confetti
const style = document.createElement('style');
style.innerHTML = `
@keyframes fall {
    to { transform: translateY(100vh) rotate(720deg); }
}
`;
document.head.appendChild(style);

// Dark/Light Theme Support
eThemeToggle.addEventListener('click', () => {
    document.documentElement.classList.toggle('dark');
    if (document.documentElement.classList.contains('dark')) {
        eThemeToggle.innerHTML = '<i class="fa-solid fa-sun text-yellow-400"></i>';
    } else {
        eThemeToggle.innerHTML = '<i class="fa-solid fa-moon"></i>';
    }
});

// Event Listeners
eBtnPrev.addEventListener('click', () => {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        renderQuestion();
    }
});

eBtnNext.addEventListener('click', () => {
    const test = testParts[currentTestIndex];
    if (currentQuestionIndex < test.questions.length - 1) {
        currentQuestionIndex++;
        renderQuestion();
    }
});

eBtnSubmit.addEventListener('click', () => {
    submitTest();
});

eBtnBackHome.addEventListener('click', () => {
    eQuizScreen.classList.add('hidden');
    eProgressText.classList.add('hidden');
    renderDashboard();
    eDashboard.classList.remove('hidden');
});

eBtnHomeFromResult.addEventListener('click', () => {
    eResultScreen.classList.add('hidden');
    eProgressText.classList.add('hidden');
    renderDashboard();
    eDashboard.classList.remove('hidden');
});

eBtnReview.addEventListener('click', () => {
    eResultScreen.classList.add('hidden');
    startTest(currentTestIndex); // This will load review mode
});

// Boot
window.addEventListener('DOMContentLoaded', init);
