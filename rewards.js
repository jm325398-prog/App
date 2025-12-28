// ============================================
// CONFIGURAÃ‡ÃƒO
// ============================================

const CONFIG = {
    API_URL: 'reward_system.js',
    MIN_SWIPE: 50,
    CARD_REMOVE_DELAY: 4000,
    ANIMATION_DELAY: 500
};

// ============================================
// CLASSE API - Comunicação com Backend
// ============================================

class ApiService {
    static async call(action, data = {}) {
        const formData = new FormData();
        formData.append('action', action);
        Object.entries(data).forEach(([k, v]) => formData.append(k, v));

        try {
            const res = await fetch(CONFIG.API_URL, { method: 'POST', body: formData });
            return await res.json();
        } catch (e) {
            console.error('Erro API:', e);
            return { success: false, message: 'Erro de comunicação.' };
        }
    }
}

// ============================================
// CLASSE UTILS - Funções Utilitárias
// ============================================

class Utils {
    static formatTime(sec) {
        const h = Math.floor(sec / 3600);
        const m = Math.floor((sec % 3600) / 60);
        const s = sec % 60;
        const pad = n => String(n).padStart(2, '0');
        
        if (h) return `${h}h ${pad(m)}m ${pad(s)}s`;
        if (m) return `${pad(m)}m ${pad(s)}s`;
        return `${pad(s)}s`;
    }

    static getElement(id) {
        return document.getElementById(id);
    }
}

// ============================================
// CLASSE TIMER - Gerenciamento de Timers
// ============================================

class TimerManager {
    constructor() {
        this.timers = {};
    }

    start(rewardsData, trackElement) {
        this.clearAll();

        rewardsData.forEach(reward => {
            const el = trackElement.querySelector(`[data-reward-id="${reward.id}"] .chest-timer`);
            if (!el) return;

            const expiresAt = +el.dataset.expiresAt;
            this.timers[reward.id] = setInterval(() => this.tick(el, expiresAt, reward.id), 1000);
            this.tick(el, expiresAt, reward.id);
        });
    }

    tick(element, expiresAt, rewardId) {
        const remaining = expiresAt - Math.floor(Date.now() / 1000);

        if (remaining <= 0) {
            element.textContent = 'EXPIRADO';
            element.classList.add('critical');
            this.clear(rewardId);
            return;
        }

        element.textContent = Utils.formatTime(remaining);
        element.classList.toggle('warning', remaining < 3600);
        element.classList.toggle('critical', remaining < 600);
    }

    clear(rewardId) {
        if (this.timers[rewardId]) {
            clearInterval(this.timers[rewardId]);
            delete this.timers[rewardId];
        }
    }

    clearAll() {
        Object.values(this.timers).forEach(clearInterval);
        this.timers = {};
    }
}

// ============================================
// CLASSE CAROUSEL - Gerenciamento do Carrossel
// ============================================

class Carousel {
    constructor(trackElement, navElement) {
        this.track = trackElement;
        this.nav = navElement;
        this.currentIndex = 0;
        this.total = 0;
    }

    render(rewards, config) {
        const active = rewards.filter(r => r.hasReward);
        this.total = active.length;

        if (!active.length) {
            this.hide();
            return;
        }

        this.show();
        if (this.currentIndex >= this.total) this.currentIndex = 0;

        this.track.innerHTML = active.map(r => this.createCardHtml(r, config)).join('');
        this.renderDots();
        this.update();
    }

    createCardHtml(r, config) {
        return `
            <div class="reward-card" data-reward-id="${r.id}">
                <div class="reward-subtitle">${r.title}</div>
                <div class="chest-wrap ${!r.hasReward ? 'is-open' : ''}">
                    <img src="${r.chestClosedImg}" class="chest-img closed">
                    <img src="${r.chestOpenImg}" class="chest-img open">
                    <div class="chest-overlay">
                        <div class="chest-badge">${r.value}</div>
                        <button class="chest-open ${r.hasReward ? 'open-chest-btn' : 'claimed'}" 
                            ${!r.hasReward ? 'disabled' : ''} 
                            data-reward-id="${r.id}"
                            data-reward-title="${r.title}"
                            data-reward-value="${r.value}"
                            data-reward-source="${r.source}">
                            ${r.hasReward ? config.openButtonText : config.claimedButtonText}
                        </button>
                    </div>
                    <div class="chest-meta">Fonte: ${r.source}</div>
                    <div class="chest-timer" data-expires-at="${r.expiresAt}"></div>
                </div>
            </div>
        `;
    }

