const API_BASE = "https://financeflow-app-4uag.onrender.com";

let authToken = localStorage.getItem("financeToken") || null;

let currentUser = null; 
let transactions = [];

let currentPage = 1;

const itemsPerPage = 5;

let barChart = null;
let pieChart = null;
let monthlyChart = null;

let selectedUserId = null;

let removePhotoRequested = false;
async function apiRequest(path, options = {}) {

    const headers = {
        "Content-Type": "application/json",
        ...(options.headers || {})
    };

    if (authToken) {
        headers["Authorization"] = "Bearer " + authToken;
    }

    let response;

    try {

        response = await fetch(API_BASE + path, {
            ...options,
            headers
        });

    } catch (error) {
    console.error("API connection error:", error);
    console.error("Requested URL:", API_BASE + path);
    throw new Error(
        "Connection failed: " + error.message
    );
}

    let data = {};

    try {
        data = await response.json();
    } catch (error) {
        data = {};
    }

    if (!response.ok) {
        throw new Error(data.message || "Something went wrong.");
    }

    return data;

}


document.addEventListener("DOMContentLoaded", async function () {

    setupPhotoPreview();

    setupEditPhotoPreview();

    loadTheme();

    if (authToken) {

        try {

            const data = await apiRequest("/auth/me");

            currentUser = data.user;

            await showDashboard();

        } catch (error) {

            // token invalid/expired
            authToken = null;

            localStorage.removeItem("financeToken");

            showAuthScreen();

            showLogin();

        }

    } else {

        showAuthScreen();

        showLogin();

    }

});

function getElement(id) {
    return document.getElementById(id);
}

function showAuthScreen() {

    const authScreen = getElement("auth-screen");
    const dashboard = getElement("dashboard");

    if (authScreen) {
        authScreen.classList.remove("hidden");
    }

    if (dashboard) {
        dashboard.classList.add("hidden");
    }

}


function hideAuthScreen() {

    const authScreen = getElement("auth-screen");
    const dashboard = getElement("dashboard");

    if (authScreen) {
        authScreen.classList.add("hidden");
    }

    if (dashboard) {
        dashboard.classList.remove("hidden");
    }

}

function showLogin() {

    const signupForm = getElement("signup-form");
    const loginForm = getElement("login-form");

    if (signupForm) {
        signupForm.classList.add("hidden");
    }

    if (loginForm) {
        loginForm.classList.remove("hidden");
    }

    clearAuthMessage();

}


function showSignup() {

    const signupForm = getElement("signup-form");
    const loginForm = getElement("login-form");

    if (signupForm) {
        signupForm.classList.remove("hidden");
    }

    if (loginForm) {
        loginForm.classList.add("hidden");
    }

    clearAuthMessage();

}

function clearAuthMessage() {

    const box = getElement("auth-message");

    if (!box) {
        return;
    }

    box.textContent = "";
    box.className = "";

}


function showAuthMessage(message, type) {

    const box = getElement("auth-message");

    if (!box) {
        alert(message);
        return;
    }

    box.textContent = message;
    box.className = type;

}
function readPhotoFile(file) {

    return new Promise(function (resolve, reject) {

        if (!file) {
            resolve("");
            return;
        }

        if (!file.type.startsWith("image/")) {
            reject(
                new Error("Please select an image file.")
            );

            return;
        }

        const maxSize = 2 * 1024 * 1024;

        if (file.size > maxSize) {

            reject(
                new Error(
                    "Photo size must be less than 2 MB."
                )
            );

            return;
        }

        const reader = new FileReader();

        reader.onload = function () {
            resolve(reader.result);
        };

        reader.onerror = function () {
            reject(
                new Error("Unable to read image.")
            );
        };

        reader.readAsDataURL(file);

    });

}
function setupPhotoPreview() {

    const input = getElement("signup-photo");

    if (!input) {
        return;
    }

    input.addEventListener("change", function () {

        const file = input.files[0];

        const preview =
            getElement("signup-photo-preview");

        const image =
            getElement("signup-preview-image");

        if (!file) {

            if (preview) {
                preview.classList.add("hidden");
            }

            if (image) {
                image.src = "";
            }

            return;
        }

        if (!file.type.startsWith("image/")) {

            alert("Please select an image file.");

            input.value = "";

            return;
        }

        if (file.size > 2 * 1024 * 1024) {

            alert(
                "Photo size must be less than 2 MB."
            );

            input.value = "";

            return;
        }

        const reader = new FileReader();

        reader.onload = function (event) {

            if (image) {
                image.src = event.target.result;
            }

            if (preview) {
                preview.classList.remove("hidden");
            }

        };

        reader.readAsDataURL(file);

    });

}

