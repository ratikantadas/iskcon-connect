// =====================================
// ISKCON Connect Visitor Registration
// =====================================

// 1. Declare HTML Element DOM References
const name = document.getElementById('name');
const mobile = document.getElementById('mobile');
const occupation = document.getElementById('occupation');
const place = document.getElementById('place');
const other = document.getElementById('otherPlace');

const steps = [...document.querySelectorAll('.step')];
let current = 0;

const progress = document.getElementById('progress');
const stepNo = document.getElementById('stepNumber');

const next = document.getElementById('nextBtn');
const prev = document.getElementById('prevBtn');
const submit = document.getElementById('submitBtn');
const form = document.getElementById('visitorForm');

const STORAGE_KEY = "iskconVisitorDraft";
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbz8GLZH06jzfM2bdYLSPrx2NodGgbSvIbdU1UtUh2lybc8EUR2weithOVOWP3WC5CQz/exec";

// ----------------------------
// Show Current Step
// ----------------------------
function showStep(index) {
    steps.forEach((step, i) => {
        step.classList.toggle("active", i === index);
    });

    prev.style.display = index === 0 ? "none" : "inline-block";
    next.style.display = index === steps.length - 1 ? "none" : "inline-block";
    submit.style.display = index === steps.length - 1 ? "inline-block" : "none";
    progress.style.width = ((index + 1) / steps.length) * 100 + "%";
    stepNo.textContent = index + 1;

    saveDraft();
}

// ----------------------------
// Validation
// ----------------------------
function validateStep() {
    switch (current) {
        case 0:
            return name.value.trim().length > 1;
        case 1:
            return /^[6-9]\d{9}$/.test(mobile.value.trim());
        case 2:
            return document.querySelector('input[name="gender"]:checked');
        case 3:
            return occupation.value !== "";
        case 4:
            if (place.value === "") return false;
            if (place.value === "Other") {
                return other.value.trim().length > 1;
            }
            return true;
        case 5:
            return document.querySelector('input[name="gita"]:checked') &&
                   document.querySelector('input[name="chant"]:checked');
    }
    return true;
}

// ----------------------------
// Next Button
// ----------------------------
next.onclick = () => {
    if (!validateStep()) {
        alert("Please complete this step correctly.");
        return;
    }
    current++;
    showStep(current);
};

// ----------------------------
// Previous Button
// ----------------------------
prev.onclick = () => {
    current--;
    showStep(current);
};

// ----------------------------
// Other Place
// ----------------------------
place.onchange = () => {
    if (place.value === "Other") {
        other.style.display = "block";
    } else {
        other.style.display = "none";
    }
    saveDraft();
};

// ----------------------------
// Auto Save
// ----------------------------
form.addEventListener("input", saveDraft);

function saveDraft() {
    const draft = {
        name: name.value,
        mobile: mobile.value,
        occupation: occupation.value,
        place: place.value,
        other: other.value,
        gender: (document.querySelector('input[name="gender"]:checked') || {}).value || "",
        gita: (document.querySelector('input[name="gita"]:checked') || {}).value || "",
        chant: (document.querySelector('input[name="chant"]:checked') || {}).value || "",
        step: current
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
}

// ----------------------------
// Restore Draft
// ----------------------------
(function restoreDraft() {
    let draft = localStorage.getItem(STORAGE_KEY);
    if (!draft) {
        showStep(0);
        return;
    }
    draft = JSON.parse(draft);

    name.value = draft.name || "";
    mobile.value = draft.mobile || "";
    occupation.value = draft.occupation || "";
    place.value = draft.place || "";
    other.value = draft.other || "";

    if (draft.place === "Other") {
        other.style.display = "block";
    }

    ["gender", "gita", "chant"].forEach(field => {
        if (draft[field]) {
            const el = document.querySelector(`input[name="${field}"][value="${draft[field]}"]`);
            if (el) el.checked = true;
        }
    });

    current = draft.step || 0;
    showStep(current);
})();

// ----------------------------
// Submit to Google Sheets
// ----------------------------
form.onsubmit = async function (e) {
    e.preventDefault();
    if (!validateStep()) return;

    submit.disabled = true;
    submit.textContent = "Registering...";

    const visitor = {
        timestamp: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
        name: name.value.trim(),
        mobile: mobile.value.trim(),
        gender: document.querySelector('input[name="gender"]:checked').value,
        occupation: occupation.value,
        place: place.value,
        otherPlace: other.value.trim(),
        gitaCourse: document.querySelector('input[name="gita"]:checked').value,
        chantDaily: document.querySelector('input[name="chant"]:checked').value
    };

    try {
        const response = await fetch(SCRIPT_URL, {
            method: "POST",
            mode: "cors",
            headers: {
                "Content-Type": "text/plain;charset=utf-8",
            },
            body: JSON.stringify(visitor)
        });

        const result = await response.json();

        if (result.status === "duplicate") {
            alert("🙏 " + result.message);
            return;
        }

        if (result.status === "success") {
            alert("🙏 Registration Successful!\n\nHare Krishna.");
            localStorage.removeItem(STORAGE_KEY);
            form.reset();
            other.style.display = "none";
            current = 0;
            showStep(0);
        } else {
            alert("Something went wrong. Please try again.");
        }

    } catch (err) {
        console.error("Submission Error:", err);
        alert("Network error. Please check your internet connection.");
    } finally {
        submit.disabled = false;
        submit.textContent = "Register";
    }
};