    renderDots() {
        this.nav.innerHTML = Array.from({ length: this.total }, (_, i) =>
            `<div class="carousel-dot" data-index="${i}"></div>`
        ).join('');

        this.nav.querySelectorAll('.carousel-dot').forEach(dot =>
            dot.onclick = e => this.goTo(+e.target.dataset.index)
        );
    }

    update() {
        const cards = this.track.querySelectorAll('.reward-card');
        const dots = this.nav.querySelectorAll('.carousel-dot');

        cards.forEach((card, i) => {
            card.className = 'reward-card';
            const diff = i - this.currentIndex;

            if (diff === 0) card.classList.add('center');
            else if (diff === -1 || (diff === this.total - 1 && !this.currentIndex)) 
                card.classList.add('left');
            else if (diff === 1 || (diff === -(this.total - 1) && this.currentIndex === this.total - 1)) 
                card.classList.add('right');
            else card.classList.add('hidden');
        });

        dots.forEach((dot, i) => dot.classList.toggle('active', i === this.currentIndex));
    }

    goTo(index) {
        if (index < 0) index = this.total - 1;
        if (index >= this.total) index = 0;
        this.currentIndex = index;
        this.update();
    }

    next() {
        this.goTo(this.currentIndex + 1);
    }

    prev() {
        this.goTo(this.currentIndex - 1);
    }

    show() {
        this.track.style.display = 'flex';
        this.nav.style.display = 'flex';
    }

    hide() {
        this.track.style.display = 'none';
        this.nav.style.display = 'none';
    }
}

// ============================================
// CLASSE HISTORY - Gerenciamento de Histórico
// ============================================

class HistoryManager {
    constructor(listElement) {
        this.list = listElement;
    }

    render(items) {
        this.list.innerHTML = items.map(i => this.createItemHtml(i)).join('');
    }

    createItemHtml(item, isNew = false) {
        return `
            <div class="history-item ${isNew ? 'new' : ''}">
                <div class="icon"><img src="img/bau-aberto.png" class="history-chest-img"></div>
                <div class="main">
                    <div class="title">${item.title}</div>
                    <div class="meta">${item.source} - ${item.date}</div>
                </div>
                <div class="right">
                    <div class="amount">${item.amount}</div>
                    <div class="status">${item.status}</div>
                </div>
            </div>
        `;
    }

    prepend(item) {
        this.list.insertAdjacentHTML('afterbegin', this.createItemHtml(item, true));
        setTimeout(() => {
            const el = this.list.querySelector('.history-item.new');
            if (el) el.classList.remove('new');
        }, CONFIG.ANIMATION_DELAY);
    }
}

// ============================================
// CLASSE PRINCIPAL - RewardsModal
// ============================================

class RewardsModal {
    constructor() {
        this.elements = {
            overlay: Utils.getElement('rewardsModal'),
            openBtn: Utils.getElement('openModalBtn'),
            closeBtn: Utils.getElement('closeModalBtn'),
            closeXBtn: Utils.getElement('closeXBtn'),
            noRewards: Utils.getElement('noRewardsMessage'),
            track: Utils.getElement('carouselTrack'),
            nav: Utils.getElement('carouselNav'),
            modalTitle: Utils.getElement('modalTitle'),
            historyTitle: Utils.getElement('historyTitle'),
            moreHistoryLink: Utils.getElement('moreHistoryLink'),
            dontShowCheckbox: Utils.getElement('dontShowTodayCheckbox'),
            dontShowText: Utils.getElement('dontShowTodayText')
        };

        this.rewardsData = [];
        this.config = {};
        this.historyData = [];
        
        this.carousel = new Carousel(this.elements.track, this.elements.nav);
        this.history = new HistoryManager(Utils.getElement('historyList'));
        this.timerManager = new TimerManager();
        
        this.touchStart = 0;
        this.touchEnd = 0;

        this.setupEvents();
    }

    async initialize() {
        const res = await ApiService.call('get_initial_data');
        if (!res.success) {
            console.error(res.message);
            return;
        }

        this.rewardsData = res.rewards;
        this.config = res.config;
        this.historyData = res.history || [];

        this.updateUI();
        this.renderAll();

        if (this.hasActiveRewards()) {
            this.open();
        }
    }

