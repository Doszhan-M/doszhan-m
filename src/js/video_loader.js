import { createAsciiFluid } from "./ascii_fluid";

document.addEventListener("DOMContentLoaded", () => {
    const ASCII_DURATION_MS = 20000;

    const options = [
        {kind: "ascii"},
        {kind: "video", src: "img/prev_video/circle.mp4", type: "video/mp4", poster: "img/prev_video/black.webp"},
        {kind: "video", src: "img/prev_video/circle_fire.mp4", type: "video/mp4", poster: "img/prev_video/black.webp"},
        {kind: "video", src: "img/prev_video/comet.mp4", type: "video/mp4", poster: "img/prev_video/comet.webp"}
    ];

    const previewSection = document.getElementById("preview");
    if (!previewSection) return;

    // выбрать случайный вариант, отличный от текущего, чтобы не повторять один и тот же подряд
    function pickNextIndex(excludeIndex) {
        if (options.length <= 1) return 0;
        let index;
        do {
            index = Math.floor(Math.random() * options.length);
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

    const ascii = createAsciiFluid(previewSection);

    let currentIndex = Math.floor(Math.random() * options.length);
    let asciiTimer = null;

    function playOption(index) {
        const option = options[index];
        clearTimeout(asciiTimer);

        if (option.kind === "ascii") {
            videoElement.pause();
            videoElement.style.display = "none";
            ascii.show();
            asciiTimer = setTimeout(playNext, ASCII_DURATION_MS);
            return;
        }

        ascii.hide();
        videoElement.style.display = "";
        videoElement.poster = option.poster;
        sourceElement.src = option.src;
        sourceElement.type = option.type;
        videoElement.load();
        videoElement.play().catch(() => {});
    }

    function playNext() {
        currentIndex = pickNextIndex(currentIndex);
        playOption(currentIndex);
    }

    // по завершении ролика переключиться на другой случайный вариант, а не зациклить текущий
    videoElement.addEventListener("ended", playNext);
    videoElement.addEventListener("error", playNext);

    playOption(currentIndex);
});