async function signup() {

    const nameElement = getElement("signup-name");
    const emailElement = getElement("signup-email");
    const passwordElement = getElement("signup-password");
    const genderElement = getElement("signup-gender");
    const photoInput = getElement("signup-photo");

    if (!nameElement || !emailElement || !passwordElement || !genderElement) {

        alert("Signup form is missing in HTML.");

        return;
    }

    const name = nameElement.value.trim();
    const email = emailElement.value.trim().toLowerCase();
    const password = passwordElement.value;
    const gender = genderElement.value;

    const photoFile =
        photoInput && photoInput.files ? photoInput.files[0] : null;

    if (!name || !email || !password || !gender) {

        showAuthMessage("Please fill all required fields.", "error");

        return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {

        showAuthMessage("Please enter a valid email.", "error");

        return;
    }

    if (password.length < 4) {

        showAuthMessage(
            "Password must contain at least 4 characters.",
            "error"
        );

        return;
    }

    let photo = "";

    if (photoFile) {

        try {

            photo = await readPhotoFile(photoFile);

        } catch (error) {

            showAuthMessage(error.message, "error");

            return;
        }
    }

    try {

        const data = await apiRequest("/auth/signup", {
            method: "POST",
            body: JSON.stringify({ name, email, password, gender, photo })
        });

        authToken = data.token;

        localStorage.setItem("financeToken", authToken);

        currentUser = data.user;

        clearSignupForm();

        await showDashboard();

    } catch (error) {

        showAuthMessage(error.message, "error");

    }

}

function clearSignupForm() {

    const ids = [
        "signup-name",
        "signup-email",
        "signup-password",
        "signup-gender"
    ];

    ids.forEach(function (id) {

        const element = getElement(id);

        if (element) {
            element.value = "";
        }

    });

    const photoInput = getElement("signup-photo");
    const previewImage = getElement("signup-preview-image");
    const preview = getElement("signup-photo-preview");

    if (photoInput) {
        photoInput.value = "";
    }

    if (previewImage) {
        previewImage.src = "";
    }

    if (preview) {
        preview.classList.add("hidden");
    }

}

async function login() {

    const emailElement = getElement("login-email");
    const passwordElement = getElement("login-password");

    if (!emailElement || !passwordElement) {

        alert("Login form is missing in HTML.");

        return;
    }

    const email = emailElement.value.trim().toLowerCase();
    const password = passwordElement.value;

    if (!email || !password) {

        showAuthMessage("Please enter email and password.", "error");

        return;
    }

    try {

        const data = await apiRequest("/auth/login", {
            method: "POST",
            body: JSON.stringify({ email, password })
        });

        authToken = data.token;

        localStorage.setItem("financeToken", authToken);

        currentUser = data.user;

        await showDashboard();

    } catch (error) {

        showAuthMessage(error.message, "error");

    }

}

async function showDashboard() {

    hideAuthScreen();

    await loadUserTransactions();

    updateUserProfile();

    setDefaultDate();

    currentPage = 1;

    updateDashboard();

    await displayUsers();

    updateBudgetUI();

    updateGoalUI();

    updateHealthScore();

}

async function loadUserTransactions() {

    if (!currentUser) {

        transactions = [];

        return;
    }

    try {

        const data = await apiRequest("/transactions");

        transactions = data.transactions.map(function (item) {

            return {
                id: item._id,
                date: item.date,
                category: item.category,
                amount: item.amount,
                type: item.type,
                payment: item.payment,
                note: item.note
            };

        });

    } catch (error) {

        transactions = [];

        showNotification(error.message, "error");

    }

}
function updateUserProfile() {

    if (!currentUser) {
        return;
    }

    const userName = getElement("user-name");
    const dashboardUserName = getElement("dashboard-user-name");
    const userEmail = getElement("user-email");

    if (userName) {
        userName.textContent = currentUser.name;
    }

    if (dashboardUserName) {
        dashboardUserName.textContent = currentUser.name;
    }

    if (userEmail) {
        userEmail.textContent = currentUser.email;
    }

    const hour = new Date().getHours();

    let greeting;

    if (hour < 12) {
        greeting = "GOOD MORNING";
    } else if (hour < 17) {
        greeting = "GOOD AFTERNOON";
    } else {
        greeting = "GOOD EVENING";
    }

    const welcomeText = getElement("welcome-text");

    if (welcomeText) {
        welcomeText.textContent = greeting;
    }

    updateProfilePhoto();

}

function updateProfilePhoto() {

    const icon = getElement("profile-icon");
    const image = getElement("profile-image");

    if (!icon || !image) {
        return;
    }

    if (currentUser && currentUser.photo) {

        image.src = currentUser.photo;

        image.classList.remove("hidden");

        icon.classList.add("hidden");

    } else {

        image.src = "";

        image.classList.add("hidden");

        icon.className = getGenderIcon(
            currentUser ? currentUser.gender : "other"
        );

        icon.classList.remove("hidden");

    }

}
function getGenderIcon(gender) {

    if (gender === "male") {
        return "fa-solid fa-person";
    }

    if (gender === "female") {
        return "fa-solid fa-person-dress";
    }

    return "fa-solid fa-user";

}

function logout() {

    localStorage.removeItem("financeToken");

    authToken = null;

    currentUser = null;

    transactions = [];

    selectedUserId = null;

    destroyCharts();

    showAuthScreen();

    showLogin();

    const loginEmail = getElement("login-email");
    const loginPassword = getElement("login-password");

    if (loginEmail) {
        loginEmail.value = "";
    }

    if (loginPassword) {
        loginPassword.value = "";
    }

}

function switchAccount() {
    logout();
}
function setDefaultDate() {

    const dateInput = getElement("date");

    if (dateInput) {
        dateInput.value = getDateString(0);
    }

}


function getDateString(daysAgo) {

    const date = new Date();

    date.setDate(date.getDate() - Number(daysAgo || 0));

    const year = date.getFullYear();

    const month = String(date.getMonth() + 1).padStart(2, "0");

    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;

}

async function addTransaction() {

    if (!currentUser) {

        showNotification("Please login first.", "error");

        return;
    }

    const dateElement = getElement("date");
    const categoryElement = getElement("category");
    const amountElement = getElement("amount");
    const typeElement = getElement("type");
    const paymentElement = getElement("payment-method");
    const noteElement = getElement("transaction-note");

    if (!dateElement || !categoryElement || !amountElement || !typeElement) {

        alert("Transaction form is missing.");

        return;
    }

    const date = dateElement.value;
    const category = categoryElement.value.trim();
    const amount = Number(amountElement.value);
    const type = typeElement.value;

    const payment = paymentElement ? paymentElement.value : "Other";

    const note = noteElement ? noteElement.value.trim() : "";

    if (!date || !category || !amount || amount <= 0) {

        showNotification(
            "Please enter valid transaction details.",
            "error"
        );

        return;
    }

    try {

        await apiRequest("/transactions", {
            method: "POST",
            body: JSON.stringify({ date, category, amount, type, payment, note })
        });

        categoryElement.value = "";

        amountElement.value = "";

        if (noteElement) {
            noteElement.value = "";
        }

        currentPage = 1;

        await loadUserTransactions();

        updateDashboard();

        showNotification("Transaction added successfully!", "success");

    } catch (error) {

        showNotification(error.message, "error");

    }

}

function updateDashboard() {

    updateCards();

    updateFinancialStatus();

    displayTransactions();

    updateDailySummary();

    updateCategories();

    updateCharts();

    updateMonthlyChart();

    updateBudgetUI();

    updateGoalUI();

    updateHealthScore();

}
function calculateTotals() {

    let income = 0;

    let expense = 0;

    transactions.forEach(function (item) {

        const amount = Number(item.amount) || 0;

        if (item.type === "income") {

            income += amount;

        } else {

            expense += amount;

        }

    });

    return {
        income: income,
        expense: expense,
        balance: income - expense
    };

}

function updateCards() {

    const totals = calculateTotals();

    const incomeElement = getElement("income");
    const expenseElement = getElement("expense");
    const balanceElement = getElement("balance");
    const savingsElement = getElement("savings");

    if (incomeElement) {
        incomeElement.textContent = formatMoney(totals.income);
    }

    if (expenseElement) {
        expenseElement.textContent = formatMoney(totals.expense);
    }

    if (balanceElement) {
        balanceElement.textContent = formatMoney(totals.balance);
    }

    if (savingsElement) {
        savingsElement.textContent = formatMoney(totals.balance);
    }

    const today = getDateString(0);
    const yesterday = getDateString(1);

    const todayExpense = getElement("today-expense");
    const yesterdayExpense = getElement("yesterday-expense");

    if (todayExpense) {
        todayExpense.textContent = formatMoney(getExpenseByDate(today));
    }

    if (yesterdayExpense) {
        yesterdayExpense.textContent =
            formatMoney(getExpenseByDate(yesterday));
    }

    const todayDate = getElement("today-date");
    const yesterdayDate = getElement("yesterday-date");

    if (todayDate) {
        todayDate.textContent = formatDate(today);
    }

    if (yesterdayDate) {
        yesterdayDate.textContent = formatDate(yesterday);
    }

}

function updateFinancialStatus() {

    const totals = calculateTotals();

    const warningBox = getElement("money-warning");
    const title = getElement("warning-title");
    const message = getElement("warning-message");

    if (!warningBox || !title || !message) {
        return;
    }

    if (transactions.length === 0) {

        warningBox.className = "money-warning neutral";

        title.textContent = "Start managing your finances";

        message.textContent =
            "Add your income and expenses to see your financial status.";

        return;
    }

    if (totals.income > totals.expense) {

        const profit = totals.income - totals.expense;

        warningBox.className = "money-warning safe";

        title.textContent = "Your finances look healthy!";

        message.textContent =
            `Great job! You have saved ${formatMoney(
                profit
            )}. Your income is higher than your expenses.`;

    } else if (totals.expense > totals.income) {

        const loss = totals.expense - totals.income;

        warningBox.className = "money-warning danger";

        title.textContent = "Your expenses are higher!";

        message.textContent =
            `Your expenses are ${formatMoney(
                loss
            )} higher than your income. Try reducing unnecessary spending.`;

    } else {

        warningBox.className = "money-warning warning";

        title.textContent = "Income and expenses are equal";

        message.textContent =
            "There are currently no savings. Try increasing income or reducing expenses.";

    }

}
function getExpenseByDate(date) {

    return transactions

        .filter(function (item) {

            return item.date === date && item.type === "expense";

        })

        .reduce(function (total, item) {

            return total + (Number(item.amount) || 0);

        }, 0);

}
function displayTransactions() {

    const list = getElement("transaction-list");

    if (!list) {
        return;
    }

    list.innerHTML = "";

    const searchInput = getElement("transaction-search");

    const searchValue = searchInput
        ? searchInput.value.trim().toLowerCase()
        : "";

    const filtered = transactions.filter(function (item) {

        const text = (
            item.category +
            " " +
            item.type +
            " " +
            (item.payment || "") +
            " " +
            (item.note || "")
        ).toLowerCase();

        return text.includes(searchValue);

    });

    const totalPages = Math.max(
        1,
        Math.ceil(filtered.length / itemsPerPage)
    );

    if (currentPage > totalPages) {
        currentPage = totalPages;
    }

    const start = (currentPage - 1) * itemsPerPage;

    const end = start + itemsPerPage;

    const pageTransactions = filtered.slice(start, end);

    if (pageTransactions.length === 0) {

        list.innerHTML = `
            <tr>
                <td colspan="7">
                    No transactions found.
                </td>
            </tr>
        `;

        updatePagination(filtered.length);

        return;
    }

    pageTransactions.forEach(function (item) {

        const typeClass =
            item.type === "income" ? "type-income" : "type-expense";

        const amountClass =
            item.type === "income" ? "amount-income" : "amount-expense";

        list.innerHTML += `
            <tr>

                <td>
                    ${formatDate(item.date)}
                </td>

                <td>
                    ${escapeHTML(item.category)}
                </td>

                <td class="${typeClass}">
                    ${capitalize(item.type)}
                </td>

                <td>
                    <span class="payment-badge">
                        ${escapeHTML(item.payment || "Other")}
                    </span>
                </td>

                <td class="${amountClass}">
                    ${formatMoney(item.amount)}
                </td>

                <td class="note-cell">
                    ${escapeHTML(item.note || "—")}
                </td>

                <td>

                    <button
                        class="delete-btn"
                        onclick="deleteTransaction('${item.id}')"
                        type="button"
                        title="Delete"
                    >
                        <i class="fa-solid fa-trash"></i>
                    </button>

                </td>

            </tr>
        `;

    });

    updatePagination(filtered.length);

}

function searchTransactions() {

    currentPage = 1;

    displayTransactions();

}

async function deleteTransaction(id) {

    const confirmDelete = confirm(
        "Are you sure you want to delete this transaction?"
    );

    if (!confirmDelete) {
        return;
    }

    try {

        await apiRequest("/transactions/" + id, { method: "DELETE" });

        await loadUserTransactions();

        updateDashboard();

        showNotification("Transaction deleted successfully!", "success");

    } catch (error) {

        showNotification(error.message, "error");

    }

}

function updatePagination(filteredLength) {

    const pageNumber = getElement("page-number");
    const previousBtn = getElement("previous-btn");
    const nextBtn = getElement("next-btn");

    const totalItems =
        typeof filteredLength === "number"
            ? filteredLength
            : transactions.length;

    const totalPages = Math.max(
        1,
        Math.ceil(totalItems / itemsPerPage)
    );

    if (currentPage > totalPages) {
        currentPage = totalPages;
    }

    if (pageNumber) {

        pageNumber.textContent = `Page ${currentPage} of ${totalPages}`;

    }

    if (previousBtn) {
        previousBtn.disabled = currentPage === 1;
    }

    if (nextBtn) {
        nextBtn.disabled = currentPage === totalPages;
    }

}


function previousPage() {

    if (currentPage > 1) {

        currentPage--;

        displayTransactions();

    }

}


function nextPage() {

    const searchInput = getElement("transaction-search");

    const searchValue = searchInput
        ? searchInput.value.trim().toLowerCase()
        : "";

    const filteredLength = transactions.filter(function (item) {

        const text = (
            item.category +
            " " +
            item.type +
            " " +
            (item.payment || "") +
            " " +
            (item.note || "")
        ).toLowerCase();

        return text.includes(searchValue);

    }).length;

    const totalPages = Math.max(
        1,
        Math.ceil(filteredLength / itemsPerPage)
    );

    if (currentPage < totalPages) {

        currentPage++;

        displayTransactions();

    }

}

function updateDailySummary() {

    const summary = {};

    transactions.forEach(function (item) {

        if (item.type !== "expense") {
            return;
        }

        if (!summary[item.date]) {
            summary[item.date] = 0;
        }

        summary[item.date] += Number(item.amount) || 0;

    });

    const tbody = getElement("daily-summary");

    if (!tbody) {
        return;
    }

    tbody.innerHTML = "";

    const dates = Object.keys(summary).sort().reverse();

    if (dates.length === 0) {

        tbody.innerHTML = `
            <tr>
                <td colspan="2">
                    No expense data available.
                </td>
            </tr>
        `;

    } else {

        dates.forEach(function (date) {

            tbody.innerHTML += `
                <tr>

                    <td>
                        ${formatDate(date)}
                    </td>

                    <td>
                        ${formatMoney(summary[date])}
                    </td>

                </tr>
            `;

        });

    }

    const total = Object.values(summary).reduce(function (total, value) {
        return total + value;
    }, 0);

    const grandTotal = getElement("grand-total");

    if (grandTotal) {

        grandTotal.textContent = formatMoney(total);

    }

}
function updateCategories() {

    const totals = {};

    transactions.forEach(function (item) {

        if (item.type !== "expense") {
            return;
        }

        const category = String(item.category || "").trim();

        if (!category) {
            return;
        }

        if (!totals[category]) {
            totals[category] = 0;
        }

        totals[category] += Number(item.amount) || 0;

    });

    const container = getElement("category-list");

    if (!container) {
        return;
    }

    container.innerHTML = "";

    const entries = Object.entries(totals);

    if (entries.length === 0) {

        container.innerHTML =
            "<p>No expense categories available.</p>";

        return;
    }

    entries.sort(function (a, b) {
        return b[1] - a[1];
    });

    entries.forEach(function ([category, amount]) {

        container.innerHTML += `
            <div
                class="category-item"
                data-category="${escapeHTML(category.toLowerCase())}"
            >

                <div class="category-icon">

                    <i class="${getCategoryIcon(category)}"></i>

                </div>

                <div class="category-details">

                    <h3>
                        ${escapeHTML(category)}
                    </h3>

                    <p>
                        Total spending
                    </p>

                </div>

                <strong>
                    ${formatMoney(amount)}
                </strong>

            </div>
        `;

    });

}

function getCategoryIcon(category) {

    const value = String(category).toLowerCase();

    if (
        value.includes("food") ||
        value.includes("restaurant") ||
        value.includes("grocery")
    ) {
        return "fa-solid fa-utensils";
    }

    if (
        value.includes("travel") ||
        value.includes("transport") ||
        value.includes("uber") ||
        value.includes("taxi")
    ) {
        return "fa-solid fa-car";
    }

    if (value.includes("shopping") || value.includes("clothes")) {
        return "fa-solid fa-bag-shopping";
    }

    if (value.includes("rent") || value.includes("home")) {
        return "fa-solid fa-house";
    }

    if (value.includes("health") || value.includes("medicine")) {
        return "fa-solid fa-heart-pulse";
    }

    if (value.includes("education") || value.includes("book")) {
        return "fa-solid fa-book";
    }

    if (value.includes("bill") || value.includes("electric")) {
        return "fa-solid fa-lightbulb";
    }

    return "fa-solid fa-tag";

}
function searchCategory() {

    const searchInput = getElement("category-search");

    if (!searchInput) {
        return;
    }

    const value = searchInput.value.trim().toLowerCase();

    document.querySelectorAll(".category-item").forEach(function (item) {

        item.style.display = item.dataset.category.includes(value)
            ? "flex"
            : "none";

    });

}
function updateCharts() {

    if (typeof Chart === "undefined") {

        console.warn("Chart.js is not loaded.");

        return;
    }

    const barCanvas = getElement("barChart");
    const pieCanvas = getElement("pieChart");

    if (!barCanvas || !pieCanvas) {
        return;
    }

    const totals = {};

    transactions.forEach(function (item) {

        if (item.type !== "expense") {
            return;
        }

        const category = String(item.category || "").trim();

        if (!category) {
            return;
        }

        if (!totals[category]) {
            totals[category] = 0;
        }

        totals[category] += Number(item.amount) || 0;

    });

    const labels = Object.keys(totals);
    const values = Object.values(totals);

    if (barChart) {
        barChart.destroy();
        barChart = null;
    }

    if (pieChart) {
        pieChart.destroy();
        pieChart = null;
    }

    const chartLabels = labels.length ? labels : ["No Expense"];
    const chartValues = labels.length ? values : [0];

    barChart = new Chart(barCanvas, {

        type: "bar",

        data: {

            labels: chartLabels,

            datasets: [
                {
                    label: "Expense",

                    data: chartValues,

                    backgroundColor: "#5946c9",

                    borderRadius: 8
                }
            ]

        },

        options: {

            responsive: true,

            maintainAspectRatio: false,

            plugins: {

                legend: {
                    display: false
                }

            },

            scales: {

                y: {
                    beginAtZero: true
                }

            }

        }

    });

    pieChart = new Chart(pieCanvas, {

        type: "doughnut",

        data: {

            labels: chartLabels,

            datasets: [
                {
                    data: labels.length ? values : [1],

                    backgroundColor: [
                        "#5946c9",
                        "#15803d",
                        "#dc2626",
                        "#f59e0b",
                        "#0284c7",
                        "#7c3aed",
                        "#db2777"
                    ],

                    borderWidth: 2
                }
            ]

        },

        options: {

            responsive: true,

            maintainAspectRatio: false,

            cutout: "62%",

            plugins: {

                legend: {
                    position: "bottom"
                }

            }

        }

    });

}
function updateMonthlyChart() {

    if (typeof Chart === "undefined") {
        return;
    }

    const canvas = getElement("monthlyChart");

    if (!canvas) {
        return;
    }

    const monthlyData = {};

    transactions.forEach(function (item) {

        if (!item.date) {
            return;
        }

        const month = item.date.substring(0, 7);

        if (!monthlyData[month]) {

            monthlyData[month] = {
                income: 0,
                expense: 0
            };

        }

        const amount = Number(item.amount) || 0;

        if (item.type === "income") {

            monthlyData[month].income += amount;

        } else {

            monthlyData[month].expense += amount;

        }

    });

    const months = Object.keys(monthlyData).sort().slice(-6);

    const labels = months.map(function (month) {

        const date = new Date(month + "-01T00:00:00");

        return date.toLocaleDateString("en-IN", {
            month: "short",
            year: "numeric"
        });

    });

    const incomeValues = months.map(function (month) {

        return monthlyData[month].income;

    });

    const expenseValues = months.map(function (month) {

        return monthlyData[month].expense;

    });

    if (monthlyChart) {
        monthlyChart.destroy();
        monthlyChart = null;
    }

    monthlyChart = new Chart(canvas, {

        type: "line",

        data: {

            labels: labels.length ? labels : ["No Data"],

            datasets: [

                {
                    label: "Income",

                    data: labels.length ? incomeValues : [0],

                    borderColor: "#15803d",

                    backgroundColor: "rgba(21,128,61,0.12)",

                    fill: true,

                    tension: 0.35
                },

                {
                    label: "Expense",

                    data: labels.length ? expenseValues : [0],

                    borderColor: "#dc2626",

                    backgroundColor: "rgba(220,38,38,0.10)",

                    fill: true,

                    tension: 0.35
                }

            ]

        },

        options: {

            responsive: true,

            maintainAspectRatio: false,

            interaction: {
                mode: "index",
                intersect: false
            },

            scales: {

                y: {
                    beginAtZero: true
                }

            }

        }

    });

}
function destroyCharts() {

    if (barChart) {
        barChart.destroy();
        barChart = null;
    }

    if (pieChart) {
        pieChart.destroy();
        pieChart = null;
    }

    if (monthlyChart) {
        monthlyChart.destroy();
        monthlyChart = null;
    }

}
function editBudget() {

    const modal = getElement("budget-modal");
    const input = getElement("budget-input");

    if (!currentUser) {
        return;
    }

    if (input) {

        input.value = currentUser.budget || "";

    }

    if (modal) {
        modal.classList.add("active");
    }

}


function closeBudgetModal() {

    const modal = getElement("budget-modal");

    if (modal) {
        modal.classList.remove("active");
    }

}


async function saveBudget() {

    if (!currentUser) {
        return;
    }

    const input = getElement("budget-input");

    const budget = Number(input ? input.value : 0);

    if (budget < 0) {

        showNotification("Budget cannot be negative.", "error");

        return;
    }

    try {

        const data = await apiRequest("/auth/budget", {
            method: "PUT",
            body: JSON.stringify({ budget })
        });

        currentUser = data.user;

        updateBudgetUI();

        closeBudgetModal();

        showNotification("Monthly budget saved!", "success");

    } catch (error) {

        showNotification(error.message, "error");

    }

}


function updateBudgetUI() {

    if (!currentUser) {
        return;
    }

    const budget = Number(currentUser.budget || 0);

    const spent = getCurrentMonthExpense();

    const remaining = budget - spent;

    const budgetTotal = getElement("budget-total");
    const budgetSpent = getElement("budget-spent");
    const budgetRemaining = getElement("budget-remaining");
    const progress = getElement("budget-progress");
    const percentText = getElement("budget-percent");
    const status = getElement("budget-status");

    if (budgetTotal) {
        budgetTotal.textContent = formatMoney(budget);
    }

    if (budgetSpent) {
        budgetSpent.textContent = formatMoney(spent);
    }

    if (budgetRemaining) {

        budgetRemaining.textContent = formatMoney(Math.max(0, remaining));

    }

    let percentage = 0;

    if (budget > 0) {

        percentage = Math.round((spent / budget) * 100);

    }

    const progressWidth = Math.min(percentage, 100);

    if (progress) {

        progress.style.width = progressWidth + "%";

    }

    if (percentText) {

        percentText.textContent = `${percentage}% used`;

    }

    if (status) {

        if (budget === 0) {

            status.textContent = "Set a budget to begin";

        } else if (percentage >= 100) {

            status.textContent = "Budget exceeded!";

        } else if (percentage >= 80) {

            status.textContent = "Careful! Budget is almost used";

        } else {

            status.textContent = "You're within your budget";

        }

    }

}


function getCurrentMonthExpense() {

    const now = new Date();

    const year = now.getFullYear();

    const month = String(now.getMonth() + 1).padStart(2, "0");

    const prefix = `${year}-${month}`;

    return transactions

        .filter(function (item) {

            return (
                item.type === "expense" &&
                item.date &&
                item.date.startsWith(prefix)
            );

        })

        .reduce(function (total, item) {

            return total + Number(item.amount || 0);

        }, 0);

}

function editGoal() {

    const modal = getElement("goal-modal");
    const nameInput = getElement("goal-name");
    const targetInput = getElement("goal-target-input");

    if (!currentUser) {
        return;
    }

    const goal = currentUser.goal || { name: "", target: 0 };

    if (nameInput) {
        nameInput.value = goal.name || "";
    }

    if (targetInput) {
        targetInput.value = goal.target || "";
    }

    if (modal) {
        modal.classList.add("active");
    }

}


function closeGoalModal() {

    const modal = getElement("goal-modal");

    if (modal) {
        modal.classList.remove("active");
    }

}


async function saveGoal() {

    if (!currentUser) {
        return;
    }

    const nameInput = getElement("goal-name");
    const targetInput = getElement("goal-target-input");

    const name = nameInput ? nameInput.value.trim() : "";

    const target = Number(targetInput ? targetInput.value : 0);

    if (!name || target <= 0) {

        showNotification(
            "Please enter a goal name and target amount.",
            "error"
        );

        return;
    }

    try {

        const data = await apiRequest("/auth/goal", {
            method: "PUT",
            body: JSON.stringify({ name, target })
        });

        currentUser = data.user;

        updateGoalUI();

        closeGoalModal();

        showNotification("Savings goal saved!", "success");

    } catch (error) {

        showNotification(error.message, "error");

    }

}


function updateGoalUI() {

    if (!currentUser) {
        return;
    }

    const goal = currentUser.goal || { name: "", target: 0 };

    const target = Number(goal.target || 0);

    const saved = Math.max(0, calculateTotals().balance);

    const goalName = getElement("goal-name-display");
    const goalSaved = getElement("goal-saved");
    const goalTarget = getElement("goal-target");
    const goalProgress = getElement("goal-progress");
    const goalPercent = getElement("goal-percent");
    const goalRemaining = getElement("goal-remaining");
    const goalMessage = getElement("goal-message");

    if (goalName) {

        goalName.textContent =
            goal.name || "Create a goal for your future";

    }

    if (goalSaved) {
        goalSaved.textContent = formatMoney(saved);
    }

    if (goalTarget) {
        goalTarget.textContent = formatMoney(target);
    }

    let percentage = 0;

    if (target > 0) {

        percentage = Math.round((saved / target) * 100);

    }

    if (goalProgress) {

        goalProgress.style.width = Math.min(percentage, 100) + "%";

    }

    if (goalPercent) {

        goalPercent.textContent = `${percentage}% complete`;

    }

    if (goalRemaining) {

        if (target === 0) {

            goalRemaining.textContent = "Set a savings goal";

        } else if (saved >= target) {

            goalRemaining.textContent = "Goal achieved! 🎉";

        } else {

            goalRemaining.textContent =
                `${formatMoney(target - saved)} remaining`;

        }

    }

    if (goalMessage) {

        if (target === 0) {

            goalMessage.textContent =
                "Every small saving brings you closer to your goal.";

        } else if (saved >= target) {

            goalMessage.textContent =
                "Amazing! You have achieved your savings goal. 🎉";

        } else {

            goalMessage.textContent =
                `Keep going! You need ${formatMoney(
                    target - saved
                )} more to reach your goal.`;

        }

    }

}

function updateHealthScore() {

    const scoreElement = getElement("health-score");
    const titleElement = getElement("health-title");
    const messageElement = getElement("health-message");

    const circle = document.querySelector(".health-circle");

    if (!scoreElement || !titleElement || !messageElement || !circle) {
        return;
    }

    const totals = calculateTotals();

    let score = 0;

    if (transactions.length === 0) {

        score = 0;

    } else {

        if (totals.income > 0) {
            score += 30;
        }

        if (totals.income >= totals.expense) {

            score += 30;

        } else if (totals.expense < totals.income * 1.1) {

            score += 15;

        }

        const savingsRate =
            totals.income > 0
                ? ((totals.income - totals.expense) / totals.income) * 100
                : 0;

        if (savingsRate >= 30) {
            score += 30;
        } else if (savingsRate >= 20) {
            score += 25;
        } else if (savingsRate >= 10) {
            score += 15;
        } else if (savingsRate > 0) {
            score += 8;
        }

        if (currentUser && currentUser.budget > 0) {

            const budgetPercent =
                (getCurrentMonthExpense() / currentUser.budget) * 100;

            if (budgetPercent <= 80) {
                score += 10;
            } else if (budgetPercent <= 100) {
                score += 5;
            }

        }

    }

    score = Math.min(100, Math.round(score));

    scoreElement.textContent = score;

    let title;
    let message;

    if (score >= 80) {

        title = "Excellent";

        message = "Your financial habits look strong. Keep it up!";

    } else if (score >= 60) {

        title = "Good";

        message =
            "You're doing well. A little more saving can improve your score.";

    } else if (score >= 40) {

        title = "Needs Attention";

        message =
            "Try controlling expenses and increasing your savings.";

    } else {

        title = "Needs Improvement";

        message =
            "Start by tracking your income, expenses and monthly budget.";

    }

    titleElement.textContent = title;

    messageElement.textContent = message;

    const degrees = score * 3.6;

    circle.style.background = `
        radial-gradient(
            circle,
            var(--card) 57%,
            transparent 58%
        ),
        conic-gradient(
            var(--primary) 0deg,
            var(--primary) ${degrees}deg,
            var(--bg) ${degrees}deg
        )
    `;

}

async function displayUsers() {

    const totalUsers = getElement("total-users");
    const container = getElement("users-list");

    if (!container || !currentUser) {
        return;
    }

    if (totalUsers) {
        totalUsers.textContent = 1;
    }

    const user = currentUser;

    const photoHTML = user.photo
        ? `
            <img
                src="${user.photo}"
                alt="${escapeHTML(user.name)}"
            >
        `
        : `
            <i class="${getGenderIcon(user.gender)}"></i>
        `;

    container.innerHTML = `
        <div
            class="user-card"
            data-name="${escapeHTML(user.name.toLowerCase())}"
        >

            <div class="user-card-top">

                <div class="user-avatar">
                    ${photoHTML}
                </div>

                <div class="user-info">

                    <h3>
                        ${escapeHTML(user.name)}
                    </h3>

                    <p>
                        ${escapeHTML(user.email)}
                    </p>

                </div>

            </div>

            <div class="user-card-actions">

                <button
                    class="view-data-btn"
                    onclick="viewUserData('${user.id}')"
                    type="button"
                >
                    <i class="fa-solid fa-eye"></i>
                    View Data
                </button>

            </div>

        </div>
    `;

}
function searchUsers() {

    const searchInput = getElement("user-search");

    if (!searchInput) {
        return;
    }

    const value = searchInput.value.trim().toLowerCase();

    document.querySelectorAll(".user-card").forEach(function (user) {

        user.style.display = user.dataset.name.includes(value)
            ? "flex"
            : "none";

    });

}
async function viewUserData(id) {

    selectedUserId = id;

    let data;

    try {

        data = await apiRequest("/users/" + id);

    } catch (error) {

        showNotification(error.message, "error");

        return;
    }

    const user = data.user;

    const income = data.income;
    const expense = data.expense;
    const balance = data.balance;

    let status;

    if (income > expense) {

        status = "Healthy";

    } else if (expense > income) {

        status = "In Loss";

    } else {

        status = "Balanced";

    }

    const photoHTML = user.photo
        ? `
            <img
                src="${user.photo}"
                alt="Profile"
                class="user-data-photo"
            >
        `
        : `
            <div class="user-data-default-photo">

                <i class="${getGenderIcon(user.gender)}"></i>

            </div>
        `;

    const body = getElement("user-data-body");

    if (!body) {
        return;
    }

    body.innerHTML = `

        ${photoHTML}

        <div class="user-data-row">
            <span>Name</span>
            <span>
                ${escapeHTML(user.name)}
            </span>
        </div>

        <div class="user-data-row">
            <span>Email</span>
            <span>
                ${escapeHTML(user.email)}
            </span>
        </div>

        <div class="user-data-row">
            <span>Gender</span>
            <span>
                ${capitalize(user.gender)}
            </span>
        </div>

        <div class="user-data-row">
            <span>Total Income</span>
            <span>
                ${formatMoney(income)}
            </span>
        </div>

        <div class="user-data-row">
            <span>Total Expense</span>
            <span>
                ${formatMoney(expense)}
            </span>
        </div>

        <div class="user-data-row">
            <span>Savings</span>
            <span>
                ${formatMoney(balance)}
            </span>
        </div>

        <div class="user-data-row">
            <span>Budget</span>
            <span>
                ${formatMoney(user.budget || 0)}
            </span>
        </div>

        <div class="user-data-row">
            <span>Financial Status</span>
            <span>
                ${status}
            </span>
        </div>

    `;

    const modal = getElement("user-data-modal");

    if (modal) {
        modal.classList.add("active");
    }

}

function closeUserDataModal() {

    const modal = getElement("user-data-modal");

    if (modal) {
        modal.classList.remove("active");
    }

}

async function deleteUser(id) {

    const confirmDelete = confirm(
        "Delete this user's account and all transaction data permanently?"
    );

    if (!confirmDelete) {
        return;
    }

    try {

        await apiRequest("/users/" + id, { method: "DELETE" });

        if (currentUser && currentUser.id === id) {

            logout();

            return;
        }

        closeUserDataModal();

        await displayUsers();

        showNotification("User deleted successfully!", "success");

    } catch (error) {

        showNotification(error.message, "error");

    }

}
function deleteUserFromModal() {

    if (selectedUserId) {

        deleteUser(selectedUserId);

    }

}
function openProfileModal() {

    if (!currentUser) {
        return;
    }

    const editName = getElement("edit-name");
    const editEmail = getElement("edit-email");
    const editGender = getElement("edit-gender");
    const editPhoto = getElement("edit-photo");
    const modal = getElement("profile-modal");

    if (editName) {
        editName.value = currentUser.name;
    }

    if (editEmail) {
        editEmail.value = currentUser.email;
    }

    if (editGender) {
        editGender.value = currentUser.gender || "other";
    }

    removePhotoRequested = false;

    updateEditProfilePhoto();

    if (editPhoto) {
        editPhoto.value = "";
    }

    if (modal) {
        modal.classList.add("active");
    }

}
function setupEditPhotoPreview() {

    const input = getElement("edit-photo");

    if (!input) {
        return;
    }

    input.addEventListener("change", function () {

        const file = input.files[0];

        if (!file) {
            return;
        }

        if (!file.type.startsWith("image/")) {

            alert("Please select an image file.");

            input.value = "";

            return;
        }

        if (file.size > 2 * 1024 * 1024) {

            alert("Photo size must be less than 2 MB.");

            input.value = "";

            return;
        }

        const reader = new FileReader();

        reader.onload = function (event) {

            const image = getElement("edit-profile-image");
            const icon = getElement("edit-profile-icon");

            if (image) {

                image.src = event.target.result;

                image.classList.remove("hidden");

            }

            if (icon) {

                icon.classList.add("hidden");

            }

            removePhotoRequested = false;

        };

        reader.readAsDataURL(file);

    });

}

function updateEditProfilePhoto() {

    const image = getElement("edit-profile-image");
    const icon = getElement("edit-profile-icon");

    if (!image || !icon) {
        return;
    }

    if (currentUser && currentUser.photo && !removePhotoRequested) {

        image.src = currentUser.photo;

        image.classList.remove("hidden");

        icon.classList.add("hidden");

    } else {

        image.src = "";

        image.classList.add("hidden");

        icon.className = getGenderIcon(
            currentUser ? currentUser.gender : "other"
        );

        icon.classList.remove("hidden");

    }

}

function removeProfilePhoto() {

    removePhotoRequested = true;

    const editPhoto = getElement("edit-photo");

    if (editPhoto) {
        editPhoto.value = "";
    }

    updateEditProfilePhoto();

}

function closeProfileModal() {

    const modal = getElement("profile-modal");

    if (modal) {
        modal.classList.remove("active");
    }

}
async function saveProfile() {

    if (!currentUser) {
        return;
    }

    const editName = getElement("edit-name");
    const editEmail = getElement("edit-email");
    const editGender = getElement("edit-gender");
    const photoInput = getElement("edit-photo");

    if (!editName || !editEmail || !editGender) {

        alert("Profile form is missing in HTML.");

        return;
    }

    const name = editName.value.trim();
    const email = editEmail.value.trim().toLowerCase();
    const gender = editGender.value;

    const photoFile =
        photoInput && photoInput.files ? photoInput.files[0] : null;

    if (!name || !email) {

        alert("Please fill all fields.");

        return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {

        alert("Please enter a valid email.");

        return;
    }

    let photo = "";

    if (photoFile) {

        try {

            photo = await readPhotoFile(photoFile);

        } catch (error) {

            alert(error.message);

            return;
        }

    }

    try {

        const data = await apiRequest("/auth/me", {
            method: "PUT",
            body: JSON.stringify({
                name,
                email,
                gender,
                photo: photo || undefined,
                removePhoto: removePhotoRequested
            })
        });

        currentUser = data.user;

        removePhotoRequested = false;

        updateUserProfile();

        await displayUsers();

        closeProfileModal();

        showNotification("Profile updated successfully!", "success");

    } catch (error) {

        alert(error.message);

    }

}

function openQuickAdd() {

    const modal = getElement("quick-add-modal");

    if (modal) {
        modal.classList.add("active");
    }

}


function closeQuickAdd() {

    const modal = getElement("quick-add-modal");

    if (modal) {
        modal.classList.remove("active");
    }

}


async function saveQuickAdd() {

    if (!currentUser) {
        return;
    }

    const amountInput = getElement("quick-amount");
    const categoryInput = getElement("quick-category");
    const paymentInput = getElement("quick-payment");

    const amount = Number(amountInput ? amountInput.value : 0);

    const category = categoryInput ? categoryInput.value.trim() : "";

    const payment = paymentInput ? paymentInput.value : "Other";

    if (!amount || amount <= 0 || !category) {

        showNotification("Enter amount and category.", "error");

        return;
    }

    try {

        await apiRequest("/transactions", {
            method: "POST",
            body: JSON.stringify({
                date: getDateString(0),
                category,
                amount,
                type: "expense",
                payment,
                note: "Quick Add"
            })
        });

        if (amountInput) {
            amountInput.value = "";
        }

        if (categoryInput) {
            categoryInput.value = "";
        }

        closeQuickAdd();

        currentPage = 1;

        await loadUserTransactions();

        updateDashboard();

        showNotification("Quick expense added!", "success");

    } catch (error) {

        showNotification(error.message, "error");

    }

}
function toggleTheme() {

    document.body.classList.toggle("dark-mode");

    const isDark = document.body.classList.contains("dark-mode");

    localStorage.setItem("financeTheme", isDark ? "dark" : "light");

    updateThemeButton();

}


function loadTheme() {

    const theme = localStorage.getItem("financeTheme");

    if (theme === "dark") {

        document.body.classList.add("dark-mode");

    }

    updateThemeButton();

}


function updateThemeButton() {

    const icon = getElement("theme-icon");
    const text = getElement("theme-text");

    const isDark = document.body.classList.contains("dark-mode");

    if (icon) {

        icon.className = isDark ? "fa-solid fa-sun" : "fa-solid fa-moon";

    }

    if (text) {

        text.textContent = isDark ? "Light Mode" : "Dark Mode";

    }

}
function formatMoney(amount) {

    const number = Number(amount) || 0;

    return "₹" + number.toLocaleString("en-IN");

}
function formatDate(date) {

    if (!date) {
        return "";
    }

    const parsedDate = new Date(date + "T00:00:00");

    if (Number.isNaN(parsedDate.getTime())) {
        return date;
    }

    return parsedDate.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });

}