    updateUI() {
        this.elements.modalTitle.textContent = this.config.title;
        this.elements.historyTitle.textContent = this.config.historyTitle;
        this.elements.moreHistoryLink.textContent = this.config.moreText;
        this.elements.dontShowText.textContent = this.config.dontShowText;
        this.elements.closeBtn.textContent = this.config.rewardsButtonText;
    }

    renderAll() {
        this.carousel.render(this.rewardsData, this.config);
        this.history.render(this.historyData);
        this.timerManager.start(this.rewardsData, this.elements.track);
        
        const active = this.rewardsData.filter(r => r.hasReward);
        this.elements.noRewards.style.display = active.length ? 'none' : 'flex';
    }

    hasActiveRewards() {
        return this.rewardsData.some(r => r.hasReward);
    }

    async handleOpenChest(e) {
        e.preventDefault();
        e.stopPropagation();
        
        let btn = e.target.closest('.open-chest-btn');

        if (!btn) {
            const img = e.target.closest('.chest-img.closed');
            if (!img) return;

            const card = img.closest('.reward-card');
            if (!card.classList.contains('center')) return;

            btn = card.querySelector('.open-chest-btn');
        }

        if (!btn || btn.disabled) return;

        const id = +btn.dataset.rewardId;
        const reward = this.rewardsData.find(r => r.id === id);

        btn.disabled = true;
        btn.textContent = 'RESGATANDO...';

        const res = await ApiService.call('open_chest', {
            reward_id: id,
            reward_title: reward.title,
            reward_value: reward.value,
            reward_source: reward.source
        });

        if (!res.success) {
            alert(res.message);
            btn.disabled = false;
            btn.textContent = this.config.openButtonText;
            return;
        }

        this.processRewardClaim(btn, reward, res.new_history_item);
    }

    processRewardClaim(btn, reward, historyItem) {
        reward.hasReward = false;

        const card = btn.closest('.reward-card');
        card.querySelector('.chest-wrap').classList.add('is-open');

        btn.textContent = this.config.claimedButtonText;
        btn.classList.replace('open-chest-btn', 'claimed');

        if (historyItem) {
            this.historyData.unshift(historyItem);
            this.history.prepend(historyItem);
        }

        setTimeout(() => {
            card.classList.add('removing');
            setTimeout(() => {
                card.remove();
                this.renderAll();
            }, CONFIG.ANIMATION_DELAY);
        }, CONFIG.CARD_REMOVE_DELAY);
    }

    async handleDontShow() {
        if (this.elements.dontShowCheckbox.checked) {
            await ApiService.call('dont_show_today');
        }
    }

    open() {
        this.elements.overlay.style.display = 'flex';
    }

    close() {
        this.handleDontShow();
        this.elements.overlay.style.display = 'none';
    }

    setupEvents() {
        // Botões
        this.elements.openBtn.onclick = e => {
            e.preventDefault();
            this.open();
        };
        
        this.elements.closeBtn.onclick = e => {
            e.preventDefault();
            this.close();
        };
        
        this.elements.closeXBtn.onclick = e => {
            e.preventDefault();
            this.close();
        };

        // Overlay
        this.elements.overlay.onclick = e => {
            if (e.target === this.elements.overlay) {
                e.preventDefault();
                this.close();
            }
        };

        // Abrir baú
        this.elements.track.addEventListener('click', e => this.handleOpenChest(e));

        // Swipe
        this.elements.track.addEventListener('touchstart', e => 
            this.touchStart = e.changedTouches[0].screenX
        );
        this.elements.track.addEventListener('touchend', e => {
            this.touchEnd = e.changedTouches[0].screenX;
            const dist = this.touchEnd - this.touchStart;

            if (Math.abs(dist) > CONFIG.MIN_SWIPE) {
                dist < 0 ? this.carousel.next() : this.carousel.prev();
            }
        });

        // Teclado
        document.addEventListener('keydown', e => {
            if (this.elements.overlay.style.display !== 'flex') return;
            
            if (e.key === 'ArrowLeft') this.carousel.prev();
            if (e.key === 'ArrowRight') this.carousel.next();
            if (e.key === 'Escape') this.close();
        });
    }
}

// ============================================
// INICIALIZAÇÃO
// ============================================

const modal = new RewardsModal();
modal.initialize();


e();


ize();


