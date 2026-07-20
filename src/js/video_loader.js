document.addEventListener("DOMContentLoaded", () => {
    const videoOptions = [
        {src: "img/prev_video/line_geo.mp4", type: "video/mp4", poster: "img/prev_video/black.webp"},
        {src: "img/prev_video/tv.mp4", type: "video/mp4", poster: "img/prev_video/black.webp"},
        {src: "img/prev_video/glosses.mp4", type: "video/mp4", poster: "img/prev_video/black.webp"},
        {src: "img/prev_video/circle.mp4", type: "video/mp4", poster: "img/prev_video/black.webp"},
        {src: "img/prev_video/rays.mp4", type: "video/mp4", poster: "img/prev_video/rays.webp"},
        {src: "img/prev_video/circle_fire.mp4", type: "video/mp4", poster: "img/prev_video/black.webp"},
        {src: "img/prev_video/comet.mp4", type: "video/mp4", poster: "img/prev_video/comet.webp"}
    ];

    const previewSection = document.getElementById("preview");
    if (!previewSection) return;

    // выбрать случайный ролик, отличный от текущего, чтобы не повторять один и тот же подряд
    function pickNextIndex(excludeIndex) {
        if (videoOptions.length <= 1) return 0;
        let index;
        do {
            index = Math.floor(Math.random() * videoOptions.length);
        } while (index === excludeIndex);
        return index;
    }

    const videoElement = document.createElement("video");
    videoElement.autoplay = true;
    videoElement.muted = true;
    videoElement.playsInline = true;
    videoElement.preload = "auto";
    videoElement.classList.add("preview__video");

    const sourceElement = document.createElement("source");
    videoElement.appendChild(sourceElement);
    previewSection.insertBefore(videoElement, previewSection.firstChild);

    let currentIndex = Math.floor(Math.random() * videoOptions.length);

    function playVideo(index) {
        const option = videoOptions[index];
        videoElement.poster = option.poster;
        sourceElement.src = option.src;
        sourceElement.type = option.type;
        videoElement.load();
        videoElement.play().catch(() => {});
    }

    // по завершении ролика переключиться на другой случайный, а не зациклить текущий
    videoElement.addEventListener("ended", () => {
        currentIndex = pickNextIndex(currentIndex);
        playVideo(currentIndex);
    });
    videoElement.addEventListener("error", () => {
        currentIndex = pickNextIndex(currentIndex);
        playVideo(currentIndex);
    });

    playVideo(currentIndex);
});
