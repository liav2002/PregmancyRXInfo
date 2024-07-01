document.addEventListener('DOMContentLoaded', function() {
    const searchForm = document.getElementById('searchForm');
    const searchInput = document.getElementById('searchInput');
    const sortCriteria = document.getElementById('sortCriteria');
    const searchResults = document.getElementById('searchResults');
    const modal = document.getElementById('modal');
    const modalContent = document.querySelector('.modal-content');
    const modalClose = document.querySelector('.close');
    const modalTitle = document.getElementById('modal-title');
    const modalName = document.getElementById('modal-name');
    const modalGeneric = document.getElementById('modal-generic');
    const modalPregnancy = document.getElementById('modal-pregnancy');
    const modalMainTitle = document.getElementById('modal-main-title');
    const modalSecondTitle = document.getElementById('modal-second-title');
    const modalExplanation = document.getElementById('modal-explanation');
    const suggestionsList = document.getElementById('suggestions-list');
    const returnButton = document.createElement('button');
    let currentData = [];
    let originalData = [];
    let modalHistory = [];

    returnButton.textContent = 'חזור';
    returnButton.style.display = 'none';
    returnButton.addEventListener('click', () => {
        if (modalHistory.length > 0) {
            const previousModalData = modalHistory.pop();
            openModal(previousModalData, false);
        }
    });
    modalContent.insertBefore(returnButton, modalContent.firstChild);

    // Fetch data for autocomplete options
    fetch('/api/get_table_data')
        .then(response => response.json())
        .then(data => {
            currentData = data;
            originalData = [...data]; // Store a copy of the original data
            populateAutocompleteOptions(data);
            renderTable(data);
        })
        .catch(error => console.error('Error fetching autocomplete data:', error));

    function populateAutocompleteOptions(data) {
        const datalist = document.getElementById('searchOptions');
        const options = new Set();
        data.forEach(row => {
            const optionValue = `${row.names_of_medicines} (${row.Generic_name})`;
            options.add(optionValue);
        });
        options.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option;
            datalist.appendChild(optionElement);
        });
    }

    function renderTable(data) {
        searchResults.innerHTML = '';
        if (data.length > 0) {
            const table = document.createElement('table');
            const headers = ['names_of_medicines', 'Generic_name', 'pregnancy_safety', 'sec_title', 'main_title', 'explanation_medicine'];
            const headerRow = document.createElement('tr');
            headers.forEach(header => {
                const th = document.createElement('th');
                th.textContent = translateHeader(header);
                headerRow.appendChild(th);
            });
            table.appendChild(headerRow);

            data.forEach((row, index) => {
                const tr = document.createElement('tr');
                headers.forEach(header => {
                    const td = document.createElement('td');
                    if (header === 'pregnancy_safety' && row[header] === 'N') {
                        td.textContent = 'חסר מידע ביטחון לתרופה';
                    } else {
                        td.textContent = row[header];
                    }
                    tr.appendChild(td);
                });
                tr.addEventListener('click', () => openModal(row, true));
                table.appendChild(tr);
            });

            searchResults.appendChild(table);
        } else {
            searchResults.textContent = 'לא נמצאו תוצאות.';
        }
    }

    function translateHeader(header) {
        const translations = {
            'names_of_medicines': 'שמות תרופות',
            'Generic_name': 'שם גנרי',
            'pregnancy_safety': 'בטיחות בהריון',
            'sec_title': 'כותרת שניה',
            'main_title': 'כותרת ראשית',
            'explanation_medicine': 'הסבר'
        };
        return translations[header] || header;
    }

    function openModal(row, saveHistory = true) {
        if (saveHistory) {
            const currentModalData = {
                names_of_medicines: modalName.textContent,
                Generic_name: modalGeneric.textContent,
                pregnancy_safety: modalPregnancy.textContent,
                main_title: modalMainTitle.textContent,
                sec_title: modalSecondTitle.textContent,
                explanation_medicine: modalExplanation.textContent
            };
            if (currentModalData.names_of_medicines) {
                modalHistory.push(currentModalData);
            }
        }

        modalName.textContent = row.names_of_medicines;
        modalGeneric.textContent = row.Generic_name;
        modalPregnancy.textContent = row.pregnancy_safety === 'N' ? 'חסר מידע ביטחון לתרופה' : row.pregnancy_safety;
        modalMainTitle.textContent = row.main_title;
        modalSecondTitle.textContent = row.sec_title;
        modalExplanation.textContent = row.explanation_medicine;

        returnButton.style.display = modalHistory.length > 0 ? 'block' : 'none';
        fetchSuggestions(row.sec_title, row.pregnancy_safety);
        modal.style.display = 'block';
    }

    function fetchSuggestions(secTitle, pregnancySafety) {
        if (!secTitle || !pregnancySafety) {
            console.error('Invalid parameters for suggestions:', secTitle, pregnancySafety);
            return;
        }

        fetch('/api/suggestions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ secTitle, pregnancySafety })
        })
        .then(response => response.json())
        .then(data => {
            if (Array.isArray(data)) {
                suggestionsList.innerHTML = '';
                data.forEach(suggestion => {
                    const li = document.createElement('li');
                    const a = document.createElement('a');
                    a.href = '#';
                    a.textContent = `${suggestion.names_of_medicines} (${suggestion.Generic_name}) - לחץ כאן`;
                    a.addEventListener('click', (e) => {
                        e.preventDefault();
                        openModal(suggestion, true);
                    });
                    li.appendChild(a);
                    suggestionsList.appendChild(li);
                });
            } else {
                console.error('Unexpected response format:', data);
            }
        })
        .catch(error => console.error('Error fetching suggestions:', error));
    }

    function sortData(data, criteria) {
        if (criteria === "serial") {
            return originalData; // Return the original data order
        } else {
            return data.sort((a, b) => {
                const aValue = a[criteria] ? a[criteria].toString().toLowerCase() : '';
                const bValue = b[criteria] ? b[criteria].toString().toLowerCase() : '';
                if (aValue < bValue) return -1;
                if (aValue > bValue) return 1;
                return 0;
            });
        }
    }

    // Handle form submission
    searchForm.addEventListener('submit', function(event) {
        event.preventDefault();
        const query = searchInput.value.trim().toLowerCase().split(" ")[0]; // Extract medicine name

        fetch('/api/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query })
        })
        .then(response => response.json())
        .then(data => {
            currentData = data;
            originalData = [...data]; // Update original data for current search
            const sortedData = sortData(data, sortCriteria.value);
            renderTable(sortedData);
        })
        .catch(error => console.error('Error fetching search results:', error));
    });

    // Handle sorting change
    sortCriteria.addEventListener('change', function() {
        let sortedData;
        if (sortCriteria.value === "serial") {
            sortedData = originalData;
        } else {
            sortedData = sortData(currentData, sortCriteria.value);
        }
        renderTable(sortedData);
    });

    // Close the modal
    modalClose.addEventListener('click', function() {
        modal.style.display = 'none';
        returnButton.style.display = 'none';
        modalHistory = [];
        modalName.textContent = "";
    });

    // Close the modal when clicking outside of it
    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
            returnButton.style.display = 'none';
            modalHistory = [];
            modalName.textContent = "";
        }
    });
});
