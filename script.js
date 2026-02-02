const TYPE_OPTIONS = [
  "Tag Missing",
  "Double Tag",
  "Tag Damage",
  "Invalid Tag",
  "Tag Wrong"
];

let tableBody;
let html5QrCode = null;
let scannerActive = false;
let activeInput = null;

document.addEventListener("DOMContentLoaded", () => {
  tableBody = document.getElementById("dataBody");
  addRow();
});

/* ---------- ROW ---------- */
function addRow() {
  const tr = document.createElement("tr");

  const tdId = document.createElement("td");
  const idInput = document.createElement("input");
  idInput.placeholder = "Scan / Enter";
  tdId.appendChild(idInput);

  const scanBtn = document.createElement("button");
  scanBtn.textContent = "📷";
  scanBtn.type = "button";
  scanBtn.onclick = () => startScan(idInput);
  tdId.appendChild(scanBtn);

  const tdType = document.createElement("td");
  const typeSel = document.createElement("select");
  typeSel.innerHTML = `<option value="">Select</option>` +
    TYPE_OPTIONS.map(v => `<option>${v}</option>`).join("");
  tdType.appendChild(typeSel);

  const tdCount = document.createElement("td");
  const countInput = document.createElement("input");
  countInput.type = "number";
  countInput.min = "0";
  tdCount.appendChild(countInput);

  tr.append(tdId, tdType, tdCount);
  tableBody.appendChild(tr);

  [idInput, typeSel, countInput].forEach(el => {
    el.addEventListener("focus", () => setActiveRow(tr));
  });

  typeSel.addEventListener("change", () => countInput.focus());

  countInput.addEventListener("change", () => {
    if (idInput.value && typeSel.value && countInput.value) {
      if (tr === tableBody.lastElementChild) {
        addRow();
        tableBody.lastElementChild.querySelector("input").focus();
      }
    }
  });
}

/* ---------- ACTIVE ROW ---------- */
function setActiveRow(row) {
  document.querySelectorAll("tr").forEach(r => r.classList.remove("active-row"));
  row.classList.add("active-row");
}

/* ---------- SCANNER ---------- */
async function startScan(input) {
  if (scannerActive) return;

  scannerActive = true;
  activeInput = input;
  document.body.style.overflow = "hidden";
  document.getElementById("scannerWrap").style.display = "block";

  html5QrCode = new Html5Qrcode("qr-reader");
  await html5QrCode.start(
    { facingMode: "environment" },
    { fps: 10, qrbox: 250 },
    decoded => {
      activeInput.value = decoded.trim();
      stopScan();
      activeInput.closest("tr").querySelector("select").focus();
    }
  );
}

async function stopScan() {
  if (html5QrCode) {
    await html5QrCode.stop();
    html5QrCode.clear();
  }
  html5QrCode = null;
  scannerActive = false;
  document.body.style.overflow = "";
  document.getElementById("scannerWrap").style.display = "none";
}

/* ---------- EXCEL ---------- */
function downloadExcel() {
  const data = [];
  const ts = new Date().toLocaleString();

  document.querySelectorAll("#dataBody tr").forEach(r => {
    const inputs = r.querySelectorAll("input, select");
    if (inputs[0].value && inputs[1].value && inputs[2].value) {
      data.push({
        "Container ID": inputs[0].value,
        "Type": inputs[1].value,
        "Count": inputs[2].value,
        "Entry Date": ts
      });
    }
  });

  if (!data.length) return alert("No data");

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Data");
  XLSX.writeFile(wb, "Container_Tag_Data.xlsx");
}
