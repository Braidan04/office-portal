
const onlineApps = {
    word: "https://word.cloud.microsoft/",
    excel: "https://excel.cloud.microsoft/",
    powerpoint: "https://powerpoint.cloud.microsoft/"
};

document.querySelectorAll("[data-app]").forEach(button => {
    button.addEventListener("click", event => {
        event.preventDefault();

        const app = button.dataset.app;

        const online = window.confirm(
            "Are you connected to the internet?\n\n" +
            "OK = Yes, open Microsoft online.\n" +
            "Cancel = No, open the offline editor."
        );

        if (online) {
            window.open(
                onlineApps[app],
                "_blank",
                "noopener,noreferrer"
            );
        } else {
            window.location.href =
                "./offline-editor.html?app=" + encodeURIComponent(app);
        }
    });
});
