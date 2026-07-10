const QUESTION_URL = '../dataset/surveyQuestion.json';
const RESPONSE_KEY = 'printify_survey_r';
const QUESTION_CACHE_KEY = 'printify_survey_q';
const $ = (id) => document.getElementById(id);

let questions = [];

function normalizeDimension(dim) {
  const d = String(dim || "").trim().toUpperCase();

  if (d === "EOU") return "PEOU";
  if (d === "PEOU") return "PEOU";

  if (d === "SA") return "SAT";
  if (d === "SAT") return "SAT";

  return d;
}

function getCurrentSurveyUser() {
  if (typeof getCurrentUser === 'function') {
    return getCurrentUser();
  }

  try {
    const raw = sessionStorage.getItem('printify_session');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function getUserId(user) {
  return user?.userId || user?.custId || user?.adId || '';
}

function getUserName(user) {
  return user?.name || user?.custName || user?.adName || 'người dùng';
}

function setMessage(msg, isSuccess = false) {
  const el = $('surveyMessage');
  if (!el) return;
  el.textContent = msg || '';
  el.style.color = isSuccess ? '#047857' : '#b91c1c';
}

function showToast(msg) {
  const toast = $('surveyToast');
  if (!toast) return;

  toast.textContent = msg;
  toast.classList.remove('hidden');

  clearTimeout(window.__surveyToastTimer);
  window.__surveyToastTimer = setTimeout(() => {
    toast.classList.add('hidden');
  }, 2200);
}

function loadStoredResponses() {
  try {
    return JSON.parse(localStorage.getItem(RESPONSE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveStoredResponses(responses) {
  localStorage.setItem(RESPONSE_KEY, JSON.stringify(responses));
  window.dispatchEvent(new CustomEvent('printifySurveyUpdated'));
}

function normalizeDimension(dim) {
  const d = String(dim || '').trim().toUpperCase();

  if (d === 'EOU' || d === 'PEOU') return 'PEOU';
  if (d === 'SAT' || d === 'SA') return 'SAT';

  return d;
}

function groupQuestionsByDimension(list) {
  const order = ['PU', 'PEOU', 'SAT', 'PI'];

  const labels = {
    PU: {
      title: 'Cảm nhận hữu ích (PU)',
      desc: 'Đánh giá mức độ PrintiFy giúp bạn hiệu quả hơn.'
    },
    PEOU: {
      title: 'Cảm nhận dễ sử dụng (PEOU)',
      desc: 'Đánh giá mức độ dễ hiểu, dễ thao tác.'
    },
    SAT: {
      title: 'Sự hài lòng (SAT)',
      desc: 'Đánh giá mức độ hài lòng với sản phẩm và hệ thống.'
    },
    PI: {
      title: 'Ý định tiếp tục sử dụng (PI)',
      desc: 'Đánh giá ý định quay lại và giới thiệu cho người khác.'
    }
  };

  const groups = {};
  order.forEach(dim => (groups[dim] = []));

  list.forEach(q => {
    const dim = normalizeDimension(q.dimension);
    if (groups[dim]) groups[dim].push(q);
  });

  return { groups, labels, order };
}

function updateSurveyAuthUI() {
  const user = getCurrentSurveyUser();
  const userLabel = $('surveyUserLabel');
  const authNotice = $('surveyAuthNotice');
  const formWrap = $('surveyFormWrap');
  const questionsWrap = $('surveyQuestions');

  if (userLabel) {
    userLabel.textContent = user
      ? `Xin chào, ${getUserName(user)}`
      : 'Chưa đăng nhập';
  }

  if (!user) {
    if (authNotice) {
      authNotice.classList.remove('hidden');
      authNotice.textContent = 'Khảo sát TAM chỉ hiển thị cho người dùng đã đăng nhập.';
    }
    if (formWrap) formWrap.classList.add('hidden');
    if (questionsWrap) questionsWrap.innerHTML = '';
    return false;
  }

  if (authNotice) authNotice.classList.add('hidden');
  if (formWrap) formWrap.classList.remove('hidden');
  return true;
}

function renderSurvey() {
  const user = getCurrentSurveyUser();
  if (!user) {
    updateSurveyAuthUI();
    return;
  }
  const activeQuestions = questions
      .filter(q=>q.isActive!==false)
      .sort((a,b)=>Number(a.orderIndex)-Number(b.orderIndex));

  const { groups, labels, order } = groupQuestionsByDimension(activeQuestions);
  const questionsWrap = $('surveyQuestions');

  if (questionsWrap) {
    questionsWrap.innerHTML = order.map(dim => {
      const items = groups[dim];
      if (!items.length) return '';

      return `
        <section class="survey-dim">
          <div class="survey-dim-head">
            <h2 class="survey-dim-title">${labels[dim].title}</h2>
            <p class="survey-dim-desc">${labels[dim].desc}</p>
          </div>

          ${items.map(q => `
            <div class="survey-question">
              <div class="survey-q-text">${q.orderIndex}. ${q.text}</div>
              <div class="likert-row">
                ${[1, 2, 3, 4, 5].map(score => `
                  <div class="likert-item">
                    <input
                      type="radio"
                      name="${q.questionId}"
                      id="${q.questionId}_${score}"
                      value="${score}"
                      required
                    >
                    <label for="${q.questionId}_${score}">${score}</label>
                  </div>
                `).join('')}
              </div>
            </div>
          `).join('')}
        </section>
      `;
    }).join('');
  }

  $('surveyForm')?.reset();
  setMessage('');
}

async function loadQuestions() {
  try {
    const res = await fetch(QUESTION_URL, { cache: 'no-store' });
    if (!res.ok) throw new Error('Không tải được surveyQuestion.json');

    const data = await res.json();
    questions = Array.isArray(data) ? data : [];

    localStorage.setItem(QUESTION_CACHE_KEY, JSON.stringify(questions));
    renderSurvey();
    return;
  } catch (err) {
    console.error(err);

    try {
      const cached = JSON.parse(localStorage.getItem(QUESTION_CACHE_KEY) || 'null');
      if (Array.isArray(cached) && cached.length) {
        questions = cached;
        renderSurvey();
        return;
      }
    } catch {}

    const questionsWrap = $('surveyQuestions');
    if (questionsWrap) {
      questionsWrap.innerHTML = `
        <div class="survey-notice">
          Không tải được bộ câu hỏi khảo sát.
        </div>
      `;
    }
  }
}

function collectAnswers() {
  const answers = [];
  const activeQuestions = questions.filter(q => q.isActive !== false);

  for (const q of activeQuestions) {
    const checked = document.querySelector(`input[name="${q.questionId}"]:checked`);
    if (!checked) return null;

    answers.push({
      questionId: q.questionId,
      score: Number(checked.value)
    });
  }

  return answers;
}

function submitSurvey(e) {
  e.preventDefault();

  const user = getCurrentSurveyUser();
  if (!user) {
    setMessage('Bạn cần đăng nhập để gửi khảo sát.');
    if (typeof setReturnTo === 'function') setReturnTo(window.location.href);
    if (typeof redirectToLogin === 'function') redirectToLogin(window.location.href);
    return;
  }

  const answers = collectAnswers();
  if (!answers) {
    setMessage('Vui lòng chọn đầy đủ 1–5 cho tất cả câu hỏi.');
    return;
  }

  const response = {
    responseId: 'SR-' + Date.now(),
    userId: getUserId(user),
    userName: getUserName(user),
    answers,
    comment: $('surveyComment')?.value.trim() || '',
    submittedAt: new Date().toISOString()
  };

  const stored = loadStoredResponses();
  stored.push(response);
  saveStoredResponses(stored);

  setMessage('Gửi khảo sát thành công!', true);
  showToast('Đã lưu phản hồi TAM');

  $('surveyForm')?.reset();
  window.dispatchEvent(new CustomEvent('printifySurveyUpdated'));
}

function resetSurvey() {
  $('surveyForm')?.reset();
  setMessage('');
}

document.addEventListener('DOMContentLoaded', async () => {
  if (typeof initAuthUI === 'function') initAuthUI();

  updateSurveyAuthUI();
  await loadQuestions();

  const form = $('surveyForm');
  const resetBtn = $('btnResetSurvey');

  if (form) form.addEventListener('submit', submitSurvey);
  if (resetBtn) resetBtn.addEventListener('click', resetSurvey);
});

window.addEventListener('printify-auth-changed', () => {
  updateSurveyAuthUI();
  if (getCurrentSurveyUser()) renderSurvey();
});