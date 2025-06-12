document.addEventListener('DOMContentLoaded', () => {
    let allInstancesData = [];

    loadQueueStatuses(false);
    setInterval(() => loadQueueStatuses(true), 30000);

    const searchInput = document.getElementById('instance-search-input');
    const sortSelect = document.getElementById('sort-select');

    searchInput.addEventListener('input', filterAndRenderInstances);
    sortSelect.addEventListener('change', filterAndRenderInstances);

    function filterAndRenderInstances() {
        const searchTerm = searchInput.value.toLowerCase();
        const sortValue = sortSelect.value;

        let filteredData = allInstancesData.filter(instance =>
            instance.instanceName.toLowerCase().includes(searchTerm)
        );

        sortInstances(filteredData, sortValue);

        renderAccordion(filteredData);
    }

    /**
     * Fetches queue statuses from the API.
     * @param {boolean} isUpdate - True if this is a background refresh.
     */
    async function loadQueueStatuses(isUpdate = false) {
        const loadingIndicator = document.getElementById('loading-indicator');
        if (!isUpdate) {
            loadingIndicator.style.display = 'block';
        }

        try {
            const response = await fetch('/api/InstanceMonitor', { method: 'GET' });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: `Error ${response.status} fetching queue data.` }));
                throw new Error(errorData.message);
            }

            allInstancesData = await response.json();
            filterAndRenderInstances();

        } catch (error) {
            console.error('Failed to load queue statuses:', error);
            showAlert(`Failed to load data: ${error.message}`, 'danger');
        } finally {
            if (!isUpdate) {
                loadingIndicator.style.display = 'none';
            }
        }
    }

    /**
     * Renders the entire accordion container based on the provided data.
     * @param {Array} instancesData - The array of instances to display.
     */
    function renderAccordion(instancesData) {
        const container = document.getElementById('queues-accordion-container');
        container.innerHTML = '';
        if (!instancesData || instancesData.length === 0) {
            container.innerHTML = '<div class="alert alert-info">Nenhuma instância encontrada para os filtros aplicados.</div>';
            return;
        }
        instancesData.forEach((instance, index) => {
            const instanceAccordionItem = createInstanceAccordionItem(instance, index);
            container.appendChild(instanceAccordionItem);
        });
    }

    const getQueueStatusText = (queue) => {
        if (!queue.enabled) return 'Inativo';
        if (queue.connected && queue.authenticated) return 'Conectado';
        return 'Desconectado';
    };

    /**
     * Sorts an array of instances based on a specified criterion.
     * @param {Array} instancesArray - The array of instances to sort.
     * @param {string} sortBy - The sorting criterion (e.g., 'name-asc', 'disconnected-desc').
     */
    function sortInstances(instancesArray, sortBy) {
        const countStatus = (instance, status) => {
            if (!instance.queues) return 0;
            return instance.queues.filter(q => getQueueStatusText(q) === status).length;
        };

        const countProblems = (instance) => {
            return countStatus(instance, 'Desconectado') + countStatus(instance, 'Inativo');
        }

        instancesArray.sort((a, b) => {
            switch (sortBy) {
                case 'critical-status-desc':
                    return countProblems(b) - countProblems(a);
                case 'disconnected-desc':
                    return countStatus(b, 'Desconectado') - countStatus(a, 'Desconectado');
                case 'connected-desc':
                    return countStatus(b, 'Conectado') - countStatus(a, 'Conectado');
                case 'inactive-desc':
                    return countStatus(b, 'Inativo') - countStatus(a, 'Inativo');
                case 'name-asc':
                default:
                    return a.instanceName.localeCompare(b.instanceName);
            }
        });
    }


    /**
     * Creates a full accordion item for a single instance.
     * @param {object} instanceData - The data for one instance.
     * @param {number} index - The unique index for the item.
     * @returns {HTMLElement} The created accordion item div.
     */
    function createInstanceAccordionItem(instanceData, index) {
        const accordionItemId = `instance-collapse-${index}`;
        const headerId = `instance-header-${index}`;

        const accordionItemDiv = document.createElement('div');
        accordionItemDiv.className = 'accordion-item';
        accordionItemDiv.dataset.instanceName = instanceData.instanceName;

        const headerHtml = `
            <h2 class="accordion-header d-flex align-items-center" id="${headerId}">
                <a href="https://${escapeHtml(instanceData.instanceName)}.alochat.com.br" target="_blank" class="btn btn-sm btn-outline-primary ms-2 me-1 flex-shrink-0" title="Abrir painel da instância">
                    <i class="fas fa-external-link-alt"></i>
                </a>
                <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#${accordionItemId}" aria-expanded="false" aria-controls="${accordionItemId}">
                    <div class="d-flex align-items-center w-100">
                        <i class="fas fa-server me-2"></i>
                        <strong class="flex-grow-1">${escapeHtml(instanceData.instanceName)}</strong>
                        <div class="instance-summary-badges"></div>
                    </div>
                </button>
            </h2>`;

        const bodyHtml = `
            <div id="${accordionItemId}" class="accordion-collapse collapse" aria-labelledby="${headerId}">
                <div class="accordion-body p-2">
                    <div class="table-responsive">
                        <table class="table table-hover table-sm mb-0">
                            <thead class="table-light">
                                <tr>
                                    <th>Status</th>
                                    <th>Nome da Fila</th>
                                    <th>Abertos</th>
                                    <th>Na Fila</th>
                                    <th>Ag. Logados</th>
                                </tr>
                            </thead>
                            <tbody></tbody>
                        </table>
                    </div>
                </div>
            </div>`;

        accordionItemDiv.innerHTML = headerHtml + bodyHtml;
        updateInstanceAccordionItem(accordionItemDiv, instanceData);
        return accordionItemDiv;
    }

    /**
     * Updates the content of an existing accordion item.
     * @param {HTMLElement} element - The accordion item div to update.
     * @param {object} instanceData - The new data for the instance.
     */
    function updateInstanceAccordionItem(element, instanceData) {
        const hasQueues = instanceData.queues && instanceData.queues.length > 0;
        let summaryHtml = '';
        let tableBodyHtml = '<tr><td colspan="5" class="text-center text-muted">Nenhuma fila encontrada para esta instância.</td></tr>';

        if (hasQueues) {
            const connectedQueues = instanceData.queues.filter(q => getQueueStatusText(q) === 'Conectado').length;
            const disconnectedQueues = instanceData.queues.filter(q => getQueueStatusText(q) === 'Desconectado').length;
            const inactiveQueues = instanceData.queues.filter(q => getQueueStatusText(q) === 'Inativo').length;

            const badges = [];
            if (disconnectedQueues > 0) badges.push(`<span class="badge rounded-pill bg-danger summary-badge" title="${disconnectedQueues} fila(s) desconectada(s)"><i class="fas fa-times-circle me-1"></i>${disconnectedQueues}</span>`);
            if (inactiveQueues > 0) badges.push(`<span class="badge rounded-pill bg-secondary summary-badge" title="${inactiveQueues} fila(s) inativa(s)"><i class="fas fa-power-off me-1"></i>${inactiveQueues}</span>`);
            if (connectedQueues > 0) badges.push(`<span class="badge rounded-pill bg-success summary-badge" title="${connectedQueues} fila(s) conectada(s)"><i class="fas fa-check-circle me-1"></i>${connectedQueues}</span>`);
            summaryHtml = badges.join('');

            tableBodyHtml = instanceData.queues.map(queue => {
                const statusText = getQueueStatusText(queue);
                const statusClass = statusText.toLowerCase().replace(' ', '-');
                return `
                    <tr>
                        <td><span class="status-dot status-${statusClass}"></span>${escapeHtml(statusText)}</td>
                        <td>${escapeHtml(queue.name)}</td>
                        <td>${queue.openChats}</td>
                        <td>${queue.chatsOnQueue}</td>
                        <td>${queue.loggedAgentsCount}</td>
                    </tr>`;
            }).join('');
        } else {
             summaryHtml = `<span class="badge rounded-pill bg-info-subtle text-info-emphasis summary-badge">Sem filas</span>`;
        }

        element.querySelector('.instance-summary-badges').innerHTML = summaryHtml;
        element.querySelector('tbody').innerHTML = tableBodyHtml;
    }

    /**
     * Shows a dismissible alert message at the top of the page.
     * @param {string} message - The message to display.
     * @param {string} type - The Bootstrap alert type (e.g., 'danger', 'success').
     * @param {number} duration - How long the alert should be visible (in ms).
     */
    function showAlert(message, type = 'danger', duration = 7000) {
        const alertsContainer = document.getElementById('alerts');
        if (!alertsContainer) {
            console.error("Alerts container not found");
            return;
        }

        const alertId = `alert-${Date.now()}`;
        const alertDiv = document.createElement('div');
        alertDiv.id = alertId;
        alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
        alertDiv.setAttribute('role', 'alert');
        alertDiv.innerHTML = `
            ${escapeHtml(message)}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;

        alertsContainer.appendChild(alertDiv);

        setTimeout(() => {
            const activeAlert = document.getElementById(alertId);
            if (activeAlert) {
                bootstrap.Alert.getOrCreateInstance(activeAlert).close();
            }
        }, duration);
    }

    /**
     * Escapes HTML to prevent XSS attacks.
     * @param {*} unsafe - The potentially unsafe string.
     * @returns {string} The sanitized string.
     */
    function escapeHtml(unsafe) {
        const text = unsafe === null || unsafe === undefined ? '' : String(unsafe);
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
});
