// ===== العناصر =====
const tweetForm = document.getElementById("tweet-form");
const tweetInput = document.getElementById("tweet-input");
const charCount = document.getElementById("char-count");
const submitButton = document.getElementById("submit-tweet");
const timeline = document.getElementById("timeline");
const emptyState = document.getElementById("empty-state");
const searchInput = document.getElementById("search-input");
const sidebarTweetButton = document.getElementById("sidebar-tweet-btn");

const MAX_LENGTH = 280;
const STORAGE_KEY = "x-clone-tweets";

const CURRENT_USER = {
    name: "Dhafer",
    handle: "Dhafer",
    avatar: "images/avatar.jpg",
};

const HOUR = 60 * 60 * 1000;

// تغريدات تجريبية تظهر عند أول زيارة
function createSampleTweets() {
    const now = Date.now();
    return [
        {
            id: "s1", name: "سارة", handle: "sara_dev", color: "#7856ff",
            text: "أول مرة أفهم CSS Grid صح 😍 الفرق بينه وبين Flexbox صار واضح جدًا. #برمجة_المواقع",
            time: now - 2 * HOUR, replies: 5, retweets: 3, likes: 24,
        },
        {
            id: "s2", name: "مبرمج من الأحساء", handle: "hasa_coder", color: "#00ba7c",
            text: "نصيحة اليوم: اكتب كود يفهمه غيرك قبل ما يفهمه الكمبيوتر. #جافاسكربت",
            time: now - 5 * HOUR, replies: 4, retweets: 12, likes: 58,
        },
        {
            id: "s3", name: "نورة", handle: "noura_ux", color: "#f91880",
            text: "تصميم الواجهة يبدأ من فهم المستخدم، مو من اختيار الألوان. #UX",
            time: now - 26 * HOUR, replies: 9, retweets: 20, likes: 102,
        },
    ].map((tweet) => ({ ...tweet, liked: false, retweeted: false, mine: false }));
}

// ===== التخزين في المتصفح =====
function loadTweets() {
    try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
        if (Array.isArray(saved)) return saved;
    } catch {
        // تخزين غير متاح أو تالف: نبدأ بالتغريدات التجريبية
    }
    return createSampleTweets();
}

function saveTweets() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tweets));
    } catch {
        // التخزين غير متاح: الموقع يعمل لكن بدون حفظ
    }
}

let tweets = loadTweets();

