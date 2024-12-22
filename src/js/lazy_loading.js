function lazyLoad() {
    const hash = window.location.hash; // достать хеш в url
    const popupWindow = document.querySelector(`${hash}`); // найти секцию по хешу

    if (!popupWindow) return; // Защита от некорректных хешей

    let imgInSlaider = popupWindow.querySelectorAll('.slaider__img'); // поиск внутри секции

    imgInSlaider.forEach(img => {
        // Проверить, загружено ли изображение
        if (!img.src || img.src.includes('plug.jpg')) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
        }
    });
}

export function lazyLoading() {
    window.addEventListener('hashchange', () => { // событие на изменение хеша в url
        lazyLoad();
    });

    // Вызов для начальной загрузки, если хеш уже установлен
    if (window.location.hash) {
        lazyLoad();
    }
}
