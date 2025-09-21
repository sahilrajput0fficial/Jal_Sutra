document.addEventListener('DOMContentLoaded', () => {
    const currentPage = window.location.pathname.split('/').pop();

    const topNavItems = document.querySelectorAll('.nav-item');
    topNavItems.forEach(item => {
        const itemHref = item.getAttribute('href');
        if (itemHref && itemHref.includes(currentPage)) {
            item.classList.add('active');
        }
    });

    const sidebarItems = document.querySelectorAll('.sidebar-item');
    sidebarItems.forEach(item => {
        const itemHref = item.getAttribute('href');
        if (itemHref && itemHref.includes(currentPage)) {
            item.classList.add('active');
        }
    });

    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const statusMessage = document.getElementById('statusMessage');

            try {
                const response = await fetch('/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ username, password })
                });

                if (response.ok) {
                    statusMessage.textContent = 'Login successful! Redirecting...';
                    statusMessage.style.color = '#34d399';
                    setTimeout(() => {
                        window.location.href = 'dashboard.html';
                    }, 1000);
                } else {
                    const errorData = await response.json();
                    statusMessage.textContent = errorData.message || 'Invalid username or password.';
                    statusMessage.style.color = '#f87171';
                }
            } catch (error) {
                statusMessage.textContent = 'Login failed. Could not connect to the server.';
                statusMessage.style.color = '#f87171';
                console.error('Login error:', error);
            }
        });
    }

    const sampleForm = document.getElementById('sampleForm');
    if (sampleForm) {
        sampleForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const submitButton = document.getElementById('submitButton');
            const statusMessage = document.getElementById('statusMessage');

            submitButton.textContent = 'Submitting...';
            submitButton.disabled = true;

            try {
                const dataToSend = {
                    sampleId: document.getElementById('sampleId').value,
                    date: document.getElementById('date').value,
                    depth: parseFloat(document.getElementById('depth').value) || 0,
                    location: document.getElementById('location').value,
                    metals: {
                        lead: parseFloat(document.getElementById('lead').value) || 0,
                        cadmium: parseFloat(document.getElementById('cadmium').value) || 0,
                        chromium: parseFloat(document.getElementById('chromium').value) || 0,
                        arsenic: parseFloat(document.getElementById('arsenic').value) || 0,
                        mercury: parseFloat(document.getElementById('mercury').value) || 0,
                    }
                };
                
                const response = await fetch('/add-data', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(dataToSend)
                });

                if (response.ok) {
                    statusMessage.textContent = 'Sample data submitted successfully!';
                    statusMessage.style.color = '#34d399';
                    sampleForm.reset();
                } else {
                    const errorData = await response.json();
                    statusMessage.textContent = errorData.message || 'Submission failed. Please try again.';
                    statusMessage.style.color = '#f87171';
                }
                submitButton.textContent = 'Submit Sample';
                submitButton.disabled = false;

            } catch (error) {
                statusMessage.textContent = 'Submission failed. Please check your data.';
                statusMessage.style.color = '#f87171';
                console.error('Submission error:', error);
                submitButton.textContent = 'Submit Sample';
                submitButton.disabled = false;
            }
        });
    }

    // Water quality index calculation logic remains the same
    const standards = { lead: 0.01, cadmium: 0.003, chromium: 0.05, arsenic: 0.01, mercury: 0.006 };
    function calculateIndices() {
        const concentrations = {
            lead: parseFloat(document.getElementById('lead').value) || 0,
            cadmium: parseFloat(document.getElementById('cadmium').value) || 0,
            chromium: parseFloat(document.getElementById('chromium').value) || 0,
            arsenic: parseFloat(document.getElementById('arsenic').value) || 0,
            mercury: parseFloat(document.getElementById('mercury').value) || 0
        };
        const metals = Object.keys(standards);
        const n = metals.length;
        let sumWQi = 0; let sumW = 0; let hei = 0; let cd = 0; let sumCS = 0;
        metals.forEach((metal) => {
            const C = concentrations[metal]; const S = standards[metal];
            const W = 1 / S; const Q = (C / S) * 100;
            sumWQi += W * Q; sumW += W; hei += C / S; cd += (C / S) - 1; sumCS += C / S;
        });
        const hpi = sumWQi / sumW; const mcd = sumCS / n;
        const hpiInterp = hpi < 100 ? { text: 'Low Pollution', class: 'low' } : { text: 'High Pollution', class: 'high' };
        const heiInterp = hei < 10 ? { text: 'Low', class: 'low' } : (hei < 20 ? { text: 'Medium', class: 'medium' } : { text: 'High', class: 'high' });
        const cdInterp = cd < 1 ? { text: 'Low', class: 'low' } : (cd < 3 ? { text: 'Medium', class: 'medium' } : { text: 'High', class: 'high' });
        let mcdInterp;
        if (mcd < 1.5) mcdInterp = { text: 'Nil to Very Low', class: 'very-low' };
        else if (mcd < 2) mcdInterp = { text: 'Low', class: 'low' };
        else if (mcd < 4) mcdInterp = { text: 'Moderate', class: 'moderate' };
        else if (mcd < 8) mcdInterp = { text: 'High', class: 'high' };
        else if (mcd < 16) mcdInterp = { text: 'Very High', class: 'very-high' };
        else mcdInterp = { text: 'Ultra High', class: 'ultra-high' };
        const resultContent = document.getElementById('result-content');
        resultContent.innerHTML = `<div class="result-item">HPI: <span class="result-value">${hpi.toFixed(2)}</span> <span class="interpretation ${hpiInterp.class}">${hpiInterp.text}</span></div><div class="result-item">HEI: <span class="result-value">${hei.toFixed(2)}</span> <span class="interpretation ${heiInterp.class}">${heiInterp.text}</span></div><div class="result-item">Cd: <span class="result-value">${cd.toFixed(2)}</span> <span class="interpretation ${cdInterp.class}">${cdInterp.text}</span></div><div class="result-item">mCd: <span class="result-value">${mcd.toFixed(2)}</span> <span class="interpretation ${mcdInterp.class}">${mcdInterp.text}</span></div>`;
        document.getElementById('results').style.display = 'block';
    }
    function resetInputs() {
        ['lead', 'cadmium', 'chromium', 'arsenic', 'mercury'].forEach(id => {
            document.getElementById(id).value = '';
        });
        document.getElementById('results').style.display = 'none';
    }
    const calculationForm = document.getElementById('calculationForm');
    if (calculationForm) {
        calculationForm.addEventListener('submit', (e) => {
            e.preventDefault();
            calculateIndices();
        });
    }
    const resetButton = document.getElementById('resetButton');
    if (resetButton) {
        resetButton.addEventListener('click', resetInputs);
    }
});