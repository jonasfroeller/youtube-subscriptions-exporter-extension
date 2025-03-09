function setupExportButton(buttonId, format) {
  document.getElementById(buttonId).addEventListener("click", async () => {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (
      !tab.url?.includes("youtube.com/feed/subscriptions") &&
      !tab.url?.includes("youtube.com/feed/channels")
    ) {
      alert(
        "Please navigate to your YouTube subscriptions or channels page first!"
      );
      return;
    }

    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: exportSubscriptions,
      args: [format],
    });
  });
}

setupExportButton("exportJsonBtn", "json");
setupExportButton("exportCsvBtn", "csv");
setupExportButton("exportTsvBtn", "tsv");

function exportSubscriptions(format) {
  const channels = Array.from(document.querySelectorAll("ytd-channel-renderer"))
    .map((channel) => {
      const name =
        channel
          .querySelector("ytd-channel-name yt-formatted-string#text")
          ?.textContent?.trim() || "";
      const url =
        channel.querySelector("#info-section a#main-link")?.href || "";
      return { name, url };
    })
    .filter((channel) => channel.name && channel.url);

  if (channels.length === 0) {
    alert("No subscriptions found. Please scroll down to load more channels.");
    return;
  }

  let content, filename, type;

  switch (format) {
    case "csv":
      content = channels
        .map((channel) => {
          const escapedName = channel.name.includes(",")
            ? `"${channel.name}"`
            : channel.name;
          return `${escapedName},${channel.url}`;
        })
        .join("\n");
      filename = "youtube-subscriptions.csv";
      type = "text/csv";
      break;

    case "tsv":
      content = channels
        .map((channel) => `${channel.name}\t${channel.url}`)
        .join("\n");
      filename = "youtube-subscriptions.tsv";
      type = "text/tab-separated-values";
      break;

    default:
      content = JSON.stringify(channels, null, 2);
      filename = "youtube-subscriptions.json";
      type = "application/json";
  }

  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