// ===== أدوات مساعدة =====
function createId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// الوقت النسبي بأسلوب X: الآن، 5د، 2س، 3ي
function timeAgo(time) {
    const minutes = Math.floor((Date.now() - time) / 60000);
    if (minutes < 1) return "الآن";
    if (minutes < 60) return `${minutes}د`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}س`;
    return `${Math.floor(hours / 24)}ي`;
}

function formatCount(n) {
    return n >= 1000 ? (n / 1000).toFixed(1).replace(".0", "") + "K" : String(n);
}

// يحوّل الوسوم (#...) إلى عناصر قابلة للضغط، بدون استخدام innerHTML مع نص المستخدم
function renderTextWithHashtags(container, text) {
    const parts = text.split(/(#[\p{L}\p{N}_]+)/u);
    parts.forEach((part) => {
        if (/^#[\p{L}\p{N}_]+$/u.test(part)) {
            // bdi + dir="auto": "#UX" stays "#UX" inside Arabic text
            const tag = document.createElement("bdi");
            tag.dir = "auto";
            tag.className = "hashtag";
            tag.textContent = part;
            tag.dataset.tag = part;
            container.appendChild(tag);
        } else if (part) {
            container.appendChild(document.createTextNode(part));
        }
    });
}

function createAvatar(tweet) {
    if (tweet.mine) {
        const img = document.createElement("img");
        img.className = "avatar";
        img.src = CURRENT_USER.avatar;
        img.alt = "";
        return img;
    }
    const letter = document.createElement("span");
    letter.className = "avatar avatar-letter";
    letter.style.backgroundColor = tweet.color || "#536471";
    letter.textContent = tweet.name.charAt(0);
    return letter;
}

function createActionButton(type, iconClass, count, label, active) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `action ${type}` + (active ? " active" : "");
    button.dataset.action = type;
    button.setAttribute("aria-label", label);
    if (type !== "reply") button.setAttribute("aria-pressed", String(active));

    const icon = document.createElement("i");
    icon.className = iconClass;

    const number = document.createElement("span");
    number.textContent = formatCount(count);

    button.append(icon, number);
    return button;
}

// ===== عرض التغريدات =====
function createTweetElement(tweet) {
    const article = document.createElement("article");
    article.className = "tweet";
    article.dataset.id = tweet.id;

    const content = document.createElement("div");
    content.className = "tweet-content";

    // الرأس: الاسم، المعرّف، الوقت
    const header = document.createElement("div");
    header.className = "tweet-header";

    const name = document.createElement("span");
    name.className = "name";
    name.textContent = tweet.name;

    // The Latin handle gets its own direction so it doesn't jumble with the Arabic time
    const meta = document.createElement("span");
    meta.className = "meta";
    const handle = document.createElement("bdi");
    handle.dir = "ltr";
    handle.textContent = `@${tweet.handle}`;
    meta.append(handle, document.createTextNode(` · ${timeAgo(tweet.time)}`));

    header.append(name, meta);

    if (tweet.mine) {
        const del = document.createElement("button");
        del.type = "button";
        del.className = "delete-btn";
        del.dataset.action = "delete";
        del.setAttribute("aria-label", "حذف التغريدة");
        del.title = "حذف";
        del.innerHTML = '<i class="far fa-trash-can"></i>';
        header.appendChild(del);
    }

    // النص
    const text = document.createElement("p");
    text.className = "tweet-text";
    renderTextWithHashtags(text, tweet.text);

    // الأزرار
    const footer = document.createElement("div");
    footer.className = "tweet-footer";
    footer.append(
        createActionButton("reply", "far fa-comment", tweet.replies, "رد", false),
        createActionButton("retweet", "fas fa-retweet", tweet.retweets, "إعادة تغريد", tweet.retweeted),
        createActionButton("like", tweet.liked ? "fas fa-heart" : "far fa-heart", tweet.likes, "إعجاب", tweet.liked)
    );

    content.append(header, text, footer);
    article.append(createAvatar(tweet), content);
    return article;
}

function render(highlightId) {
    const term = searchInput.value.trim().toLowerCase();

    const visible = tweets
        .filter((tweet) => !term
            || tweet.text.toLowerCase().includes(term)
            || tweet.name.toLowerCase().includes(term)
            || tweet.handle.toLowerCase().includes(term))
        .sort((a, b) => b.time - a.time);

    timeline.replaceChildren(...visible.map((tweet) => {
        const el = createTweetElement(tweet);
        if (tweet.id === highlightId) el.classList.add("new");
        return el;
    }));

    emptyState.hidden = visible.length > 0;
}

// ===== كتابة تغريدة =====
function updateComposer() {
    const length = tweetInput.value.length;
    const remaining = MAX_LENGTH - length;

    charCount.textContent = remaining;
    charCount.classList.toggle("warning", remaining <= 20 && remaining > 0);
    charCount.classList.toggle("danger", remaining <= 0);

    submitButton.disabled = tweetInput.value.trim().length === 0;

    // تكبير صندوق الكتابة تلقائيًا مع النص
    tweetInput.style.height = "auto";
    tweetInput.style.height = tweetInput.scrollHeight + "px";
}

tweetInput.addEventListener("input", updateComposer);

tweetForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = tweetInput.value.trim();
    if (!text) return;

    const tweet = {
        id: createId(),
        name: CURRENT_USER.name,
        handle: CURRENT_USER.handle,
        text: text.slice(0, MAX_LENGTH),
        time: Date.now(),
        replies: 0,
        retweets: 0,
        likes: 0,
        liked: false,
        retweeted: false,
        mine: true,
    };

    tweets.push(tweet);
    saveTweets();

    tweetInput.value = "";
    searchInput.value = "";
    updateComposer();
    render(tweet.id);
});

// Ctrl + Enter للنشر بسرعة
tweetInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey) && !submitButton.disabled) {
        tweetForm.requestSubmit();
    }
});

function focusComposer(prefill = "") {
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (prefill && !tweetInput.value.startsWith(prefill)) {
        tweetInput.value = prefill + tweetInput.value;
    }
    tweetInput.focus();
    tweetInput.setSelectionRange(tweetInput.value.length, tweetInput.value.length);
    updateComposer();
}

sidebarTweetButton.addEventListener("click", () => focusComposer());

// ===== الإعجاب، إعادة التغريد، الرد، الحذف، الوسوم =====
timeline.addEventListener("click", (e) => {
    const hashtag = e.target.closest(".hashtag");
    if (hashtag) {
        searchInput.value = hashtag.dataset.tag;
        render();
        return;
    }

    const button = e.target.closest("[data-action]");
    if (!button) return;

    const id = button.closest(".tweet").dataset.id;
    const tweet = tweets.find((t) => t.id === id);
    if (!tweet) return;

    switch (button.dataset.action) {
        case "like":
            tweet.liked = !tweet.liked;
            tweet.likes += tweet.liked ? 1 : -1;
            break;
        case "retweet":
            tweet.retweeted = !tweet.retweeted;
            tweet.retweets += tweet.retweeted ? 1 : -1;
            break;
        case "reply":
            focusComposer(`@${tweet.handle} `);
            return;
        case "delete":
            tweets = tweets.filter((t) => t.id !== id);
            break;
    }

    saveTweets();
    render();
});

// ===== البحث والتريندات =====
searchInput.addEventListener("input", () => render());

document.querySelectorAll(".trend-item").forEach((trend) => {
    trend.addEventListener("click", () => {
        searchInput.value = trend.dataset.tag;
        render();
    });
});

// ===== المتابعة =====
document.querySelectorAll(".follow-btn").forEach((button) => {
    button.addEventListener("click", () => {
        const following = button.classList.toggle("following");
        button.textContent = following ? "تتابعه" : "متابعة";
    });
});

// روابط القائمة تجريبية: نمنع القفز لأعلى الصفحة
document.querySelectorAll('.nav-item, .logo').forEach((link) => {
    link.addEventListener("click", (e) => e.preventDefault());
});

// تحديث الأوقات النسبية كل دقيقة
setInterval(() => render(), 60000);

render();
updateComposer();
