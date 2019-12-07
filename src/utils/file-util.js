const { remote } = window.require("electron");
var fs = window.require("fs");

const fileUtils = {
  async openAudioFiles() {
    const files = await remote.dialog.showOpenDialog({
      title: "Open Files",
      properties: ["openFile", "multiSelections"],
      filters: [
        { name: "Audio Files", extensions: ["mp3"] },
        { name: "All Files", extensions: ["*"] }
      ]
    });

    if (!files || files.canceled || files.filePaths === 0) {
      return [];
    }
    return files.filePaths;
  },
  async savePlaylist(content) {
    let options = {
      title: "Save playlist",
      defaultPath: content.name ? content.name : "New playlist",
      buttonLabel: "Save",
      filters: [{ name: "json", extensions: ["json"] }]
    };

    return await remote.dialog.showSaveDialog(options).then(result => {
      if (!result.canceled) {
        const fileName = result.filePath
          .split("\\")
          .pop()
          .split("/")
          .pop()
          .split(".")[0];

        let previousName = content.name !== fileName ? content.name : "";

        if (content.name === "" || previousName !== "") {
          content.name = fileName;
        }

        fs.writeFileSync(result.filePath, JSON.stringify(content), "utf-8");
        content.previousName = previousName;
        return content;
      } else {
        return { name: "", urls: [] };
      }
    });
  },
  async loadPlaylists() {
    const result = await remote.dialog
      .showOpenDialog({
        title: "Open Playlist",
        properties: ["openFile", "multiSelections"],
        filters: [
          { name: "json", extensions: ["json"] },
          { name: "All Files", extensions: ["*"] }
        ]
      })
      .then(files => {
        if (!files || files.canceled || files.filePaths === 0) {
          return { name: "", urls: [] };
        }
        return files;
      })
      .then(files => {
        if (files.filePaths === undefined) {
          return [];
        }
        return files.filePaths.map(filePath => {
          return JSON.parse(fs.readFileSync(filePath));
        });
      });
    return result ? result : [{ name: "", urls: [] }];
  }
};

export default fileUtils;
