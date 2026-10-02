import { createAsciiFluid } from "./ascii_fluid";

const SPLINE_VIEWER_SRC = "https://cdn.spline.design/@splinetool/viewer@2.0.66/build/spline-viewer.js";
const SPLINE_SCENE_URL = "https://prod.spline.design/W5XyDudURo5bvUxl/scene.splinecode";
const HERO_READY_TIMEOUT_MS = 10000;

const VIDEOS = [
    {src: "img/prev_video/circle.mp4", poster: "img/prev_video/black.webp"},
    {src: "img/prev_video/circle_fire.mp4", poster: "img/prev_video/black.webp"},
    {src: "img/prev_video/comet.mp4", poster: "img/prev_video/comet.webp"}
];

let resolveHeroReady;
// прелоадер ждёт этот промис, чтобы первый экран (в т.ч. робот) появился уже готовым
export const heroReady = new Promise((resolve) => { resolveHeroReady = resolve; });

// робот и флюид реагируют на курсор и тяжёлые для телефонов, поэтому там только видео
function startDesktopHero(previewSection) {
    // флюид создаём раньше робота: робот вставляется перед ним в DOM, и флюид ложится поверх
    const ascii = createAsciiFluid(previewSection);

    const script = document.createElement("script");
    script.type = "module";
    script.src = SPLINE_VIEWER_SRC;
    document.head.appendChild(script);

    const viewer = document.createElement("spline-viewer");
    viewer.classList.add("preview__video", "preview__video_robot");
    viewer.setAttribute("url", SPLINE_SCENE_URL);
    // выгружать сцену, пока она вне экрана, чтобы не тратить GPU/CPU
    viewer.setAttribute("unloadable", "");
    viewer.setAttribute("aria-hidden", "true");
    viewer.addEventListener("load-complete", resolveHeroReady, {once: true});
    viewer.addEventListener("splineerror", resolveHeroReady, {once: true});
    setTimeout(resolveHeroReady, HERO_READY_TIMEOUT_MS);
    previewSection.insertBefore(viewer, previewSection.firstChild);

    ascii.start();
}

function startMobileHero(previewSection) {
    const video = document.createElement("video");
    video.autoplay = true;
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    video.classList.add("preview__video");

    const source = document.createElement("source");
    source.type = "video/mp4";
    video.appendChild(source);
    previewSection.insertBefore(video, previewSection.firstChild);

    // выбрать случайный ролик, отличный от текущего, чтобы не повторять один и тот же подряд
    function pickNextIndex(excludeIndex) {
        let index;
        do {
            index = Math.floor(Math.random() * VIDEOS.length);
        } while (index === excludeIndex);
        return index;
    }

    let currentIndex = Math.floor(Math.random() * VIDEOS.length);

    function play(index) {
        video.poster = VIDEOS[index].poster;
        source.src = VIDEOS[index].src;
        video.load();
        video.play().catch(() => {});
    }

    function playNext() {
        currentIndex = pickNextIndex(currentIndex);
        play(currentIndex);
    }

    video.addEventListener("ended", playNext);
    video.addEventListener("error", playNext);

    play(currentIndex);
    resolveHeroReady();
}

document.addEventListener("DOMContentLoaded", () => {
    const previewSection = document.getElementById("preview");
    if (!previewSection) {
        resolveHeroReady();
        return;
    }

    const isDesktop = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (isDesktop) {
        startDesktopHero(previewSection);
    } else {
        startMobileHero(previewSection);
    }
});
