const TYPE_OPTIONS = [
  "Tag Missing",
  "Double Tag",
  "Tag Damage",
  "Invalid Tag",
  "Tag Wrong"
];

let tableBody;
let activeRow = null;
let html5QrCode = null;
let scannerActive = false;

/* ---------- INIT ---------- */
document.addEventListener("DOMContentLoaded", () => {
  tableBody = document.getElementById("dataBody");
  addRow();
});

/* ---------- ADD ROW ---------- */
function addRow() {
  const tr = document.createElement("tr");

  const tdId = document.createElement("td");
  const idInput = document.createElement("input");
  idInput.placeholder = "Enter or Scan";
  tdId.appendChild(idInput);

  const tdType = document.createElement("td");
  const typeSelect = document.createElement("select");
  typeSelect.innerHTML =
    `<option value="">Select</option>` +
    TYPE_OPTIONS.map(v => `<option value="${v}">${v}</option>`).join("");
  tdType.appendChild(typeSelect);

  const tdCount = document.createElement("td");
  const countInput = document.createElement("input");
  countInput.type = "number";
  countInput.min = "0";
  tdCount.appendChild(countInput);

  tr.append(tdId, tdType, tdCount);
  tableBody.appendChild(tr);

  [idInput, typeSelect, countInput].forEach(el => {
    el.addEventListener("focus", () => setActiveRow(tr));
  });

  typeSelect.addEventListener("change", () => {
    if (typeSelect.value) countInput.focus();
  });

  countInput.addEventListener("change", () => {
    if (idInput.value && typeSelect.value && countInput.value) {
      if (tr === tableBody.lastElementChild) {
        addRow();
        tableBody.lastElementChild.querySelector("input").focus();
      }
    }
  });
}

/* ---------- ACTIVE ROW ---------- */
function setActiveRow(row) {
  document.querySelectorAll("#dataBody tr").forEach(r =>
    r.classList.remove("active-row")
  );
  row.classList.add("active-row");
  activeRow = row;
}

/* ---------- SCANNER ---------- */
async function startScan() {
  if (scannerActive) {
    alert("Scanner already open");
    return;
  }

  if (!activeRow) {
    alert("Please select a row first");
    return;
  }

  scannerActive = true;
  document.body.style.overflow = "hidden";
  document.getElementById("scannerWrap").style.display = "block";

  html5QrCode = new Html5Qrcode("qr-reader");

  try {
    await html5QrCode.start(
      { facingMode: "environment" },
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        experimentalFeatures: {
          useBarCodeDetectorIfSupported: true
        }
      },
      decodedText => {
        activeRow.querySelector("input").value = decodedText.trim();
        stopScan();
        activeRow.querySelector("select").focus();
      }
    );
  } catch (err) {
    alert("Camera could not start");
    stopScan();
  }
}

async function stopScan() {
  if (html5QrCode) {
    try {
      await html5QrCode.stop();
      html5QrCode.clear();
    } catch {}
  }
  html5QrCode = null;
  scannerActive = false;
  document.body.style.overflow = "";
  document.getElementById("scannerWrap").style.display = "none";
}

/* ---------- DOWNLOAD EXCEL ---------- */
function downloadExcel() {
  const rows = [];
  const timestamp = new Date().toLocaleString();

  document.querySelectorAll("#dataBody tr").forEach(tr => {
    const inputs = tr.querySelectorAll("input, select");
    if (inputs[0].value && inputs[1].value && inputs[2].value) {
      rows.push({
        "Container ID": inputs[0].value,
        "Type": inputs[1].value,
        "Count": inputs[2].value,
        "Entry Date": timestamp
      });
    }
  });

  if (!rows.length) {
    alert("No data to download");
    return;
  }

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Data");
  XLSX.writeFile(wb, "Container_Tag_Data.xlsx");
}