function capitalize(value) {

    if (!value) {
        return "";
    }

    return value.charAt(0).toUpperCase() + value.slice(1);

}

function escapeHTML(value) {

    return String(value ?? "")

        .replace(/&/g, "&amp;")

        .replace(/</g, "&lt;")

        .replace(/>/g, "&gt;")

        .replace(/"/g, "&quot;")

        .replace(/'/g, "&#039;");

}

function showNotification(message, type = "success") {

    const notification = getElement("dashboard-notification");

    if (!notification) {

        alert(message);

        return;
    }

    notification.textContent = message;

    notification.className = "dashboard-notification " + type;

    notification.style.display = "block";

    setTimeout(function () {

        notification.style.display = "none";

    }, 3000);

}

document.addEventListener("click", function (event) {

    const modalIds = [
        "profile-modal",
        "user-data-modal",
        "budget-modal",
        "goal-modal",
        "quick-add-modal"
    ];

    modalIds.forEach(function (id) {

        const modal = getElement(id);

        if (modal && event.target === modal) {

            modal.classList.remove("active");

        }

    });

});

document.addEventListener("keydown", function (event) {

    if (event.key !== "Escape") {
        return;
    }

    closeProfileModal();

    closeUserDataModal();

    closeBudgetModal();

    closeGoalModal();

    closeQuickAdd();

});

document.querySelectorAll(".sidebar-menu a").forEach(function (link) {

    link.addEventListener("click", function () {

        document.querySelectorAll(".sidebar-menu a").forEach(function (item) {

            item.classList.remove("active");

        });

        link.classList.add("active");

    });

});