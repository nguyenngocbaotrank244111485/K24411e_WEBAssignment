const QUESTION_URL = '../dataset/surveyQuestion.json';
const SESSION_KEY = 'printify_session';
const RESPONSE_KEY = 'printify_survey_r';
const QUESTION_CACHE_KEY = 'printify_survey_q';

const $ = (id) => document.getElementById(id);

let questions = [];

function getSessionUser() {
  try {
    return JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null');
  } catch {
    return null;
  }
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

function groupQuestionsByDimension(list) {
  const order = ['PU', 'PEOU', 'SA', 'PI'];
  const labels = {
    PU: {
      title: 'Cảm nhận hữu ích (PU)',
      desc: 'Đánh giá mức độ PrintiFy giúp bạn hiệu quả hơn.'
    },
    PEOU: {
      title: 'Cảm nhận dễ sử dụng (PEOU)',
      desc: 'Đánh giá mức độ dễ hiểu, dễ thao tác.'
    },
    SA: {
      title: 'Sự hài lòng (SA)',
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
    if (groups[q.dimension]) groups[q.dimension].push(q);
  });

  return { groups, labels, order };
}

function renderSurvey() {
  const user = getSessionUser();
  const userLabel = $('surveyUserLabel');
  const authNotice = $('surveyAuthNotice');
  const formWrap = $('surveyFormWrap');
  const questionsWrap = $('surveyQuestions');

  if (userLabel) {
    userLabel.textContent = user ? `Xin chào, ${user.name || user.custName || 'người dùng'}` : 'Chưa đăng nhập';
  }

  if (!user) {
    if (authNotice) {
      authNotice.classList.remove('hidden');
      authNotice.textContent = 'Khảo sát TAM chỉ hiển thị cho người dùng đã đăng nhập.';
    }
    if (formWrap) formWrap.classList.add('hidden');
    if (questionsWrap) questionsWrap.innerHTML = '';
    return;
  }

  if (authNotice) authNotice.classList.add('hidden');
  if (formWrap) formWrap.classList.remove('hidden');

  const activeQuestions = questions
    .filter(q => q.isActive !== false)
    .sort((a, b) => Number(a.orderIndex || 0) - Number(b.orderIndex || 0));

  const { groups, labels, order } = groupQuestionsByDimension(activeQuestions);

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
    const cached = JSON.parse(localStorage.getItem(QUESTION_CACHE_KEY) || 'null');

    if (Array.isArray(cached) && cached.length) {
      questions = cached;
      renderSurvey();
      return;
    }

    const res = await fetch(QUESTION_URL);
    if (!res.ok) throw new Error('Không tải được surveyQuestion.json');

    const data = await res.json();
    questions = Array.isArray(data) ? data : [];

    localStorage.setItem(QUESTION_CACHE_KEY, JSON.stringify(questions));
    renderSurvey();
  } catch (err) {
    console.error(err);
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

  const user = getSessionUser();
  if (!user) {
    setMessage('Bạn cần đăng nhập để gửi khảo sát.');
    return;
  }

  const answers = collectAnswers();
  if (!answers) {
    setMessage('Vui lòng chọn đầy đủ 1–5 cho tất cả câu hỏi.');
    return;
  }

  const response = {
    responseId: 'SR-' + Date.now(),
    userId: user.userId || user.custId || '',
    userName: user.name || user.custName || '',
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

document.addEventListener('DOMContentLoaded', () => {
  loadQuestions();

  const form = $('surveyForm');
  const resetBtn = $('btnResetSurvey');

  if (form) form.addEventListener('submit', submitSurvey);
  if (resetBtn) resetBtn.addEventListener('click', resetSurvey);
});