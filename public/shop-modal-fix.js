(() => {
  if (!window.careerBalanceV3 || !window.ui) {
    console.warn('[shop-modal-fix] Career shop is not ready.');
    return;
  }

  const originalBuy = window.careerBalanceV3.buy.bind(window.careerBalanceV3);
  let openingSecondaryModal = false;

  window.careerBalanceV3.buy = (action) => {
    // Ordinary career-shop services already apply immediately. The one-use
    // cheat needs a second modal, so close the shop first instead of trying
    // to replace an active modal in-place.
    if (action !== 'cheat') return originalBuy(action);
    if (state?.flags?.careerCheatUsed || openingSecondaryModal) return;

    openingSecondaryModal = true;
    ui.closeModal();
    setTimeout(() => {
      try {
        originalBuy('cheat');
      } finally {
        openingSecondaryModal = false;
      }
    }, 90);
  };

  console.info('[shop-modal-fix] Shop purchases now activate without manually leaving the shop.');
})();
