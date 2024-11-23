const vmgFilesInput = document.getElementById("vmgfiles-input");
const preview = document.getElementById("preview");
const clearBtn = document.getElementById("clear-btn");
const downloadBtn = document.getElementById("download-btn");

let vmgFilesText = [];

const getFileText = async (file) => {
    vmgFilesText.push(await file.text());
};

const toDecodeURI = (text, numCharToDelete) => {
    try {
        return decodeURI(text.slice(0, -numCharToDelete));
    } catch {
        return false;
    }
};

const outputPreview = () => {
    try {
        let previewText = "[";

        for (let i = 0; i < vmgFilesText.length; i++) {
            const date = vmgFilesText[i].match(/Date:([\s\S]+)\r\nTEXT;/)[1];
            const cell = vmgFilesText[i].match(/CELL:([\s\S]+)\r\nX-ANNI/)[1];
            const textEncoded = vmgFilesText[i].match(/QUOTED-PRINTABLE:([\s\S]+)END:VBODY/)[1];
            const textBeforeDecoded = textEncoded.replaceAll("=\r\n", "").replaceAll("%", "=25").replaceAll("=", "%");

            let textDecoded = "";

            for (let j = 2; j <= textBeforeDecoded.length; j++) {
                if (toDecodeURI(textBeforeDecoded, j)) {
                    textDecoded = toDecodeURI(textBeforeDecoded, j);
                    if (j > 2) textDecoded += textBeforeDecoded.slice(-j, -2);
                    break;
                }
            }
            textDecoded = textDecoded.replaceAll("\\", "\\\\").replaceAll("\"", "\\\"").replaceAll("\r", "\\r").replaceAll("\n", "\\n");
            if (i != 0) previewText += `,\n`;
            previewText += `{"date": "${date}", "cell": "${cell}", "body": "${textDecoded}"}`;
        }
        previewText += "]";
        downloadBtn.disabled = false;
        return previewText;
    } catch {
        return "Can't convert the file(s).";
    }
};

const toJSON = (blobData, filename) => {
    const blob = new Blob([blobData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
};

vmgFilesInput.value = null;
downloadBtn.disabled = true;
vmgFilesInput.oninput = async () => {
    const vmgFiles = vmgFilesInput.files;

    for (let i = 0; i < vmgFiles.length; i++) {
        await getFileText(vmgFiles[i]);
    }
    preview.innerText = outputPreview();
}
clearBtn.addEventListener("click", () => {
    vmgFilesInput.value = null;
    vmgFilesText = [];
    downloadBtn.disabled = true;
    preview.innerText = "Preview of the JSON file will be here.";
});
downloadBtn.addEventListener("click", () => {
    const blobData = preview.innerText;
    
    toJSON(blobData, "sms.json");
});