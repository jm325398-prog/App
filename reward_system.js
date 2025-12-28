/**
 * RECOMPENSAS E CONFIGURAÇÃO - VERSÃO JAVASCRIPT (COMPATÍVEL COM REWARDS.JS)
 * Este código substitui o 'api.php' e centraliza os caminhos das imagens em variáveis.
 */

// ============================================
// CONFIGURAÇÃO DE IMAGENS
// ============================================
const IMG_PATHS = {
    CHEST_CLOSED: 'img/bau1.png',
    CHEST_OPEN: 'img/bau-aberto.png',
    HISTORY_ICON: 'img/bau-aberto.png' // Ícone usado no histórico
};

// ===== CONFIGURAÇÃO DAS RECOMPENSAS =====
let rewards = [
    {
        id: 1,
        title: 'Taxa de Rebate',
        value: 'R$ 0,01',
        source: 'Cashback do jogo',
        chestClosedImg: IMG_PATHS.CHEST_CLOSED,
        chestOpenImg: IMG_PATHS.CHEST_OPEN,
        hasReward: true,
        expiresAt: Math.floor(Date.now() / 1000) + (24 * 3600) + (12 * 3600) + (34 * 60)
    },
    {
        id: 2,
        title: 'Bônus Diário',
        value: 'R$ 0,05',
        source: 'Login diário',
        chestClosedImg: IMG_PATHS.CHEST_CLOSED,
        chestOpenImg: IMG_PATHS.CHEST_OPEN,
        hasReward: true,
        expiresAt: Math.floor(Date.now() / 1000) + (2 * 3600) + (15 * 60)
    }
];

// ===== HISTÓRICO DE RECOMPENSAS =====
let history = [
    {
        title: 'Chove envelopes',
        date: '28/11/2025 00:20',
        source: 'Recompensa de evento',
        amount: 'R$ 0,10',
        status: 'Resgatado'
    }
];

// ===== CONFIGURAÇÕES DO MODAL =====
const modalConfig = {
    title: 'Bonus Diário',
    historyTitle: 'Histórico',
    moreText: 'Bonus',
    openButtonText: 'ABRIR',
    claimedButtonText: 'RESGATADO',
    noRewardText: 'SEM PRÊMIO',
    dontShowText: 'Não mostrar novamente hoje',
    rewardsButtonText: 'Recompensas'
};

/**
 * Função para formatar a data atual no padrão d/m/Y H:i
 */
function getCurrentFormattedDate() {
    const now = new Date();
    const d = String(now.getDate()).padStart(2, '0');
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const y = now.getFullYear();
    const h = String(now.getHours()).padStart(2, '0');
    const i = String(now.getMinutes()).padStart(2, '0');
    return `${d}/${m}/${y} ${h}:${i}`;
}

/**
 * SIMULADOR DE API
 */
function handleApiRequest(action, params = {}) {
    switch (action) {
        case 'get_initial_data':
            return {
                success: true,
                rewards: rewards,
                history: history,
                config: modalConfig
            };

        case 'dont_show_today':
            return { success: true };

        case 'open_chest':
            const rewardId = parseInt(params.reward_id);
            const reward = rewards.find(r => r.id === rewardId);

            if (reward && reward.hasReward) {
                reward.hasReward = false;
                
                const newHistoryItem = {
                    title: params.reward_title || reward.title,
                    date: getCurrentFormattedDate(),
                    source: params.reward_source || reward.source,
                    amount: params.reward_value || reward.value,
                    status: 'Resgatado'
                };

                history.unshift(newHistoryItem);

                return {
                    success: true,
                    reward_id: rewardId,
                    new_history_item: newHistoryItem
                };
            }
            return { success: false, message: 'Recompensa não encontrada ou já resgatada.' };

        case 'get_history':
            return { success: true, history: history };

        default:
            return { success: false, message: 'Ação inválida.' };
    }
}

// Exportação para Node.js
if (typeof module !== 'undefined') {
    module.exports = {
        handleApiRequest,
        rewards,
        history,
        modalConfig,
        IMG_PATHS
    };
}
tend (sem PHP), 
 * você pode sobrescrever o ApiService.call no seu rewards.js ou antes dele carregar.
 */
if (typeof window !== 'undefined') {
    // Sobrescreve a chamada da API para usar a lógica local em vez de buscar o PHP
    // Isso é útil para testes ou se você quiser mover a lógica para o cliente.
    /*
    window.ApiService = {
        call: async (action, data = {}) => {
            // Simula um pequeno atraso de rede
            await new Promise(resolve => setTimeout(resolve, 300));
            return handleApiRequest(action, data);
        }
    };
    */
}

// Exportação para Node.js
if (typeof module !== 'undefined') {
    module.exports = {
        handleApiRequest,
        rewards,
        history,
        modalConfig
    };
}
