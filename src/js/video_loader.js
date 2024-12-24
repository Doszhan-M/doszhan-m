document.addEventListener("DOMContentLoaded", () => {
    const videoOptions = [
        {src: "img/prev_video/line_geo.mp4", type: "video/mp4", poster: "img/prev_video/black.png"},
        {src: "img/prev_video/tv.mp4", type: "video/mp4", poster: "img/prev_video/black.png"},
        {src: "img/prev_video/glosses.mp4", type: "video/mp4", poster: "img/prev_video/black.png"},
        {src: "img/prev_video/circle.mp4", type: "video/mp4", poster: "img/prev_video/black.png"},
        {src: "img/prev_video/rays.mp4", type: "video/mp4", poster: "img/prev_video/rays.png"},
        {src: "img/prev_video/circle_fire.mp4", type: "video/mp4", poster: "img/prev_video/black.png"},
        {src: "img/prev_video/comet.mp4", type: "video/mp4", poster: "img/prev_video/comet.png"}
    ];

    const randomIndex = Math.floor(Math.random() * videoOptions.length);
    const selectedVideo = videoOptions[randomIndex];
    console.info("selectedVideo", selectedVideo.src);

    if (!selectedVideo?.src) {
        console.error("Video path not found!");
        return;
    }
    const videoElement = document.createElement("video");
    videoElement.autoplay = true;
    videoElement.muted = true;
    videoElement.loop = true;
    videoElement.preload = "auto";
    videoElement.poster = selectedVideo.poster;
    videoElement.classList.add("preview__video");

    const sourceElement = document.createElement("source");
    sourceElement.src = selectedVideo.src;
    sourceElement.type = selectedVideo.type;
    videoElement.appendChild(sourceElement);

    const previewSection = document.getElementById("preview");
    previewSection.insertBefore(videoElement, previewSection.firstChild);
});
