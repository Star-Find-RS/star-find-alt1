import * as a1lib from "alt1";
import "./index.html";
import "./appconfig.json";
import "./css/style.css";
import "./icon.png";
import Papa from "papaparse";
import isEqual from "lodash/isEqual";

const SHEET_CSV_URL =
    "https://docs.google.com/spreadsheets/d/1ctBuqO42ZYYheuEIsbJO1NFPAJsoMrJv9oWxyhsBH9g/export?format=csv&gid=1852026355";

const output = document.getElementById("output") as HTMLElement;
let previousData: Record<string, string>[] | null = null;
let currentSortKey: string | null = null;
let sortDirection: "asc" | "desc" = "asc";

async function fetchAndDisplaySheet() {
    try {
        const response = await fetch(SHEET_CSV_URL);
        if (!response.ok) {
            throw new Error("Failed to fetch the Google Sheet.");
        }
        const csvText = await response.text();

        const parsedData = Papa.parse(csvText, {
            header: true,
            skipEmptyLines: true,
        });

        const data = parsedData.data as Record<string, string>[];

        if (!isEqual(data, previousData)) {
            previousData = data;
            displayTable(data);
        }
    } catch (error) {
        console.error("Error fetching or parsing Google Sheet:", error);
        output.innerHTML = "<p>Error loading data. Please try again later.</p>";
    }
}

function displayTable(data: Record<string, string>[]) {
    if (!data.length) {
        output.innerHTML = "<p>No data available.</p>";
        return;
    }

    if (currentSortKey) {
        data.sort((a, b) => {
            const aValue = (a[currentSortKey] || "").toLowerCase().trim();
            const bValue = (b[currentSortKey] || "").toLowerCase().trim();

            if (currentSortKey === "Size") {
                const sizeOrder = ["", "tub", "s1", "s2", "s3", "s4", "s5", "s6", "s7", "s8", "s9", "s10"];
                return (sizeOrder.indexOf(aValue) - sizeOrder.indexOf(bValue)) * (sortDirection === "asc" ? 1 : -1);
            }

            if (currentSortKey === "Size Range") {
                const rangeOrder = ["", "small", "med", "big", "very big"];
                return (rangeOrder.indexOf(aValue) - rangeOrder.indexOf(bValue)) * (sortDirection === "asc" ? 1 : -1);
            }

            if (currentSortKey === "World") {
                const aWorld = parseInt(aValue) || 0;
                const bWorld = parseInt(bValue) || 0;
                return (aWorld - bWorld) * (sortDirection === "asc" ? 1 : -1);
            }

            return aValue.localeCompare(bValue) * (sortDirection === "asc" ? 1 : -1);
        });
    }

    const table = document.createElement("table");

    const headers = Object.keys(data[0]);
    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");
    headerRow.classList.add("header");

    headers.forEach((header) => {
        if (header !== "F2P") {
            const th = document.createElement("th");
            th.textContent = header;
            th.style.cursor = "pointer";
            th.addEventListener("click", () => {
                if (currentSortKey === header) {
                    sortDirection = sortDirection === "asc" ? "desc" : "asc";
                } else {
                    currentSortKey = header;
                    sortDirection = "asc";
                }
                displayTable(data);
            });
            headerRow.appendChild(th);
        }
    });

    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");
    data.forEach((row) => {
        const tr = document.createElement("tr");

        headers.forEach((header) => {
            if (header !== "F2P") {
                const td = document.createElement("td");

                if (header === "World") {
                    td.textContent = row[header] || "";

                    const icon = document.createElement("img");
                    icon.classList.add("icon-size");

                    if (row["F2P"] && row["F2P"].toUpperCase() === "TRUE") {
                        icon.src = "https://runescape.wiki/images/F2P_icon.png";
                    } else {
                        icon.src = "https://runescape.wiki/images/P2P_icon.png";
                    }

                    td.prepend(icon);
                } else {
                    td.textContent = row[header] || "";
                }

                tr.appendChild(td);
            }
        });

        tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    output.innerHTML = "";
    output.appendChild(table);
}

fetchAndDisplaySheet();
setInterval(fetchAndDisplaySheet, 30000);

if (window.alt1) {
    alt1.identifyAppUrl("./appconfig.json");
} else {
    let addappurl = `alt1://addapp/${new URL("./appconfig.json", document.location.href).href}`;
    let newEle = `<li>Alt1 not detected, click <a href='${addappurl}'>here</a> to add this app to Alt1</li>`;
    let alt1warning = document.getElementById("alt1warning") as HTMLElement;
    alt1warning.insertAdjacentHTML("beforeend", newEle);
}
