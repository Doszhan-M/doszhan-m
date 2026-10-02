import { createAsciiFluid } from "./ascii_fluid";

document.addEventListener("DOMContentLoaded", () => {
    const SPLINE_VIEWER_SRC = "https://cdn.spline.design/@splinetool/viewer@2.0.66/build/spline-viewer.js";
    const SPLINE_SCENE_URL = "https://prod.spline.design/W5XyDudURo5bvUxl/scene.splinecode";
    // слежение за курсором не работает на тач-устройствах, поэтому робота там не показываем
    const canHover = window.matchMedia("(hover: hover)").matches;

    const options = [
        {kind: "ascii"},
        {kind: "video", src: "img/prev_video/circle.mp4", type: "video/mp4", poster: "img/prev_video/black.webp"},
        {kind: "video", src: "img/prev_video/circle_fire.mp4", type: "video/mp4", poster: "img/prev_video/black.webp"},
        {kind: "video", src: "img/prev_video/comet.mp4", type: "video/mp4", poster: "img/prev_video/comet.webp"}
    ];
    if (canHover) options.push({kind: "spline"});

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

    let splineViewer = null;

    function showSpline() {
        if (!splineViewer) {
            if (!customElements.get("spline-viewer") && !document.querySelector("script[data-spline-viewer]")) {
                const script = document.createElement("script");
                script.type = "module";
                script.src = SPLINE_VIEWER_SRC;
                script.dataset.splineViewer = "";
                document.head.appendChild(script);
            }
            splineViewer = document.createElement("spline-viewer");
            splineViewer.classList.add("preview__video", "preview__video_robot");
            splineViewer.setAttribute("url", SPLINE_SCENE_URL);
            splineViewer.setAttribute("aria-hidden", "true");
            previewSection.insertBefore(splineViewer, previewSection.firstChild);
        }
        splineViewer.style.display = "block";
    }

    function hideSpline() {
        if (splineViewer) splineViewer.style.display = "none";
    }

    let currentIndex = Math.floor(Math.random() * options.length);

    function playOption(index) {
        const option = options[index];
        if (option.kind === "ascii") {
            videoElement.pause();
            videoElement.style.display = "none";
            hideSpline();
            ascii.show();
            return;
        }

        if (option.kind === "spline") {
            videoElement.pause();
            videoElement.style.display = "none";
            ascii.hide();
            showSpline();
            return;
        }

        ascii.hide();
        hideSpline();
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
